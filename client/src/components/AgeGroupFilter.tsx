import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AgeGroupValue = '12-14' | '15-17' | '18-21' | 'all';

interface AgeGroupFilterProps {
  value: AgeGroupValue;
  onChange: (value: AgeGroupValue) => void;
}

export function AgeGroupFilter({ value, onChange }: AgeGroupFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Leeftijdsgroep:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Selecteer leeftijd" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle leeftijden</SelectItem>
          <SelectItem value="12-14">12-14 jaar</SelectItem>
          <SelectItem value="15-17">15-17 jaar</SelectItem>
          <SelectItem value="18-21">18-21 jaar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
