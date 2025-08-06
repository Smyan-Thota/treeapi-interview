const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseConnection {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '../../database/tree.db');
        // Use test schema when running tests
        const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
        this.schemaPath = path.join(__dirname, isTest ? 'schema-test.sql' : 'schema.sql');
    }

    /**
     * Initialize database connection and create tables if they don't exist
     */
    async connect() {
        return new Promise((resolve, reject) => {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeSchema()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    /**
     * Initialize database schema
     */
    async initializeSchema() {
        return new Promise((resolve, reject) => {
            // Read and execute schema file
            fs.readFile(this.schemaPath, 'utf8', (err, sql) => {
                if (err) {
                    console.error('Error reading schema file:', err.message);
                    reject(err);
                    return;
                }

                // Execute each SQL statement
                this.db.exec(sql, (err) => {
                    if (err) {
                        console.error('Error executing schema:', err.message);
                        reject(err);
                    } else {
                        console.log('Database schema initialized successfully');
                        resolve();
                    }
                });
            });
        });
    }

    /**
     * Execute a SQL query with parameters
     * @param {string} sql - SQL query string
     * @param {Array} params - Parameters for the query
     * @returns {Promise} Promise that resolves with query results
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error executing query:', err.message);
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Get a single row from database
     * @param {string} sql - SQL query string
     * @param {Array} params - Parameters for the query
     * @returns {Promise} Promise that resolves with single row
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error executing query:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows from database
     * @param {string} sql - SQL query string
     * @param {Array} params - Parameters for the query
     * @returns {Promise} Promise that resolves with array of rows
     */
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error executing query:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Close database connection
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get database instance (for direct access if needed)
     */
    getDatabase() {
        return this.db;
    }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;