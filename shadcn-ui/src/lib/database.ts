import type { Patient } from '@/types/medical';
import type { Doctor } from '@/types/doctor';
import type { TriageItem } from '@/types/triage';

// Types for database operations
type DBResult = {
  affectedRows?: number;
  insertId?: number;
  [key: string]: any;
};

// Database class for centralized management
class Database {
  private static instance: Database;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = '/api/db';
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query<T>(sql: string, values?: any[]): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql, values }),
    });

    if (!response.ok) {
      throw new Error('Database query failed');
    }

    return response.json();
  }
}

export async function storeTriageItem(item: TriageItem): Promise<string> {
  const db = Database.getInstance();
  
  try {
    const result = await db.query<DBResult>(
      `INSERT INTO triage_items (
        patient_id, title, description, priority, 
        status, category, timestamp, wait_time,
        assigned_doctor, vital_signs, vector
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.patientId,
        item.title,
        item.description,
        item.priority,
        item.status,
        item.category,
        item.timestamp,
        item.waitTime,
        item.assignedDoctor,
        JSON.stringify(item.vitalSigns),
        JSON.stringify(item.vector)
      ]
    );

    return item.id;
  } catch (error) {
    console.error('Error storing triage item:', error);
    throw error;
  }
}

export async function getPatients(): Promise<Patient[]> {
  const db = Database.getInstance();
  
  try {
    const patients = await db.query<Patient[]>(
      'SELECT * FROM patients ORDER BY created_at DESC'
    );
    
    return patients.map(patient => ({
      ...patient,
      allergies: typeof patient.allergies === 'string' 
        ? JSON.parse(patient.allergies) 
        : patient.allergies || [],
      currentMedications: typeof patient.currentMedications === 'string'
        ? JSON.parse(patient.currentMedications)
        : patient.currentMedications || []
    }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}

export async function updatePatientStatus(
  patientId: string, 
  updates: Partial<Patient>
): Promise<Patient | null> {
  const db = Database.getInstance();
  
  try {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), patientId];
    const query = `UPDATE patients SET ${setClause} WHERE id = ?`;

    const result = await db.query<DBResult>(query, values);
    
    if (result.affectedRows === 0) return null;

    const [updated] = await db.query<Patient[]>(
      'SELECT * FROM patients WHERE id = ?',
      [patientId]
    );
    
    return updated || null;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
}

export async function getDoctors(): Promise<Doctor[]> {
  const db = Database.getInstance();
  
  try {
    return await db.query<Doctor[]>('SELECT * FROM doctors');
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
}

export async function getTriageItems(): Promise<TriageItem[]> {
  const db = Database.getInstance();
  
  try {
    const items = await db.query<TriageItem[]>('SELECT * FROM triage_items ORDER BY timestamp DESC');
    return items.map(item => ({
      ...item,
      vitalSigns: typeof item.vitalSigns === 'string'
        ? JSON.parse(item.vitalSigns)
        : item.vitalSigns || {},
      vector: typeof item.vector === 'string'
        ? JSON.parse(item.vector)
        : item.vector || []
    }));
  } catch (error) {
    console.error('Error fetching triage items:', error);
    throw error;
  }
}

export default Database;
