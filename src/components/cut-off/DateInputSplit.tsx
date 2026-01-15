import React from 'react';
import { Input } from '@/components/ui/input';

interface DateInputSplitProps {
  day: number | undefined;
  month: number | undefined;
  year: number | undefined;
  onDayChange: (value: number | undefined) => void;
  onMonthChange: (value: number | undefined) => void;
  onYearChange: (value: number | undefined) => void;
  disabled?: boolean;
}

const DateInputSplit: React.FC<DateInputSplitProps> = ({
  day,
  month,
  year,
  onDayChange,
  onMonthChange,
  onYearChange,
  disabled = false
}) => {
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onDayChange(undefined);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 31) {
      onDayChange(num);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onMonthChange(undefined);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      onMonthChange(num);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onYearChange(undefined);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1900 && num <= 2100) {
      onYearChange(num);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={1}
        max={31}
        placeholder="JJ"
        value={day ?? ''}
        onChange={handleDayChange}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className="w-14 h-10 text-center px-2 bg-background border-border/60 focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-muted-foreground">/</span>
      <Input
        type="number"
        min={1}
        max={12}
        placeholder="MM"
        value={month ?? ''}
        onChange={handleMonthChange}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className="w-14 h-10 text-center px-2 bg-background border-border/60 focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-muted-foreground">/</span>
      <Input
        type="number"
        min={1900}
        max={2100}
        placeholder="AAAA"
        value={year ?? ''}
        onChange={handleYearChange}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className="w-20 h-10 text-center px-2 bg-background border-border/60 focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
};

export default DateInputSplit;
