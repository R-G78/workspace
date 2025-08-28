import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/tidb'
import type { Patient } from '@/types/patient'
import type { RowDataPacket } from 'mysql2/promise'

interface DBPatient extends Patient, RowDataPacket {}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      try {
        const patients = await db.query<DBPatient[]>(
          'SELECT * FROM patients ORDER BY created_at DESC'
        );
        return res.status(200).json(patients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        return res.status(500).json({ error: 'Failed to fetch patients' });
      }

    case 'POST':
      try {
        const { name, symptoms, status } = req.body;
        const result = await db.query<RowDataPacket[]>(
          'INSERT INTO patients (name, symptoms, status) VALUES (?, ?, ?)',
          [name, symptoms, status]
        );
        return res.status(201).json(result);
      } catch (error) {
        console.error('Error creating patient:', error);
        return res.status(500).json({ error: 'Failed to create patient' });
      }

    case 'PUT':
      try {
        const { id, status } = req.body;
        const result = await db.query<RowDataPacket[]>(
          'UPDATE patients SET status = ? WHERE id = ?',
          [status, id]
        );
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error updating patient:', error);
        return res.status(500).json({ error: 'Failed to update patient' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
