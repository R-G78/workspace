import { useState } from "react";
import { Patient, TriageItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Clock, CheckCircle, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientListProps {
  patients: (Patient & { triage?: TriageItem })[];
  onSelectPatient: (patient: Patient & { triage?: TriageItem }) => void;
}

export function PatientList({ patients, onSelectPatient }: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "low":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return null;
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

  const getWaitTimeString = (waitTime?: number) => {
    if (!waitTime) return "Not calculated";
    
    if (waitTime < 60) {
      return `${waitTime} mins`;
    } else {
      const hours = Math.floor(waitTime / 60);
      const mins = waitTime % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const filteredPatients = patients
    .filter((patient) => {
      if (filter === "all") return true;
      return patient.triage?.priority === filter;
    })
    .filter((patient) => {
      if (!searchQuery) return true;
      return (
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  return (
    <Card className="h-[calc(100vh-13rem)] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Patient Queue</CardTitle>
        <CardDescription>
          Currently waiting patients ordered by priority
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={filter === "critical" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("critical")}
            className="text-red-600"
          >
            Critical
          </Button>
          <Button 
            variant={filter === "high" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("high")}
            className="text-orange-600"
          >
            High
          </Button>
          <Button 
            variant={filter === "medium" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("medium")}
            className="text-yellow-600"
          >
            Medium
          </Button>
          <Button 
            variant={filter === "low" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilter("low")}
            className="text-blue-600"
          >
            Low
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto flex-grow">
        {filteredPatients.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No patients match your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <div 
                key={patient.id}
                className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
                onClick={() => onSelectPatient(patient)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {patient.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.name}`} />
                  </Avatar>
                  <div>
                    <p className="font-medium flex items-center">
                      {patient.triage && getPriorityIcon(patient.triage.priority)}
                      <span className="ml-1">{patient.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {patient.id} • Age: {patient.age} • {patient.gender}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div>{getPriorityBadge(patient.triage?.priority)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wait: {getWaitTimeString(patient.triage?.waitTime)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}