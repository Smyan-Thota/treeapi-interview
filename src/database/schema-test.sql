-- Tree API Test Database Schema
-- This file contains the SQL schema for testing (no sample data)

-- Create the nodes table to store tree nodes
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    parent_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES nodes(id)
);

-- Create index on parent_id for efficient tree queries
CREATE INDEX IF NOT EXISTS idx_parent_id ON nodes(parent_id);