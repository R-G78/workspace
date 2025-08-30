import { NextApiRequest, NextApiResponse } from 'next';
import mysql, { Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined
}

const createPool = () =>
  mysql.createPool({
    host: process.env.VITE_TIDB_HOST,
    port: parseInt(process.env.VITE_TIDB_PORT || '4000'),
    user: process.env.VITE_TIDB_USER,
    password: process.env.VITE_TIDB_PASSWORD,
    database: process.env.VITE_TIDB_DATABASE,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  })

const pool = global.__mysqlPool || createPool()

if (process.env.NODE_ENV !== 'production') global.__mysqlPool = pool

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query, values } = req.body;
    const [results] = await pool.query(query, values);
    res.status(200).json(results);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  }
}
