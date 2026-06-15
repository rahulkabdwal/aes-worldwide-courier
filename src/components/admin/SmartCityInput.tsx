import { useMemo, useState } from "react";
import citiesData from "@/data/cities.json";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CityRecord = {
  name: string;
  country: string;
  subcountry?: string;
  geonameid?: number;
};

type SmartCityInputProps = {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (city: string, country: string) => void;
};

const MAX_RESULTS = 8;
const cities = citiesData as CityRecord[];

function sortByCityName(a: CityRecord, b: CityRecord) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function getCitySuggestions(queryValue: string) {
  const query = queryValue.trim().toLowerCase();
  if (!query) return [];

  const indianMatches: CityRecord[] = [];
  const internationalMatches: CityRecord[] = [];
  const seen = new Set<string>();

  for (const city of cities) {
    if (!city.name || !city.country) continue;
    if (!city.name.toLowerCase().startsWith(query)) continue;

    const key = `${city.name.toLowerCase()}-${city.country.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (city.country === "India") {
      indianMatches.push(city);
    } else {
      internationalMatches.push(city);
    }
  }

  return [
    ...indianMatches.sort(sortByCityName),
    ...internationalMatches.sort(sortByCityName),
  ].slice(0, MAX_RESULTS);
}

function formatCitySuggestion(city: CityRecord) {
  return `${city.name}, ${city.country}`;
}

export function SmartCityInput({
  id,
  label,
  value,
  disabled,
  placeholder,
  error,
  onChange,
  onSuggestionSelect,
}: SmartCityInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const matches = useMemo(() => getCitySuggestions(value), [value]);
  const showSuggestions =
    isFocused && !disabled && value.trim().length > 0 && matches.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
        />
        {showSuggestions ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-40 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {matches.map((match, index) => (
              <button
                key={match.geonameid ?? `${match.name}-${match.country}-${index}`}
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(match.name);
                  onSuggestionSelect?.(match.name, match.country);
                  setIsFocused(false);
                }}
              >
                <span className="truncate">{formatCitySuggestion(match)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
