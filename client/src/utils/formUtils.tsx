import { AlertCircle, type LucideIcon } from 'lucide-react';

import type { HTMLInputTypeAttribute } from 'react';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';

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

interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  Icon?: LucideIcon;
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  Icon,
}: FormFieldProps<T>) {
  const { register, formState: { errors }, clearErrors } = form;
  const error = errors[name];

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
        <input
          type={type}
          placeholder={placeholder || label}
          className={`input input-bordered w-full focus:input-primary ${Icon ? 'pl-10' : ''} ${
            error ? 'input-error' : ''
          }`}
          {...register(name, {
            onChange: () => clearErrors('root'),
          })}
        />
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
    <div className="alert alert-error mt-4 shadow-sm py-3 transition-all animate-in fade-in slide-in-from-top-1">
      <AlertCircle size={20} />
      <span className="text-sm font-medium">
        {error.message as string}
      </span>
    </div>
  );
}
