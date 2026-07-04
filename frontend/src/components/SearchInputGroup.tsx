import { Loader2, RefreshCw, Search } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchInputGroupProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  loading?: boolean;
  placeholder?: string;
  maxLength?: number;
  leading?: ReactNode;
};

export function SearchInputGroup({
  value,
  onChange,
  onSearch,
  onRefresh,
  loading = false,
  placeholder = "Поиск",
  maxLength,
  leading,
}: SearchInputGroupProps) {
  return (
    <div className={`flex w-full ${leading ? "flex-col gap-2 sm:flex-row sm:gap-0" : ""}`}>
      {leading}
      <div className={`flex min-w-0 ${leading ? "flex-1" : "w-full"}`}>
        <Input
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          className={leading ? "rounded-r-none sm:rounded-none" : "rounded-r-none"}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
        />
        <Button type="button" variant="outline" className="shrink-0 rounded-none" disabled={loading} onClick={onRefresh}>
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        </Button>
        <Button type="button" variant="outline" className="shrink-0 rounded-l-none" onClick={onSearch}>
          <Search />
        </Button>
      </div>
    </div>
  );
}
