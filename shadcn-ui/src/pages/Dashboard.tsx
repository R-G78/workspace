import { useState, useEffect } from "react";
import { TriageItem, TriageStats, DataSource } from "@/types";
import { TriageStatsCards } from "@/components/dashboard/triage-stats";
import { TriageList } from "@/components/dashboard/triage-list";
import { IngestForm } from "@/components/dashboard/ingest-form";
import { DataSources } from "@/components/dashboard/data-sources";
import { SearchBar } from "@/components/dashboard/search";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [triageItems, setTriageItems] = useState<TriageItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<TriageItem[]>([]);
  const [stats, setStats] = useState<TriageStats>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    resolved: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<TriageItem[] | null>(null);
  const { toast } = useToast();
  
  // Mock data sources
  const dataSources: DataSource[] = [
    {
      id: "1",
      name: "Support Tickets API",
      type: "api",
      status: "active",
      lastSync: new Date().toLocaleString()
    },
    {
      id: "2",
      name: "System Logs",
      type: "file",
      status: "active",
      lastSync: new Date(Date.now() - 3600000).toLocaleString()
    },
    {
      id: "3",
      name: "Customer Feedback DB",
      type: "database",
      status: "inactive",
      lastSync: new Date(Date.now() - 86400000).toLocaleString()
    }
  ];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Update stats whenever items change
  useEffect(() => {
    if (triageItems.length > 0) {
      calculateStats(triageItems);
    }
    setFilteredItems(triageItems);
  }, [triageItems]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/triage');
      if (!response.ok) {
        throw new Error('Failed to fetch triage items');
      }
      const items = await response.json();
      setTriageItems(items);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error loading data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (items: TriageItem[]) => {
    const stats: TriageStats = {
      total: items.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0
    };

    items.forEach(item => {
      if (item.status === "resolved") {
        stats.resolved++;
      }

      switch (item.priority) {
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
    });

    setStats(stats);
  };

  const handleItemAdded = (newItem: TriageItem) => {
    // Add the new item to the list
    const updatedItems = [newItem, ...triageItems];
    setTriageItems(updatedItems);
    
    // Clear search results when adding a new item
    setSearchResults(null);
  };

  const handleItemUpdate = (updatedItem: TriageItem) => {
    // Update the item in the list
    const updatedItems = triageItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    setTriageItems(updatedItems);
    
    // Update search results if they exist
    if (searchResults) {
      const updatedSearchResults = searchResults.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      setSearchResults(updatedSearchResults);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "all") {
      setFilteredItems(triageItems);
    } else if (value === "critical") {
      setFilteredItems(triageItems.filter(item => item.priority === "critical"));
    } else if (value === "high") {
      setFilteredItems(triageItems.filter(item => item.priority === "high"));
    } else if (value === "medium") {
      setFilteredItems(triageItems.filter(item => item.priority === "medium"));
    } else if (value === "low") {
      setFilteredItems(triageItems.filter(item => item.priority === "low"));
    } else if (value === "resolved") {
      setFilteredItems(triageItems.filter(item => item.status === "resolved"));
    }
    
    // Clear search results when changing tabs
    setSearchResults(null);
  };

  const handleSearchResults = (results: TriageItem[]) => {
    setSearchResults(results);
  };

  const refreshDataSources = () => {
    toast({
      title: "Refreshing data sources",
      description: "Syncing latest data from connected sources",
    });
  };

  const addDataSource = () => {
    toast({
      title: "Add Data Source",
      description: "This feature is not implemented in the demo",
    });
  };

  const displayItems = searchResults !== null ? searchResults : filteredItems;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Triage AI Dashboard</h2>
          <p className="text-muted-foreground">
            AI-powered incident management and triage system
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <TriageStatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col space-y-4">
            <SearchBar onSearchResults={handleSearchResults} />
            
            {searchResults !== null && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 flex items-center">
                  Showing {searchResults.length} search results.
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 p-0 h-auto"
                    onClick={() => setSearchResults(null)}
                  >
                    Clear results
                  </Button>
                </p>
              </div>
            )}
            
            {searchResults === null && (
              <Tabs defaultValue="all" onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="critical">Critical</TabsTrigger>
                  <TabsTrigger value="high">High</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {displayItems.length > 0 ? (
            <TriageList items={displayItems} onItemUpdate={handleItemUpdate} />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <p className="text-muted-foreground">No items to display</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {searchResults !== null
                    ? "Try another search term"
                    : "Add a new item or change filters"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <IngestForm onItemAdded={handleItemAdded} />
          <DataSources 
            sources={dataSources} 
            onRefresh={refreshDataSources}
            onAdd={addDataSource} 
          />
        </div>
      </div>
    </div>
  );
}