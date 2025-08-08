import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchTriageItems } from "@/lib/tidb";
import { TriageItem } from "@/types";
import { Search, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SearchBarProps {
  onSearchResults: (items: TriageItem[]) => void;
}

export function SearchBar({ onSearchResults }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useVectorSearch, setUseVectorSearch] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await searchTriageItems(query, useVectorSearch);
      onSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search triage items..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-2 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          Search
        </Button>
      </div>
      <div className="flex items-center space-x-2 mt-2">
        <Switch
          id="vector-search"
          checked={useVectorSearch}
          onCheckedChange={setUseVectorSearch}
        />
        <Label htmlFor="vector-search" className="text-xs">
          Use Vector Search (semantic similarity)
        </Label>
      </div>
    </form>
  );
}