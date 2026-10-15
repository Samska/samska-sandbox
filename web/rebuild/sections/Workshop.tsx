import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { CreateProductInput } from "../transport/types";
import {
  type CreateSlice,
  type FormValues,
  toCreateInput,
  validateForm
} from "../state";
import { humaniseCreateError } from "../messages";

interface WorkshopProps {
  slice: CreateSlice;
  disabled: boolean;
  onSubmit(input: CreateProductInput): void;
  onChange(values: FormValues): void;
  onReset(): void;
}

type FieldName = "name" | "description" | "price";

/**
 * Workshop / create form. Deliberately utilitarian and visually distinct from
 * the storefront: sans-serif heading, dense fields with bottom borders, a
 * single panel with internal rules, anchored primary action.
 */
export function Workshop({ slice, disabled, onSubmit, onChange, onReset }: WorkshopProps) {
  const values = slice.values;
  const isPending = slice.status === "pending";
  const isSaved = slice.status === "saved";
  const submitDisabled = disabled || isPending;
  const fieldsDisabled = disabled || isPending;

  const [localErrors, setLocalErrors] = useState<ReadonlyArray<FieldName>>([]);
  const localSet = useMemo(() => new Set(localErrors), [localErrors]);
  const serverFields = useMemo(() => {
    if (slice.status !== "error" || slice.error.kind !== "validation") {
      return new Set<FieldName>();
    }
    return new Set(slice.error.fields);
  }, [slice]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isPending) {
      return;
    }
    const fields = validateForm(values);
    if (fields.length > 0) {
      setLocalErrors(fields);
      return;
    }
    setLocalErrors([]);
    onSubmit(toCreateInput(values));
  };

  const handleChange = (next: FormValues) => {
    setLocalErrors([]);
    onChange(next);
  };

  return (
    <section
      className="section"
      aria-labelledby="workshop-heading"
    >
      <header className="workshop-head">
        <p className="page-head__eyebrow">Workshop · new product</p>
        <h2 id="workshop-heading" className="section-title">
          Create Product
        </h2>
      </header>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="workshop-panel"
        data-testid="create-form"
        aria-describedby="workshop-help"
      >
        <p id="workshop-help" className="sr-only">
          Required fields are Name, Description and a non-negative Price. The
          product is stored in memory and may have been saved even when a
          network error occurs — check Products before retrying.
        </p>
        <div className="form-grid">
          <Field
            id="product-name"
            label="Name"
            value={values.name}
            onChange={(next) => handleChange({ ...values, name: next })}
            disabled={fieldsDisabled}
            invalid={localSet.has("name") || serverFields.has("name")}
            errorMessage="Name is required."
          />
          <Field
            id="product-description"
            label="Description"
            as="textarea"
            value={values.description}
            onChange={(next) => handleChange({ ...values, description: next })}
            disabled={fieldsDisabled}
            invalid={localSet.has("description") || serverFields.has("description")}
            errorMessage="Description is required."
          />
          <Field
            id="product-price"
            label="Price"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={values.price}
            onChange={(next) => handleChange({ ...values, price: next })}
            disabled={fieldsDisabled}
            invalid={localSet.has("price") || serverFields.has("price")}
            errorMessage="Enter zero or greater."
          />
        </div>
        <div className="form-actions">
          <div className="form-actions__primary">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitDisabled}
              data-testid="create-submit"
            >
              {isPending ? "Creating…" : "Create Product"}
            </button>
            <CreateStatus slice={slice} />
          </div>
          {isSaved ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onReset}
              data-testid="create-another"
            >
              Create another
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function CreateStatus({ slice }: { slice: CreateSlice }) {
  if (slice.status === "pending") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="status-line status-line--pending"
        data-testid="create-pending"
      >
        Saving…
      </p>
    );
  }
  if (slice.status === "error") {
    return (
      <p
        role="alert"
        className="status-line status-line--error"
        data-testid="create-error"
      >
        {humaniseCreateError(slice.error)}
      </p>
    );
  }
  if (slice.status === "saved") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="status-line status-line--success"
        data-testid="create-success"
      >
        Saved.
      </p>
    );
  }
  return null;
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange(next: string): void;
  disabled: boolean;
  invalid: boolean;
  as?: "input" | "textarea";
  inputMode?: "decimal" | "text";
  type?: "text" | "number";
  errorMessage?: string;
  help?: string;
  placeholder?: string;
}

function Field(props: FieldProps) {
  const {
    id,
    label,
    value,
    onChange,
    disabled,
    invalid,
    as = "input",
    inputMode,
    type = "text",
    errorMessage,
    help,
    placeholder
  } = props;
  const describedBy = [
    invalid && errorMessage ? `${id}-error` : null,
    help ? `${id}-help` : null
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={id}
          name={id}
          rows={3}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className="field-input"
          data-testid={`field-${id}`}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "any" : undefined}
          inputMode={inputMode}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          className="field-input"
          data-testid={`field-${id}`}
        />
      )}
      {help ? (
        <p id={`${id}-help`} className="field-help">
          {help}
        </p>
      ) : null}
      {invalid && errorMessage ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}