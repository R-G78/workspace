import { NextApiRequest, NextApiResponse } from 'next';
import { updateTriageItem } from '@/lib/tidb';
import type { TriageItem } from '@/types';

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
      case 'PUT':
        const updatedItem = await updateTriageItem(id, req.body as TriageItem);
        return res.status(200).json(updatedItem);
      
      default:
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in triage API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
