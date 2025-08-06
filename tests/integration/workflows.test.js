/**
 * Integration Tests for End-to-End Workflows
 * Tests complete user workflows and business scenarios
 */

const request = require('supertest');
const { app } = require('../../src/app');
const { setupIntegrationTests, teardownIntegrationTests, resetDatabase } = require('./setup');

describe('End-to-End Workflow Integration Tests', () => {
    let server;

    beforeAll(async () => {
        server = await setupIntegrationTests();
    });

    afterAll(async () => {
        await teardownIntegrationTests();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    describe('Problem Statement Workflow', () => {
        test('should implement the exact example from problem statement', async () => {
            // Create the exact tree structure from the problem statement
            
            // Step 1: Create root node
            const rootResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'root', parentId: null })
                .expect(201);

            const rootId = rootResponse.body.id;

            // Step 2: Create bear node
            const bearResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'bear', parentId: rootId })
                .expect(201);

            const bearId = bearResponse.body.id;

            // Step 3: Create cat node under bear
            const catResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'cat', parentId: bearId })
                .expect(201);

            const catId = catResponse.body.id;

            // Step 4: Create frog node under root
            const frogResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'frog', parentId: rootId })
                .expect(201);

            // Step 5: Verify the complete tree structure matches problem statement
            const treesResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(treesResponse.body).toEqual([
                {
                    id: rootId,
                    label: 'root',
                    children: [
                        {
                            id: bearId,
                            label: 'bear',
                            children: [
                                {
                                    id: catId,
                                    label: 'cat',
                                    children: []
                                }
                            ]
                        },
                        {
                            id: frogResponse.body.id,
                            label: 'frog',
                            children: []
                        }
                    ]
                }
            ]);

            // Step 6: Test the POST example from problem statement
            const newNodeResponse = await request(app)
                .post('/api/tree')
                .send({ label: "cat's child", parentId: catId })
                .expect(201);

            // Step 7: Verify the new node is added correctly
            const updatedTreesResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            const catNode = updatedTreesResponse.body[0].children[0].children[0];
            expect(catNode.label).toBe('cat');
            expect(catNode.children).toHaveLength(1);
            expect(catNode.children[0].label).toBe("cat's child");
        });
    });

    describe('Complex Tree Building Workflows', () => {
        test('should build and navigate multi-level organization tree', async () => {
            // Simulate building an organizational hierarchy
            
            // Create CEO
            const ceoResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'CEO', parentId: null })
                .expect(201);

            const ceoId = ceoResponse.body.id;

            // Create departments
            const engineeringResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Engineering', parentId: ceoId })
                .expect(201);

            const salesResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Sales', parentId: ceoId })
                .expect(201);

            const hrResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'HR', parentId: ceoId })
                .expect(201);

            // Create teams under engineering
            const frontendResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Frontend Team', parentId: engineeringResponse.body.id })
                .expect(201);

            const backendResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Backend Team', parentId: engineeringResponse.body.id })
                .expect(201);

            // Create employees under teams
            await request(app)
                .post('/api/tree')
                .send({ label: 'Alice (Frontend Dev)', parentId: frontendResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Bob (Frontend Dev)', parentId: frontendResponse.body.id })
                .expect(201);

            const charlieResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Charlie (Backend Dev)', parentId: backendResponse.body.id })
                .expect(201);

            // Test navigation: Get path from CEO to Charlie
            const pathResponse = await request(app)
                .get(`/api/tree/node/${charlieResponse.body.id}/path`)
                .expect(200);

            expect(pathResponse.body.path).toEqual([
                { id: ceoId, label: 'CEO' },
                { id: engineeringResponse.body.id, label: 'Engineering' },
                { id: backendResponse.body.id, label: 'Backend Team' },
                { id: charlieResponse.body.id, label: 'Charlie (Backend Dev)' }
            ]);

            expect(pathResponse.body.depth).toBe(4);

            // Test statistics
            const statsResponse = await request(app)
                .get('/api/tree/stats')
                .expect(200);

            expect(statsResponse.body.database.totalNodes).toBe(9);
            expect(statsResponse.body.database.rootNodes).toBe(1);
            expect(statsResponse.body.trees.count).toBe(1);
        });

        test('should handle complex file system-like hierarchy', async () => {
            // Simulate a file system structure
            
            // Create root directory
            const rootResponse = await request(app)
                .post('/api/tree')
                .send({ label: '/', parentId: null })
                .expect(201);

            const rootId = rootResponse.body.id;

            // Create main directories
            const homeResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'home', parentId: rootId })
                .expect(201);

            const varResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'var', parentId: rootId })
                .expect(201);

            // Create user directory
            const userResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'user', parentId: homeResponse.body.id })
                .expect(201);

            // Create user subdirectories
            const documentsResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'documents', parentId: userResponse.body.id })
                .expect(201);

            const downloadsResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'downloads', parentId: userResponse.body.id })
                .expect(201);

            // Create files
            await request(app)
                .post('/api/tree')
                .send({ label: 'readme.txt', parentId: documentsResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'photo.jpg', parentId: downloadsResponse.body.id })
                .expect(201);

            // Test getting specific subtree (user directory)
            const userTreeResponse = await request(app)
                .get(`/api/tree/${userResponse.body.id}`)
                .expect(200);

            expect(userTreeResponse.body.label).toBe('user');
            expect(userTreeResponse.body.children).toHaveLength(2);

            const docDir = userTreeResponse.body.children.find(c => c.label === 'documents');
            const dlDir = userTreeResponse.body.children.find(c => c.label === 'downloads');

            expect(docDir.children).toHaveLength(1);
            expect(docDir.children[0].label).toBe('readme.txt');

            expect(dlDir.children).toHaveLength(1);
            expect(dlDir.children[0].label).toBe('photo.jpg');
        });
    });

    describe('Multi-Tree Management Workflows', () => {
        test('should manage multiple independent trees', async () => {
            // Create multiple independent tree structures
            
            // Tree 1: Product categories
            const electronicsResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Electronics', parentId: null })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Laptops', parentId: electronicsResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Phones', parentId: electronicsResponse.body.id })
                .expect(201);

            // Tree 2: Geographic regions
            const worldResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'World', parentId: null })
                .expect(201);

            const usaResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'USA', parentId: worldResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'California', parentId: usaResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'New York', parentId: usaResponse.body.id })
                .expect(201);

            // Tree 3: Simple flat tree
            await request(app)
                .post('/api/tree')
                .send({ label: 'Standalone Item', parentId: null })
                .expect(201);

            // Verify all trees exist independently
            const allTreesResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(allTreesResponse.body).toHaveLength(3);

            const treeLabels = allTreesResponse.body.map(tree => tree.label).sort();
            expect(treeLabels).toEqual(['Electronics', 'Standalone Item', 'World']);

            // Verify each tree maintains its structure
            const electronicsTree = allTreesResponse.body.find(t => t.label === 'Electronics');
            expect(electronicsTree.children).toHaveLength(2);

            const worldTree = allTreesResponse.body.find(t => t.label === 'World');
            expect(worldTree.children).toHaveLength(1);
            expect(worldTree.children[0].children).toHaveLength(2);

            const standaloneTree = allTreesResponse.body.find(t => t.label === 'Standalone Item');
            expect(standaloneTree.children).toHaveLength(0);
        });
    });

    describe('Data Consistency Workflows', () => {
        test('should maintain consistency during rapid operations', async () => {
            // Create root for rapid operations
            const rootResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'rapid-root', parentId: null })
                .expect(201);

            const rootId = rootResponse.body.id;

            // Perform rapid sequential operations
            const operations = [];
            for (let i = 0; i < 20; i++) {
                operations.push(
                    request(app)
                        .post('/api/tree')
                        .send({ label: `rapid-node-${i}`, parentId: rootId })
                        .expect(201)
                );
            }

            const results = await Promise.all(operations);

            // Verify all operations succeeded and data is consistent
            const treeResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(treeResponse.body).toHaveLength(1);
            expect(treeResponse.body[0].children).toHaveLength(20);

            // Verify all nodes have unique IDs
            const childIds = treeResponse.body[0].children.map(child => child.id);
            const uniqueIds = new Set(childIds);
            expect(uniqueIds.size).toBe(20);

            // Verify all nodes have correct labels
            const childLabels = treeResponse.body[0].children.map(child => child.label).sort();
            for (let i = 0; i < 20; i++) {
                expect(childLabels).toContain(`rapid-node-${i}`);
            }
        });

        test('should handle interleaved tree operations correctly', async () => {
            // Create multiple trees and perform interleaved operations
            
            const tree1Response = await request(app)
                .post('/api/tree')
                .send({ label: 'tree1', parentId: null })
                .expect(201);

            const tree2Response = await request(app)
                .post('/api/tree')
                .send({ label: 'tree2', parentId: null })
                .expect(201);

            const tree1Id = tree1Response.body.id;
            const tree2Id = tree2Response.body.id;

            // Interleave operations between trees
            await request(app)
                .post('/api/tree')
                .send({ label: 'tree1-child1', parentId: tree1Id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'tree2-child1', parentId: tree2Id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'tree1-child2', parentId: tree1Id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'tree2-child2', parentId: tree2Id })
                .expect(201);

            // Verify both trees maintain correct structure
            const tree1DetailResponse = await request(app)
                .get(`/api/tree/${tree1Id}`)
                .expect(200);

            const tree2DetailResponse = await request(app)
                .get(`/api/tree/${tree2Id}`)
                .expect(200);

            expect(tree1DetailResponse.body.children).toHaveLength(2);
            expect(tree2DetailResponse.body.children).toHaveLength(2);

            const tree1ChildLabels = tree1DetailResponse.body.children.map(c => c.label);
            const tree2ChildLabels = tree2DetailResponse.body.children.map(c => c.label);

            expect(tree1ChildLabels).toContain('tree1-child1');
            expect(tree1ChildLabels).toContain('tree1-child2');
            expect(tree2ChildLabels).toContain('tree2-child1');
            expect(tree2ChildLabels).toContain('tree2-child2');
        });
    });

    describe('Real-World Usage Scenarios', () => {
        test('should support menu/navigation tree workflow', async () => {
            // Build a website navigation menu structure
            
            const homeResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Home', parentId: null })
                .expect(201);

            const productsResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Products', parentId: homeResponse.body.id })
                .expect(201);

            const servicesResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Services', parentId: homeResponse.body.id })
                .expect(201);

            const aboutResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'About', parentId: homeResponse.body.id })
                .expect(201);

            // Add product subcategories
            await request(app)
                .post('/api/tree')
                .send({ label: 'Software', parentId: productsResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Hardware', parentId: productsResponse.body.id })
                .expect(201);

            // Add service types
            await request(app)
                .post('/api/tree')
                .send({ label: 'Consulting', parentId: servicesResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Support', parentId: servicesResponse.body.id })
                .expect(201);

            // Add about sections
            await request(app)
                .post('/api/tree')
                .send({ label: 'Our Team', parentId: aboutResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'History', parentId: aboutResponse.body.id })
                .expect(201);

            // Test getting the complete navigation structure
            const navResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            expect(navResponse.body).toHaveLength(1);
            const homeTree = navResponse.body[0];
            
            expect(homeTree.label).toBe('Home');
            expect(homeTree.children).toHaveLength(3);

            const products = homeTree.children.find(c => c.label === 'Products');
            const services = homeTree.children.find(c => c.label === 'Services');
            const about = homeTree.children.find(c => c.label === 'About');

            expect(products.children).toHaveLength(2);
            expect(services.children).toHaveLength(2);
            expect(about.children).toHaveLength(2);
        });

        test('should support category taxonomy workflow', async () => {
            // Build a product taxonomy
            
            const allCategoriesResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'All Categories', parentId: null })
                .expect(201);

            const clothingResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Clothing', parentId: allCategoriesResponse.body.id })
                .expect(201);

            const electronicsResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Electronics', parentId: allCategoriesResponse.body.id })
                .expect(201);

            // Add clothing subcategories
            const mensResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Mens', parentId: clothingResponse.body.id })
                .expect(201);

            const womensResponse = await request(app)
                .post('/api/tree')
                .send({ label: 'Womens', parentId: clothingResponse.body.id })
                .expect(201);

            // Add specific clothing items
            await request(app)
                .post('/api/tree')
                .send({ label: 'Shirts', parentId: mensResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Pants', parentId: mensResponse.body.id })
                .expect(201);

            await request(app)
                .post('/api/tree')
                .send({ label: 'Dresses', parentId: womensResponse.body.id })
                .expect(201);

            // Test breadcrumb navigation by getting path to a specific item
            const dressesResponse = await request(app)
                .get('/api/tree')
                .expect(200);

            const allCategories = dressesResponse.body[0];
            const clothing = allCategories.children.find(c => c.label === 'Clothing');
            const womens = clothing.children.find(c => c.label === 'Womens');
            const dresses = womens.children.find(c => c.label === 'Dresses');

            const breadcrumbResponse = await request(app)
                .get(`/api/tree/node/${dresses.id}/path`)
                .expect(200);

            expect(breadcrumbResponse.body.path).toEqual([
                { id: allCategoriesResponse.body.id, label: 'All Categories' },
                { id: clothingResponse.body.id, label: 'Clothing' },
                { id: womensResponse.body.id, label: 'Womens' },
                { id: dresses.id, label: 'Dresses' }
            ]);
        });
    });
});