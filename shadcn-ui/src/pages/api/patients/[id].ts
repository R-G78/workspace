import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

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
        const updates = req.body;
        const updatedPatient = await prisma.patient.update({
          where: { id },
          data: updates
        });
        return res.status(200).json(updatedPatient);
      
      case 'GET':
        const patient = await prisma.patient.findUnique({
          where: { id }
        });
        if (!patient) {
          return res.status(404).json({ error: 'Patient not found' });
        }
        return res.status(200).json(patient);

      case 'DELETE':
        await prisma.patient.delete({
          where: { id }
        });
        return res.status(204).end();
      
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in patient API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
