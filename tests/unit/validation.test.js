/**
 * Unit Tests for Tree Validation
 * Tests circular reference detection, tree structure validation, and ancestor queries
 */

const treeService = require('../../src/services/treeService');
const treeQueries = require('../../src/database/queries');
const dbInit = require('../../src/database/init');

describe('Tree Validation Unit Tests', () => {
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

    describe('Ancestor Queries', () => {
        test('should get ancestors for a nested node', async () => {
            // Create a chain: root -> child -> grandchild
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child.id);
            
            const ancestors = await treeQueries.getAncestors(grandchild.id);
            
            expect(ancestors).toHaveLength(2);
            expect(ancestors[0].id).toBe(child.id);
            expect(ancestors[1].id).toBe(root.id);
        });

        test('should return empty array for root node ancestors', async () => {
            const root = await treeQueries.createNode('root', null);
            
            const ancestors = await treeQueries.getAncestors(root.id);
            
            expect(ancestors).toHaveLength(0);
        });

        test('should get ancestor IDs efficiently', async () => {
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child.id);
            
            const ancestorIds = await treeQueries.getAncestorIds(grandchild.id);
            
            expect(ancestorIds).toHaveLength(2);
            expect(ancestorIds).toContain(child.id);
            expect(ancestorIds).toContain(root.id);
        });

        test('should detect ancestor relationship correctly', async () => {
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child.id);
            
            // Test direct ancestor relationship
            const isDirectAncestor = await treeQueries.isAncestor(child.id, grandchild.id);
            expect(isDirectAncestor).toBe(true);
            
            // Test indirect ancestor relationship
            const isIndirectAncestor = await treeQueries.isAncestor(root.id, grandchild.id);
            expect(isIndirectAncestor).toBe(true);
            
            // Test non-ancestor relationship
            const unrelated = await treeQueries.createNode('unrelated', null);
            const isUnrelated = await treeQueries.isAncestor(unrelated.id, grandchild.id);
            expect(isUnrelated).toBe(false);
            
            // Test self-ancestor (for circular prevention)
            const isSelfAncestor = await treeQueries.isAncestor(grandchild.id, grandchild.id);
            expect(isSelfAncestor).toBe(true);
        });
    });

    describe('Circular Reference Detection', () => {
        test('should validate using ancestor detection directly', async () => {
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child.id);
            
            // Test the underlying ancestor detection logic
            const isAncestor = await treeQueries.isAncestor(root.id, grandchild.id);
            expect(isAncestor).toBe(true);
            
            const isNotAncestor = await treeQueries.isAncestor(grandchild.id, root.id);
            expect(isNotAncestor).toBe(false);
        });
    });

    describe('Tree Structure Validation', () => {
        test('should validate healthy tree structure', async () => {
            const root = await treeQueries.createNode('root', null);
            const child1 = await treeQueries.createNode('child1', root.id);
            const child2 = await treeQueries.createNode('child2', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child1.id);
            
            const validation = await treeService.validateTreeStructure();
            
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
            expect(validation.totalNodes).toBe(4);
            expect(validation.rootNodes).toBe(1);
        });

        test('should detect orphaned nodes', async () => {
            // Create nodes normally
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            
            // Manually create an orphaned node by directly inserting with invalid parent_id
            // This simulates data corruption scenarios
            const orphanedNodeSql = 'INSERT INTO nodes (label, parent_id) VALUES (?, ?)';
            await require('../../src/database/connection').run(orphanedNodeSql, ['orphaned', 99999]);
            
            const validation = await treeService.validateTreeStructure();
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues).toHaveLength(1);
            expect(validation.issues[0].type).toBe('orphaned_node');
        });

        test('should get node depth correctly', async () => {
            const root = await treeQueries.createNode('root', null);
            const child = await treeQueries.createNode('child', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child.id);
            
            expect(await treeQueries.getNodeDepth(root.id)).toBe(0);
            expect(await treeQueries.getNodeDepth(child.id)).toBe(1);
            expect(await treeQueries.getNodeDepth(grandchild.id)).toBe(2);
        });

        test('should get nodes at specific depth', async () => {
            const root1 = await treeQueries.createNode('root1', null);
            const root2 = await treeQueries.createNode('root2', null);
            const child1 = await treeQueries.createNode('child1', root1.id);
            const child2 = await treeQueries.createNode('child2', root2.id);
            
            const rootNodes = await treeQueries.getNodesAtDepth(0);
            expect(rootNodes).toHaveLength(2);
            
            const childNodes = await treeQueries.getNodesAtDepth(1);
            expect(childNodes).toHaveLength(2);
        });

        test('should calculate subtree sizes', async () => {
            const root = await treeQueries.createNode('root', null);
            const child1 = await treeQueries.createNode('child1', root.id);
            const child2 = await treeQueries.createNode('child2', root.id);
            const grandchild = await treeQueries.createNode('grandchild', child1.id);
            
            expect(await treeQueries.getSubtreeSize(root.id)).toBe(3); // child1, child2, grandchild
            expect(await treeQueries.getSubtreeSize(child1.id)).toBe(1); // grandchild
            expect(await treeQueries.getSubtreeSize(child2.id)).toBe(0); // no children
            expect(await treeQueries.getSubtreeSize(grandchild.id)).toBe(0); // no children
        });
    });

    describe('Detailed Statistics', () => {
        test('should generate comprehensive tree statistics', async () => {
            const root1 = await treeQueries.createNode('root1', null);
            const root2 = await treeQueries.createNode('root2', null);
            const child1 = await treeQueries.createNode('child1', root1.id);
            const grandchild = await treeQueries.createNode('grandchild', child1.id);
            
            const stats = await treeService.getDetailedStats();
            
            expect(stats.totalNodes).toBe(4);
            expect(stats.totalTrees).toBe(2);
            expect(stats.maxDepth).toBe(2);
            expect(stats.depthDistribution).toHaveLength(3); // depth 0, 1, 2
            expect(stats.subtreeSizes).toHaveLength(2);
            expect(stats.averageSubtreeSize).toBeGreaterThan(0);
        });
    });
});
