import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const categories = ["All", "Software", "Core ECE", "Management"];

export function SearchBar({
  search,
  onSearch,
  category,
  onCategory,
}: {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by company, role, or question..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 bg-secondary border-border h-11"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => onCategory(c)}
            className={category === c ? "" : "border-border text-muted-foreground hover:text-foreground"}
          >
            {c}
          </Button>
        ))}
      </div>
    </div>
  );
}
