# Tree API Server - Implementation Plan

## Overview
Build a production-ready HTTP server to handle tree data structures using Node.js and SQL database with persistence and comprehensive testing.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with raw SQL queries
- **Testing**: Jest with Supertest
- **Validation**: Custom validation middleware
- **Documentation**: API documentation with examples

## Project Structure
```
treeAPI_interview/
├── src/
│   ├── controllers/
│   │   └── treeController.js
│   ├── routes/
│   │   └── treeRoutes.js
│   ├── services/
│   │   └── treeService.js
│   ├── middleware/
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── database/
│   │   ├── connection.js
│   │   ├── schema.sql
│   │   └── queries.js
│   └── app.js
├── tests/
│   ├── integration/
│   │   └── tree.test.js
│   └── unit/
│       └── treeService.test.js
├── database/
│   └── tree.db
├── package.json
├── jest.config.js
└── README.md
```

## Implementation Steps

### Phase 1: Project Setup
1. **Initialize Node.js project**
   - Create `package.json` with Express, SQLite3, Jest, Supertest dependencies
   - Set up Jest configuration (`jest.config.js`)
   - Create basic project structure

2. **Database Schema Design**
   - Create SQLite database with `nodes` table using raw SQL
   - Schema: `id` (PRIMARY KEY), `label` (TEXT), `parent_id` (INTEGER, FOREIGN KEY)
   - Index on `parent_id` for efficient queries

### Phase 2: Core Implementation
3. **Database Layer**
   - Implement database connection using `sqlite3` package
   - Create SQL queries for CRUD operations
   - Add database initialization and migration scripts

4. **Service Layer**
   - Implement `TreeService` class with methods:
     - `getAllTrees()` - Returns hierarchical tree structure using SQL
     - `createNode(label, parentId)` - Creates new node using SQL INSERT
     - `getNodeById(id)` - Helper method using SQL SELECT
   - Handle tree traversal and hierarchy building with SQL queries

5. **Controller Layer**
   - Implement `TreeController` with:
     - `GET /api/tree` - Returns all trees
     - `POST /api/tree` - Creates new node
   - Proper error handling and response formatting

6. **Routes and Middleware**
   - Set up Express routes
   - Add request validation middleware
   - Implement error handling middleware
   - Add CORS support for production API

### Phase 3: Testing
7. **Unit Tests**
   - Test `TreeService` methods
   - Test database operations with SQL queries
   - Mock database connections appropriately

8. **Integration Tests**
   - Test API endpoints with Supertest
   - Test complete request/response cycles
   - Test error scenarios and edge cases

### Phase 4: Production Features
9. **API Documentation**
   - Add comprehensive API documentation
   - Document request/response schemas
   - Include example requests/responses

10. **Error Handling & Validation**
    - Comprehensive error messages
    - Input validation for POST requests
    - Handle edge cases (invalid parent IDs, etc.)

11. **Performance & Security**
    - Add request rate limiting
    - Input sanitization for SQL queries
    - Proper HTTP status codes
    - Logging for debugging

## API Endpoints Specification

### GET /api/tree
- **Purpose**: Retrieve all trees in hierarchical format
- **Response**: Array of tree objects with nested children
- **Status Codes**: 200 (success), 500 (server error)

### POST /api/tree
- **Purpose**: Create new node and attach to parent
- **Request Body**: `{ "label": "string", "parentId": number }`
- **Validation**: 
  - `label` required, non-empty string
  - `parentId` required, valid integer, must exist in database
- **Response**: Created node object
- **Status Codes**: 201 (created), 400 (bad request), 404 (parent not found), 500 (server error)

## Database Schema (SQL)
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

## SQL Queries for Implementation

### Create Node
```sql
INSERT INTO nodes (label, parent_id) VALUES (?, ?)
```

### Get Node by ID
```sql
SELECT * FROM nodes WHERE id = ?
```

### Get All Nodes (for building hierarchy)
```sql
SELECT * FROM nodes ORDER BY parent_id, id
```

### Check if Parent Exists
```sql
SELECT COUNT(*) FROM nodes WHERE id = ?
```

## Testing Strategy
1. **Unit Tests**: Test service layer methods in isolation
2. **Integration Tests**: Test complete API endpoints
3. **Test Scenarios**:
   - Create root nodes (no parent)
   - Create child nodes with valid parent
   - Handle invalid parent IDs
   - Test tree hierarchy building
   - Test concurrent operations
   - Test database persistence

## Development Workflow
1. Set up project structure and dependencies
2. Implement database layer with SQL queries
3. Build service layer with tree logic
4. Create API endpoints
5. Add comprehensive tests
6. Add production features (validation, error handling, docs)
7. Test complete workflow

## Success Criteria
- ✅ Server starts and runs without errors
- ✅ GET /api/tree returns hierarchical tree data
- ✅ POST /api/tree creates nodes and attaches to parents
- ✅ Data persists between server restarts
- ✅ All tests pass
- ✅ API handles edge cases gracefully
- ✅ Production-ready with proper error handling and validation

## Dependencies Required
- `express` - Web framework
- `sqlite3` - SQLite database driver
- `jest` - Testing framework
- `supertest` - HTTP testing
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware

## Next Steps
1. Create project structure and initialize Node.js project
2. Set up database schema and connection
3. Implement core service layer with SQL queries
4. Create API endpoints
5. Add comprehensive testing
6. Add production features and documentation 