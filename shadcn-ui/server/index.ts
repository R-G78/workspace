import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const pool = mysql.createPool({
  host: process.env.VITE_TIDB_HOST,
  port: parseInt(process.env.VITE_TIDB_PORT || '3306'),
  user: process.env.VITE_TIDB_USER,
  password: process.env.VITE_TIDB_PASSWORD,
  database: process.env.VITE_TIDB_DATABASE
});

// API Routes
app.post('/api/db', async (req, res) => {
  try {
    const { query, values } = req.body;
    const [results] = await pool.query(query, values);
    res.json(results);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Patients endpoints
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC') as [any[], any];
    const patients = (rows as any[]).map((patient: any) => ({
      ...patient,
      allergies: JSON.parse(patient.allergies || '[]'),
      currentMedications: JSON.parse(patient.currentMedications || '[]')
    }));
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]) as [any[], any];
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const patient = rows[0];
    patient.allergies = JSON.parse(patient.allergies || '[]');
    patient.currentMedications = JSON.parse(patient.currentMedications || '[]');
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Triage endpoints
app.get('/api/triage', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM triage_items ORDER BY timestamp DESC') as [any[], any];
    const items = (rows as any[]).map((item: any) => ({
      ...item,
      vitalSigns: JSON.parse(item.vitalSigns || '{}'),
      vector: JSON.parse(item.vector || '[]')
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching triage items:', error);
    res.status(500).json({ error: 'Failed to fetch triage items' });
  }
});

app.post('/api/triage', async (req, res) => {
  try {
    const item = req.body;
    const [result] = await pool.query(
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
    ) as [any, any];
    res.json({ id: (result as any).insertId });
  } catch (error) {
    console.error('Error creating triage item:', error);
    res.status(500).json({ error: 'Failed to create triage item' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
