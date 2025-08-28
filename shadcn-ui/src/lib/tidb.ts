// TiDB Cloud connection and database utilities
import mysql from 'mysql2/promise';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { dbConfig } from '@/config/database';
import type { Patient } from '@/types/medical';
import type { Doctor } from '@/types/doctor';
import type { TriageItem } from '@/types/triage';

// Database class for centralized management
class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = mysql.createPool(dbConfig);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

  public async query<T extends RowDataPacket[]>(sql: string, values?: any[]): Promise<T> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.query<T>(sql, values);
      return rows;
    } finally {
      connection.release();
    }
  }
}

// Export singleton instance
export const db = Database.getInstance();

// Placeholder functions for TiDB operations

export async function storeTriageItem(item: TriageItem): Promise<string> {
  // In a real implementation, this would store the item in TiDB
  console.log("Storing triage item:", item);
  return "success";
}

export async function searchTriageItems(query: string, useVector: boolean = true): Promise<TriageItem[]> {
  // In a real implementation, this would search items in TiDB using vector search
  console.log("Searching for:", query, "Using vector:", useVector);
  
  // Return mock data for now
  return [
    {
      id: "1",
      title: "System outage in production",
      description: "The main production server is not responding to requests",
      priority: "critical",
      status: "new",
      category: "infrastructure",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      title: "User authentication failure",
      description: "Multiple users reporting inability to log in",
      priority: "high",
      status: "in_progress",
      category: "security",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ] as TriageItem[];
}

export async function getTriageItems(
  status?: string, 
  priority?: string,
  limit: number = 10
): Promise<TriageItem[]> {
  // In a real implementation, this would fetch items from TiDB
  console.log("Getting triage items with status:", status, "priority:", priority);
  
  // Return mock data for now
  return [
    {
      id: "1",
      title: "System outage in production",
      description: "The main production server is not responding to requests",
      priority: "critical",
      status: "new",
      category: "infrastructure",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      title: "User authentication failure",
      description: "Multiple users reporting inability to log in",
      priority: "high",
      status: "in_progress",
      category: "security",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      title: "Database connection timeout",
      description: "Applications experiencing slow response due to DB timeouts",
      priority: "medium",
      status: "new",
      category: "database",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "4",
      title: "Missing file in deployment",
      description: "Configuration file not found in latest deployment",
      priority: "low",
      status: "resolved",
      category: "deployment",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ] as TriageItem[];
}

export async function updateTriageItem(id: string, updates: Partial<TriageItem>): Promise<boolean> {
  // In a real implementation, this would update an item in TiDB
  console.log("Updating triage item:", id, "with:", updates);
  return true;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // In a real implementation, this would call an embedding model API
  // For now, we'll return a mock embedding
  console.log("Generating embedding for:", text);
  return Array(384).fill(0).map(() => Math.random() - 0.5);
}

export async function processNewItem(item: TriageItem): Promise<TriageItem> {
  // This function would implement the agent workflow:
  // 1. Generate embeddings
  // 2. Find similar cases
  // 3. Suggest priority and category based on similar cases
  // 4. Store in TiDB
  
  console.log("Processing new item:", item);
  
  // Generate embeddings (mock)
  const embedding = await generateEmbedding(item.title + " " + item.description);
  
  // Find similar cases (mock)
  const similarCases = await searchTriageItems(item.title, true);
  
  // For demo purposes, we'll just assign a random priority if one isn't set
  if (!item.priority) {
    const priorities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    item.priority = priorities[Math.floor(Math.random() * priorities.length)];
  }
  
  // In a real implementation, we would use the similar cases to make suggestions
  
  return {
    ...item,
    vector: embedding,
    status: item.status || 'new',
    timestamp: item.timestamp || new Date().toISOString(),
  };
}

export async function createPatient(data: Omit<Patient, 'id' | 'created_at'>) {
  try {
    const result = await db.query<RowDataPacket[]>(
      'INSERT INTO patients (name, symptoms, status) VALUES (?, ?, ?)',
      [data.name, data.symptoms, data.status]
    );
    return result[0];
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

interface DBPatient extends Patient, RowDataPacket {}

export async function getPatients() {
  try {
    const patients = await db.query<DBPatient[]>(
      'SELECT * FROM patients ORDER BY created_at DESC'
    );
    return patients;
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
}

export async function updatePatientStatus(id: number, updates: Partial<Patient>) {
  try {
    // Start building the update query
    const setClauses: string[] = [];
    const values: any[] = [];

    // Add each updateable field
    if (updates.status) {
      setClauses.push('status = ?');
      values.push(updates.status);
    }
    
    if (updates.triage) {
      setClauses.push('triage = ?');
      values.push(JSON.stringify(updates.triage));
    }

    // Add any other fields that need updating
    // e.g., medicalHistory, currentMedications, etc.

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add the ID to values array
    values.push(id);

    const query = `
      UPDATE patients 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `;

    const result = await db.query<RowDataPacket[]>(query, values);
    
    // Fetch and return the updated record
    const [updated] = await db.query<DBPatient[]>(
      'SELECT * FROM patients WHERE id = ?',
      [id]
    );
    
    return updated[0];
  } catch (error) {
    console.error('Error updating patient status:', error);
    throw error;
  }
}