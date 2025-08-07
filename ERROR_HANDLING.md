# Tree API Error Handling Guide

This document provides comprehensive documentation for all error codes, messages, and handling scenarios in the Tree API.

## Table of Contents

- [Error Response Format](#error-response-format)
- [HTTP Status Codes](#http-status-codes)
- [Validation Errors (400)](#validation-errors-400)
- [Not Found Errors (404)](#not-found-errors-404)
- [Server Errors (500)](#server-errors-500)
- [Service Unavailable (503)](#service-unavailable-503)
- [Error Handling Best Practices](#error-handling-best-practices)
- [Client-Side Error Handling](#client-side-error-handling)

## Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "error": "Error type/category",
  "message": "Human-readable error description",
  "details": "Additional technical information (optional)"
}
```

### Fields Description

- **error**: Brief error category or type (e.g., "Bad request", "Not found")
- **message**: Detailed, human-readable error message
- **details**: Optional technical details (only included for 500-level errors)

## HTTP Status Codes

The API uses standard HTTP status codes to indicate request outcomes:

| Code | Status | Description | When Used |
|------|--------|-------------|-----------|
| 200 | OK | Success | Successful GET requests |
| 201 | Created | Resource created | Successful POST requests |
| 400 | Bad Request | Client error | Invalid request format/data |
| 404 | Not Found | Resource not found | Requested resource doesn't exist |
| 500 | Internal Server Error | Server error | Unexpected server failures |
| 503 | Service Unavailable | Service unavailable | Database connection issues |

## Validation Errors (400)

### POST /api/tree Validation Errors

#### Missing Request Body

**Scenario:** Request body is missing or not JSON

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Request body is required"
}
```

#### Missing Label Field

**Scenario:** The `label` field is not provided

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"parentId": 1}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Label is required"
}
```

#### Invalid Label Type

**Scenario:** The `label` field is not a string

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": 123, "parentId": 1}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Label must be a string"
}
```

#### Empty Label

**Scenario:** The `label` field is an empty string or only whitespace

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "", "parentId": 1}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Label cannot be empty"
}
```

#### Label Too Long

**Scenario:** The `label` field exceeds 255 characters

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "' + "x".repeat(256) + '", "parentId": 1}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Label cannot be longer than 255 characters"
}
```

#### Missing ParentId Field

**Scenario:** The `parentId` field is not provided

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test"}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "ParentId is required"
}
```

#### Invalid ParentId Type

**Scenario:** The `parentId` field is not an integer or null

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test", "parentId": "invalid"}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "ParentId must be an integer or null"
}
```

#### Negative ParentId

**Scenario:** The `parentId` field is a negative number

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test", "parentId": -1}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "ParentId must be a positive integer or null"
}
```

#### Zero ParentId

**Scenario:** The `parentId` field is zero

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test", "parentId": 0}'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "ParentId must be a positive integer or null"
}
```

### GET /api/tree/:id Validation Errors

#### Invalid Tree ID Format

**Scenario:** Tree ID is not a valid integer

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/invalid
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Tree ID must be a positive integer"
}
```

#### Negative Tree ID

**Scenario:** Tree ID is negative

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/-1
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Tree ID must be a positive integer"
}
```

#### Zero Tree ID

**Scenario:** Tree ID is zero

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/0
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Tree ID must be a positive integer"
}
```

### GET /api/tree/node/:id/path Validation Errors

#### Invalid Node ID Format

**Scenario:** Node ID is not a valid integer

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/invalid/path
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Node ID must be a positive integer"
}
```

#### Negative Node ID

**Scenario:** Node ID is negative

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/-1/path
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Node ID must be a positive integer"
}
```

### Invalid JSON Format

**Scenario:** Request body contains malformed JSON

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test", "parentId":'
```

**Response:**
```json
{
  "error": "Bad request",
  "message": "Invalid JSON"
}
```

## Not Found Errors (404)

### Parent Node Not Found

**Scenario:** Attempting to create a node with a non-existent parent ID

**Request:**
```bash
curl -X POST http://localhost:3000/api/tree \
  -H "Content-Type: application/json" \
  -d '{"label": "test", "parentId": 999}'
```

**Response:**
```json
{
  "error": "Parent not found",
  "message": "Parent node with ID 999 does not exist"
}
```

### Tree Not Found

**Scenario:** Requesting a tree with a non-existent root ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/999
```

**Response:**
```json
{
  "error": "Tree not found",
  "message": "Tree with root ID 999 does not exist"
}
```

### Node Not Found (Path Request)

**Scenario:** Requesting path for a non-existent node ID

**Request:**
```bash
curl -X GET http://localhost:3000/api/tree/node/999/path
```

**Response:**
```json
{
  "error": "Node not found",
  "message": "Node with ID 999 does not exist"
}
```

### Route Not Found

**Scenario:** Accessing a non-existent API endpoint

**Request:**
```bash
curl -X GET http://localhost:3000/api/nonexistent
```

**Response:**
```json
{
  "error": "Not found",
  "message": "Route GET /api/nonexistent not found",
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

### Wrong HTTP Method

**Scenario:** Using wrong HTTP method on existing endpoint

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/tree
```

**Response:**
```json
{
  "error": "Not found",
  "message": "Route DELETE /api/tree not found",
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

## Server Errors (500)

### Database Connection Failure

**Scenario:** Database is unavailable or connection fails

**Response:**
```json
{
  "error": "Internal server error",
  "message": "Failed to retrieve trees",
  "details": "Database connection failed"
}
```

### Database Query Failure

**Scenario:** SQL query execution fails

**Response:**
```json
{
  "error": "Internal server error",
  "message": "Failed to create node",
  "details": "UNIQUE constraint failed: nodes.id"
}
```

### Unexpected Application Error

**Scenario:** Unhandled exception in application logic

**Response:**
```json
{
  "error": "Internal server error",
  "message": "Failed to retrieve trees",
  "details": "Cannot read property 'id' of undefined"
}
```

### Memory or Resource Exhaustion

**Scenario:** Server runs out of memory or other resources

**Response:**
```json
{
  "error": "Internal server error",
  "message": "Failed to process request",
  "details": "JavaScript heap out of memory"
}
```

## Service Unavailable (503)

### Health Check Failure

**Scenario:** Service health check fails due to database issues

**Request:**
```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "status": "unhealthy",
  "message": "Service unavailable",
  "error": "Database connection timeout",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### Service Shutdown

**Scenario:** Service is shutting down or unavailable

**Response:**
```json
{
  "status": "unhealthy",
  "message": "Service unavailable",
  "error": "Service has been shut down and cannot be reinitialized",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

## Error Handling Best Practices

### For API Consumers

1. **Always Check Status Codes**
   ```javascript
   const response = await fetch('/api/tree');
   if (!response.ok) {
     const error = await response.json();
     console.error('API Error:', error.message);
     // Handle error appropriately
   }
   ```

2. **Parse Error Messages**
   ```javascript
   try {
     const response = await fetch('/api/tree', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ label: '', parentId: null })
     });
     
     if (!response.ok) {
       const error = await response.json();
       
       // Handle specific error types
       switch (response.status) {
         case 400:
           console.error('Validation Error:', error.message);
           break;
         case 404:
           console.error('Not Found:', error.message);
           break;
         case 500:
           console.error('Server Error:', error.message);
           break;
         default:
           console.error('Unknown Error:', error.message);
       }
     }
   } catch (networkError) {
     console.error('Network Error:', networkError.message);
   }
   ```

3. **Implement Retry Logic for 5xx Errors**
   ```javascript
   async function apiCallWithRetry(url, options, maxRetries = 3) {
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
       try {
         const response = await fetch(url, options);
         
         if (response.ok) {
           return response;
         }
         
         // Don't retry 4xx errors
         if (response.status >= 400 && response.status < 500) {
           throw new Error(`Client error: ${response.status}`);
         }
         
         // Retry 5xx errors
         if (attempt < maxRetries) {
           await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
           continue;
         }
         
         throw new Error(`Server error after ${maxRetries} attempts`);
       } catch (error) {
         if (attempt === maxRetries) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
       }
     }
   }
   ```

4. **Validate Input Before Sending**
   ```javascript
   function validateCreateNodeRequest(data) {
     const errors = [];
     
     if (!data.label) {
       errors.push('Label is required');
     } else if (typeof data.label !== 'string') {
       errors.push('Label must be a string');
     } else if (data.label.trim().length === 0) {
       errors.push('Label cannot be empty');
     } else if (data.label.length > 255) {
       errors.push('Label cannot be longer than 255 characters');
     }
     
     if (!data.hasOwnProperty('parentId')) {
       errors.push('ParentId is required');
     } else if (data.parentId !== null && (!Number.isInteger(data.parentId) || data.parentId <= 0)) {
       errors.push('ParentId must be a positive integer or null');
     }
     
     return errors;
   }
   
   // Usage
   const nodeData = { label: 'test', parentId: 1 };
   const validationErrors = validateCreateNodeRequest(nodeData);
   
   if (validationErrors.length > 0) {
     console.error('Validation failed:', validationErrors);
     return;
   }
   
   // Proceed with API call
   ```

### For Server Monitoring

1. **Log All Errors**
   ```javascript
   // Error logging is already implemented in the Tree API
   console.error('POST /api/tree - Error:', error.message);
   ```

2. **Monitor Error Rates**
   - Track 4xx error rates (client errors)
   - Track 5xx error rates (server errors)
   - Set up alerts for high error rates

3. **Health Check Monitoring**
   ```bash
   # Monitor health endpoint
   curl -f http://localhost:3000/health || echo "Service is down"
   ```

## Client-Side Error Handling

### JavaScript/Node.js

```javascript
class TreeAPIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async createNode(label, parentId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, parentId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new APIError(data.error, data.message, response.status);
      }
      
      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network Error', error.message, 0);
    }
  }
  
  async getAllTrees() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tree`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new APIError(data.error, data.message, response.status);
      }
      
      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network Error', error.message, 0);
    }
  }
}

class APIError extends Error {
  constructor(type, message, status) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.status = status;
  }
}

// Usage
const client = new TreeAPIClient('http://localhost:3000');

try {
  const node = await client.createNode('Test Node', 1);
  console.log('Created node:', node);
} catch (error) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 400:
        console.error('Invalid input:', error.message);
        break;
      case 404:
        console.error('Parent not found:', error.message);
        break;
      case 500:
        console.error('Server error:', error.message);
        break;
      default:
        console.error('API error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class TreeAPIError(Exception):
    def __init__(self, error_type: str, message: str, status_code: int):
        super().__init__(message)
        self.error_type = error_type
        self.message = message
        self.status_code = status_code

class TreeAPIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def create_node(self, label: str, parent_id: Optional[int] = None) -> Dict[str, Any]:
        try:
            response = requests.post(
                f'{self.base_url}/api/tree',
                json={'label': label, 'parentId': parent_id}
            )
            
            data = response.json()
            
            if not response.ok:
                raise TreeAPIError(data['error'], data['message'], response.status_code)
            
            return data
        except requests.RequestException as e:
            raise TreeAPIError('Network Error', str(e), 0)
    
    def get_all_trees(self) -> List[Dict[str, Any]]:
        try:
            response = requests.get(f'{self.base_url}/api/tree')
            data = response.json()
            
            if not response.ok:
                raise TreeAPIError(data['error'], data['message'], response.status_code)
            
            return data
        except requests.RequestException as e:
            raise TreeAPIError('Network Error', str(e), 0)

# Usage
client = TreeAPIClient('http://localhost:3000')

try:
    node = client.create_node('Test Node', 1)
    print(f'Created node: {node}')
except TreeAPIError as e:
    if e.status_code == 400:
        print(f'Invalid input: {e.message}')
    elif e.status_code == 404:
        print(f'Parent not found: {e.message}')
    elif e.status_code == 500:
        print(f'Server error: {e.message}')
    else:
        print(f'API error: {e.message}')
except Exception as e:
    print(f'Unexpected error: {e}')
```

This comprehensive error handling guide covers all possible error scenarios in the Tree API and provides best practices for both API consumers and server monitoring.