import { NextApiRequest, NextApiResponse } from 'next';
import { getTriageItems, processNewItem } from '@/lib/tidb';
import type { TriageItem } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const items = await getTriageItems();
        return res.status(200).json(items);
      
      case 'POST':
        const newItem = req.body as TriageItem;
        const processedItem = await processNewItem(newItem);
        return res.status(201).json(processedItem);
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in triage API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
