const express = require('express');
const treeController = require('../controllers/treeController');

/**
 * Tree API Routes
 * Defines all routes for tree operations as specified in the problem statement
 */
const router = express.Router();

/**
 * GET /api/tree
 * Returns an array of all trees that exist in the database
 */
router.get('/', treeController.getAllTrees);

/**
 * POST /api/tree
 * Creates a new node and attaches it to the specified parent node in the tree
 * Request body: { "label": "string", "parentId": number|null }
 */
router.post('/', treeController.createNode);

/**
 * POST /api/tree/move
 * Move a node and its entire subtree to a new parent
 * Request body: { "sourceNodeId": number, "targetParentId": number|null }
 */
router.post('/move', treeController.moveNode);

/**
 * GET /api/tree/stats
 * Get service statistics (additional endpoint for monitoring)
 */
router.get('/stats', treeController.getStats);

/**
 * GET /api/tree/detailed-stats
 * Get detailed service statistics including depth analysis
 */
router.get('/detailed-stats', treeController.getDetailedStats);

/**
 * GET /api/tree/validate/:id
 * Validate tree structure for a specific subtree
 */
router.get('/validate/:id', treeController.validateTreeStructure);

/**
 * GET /api/tree/node/:id/path
 * Get the path from root to a specific node (additional endpoint for navigation)
 */
router.get('/node/:id/path', treeController.getNodePath);

/**
 * GET /api/tree/:id
 * Get a specific tree by root node ID (additional endpoint for flexibility)
 */
router.get('/:id', treeController.getTreeById);

module.exports = router;