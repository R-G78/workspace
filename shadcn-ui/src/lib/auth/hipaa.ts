import type { RowDataPacket } from 'mysql2/promise';
import { db } from '../tidb';

interface HipaaTraining extends RowDataPacket {
  userId: string;
  completionDate: Date;
  expirationDate: Date;
  status: 'valid' | 'expired' | 'not_completed';
}

export async function checkHipaaTraining(userId: string): Promise<boolean> {
  try {
    const results = await db.query<HipaaTraining[]>(
      `SELECT * FROM hipaa_training 
       WHERE userId = ? 
       AND expirationDate > NOW() 
       AND status = 'valid'
       LIMIT 1`,
      [userId]
    );

    // Check if we found a valid training record
    return results.length > 0;
  } catch (error) {
    console.error('Error checking HIPAA training:', error);
    // In case of error, deny access
    return false;
  }
}

async function notifyHipaaExpiringSoon(userId: string, expirationDate: Date): Promise<void> {
  // Implementation to send notification
  // This could be email, in-app notification, etc.
  console.log(`HIPAA training expiring soon for user ${userId} on ${expirationDate}`);
}
