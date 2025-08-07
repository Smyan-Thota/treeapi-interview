#!/usr/bin/env node

/**
 * Tree API Server
 * Main Express application that handles tree data structures
 * Implements the API endpoints as specified in the problem statement
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Import routes and middleware
const treeRoutes = require('./routes/treeRoutes');
const treeController = require('./controllers/treeController');
const {
    validateJSON,
    validateBodySize,
    validateRouteParams,
    requestLogger,
    securityHeaders,
    rateLimiter,
    validateApiKey,
    handleCORS
} = require('./middleware/validation');
const {
    globalErrorHandler,
    asyncHandler,
    notFoundHandler,
    timeoutHandler,
    handleUncaughtException,
    handleGracefulShutdown,
    responseTimeLogger
} = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Handle uncaught exceptions
handleUncaughtException();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Apply security middleware first
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS middleware
app.use(cors({
    origin: NODE_ENV === 'production' ? 
        process.env.ALLOWED_ORIGINS?.split(',') || false : 
        true,
    credentials: true,
    optionsSuccessStatus: 200
}));

// Custom CORS handler for more control
app.use(handleCORS);

// Request parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security and validation middleware
app.use(securityHeaders);
app.use(validateJSON);
app.use(validateBodySize);
app.use(timeoutHandler(30000)); // 30 second timeout

// Logging middleware
app.use(requestLogger);
app.use(responseTimeLogger);

// Rate limiting
if (NODE_ENV === 'production') {
    app.use(rateLimiter());
}

// API key validation (optional)
app.use(validateApiKey);

// Swagger/OpenAPI Documentation Setup
let swaggerDocument;
try {
    // Load the swagger.yaml file
    const swaggerPath = path.join(__dirname, '..', 'swagger.yaml');
    const swaggerFile = fs.readFileSync(swaggerPath, 'utf8');
    swaggerDocument = yaml.load(swaggerFile);
    
    // Update server URL based on environment
    if (swaggerDocument.servers) {
        swaggerDocument.servers[0].url = `http://localhost:${PORT}/api`;
    }
} catch (error) {
    console.warn('⚠️  Could not load swagger.yaml, using basic JSDoc configuration:', error.message);
    
    // Fallback to JSDoc-based configuration
    const swaggerOptions = {
        definition: {
            openapi: '3.0.3',
            info: {
                title: 'Tree API',
                version: '1.0.0',
                description: 'A production-ready HTTP server for managing hierarchical tree data structures',
            },
            servers: [
                {
                    url: `http://localhost:${PORT}/api`,
                    description: 'Development server',
                },
            ],
        },
        apis: ['./src/routes/*.js', './src/controllers/*.js'], // paths to files containing OpenAPI definitions
    };
    
    swaggerDocument = swaggerJsdoc(swaggerOptions);
}

// Swagger UI options
const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Tree API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
    }
};

// Serve API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerUiOptions));

// Serve raw OpenAPI spec
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
});

// Health check endpoint (before API routes)
app.get('/health', asyncHandler(treeController.healthCheck));

// Root endpoint with API information
app.get('/', (req, res) => {
    res.json({
        name: 'Tree API Server',
        version: '1.0.0',
        description: 'A production-ready HTTP server to handle tree data structures',
        endpoints: {
            health: 'GET /health',
            getAllTrees: 'GET /api/tree',
            createNode: 'POST /api/tree',
            getTreeById: 'GET /api/tree/:id',
            getStats: 'GET /api/tree/stats',
            getNodePath: 'GET /api/tree/node/:id/path'
        },
        documentation: {
            interactive: `http://localhost:${PORT}/api-docs`,
            openapi_spec: `http://localhost:${PORT}/api-docs.json`,
            markdown: 'See API.md file in project root',
            examples: {
                createNode: {
                    method: 'POST',
                    path: '/api/tree',
                    description: 'Creates a new node and attaches it to the specified parent node',
                    body: {
                        label: 'string (required)',
                        parentId: 'number|null (required)'
                    },
                    example: {
                        label: "cat's child",
                        parentId: 4
                    }
                },
                getAllTrees: {
                    method: 'GET',
                    path: '/api/tree',
                    description: 'Returns an array of all trees that exist in the database',
                    response: 'Array of tree objects with nested children'
                }
            }
        },
        timestamp: new Date().toISOString()
    });
});

// API routes with validation
app.use('/api/tree', validateRouteParams, treeRoutes);

// 404 handler for unknown routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
let server;

async function startServer() {
    try {
        server = app.listen(PORT, () => {
            console.log('🚀 Tree API Server started successfully!');
            console.log(`📍 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${NODE_ENV}`);
            console.log(`📋 API Base URL: http://localhost:${PORT}`);
            console.log('📚 Available endpoints:');
            console.log(`   GET  /health               - Health check`);
            console.log(`   GET  /api/tree             - Get all trees`);
            console.log(`   POST /api/tree             - Create new node`);
            console.log(`   GET  /api/tree/:id         - Get specific tree`);
            console.log(`   GET  /api/tree/stats       - Get service statistics`);
            console.log(`   GET  /api/tree/node/:id/path - Get node path`);
            console.log('📖 Documentation:');
            console.log(`   📊 Interactive API docs:  http://localhost:${PORT}/api-docs`);
            console.log(`   📄 OpenAPI Spec:          http://localhost:${PORT}/api-docs.json`);
            console.log(`   📋 Complete API Guide:    API.md file`);
            console.log('✅ Server ready to accept connections');
        });
        
        // Handle graceful shutdown
        handleGracefulShutdown(server);
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

// Export app for testing
module.exports = { app, startServer };