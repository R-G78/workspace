import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataSource } from "@/types";
import { Database, FileJson, Globe, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

interface DataSourcesProps {
  sources: DataSource[];
  onRefresh: () => void;
  onAdd: () => void;
}

export function DataSources({ sources, onRefresh, onAdd }: DataSourcesProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 1000); // Simulate refresh
  };

  const getSourceIcon = (type: string) => {
    switch(type) {
      case 'file':
        return <FileJson className="h-8 w-8 text-blue-500" />;
      case 'api':
        return <Globe className="h-8 w-8 text-green-500" />;
      case 'database':
        return <Database className="h-8 w-8 text-purple-500" />;
      default:
        return <FileJson className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>Connected data sources for triage AI</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No data sources connected yet.</p>
              <p className="text-sm">Add a data source to begin ingesting data.</p>
            </div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center space-x-3">
                  {getSourceIcon(source.type)}
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">Last synced: {source.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`${
                      source.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {source.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 text-xs text-muted-foreground border-t">
        Data sources are used to train the AI triage agent and provide reference data for classification.
      </CardFooter>
    </Card>
  );
}