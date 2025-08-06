# Tree API Server - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Tree API server to verify all functionality works correctly.

## Prerequisites

Ensure you have Node.js installed and all dependencies are available:

```bash
npm install
```

## 🚀 Starting the Server

### 1. Start the Server

```bash
cd /path/to/treeAPI_interview
node src/app.js
```

**Expected Output:**
```
🚀 Tree API Server started successfully!
📍 Server running on port 3000
🌍 Environment: development
📋 API Base URL: http://localhost:3000
📚 Available endpoints:
   GET  /health               - Health check
   GET  /api/tree             - Get all trees
   POST /api/tree             - Create new node
   GET  /api/tree/:id         - Get specific tree
   GET  /api/tree/stats       - Get service statistics
   GET  /api/tree/node/:id/path - Get node path
✅ Server ready to accept connections
```

### 2. Verify Server is Running

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "Tree API is running",
  "timestamp": "2025-08-06T22:09:42.009Z"
}
```

## 📋 API Testing Guide

### 3. Test API Documentation Endpoint

```bash
curl http://localhost:3000/
```

**Expected Response:**
```json
{
  "name": "Tree API Server",
  "version": "1.0.0",
  "description": "A production-ready HTTP server to handle tree data structures",
  "endpoints": {
    "health": "GET /health",
    "getAllTrees": "GET /api/tree",
    "createNode": "POST /api/tree",
    "getTreeById": "GET /api/tree/:id",
    "getStats": "GET /api/tree/stats",
    "getNodePath": "GET /api/tree/node/:id/path"
  },
  "documentation": { ... }
}
```

### 4. Get Initial Tree State

Test the main API endpoint to see the initial tree structure:

```bash
curl http://localhost:3000/api/tree
```

**Expected Response (Sample Data):**
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

This matches the example from the problem statement!

## 🌳 Building and Testing the Tree Structure

### 5. Create a New Root Node

```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"my-root","parentId":null}'
```

**Expected Response:**
```json
{
  "id": 5,
  "label": "my-root",
  "children": []
}
```

### 6. Add Children to Your Root Node

```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"first-child","parentId":5}'
```

**Expected Response:**
```json
{
  "id": 6,
  "label": "first-child",
  "children": []
}
```

### 7. Add Another Child

```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"second-child","parentId":5}'
```

**Expected Response:**
```json
{
  "id": 7,
  "label": "second-child",
  "children": []
}
```

### 8. Add Grandchildren

Add a child to your first child:

```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"grandchild","parentId":6}'
```

**Expected Response:**
```json
{
  "id": 8,
  "label": "grandchild",
  "children": []
}
```

### 9. Verify Complete Tree Structure

Check how your tree looks now:

```bash
curl http://localhost:3000/api/tree
```

**Expected Response (now with multiple trees):**
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
  },
  {
    "id": 5,
    "label": "my-root",
    "children": [
      {
        "id": 6,
        "label": "first-child",
        "children": [
          {
            "id": 8,
            "label": "grandchild",
            "children": []
          }
        ]
      },
      {
        "id": 7,
        "label": "second-child",
        "children": []
      }
    ]
  }
]
```

### 10. Add to Existing Tree

Add a new child to the existing "cat" node (ID 4):

```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"cats-child","parentId":4}'
```

**Expected Response:**
```json
{
  "id": 9,
  "label": "cats-child",
  "children": []
}
```

## 🔍 Advanced Testing

### 11. Get Specific Tree by ID

Get only the tree with root ID 1:

```bash
curl http://localhost:3000/api/tree/1
```

**Expected Response:**
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
          "children": [
            {
              "id": 9,
              "label": "cats-child",
              "children": []
            }
          ]
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
```

### 12. Get Service Statistics

```bash
curl http://localhost:3000/api/tree/stats
```

**Expected Response:**
```json
{
  "database": {
    "totalNodes": 9,
    "rootNodes": 2,
    "roots": [
      { "id": 1, "label": "root" },
      { "id": 5, "label": "my-root" }
    ]
  },
  "trees": {
    "count": 2,
    "totalNodes": 9,
    "structures": [
      {
        "rootId": 1,
        "rootLabel": "root",
        "nodeCount": 5
      },
      {
        "rootId": 5,
        "rootLabel": "my-root",
        "nodeCount": 4
      }
    ]
  }
}
```

### 13. Get Path to Node

Get the path from root to the "grandchild" node (ID 8):

```bash
curl http://localhost:3000/api/tree/node/8/path
```

**Expected Response:**
```json
{
  "nodeId": 8,
  "path": [
    { "id": 5, "label": "my-root" },
    { "id": 6, "label": "first-child" },
    { "id": 8, "label": "grandchild" }
  ],
  "depth": 3
}
```

## ❌ Error Testing

### 14. Test Invalid Requests

#### Missing Label:
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"parentId":1}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Label is required"
}
```

#### Empty Label:
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"","parentId":1}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Label cannot be empty"
}
```

#### Non-existent Parent:
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"test","parentId":999}'
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Parent not found",
  "message": "Failed to create node: Parent node with ID 999 does not exist"
}
```

#### Invalid JSON:
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label":"test","parentId":}'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Invalid JSON",
  "message": "Request body contains invalid JSON"
}
```

#### Invalid ID Parameter:
```bash
curl http://localhost:3000/api/tree/invalid
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Tree ID must be a positive integer"
}
```

#### Non-existent Tree:
```bash
curl http://localhost:3000/api/tree/999
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Tree not found",
  "message": "Tree with root ID 999 does not exist"
}
```

### 15. Test 404 Handler

```bash
curl http://localhost:3000/api/unknown
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Route GET /api/unknown not found",
  "message": "Route GET /api/unknown not found",
  "availableEndpoints": [
    "GET /api/tree",
    "POST /api/tree",
    "GET /api/tree/:id",
    "GET /api/tree/stats",
    "GET /api/tree/node/:id/path",
    "GET /health"
  ]
}
```

## 🔄 Persistence Testing

### 16. Test Data Persistence

1. **Stop the server** (Ctrl+C in the terminal where it's running)

2. **Restart the server:**
```bash
node src/app.js
```

3. **Verify data persisted:**
```bash
curl http://localhost:3000/api/tree
```

You should see all the trees and nodes you created are still there!

## 🧪 Browser Testing

You can also test in a browser by visiting:

- **API Documentation:** http://localhost:3000/
- **Health Check:** http://localhost:3000/health
- **Get All Trees:** http://localhost:3000/api/tree
- **Get Specific Tree:** http://localhost:3000/api/tree/1
- **Service Stats:** http://localhost:3000/api/tree/stats
- **Node Path:** http://localhost:3000/api/tree/node/4/path

## 🛑 Shutting Down

To stop the server gracefully:
- Press `Ctrl+C` in the terminal running the server
- Or send a SIGTERM signal: `kill -TERM <process_id>`

**Expected Shutdown Output:**
```
Received SIGTERM, starting graceful shutdown...
Server closed gracefully
```

## ✅ Success Criteria

Your manual testing is successful if:

1. ✅ Server starts without errors
2. ✅ Health check returns "healthy" status
3. ✅ GET /api/tree returns hierarchical tree structure
4. ✅ POST /api/tree creates nodes successfully
5. ✅ Tree structure updates correctly after adding nodes
6. ✅ Error responses are properly formatted with correct status codes
7. ✅ Data persists between server restarts
8. ✅ All additional endpoints work correctly
9. ✅ Invalid requests are rejected with appropriate errors
10. ✅ Server shuts down gracefully

## 📁 Database Location

The SQLite database file is stored at: `database/tree.db`

You can inspect it directly if needed, but the API provides all necessary access to the data.

---

**Congratulations!** 🎉 You've successfully tested a production-ready Tree API server that meets all the requirements from the problem statement.