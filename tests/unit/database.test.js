/**
 * Unit Tests for Database Layer
 * Tests database connection, queries, and data operations in isolation
 */

const treeQueries = require('../../src/database/queries');
const dbConnection = require('../../src/database/connection');
const dbInit = require('../../src/database/init');

describe('Database Layer Unit Tests', () => {
    beforeAll(async () => {
        // Initialize database for testing
        await dbInit.initialize();
    });

    beforeEach(async () => {
        // Clear database before each test to ensure isolation
        await treeQueries.clearAllNodes();
    });

    afterAll(async () => {
        // Close database connection after all tests
        await dbInit.close();
    });

    describe('Database Connection', () => {
        test('should connect to database successfully', async () => {
            expect(dbConnection.getDatabase()).toBeDefined();
            expect(typeof dbConnection.run).toBe('function');
            expect(typeof dbConnection.get).toBe('function');
            expect(typeof dbConnection.all).toBe('function');
        });

        test('should execute SQL queries', async () => {
            const result = await dbConnection.run('SELECT 1 as test');
            expect(result).toBeDefined();
        });

        test('should get single row', async () => {
            await dbConnection.run('INSERT INTO nodes (label, parent_id) VALUES (?, ?)', ['test', null]);
            const row = await dbConnection.get('SELECT * FROM nodes WHERE label = ?', ['test']);
            expect(row).toBeDefined();
            expect(row.label).toBe('test');
        });

        test('should get all rows', async () => {
            await dbConnection.run('INSERT INTO nodes (label, parent_id) VALUES (?, ?)', ['test1', null]);
            await dbConnection.run('INSERT INTO nodes (label, parent_id) VALUES (?, ?)', ['test2', null]);
            const rows = await dbConnection.all('SELECT * FROM nodes ORDER BY id');
            expect(Array.isArray(rows)).toBe(true);
            expect(rows.length).toBe(2);
        });
    });

    describe('TreeQueries - Node Creation', () => {
        test('should create root node', async () => {
            const node = await treeQueries.createNode('root', null);
            
            expect(node).toBeDefined();
            expect(node.id).toBeDefined();
            expect(node.label).toBe('root');
            expect(node.parent_id).toBeNull();
            expect(node.created_at).toBeDefined();
        });

        test('should create child node', async () => {
            const parent = await treeQueries.createNode('parent', null);
            const child = await treeQueries.createNode('child', parent.id);
            
            expect(child).toBeDefined();
            expect(child.id).toBeDefined();
            expect(child.label).toBe('child');
            expect(child.parent_id).toBe(parent.id);
        });

        test('should reject child node with non-existent parent', async () => {
            await expect(treeQueries.createNode('orphan', 999)).rejects.toThrow('Parent node with ID 999 does not exist');
        });

        test('should allow multiple children for same parent', async () => {
            const parent = await treeQueries.createNode('parent', null);
            const child1 = await treeQueries.createNode('child1', parent.id);
            const child2 = await treeQueries.createNode('child2', parent.id);
            
            expect(child1.parent_id).toBe(parent.id);
            expect(child2.parent_id).toBe(parent.id);
            expect(child1.id).not.toBe(child2.id);
        });
    });

    describe('TreeQueries - Node Retrieval', () => {
        test('should get node by ID', async () => {
            const created = await treeQueries.createNode('test', null);
            const retrieved = await treeQueries.getNodeById(created.id);
            
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(created.id);
            expect(retrieved.label).toBe('test');
        });

        test('should return null for non-existent node ID', async () => {
            const retrieved = await treeQueries.getNodeById(999);
            expect(retrieved).toBeNull();
        });

        test('should get all nodes', async () => {
            await treeQueries.createNode('node1', null);
            await treeQueries.createNode('node2', null);
            
            const allNodes = await treeQueries.getAllNodes();
            expect(Array.isArray(allNodes)).toBe(true);
            expect(allNodes.length).toBe(2);
        });

        test('should get root nodes only', async () => {
            const root1 = await treeQueries.createNode('root1', null);
            const root2 = await treeQueries.createNode('root2', null);
            await treeQueries.createNode('child', root1.id);
            
            const rootNodes = await treeQueries.getRootNodes();
            expect(rootNodes.length).toBe(2);
            expect(rootNodes.every(node => node.parent_id === null)).toBe(true);
        });

        test('should get children by parent ID', async () => {
            const parent = await treeQueries.createNode('parent', null);
            const child1 = await treeQueries.createNode('child1', parent.id);
            const child2 = await treeQueries.createNode('child2', parent.id);
            
            const children = await treeQueries.getChildrenByParentId(parent.id);
            expect(children.length).toBe(2);
            expect(children.every(child => child.parent_id === parent.id)).toBe(true);
        });

        test('should return empty array for node with no children', async () => {
            const parent = await treeQueries.createNode('parent', null);
            const children = await treeQueries.getChildrenByParentId(parent.id);
            expect(children).toEqual([]);
        });
    });

    describe('TreeQueries - Node Existence', () => {
        test('should check node existence correctly', async () => {
            const node = await treeQueries.createNode('test', null);
            
            const exists = await treeQueries.nodeExists(node.id);
            const notExists = await treeQueries.nodeExists(999);
            
            expect(exists).toBe(true);
            expect(notExists).toBe(false);
        });
    });

    describe('TreeQueries - Node Updates', () => {
        test('should update node label', async () => {
            const node = await treeQueries.createNode('original', null);
            const updated = await treeQueries.updateNodeLabel(node.id, 'updated');
            
            expect(updated).toBeDefined();
            expect(updated.label).toBe('updated');
            expect(updated.id).toBe(node.id);
        });

        test('should return null when updating non-existent node', async () => {
            const result = await treeQueries.updateNodeLabel(999, 'updated');
            expect(result).toBeNull();
        });
    });

    describe('TreeQueries - Hierarchical Operations', () => {
        test('should get all descendants recursively', async () => {
            const root = await treeQueries.createNode('root', null);
            const child1 = await treeQueries.createNode('child1', root.id);
            const child2 = await treeQueries.createNode('child2', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child1.id);
            
            const descendants = await treeQueries.getAllDescendants(root.id);
            expect(descendants.length).toBe(3);
            
            const labels = descendants.map(node => node.label);
            expect(labels).toContain('child1');
            expect(labels).toContain('child2');
            expect(labels).toContain('grandchild');
        });

        test('should return empty array for leaf node descendants', async () => {
            const leaf = await treeQueries.createNode('leaf', null);
            const descendants = await treeQueries.getAllDescendants(leaf.id);
            expect(descendants).toEqual([]);
        });
    });

    describe('TreeQueries - Node Deletion', () => {
        test('should delete single node', async () => {
            const node = await treeQueries.createNode('test', null);
            const deletedCount = await treeQueries.deleteNode(node.id);
            
            expect(deletedCount).toBe(1);
            
            const retrieved = await treeQueries.getNodeById(node.id);
            expect(retrieved).toBeNull();
        });

        test('should delete node and all descendants', async () => {
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child.id);
            
            const deletedCount = await treeQueries.deleteNode(root.id);
            expect(deletedCount).toBe(3);
            
            const rootExists = await treeQueries.nodeExists(root.id);
            const childExists = await treeQueries.nodeExists(child.id);
            const grandchildExists = await treeQueries.nodeExists(grandchild.id);
            
            expect(rootExists).toBe(false);
            expect(childExists).toBe(false);
            expect(grandchildExists).toBe(false);
        });
    });

    describe('TreeQueries - Utility Functions', () => {
        test('should count nodes correctly', async () => {
            expect(await treeQueries.getNodeCount()).toBe(0);
            
            await treeQueries.createNode('node1', null);
            expect(await treeQueries.getNodeCount()).toBe(1);
            
            await treeQueries.createNode('node2', null);
            expect(await treeQueries.getNodeCount()).toBe(2);
        });

        test('should clear all nodes', async () => {
            await treeQueries.createNode('node1', null);
            await treeQueries.createNode('node2', null);
            
            expect(await treeQueries.getNodeCount()).toBe(2);
            
            const deletedCount = await treeQueries.clearAllNodes();
            expect(deletedCount).toBe(2);
            expect(await treeQueries.getNodeCount()).toBe(0);
        });
    });

    describe('Database Initialization', () => {
        test('should get database statistics', async () => {
            await treeQueries.createNode('root1', null);
            await treeQueries.createNode('root2', null);
            
            const stats = await dbInit.getStats();
            
            expect(stats).toBeDefined();
            expect(stats.totalNodes).toBe(2);
            expect(stats.rootNodes).toBe(2);
            expect(Array.isArray(stats.roots)).toBe(true);
            expect(stats.roots.length).toBe(2);
        });

        test('should reset database', async () => {
            await treeQueries.createNode('test', null);
            expect(await treeQueries.getNodeCount()).toBeGreaterThan(0);
            
            await dbInit.reset();
            
            // After reset, should have sample data
            const nodeCount = await treeQueries.getNodeCount();
            expect(nodeCount).toBeGreaterThan(0);
        });

        test('should test connection', async () => {
            const result = await dbInit.testConnection();
            expect(result).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            // Test with invalid SQL (this should be caught by our error handling)
            await expect(dbConnection.run('INVALID SQL')).rejects.toThrow();
        });

        test('should handle malformed queries', async () => {
            await expect(dbConnection.get('SELECT * FROM non_existent_table')).rejects.toThrow();
        });
    });

    describe('Data Integrity', () => {
        test('should maintain referential integrity', async () => {
            const parent = await treeQueries.createNode('parent', null);
            const child = await treeQueries.createNode('child', parent.id);
            
            // Verify the relationship
            const retrievedChild = await treeQueries.getNodeById(child.id);
            expect(retrievedChild.parent_id).toBe(parent.id);
            
            // Verify parent exists
            const parentExists = await treeQueries.nodeExists(parent.id);
            expect(parentExists).toBe(true);
        });

        test('should handle concurrent operations', async () => {
            const parent = await treeQueries.createNode('parent', null);
            
            // Create multiple children concurrently
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(treeQueries.createNode(`child-${i}`, parent.id));
            }
            
            const children = await Promise.all(promises);
            
            expect(children.length).toBe(5);
            children.forEach((child, index) => {
                expect(child.label).toBe(`child-${index}`);
                expect(child.parent_id).toBe(parent.id);
            });
        });
    });
});