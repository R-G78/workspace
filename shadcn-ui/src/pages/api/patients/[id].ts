import { NextApiRequest, NextApiResponse } from 'next';
import { updatePatientStatus } from '@/lib/tidb';
import { Patient } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid patient ID' });
  }

  try {
    switch (req.method) {
      case 'PUT':
        const patient = req.body as Partial<Patient>;
        const updatedPatient = await updatePatientStatus(parseInt(id), patient.status!);
        return res.status(200).json(updatedPatient);
      
      default:
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in patient API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
