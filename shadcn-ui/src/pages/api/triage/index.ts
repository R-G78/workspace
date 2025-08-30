import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withErrorHandler } from '../_middleware';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      const items = await prisma.triageItem.findMany({
        orderBy: { timestamp: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              age: true,
              gender: true,
              symptoms: true,
              status: true
            }
          }
        }
      });
      return res.status(200).json(items);
    
    case 'POST':
      const { patientId, title, description, priority, status = 'new', category } = req.body;
      
      if (!patientId || !title) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: 'Patient ID and title are required' 
        });
      }

      // Verify patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Patient not found' 
        });
      }

      const triageItem = await prisma.triageItem.create({
        data: {
          patientId,
          title,
          description,
          priority: priority || 'medium',
          status,
          category
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              age: true,
              gender: true,
              symptoms: true,
              status: true
            }
          }
        }
      });
      return res.status(201).json(triageItem);
    
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

export default withErrorHandler(handler);
