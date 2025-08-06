const dbConnection = require('./connection');

class TreeQueries {
    /**
     * Create a new node in the tree
     * @param {string} label - Label for the new node
     * @param {number|null} parentId - ID of parent node (null for root nodes)
     * @returns {Promise<Object>} Created node with ID
     */
    async createNode(label, parentId = null) {
        // Validate parent exists if parentId is provided
        if (parentId !== null && parentId !== undefined) {
            const parentExists = await this.nodeExists(parentId);
            if (!parentExists) {
                throw new Error(`Parent node with ID ${parentId} does not exist`);
            }
        }

        const sql = `
            INSERT INTO nodes (label, parent_id) 
            VALUES (?, ?)
        `;
        
        try {
            const result = await dbConnection.run(sql, [label, parentId]);
            
            // Return the created node
            return await this.getNodeById(result.id);
        } catch (error) {
            throw new Error(`Failed to create node: ${error.message}`);
        }
    }

    /**
     * Get a node by its ID
     * @param {number} id - Node ID
     * @returns {Promise<Object|null>} Node object or null if not found
     */
    async getNodeById(id) {
        const sql = `
            SELECT id, label, parent_id, created_at 
            FROM nodes 
            WHERE id = ?
        `;
        
        try {
            const row = await dbConnection.get(sql, [id]);
            return row || null;
        } catch (error) {
            throw new Error(`Failed to get node by ID: ${error.message}`);
        }
    }

    /**
     * Get all nodes from the database
     * @returns {Promise<Array>} Array of all nodes
     */
    async getAllNodes() {
        const sql = `
            SELECT id, label, parent_id, created_at 
            FROM nodes 
            ORDER BY parent_id, id
        `;
        
        try {
            const rows = await dbConnection.all(sql);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get all nodes: ${error.message}`);
        }
    }

    /**
     * Get all children of a specific node
     * @param {number} parentId - Parent node ID
     * @returns {Promise<Array>} Array of child nodes
     */
    async getChildrenByParentId(parentId) {
        const sql = `
            SELECT id, label, parent_id, created_at 
            FROM nodes 
            WHERE parent_id = ?
            ORDER BY id
        `;
        
        try {
            const rows = await dbConnection.all(sql, [parentId]);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get children: ${error.message}`);
        }
    }

    /**
     * Get all root nodes (nodes without parent)
     * @returns {Promise<Array>} Array of root nodes
     */
    async getRootNodes() {
        const sql = `
            SELECT id, label, parent_id, created_at 
            FROM nodes 
            WHERE parent_id IS NULL
            ORDER BY id
        `;
        
        try {
            const rows = await dbConnection.all(sql);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get root nodes: ${error.message}`);
        }
    }

    /**
     * Check if a node exists
     * @param {number} id - Node ID to check
     * @returns {Promise<boolean>} True if node exists, false otherwise
     */
    async nodeExists(id) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM nodes 
            WHERE id = ?
        `;
        
        try {
            const result = await dbConnection.get(sql, [id]);
            return result.count > 0;
        } catch (error) {
            throw new Error(`Failed to check if node exists: ${error.message}`);
        }
    }

    /**
     * Update a node's label
     * @param {number} id - Node ID
     * @param {string} label - New label
     * @returns {Promise<Object|null>} Updated node or null if not found
     */
    async updateNodeLabel(id, label) {
        const sql = `
            UPDATE nodes 
            SET label = ? 
            WHERE id = ?
        `;
        
        try {
            const result = await dbConnection.run(sql, [label, id]);
            
            if (result.changes === 0) {
                return null; // Node not found
            }
            
            return await this.getNodeById(id);
        } catch (error) {
            throw new Error(`Failed to update node: ${error.message}`);
        }
    }

    /**
     * Delete a node and all its descendants
     * @param {number} id - Node ID to delete
     * @returns {Promise<number>} Number of deleted nodes
     */
    async deleteNode(id) {
        // First get all descendant IDs
        const descendants = await this.getAllDescendants(id);
        const allIds = [id, ...descendants.map(node => node.id)];
        
        const sql = `
            DELETE FROM nodes 
            WHERE id IN (${allIds.map(() => '?').join(',')})
        `;
        
        try {
            const result = await dbConnection.run(sql, allIds);
            return result.changes;
        } catch (error) {
            throw new Error(`Failed to delete node: ${error.message}`);
        }
    }

    /**
     * Get all descendants of a node (recursive)
     * @param {number} nodeId - Parent node ID
     * @returns {Promise<Array>} Array of all descendant nodes
     */
    async getAllDescendants(nodeId) {
        const descendants = [];
        const children = await this.getChildrenByParentId(nodeId);
        
        for (const child of children) {
            descendants.push(child);
            const childDescendants = await this.getAllDescendants(child.id);
            descendants.push(...childDescendants);
        }
        
        return descendants;
    }

    /**
     * Get node count in database
     * @returns {Promise<number>} Total number of nodes
     */
    async getNodeCount() {
        const sql = `SELECT COUNT(*) as count FROM nodes`;
        
        try {
            const result = await dbConnection.get(sql);
            return result.count;
        } catch (error) {
            throw new Error(`Failed to get node count: ${error.message}`);
        }
    }

    /**
     * Clear all nodes from database (for testing)
     * @returns {Promise<number>} Number of deleted nodes
     */
    async clearAllNodes() {
        const sql = `DELETE FROM nodes`;
        
        try {
            const result = await dbConnection.run(sql);
            return result.changes;
        } catch (error) {
            throw new Error(`Failed to clear nodes: ${error.message}`);
        }
    }
}

module.exports = new TreeQueries();