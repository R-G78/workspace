import type { Patient, TriageItem, Doctor } from '@/types';

// Create timestamps
const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60000);

// Mock data for development
export interface MockPatient extends Patient {
  triage?: TriageItem;
}

export const mockPatients: MockPatient[] = [
  {
    id: "P-001",
    name: "John Smith",
    age: 45,
    gender: "Male",
    medicalHistory: "Hypertension",
    symptoms: "Chest pain",
    status: "waiting",
    contactNumber: "+1-555-0123",
    insuranceInfo: "BlueCross #12345",
    allergies: ["Penicillin"],
    currentMedications: ["Lisinopril"],
    emergencyContact: "Mary Smith +1-555-0124",
    created_at: new Date().toISOString(),
    triage: {
      id: "T-001",
      title: "Chest Pain",
      description: "Patient reports sudden chest pain with shortness of breath",
      priority: "critical",
      status: "new",
      category: "cardiology",
      timestamp: new Date().toISOString(),
      waitTime: 0
    }
  },
  {
    id: "P-002",
    name: "Sarah Johnson",
    age: 32,
    gender: "Female",
    symptoms: "Severe headache",
    status: "in_progress",
    contactNumber: "+1-555-0125",
    insuranceInfo: "Aetna #67890",
    allergies: ["Sulfa"],
    currentMedications: ["Sumatriptan"],
    emergencyContact: "Mike Johnson +1-555-0126",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    triage: {
      id: "T-002",
      title: "Severe Migraine",
      description: "Patient experiencing intense migraine with visual aura",
      priority: "high",
      status: "in_progress",
      category: "neurology",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      waitTime: 30
    }
  },
  {
    id: "P-003",
    name: "Robert Wilson",
    age: 28,
    gender: "Male",
    symptoms: "Sprained ankle",
    status: "waiting",
    contactNumber: "+1-555-0127",
    insuranceInfo: "UnitedHealth #13579",
    allergies: [],
    currentMedications: [],
    emergencyContact: "Lisa Wilson +1-555-0128",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    triage: {
      id: "T-003",
      title: "Ankle Injury",
      description: "Twisted ankle during sports activity",
      priority: "medium",
      status: "new",
      category: "orthopedics",
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      waitTime: 45
    }
  },
  {
    id: "P-004",
    name: "Emily Davis",
    age: 55,
    gender: "Female",
    symptoms: "Difficulty breathing",
    status: "waiting",
    contactNumber: "+1-555-0129",
    insuranceInfo: "Medicare #24680",
    allergies: ["Latex"],
    currentMedications: ["Albuterol", "Fluticasone"],
    emergencyContact: "James Davis +1-555-0130",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    triage: {
      id: "T-004",
      title: "Respiratory Distress",
      description: "COPD exacerbation with increased dyspnea",
      priority: "high",
      status: "new",
      category: "pulmonology",
      timestamp: new Date(Date.now() - 9000000).toISOString(),
      waitTime: 15
    }
  },
  {
    id: "P-005",
    name: "Michael Brown",
    age: 42,
    gender: "Male",
    symptoms: "Abdominal pain",
    status: "completed",
    contactNumber: "+1-555-0131",
    insuranceInfo: "Cigna #97531",
    allergies: [],
    currentMedications: ["Omeprazole"],
    emergencyContact: "Susan Brown +1-555-0132",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    triage: {
      id: "T-005",
      title: "Gastric Issues",
      description: "Severe abdominal pain with nausea",
      priority: "medium",
      status: "closed",
      category: "gastroenterology",
      timestamp: new Date(Date.now() - 12600000).toISOString(),
      waitTime: 60
    }
  }
];

// Mock data access functions
export async function getPatients(): Promise<MockPatient[]> {
  return Promise.resolve(mockPatients);
}

export async function createPatient(data: Partial<Patient>): Promise<MockPatient> {
  const newPatient: MockPatient = {
    id: `P-${Date.now()}`,
    name: data.name || "",
    age: data.age || 0,
    gender: data.gender || "",
    symptoms: data.symptoms || "",
    status: 'waiting',
    contactNumber: data.contactNumber || "",
    insuranceInfo: data.insuranceInfo || "",
    medicalHistory: data.medicalHistory || "",
    allergies: data.allergies || [],
    currentMedications: data.currentMedications || [],
    emergencyContact: data.emergencyContact || "",
    created_at: new Date().toISOString()
  };
  mockPatients.push(newPatient);
  return Promise.resolve(newPatient);
}

export async function updatePatientStatus(id: string | number, status: Patient['status']): Promise<MockPatient | undefined> {
  const patient = mockPatients.find(p => p.id === id);
  if (patient) {
    patient.status = status;
  }
  return Promise.resolve(patient);
}

export async function updateTriageItem(id: string, updates: Partial<TriageItem>): Promise<boolean> {
  const patient = mockPatients.find(p => p.triage?.id === id);
  if (patient?.triage) {
    Object.assign(patient.triage, updates);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Mock embedding generation - returns a random vector
  return Array(384).fill(0).map(() => Math.random() - 0.5);
}

// Mock doctors data
export const mockDoctors: Doctor[] = [
  {
    id: "D-001",
    name: "Dr. Sarah Chen",
    specialization: "cardiology",
    department: "Cardiology",
    status: "active",
    currentPatients: 2,
    schedule: [
      { start: "09:00", end: "17:00" }
    ]
  },
  {
    id: "D-002",
    name: "Dr. James Wilson",
    specialization: "neurology",
    department: "Neurology",
    status: "active",
    currentPatients: 1,
    schedule: [
      { start: "08:00", end: "16:00" }
    ]
  },
  {
    id: "D-003",
    name: "Dr. Emily Rodriguez",
    specialization: "orthopedics",
    department: "Orthopedics",
    status: "active",
    currentPatients: 3,
    schedule: [
      { start: "10:00", end: "18:00" }
    ]
  },
  {
    id: "D-004",
    name: "Dr. Michael Patel",
    specialization: "pulmonology",
    department: "Pulmonology",
    status: "active",
    currentPatients: 2,
    schedule: [
      { start: "09:00", end: "17:00" }
    ]
  },
  {
    id: "D-005",
    name: "Dr. Amanda Lewis",
    specialization: "emergency",
    department: "Emergency Medicine",
    status: "active",
    currentPatients: 4,
    schedule: [
      { start: "07:00", end: "19:00" }
    ]
  }
];

export async function processNewItem(item: Partial<TriageItem>): Promise<TriageItem> {
  // Get available doctors
  const doctors = mockDoctors.filter(d => d.status === 'active');
  
  // Use AI triage service to analyze and assign
  const { analyzeSymptoms, findBestDoctor } = await import('@/services/ai-triage');
  
  // Generate embedding for vector search
  const embedding = await generateEmbedding(item.title + " " + item.description);

  // Analyze symptoms to determine priority and specialty
  const analysis = await analyzeSymptoms(item.description || '', '');
  
  // Find best matching doctor
  const assignedDoctor = await findBestDoctor(analysis.specialty, doctors);

  // Create the complete triage item
  const processedItem: TriageItem = {
    ...item as TriageItem,
    id: `T-${Date.now()}`,
    vector: embedding,
    status: item.status || 'new',
    timestamp: item.timestamp || new Date().toISOString(),
    priority: analysis.priority,
    category: analysis.specialty,
    waitTime: calculateWaitTime(analysis.priority),
    assignedDoctor: assignedDoctor?.id
  };

  return Promise.resolve(processedItem);
}

function calculateWaitTime(priority: string): number {
  switch (priority) {
    case 'critical':
      return 0;  // Immediate attention
    case 'high':
      return 15; // 15 minutes
    case 'medium':
      return 30; // 30 minutes
    case 'low':
      return 60; // 1 hour
    default:
      return 45; // Default wait time
  }
}

export async function searchTriageItems(query: string): Promise<TriageItem[]> {
  const searchTerms = query.toLowerCase().split(' ');
  const items = mockPatients
    .filter(patient => patient.triage)
    .map(patient => patient.triage!)
    .filter(Boolean);
  
  return Promise.resolve(
    items.filter(item => {
      const content = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      return searchTerms.every(term => content.includes(term));
    })
  );
}

export async function getTriageItems(
  status?: string,
  priority?: string,
  limit: number = 100
): Promise<TriageItem[]> {
  let items = mockPatients
    .filter(patient => patient.triage)
    .map(patient => patient.triage!)
    .filter(Boolean);

  if (status) {
    items = items.filter(item => item.status === status);
  }
  if (priority) {
    items = items.filter(item => item.priority === priority);
  }

  items = items.slice(0, limit);
  return Promise.resolve(items);
}

export async function getDoctors(): Promise<Doctor[]> {
  return Promise.resolve(mockDoctors);
}

export async function getDoctorById(id: string): Promise<Doctor | undefined> {
  return Promise.resolve(mockDoctors.find(d => d.id === id));
}

export async function updateDoctorStatus(
  id: string,
  status: Doctor['status']
): Promise<Doctor | undefined> {
  const doctor = mockDoctors.find(d => d.id === id);
  if (doctor) {
    doctor.status = status;
  }
  return Promise.resolve(doctor);
}

export async function assignPatientToDoctor(
  doctorId: string,
  patientId: string
): Promise<boolean> {
  const doctor = mockDoctors.find(d => d.id === doctorId);
  if (doctor) {
    doctor.currentPatients = (doctor.currentPatients || 0) + 1;
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}
