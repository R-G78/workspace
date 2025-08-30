import mysql from 'mysql2/promise';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '../.env' });

async function initializeDatabase() {
  const pool = mysql.createPool({
    host: process.env.VITE_TIDB_HOST,
    port: parseInt(process.env.VITE_TIDB_PORT || '3306'),
    user: process.env.VITE_TIDB_USER,
    password: process.env.VITE_TIDB_PASSWORD,
    database: process.env.VITE_TIDB_DATABASE
  });

  try {
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await pool.query(statement);
      console.log('Executed:', statement.substring(0, 50) + '...');
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
