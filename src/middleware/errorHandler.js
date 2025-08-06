/**
 * Error Handling Middleware
 * Provides centralized error handling for the API
 */

/**
 * Global error handler middleware
 * This should be the last middleware in the chain
 */
function globalErrorHandler(err, req, res, next) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    
    // Log the error
    console.error(`[${timestamp}] ERROR ${method} ${url}:`, err.message);
    console.error('Stack trace:', err.stack);
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: err.message,
            timestamp: timestamp
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid data format',
            message: 'Invalid data provided in request',
            timestamp: timestamp
        });
    }
    
    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON',
            timestamp: timestamp
        });
    }
    
    // Handle async errors
    if (err.name === 'AsyncError') {
        return res.status(500).json({
            error: 'Internal server error',
            message: 'An internal error occurred while processing your request',
            timestamp: timestamp
        });
    }
    
    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';
    
    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Internal server error' : 'Client error',
        message: message,
        timestamp: timestamp,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch unhandled promise rejections
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res, next) {
    const error = new Error(`Route ${req.method} ${req.path} not found`);
    error.statusCode = 404;
    next(error);
}

/**
 * Request timeout handler
 */
function timeoutHandler(timeout = 30000) {
    return (req, res, next) => {
        req.setTimeout(timeout, () => {
            const error = new Error('Request timeout');
            error.statusCode = 408;
            next(error);
        });
        next();
    };
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException() {
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

/**
 * Handle graceful shutdown
 */
function handleGracefulShutdown(server) {
    const signals = ['SIGTERM', 'SIGINT'];
    
    signals.forEach(signal => {
        process.on(signal, () => {
            console.log(`Received ${signal}, starting graceful shutdown...`);
            
            server.close((err) => {
                if (err) {
                    console.error('Error during graceful shutdown:', err);
                    process.exit(1);
                }
                
                console.log('Server closed gracefully');
                process.exit(0);
            });
            
            // Force close after timeout
            setTimeout(() => {
                console.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 10000);
        });
    });
}

/**
 * Validation error creator
 */
function createValidationError(message, field = null) {
    const error = new Error(message);
    error.name = 'ValidationError';
    error.field = field;
    error.statusCode = 400;
    return error;
}

/**
 * Not found error creator
 */
function createNotFoundError(message) {
    const error = new Error(message);
    error.statusCode = 404;
    return error;
}

/**
 * Internal error creator
 */
function createInternalError(message) {
    const error = new Error(message);
    error.statusCode = 500;
    return error;
}

/**
 * Response time logger middleware
 */
function responseTimeLogger(req, res, next) {
    const start = Date.now();
    
    // Override res.end to log response time
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const statusCode = res.statusCode;
        
        console.log(`[${timestamp}] ${method} ${url} - ${statusCode} - ${duration}ms`);
        
        originalEnd.apply(this, args);
    };
    
    next();
}

module.exports = {
    globalErrorHandler,
    asyncHandler,
    notFoundHandler,
    timeoutHandler,
    handleUncaughtException,
    handleGracefulShutdown,
    createValidationError,
    createNotFoundError,
    createInternalError,
    responseTimeLogger
};