Acceptance criteria
Using any programming language and libraries you would like:
An HTTP server is built to handle tree data structures. The server will expose two endpoints:
GET /api/tree - Returns an array of all trees that exist in the database
POST /api/tree - Creates a new node and attaches it to the specified parent node in the tree
A persistence layer is implemented within the HTTP server, e.g data is retained between server starts/stops
Testing is implemented ensure the server is behaving as expected
Hint: complete this challenge as a production API made available to other developers.

Specifications
GET /api/tree
Example Response: 
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
                    },
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


POST /api/tree
Example request body:
{
  "label": "cat’s child",
  "parentId": 4
}
