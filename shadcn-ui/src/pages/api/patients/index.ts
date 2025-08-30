import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { withErrorHandler } from '../_middleware'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      const patients = await prisma.patient.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          triageItems: {
            select: {
              id: true,
              priority: true,
              status: true,
              createdAt: true
            }
          }
        }
      });
      return res.status(200).json(patients);

    case 'POST':
      const { 
        name, 
        age, 
        gender, 
        contactNumber, 
        insuranceInfo,
        medicalHistory,
        allergies,
        currentMedications,
        emergencyContact,
        symptoms,
        status = 'waiting'
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const patient = await prisma.patient.create({
        data: {
          name,
          age: age ? parseInt(age) : null,
          gender,
          contactNumber,
          insuranceInfo,
          medicalHistory,
          allergies: allergies ? JSON.stringify(allergies) : null,
          currentMedications: currentMedications ? JSON.stringify(currentMedications) : null,
          emergencyContact,
          symptoms,
          status
        },
        include: {
          triageItems: true
        }
      });
      return res.status(201).json(patient);

    case 'PUT':
      const { id, updatedStatus } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }
      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: { status: updatedStatus || status },
        include: {
          triageItems: true
        }
      });
      return res.status(200).json(updatedPatient);

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

export default withErrorHandler(handler);
