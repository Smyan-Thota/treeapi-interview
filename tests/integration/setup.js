/**
 * Integration Test Setup
 * Sets up test environment for integration tests with real database and server
 */

const { app } = require('../../src/app');
const dbInit = require('../../src/database/init');
const treeQueries = require('../../src/database/queries');

let server;

/**
 * Setup function to start server and prepare database for integration tests
 */
async function setupIntegrationTests() {
    try {
        // Initialize database
        await dbInit.initialize();
        
        // Start server on test port with dynamic port selection
        const testPort = process.env.TEST_PORT || (3001 + Math.floor(Math.random() * 1000));
        
        return new Promise((resolve, reject) => {
            server = app.listen(testPort, (error) => {
                if (error) {
                    // Try another port if this one is busy
                    const alternatePort = testPort + Math.floor(Math.random() * 100);
                    server = app.listen(alternatePort, async (retryError) => {
                        if (retryError) {
                            reject(retryError);
                        } else {
                            // Clear any existing test data
                            await treeQueries.clearAllNodes();
                            console.log(`Integration test server started on port ${alternatePort}`);
                            resolve(server);
                        }
                    });
                } else {
                    // Clear any existing test data
                    treeQueries.clearAllNodes().then(() => {
                        console.log(`Integration test server started on port ${testPort}`);
                        resolve(server);
                    }).catch(reject);
                }
            });
        });
    } catch (error) {
        console.error('Failed to setup integration tests:', error);
        throw error;
    }
}

/**
 * Teardown function to clean up after integration tests
 */
async function teardownIntegrationTests() {
    try {
        // Clear test data
        await treeQueries.clearAllNodes();
        
        // Close server with promise
        if (server) {
            await new Promise((resolve) => {
                server.close(() => {
                    resolve();
                });
            });
        }
        
        // Close database connection
        await dbInit.close();
        
        console.log('Integration tests cleaned up successfully');
    } catch (error) {
        console.error('Failed to cleanup integration tests:', error);
        throw error;
    }
}

/**
 * Reset database to clean state between tests
 */
async function resetDatabase() {
    try {
        await treeQueries.clearAllNodes();
    } catch (error) {
        console.error('Failed to reset database:', error);
        throw error;
    }
}

/**
 * Seed database with initial test data
 */
async function seedTestData() {
    try {
        // Create the sample tree structure from problem statement
        const root = await treeQueries.createNode('root', null);
        const bear = await treeQueries.createNode('bear', root.id);
        const cat = await treeQueries.createNode('cat', bear.id);
        const frog = await treeQueries.createNode('frog', root.id);
        
        return { root, bear, cat, frog };
    } catch (error) {
        console.error('Failed to seed test data:', error);
        throw error;
    }
}

module.exports = {
    setupIntegrationTests,
    teardownIntegrationTests,
    resetDatabase,
    seedTestData
};