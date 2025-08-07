# Tree API Examples

This document provides comprehensive examples for all Tree API endpoints with different scenarios and use cases.

## Table of Contents

- [Basic Operations](#basic-operations)
- [Error Scenarios](#error-scenarios)
- [Advanced Use Cases](#advanced-use-cases)
- [Complete Workflows](#complete-workflows)
- [Testing Scripts](#testing-scripts)

## Basic Operations

### 1. Health Check

Check if the API service is running and healthy.

**Request:**
```bash
curl -X GET http://localhost:3000/health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "message": "Tree API is running",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "message": "Service unavailable",
  "error": "Database connection failed",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### 2. Create Root Node

Create a root node (parent is null).

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Animals",
    "parentId": null
  }'
```

**Response:**
```json
{
  "id": 1,
  "label": "Animals",
  "children": []
}
```

### 3. Create Child Nodes

Create child nodes with valid parent IDs.

**Request (First Child):**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Mammals",
    "parentId": 1
  }'
```

**Response:**
```json
{
  "id": 2,
  "label": "Mammals",
  "children": []
}
```

**Request (Second Child):**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Birds",
    "parentId": 1
  }'
```

**Response:**
```json
{
  "id": 3,
  "label": "Birds",
  "children": []
}
```

### 4. Create Nested Children

Create deeply nested nodes.

**Request (Grandchild):**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Dogs",
    "parentId": 2
  }'
```

**Response:**
```json
{
  "id": 4,
  "label": "Dogs",
  "children": []
}
```

**Request (Great-grandchild):**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Golden Retriever",
    "parentId": 4
  }'
```

**Response:**
```json
{
  "id": 5,
  "label": "Golden Retriever",
  "children": []
}
```

### 5. Get All Trees

Retrieve all trees in hierarchical format.

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree
```

**Response:**
```json
[
  {
    "id": 1,
    "label": "Animals",
    "children": [
      {
        "id": 2,
        "label": "Mammals",
        "children": [
          {
            "id": 4,
            "label": "Dogs",
            "children": [
              {
                "id": 5,
                "label": "Golden Retriever",
                "children": []
              }
            ]
          }
        ]
      },
      {
        "id": 3,
        "label": "Birds",
        "children": []
      }
    ]
  }
]
```

### 6. Get Specific Tree

Get a tree by its root node ID.

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/1
```

**Response:**
```json
{
  "id": 1,
  "label": "Animals",
  "children": [
    {
      "id": 2,
      "label": "Mammals",
      "children": [
        {
          "id": 4,
          "label": "Dogs",
          "children": [
            {
              "id": 5,
              "label": "Golden Retriever",
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": 3,
      "label": "Birds",
      "children": []
    }
  ]
}
```

### 7. Get Service Statistics

Get statistics about the tree service.

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/stats
```

**Response:**
```json
{
  "totalNodes": 5,
  "totalTrees": 1,
  "maxDepth": 4,
  "serviceUptime": "1 hour, 23 minutes",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### 8. Get Node Path

Get the path from root to a specific node.

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/5/path
```

**Response:**
```json
{
  "nodeId": 5,
  "path": [
    {
      "id": 1,
      "label": "Animals"
    },
    {
      "id": 2,
      "label": "Mammals"
    },
    {
      "id": 4,
      "label": "Dogs"
    },
    {
      "id": 5,
      "label": "Golden Retriever"
    }
  ],
  "depth": 4
}
```

## Error Scenarios

### 1. Invalid Request Body

**Missing Label:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "parentId": 1
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Label is required"
}
```

**Empty Label:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "",
    "parentId": 1
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Label cannot be empty"
}
```

**Missing ParentId:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "test"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "ParentId is required"
}
```

**Invalid ParentId Type:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "test",
    "parentId": "invalid"
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "ParentId must be an integer or null"
}
```

**Negative ParentId:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "test",
    "parentId": -1
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "ParentId must be a positive integer or null"
}
```

### 2. Parent Not Found

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "test",
    "parentId": 999
  }'
```

**Response (404 Not Found):**
```json
{
  "error": "Parent not found",
  "message": "Parent node with ID 999 does not exist"
}
```

### 3. Invalid Tree ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/invalid
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Tree ID must be a positive integer"
}
```

### 4. Tree Not Found

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/999
```

**Response (404 Not Found):**
```json
{
  "error": "Tree not found",
  "message": "Tree with root ID 999 does not exist"
}
```

### 5. Invalid Node ID for Path

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/invalid/path
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Node ID must be a positive integer"
}
```

### 6. Node Not Found for Path

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/999/path
```

**Response (404 Not Found):**
```json
{
  "error": "Node not found",
  "message": "Node with ID 999 does not exist"
}
```

### 7. Invalid JSON

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test", "parentId":'
```

**Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "message": "Invalid JSON"
}
```

### 8. Unknown Route

**Request:**
```bash
curl -X GET http://localhost:3000/api/unknown
```

**Response (404 Not Found):**
```json
{
  "error": "Not found",
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

## Advanced Use Cases

### 1. Multiple Trees

Create multiple independent trees.

**Create First Tree:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Technology", "parentId": null}'
```

**Create Second Tree:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Sports", "parentId": null}'
```

**Get All Trees:**
```bash
curl -X GET http://localhost:3000/api/tree
```

**Response:**
```json
[
  {
    "id": 1,
    "label": "Technology",
    "children": []
  },
  {
    "id": 2,
    "label": "Sports",
    "children": []
  }
]
```

### 2. Deep Nesting

Create a deeply nested tree structure.

```bash
# Root
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Universe", "parentId": null}'

# Level 1
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Milky Way", "parentId": 1}'

# Level 2
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Solar System", "parentId": 2}'

# Level 3
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Earth", "parentId": 3}'

# Level 4
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "North America", "parentId": 4}'

# Level 5
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "United States", "parentId": 5}'
```

### 3. Special Characters in Labels

Handle special characters and Unicode in node labels.

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Café & Restaurant 🍽️",
    "parentId": null
  }'
```

**Request with Quotes:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{
    "label": "\"Quoted\" Label with '\''apostrophe'\''",
    "parentId": 1
  }'
```

## Complete Workflows

### 1. Building an Organizational Chart

Create a complete organizational structure.

```bash
# CEO
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "CEO", "parentId": null}'

# VPs
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "VP Engineering", "parentId": 1}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "VP Sales", "parentId": 1}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "VP Marketing", "parentId": 1}'

# Engineering Teams
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Frontend Team", "parentId": 2}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Backend Team", "parentId": 2}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "DevOps Team", "parentId": 2}'

# Individual Contributors
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Senior Frontend Developer", "parentId": 5}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Frontend Developer", "parentId": 5}'
```

### 2. Product Catalog

Build a product catalog structure.

```bash
# Root Categories
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Electronics", "parentId": null}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Clothing", "parentId": null}'

# Electronics Subcategories
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Computers", "parentId": 1}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Phones", "parentId": 1}'

# Computer Types
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Laptops", "parentId": 3}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Desktops", "parentId": 3}'

# Specific Products
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "MacBook Pro 16-inch", "parentId": 5}'

curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Dell XPS 13", "parentId": 5}'
```

## Testing Scripts

### 1. Bash Script for Complete Test Suite

Create a file named `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "🧪 Tree API Test Suite"
echo "======================"

# Health Check
echo "1. Health Check..."
curl -s "$BASE_URL/health" | jq '.'

# Create Root Node
echo -e "\n2. Creating root node..."
ROOT_RESPONSE=$(curl -s -X POST "$API_URL/tree" \
  -H "Content-Type: application/json" \
  -d '{"label": "Test Root", "parentId": null}')
echo "$ROOT_RESPONSE" | jq '.'
ROOT_ID=$(echo "$ROOT_RESPONSE" | jq -r '.id')

# Create Child Node
echo -e "\n3. Creating child node..."
CHILD_RESPONSE=$(curl -s -X POST "$API_URL/tree" \
  -H "Content-Type: application/json" \
  -d "{\"label\": \"Test Child\", \"parentId\": $ROOT_ID}")
echo "$CHILD_RESPONSE" | jq '.'
CHILD_ID=$(echo "$CHILD_RESPONSE" | jq -r '.id')

# Get All Trees
echo -e "\n4. Getting all trees..."
curl -s "$API_URL/tree" | jq '.'

# Get Specific Tree
echo -e "\n5. Getting specific tree..."
curl -s "$API_URL/tree/$ROOT_ID" | jq '.'

# Get Node Path
echo -e "\n6. Getting node path..."
curl -s "$API_URL/tree/node/$CHILD_ID/path" | jq '.'

# Get Statistics
echo -e "\n7. Getting statistics..."
curl -s "$API_URL/tree/stats" | jq '.'

# Test Error Cases
echo -e "\n8. Testing error cases..."

# Invalid parent
echo -e "\n   8.1. Invalid parent ID..."
curl -s -X POST "$API_URL/tree" \
  -H "Content-Type: application/json" \
  -d '{"label": "Invalid", "parentId": 999}' | jq '.'

# Missing label
echo -e "\n   8.2. Missing label..."
curl -s -X POST "$API_URL/tree" \
  -H "Content-Type: application/json" \
  -d '{"parentId": 1}' | jq '.'

# Invalid tree ID
echo -e "\n   8.3. Invalid tree ID..."
curl -s "$API_URL/tree/invalid" | jq '.'

echo -e "\n✅ Test suite completed!"
```

Make it executable and run:
```bash
chmod +x test_api.sh
./test_api.sh
```

### 2. Node.js Test Script

Create a file named `test_api.js`:

```javascript
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

async function testAPI() {
  console.log('🧪 Tree API Test Suite');
  console.log('======================');

  try {
    // 1. Health Check
    console.log('1. Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(JSON.stringify(healthData, null, 2));

    // 2. Create Root Node
    console.log('\n2. Creating root node...');
    const rootResponse = await fetch(`${API_URL}/tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Test Root', parentId: null })
    });
    const rootData = await rootResponse.json();
    console.log(JSON.stringify(rootData, null, 2));
    const rootId = rootData.id;

    // 3. Create Child Node
    console.log('\n3. Creating child node...');
    const childResponse = await fetch(`${API_URL}/tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Test Child', parentId: rootId })
    });
    const childData = await childResponse.json();
    console.log(JSON.stringify(childData, null, 2));
    const childId = childData.id;

    // 4. Get All Trees
    console.log('\n4. Getting all trees...');
    const treesResponse = await fetch(`${API_URL}/tree`);
    const treesData = await treesResponse.json();
    console.log(JSON.stringify(treesData, null, 2));

    // 5. Get Node Path
    console.log('\n5. Getting node path...');
    const pathResponse = await fetch(`${API_URL}/tree/node/${childId}/path`);
    const pathData = await pathResponse.json();
    console.log(JSON.stringify(pathData, null, 2));

    // 6. Get Statistics
    console.log('\n6. Getting statistics...');
    const statsResponse = await fetch(`${API_URL}/tree/stats`);
    const statsData = await statsResponse.json();
    console.log(JSON.stringify(statsData, null, 2));

    console.log('\n✅ Test suite completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
```

Run with:
```bash
node test_api.js
```

### 3. Python Test Script

Create a file named `test_api.py`:

```python
import requests
import json

BASE_URL = 'http://localhost:3000'
API_URL = f'{BASE_URL}/api'

def test_api():
    print('🧪 Tree API Test Suite')
    print('======================')
    
    try:
        # 1. Health Check
        print('1. Health Check...')
        response = requests.get(f'{BASE_URL}/health')
        print(json.dumps(response.json(), indent=2))
        
        # 2. Create Root Node
        print('\n2. Creating root node...')
        root_response = requests.post(f'{API_URL}/tree', 
            json={'label': 'Test Root', 'parentId': None})
        root_data = root_response.json()
        print(json.dumps(root_data, indent=2))
        root_id = root_data['id']
        
        # 3. Create Child Node
        print('\n3. Creating child node...')
        child_response = requests.post(f'{API_URL}/tree',
            json={'label': 'Test Child', 'parentId': root_id})
        child_data = child_response.json()
        print(json.dumps(child_data, indent=2))
        child_id = child_data['id']
        
        # 4. Get All Trees
        print('\n4. Getting all trees...')
        trees_response = requests.get(f'{API_URL}/tree')
        print(json.dumps(trees_response.json(), indent=2))
        
        # 5. Get Node Path
        print('\n5. Getting node path...')
        path_response = requests.get(f'{API_URL}/tree/node/{child_id}/path')
        print(json.dumps(path_response.json(), indent=2))
        
        # 6. Get Statistics
        print('\n6. Getting statistics...')
        stats_response = requests.get(f'{API_URL}/tree/stats')
        print(json.dumps(stats_response.json(), indent=2))
        
        print('\n✅ Test suite completed successfully!')
        
    except Exception as e:
        print(f'❌ Test failed: {str(e)}')

if __name__ == '__main__':
    test_api()
```

Run with:
```bash
python test_api.py
```

## Performance Testing

### Load Testing with curl

Test creating multiple nodes quickly:

```bash
#!/bin/bash

echo "🚀 Performance Test - Creating 100 nodes"

# Create root node
ROOT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "Load Test Root", "parentId": null}')
ROOT_ID=$(echo "$ROOT_RESPONSE" | jq -r '.id')

echo "Root node created with ID: $ROOT_ID"

# Create 100 child nodes
for i in {1..100}; do
  curl -s -X POST http://localhost:3000/api/tree \
    -H "Content-Type: application/json" \
    -d "{\"label\": \"Node $i\", \"parentId\": $ROOT_ID}" > /dev/null
  
  if [ $((i % 10)) -eq 0 ]; then
    echo "Created $i nodes..."
  fi
done

echo "✅ Created 100 nodes successfully!"

# Get final tree
echo "📊 Final tree structure size:"
curl -s http://localhost:3000/api/tree/stats | jq '.totalNodes'
```

This completes the comprehensive examples documentation for all Tree API endpoints with various scenarios, error cases, and testing approaches.