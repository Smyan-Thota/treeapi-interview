const dbConnection = require('./connection');
const treeQueries = require('./queries');

class DatabaseInitializer {
    /**
     * Initialize the database with connection and schema
     */
    async initialize() {
        try {
            console.log('Initializing database...');
            await dbConnection.connect();
            console.log('Database initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize database:', error.message);
            throw error;
        }
    }

    /**
     * Reset database by clearing all data and reinitializing schema
     */
    async reset() {
        try {
            console.log('Resetting database...');
            
            // Clear existing data
            await treeQueries.clearAllNodes();
            
            // Reinitialize schema (will create sample data)
            await dbConnection.initializeSchema();
            
            console.log('Database reset successfully');
            return true;
        } catch (error) {
            console.error('Failed to reset database:', error.message);
            throw error;
        }
    }

    /**
     * Seed database with sample data for testing
     */
    async seed() {
        try {
            console.log('Seeding database with sample data...');
            
            // Check if we already have data
            const nodeCount = await treeQueries.getNodeCount();
            if (nodeCount > 0) {
                console.log('Database already has data, skipping seed');
                return false;
            }

            // Create sample tree structure as per problem statement
            const root = await treeQueries.createNode('root', null);
            const bear = await treeQueries.createNode('bear', root.id);
            const cat = await treeQueries.createNode('cat', bear.id);
            const frog = await treeQueries.createNode('frog', root.id);

            console.log('Sample data seeded successfully');
            console.log('Created nodes:', { root, bear, cat, frog });
            
            return true;
        } catch (error) {
            console.error('Failed to seed database:', error.message);
            throw error;
        }
    }

    /**
     * Close database connection
     */
    async close() {
        try {
            await dbConnection.close();
            return true;
        } catch (error) {
            console.error('Failed to close database:', error.message);
            throw error;
        }
    }

    /**
     * Test database connectivity and basic operations
     */
    async testConnection() {
        try {
            console.log('Testing database connection...');
            
            // Test connection
            await dbConnection.connect();
            
            // Test basic query
            const nodeCount = await treeQueries.getNodeCount();
            console.log(`Database connection test successful. Node count: ${nodeCount}`);
            
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error.message);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const nodeCount = await treeQueries.getNodeCount();
            const rootNodes = await treeQueries.getRootNodes();
            
            return {
                totalNodes: nodeCount,
                rootNodes: rootNodes.length,
                roots: rootNodes.map(node => ({
                    id: node.id,
                    label: node.label
                }))
            };
        } catch (error) {
            console.error('Failed to get database stats:', error.message);
            throw error;
        }
    }
}

module.exports = new DatabaseInitializer();