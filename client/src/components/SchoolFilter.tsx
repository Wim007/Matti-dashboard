import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

/**
 * Schoolkiezer: filtert het dashboard op één school.
 *
 * AVG-proof by design: events bevatten alleen een schoollabel plus
 * geanonimiseerde velden (leeftijdsgroep, thema's) — nooit namen of
 * gespreksinhoud. Een schooldirecteur ziet dus wél wat er speelt,
 * maar nooit bij wie.
 */

export type SchoolValue = string | "all";

interface SchoolFilterProps {
  value: SchoolValue;
  onChange: (value: SchoolValue) => void;
}

export function SchoolFilter({ value, onChange }: SchoolFilterProps) {
  const { data: schools } = trpc.analytics.getSchools.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">School:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecteer school" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle scholen</SelectItem>
          {(schools ?? []).map((school) => (
            <SelectItem key={school} value={school}>
              {school}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
