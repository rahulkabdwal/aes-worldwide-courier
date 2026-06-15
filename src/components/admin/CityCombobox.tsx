import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import citiesData from "@/data/cities.json";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
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

type CityRecord = {
  name: string;
  country: string;
  geonameid?: number;
};

type CityComboboxProps = {
  id: string;
  value: string;
  country: string;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  onSelect: (city: string, country: string) => void;
};

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 10;
const cities = citiesData as CityRecord[];

function formatCity(city: Pick<CityRecord, "name" | "country">) {
  return `${city.name}, ${city.country}`;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function sortByCityName(a: CityRecord, b: CityRecord) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function searchCities(searchValue: string) {
  const query = normalizeSearch(searchValue);
  if (query.length < MIN_SEARCH_LENGTH) {
    return [];
  }

  const indianMatches: CityRecord[] = [];
  const internationalMatches: CityRecord[] = [];

  for (const city of cities) {
    if (!city.name || !city.country) continue;

    const normalizedCityName = city.name.toLowerCase();
    if (normalizedCityName.startsWith(query)) {
      if (city.country === "India") {
        indianMatches.push(city);
      } else {
        internationalMatches.push(city);
      }
    }
  }

  return [
    ...indianMatches.sort(sortByCityName),
    ...internationalMatches.sort(sortByCityName),
  ].slice(0, MAX_RESULTS);
}

export function CityCombobox({
  id,
  value,
  country,
  disabled,
  placeholder = "Select city",
  searchPlaceholder = "Search city...",
  onSelect,
}: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const matches = useMemo(() => searchCities(searchValue), [searchValue]);
  const normalizedSearchValue = normalizeSearch(searchValue);
  const hasSearchQuery = normalizedSearchValue.length >= MIN_SEARCH_LENGTH;
  const trimmedSearchValue = searchValue.trim();
  const hasExactMatch = matches.some(
    (city) => city.name.toLowerCase() === normalizedSearchValue,
  );
  const selectedLabel = value.trim()
    ? country.trim()
      ? `${value.trim()}, ${country.trim()}`
      : value.trim()
    : "";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchValue("");
    }
  };

  const handleSelect = (city: CityRecord) => {
    onSelect(city.name, city.country);
    setOpen(false);
    setSearchValue("");
  };

  const handleCustomSelect = () => {
    onSelect(trimmedSearchValue, "");
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
            !selectedLabel && "text-muted-foreground",
          )}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
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
            {!hasSearchQuery ? (
              <CommandEmpty>Type at least 2 characters.</CommandEmpty>
            ) : (
              <CommandGroup>
                {!hasExactMatch ? (
                  <CommandItem
                    value={`custom-${trimmedSearchValue}`}
                    onSelect={handleCustomSelect}
                  >
                    Use "{trimmedSearchValue}"
                  </CommandItem>
                ) : null}
                {matches.map((city, index) => {
                  const label = formatCity(city);
                  const isSelected =
                    city.name === value.trim() && city.country === country.trim();
                  return (
                    <CommandItem
                      key={city.geonameid ?? `${city.name}-${city.country}-${index}`}
                      value={`${label}-${city.geonameid ?? index}`}
                      onSelect={() => handleSelect(city)}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
