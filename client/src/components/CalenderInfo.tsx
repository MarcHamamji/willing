import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';

import { FormField } from '../utils/formUtils';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import 'react-day-picker/style.css';

interface CalendarCommonProps {
  startLabel?: string;
  endLabel?: string;
  className?: string;
  inputType?: 'date' | 'datetime-local';
}

interface CalendarFormProps<T extends FieldValues> extends CalendarCommonProps {
  form: UseFormReturn<T>;
  startName: Path<T>;
  endName: Path<T>;
}

interface CalendarControlledProps extends CalendarCommonProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
}

type CalendarProps<T extends FieldValues> = CalendarFormProps<T> | CalendarControlledProps;

export default function CalenderInfo<T extends FieldValues>({
  startLabel = 'Start Date',
  endLabel = 'End Date',
  inputType = 'datetime-local',
  className,
  ...props
}: CalendarProps<T>) {
  if ('form' in props) {
    const formClassName = className ?? 'grid grid-cols-2 gap-3';

    return (
      <div className={formClassName}>
        <FormField
          form={props.form}
          label={startLabel}
          name={props.startName}
          type={inputType}
        />

        <FormField
          form={props.form}
          label={endLabel}
          name={props.endName}
          type={inputType}
        />
      </div>
    );
  }

  return (
    <ControlledCalenderInfo
      inputType={inputType}
      className={className}
      startLabel={startLabel}
      endLabel={endLabel}
      startValue={props.startValue}
      endValue={props.endValue}
      onStartChange={props.onStartChange}
      onEndChange={props.onEndChange}
      startPlaceholder={props.startPlaceholder}
      endPlaceholder={props.endPlaceholder}
    />
  );
}

function ControlledCalenderInfo({
  startLabel,
  endLabel,
  className,
  inputType,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder,
  endPlaceholder,
}: CalendarControlledProps & {
  startLabel: string;
  endLabel: string;
  className?: string;
  inputType: 'date' | 'datetime-local';
}) {
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const controlledClassName = className ?? 'relative';

  if (inputType === 'date') {
    const selectedStartDate = startValue
      ? new Date(`${startValue}T00:00:00`)
      : undefined;
    const selectedEndDate = endValue
      ? new Date(`${endValue}T00:00:00`)
      : undefined;

    const formatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const formatInputDate = (date: Date) => {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const startText = selectedStartDate
      ? formatter.format(selectedStartDate)
      : (startPlaceholder ?? startLabel);

    const endText = selectedEndDate
      ? formatter.format(selectedEndDate)
      : (endPlaceholder ?? endLabel);

    const dateClassName = className ?? 'contents';

    return (
      <div className={dateClassName}>
        <div className="relative">
          <button
            type="button"
            className="input input-bordered flex items-center justify-between gap-2"
            onClick={() => setActivePicker(prev => prev === 'start' ? null : 'start')}
          >
            <span className="truncate text-left">{startText}</span>
            <CalendarDays size={16} className="shrink-0 opacity-70" />
          </button>

          {activePicker === 'start' && (
            <div className="absolute left-0 z-30 mt-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
              <DayPicker
                className="willing-day-picker"
                mode="single"
                selected={selectedStartDate}
                onSelect={(date) => {
                  onStartChange(date ? formatInputDate(date) : '');
                  if (date) {
                    setActivePicker(null);
                  }
                }}
              />

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => onStartChange('')}
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => setActivePicker(null)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            className="input input-bordered flex items-center justify-between gap-2"
            onClick={() => setActivePicker(prev => prev === 'end' ? null : 'end')}
          >
            <span className="truncate text-left">{endText}</span>
            <CalendarDays size={16} className="shrink-0 opacity-70" />
          </button>

          {activePicker === 'end' && (
            <div className="absolute left-0 z-30 mt-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
              <DayPicker
                className="willing-day-picker"
                mode="single"
                selected={selectedEndDate}
                onSelect={(date) => {
                  onEndChange(date ? formatInputDate(date) : '');
                  if (date) {
                    setActivePicker(null);
                  }
                }}
              />

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => onEndChange('')}
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={() => setActivePicker(null)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleDateTimeInput = (value: string) => {
    if (inputType !== 'datetime-local') return value;

    const yearMatch = value.match(/^(\d+)-/);
    if (yearMatch && yearMatch[1].length > 4) {
      return value.slice(0, 4) + value.slice(yearMatch[1].length);
    }

    return value;
  };

  return (
    <div className={controlledClassName}>
      <input
        type={inputType}
        placeholder={startPlaceholder ?? startLabel}
        value={startValue}
        onChange={event => onStartChange(handleDateTimeInput(event.target.value))}
        className="input input-bordered"
      />

      <input
        type={inputType}
        placeholder={endPlaceholder ?? endLabel}
        value={endValue}
        onChange={event => onEndChange(handleDateTimeInput(event.target.value))}
        className="input input-bordered"
      />
    </div>
  );
}
