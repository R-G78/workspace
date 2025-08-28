import { io, Socket } from 'socket.io-client';
import { TriageItem } from '@/types/triage';
import { Patient } from '@/types/patient';

export interface RealTimeUpdate {
  type: 'patient_update' | 'triage_update' | 'doctor_status' | 'critical_alert';
  data: any;
}

class RealTimeService {
  private socket: Socket;
  private listeners: Map<string, Set<(data: any) => void>>;
  
  constructor() {
    this.socket = io(process.env.WEBSOCKET_URL || '');
    this.listeners = new Map();
    
    this.socket.on('connect', () => {
      console.log('Connected to real-time service');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time service');
    });
    
    // Set up event handlers
    this.socket.on('update', (update: RealTimeUpdate) => {
      const listeners = this.listeners.get(update.type);
      if (listeners) {
        listeners.forEach(listener => listener(update.data));
      }
    });
  }
  
  subscribeToPatient(patientId: string, callback: (patient: Patient) => void) {
    this.socket.emit('subscribe_patient', patientId);
    this.addListener('patient_update', callback);
  }
  
  subscribeToCriticalAlerts(callback: (alert: { 
    patientId: string;
    severity: 'high' | 'critical';
    message: string;
    timestamp: string;
  }) => void) {
    this.socket.emit('subscribe_critical');
    this.addListener('critical_alert', callback);
  }
  
  subscribeToDoctorStatus(departmentId: string, callback: (statuses: {
    doctorId: string;
    status: 'available' | 'busy' | 'offline';
    lastUpdate: string;
  }[]) => void) {
    this.socket.emit('subscribe_department', departmentId);
    this.addListener('doctor_status', callback);
  }
  
  subscribeToTriageUpdates(callback: (triage: TriageItem) => void) {
    this.addListener('triage_update', callback);
  }
  
  private addListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  removeListener(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  disconnect() {
    this.socket.disconnect();
    this.listeners.clear();
  }
}

export const realTimeService = new RealTimeService();
