import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type NameComboboxProps = {
  id: string;
  value: string;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onSelect: (value: string) => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function NameCombobox({
  id,
  value,
  options,
  disabled,
  placeholder = "Select name",
  searchPlaceholder = "Search name...",
  onSelect,
}: NameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const trimmedSearchValue = searchValue.trim();
  const normalizedSearchValue = normalize(searchValue);
  const matches = useMemo(() => {
    if (!normalizedSearchValue) return options.slice(0, 10);

    return options
      .filter((option) => option.toLowerCase().includes(normalizedSearchValue))
      .slice(0, 10);
  }, [normalizedSearchValue, options]);
  const hasExactMatch = options.some(
    (option) => option.toLowerCase() === normalizedSearchValue,
  );
  const showCustomOption = trimmedSearchValue.length > 0 && !hasExactMatch;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchValue("");
    }
  };

  const handleSelect = (nextValue: string) => {
    onSelect(nextValue);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between border-input bg-transparent px-3 font-normal",
            !value.trim() && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value.trim() || placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandGroup>
              {showCustomOption ? (
                <CommandItem
                  value={`custom-${trimmedSearchValue}`}
                  onSelect={() => handleSelect(trimmedSearchValue)}
                >
                  Use "{trimmedSearchValue}"
                </CommandItem>
              ) : null}
              {matches.map((option) => {
                const isSelected = option === value.trim();
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
