const treeService = require('../services/treeService');

/**
 * TreeController handles HTTP requests for tree operations
 * Implements the API endpoints as specified in the problem statement
 */
class TreeController {
    /**
     * GET /api/tree
     * Returns an array of all trees that exist in the database
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getAllTrees = async (req, res) => {
        try {
            console.log('GET /api/tree - Fetching all trees');
            
            const trees = await treeService.getAllTrees();
            
            // Return the trees in the exact format specified in problem statement
            res.status(200).json(trees);
            
            console.log(`GET /api/tree - Success: Returned ${trees.length} trees`);
        } catch (error) {
            console.error('GET /api/tree - Error:', error.message);
            
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve trees',
                details: error.message
            });
        }
    }

    /**
     * POST /api/tree
     * Creates a new node and attaches it to the specified parent node in the tree
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    createNode = async (req, res) => {
        try {
            const { label, parentId } = req.body;
            
            console.log('POST /api/tree - Creating node:', { label, parentId });
            
            // Validate request body
            const validationError = this.validateCreateNodeRequest(req.body);
            if (validationError) {
                console.log('POST /api/tree - Validation error:', validationError);
                return res.status(400).json({
                    error: 'Bad request',
                    message: validationError
                });
            }
            
            // Create the node using service layer
            const newNode = await treeService.createNode(label, parentId);
            
            // Return the created node with 201 status
            res.status(201).json(newNode);
            
            console.log('POST /api/tree - Success: Created node with ID', newNode.id);
        } catch (error) {
            console.error('POST /api/tree - Error:', error.message);
            
            // Check if it's a validation/business logic error
            if (error.message.includes('Parent node') || 
                error.message.includes('does not exist') ||
                error.message.includes('Label') ||
                error.message.includes('Parent ID')) {
                
                // Check specifically for parent not found
                if (error.message.includes('does not exist')) {
                    return res.status(404).json({
                        error: 'Parent not found',
                        message: error.message
                    });
                }
                
                // Other validation errors
                return res.status(400).json({
                    error: 'Bad request',
                    message: error.message
                });
            }
            
            // Internal server error
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to create node',
                details: error.message
            });
        }
    }

    /**
     * Validate the request body for creating a new node
     * @param {Object} body - Request body
     * @returns {string|null} Error message or null if valid
     */
    validateCreateNodeRequest(body) {
        // Check if body exists
        if (!body || typeof body !== 'object') {
            return 'Request body is required';
        }

        // Validate label
        if (!body.hasOwnProperty('label')) {
            return 'Label is required';
        }

        if (typeof body.label !== 'string') {
            return 'Label must be a string';
        }

        if (body.label.trim().length === 0) {
            return 'Label cannot be empty';
        }

        if (body.label.length > 255) {
            return 'Label cannot be longer than 255 characters';
        }

        // Validate parentId
        if (!body.hasOwnProperty('parentId')) {
            return 'ParentId is required';
        }

        // parentId can be null (for root nodes) or a positive integer
        if (body.parentId !== null) {
            if (!Number.isInteger(body.parentId)) {
                return 'ParentId must be an integer or null';
            }
            
            if (body.parentId <= 0) {
                return 'ParentId must be a positive integer or null';
            }
        }

        return null; // No validation errors
    }

    /**
     * GET /api/tree/:id
     * Get a specific tree by root node ID (additional endpoint for flexibility)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getTreeById = async (req, res) => {
        try {
            const treeId = parseInt(req.params.id);
            
            if (!Number.isInteger(treeId) || treeId <= 0) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'Tree ID must be a positive integer'
                });
            }
            
            console.log('GET /api/tree/:id - Fetching tree with ID:', treeId);
            
            const tree = await treeService.getTreeByRootId(treeId);
            
            if (!tree) {
                console.log('GET /api/tree/:id - Tree not found:', treeId);
                return res.status(404).json({
                    error: 'Tree not found',
                    message: `Tree with root ID ${treeId} does not exist`
                });
            }
            
            res.status(200).json(tree);
            
            console.log('GET /api/tree/:id - Success: Returned tree with ID', treeId);
        } catch (error) {
            console.error('GET /api/tree/:id - Error:', error.message);
            
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve tree',
                details: error.message
            });
        }
    }

    /**
     * GET /api/tree/stats
     * Get statistics about the tree service (additional endpoint for monitoring)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getStats = async (req, res) => {
        try {
            console.log('GET /api/tree/stats - Fetching service statistics');
            
            const stats = await treeService.getStats();
            
            res.status(200).json(stats);
            
            console.log('GET /api/tree/stats - Success: Returned statistics');
        } catch (error) {
            console.error('GET /api/tree/stats - Error:', error.message);
            
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve statistics',
                details: error.message
            });
        }
    }

    /**
     * GET /api/tree/node/:id/path
     * Get the path from root to a specific node (additional endpoint for navigation)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getNodePath = async (req, res) => {
        try {
            const nodeId = parseInt(req.params.id);
            
            if (!Number.isInteger(nodeId) || nodeId <= 0) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'Node ID must be a positive integer'
                });
            }
            
            console.log('GET /api/tree/node/:id/path - Fetching path for node:', nodeId);
            
            const path = await treeService.getPathToNode(nodeId);
            
            if (!path || path.length === 0) {
                return res.status(404).json({
                    error: 'Node not found',
                    message: `Node with ID ${nodeId} does not exist`
                });
            }
            
            res.status(200).json({
                nodeId: nodeId,
                path: path,
                depth: path.length
            });
            
            console.log('GET /api/tree/node/:id/path - Success: Returned path for node', nodeId);
        } catch (error) {
            console.error('GET /api/tree/node/:id/path - Error:', error.message);
            
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve node path',
                details: error.message
            });
        }
    }

    /**
     * Health check endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    healthCheck = async (req, res) => {
        try {
            // Test database connectivity
            await treeService.initialize();
            
            res.status(200).json({
                status: 'healthy',
                message: 'Tree API is running',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Health check failed:', error.message);
            
            res.status(503).json({
                status: 'unhealthy',
                message: 'Service unavailable',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle 404 for unknown routes
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    notFound = (req, res) => {
        res.status(404).json({
            error: 'Not found',
            message: `Route ${req.method} ${req.path} not found`,
            availableEndpoints: [
                'GET /api/tree',
                'POST /api/tree',
                'GET /api/tree/:id',
                'GET /api/tree/stats',
                'GET /api/tree/node/:id/path',
                'GET /health'
            ]
        });
    }
}

module.exports = new TreeController();