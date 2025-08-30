import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid triage ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const triageItem = await prisma.triageItem.findUnique({
          where: { id },
          include: {
            patient: true
          }
        });
        if (!triageItem) {
          return res.status(404).json({ error: 'Triage item not found' });
        }
        return res.status(200).json(triageItem);

      case 'PUT':
        const { priority, status, symptoms } = req.body;
        const updatedItem = await prisma.triageItem.update({
          where: { id },
          data: {
            priority,
            status,
            symptoms
          },
          include: {
            patient: true
          }
        });
        return res.status(200).json(updatedItem);
      
      case 'DELETE':
        await prisma.triageItem.delete({
          where: { id }
        });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in triage API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
