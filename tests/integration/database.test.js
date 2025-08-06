/**
 * Integration Tests for Database Persistence
 * Tests that data persists correctly between operations and server restarts
 */

const request = require('supertest');
const { app } = require('../../src/app');
const { setupIntegrationTests, teardownIntegrationTests, resetDatabase, seedTestData } = require('./setup');
const dbInit = require('../../src/database/init');
const treeQueries = require('../../src/database/queries');

describe('Database Persistence Integration Tests', () => {
    let server;

    beforeAll(async () => {
        server = await setupIntegrationTests();
    });

    afterAll(async () => {
        await teardownIntegrationTests();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    describe('Data Persistence', () => {
        test('should persist data between API calls', async () => {
            // Create a root node
            const createResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'persistent-root', parentId: null })
                .expect(201);

            const rootId = createResponse.body.id;

            // Create a child node
            await request(app)
                .post('/api/tree')
                .send({ label: 'persistent-child', parentId: rootId })
                .expect(201);

            // Verify data persists in subsequent calls
            const getResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(getResponse.body).toHaveLength(1);
            expect(getResponse.body[0].label).toBe('persistent-root');
            expect(getResponse.body[0].children).toHaveLength(1);
            expect(getResponse.body[0].children[0].label).toBe('persistent-child');
        });

        test('should maintain referential integrity', async () => {
            // Create complex tree structure
            const root = await request(app)
                .post('/api/tree')
                .send({ label: 'root', parentId: null })
                .expect(201);

            const child1 = await request(app)
                .post('/api/tree')
                .send({ label: 'child1', parentId: root.body.id })
                .expect(201);

            const child2 = await request(app)
                .post('/api/tree')
                .send({ label: 'child2', parentId: root.body.id })
                .expect(201);

            const grandchild = await request(app)
                .post('/api/tree')
                .send({ label: 'grandchild', parentId: child1.body.id })
                .expect(201);

            // Verify referential integrity through API
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            const tree = response.body[0];
            expect(tree.children).toHaveLength(2);
            
            const child1Node = tree.children.find(c => c.label === 'child1');
            expect(child1Node.children).toHaveLength(1);
            expect(child1Node.children[0].label).toBe('grandchild');

            const child2Node = tree.children.find(c => c.label === 'child2');
            expect(child2Node.children).toHaveLength(0);
        });

        test('should persist data through database operations', async () => {
            // Create data through API
            const createResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'api-created', parentId: null })
                .expect(201);

            // Verify with direct database query
            const node = await treeQueries.getNodeById(createResponse.body.id);
            expect(node).toBeDefined();
            expect(node.label).toBe('api-created');
            expect(node.parent_id).toBeNull();

            // Create data through direct database call
            const dbNode = await treeQueries.createNode('db-created', null);

            // Verify through API
            const apiResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(apiResponse.body).toHaveLength(2);
            const labels = apiResponse.body.map(tree => tree.label);
            expect(labels).toContain('api-created');
            expect(labels).toContain('db-created');
        });

        test('should handle concurrent operations safely', async () => {
            // Create root node first
            const root = await request(app)
                .post('/api/tree')
                .send({ label: 'concurrent-root', parentId: null })
                .expect(201);

            const rootId = root.body.id;

            // Create multiple children concurrently
            const concurrentPromises = [];
            for (let i = 0; i < 5; i++) {
                concurrentPromises.push(
                    request(app)
                        .post('/api/tree')
                        .send({ label: `concurrent-child-${i}`, parentId: rootId })
                        .expect(201)
                );
            }

            await Promise.all(concurrentPromises);

            // Verify all children were created
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].children).toHaveLength(5);

            const childLabels = response.body[0].children.map(child => child.label).sort();
            for (let i = 0; i < 5; i++) {
                expect(childLabels).toContain(`concurrent-child-${i}`);
            }
        });
    });

    describe('Database Restart Simulation', () => {
        test('should persist data through database reconnection', async () => {
            // Create test data
            await seedTestData();

            // Get current data
            const beforeResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(beforeResponse.body).toHaveLength(1);
            expect(beforeResponse.body[0].label).toBe('root');

            // Simulate database restart by closing and reopening connection
            await dbInit.close();
            await dbInit.initialize();

            // Verify data still exists
            const afterResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(afterResponse.body).toEqual(beforeResponse.body);
        });

        test('should maintain data consistency after reconnection', async () => {
            // Create complex structure
            const { root, bear, cat, frog } = await seedTestData();

            // Add additional nodes
            await request(app)
                .post('/api/tree')
                .send({ label: 'cat-child', parentId: cat.id })
                .expect(201);

            // Get node path before reconnection
            const pathBefore = await request(app)
                .get(`/api/tree/node/${cat.id}/path`)
                .expect(200);

            // Simulate database restart
            await dbInit.close();
            await dbInit.initialize();

            // Verify path consistency after reconnection
            const pathAfter = await request(app)
                .get(`/api/tree/node/${cat.id}/path`)
                .expect(200);

            expect(pathAfter.body).toEqual(pathBefore.body);

            // Verify tree structure is intact
            const treeResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            const catNode = treeResponse.body[0].children[0].children[0]; // root -> bear -> cat
            expect(catNode.label).toBe('cat');
            expect(catNode.children).toHaveLength(1);
            expect(catNode.children[0].label).toBe('cat-child');
        });
    });

    describe('Data Validation and Constraints', () => {
        test('should enforce unique IDs across operations', async () => {
            const nodeIds = new Set();

            // Create multiple nodes and verify unique IDs
            for (let i = 0; i < 10; i++) {
                const response = await request(app)
                    .post('/api/tree')
                    .send({ label: `node-${i}`, parentId: null })
                    .expect(201);

                expect(nodeIds.has(response.body.id)).toBe(false);
                nodeIds.add(response.body.id);
            }

            expect(nodeIds.size).toBe(10);
        });

        test('should maintain foreign key constraints', async () => {
            const { root } = await seedTestData();

            // Create child with valid parent
            await request(app)
                .post('/api/tree')
                .send({ label: 'valid-child', parentId: root.id })
                .expect(201);

            // Try to create child with invalid parent (should fail)
            await request(app)
                .post('/api/tree')
                .send({ label: 'invalid-child', parentId: 99999 })
                .expect(404);

            // Verify only valid child was created
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            const tree = response.body[0];
            const childLabels = tree.children.map(child => child.label);
            expect(childLabels).toContain('valid-child');
            expect(childLabels).not.toContain('invalid-child');
        });

        test('should handle database constraints gracefully', async () => {
            // Test with extremely long label that should be truncated or rejected
            const extremelyLongLabel = 'a'.repeat(1000);
            
            await request(app)
                .post('/api/tree')
                .send({ label: extremelyLongLabel, parentId: null })
                .expect(400);

            // Verify no node was created
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.body).toHaveLength(0);
        });
    });

    describe('Database Performance and Scalability', () => {
        test('should handle moderate data volumes efficiently', async () => {
            const startTime = Date.now();

            // Create a moderately sized tree (100 nodes)
            const root = await request(app)
                .post('/api/tree')
                .send({ label: 'performance-root', parentId: null })
                .expect(201);

            const promises = [];
            for (let i = 0; i < 99; i++) {
                promises.push(
                    request(app)
                        .post('/api/tree')
                        .send({ label: `node-${i}`, parentId: root.body.id })
                        .expect(201)
                );
            }

            await Promise.all(promises);

            const creationTime = Date.now() - startTime;

            // Verify all nodes were created
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            const retrievalTime = Date.now() - startTime - creationTime;

            expect(response.body).toHaveLength(1);
            expect(response.body[0].children).toHaveLength(99);

            // Performance should be reasonable (less than 5 seconds for creation and retrieval)
            expect(creationTime + retrievalTime).toBeLessThan(5000);
        });

        test('should maintain consistent performance with hierarchical queries', async () => {
            // Create deep hierarchy
            let parentId = null;
            let currentNode = null;

            for (let depth = 0; depth < 10; depth++) {
                const response = await request(app)
                    .post('/api/tree')
                    .send({ label: `level-${depth}`, parentId })
                    .expect(201);

                currentNode = response.body;
                parentId = currentNode.id;
            }

            // Test path retrieval performance
            const startTime = Date.now();
            
            const pathResponse = await request(app)
                .get(`/api/tree/node/${currentNode.id}/path`)
                .expect(200);

            const pathTime = Date.now() - startTime;

            expect(pathResponse.body.path).toHaveLength(10);
            expect(pathResponse.body.depth).toBe(10);
            
            // Path retrieval should be fast (less than 100ms)
            expect(pathTime).toBeLessThan(100);
        });
    });

    describe('Error Recovery and Resilience', () => {
        test('should recover from temporary database issues', async () => {
            // Create some data first
            await seedTestData();

            // Verify data exists
            const beforeResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(beforeResponse.body).toHaveLength(1);

            // Simulate temporary database issue by closing connection
            await dbInit.close();

            // API should handle the error gracefully
            await request(app)
                .get('/api/tree')
                .expect(500);

            // Reconnect and verify data recovery
            await dbInit.initialize();

            const afterResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(afterResponse.body).toEqual(beforeResponse.body);
        });

        test('should handle malformed database operations', async () => {
            await seedTestData();

            // The system should be resilient to API operations that might cause DB issues
            // Test with various edge cases that might cause problems

            // Empty string operations
            await request(app)
                .post('/api/tree')
                .send({ label: '', parentId: null })
                .expect(400);

            // Very large numbers
            await request(app)
                .post('/api/tree')
                .send({ label: 'test', parentId: Number.MAX_SAFE_INTEGER })
                .expect(404);

            // After all these operations, original data should remain intact
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].label).toBe('root');
        });
    });
});