/**
 * Unit Tests for Transaction Support
 * Tests database transaction functionality including rollback scenarios
 */

const dbConnection = require('../../src/database/connection');
const treeQueries = require('../../src/database/queries');
const dbInit = require('../../src/database/init');

describe('Transaction Support Unit Tests', () => {
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

    describe('Basic Transaction Operations', () => {
        test('should begin, commit, and rollback transactions', async () => {
            // Test begin transaction
            await expect(dbConnection.beginTransaction()).resolves.toBeUndefined();
            
            // Test commit transaction
            await expect(dbConnection.commitTransaction()).resolves.toBeUndefined();
            
            // Test rollback transaction
            await dbConnection.beginTransaction();
            await expect(dbConnection.rollbackTransaction()).resolves.toBeUndefined();
        });

        test('should handle transaction with successful operations', async () => {
            await dbConnection.beginTransaction();
            
            // Create a node within transaction
            const node = await treeQueries.createNode('test-node', null);
            expect(node).toBeDefined();
            expect(node.label).toBe('test-node');
            
            await dbConnection.commitTransaction();
            
            // Verify node persists after commit
            const retrievedNode = await treeQueries.getNodeById(node.id);
            expect(retrievedNode).toBeDefined();
            expect(retrievedNode.label).toBe('test-node');
        });

        test('should rollback on error and not persist changes', async () => {
            await dbConnection.beginTransaction();
            
            try {
                // Create a valid node
                const node = await treeQueries.createNode('test-node', null);
                expect(node).toBeDefined();
                
                // Attempt to create an invalid node (this should cause error)
                await treeQueries.createNode('invalid-node', 99999); // Non-existent parent
                
                await dbConnection.commitTransaction();
            } catch (error) {
                await dbConnection.rollbackTransaction();
                expect(error).toBeDefined();
            }
            
            // Verify no nodes persist after rollback
            const allNodes = await treeQueries.getAllNodes();
            expect(allNodes).toHaveLength(0);
        });
    });

    describe('Bulk Operations with Transactions', () => {
        test('should create multiple nodes in transaction', async () => {
            const nodeData = [
                { label: 'root1', parentId: null },
                { label: 'root2', parentId: null }
            ];
            
            const createdNodes = await treeQueries.createMultipleNodes(nodeData);
            
            expect(createdNodes).toHaveLength(2);
            expect(createdNodes[0].label).toBe('root1');
            expect(createdNodes[1].label).toBe('root2');
            
            // Verify nodes exist in database
            const allNodes = await treeQueries.getAllNodes();
            expect(allNodes).toHaveLength(2);
        });

        test('should rollback bulk creation on error', async () => {
            const nodeData = [
                { label: 'valid-node', parentId: null },
                { label: 'invalid-node', parentId: 99999 } // Non-existent parent
            ];
            
            await expect(treeQueries.createMultipleNodes(nodeData)).rejects.toThrow();
            
            // Verify no nodes were created due to rollback
            const allNodes = await treeQueries.getAllNodes();
            expect(allNodes).toHaveLength(0);
        });

        test('should update multiple nodes in transaction', async () => {
            // Create initial nodes
            const node1 = await treeQueries.createNode('node1', null);
            const node2 = await treeQueries.createNode('node2', null);
            
            const updates = [
                { id: node1.id, label: 'updated-node1' },
                { id: node2.id, label: 'updated-node2' }
            ];
            
            const updatedNodes = await treeQueries.updateMultipleNodes(updates);
            
            expect(updatedNodes).toHaveLength(2);
            expect(updatedNodes[0].label).toBe('updated-node1');
            expect(updatedNodes[1].label).toBe('updated-node2');
        });
    });

    describe('Transaction State Management', () => {
        test('should handle nested transaction attempts gracefully', async () => {
            await dbConnection.beginTransaction();
            
            // Attempting to begin another transaction should not throw
            // (SQLite handles this by ignoring nested BEGIN statements)
            await expect(dbConnection.beginTransaction()).resolves.toBeUndefined();
            
            await dbConnection.commitTransaction();
        });

        test('should handle commit without active transaction', async () => {
            // Committing without active transaction should not throw
            await expect(dbConnection.commitTransaction()).resolves.toBeUndefined();
        });

        test('should handle rollback without active transaction', async () => {
            // Rolling back without active transaction should not throw
            await expect(dbConnection.rollbackTransaction()).resolves.toBeUndefined();
        });
    });

    describe('runInTransaction Helper', () => {
        test('should execute statements in transaction successfully', async () => {
            const statements = [
                { sql: 'INSERT INTO nodes (label, parent_id) VALUES (?, ?)', params: ['node1', null] },
                { sql: 'INSERT INTO nodes (label, parent_id) VALUES (?, ?)', params: ['node2', null] }
            ];
            
            const results = await dbConnection.runInTransaction(statements);
            
            expect(results).toHaveLength(2);
            expect(results[0].id).toBeDefined();
            expect(results[1].id).toBeDefined();
            
            // Verify nodes were created
            const allNodes = await treeQueries.getAllNodes();
            expect(allNodes).toHaveLength(2);
        });

        test('should rollback on error in runInTransaction', async () => {
            const statements = [
                { sql: 'INSERT INTO nodes (label, parent_id) VALUES (?, ?)', params: ['valid-node', null] },
                { sql: 'INSERT INTO invalid_table (invalid_column) VALUES (?)', params: ['invalid'] }
            ];
            
            await expect(dbConnection.runInTransaction(statements)).rejects.toThrow();
            
            // Verify no nodes were created due to rollback
            const allNodes = await treeQueries.getAllNodes();
            expect(allNodes).toHaveLength(0);
        });
    });
});
