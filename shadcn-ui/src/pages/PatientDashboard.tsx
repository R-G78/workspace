import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { CheckInForm } from "@/components/patient/check-in-form";
import { PatientStatus } from "@/components/patient/patient-status";
import { Patient, TriageItem, Doctor } from "@/types";
import { Button } from "@/components/ui/button";

// Mock doctor data
const mockDoctors: Doctor[] = [
  {
    id: "D-001",
    name: "Elizabeth Taylor",
    specialization: "Emergency Medicine",
    department: "Emergency",
    availability: "available",
    email: "e.taylor@hospital.org"
  },
  {
    id: "D-002",
    name: "James Anderson",
    specialization: "Orthopedics",
    department: "Emergency",
    availability: "busy",
    email: "j.anderson@hospital.org"
  },
  {
    id: "D-003",
    name: "Maria Rodriguez",
    specialization: "Cardiology",
    department: "Emergency",
    availability: "available",
    email: "m.rodriguez@hospital.org"
  }
];

export default function PatientDashboard() {
  const [patientData, setPatientData] = useState<(Patient & { triage: TriageItem }) | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(true);
  
  // Function to handle check-in completion
  const handleCheckInComplete = (data: Patient & { triage: TriageItem }) => {
    setPatientData(data);
    setShowCheckIn(false);
  };
  
  // Get assigned doctor if any
  const assignedDoctor = patientData?.triage?.assignedDoctor 
    ? mockDoctors.find(doctor => doctor.id === patientData.triage.assignedDoctor)
    : undefined;
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Patient Portal</h2>
            <p className="text-muted-foreground">
              Welcome to our healthcare facility
            </p>
          </div>
          {patientData && (
            <Button 
              variant="outline"
              onClick={() => setShowCheckIn(!showCheckIn)}
            >
              {showCheckIn ? "View Status" : "Edit Check-in"}
            </Button>
          )}
        </div>
        
        <div className="flex justify-center">
          {patientData && !showCheckIn ? (
            <PatientStatus 
              patient={patientData} 
              assignedDoctor={assignedDoctor} 
            />
          ) : (
            <CheckInForm 
              onCheckInComplete={handleCheckInComplete}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}