# Tree API Server

A production-ready HTTP server for managing hierarchical tree data structures built with Node.js, Express, and SQLite.

## Features

- 🌳 **Hierarchical Trees**: Create and manage tree structures with unlimited depth
- 🔄 **REST API**: Clean RESTful endpoints for tree operations
- 💾 **Persistent Storage**: SQLite database with automatic schema management
- 🧪 **Comprehensive Testing**: Unit and integration tests with coverage reports
- 📚 **Interactive Documentation**: Swagger UI for API exploration
- 🔒 **Production Ready**: Error handling, validation, and security middleware
- ⚡ **Performance Optimized**: Efficient SQL queries with proper indexing

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm (comes with Node.js)

### Installation

1. **Clone or download the project**
   ```bash
   cd tree-api-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

## API Overview

The API provides endpoints for creating and retrieving hierarchical tree structures:

- `GET /api/tree` - Get all trees
- `POST /api/tree` - Create a new node
- `GET /api/tree/:id` - Get specific tree by root ID
- `GET /api/tree/stats` - Get service statistics
- `GET /api/tree/node/:id/path` - Get path to a node
- `GET /health` - Health check endpoint

## Quick Examples

### Create a Root Node
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "root", "parentId": null}'
```

### Create Child Nodes
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "child1", "parentId": 1}'
```

### Get All Trees
```bash
curl http://localhost:3000/api/tree
```

**Response:**
```json
[
  {
    "id": 1,
    "label": "root",
    "children": [
      {
        "id": 2,
        "label": "child1",
        "children": []
      }
    ]
  }
]
```

## Documentation

### Interactive API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api-docs`

### Complete API Reference

See [API.md](./API.md) for comprehensive documentation including:
- All endpoints with request/response schemas
- Example requests and responses
- Error codes and handling
- Validation rules

## Testing

The project includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Generate coverage report
npm run test:watch         # Watch mode for development
```

### Test Coverage

The project maintains high test coverage for:
- ✅ All API endpoints
- ✅ Service layer methods
- ✅ Database operations
- ✅ Error handling scenarios
- ✅ Input validation

## Project Structure

```
tree-api-server/
├── src/
│   ├── app.js                 # Express application setup
│   ├── controllers/           # HTTP request handlers
│   │   └── treeController.js
│   ├── services/              # Business logic
│   │   └── treeService.js
│   ├── database/              # Database layer
│   │   ├── connection.js      # Database connection
│   │   ├── init.js           # Database initialization
│   │   ├── queries.js        # SQL queries
│   │   └── schema.sql        # Database schema
│   ├── middleware/            # Express middleware
│   │   ├── validation.js     # Input validation
│   │   └── errorHandler.js   # Error handling
│   └── routes/                # API routes
│       └── treeRoutes.js
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── database/                  # SQLite database files
├── API.md                     # Complete API documentation
└── package.json
```

## Database Schema

The API uses SQLite with the following schema:

```sql
CREATE TABLE nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES nodes(id)
);

CREATE INDEX idx_parent_id ON nodes(parent_id);
```

## Configuration

### Environment Variables

The server can be configured using environment variables:

- `PORT` - Server port (default: 3000)
- `DB_PATH` - Database file path (default: ./database/tree.db)
- `NODE_ENV` - Environment mode (development/production)

### Database Configuration

- **Engine**: SQLite 3
- **File**: `./database/tree.db`
- **Auto-initialization**: Database and tables are created automatically on first run

## Error Handling

The API provides consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": "Technical details (optional)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Performance Considerations

- **Indexing**: Optimized database queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Memory Management**: Careful handling of large tree structures
- **Query Optimization**: Efficient SQL queries for tree operations

## Security Features

- **Helmet**: Security headers middleware
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **Error Sanitization**: Secure error message handling

## Production Deployment

### Recommended Setup

1. **Environment Configuration**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   export DB_PATH=/app/data/tree.db
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/app.js --name tree-api
   
   # Using systemd or docker
   # See deployment guides for your platform
   ```

3. **Database Backup**
   ```bash
   # Regular backups of SQLite database
   cp database/tree.db backups/tree-$(date +%Y%m%d).db
   ```

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

### Development Workflow

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm test`
3. **Start development server**: `npm run dev`
4. **Check test coverage**: `npm run test:coverage`

### Code Quality

The project follows best practices:
- ESLint configuration for code quality
- Jest for testing with coverage requirements
- JSDoc comments for API documentation
- Consistent error handling patterns

## License

MIT License - see LICENSE file for details

## Support

For questions, issues, or feature requests:

1. Check the [API documentation](./API.md)
2. Run the test suite: `npm test`
3. Check server health: `GET /health`
4. Review the error messages in the API responses

## Changelog

### Version 1.0.0
- Initial release with core tree API functionality
- SQLite persistence layer
- Comprehensive test suite
- Interactive Swagger documentation
- Production-ready error handling and validation

## Related Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Jest Testing Framework](https://jestjs.io/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)