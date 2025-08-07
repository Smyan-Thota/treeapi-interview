const treeQueries = require('../database/queries');
const dbInit = require('../database/init');

/**
 * TreeService handles business logic for tree operations
 * Provides hierarchical tree structure and validation
 */
class TreeService {
    constructor() {
        this.initialized = false;
        this.isShutdown = false;
    }

    /**
     * Initialize the service (ensure database is ready)
     */
    async initialize() {
        if (this.isShutdown) {
            throw new Error('Service has been shut down and cannot be reinitialized');
        }
        if (!this.initialized) {
            await dbInit.initialize();
            this.initialized = true;
        }
    }

    /**
     * Get all trees in hierarchical format
     * Returns array of root nodes with nested children
     * @returns {Promise<Array>} Array of tree structures
     */
    async getAllTrees() {
        await this.initialize();
        
        try {
            // Get all nodes from database
            const allNodes = await treeQueries.getAllNodes();
            
            // Build hierarchical structure
            const trees = this.buildHierarchy(allNodes);
            
            return trees;
        } catch (error) {
            throw new Error(`Failed to get all trees: ${error.message}`);
        }
    }

    /**
     * Create a new node and attach it to the specified parent
     * @param {string} label - Label for the new node
     * @param {number|null} parentId - ID of parent node (null for root)
     * @returns {Promise<Object>} Created node object
     */
    async createNode(label, parentId = null) {
        await this.initialize();
        
        // Validate input
        this.validateNodeInput(label, parentId);
        
        try {
            // Create the node in database
            const newNode = await treeQueries.createNode(label, parentId);
            
            return {
                id: newNode.id,
                label: newNode.label,
                children: []
            };
        } catch (error) {
            throw new Error(`Failed to create node: ${error.message}`);
        }
    }

    /**
     * Get a single tree by root node ID
     * @param {number} rootId - ID of the root node
     * @returns {Promise<Object|null>} Tree structure or null if not found
     */
    async getTreeByRootId(rootId) {
        await this.initialize();
        
        try {
            // Get the root node
            const rootNode = await treeQueries.getNodeById(rootId);
            if (!rootNode) {
                return null;
            }
            
            // Get all descendants
            const descendants = await treeQueries.getAllDescendants(rootId);
            
            // Build hierarchy starting from this root
            const allNodes = [rootNode, ...descendants];
            const trees = this.buildHierarchy(allNodes);
            
            return trees.length > 0 ? trees[0] : null;
        } catch (error) {
            throw new Error(`Failed to get tree: ${error.message}`);
        }
    }

    /**
     * Get node with all its children (not just direct children)
     * @param {number} nodeId - ID of the node
     * @returns {Promise<Object|null>} Node with full subtree or null if not found
     */
    async getNodeWithSubtree(nodeId) {
        await this.initialize();
        
        try {
            // Get the node
            const node = await treeQueries.getNodeById(nodeId);
            if (!node) {
                return null;
            }
            
            // Get all descendants
            const descendants = await treeQueries.getAllDescendants(nodeId);
            
            // Build hierarchy starting from this node
            const allNodes = [node, ...descendants];
            const subtree = this.buildHierarchy(allNodes, nodeId);
            
            return subtree.length > 0 ? subtree[0] : null;
        } catch (error) {
            throw new Error(`Failed to get node subtree: ${error.message}`);
        }
    }

    /**
     * Build hierarchical tree structure from flat array of nodes
     * @param {Array} nodes - Flat array of node objects
     * @param {number|null} rootParentId - Parent ID to treat as root (null for actual roots)
     * @returns {Array} Array of tree structures with nested children
     */
    buildHierarchy(nodes, rootParentId = null) {
        if (!nodes || nodes.length === 0) {
            return [];
        }

        // Create a map for quick node lookup
        const nodeMap = new Map();
        nodes.forEach(node => {
            nodeMap.set(node.id, {
                id: node.id,
                label: node.label,
                children: []
            });
        });

        const trees = [];

        // Build the hierarchy
        nodes.forEach(node => {
            const treeNode = nodeMap.get(node.id);
            
            if (node.parent_id === rootParentId) {
                // This is a root node (for our purposes)
                trees.push(treeNode);
            } else if (nodeMap.has(node.parent_id)) {
                // Add this node as a child of its parent
                const parent = nodeMap.get(node.parent_id);
                parent.children.push(treeNode);
            }
        });

        // Sort children arrays by id for consistent output
        this.sortChildrenRecursively(trees);

        return trees;
    }

    /**
     * Sort children arrays recursively for consistent output
     * @param {Array} nodes - Array of nodes to sort
     */
    sortChildrenRecursively(nodes) {
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children.sort((a, b) => a.id - b.id);
                this.sortChildrenRecursively(node.children);
            }
        });
    }

    /**
     * Validate input for node creation
     * @param {string} label - Node label
     * @param {number|null} parentId - Parent ID
     */
    validateNodeInput(label, parentId) {
        // Validate label
        if (!label || typeof label !== 'string') {
            throw new Error('Label is required and must be a non-empty string');
        }
        
        if (label.trim().length === 0) {
            throw new Error('Label cannot be empty or just whitespace');
        }
        
        if (label.length > 255) {
            throw new Error('Label cannot be longer than 255 characters');
        }

        // Validate parentId
        if (parentId !== null && parentId !== undefined) {
            if (!Number.isInteger(parentId) || parentId <= 0) {
                throw new Error('Parent ID must be a positive integer');
            }
        }
    }

    /**
     * Get service statistics
     * @returns {Promise<Object>} Service statistics
     */
    async getStats() {
        await this.initialize();
        
        try {
            const dbStats = await dbInit.getStats();
            const allNodes = await treeQueries.getAllNodes();
            const trees = this.buildHierarchy(allNodes);
            
            return {
                database: dbStats,
                trees: {
                    count: trees.length,
                    totalNodes: allNodes.length,
                    structures: trees.map(tree => ({
                        rootId: tree.id,
                        rootLabel: tree.label,
                        nodeCount: this.countNodesInTree(tree)
                    }))
                }
            };
        } catch (error) {
            throw new Error(`Failed to get service stats: ${error.message}`);
        }
    }

    /**
     * Count total nodes in a tree structure
     * @param {Object} tree - Tree node
     * @returns {number} Total node count
     */
    countNodesInTree(tree) {
        let count = 1; // Count the current node
        
        if (tree.children && tree.children.length > 0) {
            tree.children.forEach(child => {
                count += this.countNodesInTree(child);
            });
        }
        
        return count;
    }

    /**
     * Validate that a parent node exists and can accept children
     * @param {number} parentId - Parent node ID
     * @returns {Promise<boolean>} True if valid parent
     */
    async validateParentNode(parentId) {
        if (!parentId) {
            return true; // null parent is valid (root node)
        }
        
        try {
            const parentExists = await treeQueries.nodeExists(parentId);
            return parentExists;
        } catch (error) {
            throw new Error(`Failed to validate parent node: ${error.message}`);
        }
    }

    /**
     * Get path from root to a specific node
     * @param {number} nodeId - Target node ID
     * @returns {Promise<Array>} Array of nodes from root to target
     */
    async getPathToNode(nodeId) {
        await this.initialize();
        
        try {
            const path = [];
            let currentNode = await treeQueries.getNodeById(nodeId);
            
            while (currentNode) {
                path.unshift({
                    id: currentNode.id,
                    label: currentNode.label
                });
                
                if (currentNode.parent_id) {
                    currentNode = await treeQueries.getNodeById(currentNode.parent_id);
                } else {
                    break;
                }
            }
            
            return path;
        } catch (error) {
            throw new Error(`Failed to get path to node: ${error.message}`);
        }
    }

    /**
     * Close service and database connections
     */
    async close() {
        try {
            await dbInit.close();
            this.initialized = false;
            this.isShutdown = true;
        } catch (error) {
            throw new Error(`Failed to close service: ${error.message}`);
        }
    }

    /**
     * Reset service state (for testing purposes)
     */
    reset() {
        this.initialized = false;
        this.isShutdown = false;
    }
}

module.exports = new TreeService();