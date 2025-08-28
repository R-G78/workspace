import { NextApiRequest, NextApiResponse } from 'next';
import { searchTriageItems } from '@/lib/tidb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req.query;

  if (!query || Array.isArray(query)) {
    return res.status(400).json({ error: 'Invalid search query' });
  }

  try {
    const results = await searchTriageItems(query);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in search API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
