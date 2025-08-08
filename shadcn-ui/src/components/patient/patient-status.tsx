import { Patient, TriageItem, Doctor } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, AlertTriangle, Clock, CheckCircle, User, Clock3 } from "lucide-react";

interface PatientStatusProps {
  patient: Patient & { triage: TriageItem };
  assignedDoctor?: Doctor;
}

export function PatientStatus({ patient, assignedDoctor }: PatientStatusProps) {
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical':
        return "text-red-600";
      case 'high':
        return "text-orange-600";
      case 'medium':
        return "text-yellow-600";
      case 'low':
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'critical':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Waiting</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Closed</Badge>;
      default:
        return null;
    }
  };

  const getStatusProgress = (status: string) => {
    switch(status) {
      case 'new':
        return 25;
      case 'in_progress':
        return 75;
      case 'resolved':
      case 'closed':
        return 100;
      default:
        return 0;
    }
  };

  const getWaitTimeString = (waitTime?: number) => {
    if (!waitTime) return "Being calculated";
    
    if (waitTime < 60) {
      return `${waitTime} minutes`;
    } else {
      const hours = Math.floor(waitTime / 60);
      const mins = waitTime % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getEstimatedTime = (waitTime?: number) => {
    if (!waitTime) return "Unknown";
    
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + (waitTime * 60000));
    
    return estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Your Visit Status</CardTitle>
          <div>{getStatusBadge(patient.triage.status)}</div>
        </div>
        <CardDescription>
          Check-in time: {new Date(patient.triage.timestamp).toLocaleString()}
        </CardDescription>
        <div className="mt-2">
          <Progress value={getStatusProgress(patient.triage.status)} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient Information</h3>
              <p className="text-lg font-medium">{patient.name}</p>
              <p className="text-sm">{patient.age} years • {patient.gender}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Chief Complaint</h3>
              <p className="text-base flex items-center gap-2">
                {getPriorityIcon(patient.triage.priority)}
                <span>{patient.triage.title}</span>
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority</h3>
              <div>{getPriorityBadge(patient.triage.priority)}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Status</h3>
              {patient.triage.status === "in_progress" ? (
                <div className="rounded-md border p-3 bg-blue-50 border-blue-200">
                  <p className="font-medium text-blue-800">
                    You are currently being seen
                  </p>
                  {patient.triage.room && (
                    <p className="text-sm text-blue-700 mt-1">
                      Room: {patient.triage.room}
                    </p>
                  )}
                </div>
              ) : patient.triage.status === "resolved" || patient.triage.status === "closed" ? (
                <div className="rounded-md border p-3 bg-green-50 border-green-200">
                  <p className="font-medium text-green-800">
                    Your visit is complete
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Thank you for visiting our facility
                  </p>
                </div>
              ) : (
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Estimated wait time</p>
                      <p className="text-sm text-muted-foreground">
                        {getWaitTimeString(patient.triage.waitTime)}
                      </p>
                    </div>
                  </div>
                  {patient.triage.waitTime && (
                    <p className="text-sm mt-2">
                      Estimated time to be seen: <span className="font-medium">{getEstimatedTime(patient.triage.waitTime)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Assigned Healthcare Provider</h3>
              {assignedDoctor ? (
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dr. {assignedDoctor.name}</p>
                    <p className="text-sm text-muted-foreground">{assignedDoctor.specialization}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm">Not assigned yet</p>
              )}
            </div>

            {patient.triage.room && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Room</h3>
                <p className="font-medium">{patient.triage.room}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="rounded-md border p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Patient Instructions</h3>
          <p className="text-sm">
            {patient.triage.status === "new" ? (
              "Please remain in the waiting area. We will call your name when it's your turn. If your condition worsens while waiting, please notify the front desk staff immediately."
            ) : patient.triage.status === "in_progress" ? (
              "Your healthcare provider is attending to you. If you have any questions or concerns, please don't hesitate to ask."
            ) : (
              "Your visit is complete. Please follow the discharge instructions provided by your healthcare provider. If you have any follow-up questions, please contact our office."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}