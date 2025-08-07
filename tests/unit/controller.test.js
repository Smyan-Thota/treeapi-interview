/**
 * Unit Tests for Controller Layer
 * Tests HTTP request/response handling and business logic integration in isolation
 */

const treeController = require('../../src/controllers/treeController');
const treeService = require('../../src/services/treeService');

// Mock the service layer for true unit testing
jest.mock('../../src/services/treeService');

describe('TreeController Unit Tests', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create mock request and response objects
        mockReq = {
            body: {},
            params: {},
            method: 'GET',
            path: '/api/tree',
            originalUrl: '/api/tree'
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis()
        };

        // Mock console.log and console.error to avoid test output pollution
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console methods
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('getAllTrees', () => {
        test('should return all trees successfully', async () => {
            const mockTrees = [
                {
                    id: 1,
                    label: 'root',
                    children: [
                        {
                            id: 2,
                            label: 'child',
                            children: []
                        }
                    ]
                }
            ];

            treeService.getAllTrees.mockResolvedValue(mockTrees);

            await treeController.getAllTrees(mockReq, mockRes);

            expect(treeService.getAllTrees).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockTrees);
        });

        test('should handle service errors', async () => {
            const error = new Error('Service error');
            treeService.getAllTrees.mockRejectedValue(error);

            await treeController.getAllTrees(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Failed to retrieve trees',
                details: 'Service error'
            });
        });
    });

    describe('createNode', () => {
        test('should create node successfully', async () => {
            mockReq.body = { label: 'test-node', parentId: 1 };
            const mockCreatedNode = { id: 2, label: 'test-node', children: [] };

            treeService.createNode.mockResolvedValue(mockCreatedNode);

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).toHaveBeenCalledWith('test-node', 1);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockCreatedNode);
        });

        test('should create root node successfully', async () => {
            mockReq.body = { label: 'root-node', parentId: null };
            const mockCreatedNode = { id: 1, label: 'root-node', children: [] };

            treeService.createNode.mockResolvedValue(mockCreatedNode);

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).toHaveBeenCalledWith('root-node', null);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockCreatedNode);
        });

        test('should validate missing label', async () => {
            mockReq.body = { parentId: 1 };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Label is required'
            });
        });

        test('should validate empty label', async () => {
            mockReq.body = { label: '', parentId: 1 };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Label cannot be empty'
            });
        });

        test('should validate label type', async () => {
            mockReq.body = { label: 123, parentId: 1 };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Label must be a string'
            });
        });

        test('should validate missing parentId', async () => {
            mockReq.body = { label: 'test' };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'ParentId is required'
            });
        });

        test('should validate parentId type', async () => {
            mockReq.body = { label: 'test', parentId: 'invalid' };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'ParentId must be an integer or null'
            });
        });

        test('should validate positive parentId', async () => {
            mockReq.body = { label: 'test', parentId: -1 };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'ParentId must be a positive integer or null'
            });
        });

        test('should validate long label', async () => {
            const longLabel = 'a'.repeat(256);
            mockReq.body = { label: longLabel, parentId: 1 };

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Label cannot be longer than 255 characters'
            });
        });

        test('should validate empty request body', async () => {
            mockReq.body = null;

            await treeController.createNode(mockReq, mockRes);

            expect(treeService.createNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Failed to create node',
                details: expect.any(String)
            });
        });

        test('should handle parent not found error', async () => {
            mockReq.body = { label: 'test', parentId: 999 };
            const error = new Error('Parent node with ID 999 does not exist');

            treeService.createNode.mockRejectedValue(error);

            await treeController.createNode(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Parent not found',
                message: 'Parent node with ID 999 does not exist'
            });
        });

        test('should handle validation errors from service', async () => {
            mockReq.body = { label: 'test', parentId: 1 };
            const error = new Error('Label cannot be empty');

            treeService.createNode.mockRejectedValue(error);

            await treeController.createNode(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Label cannot be empty'
            });
        });

        test('should handle internal server errors', async () => {
            mockReq.body = { label: 'test', parentId: 1 };
            const error = new Error('Database connection failed');

            treeService.createNode.mockRejectedValue(error);

            await treeController.createNode(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Failed to create node',
                details: 'Database connection failed'
            });
        });
    });

    describe('getTreeById', () => {
        test('should return tree by ID successfully', async () => {
            mockReq.params.id = '1';
            const mockTree = {
                id: 1,
                label: 'root',
                children: []
            };

            treeService.getTreeByRootId.mockResolvedValue(mockTree);

            await treeController.getTreeById(mockReq, mockRes);

            expect(treeService.getTreeByRootId).toHaveBeenCalledWith(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockTree);
        });

        test('should return 404 for non-existent tree', async () => {
            mockReq.params.id = '999';

            treeService.getTreeByRootId.mockResolvedValue(null);

            await treeController.getTreeById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Tree not found',
                message: 'Tree with root ID 999 does not exist'
            });
        });

        test('should validate invalid ID parameter', async () => {
            mockReq.params.id = 'invalid';

            await treeController.getTreeById(mockReq, mockRes);

            expect(treeService.getTreeByRootId).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Tree ID must be a positive integer'
            });
        });

        test('should validate negative ID parameter', async () => {
            mockReq.params.id = '-1';

            await treeController.getTreeById(mockReq, mockRes);

            expect(treeService.getTreeByRootId).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Tree ID must be a positive integer'
            });
        });

        test('should handle service errors', async () => {
            mockReq.params.id = '1';
            const error = new Error('Service error');

            treeService.getTreeByRootId.mockRejectedValue(error);

            await treeController.getTreeById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Failed to retrieve tree',
                details: 'Service error'
            });
        });
    });

    describe('getStats', () => {
        test('should return service statistics', async () => {
            const mockStats = {
                database: { totalNodes: 5 },
                trees: { count: 2 }
            };

            treeService.getStats.mockResolvedValue(mockStats);

            await treeController.getStats(mockReq, mockRes);

            expect(treeService.getStats).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockStats);
        });

        test('should handle service errors', async () => {
            const error = new Error('Service error');
            treeService.getStats.mockRejectedValue(error);

            await treeController.getStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Failed to retrieve statistics',
                details: 'Service error'
            });
        });
    });

    describe('getNodePath', () => {
        test('should return node path successfully', async () => {
            mockReq.params.id = '4';
            const mockPath = [
                { id: 1, label: 'root' },
                { id: 2, label: 'child' },
                { id: 4, label: 'grandchild' }
            ];

            treeService.getPathToNode.mockResolvedValue(mockPath);

            await treeController.getNodePath(mockReq, mockRes);

            expect(treeService.getPathToNode).toHaveBeenCalledWith(4);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                nodeId: 4,
                path: mockPath,
                depth: 3
            });
        });

        test('should return 404 for non-existent node', async () => {
            mockReq.params.id = '999';

            treeService.getPathToNode.mockResolvedValue([]);

            await treeController.getNodePath(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Node not found',
                message: 'Node with ID 999 does not exist'
            });
        });

        test('should validate invalid node ID', async () => {
            mockReq.params.id = 'invalid';

            await treeController.getNodePath(mockReq, mockRes);

            expect(treeService.getPathToNode).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Bad request',
                message: 'Node ID must be a positive integer'
            });
        });

        test('should handle service errors', async () => {
            mockReq.params.id = '1';
            const error = new Error('Service error');

            treeService.getPathToNode.mockRejectedValue(error);

            await treeController.getNodePath(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Failed to retrieve node path',
                details: 'Service error'
            });
        });
    });

    describe('healthCheck', () => {
        test('should return healthy status', async () => {
            treeService.initialize.mockResolvedValue();

            await treeController.healthCheck(mockReq, mockRes);

            expect(treeService.initialize).toHaveBeenCalledTimes(1);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'healthy',
                message: 'Tree API is running',
                timestamp: expect.any(String)
            });
        });

        test('should return unhealthy status on service failure', async () => {
            const error = new Error('Database connection failed');
            treeService.initialize.mockRejectedValue(error);

            await treeController.healthCheck(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'unhealthy',
                message: 'Service unavailable',
                error: 'Database connection failed',
                timestamp: expect.any(String)
            });
        });
    });

    describe('validateCreateNodeRequest', () => {
        test('should validate correct request body', () => {
            const validBody = { label: 'test', parentId: 1 };
            const result = treeController.validateCreateNodeRequest(validBody);
            expect(result).toBeNull();
        });

        test('should validate request body with null parentId', () => {
            const validBody = { label: 'test', parentId: null };
            const result = treeController.validateCreateNodeRequest(validBody);
            expect(result).toBeNull();
        });

        test('should reject missing request body', () => {
            const result = treeController.validateCreateNodeRequest(null);
            expect(result).toBe('Request body is required');
        });

        test('should reject non-object request body', () => {
            const result = treeController.validateCreateNodeRequest('string');
            expect(result).toBe('Request body is required');
        });

        test('should reject missing label', () => {
            const invalidBody = { parentId: 1 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('Label is required');
        });

        test('should reject non-string label', () => {
            const invalidBody = { label: 123, parentId: 1 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('Label must be a string');
        });

        test('should reject empty label', () => {
            const invalidBody = { label: '', parentId: 1 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('Label cannot be empty');
        });

        test('should reject whitespace-only label', () => {
            const invalidBody = { label: '   ', parentId: 1 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('Label cannot be empty');
        });

        test('should reject long label', () => {
            const longLabel = 'a'.repeat(256);
            const invalidBody = { label: longLabel, parentId: 1 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('Label cannot be longer than 255 characters');
        });

        test('should reject missing parentId', () => {
            const invalidBody = { label: 'test' };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('ParentId is required');
        });

        test('should reject non-integer parentId', () => {
            const invalidBody = { label: 'test', parentId: 'invalid' };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('ParentId must be an integer or null');
        });

        test('should reject negative parentId', () => {
            const invalidBody = { label: 'test', parentId: -1 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('ParentId must be a positive integer or null');
        });

        test('should reject zero parentId', () => {
            const invalidBody = { label: 'test', parentId: 0 };
            const result = treeController.validateCreateNodeRequest(invalidBody);
            expect(result).toBe('ParentId must be a positive integer or null');
        });
    });
});