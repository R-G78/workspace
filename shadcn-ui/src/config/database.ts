import mysql, { Pool } from 'mysql2/promise';

export const dbConfig = {
  host: process.env.TIDB_HOST || '',
  port: parseInt(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER || '',
  password: process.env.TIDB_PASSWORD || '',
  database: process.env.TIDB_DATABASE || 'test',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
};

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPoolConfig: Pool | undefined
}

const createPool = () => mysql.createPool(dbConfig as any)

export const getPool = () => {
  const pool = global.__mysqlPoolConfig || createPool()
  if (process.env.NODE_ENV !== 'production') global.__mysqlPoolConfig = pool
  return pool
}

export default getPool()