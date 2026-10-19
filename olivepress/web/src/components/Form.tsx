import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { Search, X } from 'lucide-react';

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  size,
  block,
  loading,
  children,
  className = '',
  ...rest
}: {
  variant?: BtnVariant;
  size?: 'sm';
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${block ? 'btn-block' : ''} ${className}`}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2, margin: 0 }} />
      )}
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {error && <div className="field-error">{error}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

export function TextField({
  label,
  required,
  error,
  hint,
  ...rest
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <input className={`input ${error ? 'error' : ''}`} {...rest} />
    </Field>
  );
}

export function TextAreaField({
  label,
  required,
  error,
  hint,
  ...rest
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <textarea className={`textarea ${error ? 'error' : ''}`} rows={3} {...rest} />
    </Field>
  );
}

export function SelectField<T extends string | number>({
  label,
  required,
  error,
  hint,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <select
        className={`select ${error ? 'error' : ''}`}
        value={value === '' ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return;
          onChange((typeof value === 'number' ? Number(raw) : raw) as T);
        }}
      >
        <option value="">{placeholder ?? '— Sélectionner —'}</option>
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function DateField({
  label,
  required,
  error,
  hint,
  value,
  onChange,
  clearable,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  clearable?: boolean;
}) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="date"
          className={`input ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {clearable && value && (
          <button type="button" className="icon-btn" title="Effacer" onClick={() => onChange('')}>
            <X size={18} />
          </button>
        )}
      </div>
    </Field>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-bar">
      <Search size={17} />
      <input
        className="input"
        value={value}
        placeholder={placeholder ?? 'Rechercher...'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
