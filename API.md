# Tree API Documentation

## Overview

The Tree API is a production-ready HTTP server built with Node.js and Express that provides endpoints for managing hierarchical tree data structures. The API supports creating nodes, retrieving tree structures, and performing various tree operations with persistence using SQLite database.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Content Type

All requests and responses use `application/json` content type.

## API Endpoints

### 1. Get All Trees

Retrieves all trees in the database in hierarchical format.

**Endpoint:** `GET /api/tree`

**Description:** Returns an array of all root nodes with their complete tree structures, including nested children.

**Request Parameters:** None

**Response:**

- **Status Code:** `200 OK`
- **Content-Type:** `application/json`

**Response Schema:**
```json
[
  {
    "id": number,
    "label": string,
    "children": [
      {
        "id": number,
        "label": string,
        "children": []
      }
    ]
  }
]
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/tree
```

**Example Response:**
```json
[
  {
    "id": 1,
    "label": "root",
    "children": [
      {
        "id": 3,
        "label": "bear",
        "children": [
          {
            "id": 4,
            "label": "cat",
            "children": []
          }
        ]
      },
      {
        "id": 7,
        "label": "frog",
        "children": []
      }
    ]
  }
]
```

**Error Responses:**

- **500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Failed to retrieve trees",
  "details": "Database connection failed"
}
```

---

### 2. Create Node

Creates a new node and attaches it to a specified parent node in the tree.

**Endpoint:** `POST /api/tree`

**Description:** Creates a new node with the given label and attaches it to the specified parent. Use `parentId: null` to create a root node.

**Request Body:**
```json
{
  "label": string,      // Required: Label for the new node (1-255 characters)
  "parentId": number|null  // Required: ID of parent node or null for root node
}
```

**Response:**

- **Status Code:** `201 Created`
- **Content-Type:** `application/json`

**Response Schema:**
```json
{
  "id": number,
  "label": string,
  "children": []
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "cat'\''s child",
    "parentId": 4
  }'
```

**Example Response:**
```json
{
  "id": 8,
  "label": "cat's child",
  "children": []
}
```

**Validation Rules:**
- `label`: Required, non-empty string, maximum 255 characters
- `parentId`: Required, must be a positive integer or `null`, must reference an existing node

**Error Responses:**

- **400 Bad Request** - Invalid request body
```json
{
  "error": "Bad request",
  "message": "Label is required"
}
```

- **400 Bad Request** - Invalid label
```json
{
  "error": "Bad request",
  "message": "Label cannot be empty"
}
```

- **400 Bad Request** - Invalid parentId
```json
{
  "error": "Bad request",
  "message": "ParentId must be a positive integer or null"
}
```

- **404 Not Found** - Parent node doesn't exist
```json
{
  "error": "Parent not found",
  "message": "Parent node with ID 999 does not exist"
}
```

- **500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Failed to create node",
  "details": "Database insertion failed"
}
```

---

### 3. Get Tree by ID

Retrieves a specific tree by its root node ID.

**Endpoint:** `GET /api/tree/:id`

**Description:** Returns a single tree structure starting from the specified root node ID.

**Path Parameters:**
- `id` (number): The ID of the root node

**Response:**

- **Status Code:** `200 OK`
- **Content-Type:** `application/json`

**Response Schema:**
```json
{
  "id": number,
  "label": string,
  "children": [...]
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/tree/1
```

**Example Response:**
```json
{
  "id": 1,
  "label": "root",
  "children": [
    {
      "id": 3,
      "label": "bear",
      "children": [
        {
          "id": 4,
          "label": "cat",
          "children": []
        }
      ]
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid ID
```json
{
  "error": "Bad request",
  "message": "Tree ID must be a positive integer"
}
```

- **404 Not Found** - Tree doesn't exist
```json
{
  "error": "Tree not found",
  "message": "Tree with root ID 999 does not exist"
}
```

---

### 4. Get Service Statistics

Retrieves statistics about the tree service for monitoring purposes.

**Endpoint:** `GET /api/tree/stats`

**Description:** Returns statistical information about nodes, trees, and service health.

**Request Parameters:** None

**Response:**

- **Status Code:** `200 OK`
- **Content-Type:** `application/json`

**Response Schema:**
```json
{
  "totalNodes": number,
  "totalTrees": number,
  "maxDepth": number,
  "serviceUptime": string,
  "timestamp": string
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/tree/stats
```

**Example Response:**
```json
{
  "totalNodes": 15,
  "totalTrees": 3,
  "maxDepth": 4,
  "serviceUptime": "2 hours, 15 minutes",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

---

### 5. Get Node Path

Retrieves the path from root to a specific node.

**Endpoint:** `GET /api/tree/node/:id/path`

**Description:** Returns the complete path from the root node to the specified node, useful for navigation and breadcrumbs.

**Path Parameters:**
- `id` (number): The ID of the target node

**Response:**

- **Status Code:** `200 OK`
- **Content-Type:** `application/json`

**Response Schema:**
```json
{
  "nodeId": number,
  "path": [
    {
      "id": number,
      "label": string
    }
  ],
  "depth": number
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/4/path
```

**Example Response:**
```json
{
  "nodeId": 4,
  "path": [
    {
      "id": 1,
      "label": "root"
    },
    {
      "id": 3,
      "label": "bear"
    },
    {
      "id": 4,
      "label": "cat"
    }
  ],
  "depth": 3
}
```

**Error Responses:**

- **400 Bad Request** - Invalid node ID
```json
{
  "error": "Bad request",
  "message": "Node ID must be a positive integer"
}
```

- **404 Not Found** - Node doesn't exist
```json
{
  "error": "Node not found",
  "message": "Node with ID 999 does not exist"
}
```

---

### 6. Health Check

Checks the health status of the API service.

**Endpoint:** `GET /health`

**Description:** Returns the health status of the API and database connectivity.

**Request Parameters:** None

**Response:**

- **Status Code:** `200 OK` (healthy) or `503 Service Unavailable` (unhealthy)
- **Content-Type:** `application/json`

**Healthy Response Schema:**
```json
{
  "status": "healthy",
  "message": "Tree API is running",
  "timestamp": string
}
```

**Unhealthy Response Schema:**
```json
{
  "status": "unhealthy",
  "message": "Service unavailable",
  "error": string,
  "timestamp": string
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/health
```

**Example Healthy Response:**
```json
{
  "status": "healthy",
  "message": "Tree API is running",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns consistent error response format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional technical details (optional)"
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request format or parameters
- `404 Not Found` - Requested resource doesn't exist
- `500 Internal Server Error` - Server error occurred
- `503 Service Unavailable` - Service is temporarily unavailable

### Common Error Scenarios

1. **Invalid JSON in request body**
   - Status: `400 Bad Request`
   - Response: `{"error": "Bad request", "message": "Invalid JSON"}`

2. **Missing required fields**
   - Status: `400 Bad Request`
   - Response: `{"error": "Bad request", "message": "Label is required"}`

3. **Invalid data types**
   - Status: `400 Bad Request`
   - Response: `{"error": "Bad request", "message": "ParentId must be an integer or null"}`

4. **Resource not found**
   - Status: `404 Not Found`
   - Response: `{"error": "Parent not found", "message": "Parent node with ID 999 does not exist"}`

5. **Database errors**
   - Status: `500 Internal Server Error`
   - Response: `{"error": "Internal server error", "message": "Failed to create node"}`

---

## Rate Limiting

Currently, the API does not implement rate limiting. In a production environment, consider implementing rate limiting to prevent abuse.

---

## CORS

The API supports Cross-Origin Resource Sharing (CORS) and accepts requests from any origin. In production, configure CORS to allow only trusted domains.

---

## Data Persistence

All data is persisted in an SQLite database. The database schema includes:

- **nodes** table with columns:
  - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `label` (TEXT NOT NULL)
  - `parent_id` (INTEGER, FOREIGN KEY)
  - `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

---

## Examples

### Creating a Complete Tree Structure

1. **Create root node:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "root", "parentId": null}'
```

2. **Create child nodes:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "bear", "parentId": 1}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "cat", "parentId": 3}'
```

3. **Retrieve the complete tree:**
```bash
curl -X GET http://localhost:3000/api/tree
```

### Testing with Different Tools

**Using curl:**
```bash
# Get all trees
curl -X GET http://localhost:3000/api/tree

# Create a node
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "new node", "parentId": 1}'
```

**Using HTTPie:**
```bash
# Get all trees
http GET localhost:3000/api/tree

# Create a node
http POST localhost:3000/api/tree label="new node" parentId:=1
```

**Using JavaScript fetch:**
```javascript
// Get all trees
fetch('http://localhost:3000/api/tree')
  .then(response => response.json())
  .then(data => console.log(data));

// Create a node
fetch('http://localhost:3000/api/tree', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    label: 'new node',
    parentId: 1
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Testing the API

The API includes comprehensive test suites:

- **Unit Tests**: Test individual service methods
- **Integration Tests**: Test complete API endpoints

Run tests with:
```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Run tests with coverage report
```

---

## Support and Issues

For issues, questions, or contributions, please refer to the project repository or contact the development team.