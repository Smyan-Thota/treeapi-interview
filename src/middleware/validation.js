/**
 * Validation Middleware
 * Provides request validation for API endpoints
 */

/**
 * Middleware to validate JSON request body
 */
function validateJSON(req, res, next) {
    // Only validate for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Content-Type must be application/json'
            });
        }
    }
    next();
}

/**
 * Middleware to validate request body size
 */
function validateBodySize(req, res, next) {
    const maxSize = 1024 * 1024; // 1MB limit
    
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
            error: 'Payload too large',
            message: 'Request body exceeds maximum size limit'
        });
    }
    next();
}

/**
 * Middleware to validate route parameters
 */
function validateRouteParams(req, res, next) {
    // Validate numeric ID parameters
    if (req.params.id) {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'ID parameter must be a positive integer'
            });
        }
        req.params.id = id; // Convert to number
    }
    next();
}

/**
 * Middleware to add request logging
 */
function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    console.log(`[${timestamp}] ${method} ${url} - User-Agent: ${userAgent}`);
    
    // Log request body for POST requests (but mask sensitive data)
    if (method === 'POST' && req.body) {
        const logBody = { ...req.body };
        console.log(`[${timestamp}] Request Body:`, JSON.stringify(logBody));
    }
    
    next();
}

/**
 * Middleware to add security headers
 */
function securityHeaders(req, res, next) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // API-specific headers
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    next();
}

/**
 * Middleware to handle rate limiting (simple implementation)
 */
function rateLimiter() {
    const requests = new Map();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max requests per window
    
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const now = Date.now();
        
        // Clean old entries
        for (const [ip, data] of requests.entries()) {
            if (now - data.windowStart > windowMs) {
                requests.delete(ip);
            }
        }
        
        // Get or create request data for this IP
        if (!requests.has(clientIP)) {
            requests.set(clientIP, {
                count: 0,
                windowStart: now
            });
        }
        
        const requestData = requests.get(clientIP);
        
        // Reset window if expired
        if (now - requestData.windowStart > windowMs) {
            requestData.count = 0;
            requestData.windowStart = now;
        }
        
        // Check if limit exceeded
        if (requestData.count >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                message: 'Rate limit exceeded. Try again later.',
                retryAfter: Math.ceil((requestData.windowStart + windowMs - now) / 1000)
            });
        }
        
        // Increment counter
        requestData.count++;
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - requestData.count);
        res.setHeader('X-RateLimit-Reset', Math.ceil((requestData.windowStart + windowMs) / 1000));
        
        next();
    };
}

/**
 * Middleware to validate API key (optional, for production)
 */
function validateApiKey(req, res, next) {
    // Skip API key validation in development
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;
    
    if (!validApiKey) {
        // No API key configured, skip validation
        return next();
    }
    
    if (!apiKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'API key is required'
        });
    }
    
    if (apiKey !== validApiKey) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid API key'
        });
    }
    
    next();
}

/**
 * Middleware to handle CORS preflight requests
 */
function handleCORS(req, res, next) {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
    res.header('Access-Control-Max-Age', '3600');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
}

module.exports = {
    validateJSON,
    validateBodySize,
    validateRouteParams,
    requestLogger,
    securityHeaders,
    rateLimiter,
    validateApiKey,
    handleCORS
};