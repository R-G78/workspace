import { connect } from '@tidbcloud/serverless';
import type { FullResult, Row } from '@tidbcloud/serverless';
import type { Patient, Doctor, TriageItem } from '@/types';
import { mockPatients, mockDoctors } from './mock-data';

// Helper function to get rows from TiDB result
function getRows<T>(result: FullResult | Row[]): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  return (result as FullResult).rows as T[];
}

// Initialize TiDB Serverless client
const db = connect({
  url: process.env.TIDB_URL || '',
  username: process.env.TIDB_USERNAME || '',
  password: process.env.TIDB_PASSWORD || ''
});

// Schema definitions
const SCHEMA = {
  patients: `
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      age INT,
      gender VARCHAR(50),
      symptoms TEXT,
      medical_history TEXT,
      status VARCHAR(50),
      contact_number VARCHAR(100),
      insurance_info TEXT,
      allergies JSON,
      current_medications JSON,
      emergency_contact TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  triage: `
    CREATE TABLE IF NOT EXISTS triage_items (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255),
      title VARCHAR(255),
      description TEXT,
      priority VARCHAR(50),
      status VARCHAR(50),
      category VARCHAR(100),
      timestamp TIMESTAMP,
      wait_time INT,
      assigned_doctor VARCHAR(255),
      vital_signs JSON,
      vector JSON,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (assigned_doctor) REFERENCES doctors(id)
    )
  `,
  doctors: `
    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      specialization VARCHAR(100),
      department VARCHAR(100),
      status VARCHAR(50),
      current_patients INT DEFAULT 0,
      schedule JSON
    )
  `
};

// Initialize database tables
export async function initializeDatabase() {
  try {
    for (const [table, schema] of Object.entries(SCHEMA)) {
      await db.execute(schema);
      console.log(`Created table: ${table}`);
    }

    // Seed initial data if tables are empty
    const doctorsCount = await db.execute('SELECT COUNT(*) as count FROM doctors');
    const rows = getRows<{count: number}>(doctorsCount);
    if (rows[0].count === 0) {
      await seedInitialData();
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Falling back to mock data');
  }
}

async function seedInitialData() {
  // Seed doctors
  for (const doctor of mockDoctors) {
    await db.execute(
      `INSERT INTO doctors (id, name, specialization, department, status, schedule)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        doctor.id,
        doctor.name,
        doctor.specialization,
        doctor.department,
        doctor.status,
        JSON.stringify(doctor.schedule)
      ]
    );
  }

  // Seed initial patients
  for (const patient of mockPatients) {
    await db.execute(
      `INSERT INTO patients (
        id, name, age, gender, symptoms, medical_history,
        status, contact_number, insurance_info, allergies,
        current_medications, emergency_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.id,
        patient.name,
        patient.age,
        patient.gender,
        patient.symptoms,
        patient.medicalHistory,
        patient.status,
        patient.contactNumber,
        patient.insuranceInfo,
        JSON.stringify(patient.allergies),
        JSON.stringify(patient.currentMedications),
        patient.emergencyContact
      ]
    );

    // Add corresponding triage item if exists
    if (patient.triage) {
      await db.execute(
        `INSERT INTO triage_items (
          id, patient_id, title, description, priority,
          status, category, timestamp, wait_time, assigned_doctor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient.triage.id,
          patient.id,
          patient.triage.title,
          patient.triage.description,
          patient.triage.priority,
          patient.triage.status,
          patient.triage.category,
          patient.triage.timestamp,
          patient.triage.waitTime,
          patient.triage.assignedDoctor
        ]
      );
    }
  }
}

// Data Access Layer
export async function getPatients(): Promise<Patient[]> {
  try {
    const result = await db.execute(
      `SELECT p.*, t.* FROM patients p 
       LEFT JOIN triage_items t ON p.id = t.patient_id`
    );

    const rows = getRows<any>(result);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      symptoms: row.symptoms,
      medicalHistory: row.medical_history,
      status: row.status,
      contactNumber: row.contact_number,
      insuranceInfo: row.insurance_info,
      allergies: JSON.parse(row.allergies || '[]'),
      currentMedications: JSON.parse(row.current_medications || '[]'),
      emergencyContact: row.emergency_contact,
      created_at: row.created_at,
      triage: row.patient_id ? {
        id: row.triage_id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.triage_status,
        category: row.category,
        timestamp: row.timestamp,
        waitTime: row.wait_time,
        assignedDoctor: row.assigned_doctor,
        vitalSigns: JSON.parse(row.vital_signs || '{}'),
        vector: JSON.parse(row.vector || '[]')
      } : undefined
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return mockPatients;
  }
}

export async function createPatient(patient: Partial<Patient>): Promise<Patient> {
  try {
    // Begin transaction
    await db.execute('START TRANSACTION');

    try {
      // Insert patient
      const patientResult = await db.execute(
        `INSERT INTO patients (
          id, name, age, gender, symptoms, medical_history,
          status, contact_number, insurance_info, allergies,
          current_medications, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *`,
        [
          `P-${Date.now()}`,
          patient.name,
          patient.age,
          patient.gender,
          patient.symptoms,
          patient.medicalHistory,
          patient.status || 'waiting',
          patient.contactNumber,
          patient.insuranceInfo,
          JSON.stringify(patient.allergies || []),
          JSON.stringify(patient.currentMedications || []),
          patient.emergencyContact
        ]
      );

      const rows = getRows<any>(patientResult);
      const newPatient = rows[0];

      // If triage data exists, insert it
      if (patient.triage) {
        await db.execute(
          `INSERT INTO triage_items (
            id, patient_id, title, description, priority,
            status, category, timestamp, wait_time, assigned_doctor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `T-${Date.now()}`,
            newPatient.id,
            patient.triage.title,
            patient.triage.description,
            patient.triage.priority,
            patient.triage.status || 'new',
            patient.triage.category,
            patient.triage.timestamp || new Date().toISOString(),
            patient.triage.waitTime,
            patient.triage.assignedDoctor
          ]
        );
      }

      await db.execute('COMMIT');

      return {
        ...newPatient,
        allergies: JSON.parse(newPatient.allergies || '[]'),
        currentMedications: JSON.parse(newPatient.current_medications || '[]')
      };
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to create patient:', error);
    // In development, fall back to mock data
    const mockPatient = {
      ...patient,
      id: `P-${Date.now()}`,
      status: 'waiting'
    } as Patient;
    mockPatients.push(mockPatient);
    return mockPatient;
  }
}

export async function getDoctors(): Promise<Doctor[]> {
  try {
    const result = await db.execute('SELECT * FROM doctors WHERE status = ?', ['active']);
    const rows = getRows<any>(result);
    return rows.map(row => ({
      ...row,
      schedule: JSON.parse(row.schedule || '[]')
    }));
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return mockDoctors;
  }
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
  try {
    const result = await db.execute(
      `UPDATE patients 
       SET name = COALESCE(?, name),
           age = COALESCE(?, age),
           gender = COALESCE(?, gender),
           symptoms = COALESCE(?, symptoms),
           medical_history = COALESCE(?, medical_history),
           status = COALESCE(?, status),
           contact_number = COALESCE(?, contact_number),
           insurance_info = COALESCE(?, insurance_info),
           allergies = COALESCE(?, allergies),
           current_medications = COALESCE(?, current_medications),
           emergency_contact = COALESCE(?, emergency_contact)
       WHERE id = ?
       RETURNING *`,
      [
        updates.name,
        updates.age,
        updates.gender,
        updates.symptoms,
        updates.medicalHistory,
        updates.status,
        updates.contactNumber,
        updates.insuranceInfo,
        updates.allergies ? JSON.stringify(updates.allergies) : null,
        updates.currentMedications ? JSON.stringify(updates.currentMedications) : null,
        updates.emergencyContact,
        id
      ]
    );

    return {
      ...getRows<any>(result)[0],
      allergies: JSON.parse(getRows<any>(result)[0].allergies || '[]'),
      currentMedications: JSON.parse(getRows<any>(result)[0].current_medications || '[]')
    };
  } catch (error) {
    console.error('Failed to update patient:', error);
    // Update mock data in development
    const index = mockPatients.findIndex(p => p.id === id);
    if (index !== -1) {
      mockPatients[index] = { ...mockPatients[index], ...updates };
      return mockPatients[index];
    }
    throw error;
  }
}

export async function getTriageItems(): Promise<TriageItem[]> {
  try {
    const result = await db.execute(`
      SELECT t.*, p.name as patient_name 
      FROM triage_items t
      JOIN patients p ON t.patient_id = p.id
      ORDER BY 
        CASE 
          WHEN t.status = 'new' THEN 1
          WHEN t.status = 'in_progress' THEN 2
          ELSE 3
        END,
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        t.timestamp DESC
    `);

    const rows = getRows<any>(result);
    return rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      category: row.category,
      timestamp: row.timestamp,
      waitTime: row.wait_time,
      assignedDoctor: row.assigned_doctor,
      vitalSigns: JSON.parse(row.vital_signs || '{}'),
      vector: JSON.parse(row.vector || '[]')
    }));
  } catch (error) {
    console.error('Failed to fetch triage items:', error);
    // In development, fall back to mock data
    return mockPatients
      .filter(p => p.triage)
      .map(p => ({
        ...p.triage!,
        patientName: p.name
      }))
      .sort((a, b) => {
        // Sort by status (new → in_progress → completed)
        const statusOrder = { new: 0, in_progress: 1, completed: 2 };
        const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                         (statusOrder[b.status as keyof typeof statusOrder] || 0);
        if (statusDiff !== 0) return statusDiff;

        // Then by priority (high → medium → low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                           (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
        if (priorityDiff !== 0) return priorityDiff;

        // Finally by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }
}

export async function searchTriageItems(query: string, filters?: {
  priority?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TriageItem[]> {
  try {
    let sql = `
      SELECT t.*, p.name as patient_name 
      FROM triage_items t
      JOIN patients p ON t.patient_id = p.id
      WHERE (
        LOWER(t.title) LIKE ? OR
        LOWER(t.description) LIKE ? OR
        LOWER(p.name) LIKE ?
      )
    `;
    
    const params: any[] = Array(3).fill(`%${query.toLowerCase()}%`);

    if (filters) {
      if (filters.priority) {
        sql += ' AND t.priority = ?';
        params.push(filters.priority);
      }
      if (filters.status) {
        sql += ' AND t.status = ?';
        params.push(filters.status);
      }
      if (filters.category) {
        sql += ' AND t.category = ?';
        params.push(filters.category);
      }
      if (filters.startDate) {
        sql += ' AND t.timestamp >= ?';
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        sql += ' AND t.timestamp <= ?';
        params.push(filters.endDate);
      }
    }

    sql += ' ORDER BY t.timestamp DESC';

    const result = await db.execute(sql, params);
    const rows = getRows<any>(result);

    return rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      category: row.category,
      timestamp: row.timestamp,
      waitTime: row.wait_time,
      assignedDoctor: row.assigned_doctor,
      vitalSigns: JSON.parse(row.vital_signs || '{}'),
      vector: JSON.parse(row.vector || '[]')
    }));
  } catch (error) {
    console.error('Failed to search triage items:', error);
    // In development, fall back to mock data with filtering
    return mockPatients
      .filter(p => p.triage)
      .map(p => p.triage!)
      .filter(t => {
        const matchesQuery = query.toLowerCase().split(' ').some(term =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
        );

        if (!matchesQuery) return false;
        if (!filters) return true;

        return (!filters.priority || t.priority === filters.priority) &&
               (!filters.status || t.status === filters.status) &&
               (!filters.category || t.category === filters.category) &&
               (!filters.startDate || t.timestamp >= filters.startDate) &&
               (!filters.endDate || t.timestamp <= filters.endDate);
      });
  }
}

export async function processNewItem(item: Partial<TriageItem> & { patientId: string }): Promise<TriageItem> {
  try {
    // Begin transaction
    await db.execute('START TRANSACTION');

    try {
      // Create new triage item
      const result = await db.execute(
        `INSERT INTO triage_items (
          id, patient_id, title, description, priority,
          status, category, timestamp, wait_time, assigned_doctor,
          vital_signs, vector
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *`,
        [
          `T-${Date.now()}`,
          item.patientId,
          item.title,
          item.description,
          item.priority || 'medium',
          item.status || 'new',
          item.category || 'general',
          item.timestamp || new Date().toISOString(),
          item.waitTime || 0,
          item.assignedDoctor,
          item.vitalSigns ? JSON.stringify(item.vitalSigns) : '{}',
          item.vector ? JSON.stringify(item.vector) : '[]'
        ]
      );

      // Update patient status
      await db.execute(
        `UPDATE patients 
         SET status = 'in_triage'
         WHERE id = ?`,
        [item.patientId]
      );

      await db.execute('COMMIT');

      const rows = getRows<any>(result);
      return {
        ...rows[0],
        vitalSigns: JSON.parse(rows[0].vital_signs || '{}'),
        vector: JSON.parse(rows[0].vector || '[]')
      };
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to process new triage item:', error);
    // In development, fall back to mock data
    const mockItem: TriageItem = {
      id: `T-${Date.now()}`,
      patientId: item.patientId,
      title: item.title || '',
      description: item.description || '',
      priority: item.priority || 'medium',
      status: 'new',
      category: item.category || 'general',
      timestamp: new Date().toISOString(),
      waitTime: item.waitTime || 0,
      assignedDoctor: item.assignedDoctor,
      vitalSigns: item.vitalSigns || {},
      vector: item.vector || []
    };

    // Update mock patient data
    const patient = mockPatients.find(p => p.id === item.patientId);
    if (patient) {
      patient.status = 'in_progress';
      patient.triage = mockItem;
    }

    return mockItem;
  }
}

export async function updateTriageItem(id: string, updates: Partial<TriageItem>): Promise<TriageItem> {
  try {
    const result = await db.execute(
      `UPDATE triage_items 
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           priority = COALESCE(?, priority),
           status = COALESCE(?, status),
           category = COALESCE(?, category),
           wait_time = COALESCE(?, wait_time),
           assigned_doctor = COALESCE(?, assigned_doctor),
           vital_signs = COALESCE(?, vital_signs),
           vector = COALESCE(?, vector)
       WHERE id = ?
       RETURNING *`,
      [
        updates.title,
        updates.description,
        updates.priority,
        updates.status,
        updates.category,
        updates.waitTime,
        updates.assignedDoctor,
        updates.vitalSigns ? JSON.stringify(updates.vitalSigns) : null,
        updates.vector ? JSON.stringify(updates.vector) : null,
        id
      ]
    );

    const rows = getRows<any>(result);
    if (rows.length === 0) {
      throw new Error('Triage item not found');
    }

    return {
      ...rows[0],
      vitalSigns: JSON.parse(rows[0].vital_signs || '{}'),
      vector: JSON.parse(rows[0].vector || '[]')
    };
  } catch (error) {
    console.error('Failed to update triage item:', error);
    // Update mock data in development
    const patientWithTriage = mockPatients.find(p => p.triage?.id === id);
    if (patientWithTriage?.triage) {
      patientWithTriage.triage = { ...patientWithTriage.triage, ...updates };
      return patientWithTriage.triage;
    }
    throw error;
  }
}

// Initialize database on import
initializeDatabase().catch(console.error);