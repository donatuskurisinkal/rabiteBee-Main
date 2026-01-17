
import { useState, useEffect, useMemo } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  value: OptionType[];
  onChange: (value: OptionType[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Search groups...",
  emptyMessage = "No groups found.",
  className,
}: MultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const handleUnselect = (option: OptionType) => {
    onChange(value.filter((item) => item.value !== option.value));
  };

  const handleSelect = (selectedValue: string) => {
    const option = options.find((item) => item.value === selectedValue);
    if (option && !value.some((item) => item.value === selectedValue)) {
      const newOption: OptionType = {
        label: option.label || "",
        value: option.value || "",
      };
      onChange([...value, newOption]);
      setSearchTerm("");
      setIsCommandOpen(false);
    }
  };

  // Filter options based on search term and exclude already selected options
  const filteredOptions = useMemo(() => {
    if (!options || !Array.isArray(options)) return [];
    
    return options.filter(
      (option) => 
        !value.some((item) => item.value === option.value) && 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, value, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {value.map((option) => (
          <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
            {option.label}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => handleUnselect(option)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {option.label}</span>
            </button>
          </Badge>
        ))}

        {value.length === 0 && (
          <div className="text-sm text-muted-foreground">No groups selected</div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Command className={cn("w-full", className)}>
            <CommandInput 
              placeholder={placeholder}
              value={searchTerm}
              onValueChange={(value) => {
                setSearchTerm(value);
                setIsCommandOpen(true);
              }}
              onFocus={() => setIsCommandOpen(true)}
            />
            {isCommandOpen && (
              <div className="absolute w-full z-50 bg-popover border rounded-md shadow-md mt-1">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={handleSelect}
                        className="cursor-pointer"
                      >
                        {option.label}
                      </CommandItem>
                    ))
                  ) : (
                    <div className="py-2 px-2 text-sm text-muted-foreground">
                      {searchTerm ? "No matching groups found" : "No more groups available"}
                    </div>
                  )}
                </CommandGroup>
              </div>
            )}
          </Command>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsCommandOpen(!isCommandOpen)}
          disabled={!filteredOptions || filteredOptions.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
    </div>
  );
}
