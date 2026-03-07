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

export default function CalendarInfo<T extends FieldValues>({
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
    <ControlledCalendarInfo
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

function ControlledCalendarInfo({
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

  if (inputType === 'date' || inputType === 'datetime-local') {
    const parseSelectedDate = (value: string) => {
      if (!value) return undefined;
      const datePart = value.split('T')[0];
      if (!datePart) return undefined;

      const parsed = new Date(`${datePart}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const getSelectedTime = (value: string) => {
      if (inputType !== 'datetime-local' || !value) return '';

      const timeMatch = value.match(/T(\d{2}:\d{2})/);
      return timeMatch?.[1] ?? '';
    };

    const selectedStartDate = parseSelectedDate(startValue);
    const selectedEndDate = parseSelectedDate(endValue);
    const selectedStartTime = getSelectedTime(startValue);
    const selectedEndTime = getSelectedTime(endValue);

    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const formatInputDate = (date: Date) => {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const formatDisplayDateTime = (date: Date, time: string) => {
      if (!time) return dateFormatter.format(date);

      const [hours, minutes] = time.split(':').map(Number);
      const displayDate = new Date(date);
      displayDate.setHours(hours, minutes, 0, 0);

      return dateTimeFormatter.format(displayDate);
    };

    const buildNextValue = (date: Date, currentValue: string) => {
      const datePart = formatInputDate(date);
      if (inputType === 'date') return datePart;

      const existingTime = getSelectedTime(currentValue) || '00:00';
      return `${datePart}T${existingTime}`;
    };

    const startText = selectedStartDate
      ? inputType === 'datetime-local'
        ? formatDisplayDateTime(selectedStartDate, selectedStartTime)
        : dateFormatter.format(selectedStartDate)
      : (startPlaceholder ?? startLabel);

    const endText = selectedEndDate
      ? inputType === 'datetime-local'
        ? formatDisplayDateTime(selectedEndDate, selectedEndTime)
        : dateFormatter.format(selectedEndDate)
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
            <div className="absolute left-0 z-500 mt-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
              <DayPicker
                className="willing-day-picker"
                mode="single"
                selected={selectedStartDate}
                onSelect={(date) => {
                  onStartChange(date ? buildNextValue(date, startValue) : '');
                  if (date && inputType === 'date') {
                    setActivePicker(null);
                  }
                }}
              />

              {inputType === 'datetime-local' && (
                <fieldset className="fieldset mt-2">
                  <label className="label py-1">
                    <span className="label-text text-xs">Time</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm w-full"
                    value={selectedStartTime}
                    onChange={(event) => {
                      if (!selectedStartDate) return;
                      onStartChange(`${formatInputDate(selectedStartDate)}T${event.target.value}`);
                    }}
                    disabled={!selectedStartDate}
                  />
                </fieldset>
              )}

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
            <div className="absolute left-0 z-500 mt-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
              <DayPicker
                className="willing-day-picker"
                mode="single"
                selected={selectedEndDate}
                onSelect={(date) => {
                  onEndChange(date ? buildNextValue(date, endValue) : '');
                  if (date && inputType === 'date') {
                    setActivePicker(null);
                  }
                }}
              />

              {inputType === 'datetime-local' && (
                <fieldset className="fieldset mt-2">
                  <label className="label py-1">
                    <span className="label-text text-xs">Time</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered input-sm w-full"
                    value={selectedEndTime}
                    onChange={(event) => {
                      if (!selectedEndDate) return;
                      onEndChange(`${formatInputDate(selectedEndDate)}T${event.target.value}`);
                    }}
                    disabled={!selectedEndDate}
                  />
                </fieldset>
              )}

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
