const treeService = require('../services/treeService');

/**
 * TreeController handles HTTP requests for tree operations
 * Implements the API endpoints as specified in the problem statement
 */
class TreeController {
    /**
     * GET /api/tree
     * Returns an array of all trees that exist in the database
     * 
     * @swagger
     * /tree:
     *   get:
     *     summary: Get all trees
     *     description: Retrieves all trees in the database in hierarchical format
     *     tags: [trees]
     *     responses:
     *       200:
     *         description: Successfully retrieved all trees
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/TreeNode'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     * 
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Promise that resolves when the response is sent
     * @throws {Error} When database operation fails
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
     * 
     * @swagger
     * /tree:
     *   post:
     *     summary: Create a new node
     *     description: Creates a new node and attaches it to the specified parent node
     *     tags: [trees]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateNodeRequest'
     *     responses:
     *       201:
     *         description: Node created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CreatedNode'
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       404:
     *         $ref: '#/components/responses/ParentNotFound'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     * 
     * @param {import('express').Request} req - Express request object containing label and parentId in body
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Promise that resolves when the response is sent
     * @throws {Error} When validation fails or database operation fails
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
     * Performs comprehensive validation of label and parentId fields
     * 
     * @param {Object} body - Request body to validate
     * @param {string} body.label - Node label (required, 1-255 characters)
     * @param {number|null} body.parentId - Parent node ID (required, positive integer or null)
     * @returns {string|null} Error message if validation fails, null if valid
     * @example
     * // Valid request body
     * const validBody = { label: "test node", parentId: 1 };
     * const error = validateCreateNodeRequest(validBody); // returns null
     * 
     * // Invalid request body
     * const invalidBody = { label: "", parentId: "invalid" };
     * const error = validateCreateNodeRequest(invalidBody); // returns error message
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
     * 
     * @swagger
     * /tree/{id}:
     *   get:
     *     summary: Get tree by ID
     *     description: Retrieves a specific tree by its root node ID
     *     tags: [trees]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: The ID of the root node
     *         schema:
     *           type: integer
     *           minimum: 1
     *     responses:
     *       200:
     *         description: Successfully retrieved the tree
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TreeNode'
     *       400:
     *         $ref: '#/components/responses/InvalidId'
     *       404:
     *         $ref: '#/components/responses/TreeNotFound'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     * 
     * @param {import('express').Request} req - Express request object with id parameter
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Promise that resolves when the response is sent
     * @throws {Error} When tree ID is invalid or database operation fails
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
     * 
     * @swagger
     * /tree/stats:
     *   get:
     *     summary: Get service statistics
     *     description: Retrieves statistics about the tree service for monitoring
     *     tags: [monitoring]
     *     responses:
     *       200:
     *         description: Successfully retrieved statistics
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceStats'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     * 
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Promise that resolves when the response is sent
     * @throws {Error} When database operation fails
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
     * 
     * @swagger
     * /tree/node/{id}/path:
     *   get:
     *     summary: Get node path
     *     description: Retrieves the path from root to a specific node
     *     tags: [nodes]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: The ID of the target node
     *         schema:
     *           type: integer
     *           minimum: 1
     *     responses:
     *       200:
     *         description: Successfully retrieved the node path
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/NodePath'
     *       400:
     *         $ref: '#/components/responses/InvalidId'
     *       404:
     *         $ref: '#/components/responses/NodeNotFound'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     * 
     * @param {import('express').Request} req - Express request object with id parameter
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Promise that resolves when the response is sent
     * @throws {Error} When node ID is invalid or database operation fails
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
     * Tests database connectivity and returns service health status
     * 
     * @swagger
     * /health:
     *   get:
     *     summary: Health check
     *     description: Checks the health status of the API service
     *     tags: [monitoring]
     *     responses:
     *       200:
     *         description: Service is healthy
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthResponse'
     *       503:
     *         description: Service is unhealthy
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UnhealthyResponse'
     * 
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Promise that resolves when the response is sent
     * @throws {Error} When service health check fails
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
     * Returns a standardized 404 response with available endpoints
     * 
     * @param {import('express').Request} req - Express request object
     * @param {import('express').Response} res - Express response object
     * @returns {void} Sends 404 response with available endpoints
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