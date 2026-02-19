import { AlertCircle, type LucideIcon } from 'lucide-react';

import type { HTMLInputTypeAttribute } from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';

// eslint-disable-next-line react-refresh/only-export-components
export async function executeAndShowError<T extends FieldValues>(
  form: UseFormReturn<T>,
  action: () => Promise<void>,
) {
  form.clearErrors('root');

  try {
    await action();
  } catch (error: unknown) {
    const serverMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';

    form.setError('root', {
      type: 'server',
      message: serverMessage,
    });
  }
}

interface FormSelectOption {
  label: string;
  value: string | number;
}

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute | 'textarea';
  Icon?: LucideIcon;
  selectOptions?: FormSelectOption[];
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  Icon,
  selectOptions,
}: FormFieldProps<T>) {
  const { register, formState: { errors }, clearErrors } = form;
  const error = errors[name];

  const commonProps = {
    ...register(name, {
      onChange: () => clearErrors('root'),
    }),
    placeholder: placeholder || label,
  };

  const statusClass = error ? (type === 'textarea' ? 'textarea-error' : (selectOptions ? 'select-error' : 'input-error')) : '';
  const iconPadding = Icon ? 'pl-10' : '';
  return (
    <fieldset className="fieldset w-full">
      <label className="label">
        <span className="label-text font-medium">{label}</span>
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 z-10"
            size={18}
          />
        )}

        {
          selectOptions
            ? (
                <select
                  className={`select select-bordered w-full focus:select-primary ${iconPadding} ${statusClass}`}
                  {...commonProps}
                >
                  {placeholder && <option value="" disabled>{placeholder}</option>}
                  {selectOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )
            : type === 'textarea'
              ? (
                  <textarea
                    className={`textarea textarea-bordered w-full focus:textarea-primary ${iconPadding} ${statusClass}`}
                    rows={6}
                    {...commonProps}
                  />
                )
              : (
                  <input
                    type={type}
                    className={`input input-bordered w-full focus:input-primary ${iconPadding} ${statusClass}`}
                    {...commonProps}
                  />
                )
        }
      </div>
      {error?.message && (
        <p className="text-error text-sm mt-1">{error.message as string}</p>
      )}
    </fieldset>
  );
}

interface FormRootErrorProps<T extends FieldValues> {
  form: UseFormReturn<T>;
}

export function FormRootError<T extends FieldValues>({
  form,
}: FormRootErrorProps<T>) {
  const error = form.formState.errors.root;

  if (!error) return null;

  return (
    <div className="alert alert-error alert-soft mt-2 shadow-sm py-3 transition-all animate-in fade-in slide-in-from-top-1">
      <AlertCircle size={20} />
      <span className="text-sm font-medium">
        {error.message as string}
      </span>
    </div>
  );
}
