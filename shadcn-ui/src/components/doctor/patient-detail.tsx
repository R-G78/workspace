import { useState } from "react";
import type { Patient } from "@/types/patient";
import type { TriageItem } from "@/types/triage";
import type { Doctor } from "@/types/doctor";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTriageItem } from "@/lib/tidb";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, ClipboardList, FilePlus2, MessageSquare, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface PatientDetailProps {
  patient: Patient & { triage?: TriageItem };
  doctors: Doctor[];
  onClose: () => void;
  onUpdate: (updatedTriage: TriageItem) => void;
}

export function PatientDetail({ patient, doctors, onClose, onUpdate }: PatientDetailProps) {
  const [status, setStatus] = useState<'new' | 'in_progress' | 'resolved' | 'closed'>(patient.triage?.status || "new");
  const [assignedDoctor, setAssignedDoctor] = useState(patient.triage?.assignedDoctor || "");
  const [room, setRoom] = useState(patient.triage?.room || "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateTriage = async () => {
    if (!patient.triage) return;
    
    setIsSubmitting(true);
    try {
      const notes = patient.triage.notes || [];
      if (note) {
        notes.push({
          id: `note-${Date.now()}`,
          content: note,
          timestamp: new Date().toISOString(),
          author: "Doctor", // TODO: Replace with actual doctor name
          type: "observation"
        });
      }

      // Update patient status via API
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          triage: {
            ...patient.triage,
            assignedDoctor,
            room,
            notes
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update patient');
      }

      const updatedPatient = await response.json();
      
      // Update UI
      onUpdate(updatedPatient.triage);
      
      // Notify success
      toast.success("Patient information updated", {
        description: "Changes saved successfully"
      });
      
      // Clear note field
      setNote("");
    } catch (error) {
      console.error("Failed to update patient:", error);
      toast.error("Update failed", {
        description: "Please try again later"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "critical": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-blue-600";
      default: return "";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Low</Badge>;
      default:
        return <Badge variant="outline">Not Triaged</Badge>;
    }
  };

  return (
    <div className="h-[calc(100vh-13rem)] flex flex-col overflow-hidden">
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {patient.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.name}`} />
              </Avatar>
              <div>
                <CardTitle className="text-2xl flex items-center">
                  {patient.name} {getPriorityBadge(patient.triage?.priority)}
                </CardTitle>
                <CardDescription>
                  ID: {patient.id} • Age: {patient.age} • {patient.gender}
                </CardDescription>
                {patient.triage && (
                  <p className={`text-sm mt-1 font-medium ${getPriorityColor(patient.triage.priority)}`}>
                    Chief Complaint: {patient.triage.title}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-auto pt-6">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">
                <UserRound className="w-4 h-4 mr-2" /> Patient Details
              </TabsTrigger>
              <TabsTrigger value="triage">
                <ClipboardList className="w-4 h-4 mr-2" /> Triage Info
              </TabsTrigger>
              <TabsTrigger value="history">
                <CalendarClock className="w-4 h-4 mr-2" /> Medical History
              </TabsTrigger>
              <TabsTrigger value="notes">
                <MessageSquare className="w-4 h-4 mr-2" /> Notes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Personal Information</h4>
                  <div className="rounded-lg border p-3">
                    <dl className="divide-y">
                      <div className="px-1 py-2 grid grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                        <dd className="text-sm col-span-2">{patient.name}</dd>
                      </div>
                      <div className="px-1 py-2 grid grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">Age</dt>
                        <dd className="text-sm col-span-2">{patient.age} years</dd>
                      </div>
                      <div className="px-1 py-2 grid grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                        <dd className="text-sm col-span-2">{patient.gender}</dd>
                      </div>
                      <div className="px-1 py-2 grid grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                        <dd className="text-sm col-span-2">{patient.contactNumber || "Not provided"}</dd>
                      </div>
                      <div className="px-1 py-2 grid grid-cols-3">
                        <dt className="text-sm font-medium text-muted-foreground">Emergency Contact</dt>
                        <dd className="text-sm col-span-2">{patient.emergencyContact || "Not provided"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Medical Information</h4>
                  <div className="rounded-lg border p-3">
                    <dl className="divide-y">
                      <div className="px-1 py-2">
                        <dt className="text-sm font-medium text-muted-foreground">Allergies</dt>
                        <dd className="text-sm mt-1">
                          {patient.allergies && patient.allergies.length > 0 
                            ? patient.allergies.map(allergy => (
                                <Badge key={allergy} variant="outline" className="mr-1 mb-1">{allergy}</Badge>
                              ))
                            : "No known allergies"}
                        </dd>
                      </div>
                      <div className="px-1 py-2">
                        <dt className="text-sm font-medium text-muted-foreground">Current Medications</dt>
                        <dd className="text-sm mt-1">
                          {patient.currentMedications && patient.currentMedications.length > 0 
                            ? patient.currentMedications.map(med => (
                                <Badge key={med} variant="outline" className="mr-1 mb-1">{med}</Badge>
                              ))
                            : "No current medications"}
                        </dd>
                      </div>
                      <div className="px-1 py-2">
                        <dt className="text-sm font-medium text-muted-foreground">Insurance</dt>
                        <dd className="text-sm">{patient.insuranceInfo || "Not provided"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Medical History</h4>
                <div className="rounded-lg border p-3">
                  <p className="text-sm">{patient.medicalHistory || "No medical history provided"}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="triage" className="space-y-4">
              {patient.triage ? (
                <>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Triage Details</h4>
                      <div className="rounded-lg border p-3">
                        <dl className="divide-y">
                          <div className="px-1 py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-muted-foreground">Chief Complaint</dt>
                            <dd className="text-sm col-span-2">{patient.triage.title}</dd>
                          </div>
                          <div className="px-1 py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-muted-foreground">Priority</dt>
                            <dd className="text-sm col-span-2 flex items-center">
                              {getPriorityBadge(patient.triage.priority)}
                            </dd>
                          </div>
                          <div className="px-1 py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-muted-foreground">Arrival Time</dt>
                            <dd className="text-sm col-span-2">
                              {new Date(patient.triage.timestamp).toLocaleString()}
                            </dd>
                          </div>
                          <div className="px-1 py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                            <dd className="text-sm col-span-2">{patient.triage.category}</dd>
                          </div>
                          <div className="px-1 py-2 grid grid-cols-3">
                            <dt className="text-sm font-medium text-muted-foreground">Wait Time</dt>
                            <dd className="text-sm col-span-2">
                              {patient.triage.waitTime 
                                ? `${patient.triage.waitTime} minutes` 
                                : "Not calculated"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Vital Signs</h4>
                      <div className="rounded-lg border p-3">
                        <dl className="divide-y">
                          {patient.triage.vitalSigns ? (
                            <>
                              <div className="px-1 py-2 grid grid-cols-3">
                                <dt className="text-sm font-medium text-muted-foreground">Temperature</dt>
                                <dd className="text-sm col-span-2">
                                  {patient.triage.vitalSigns.temperature ? 
                                    `${patient.triage.vitalSigns.temperature}°F` : 
                                    "Not recorded"}
                                </dd>
                              </div>
                              <div className="px-1 py-2 grid grid-cols-3">
                                <dt className="text-sm font-medium text-muted-foreground">Blood Pressure</dt>
                                <dd className="text-sm col-span-2">
                                  {patient.triage.vitalSigns.bloodPressure || "Not recorded"}
                                </dd>
                              </div>
                              <div className="px-1 py-2 grid grid-cols-3">
                                <dt className="text-sm font-medium text-muted-foreground">Heart Rate</dt>
                                <dd className="text-sm col-span-2">
                                  {patient.triage.vitalSigns.heartRate ? 
                                    `${patient.triage.vitalSigns.heartRate} bpm` : 
                                    "Not recorded"}
                                </dd>
                              </div>
                              <div className="px-1 py-2 grid grid-cols-3">
                                <dt className="text-sm font-medium text-muted-foreground">Respiratory Rate</dt>
                                <dd className="text-sm col-span-2">
                                  {patient.triage.vitalSigns.respiratoryRate ? 
                                    `${patient.triage.vitalSigns.respiratoryRate} breaths/min` : 
                                    "Not recorded"}
                                </dd>
                              </div>
                              <div className="px-1 py-2 grid grid-cols-3">
                                <dt className="text-sm font-medium text-muted-foreground">Oxygen Saturation</dt>
                                <dd className="text-sm col-span-2">
                                  {patient.triage.vitalSigns.oxygenSaturation ? 
                                    `${patient.triage.vitalSigns.oxygenSaturation}%` : 
                                    "Not recorded"}
                                </dd>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground p-2">No vital signs recorded</p>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm">{patient.triage.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Symptoms</h4>
                    <div className="rounded-lg border p-3">
                      {patient.triage.symptoms && patient.triage.symptoms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.triage.symptoms.map((symptom) => (
                            <Badge key={symptom} variant="outline">{symptom}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No symptoms recorded</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <p>No triage information available</p>
                    <p className="text-sm text-muted-foreground mt-1">This patient has not been triaged yet</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Medical History</h4>
                <div className="rounded-lg border p-3">
                  <p className="text-sm">{patient.medicalHistory || "No medical history provided"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Previous Visits</h4>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">No previous visits recorded in system</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Medical Notes</h4>
                <div className="rounded-lg border p-3 max-h-56 overflow-auto">
                  {patient.triage?.notes && patient.triage.notes.length > 0 ? (
                    <div className="space-y-3">
                      {patient.triage.notes.map((note) => (
                        <div key={note.id} className="text-sm p-2 rounded bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(note.timestamp).toLocaleString()} - {note.author} ({note.type})
                          </div>
                          {note.content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes recorded</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Add Note</h4>
                <Textarea 
                  placeholder="Enter clinical notes here..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {patient.triage && (
          <CardFooter className="border-t bg-muted/20 flex flex-wrap gap-4">
            <div className="space-y-1 flex-1">
              <label htmlFor="status" className="text-xs">Status</label>
              <Select 
                value={status} 
                onValueChange={(value: 'new' | 'in_progress' | 'resolved' | 'closed') => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1 flex-1">
              <label htmlFor="doctor" className="text-xs">Assign Doctor</label>
              <Select value={assignedDoctor} onValueChange={setAssignedDoctor}>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Assign to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} ({doctor.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="room" className="text-xs">Exam Room</label>
              <Select value={room} onValueChange={setRoom}>
                <SelectTrigger id="room" className="w-[120px]">
                  <SelectValue placeholder="Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not assigned</SelectItem>
                  <SelectItem value="A1">Room A1</SelectItem>
                  <SelectItem value="A2">Room A2</SelectItem>
                  <SelectItem value="B1">Room B1</SelectItem>
                  <SelectItem value="B2">Room B2</SelectItem>
                  <SelectItem value="C1">Room C1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="ml-auto" 
              onClick={handleUpdateTriage} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}