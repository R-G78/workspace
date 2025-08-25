import { Patient, TriageItem, Doctor } from '@/types';
import { generateEmbedding } from '@/lib/mock-data';

// Define symptom severity keywords
const CRITICAL_SYMPTOMS = [
  'chest pain', 'difficulty breathing', 'shortness of breath', 'severe bleeding',
  'unconscious', 'stroke', 'heart attack', 'seizure', 'trauma', 'head injury'
];

const HIGH_PRIORITY_SYMPTOMS = [
  'severe pain', 'fracture', 'deep cut', 'high fever', 'diabetic', 'asthma attack',
  'allergic reaction', 'dizziness', 'migraine', 'severe nausea'
];

const MEDIUM_PRIORITY_SYMPTOMS = [
  'moderate pain', 'sprain', 'minor cut', 'fever', 'vomiting', 'ear pain',
  'sore throat', 'rash', 'infection', 'flu symptoms'
];

// Specialty mapping based on symptoms and conditions
const SPECIALTY_MAPPING = {
  cardiology: ['chest pain', 'heart', 'palpitations', 'hypertension', 'cardiac'],
  neurology: ['headache', 'migraine', 'seizure', 'stroke', 'dizziness'],
  orthopedics: ['fracture', 'sprain', 'joint pain', 'back pain', 'injury'],
  pulmonology: ['breathing', 'asthma', 'cough', 'copd', 'respiratory'],
  gastroenterology: ['abdominal pain', 'nausea', 'vomiting', 'digestive'],
  endocrinology: ['diabetes', 'thyroid', 'hormonal', 'metabolic'],
  emergency: ['trauma', 'critical', 'severe bleeding', 'unconscious']
};

interface TriageResult {
  priority: 'critical' | 'high' | 'medium' | 'low';
  specialty: string;
  confidence: number;
  recommendedDoctor?: string;
}

export async function analyzeSymptoms(
  symptoms: string,
  medicalHistory?: string
): Promise<TriageResult> {
  try {
    // Use the medical-specific LLM for analysis
    const { analyzeSymptomsWithMedicalLLM } = await import('./medical-llm-service');
    return await analyzeSymptomsWithMedicalLLM(symptoms, medicalHistory);
  } catch (error) {
    console.error('Medical LLM analysis failed, falling back to rule-based system:', error);
    
    // Fallback to rule-based system
    const combinedText = `${symptoms} ${medicalHistory || ''}`.toLowerCase();
    
    // Check for critical symptoms first
    for (const criticalSymptom of CRITICAL_SYMPTOMS) {
      if (combinedText.includes(criticalSymptom)) {
        return {
          priority: 'critical',
          specialty: 'emergency',
          confidence: 0.95,
          reasoning: 'Critical symptoms detected requiring immediate attention'
        };
      }
    }

    // Check for high priority symptoms
    for (const highPrioritySymptom of HIGH_PRIORITY_SYMPTOMS) {
      if (combinedText.includes(highPrioritySymptom)) {
        return {
          priority: 'high',
          specialty: await determineSpecialty(combinedText),
          confidence: 0.85,
          reasoning: 'High priority symptoms detected requiring urgent care'
        };
      }
    }

    // Check for medium priority symptoms
    for (const mediumPrioritySymptom of MEDIUM_PRIORITY_SYMPTOMS) {
      if (combinedText.includes(mediumPrioritySymptom)) {
        return {
          priority: 'medium',
          specialty: await determineSpecialty(combinedText),
          confidence: 0.75,
          reasoning: 'Moderate symptoms detected requiring standard care'
        };
      }
    }

    // Default to low priority if no specific symptoms matched
    return {
      priority: 'low',
      specialty: await determineSpecialty(combinedText),
      confidence: 0.6,
      reasoning: 'Minor symptoms detected suitable for routine care'
    };
  }
}

async function determineSpecialty(symptoms: string): Promise<string> {
  let maxScore = 0;
  let bestSpecialty = 'general';

  // Calculate specialty scores based on keyword matches
  for (const [specialty, keywords] of Object.entries(SPECIALTY_MAPPING)) {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (symptoms.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      bestSpecialty = specialty;
    }
  }

  return bestSpecialty;
}

export async function findBestDoctor(
  specialty: string,
  doctors: Doctor[]
): Promise<Doctor | undefined> {
  // Filter doctors by specialty
  const specializedDoctors = doctors.filter(d => 
    d.specialization?.toLowerCase() === specialty.toLowerCase()
  );

  if (specializedDoctors.length === 0) {
    return undefined;
  }

  // For now, simply return the first available doctor
  // In a real system, we would consider:
  // - Current workload
  // - Years of experience
  // - Patient satisfaction ratings
  // - Distance/location
  return specializedDoctors[0];
}

export async function triagePatient(
  patient: Patient,
  doctors: Doctor[]
): Promise<TriageItem> {
  // Analyze symptoms and determine priority
  const analysis = await analyzeSymptoms(patient.symptoms || '', patient.medicalHistory);
  
  // Find the best matching doctor
  const assignedDoctor = await findBestDoctor(analysis.specialty, doctors);

  // Generate embedding for the symptoms for vector search
  const symptomEmbedding = await generateEmbedding(patient.symptoms || '');

  // Create triage item
  const triageItem: TriageItem = {
    id: `T-${Date.now()}`,
    title: patient.symptoms || 'Unknown',
    description: `Patient presents with: ${patient.symptoms}. Medical History: ${patient.medicalHistory || 'None'}`,
    priority: analysis.priority,
    status: 'new',
    category: analysis.specialty,
    timestamp: new Date().toISOString(),
    waitTime: calculateWaitTime(analysis.priority),
    vector: symptomEmbedding,
    assignedDoctor: assignedDoctor?.id
  };

  return triageItem;
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
