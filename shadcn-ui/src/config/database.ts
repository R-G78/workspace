import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.TIDB_HOST || '',
  port: parseInt(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER || '',
  password: process.env.TIDB_PASSWORD || '',
  database: process.env.TIDB_DATABASE || 'test',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
};

const pool = mysql.createPool(dbConfig);

export default pool;