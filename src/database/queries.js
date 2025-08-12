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
     * Create multiple nodes in a single transaction
     * @param {Array<{label: string, parentId: number|null}>} nodeData - Array of node data to create
     * @returns {Promise<Array>} Array of created nodes with their new IDs
     */
    async createMultipleNodes(nodeData) {
        if (!Array.isArray(nodeData) || nodeData.length === 0) {
            throw new Error('Node data must be a non-empty array');
        }

        try {
            await dbConnection.beginTransaction();
            const createdNodes = [];

            for (const data of nodeData) {
                // Validate parent exists if parentId is provided
                if (data.parentId !== null && data.parentId !== undefined) {
                    const parentExists = await this.nodeExists(data.parentId);
                    if (!parentExists) {
                        throw new Error(`Parent node with ID ${data.parentId} does not exist`);
                    }
                }

                const sql = `INSERT INTO nodes (label, parent_id) VALUES (?, ?)`;
                const result = await dbConnection.run(sql, [data.label, data.parentId]);
                const newNode = await this.getNodeById(result.id);
                createdNodes.push(newNode);
            }

            await dbConnection.commitTransaction();
            return createdNodes;
        } catch (error) {
            await dbConnection.rollbackTransaction();
            throw new Error(`Failed to create multiple nodes: ${error.message}`);
        }
    }

    /**
     * Get all ancestors of a node (path from node to root)
     * @param {number} nodeId - Node ID to get ancestors for
     * @returns {Promise<Array>} Array of ancestor nodes from immediate parent to root
     */
    async getAncestors(nodeId) {
        const ancestors = [];
        let currentNode = await this.getNodeById(nodeId);
        
        while (currentNode && currentNode.parent_id !== null) {
            const parent = await this.getNodeById(currentNode.parent_id);
            if (parent) {
                ancestors.push(parent);
                currentNode = parent;
            } else {
                break;
            }
        }
        
        return ancestors;
    }

    /**
     * Get all ancestor IDs of a node (for efficient circular reference checking)
     * @param {number} nodeId - Node ID to get ancestor IDs for
     * @returns {Promise<Array<number>>} Array of ancestor node IDs
     */
    async getAncestorIds(nodeId) {
        const ancestorIds = [];
        let currentNodeId = nodeId;
        
        // Prevent infinite loops by limiting depth
        let depth = 0;
        const maxDepth = 1000;
        
        while (currentNodeId && depth < maxDepth) {
            const node = await this.getNodeById(currentNodeId);
            if (!node || node.parent_id === null) {
                break;
            }
            
            ancestorIds.push(node.parent_id);
            currentNodeId = node.parent_id;
            depth++;
        }
        
        return ancestorIds;
    }

    /**
     * Check if nodeA is an ancestor of nodeB (for circular reference prevention)
     * @param {number} potentialAncestorId - ID of potential ancestor node
     * @param {number} nodeId - ID of node to check
     * @returns {Promise<boolean>} True if potentialAncestorId is an ancestor of nodeId
     */
    async isAncestor(potentialAncestorId, nodeId) {
        if (potentialAncestorId === nodeId) {
            return true; // A node is considered its own ancestor for circular prevention
        }
        
        const ancestorIds = await this.getAncestorIds(nodeId);
        return ancestorIds.includes(potentialAncestorId);
    }

    /**
     * Get the depth/level of a node in the tree (distance from root)
     * @param {number} nodeId - Node ID to get depth for
     * @returns {Promise<number>} Depth of the node (0 for root nodes)
     */
    async getNodeDepth(nodeId) {
        const ancestors = await this.getAncestors(nodeId);
        return ancestors.length;
    }

    /**
     * Get all nodes at a specific depth level
     * @param {number} depth - Depth level to retrieve (0 for root nodes)
     * @returns {Promise<Array>} Array of nodes at the specified depth
     */
    async getNodesAtDepth(depth) {
        if (depth === 0) {
            return await this.getRootNodes();
        }
        
        // For deeper levels, we need to traverse the tree
        const allNodes = await this.getAllNodes();
        const nodesAtDepth = [];
        
        for (const node of allNodes) {
            const nodeDepth = await this.getNodeDepth(node.id);
            if (nodeDepth === depth) {
                nodesAtDepth.push(node);
            }
        }
        
        return nodesAtDepth;
    }

    /**
     * Get subtree size (count of descendants) for a node
     * @param {number} nodeId - Node ID to count descendants for
     * @returns {Promise<number>} Number of descendant nodes
     */
    async getSubtreeSize(nodeId) {
        const descendants = await this.getAllDescendants(nodeId);
        return descendants.length;
    }

    /**
     * Update multiple nodes in a single transaction
     * @param {Array<{id: number, label?: string, parentId?: number|null}>} updates - Array of updates to apply
     * @returns {Promise<Array>} Array of updated nodes
     */
    async updateMultipleNodes(updates) {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new Error('Updates must be a non-empty array');
        }

        try {
            await dbConnection.beginTransaction();
            const updatedNodes = [];

            for (const update of updates) {
                if (!update.id) {
                    throw new Error('Each update must include a node ID');
                }

                // Build dynamic SQL based on what fields are being updated
                const fieldsToUpdate = [];
                const params = [];

                if (update.label !== undefined) {
                    fieldsToUpdate.push('label = ?');
                    params.push(update.label);
                }

                if (update.parentId !== undefined) {
                    // Validate parent exists if not null
                    if (update.parentId !== null) {
                        const parentExists = await this.nodeExists(update.parentId);
                        if (!parentExists) {
                            throw new Error(`Parent node with ID ${update.parentId} does not exist`);
                        }
                    }
                    fieldsToUpdate.push('parent_id = ?');
                    params.push(update.parentId);
                }

                if (fieldsToUpdate.length === 0) {
                    continue; // Skip if no fields to update
                }

                params.push(update.id); // Add ID for WHERE clause
                const sql = `UPDATE nodes SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
                
                const result = await dbConnection.run(sql, params);
                if (result.changes === 0) {
                    throw new Error(`Node with ID ${update.id} not found`);
                }

                const updatedNode = await this.getNodeById(update.id);
                updatedNodes.push(updatedNode);
            }

            await dbConnection.commitTransaction();
            return updatedNodes;
        } catch (error) {
            await dbConnection.rollbackTransaction();
            throw new Error(`Failed to update multiple nodes: ${error.message}`);
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

    async moveNodeAndSubtree(sourceNodeId, newParentId) {
        try {
            await dbConnection.beginTransaction();
            const sourceNode = await this.getNodeById(sourceNodeId);
            if (!sourceNode) {
                throw new Error(`Source node with ID ${sourceNodeId} not found`);
            }
    
            const descendants = await this.getAllDescendants(sourceNodeId);
            const parentIdMap = new Map();
            parentIdMap.set(sourceNodeId, newParentId);

            for (const descendant of descendants) {
                const oldParentId = descendant.parent_id;
                if (parentIdMap.has(oldParentId)) {
                    parentIdMap.set(descendant.id, parentIdMap.get(oldParentId));
                }
            }
            
            const update = [];
            

            const updateSourceSql = `UPDATE nodes SET parent_id = ? WHERE id = ?`;
            update.push(dbConnection.run(updateSourceSql, [newParentId, sourceNodeId]));
            
            for (const descendant of descendants) {
                const newParentIdForDescendant = parentIdMap.get(descendant.id);
                if (newParentIdForDescendant !== undefined) {
                    const updateDescendantSql = `UPDATE nodes SET parent_id = ? WHERE id = ?`;
                    update.push(dbConnection.run(updateDescendantSql, [newParentIdForDescendant, descendant.id]));
                }
            }
            

            await Promise.all(update);
            await dbConnection.commitTransaction();
            return await this.getNodeById(sourceNodeId);
            
        } catch (error) {
            await dbConnection.rollbackTransaction();
            throw new Error(`Failed to move node and subtree: ${error.message}`);
        }
    }
}

module.exports = new TreeQueries();