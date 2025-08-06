-- Tree API Database Schema
-- This file contains the SQL schema for the tree data structure

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

-- Insert some sample data for testing
INSERT OR IGNORE INTO nodes (id, label, parent_id) VALUES
(1, 'root', NULL),
(3, 'bear', 1),
(4, 'cat', 3),
(7, 'frog', 1);