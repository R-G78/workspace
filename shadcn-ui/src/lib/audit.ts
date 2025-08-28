import { BlobServiceClient } from '@azure/storage-blob';

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
const auditContainer = blobServiceClient.getContainerClient('audit-logs');

interface AuditEvent {
  timestamp: string;
  action: 'view' | 'create' | 'update' | 'delete';
  resourceType: 'patient' | 'triage' | 'notes' | 'doctor';
  resourceId: string;
  userId: string;
  userRole: string;
  details: Record<string, any>;
  ipAddress: string;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const logFileName = `${new Date().toISOString().split('T')[0]}/audit.log`;
    const blockBlobClient = auditContainer.getBlockBlobClient(logFileName);
    
    const logEntry = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }) + '\n';

    // Append to existing log or create new
    try {
      const existing = await blockBlobClient.downloadToBuffer(0);
      await blockBlobClient.upload(Buffer.concat([existing, Buffer.from(logEntry)]), Buffer.concat([existing, Buffer.from(logEntry)]).length);
    } catch (e) {
      await blockBlobClient.upload(logEntry, logEntry.length);
    }

    // For immediate monitoring, also send critical events to monitoring service
    if (isCriticalEvent(event)) {
      await notifySecurityTeam(event);
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Even if logging fails, don't block the operation but alert the team
    await notifySystemError('Audit Logging Failure', { error, event });
  }
}

export async function getAuditLogs(
  startDate: Date,
  endDate: Date,
  filters?: {
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    action?: string;
  }
): Promise<AuditEvent[]> {
  const logs: AuditEvent[] = [];
  
  // Get all log files in the date range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const logFileName = `${d.toISOString().split('T')[0]}/audit.log`;
    const blockBlobClient = auditContainer.getBlockBlobClient(logFileName);
    
    try {
      const downloadResponse = await blockBlobClient.download(0);
      const logContent = await streamToString(downloadResponse.readableStreamBody!);
      
      // Parse and filter logs
      const events = logContent
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .filter(event => filterEvent(event, filters));
      
      logs.push(...events);
    } catch (error) {
      console.warn(`No logs found for date: ${d.toISOString().split('T')[0]}`);
    }
  }
  
  return logs;
}

function filterEvent(event: AuditEvent, filters?: Record<string, string>): boolean {
  if (!filters) return true;
  
  return Object.entries(filters).every(([key, value]) => {
    if (!value) return true;
    return event[key as keyof AuditEvent] === value;
  });
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    readableStream.on('error', reject);
  });
}

function isCriticalEvent(event: AuditEvent): boolean {
  return (
    event.action === 'delete' ||
    (event.resourceType === 'patient' && event.action === 'update') ||
    event.details.priority === 'high' ||
    event.details.error
  );
}

async function notifySecurityTeam(event: AuditEvent): Promise<void> {
  // Implementation would depend on your notification system
  console.log('Security team notified of critical event:', event);
}

async function notifySystemError(title: string, details: Record<string, any>): Promise<void> {
  // Implementation would depend on your error tracking system
  console.error(title, details);
}
