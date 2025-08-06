/**
 * Unit Tests for Middleware
 * Tests validation, error handling, and security middleware in isolation
 */

const {
    validateJSON,
    validateBodySize,
    validateRouteParams,
    requestLogger,
    securityHeaders,
    rateLimiter,
    validateApiKey,
    handleCORS
} = require('../../src/middleware/validation');

const {
    globalErrorHandler,
    asyncHandler,
    notFoundHandler,
    timeoutHandler,
    createValidationError,
    createNotFoundError,
    createInternalError,
    responseTimeLogger
} = require('../../src/middleware/errorHandler');

describe('Middleware Unit Tests', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        // Create mock request, response, and next function
        mockReq = {
            method: 'GET',
            headers: {},
            params: {},
            body: {},
            ip: '127.0.0.1',
            path: '/api/test',
            originalUrl: '/api/test'
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
            header: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis(),
            statusCode: 200
        };

        mockNext = jest.fn();

        // Mock console methods to avoid test output pollution
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console methods
        console.log.mockRestore();
        console.error.mockRestore();
        jest.clearAllMocks();
    });

    describe('Validation Middleware', () => {
        describe('validateJSON', () => {
            test('should pass for GET requests', () => {
                mockReq.method = 'GET';

                validateJSON(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should pass for POST with correct content-type', () => {
                mockReq.method = 'POST';
                mockReq.headers['content-type'] = 'application/json';

                validateJSON(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should reject POST with wrong content-type', () => {
                mockReq.method = 'POST';
                mockReq.headers['content-type'] = 'text/plain';

                validateJSON(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Bad request',
                    message: 'Content-Type must be application/json'
                });
            });

            test('should pass for PUT with correct content-type', () => {
                mockReq.method = 'PUT';
                mockReq.headers['content-type'] = 'application/json; charset=utf-8';

                validateJSON(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });
        });

        describe('validateBodySize', () => {
            test('should pass for requests within size limit', () => {
                mockReq.headers['content-length'] = '1000';

                validateBodySize(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should reject requests exceeding size limit', () => {
                mockReq.headers['content-length'] = '2000000'; // 2MB

                validateBodySize(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(413);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Payload too large',
                    message: 'Request body exceeds maximum size limit'
                });
            });

            test('should pass for requests without content-length header', () => {
                validateBodySize(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });
        });

        describe('validateRouteParams', () => {
            test('should pass for requests without ID parameter', () => {
                validateRouteParams(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should validate and convert valid ID parameter', () => {
                mockReq.params.id = '123';

                validateRouteParams(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockReq.params.id).toBe(123);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should reject invalid ID parameter', () => {
                mockReq.params.id = 'invalid';

                validateRouteParams(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Bad request',
                    message: 'ID parameter must be a positive integer'
                });
            });

            test('should reject negative ID parameter', () => {
                mockReq.params.id = '-1';

                validateRouteParams(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(400);
            });

            test('should reject zero ID parameter', () => {
                mockReq.params.id = '0';

                validateRouteParams(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(400);
            });
        });

        describe('securityHeaders', () => {
            test('should set security headers', () => {
                securityHeaders(mockReq, mockRes, mockNext);

                expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
                expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Version', '1.0.0');
                expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
                expect(mockNext).toHaveBeenCalledTimes(1);
            });
        });

        describe('handleCORS', () => {
            test('should set CORS headers', () => {
                handleCORS(mockReq, mockRes, mockNext);

                expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
                expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
                expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Max-Age', '3600');
                expect(mockNext).toHaveBeenCalledTimes(1);
            });

            test('should handle OPTIONS preflight requests', () => {
                mockReq.method = 'OPTIONS';

                handleCORS(mockReq, mockRes, mockNext);

                expect(mockRes.status).toHaveBeenCalledWith(200);
                expect(mockRes.end).toHaveBeenCalledTimes(1);
                expect(mockNext).not.toHaveBeenCalled();
            });
        });

        describe('validateApiKey', () => {
            test('should skip validation in development', () => {
                process.env.NODE_ENV = 'development';

                validateApiKey(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should skip validation when no API key configured', () => {
                process.env.NODE_ENV = 'production';
                delete process.env.API_KEY;

                validateApiKey(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should require API key in production', () => {
                process.env.NODE_ENV = 'production';
                process.env.API_KEY = 'valid-key';

                validateApiKey(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Unauthorized',
                    message: 'API key is required'
                });
            });

            test('should validate correct API key', () => {
                process.env.NODE_ENV = 'production';
                process.env.API_KEY = 'valid-key';
                mockReq.headers['x-api-key'] = 'valid-key';

                validateApiKey(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
            });

            test('should reject invalid API key', () => {
                process.env.NODE_ENV = 'production';
                process.env.API_KEY = 'valid-key';
                mockReq.headers['x-api-key'] = 'invalid-key';

                validateApiKey(mockReq, mockRes, mockNext);

                expect(mockNext).not.toHaveBeenCalled();
                expect(mockRes.status).toHaveBeenCalledWith(401);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Unauthorized',
                    message: 'Invalid API key'
                });
            });
        });

        describe('rateLimiter', () => {
            test('should create rate limiter middleware', () => {
                const limiter = rateLimiter();
                expect(typeof limiter).toBe('function');
            });

            test('should allow requests within limit', () => {
                const limiter = rateLimiter();
                
                limiter(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledTimes(1);
                expect(mockRes.status).not.toHaveBeenCalled();
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 99);
            });

            test('should set rate limit headers', () => {
                const limiter = rateLimiter();
                
                limiter(mockReq, mockRes, mockNext);

                expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
                expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
            });
        });

        describe('requestLogger', () => {
            test('should log GET requests', () => {
                mockReq.method = 'GET';
                mockReq.originalUrl = '/api/test';

                requestLogger(mockReq, mockRes, mockNext);

                expect(console.log).toHaveBeenCalled();
                expect(mockNext).toHaveBeenCalledTimes(1);
            });

            test('should log POST requests with body', () => {
                mockReq.method = 'POST';
                mockReq.body = { test: 'data' };

                requestLogger(mockReq, mockRes, mockNext);

                expect(console.log).toHaveBeenCalledTimes(2); // One for request, one for body
                expect(mockNext).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Error Handling Middleware', () => {
        describe('globalErrorHandler', () => {
            test('should handle validation errors', () => {
                const error = new Error('Validation failed');
                error.name = 'ValidationError';

                globalErrorHandler(error, mockReq, mockRes, mockNext);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Validation error',
                    message: 'Validation failed',
                    timestamp: expect.any(String)
                });
            });

            test('should handle JSON syntax errors', () => {
                const error = new SyntaxError('Unexpected token');
                error.status = 400;
                error.body = {};

                globalErrorHandler(error, mockReq, mockRes, mockNext);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Invalid JSON',
                    message: 'Request body contains invalid JSON',
                    timestamp: expect.any(String)
                });
            });

            test('should handle generic errors', () => {
                const error = new Error('Generic error');

                globalErrorHandler(error, mockReq, mockRes, mockNext);

                expect(mockRes.status).toHaveBeenCalledWith(500);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Internal server error',
                    message: 'Generic error',
                    timestamp: expect.any(String)
                });
            });

            test('should handle errors with custom status codes', () => {
                const error = new Error('Custom error');
                error.statusCode = 422;

                globalErrorHandler(error, mockReq, mockRes, mockNext);

                expect(mockRes.status).toHaveBeenCalledWith(422);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Client error',
                    message: 'Custom error',
                    timestamp: expect.any(String)
                });
            });
        });

        describe('asyncHandler', () => {
            test('should wrap async functions', () => {
                const asyncFn = jest.fn().mockResolvedValue('success');
                const wrappedFn = asyncHandler(asyncFn);

                expect(typeof wrappedFn).toBe('function');
            });

            test('should handle successful async operations', async () => {
                const asyncFn = jest.fn().mockResolvedValue('success');
                const wrappedFn = asyncHandler(asyncFn);

                await wrappedFn(mockReq, mockRes, mockNext);

                expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
                expect(mockNext).not.toHaveBeenCalled();
            });

            test('should catch and forward async errors', async () => {
                const error = new Error('Async error');
                const asyncFn = jest.fn().mockRejectedValue(error);
                const wrappedFn = asyncHandler(asyncFn);

                await wrappedFn(mockReq, mockRes, mockNext);

                expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
                expect(mockNext).toHaveBeenCalledWith(error);
            });
        });

        describe('notFoundHandler', () => {
            test('should create 404 error', () => {
                mockReq.method = 'GET';
                mockReq.path = '/unknown';

                notFoundHandler(mockReq, mockRes, mockNext);

                expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
                const error = mockNext.mock.calls[0][0];
                expect(error.message).toBe('Route GET /unknown not found');
                expect(error.statusCode).toBe(404);
            });
        });

        describe('timeoutHandler', () => {
            test('should create timeout middleware', () => {
                const timeoutMiddleware = timeoutHandler(5000);
                expect(typeof timeoutMiddleware).toBe('function');
            });

            test('should set request timeout', () => {
                const timeoutMiddleware = timeoutHandler(5000);
                mockReq.setTimeout = jest.fn();

                timeoutMiddleware(mockReq, mockRes, mockNext);

                expect(mockReq.setTimeout).toHaveBeenCalledWith(5000, expect.any(Function));
                expect(mockNext).toHaveBeenCalledTimes(1);
            });
        });

        describe('Error Creators', () => {
            test('should create validation error', () => {
                const error = createValidationError('Invalid input', 'email');

                expect(error.message).toBe('Invalid input');
                expect(error.name).toBe('ValidationError');
                expect(error.field).toBe('email');
                expect(error.statusCode).toBe(400);
            });

            test('should create not found error', () => {
                const error = createNotFoundError('Resource not found');

                expect(error.message).toBe('Resource not found');
                expect(error.statusCode).toBe(404);
            });

            test('should create internal error', () => {
                const error = createInternalError('Internal error');

                expect(error.message).toBe('Internal error');
                expect(error.statusCode).toBe(500);
            });
        });

        describe('responseTimeLogger', () => {
            test('should override res.end to log response time', () => {
                const originalEnd = mockRes.end;

                responseTimeLogger(mockReq, mockRes, mockNext);

                expect(mockRes.end).not.toBe(originalEnd);
                expect(mockNext).toHaveBeenCalledTimes(1);
            });

            test('should log response time when request completes', () => {
                responseTimeLogger(mockReq, mockRes, mockNext);

                // Simulate response completion
                mockRes.end();

                expect(console.log).toHaveBeenCalled();
            });
        });
    });

    describe('Edge Cases and Error Scenarios', () => {
        test('should handle missing headers gracefully', () => {
            mockReq.headers = undefined;

            validateJSON(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
        });

        test('should handle missing request properties', () => {
            mockReq.originalUrl = undefined;

            requestLogger(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
        });

        test('should handle error without message', () => {
            const error = new Error();

            globalErrorHandler(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                message: 'Internal server error',
                timestamp: expect.any(String)
            });
        });
    });

    afterAll(() => {
        // Clean up environment variables
        delete process.env.NODE_ENV;
        delete process.env.API_KEY;
    });
});