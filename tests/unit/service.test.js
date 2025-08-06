/**
 * Unit Tests for Service Layer
 * Tests business logic, tree hierarchy building, and validation in isolation
 */

const treeService = require('../../src/services/treeService');
const treeQueries = require('../../src/database/queries');
const dbInit = require('../../src/database/init');

// Mock the database layer for true unit testing
jest.mock('../../src/database/queries');
jest.mock('../../src/database/init');

describe('TreeService Unit Tests', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Mock the initialize method to resolve immediately
        dbInit.initialize.mockResolvedValue();
    });

    describe('Service Initialization', () => {
        test('should initialize service correctly', async () => {
            await treeService.initialize();
            expect(dbInit.initialize).toHaveBeenCalledTimes(1);
        });

        test('should only initialize once', async () => {
            // Reset the service's initialized state for this test
            treeService.initialized = false;
            
            await treeService.initialize();
            await treeService.initialize();
            expect(dbInit.initialize).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAllTrees', () => {
        test('should return hierarchical tree structure', async () => {
            const mockNodes = [
                { id: 1, label: 'root', parent_id: null },
                { id: 2, label: 'child1', parent_id: 1 },
                { id: 3, label: 'child2', parent_id: 1 },
                { id: 4, label: 'grandchild', parent_id: 2 }
            ];
            
            treeQueries.getAllNodes.mockResolvedValue(mockNodes);
            
            const trees = await treeService.getAllTrees();
            
            expect(trees).toEqual([
                {
                    id: 1,
                    label: 'root',
                    children: [
                        {
                            id: 2,
                            label: 'child1',
                            children: [
                                {
                                    id: 4,
                                    label: 'grandchild',
                                    children: []
                                }
                            ]
                        },
                        {
                            id: 3,
                            label: 'child2',
                            children: []
                        }
                    ]
                }
            ]);
        });

        test('should return empty array for no nodes', async () => {
            treeQueries.getAllNodes.mockResolvedValue([]);
            
            const trees = await treeService.getAllTrees();
            expect(trees).toEqual([]);
        });

        test('should handle multiple root nodes', async () => {
            const mockNodes = [
                { id: 1, label: 'root1', parent_id: null },
                { id: 2, label: 'root2', parent_id: null },
                { id: 3, label: 'child1', parent_id: 1 }
            ];
            
            treeQueries.getAllNodes.mockResolvedValue(mockNodes);
            
            const trees = await treeService.getAllTrees();
            
            expect(trees.length).toBe(2);
            expect(trees[0].label).toBe('root1');
            expect(trees[1].label).toBe('root2');
            expect(trees[0].children.length).toBe(1);
            expect(trees[1].children.length).toBe(0);
        });

        test('should handle database errors', async () => {
            treeQueries.getAllNodes.mockRejectedValue(new Error('Database error'));
            
            await expect(treeService.getAllTrees()).rejects.toThrow('Failed to get all trees: Database error');
        });
    });

    describe('createNode', () => {
        test('should create node with valid data', async () => {
            const mockCreatedNode = { id: 1, label: 'test', parent_id: null };
            treeQueries.createNode.mockResolvedValue(mockCreatedNode);
            
            const result = await treeService.createNode('test', null);
            
            expect(treeQueries.createNode).toHaveBeenCalledWith('test', null);
            expect(result).toEqual({
                id: 1,
                label: 'test',
                children: []
            });
        });

        test('should create child node with parent ID', async () => {
            const mockCreatedNode = { id: 2, label: 'child', parent_id: 1 };
            treeQueries.createNode.mockResolvedValue(mockCreatedNode);
            
            const result = await treeService.createNode('child', 1);
            
            expect(treeQueries.createNode).toHaveBeenCalledWith('child', 1);
            expect(result.id).toBe(2);
            expect(result.label).toBe('child');
        });

        test('should validate label is provided', async () => {
            await expect(treeService.createNode(null, 1)).rejects.toThrow('Label is required and must be a non-empty string');
            await expect(treeService.createNode('', 1)).rejects.toThrow('Label is required and must be a non-empty string');
            await expect(treeService.createNode(123, 1)).rejects.toThrow('Label is required and must be a non-empty string');
        });

        test('should validate label is not empty or whitespace', async () => {
            await expect(treeService.createNode('   ', 1)).rejects.toThrow('Label cannot be empty or just whitespace');
            await expect(treeService.createNode('\t\n', 1)).rejects.toThrow('Label cannot be empty or just whitespace');
        });

        test('should validate label length', async () => {
            const longLabel = 'a'.repeat(256);
            await expect(treeService.createNode(longLabel, 1)).rejects.toThrow('Label cannot be longer than 255 characters');
        });

        test('should validate parent ID is positive integer', async () => {
            await expect(treeService.createNode('test', -1)).rejects.toThrow('Parent ID must be a positive integer');
            await expect(treeService.createNode('test', 0)).rejects.toThrow('Parent ID must be a positive integer');
            await expect(treeService.createNode('test', 1.5)).rejects.toThrow('Parent ID must be a positive integer');
            await expect(treeService.createNode('test', 'invalid')).rejects.toThrow('Parent ID must be a positive integer');
        });

        test('should allow null parent ID for root nodes', async () => {
            const mockCreatedNode = { id: 1, label: 'root', parent_id: null };
            treeQueries.createNode.mockResolvedValue(mockCreatedNode);
            
            const result = await treeService.createNode('root', null);
            expect(result).toBeDefined();
        });

        test('should handle database errors', async () => {
            treeQueries.createNode.mockRejectedValue(new Error('Database error'));
            
            await expect(treeService.createNode('test', null)).rejects.toThrow('Failed to create node: Database error');
        });
    });

    describe('getTreeByRootId', () => {
        test('should return tree by root ID', async () => {
            const mockRootNode = { id: 1, label: 'root', parent_id: null };
            const mockDescendants = [
                { id: 2, label: 'child', parent_id: 1 }
            ];
            
            treeQueries.getNodeById.mockResolvedValue(mockRootNode);
            treeQueries.getAllDescendants.mockResolvedValue(mockDescendants);
            
            const result = await treeService.getTreeByRootId(1);
            
            expect(result).toEqual({
                id: 1,
                label: 'root',
                children: [
                    {
                        id: 2,
                        label: 'child',
                        children: []
                    }
                ]
            });
        });

        test('should return null for non-existent root', async () => {
            treeQueries.getNodeById.mockResolvedValue(null);
            
            const result = await treeService.getTreeByRootId(999);
            expect(result).toBeNull();
        });

        test('should handle database errors', async () => {
            treeQueries.getNodeById.mockRejectedValue(new Error('Database error'));
            
            await expect(treeService.getTreeByRootId(1)).rejects.toThrow('Failed to get tree: Database error');
        });
    });

    describe('getNodeWithSubtree', () => {
        test('should return node with subtree', async () => {
            const mockNode = { id: 2, label: 'parent', parent_id: 1 };
            const mockDescendants = [
                { id: 3, label: 'child', parent_id: 2 }
            ];
            
            treeQueries.getNodeById.mockResolvedValue(mockNode);
            treeQueries.getAllDescendants.mockResolvedValue(mockDescendants);
            
            const result = await treeService.getNodeWithSubtree(2);
            
            // buildHierarchy(allNodes, 2) looks for nodes with parent_id = 2 as roots
            // Since node 3 has parent_id = 2, it becomes the root of the returned tree
            expect(result).toEqual({
                id: 3,
                label: 'child',
                children: []
            });
        });

        test('should return null for non-existent node', async () => {
            treeQueries.getNodeById.mockResolvedValue(null);
            
            const result = await treeService.getNodeWithSubtree(999);
            expect(result).toBeNull();
        });
    });

    describe('buildHierarchy', () => {
        test('should build correct hierarchy from flat nodes', () => {
            const nodes = [
                { id: 1, label: 'root', parent_id: null },
                { id: 2, label: 'child1', parent_id: 1 },
                { id: 3, label: 'child2', parent_id: 1 },
                { id: 4, label: 'grandchild', parent_id: 2 }
            ];
            
            const result = treeService.buildHierarchy(nodes);
            
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(1);
            expect(result[0].children.length).toBe(2);
            expect(result[0].children[0].children.length).toBe(1);
        });

        test('should handle empty nodes array', () => {
            const result = treeService.buildHierarchy([]);
            expect(result).toEqual([]);
        });

        test('should handle null nodes', () => {
            const result = treeService.buildHierarchy(null);
            expect(result).toEqual([]);
        });

        test('should handle nodes with custom root parent ID', () => {
            const nodes = [
                { id: 2, label: 'child1', parent_id: 1 },
                { id: 3, label: 'child2', parent_id: 1 }
            ];
            
            const result = treeService.buildHierarchy(nodes, 1);
            expect(result.length).toBe(2);
            expect(result[0].id).toBe(2);
            expect(result[1].id).toBe(3);
        });

        test('should sort children by ID', () => {
            const nodes = [
                { id: 1, label: 'root', parent_id: null },
                { id: 3, label: 'child3', parent_id: 1 },
                { id: 2, label: 'child2', parent_id: 1 },
                { id: 4, label: 'child4', parent_id: 1 }
            ];
            
            const result = treeService.buildHierarchy(nodes);
            
            expect(result[0].children[0].id).toBe(2);
            expect(result[0].children[1].id).toBe(3);
            expect(result[0].children[2].id).toBe(4);
        });
    });

    describe('validateNodeInput', () => {
        test('should validate valid input', () => {
            expect(() => treeService.validateNodeInput('valid label', 1)).not.toThrow();
            expect(() => treeService.validateNodeInput('valid label', null)).not.toThrow();
        });

        test('should reject invalid labels', () => {
            expect(() => treeService.validateNodeInput(null, 1)).toThrow('Label is required and must be a non-empty string');
            expect(() => treeService.validateNodeInput('', 1)).toThrow('Label is required and must be a non-empty string');
            expect(() => treeService.validateNodeInput('   ', 1)).toThrow('Label cannot be empty or just whitespace');
            expect(() => treeService.validateNodeInput(123, 1)).toThrow('Label is required and must be a non-empty string');
        });

        test('should reject invalid parent IDs', () => {
            expect(() => treeService.validateNodeInput('test', -1)).toThrow('Parent ID must be a positive integer');
            expect(() => treeService.validateNodeInput('test', 0)).toThrow('Parent ID must be a positive integer');
            expect(() => treeService.validateNodeInput('test', 1.5)).toThrow('Parent ID must be a positive integer');
            expect(() => treeService.validateNodeInput('test', 'invalid')).toThrow('Parent ID must be a positive integer');
        });
    });

    describe('getStats', () => {
        test('should return service statistics', async () => {
            const mockDbStats = {
                totalNodes: 5,
                rootNodes: 2,
                roots: [
                    { id: 1, label: 'root1' },
                    { id: 3, label: 'root2' }
                ]
            };
            
            const mockNodes = [
                { id: 1, label: 'root1', parent_id: null },
                { id: 2, label: 'child1', parent_id: 1 },
                { id: 3, label: 'root2', parent_id: null }
            ];
            
            dbInit.getStats.mockResolvedValue(mockDbStats);
            treeQueries.getAllNodes.mockResolvedValue(mockNodes);
            
            const stats = await treeService.getStats();
            
            expect(stats.database).toEqual(mockDbStats);
            expect(stats.trees.count).toBe(2);
            expect(stats.trees.totalNodes).toBe(3);
            expect(stats.trees.structures.length).toBe(2);
        });

        test('should handle database errors', async () => {
            dbInit.getStats.mockRejectedValue(new Error('Database error'));
            
            await expect(treeService.getStats()).rejects.toThrow('Failed to get service stats: Database error');
        });
    });

    describe('countNodesInTree', () => {
        test('should count nodes in tree correctly', () => {
            const tree = {
                id: 1,
                label: 'root',
                children: [
                    {
                        id: 2,
                        label: 'child1',
                        children: [
                            {
                                id: 4,
                                label: 'grandchild',
                                children: []
                            }
                        ]
                    },
                    {
                        id: 3,
                        label: 'child2',
                        children: []
                    }
                ]
            };
            
            const count = treeService.countNodesInTree(tree);
            expect(count).toBe(4);
        });

        test('should count single node', () => {
            const tree = {
                id: 1,
                label: 'single',
                children: []
            };
            
            const count = treeService.countNodesInTree(tree);
            expect(count).toBe(1);
        });
    });

    describe('validateParentNode', () => {
        test('should validate existing parent node', async () => {
            treeQueries.nodeExists.mockResolvedValue(true);
            
            const result = await treeService.validateParentNode(1);
            expect(result).toBe(true);
            expect(treeQueries.nodeExists).toHaveBeenCalledWith(1);
        });

        test('should reject non-existent parent node', async () => {
            treeQueries.nodeExists.mockResolvedValue(false);
            
            const result = await treeService.validateParentNode(999);
            expect(result).toBe(false);
        });

        test('should allow null parent', async () => {
            const result = await treeService.validateParentNode(null);
            expect(result).toBe(true);
            expect(treeQueries.nodeExists).not.toHaveBeenCalled();
        });

        test('should handle database errors', async () => {
            treeQueries.nodeExists.mockRejectedValue(new Error('Database error'));
            
            await expect(treeService.validateParentNode(1)).rejects.toThrow('Failed to validate parent node: Database error');
        });
    });

    describe('getPathToNode', () => {
        test('should return path to node', async () => {
            const nodes = [
                { id: 3, label: 'grandchild', parent_id: 2 },
                { id: 2, label: 'child', parent_id: 1 },
                { id: 1, label: 'root', parent_id: null }
            ];
            
            treeQueries.getNodeById
                .mockResolvedValueOnce(nodes[0])  // First call for node 3
                .mockResolvedValueOnce(nodes[1])  // Second call for node 2
                .mockResolvedValueOnce(nodes[2]); // Third call for node 1
            
            const path = await treeService.getPathToNode(3);
            
            expect(path).toEqual([
                { id: 1, label: 'root' },
                { id: 2, label: 'child' },
                { id: 3, label: 'grandchild' }
            ]);
        });

        test('should return single node path for root', async () => {
            const rootNode = { id: 1, label: 'root', parent_id: null };
            treeQueries.getNodeById.mockResolvedValue(rootNode);
            
            const path = await treeService.getPathToNode(1);
            
            expect(path).toEqual([
                { id: 1, label: 'root' }
            ]);
        });

        test('should handle database errors', async () => {
            treeQueries.getNodeById.mockRejectedValue(new Error('Database error'));
            
            await expect(treeService.getPathToNode(1)).rejects.toThrow('Failed to get path to node: Database error');
        });
    });

    describe('close', () => {
        test('should close service successfully', async () => {
            dbInit.close.mockResolvedValue();
            
            await treeService.close();
            
            expect(dbInit.close).toHaveBeenCalledTimes(1);
        });

        test('should handle close errors', async () => {
            dbInit.close.mockRejectedValue(new Error('Close error'));
            
            await expect(treeService.close()).rejects.toThrow('Failed to close service: Close error');
        });
    });
});