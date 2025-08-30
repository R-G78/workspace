import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PatientList } from "@/components/doctor/patient-list";
import { PatientDetail } from "@/components/doctor/patient-detail";
import type { TriageItem } from "@/types/triage";
import type { Patient } from "@/types/patient";
import type { Doctor } from "@/types/doctor";
import type { TriageStats } from "@/types/stats";
import { TriageStatsCards } from "@/components/dashboard/triage-stats";
import { RefreshCw, Plus } from "lucide-react";

// Mock data
const mockPatients: Patient[] = [
  {
    id: "P-001",
    name: "John Smith",
    age: 45,
    gender: "Male",
    medicalHistory: "Hypertension, Type 2 Diabetes",
    allergies: ["Penicillin", "Peanuts"],
    currentMedications: ["Metformin", "Lisinopril"],
    contactNumber: "555-123-4567",
    status: "waiting",
    triage: {
      id: "T-001",
      patientId: "P-001",
      title: "Chest Pain and Shortness of Breath",
      description: "Patient reports sudden onset of chest pain radiating to left arm, along with difficulty breathing for the past hour. History of hypertension.",
      priority: "critical",
      status: "new",
      category: "cardiology",
      timestamp: new Date().toISOString(),
      waitTime: 0,
      vitalSigns: {
        temperature: 99.1,
        bloodPressure: "160/95",
        heartRate: 110,
        respiratoryRate: 24,
        oxygenSaturation: 92
      },
      vector: [0.1, 0.2, 0.3], // Example vector
      symptoms: ["Chest pain", "Shortness of breath", "Sweating", "Anxiety"],
      notes: [{
        id: "N-001",
        content: "Initial assessment: Patient presents with acute chest pain",
        timestamp: new Date().toISOString(),
        author: "Dr. Johnson",
        type: "observation"
      }]
    }
  },
  {
    id: "P-002",
    name: "Emily Johnson",
    age: 32,
    gender: "Female",
    medicalHistory: "Asthma",
    allergies: ["Sulfa drugs"],
    currentMedications: ["Albuterol inhaler"],
    contactNumber: "555-987-6543",
    status: "waiting",
    triage: {
      id: "T-002",
      patientId: "P-002",
      title: "Severe Migraine",
      description: "Patient reports severe headache with light sensitivity and nausea for the past 6 hours. Has history of migraines but states this one is worse than usual.",
      priority: "medium",
      status: "new",
      category: "neurology",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      waitTime: 45,
      vitalSigns: {
        temperature: 98.6,
        bloodPressure: "125/82",
        heartRate: 88,
        respiratoryRate: 18,
        oxygenSaturation: 98
      },
      vector: [0.3, 0.4, 0.5], // Example vector
      symptoms: ["Headache", "Photophobia", "Nausea"],
      notes: []
    }
  },
  {
    id: "P-003",
    name: "Robert Chen",
    age: 65,
    gender: "Male",
    medicalHistory: "Coronary artery disease, COPD",
    allergies: [],
    currentMedications: ["Atorvastatin", "Clopidogrel", "Albuterol"],
    contactNumber: "555-222-3333",
    emergencyContact: "555-333-4444 (Maria Chen, Wife)",
    status: "in_progress",
    triage: {
      id: "T-003",
      patientId: "P-003",
      title: "Fall with Hip Pain",
      description: "Patient fell in bathroom approximately 2 hours ago. Complains of severe left hip pain and inability to bear weight. No loss of consciousness reported.",
      priority: "high",
      status: "in_progress",
      category: "orthopedics",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      waitTime: 15,
      vector: [0.4, 0.5, 0.6],
      room: "B2",
      vitalSigns: {
        temperature: 98.4,
        bloodPressure: "145/85",
        heartRate: 92,
        respiratoryRate: 20,
        oxygenSaturation: 95
      },
      symptoms: ["Hip pain", "Limited mobility", "Pain on weight bearing", "Bruising"],
      notes: [{
        id: "N-003",
        content: "X-ray ordered for left hip. Patient given pain medication.",
        timestamp: new Date().toISOString(),
        author: "Dr. Anderson",
        type: "observation"
      },
      {
        id: "N-002",
        content: "Initial assessment completed. Patient sent for X-ray.",
        timestamp: "2025-08-08T10:15:00Z",
        author: "Dr. Anderson",
        type: "observation"
      }],
      assignedDoctor: "D-002"
    }
  },
  {
    id: "P-004",
    name: "Sarah Martinez",
    age: 28,
    gender: "Female",
    medicalHistory: "None",
    allergies: ["Latex"],
    currentMedications: ["Oral contraceptives"],
    contactNumber: "555-444-5555",
    status: "waiting",
    triage: {
      id: "T-004",
      patientId: "P-004",
      title: "Abdominal Pain",
      description: "Patient reports severe lower right quadrant abdominal pain that started 12 hours ago and has been worsening. Reports nausea and low-grade fever.",
      priority: "high",
      status: "new",
      category: "general",
      timestamp: new Date(Date.now() - 5400000).toISOString(),
      waitTime: 30,
      vector: [0.5, 0.6, 0.7],
      vitalSigns: {
        temperature: 100.2,
        bloodPressure: "118/75",
        heartRate: 96,
        respiratoryRate: 16,
        oxygenSaturation: 99
      },
      symptoms: ["Abdominal pain", "Nausea", "Fever", "Loss of appetite"],
      notes: []
    }
  },
  {
    id: "P-005",
    name: "Michael Wilson",
    age: 8,
    gender: "Male",
    medicalHistory: "Asthma",
    allergies: ["Pollen"],
    currentMedications: ["Flovent inhaler"],
    emergencyContact: "555-777-8888 (Jessica Wilson, Mother)",
    status: "waiting",
    triage: {
      id: "T-005",
      patientId: "P-005",
      title: "High Fever and Rash",
      description: "Child brought in with fever of 103.5°F and widespread red rash. Mother reports symptoms started this morning. Child is lethargic and has reduced appetite.",
      priority: "medium",
      status: "new",
      category: "pediatrics",
      timestamp: new Date(Date.now() - 2700000).toISOString(),
      waitTime: 40,
      vector: [0.6, 0.7, 0.8],
      vitalSigns: {
        temperature: 103.5,
        heartRate: 115,
        respiratoryRate: 22,
        oxygenSaturation: 97
      },
      symptoms: ["Fever", "Rash", "Lethargy"],
      notes: []
    }
  }
];

const mockDoctors: Doctor[] = [
  {
    id: "D-001",
    name: "Elizabeth Taylor",
    specialization: "Emergency Medicine",
    department: "Emergency",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "08:00", endTime: "17:00" },
      { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "17:00" }
    ]
  },
  {
    id: "D-002",
    name: "James Anderson",
    specialization: "Orthopedics",
    department: "Emergency",
    status: "active",
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "18:00" },
      { day: "Thursday", startTime: "09:00", endTime: "18:00" },
      { day: "Friday", startTime: "09:00", endTime: "18:00" }
    ]
  },
  {
    id: "D-003",
    name: "Maria Rodriguez",
    specialization: "Cardiology",
    department: "Emergency",
    status: "active",
    schedule: [
      { day: "Tuesday", startTime: "08:00", endTime: "17:00" },
      { day: "Wednesday", startTime: "08:00", endTime: "17:00" },
      { day: "Thursday", startTime: "08:00", endTime: "17:00" }
    ]
  },
  {
    id: "D-004",
    name: "David Kim",
    specialization: "Neurology",
    department: "Emergency",
    status: "on_leave",
    schedule: [
      { day: "Monday", startTime: "10:00", endTime: "19:00" },
      { day: "Wednesday", startTime: "10:00", endTime: "19:00" },
      { day: "Friday", startTime: "10:00", endTime: "19:00" }
    ]
  }
];

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<(Patient & { triage?: TriageItem })[]>(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState<(Patient & { triage?: TriageItem }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<TriageStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    resolved: 0
  });

  const calculateStats = (items: Patient[]) => {
    const stats: TriageStats = {
      total: items.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0
    };

    items.forEach((patient) => {
      if (patient.triage) {
        if (patient.triage.status === "resolved") {
          stats.resolved++;
        }

        switch (patient.triage.priority) {
          case "critical":
            stats.critical++;
            break;
          case "high":
            stats.high++;
            break;
          case "medium":
            stats.medium++;
            break;
          case "low":
            stats.low++;
            break;
        }
      }
    });

    setStats(stats);
  };

  // Fetch data and calculate stats
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/triage');
        if (!response.ok) {
          throw new Error('Failed to fetch triage items');
        }
        const items = await response.json();
        setPatients(items);
        calculateStats(items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePatientSelect = (patient: Patient & { triage?: TriageItem }) => {
    setSelectedPatient(patient);
  };

  const handlePatientUpdate = (updatedTriage: TriageItem) => {
    // Update the patient in the list with the updated triage info
    setPatients(patients.map(patient => {
      if (patient.triage && patient.triage.id === updatedTriage.id) {
        return { ...patient, triage: updatedTriage };
      }
      return patient;
    }));
    
    // Update the selected patient if it's the one being updated
    if (selectedPatient && selectedPatient.triage && selectedPatient.triage.id === updatedTriage.id) {
      setSelectedPatient({ ...selectedPatient, triage: updatedTriage });
    }
  };

  const refreshPatients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/triage');
      if (!response.ok) {
        throw new Error('Failed to fetch triage items');
      }
      const items = await response.json();
      setPatients(items);
      calculateStats(items);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h2>
            <p className="text-muted-foreground">
              View and manage patient triage queue
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={refreshPatients} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        <TriageStatsCards stats={stats} />

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <PatientList 
            patients={patients} 
            onSelectPatient={handlePatientSelect} 
          />
          
          {selectedPatient ? (
            <PatientDetail 
              patient={selectedPatient}
              doctors={mockDoctors}
              onClose={() => setSelectedPatient(null)}
              onUpdate={handlePatientUpdate}
            />
          ) : (
            <div className="border rounded-lg flex items-center justify-center h-[calc(100vh-13rem)]">
              <div className="text-center">
                <h3 className="text-lg font-medium">No patient selected</h3>
                <p className="text-muted-foreground mt-1">
                  Select a patient from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}