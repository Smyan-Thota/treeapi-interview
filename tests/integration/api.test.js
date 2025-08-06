/**
 * Integration Tests for API Endpoints
 * Tests complete HTTP request/response cycles with real database
 */

const request = require('supertest');
const { app } = require('../../src/app');
const { setupIntegrationTests, teardownIntegrationTests, resetDatabase, seedTestData } = require('./setup');

describe('API Integration Tests', () => {
    let server;
    const baseUrl = process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:3001';

    beforeAll(async () => {
        server = await setupIntegrationTests();
    });

    afterAll(async () => {
        await teardownIntegrationTests();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    describe('Health and Documentation Endpoints', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toEqual({
                status: 'healthy',
                message: 'Tree API is running',
                timestamp: expect.any(String)
            });
        });

        test('GET / should return API documentation', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toEqual({
                name: 'Tree API Server',
                version: '1.0.0',
                description: 'A production-ready HTTP server to handle tree data structures',
                endpoints: expect.any(Object),
                documentation: expect.any(Object),
                timestamp: expect.any(String)
            });

            expect(response.body.endpoints).toHaveProperty('getAllTrees');
            expect(response.body.endpoints).toHaveProperty('createNode');
        });
    });

    describe('GET /api/tree - Get All Trees', () => {
        test('should return empty array when no trees exist', async () => {
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        test('should return single tree with hierarchical structure', async () => {
            await seedTestData();

            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.body).toEqual([
                {
                    id: expect.any(Number),
                    label: 'root',
                    children: [
                        {
                            id: expect.any(Number),
                            label: 'bear',
                            children: [
                                {
                                    id: expect.any(Number),
                                    label: 'cat',
                                    children: []
                                }
                            ]
                        },
                        {
                            id: expect.any(Number),
                            label: 'frog',
                            children: []
                        }
                    ]
                }
            ]);
        });

        test('should return multiple trees', async () => {
            await seedTestData();
            
            // Create another root tree
            await request(app)
                .post('/api/tree')
                .send({ label: 'second-root', parentId: null })
                .expect(201);

            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0].label).toBe('root');
            expect(response.body[1].label).toBe('second-root');
        });

        test('should include security headers', async () => {
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-api-version']).toBe('1.0.0');
        });
    });

    describe('POST /api/tree - Create Node', () => {
        test('should create root node successfully', async () => {
            const nodeData = { label: 'integration-root', parentId: null };

            const response = await request(app)
                .post('/api/tree')
                .send(nodeData)
                .expect(201);

            expect(response.body).toEqual({
                id: expect.any(Number),
                label: 'integration-root',
                children: []
            });

            // Verify it appears in the tree
            const treesResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(treesResponse.body).toHaveLength(1);
            expect(treesResponse.body[0].label).toBe('integration-root');
        });

        test('should create child node successfully', async () => {
            const { root } = await seedTestData();

            const nodeData = { label: 'new-child', parentId: root.id };

            const response = await request(app)
                .post('/api/tree')
                .send(nodeData)
                .expect(201);

            expect(response.body).toEqual({
                id: expect.any(Number),
                label: 'new-child',
                children: []
            });

            // Verify it appears in the tree
            const treesResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            const rootTree = treesResponse.body[0];
            expect(rootTree.children).toHaveLength(3); // bear, frog, new-child
            const newChild = rootTree.children.find(child => child.label === 'new-child');
            expect(newChild).toBeDefined();
        });

        test('should validate required fields', async () => {
            // Missing label
            await request(app)
                .post('/api/tree')
                .send({ parentId: null })
                .expect(400)
                .expect(res => {
                    expect(res.body.error).toBe('Bad request');
                    expect(res.body.message).toBe('Label is required');
                });

            // Missing parentId
            await request(app)
                .post('/api/tree')
                .send({ label: 'test' })
                .expect(400)
                .expect(res => {
                    expect(res.body.error).toBe('Bad request');
                    expect(res.body.message).toBe('ParentId is required');
                });
        });

        test('should validate label constraints', async () => {
            // Empty label
            await request(app)
                .post('/api/tree')
                .send({ label: '', parentId: null })
                .expect(400)
                .expect(res => {
                    expect(res.body.message).toBe('Label cannot be empty');
                });

            // Long label
            const longLabel = 'a'.repeat(256);
            await request(app)
                .post('/api/tree')
                .send({ label: longLabel, parentId: null })
                .expect(400)
                .expect(res => {
                    expect(res.body.message).toBe('Label cannot be longer than 255 characters');
                });
        });

        test('should validate parent ID constraints', async () => {
            // Invalid parent ID type
            await request(app)
                .post('/api/tree')
                .send({ label: 'test', parentId: 'invalid' })
                .expect(400)
                .expect(res => {
                    expect(res.body.message).toBe('ParentId must be an integer or null');
                });

            // Negative parent ID
            await request(app)
                .post('/api/tree')
                .send({ label: 'test', parentId: -1 })
                .expect(400)
                .expect(res => {
                    expect(res.body.message).toBe('ParentId must be a positive integer or null');
                });
        });

        test('should validate parent exists', async () => {
            await request(app)
                .post('/api/tree')
                .send({ label: 'orphan', parentId: 999 })
                .expect(404)
                .expect(res => {
                    expect(res.body.error).toBe('Parent not found');
                    expect(res.body.message).toContain('Parent node with ID 999 does not exist');
                });
        });

        test('should handle invalid JSON', async () => {
            await request(app)
                .post('/api/tree')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400)
                .expect(res => {
                    expect(res.body.error).toBe('Invalid JSON');
                });
        });

        test('should require correct content type', async () => {
            await request(app)
                .post('/api/tree')
                .set('Content-Type', 'text/plain')
                .send('some text')
                .expect(400)
                .expect(res => {
                    expect(res.body.message).toBe('Content-Type must be application/json');
                });
        });
    });

    describe('GET /api/tree/:id - Get Specific Tree', () => {
        test('should return specific tree by root ID', async () => {
            const { root } = await seedTestData();

            const response = await request(app)
                .get(`/api/tree/${root.id}`)
                .expect(200);

            expect(response.body).toEqual({
                id: root.id,
                label: 'root',
                children: expect.any(Array)
            });

            expect(response.body.children).toHaveLength(2);
        });

        test('should return 404 for non-existent tree', async () => {
            await request(app)
                .get('/api/tree/999')
                .expect(404)
                .expect(res => {
                    expect(res.body.error).toBe('Tree not found');
                    expect(res.body.message).toBe('Tree with root ID 999 does not exist');
                });
        });

        test('should validate ID parameter', async () => {
            await request(app)
                .get('/api/tree/invalid')
                .expect(400)
                .expect(res => {
                    expect(res.body.message).toBe('ID parameter must be a positive integer');
                });

            await request(app)
                .get('/api/tree/-1')
                .expect(400);
        });
    });

    describe('GET /api/tree/stats - Service Statistics', () => {
        test('should return statistics for empty database', async () => {
            const response = await request(app)
                .get('/api/tree/stats')
                .expect(200);

            expect(response.body).toEqual({
                database: {
                    totalNodes: 0,
                    rootNodes: 0,
                    roots: []
                },
                trees: {
                    count: 0,
                    totalNodes: 0,
                    structures: []
                }
            });
        });

        test('should return statistics with data', async () => {
            await seedTestData();

            const response = await request(app)
                .get('/api/tree/stats')
                .expect(200);

            expect(response.body).toEqual({
                database: {
                    totalNodes: 4,
                    rootNodes: 1,
                    roots: [
                        {
                            id: expect.any(Number),
                            label: 'root'
                        }
                    ]
                },
                trees: {
                    count: 1,
                    totalNodes: 4,
                    structures: [
                        {
                            rootId: expect.any(Number),
                            rootLabel: 'root',
                            nodeCount: 4
                        }
                    ]
                }
            });
        });
    });

    describe('GET /api/tree/node/:id/path - Node Path', () => {
        test('should return path from root to node', async () => {
            const { root, bear, cat } = await seedTestData();

            const response = await request(app)
                .get(`/api/tree/node/${cat.id}/path`)
                .expect(200);

            expect(response.body).toEqual({
                nodeId: cat.id,
                path: [
                    { id: root.id, label: 'root' },
                    { id: bear.id, label: 'bear' },
                    { id: cat.id, label: 'cat' }
                ],
                depth: 3
            });
        });

        test('should return path for root node', async () => {
            const { root } = await seedTestData();

            const response = await request(app)
                .get(`/api/tree/node/${root.id}/path`)
                .expect(200);

            expect(response.body).toEqual({
                nodeId: root.id,
                path: [
                    { id: root.id, label: 'root' }
                ],
                depth: 1
            });
        });

        test('should return 404 for non-existent node', async () => {
            await request(app)
                .get('/api/tree/node/999/path')
                .expect(404)
                .expect(res => {
                    expect(res.body.error).toBe('Node not found');
                });
        });
    });

    describe('CORS and Preflight Requests', () => {
        test('should handle OPTIONS preflight request', async () => {
            const response = await request(app)
                .options('/api/tree')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
        });

        test('should include CORS headers in responses', async () => {
            const response = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    describe('404 Handling', () => {
        test('should return 404 for unknown routes', async () => {
            await request(app)
                .get('/api/unknown')
                .expect(404)
                .expect(res => {
                    expect(res.body.error).toBe('Route GET /api/unknown not found');
                    expect(res.body.availableEndpoints).toBeInstanceOf(Array);
                });
        });

        test('should return 404 for unknown methods', async () => {
            await request(app)
                .put('/api/tree')
                .expect(404);
        });
    });
});