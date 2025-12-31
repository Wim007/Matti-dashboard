import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
  className?: string;
}

const presets = [
  { label: "Laatste 7 dagen", days: 7 },
  { label: "Laatste 30 dagen", days: 30 },
  { label: "Laatste 90 dagen", days: 90 },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ from, to });
    setIsOpen(false);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
            className={cn(
              "text-sm",
              value.from.getTime() === new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0) &&
              value.to.getTime() >= Date.now() - 60000
                ? "bg-primary text-primary-foreground"
                : ""
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy", { locale: nl })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: nl })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: nl })
              )
            ) : (
              <span>Aangepast bereik</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={nl}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
