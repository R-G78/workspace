import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TriageItem } from "@/types";

import { AlertCircle, AlertTriangle, Clock, CheckCircle, ArrowRight } from "lucide-react";

interface TriageListProps {
  items: TriageItem[];
  onItemUpdate: (item: TriageItem) => void;
}

export function TriageList({ items, onItemUpdate }: TriageListProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (item: TriageItem, newStatus: "new" | "in_progress" | "resolved" | "closed") => {
    setUpdating(item.id);
    try {
      const response = await fetch(`/api/triage/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      const updatedItem = await response.json();
      onItemUpdate(updatedItem);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Clock className="h-4 w-4 text-blue-600" />;
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
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'new':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">New</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Closed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getPriorityIcon(item.priority)}
                <CardTitle>{item.title}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {getPriorityBadge(item.priority)}
                {getStatusBadge(item.status)}
              </div>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {new Date(item.timestamp).toLocaleString()} • Category: {item.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{item.description}</p>
          </CardContent>
          <CardFooter className="bg-muted/20 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Select
                disabled={updating === item.id}
                defaultValue={item.status}
                onValueChange={(value: "new" | "in_progress" | "resolved" | "closed") => handleStatusChange(item, value)}
              >
                <SelectTrigger className="h-7 w-[140px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View Details <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}