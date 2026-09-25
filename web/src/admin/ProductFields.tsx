import type { RefObject } from "react";
import FormField from "../ui/FormField";

export interface ProductFieldValues {
  name: string;
  description: string;
  price: string;
}

export type ProductFieldName = "name" | "description" | "price";

export interface ProductFieldError {
  field: ProductFieldName;
  message: string;
}

const NAME_ERROR = "Enter a Product name.";
const DESCRIPTION_ERROR = "Enter a Product description.";
const PRICE_ERROR = "Enter a price that is zero or greater.";

export function validateProductFields(values: ProductFieldValues): ProductFieldError | null {
  if (values.name.trim().length === 0) {
    return { field: "name", message: NAME_ERROR };
  }

  if (values.description.trim().length === 0) {
    return { field: "description", message: DESCRIPTION_ERROR };
  }

  const numericPrice = Number(values.price);

  if (values.price.length === 0 || !Number.isFinite(numericPrice) || numericPrice < 0) {
    return { field: "price", message: PRICE_ERROR };
  }

  return null;
}

export default function ProductFields({
  idPrefix,
  values,
  onChange,
  error,
  disabled,
  nameInputRef
}: {
  idPrefix: string;
  values: ProductFieldValues;
  onChange: (values: ProductFieldValues) => void;
  error: ProductFieldError | null;
  disabled: boolean;
  nameInputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <FormField
        id={`${idPrefix}-name`}
        label="Name"
        error={error?.field === "name" ? error.message : null}
      >
        {(control) => (
          <input
            {...control}
            ref={nameInputRef}
            name="name"
            value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            disabled={disabled}
            required
          />
        )}
      </FormField>
      <FormField
        id={`${idPrefix}-description`}
        label="Description"
        error={error?.field === "description" ? error.message : null}
      >
        {(control) => (
          <textarea
            {...control}
            name="description"
            rows={4}
            value={values.description}
            onChange={(event) => onChange({ ...values, description: event.target.value })}
            disabled={disabled}
            required
          />
        )}
      </FormField>
      <FormField
        id={`${idPrefix}-price`}
        label="Price"
        error={error?.field === "price" ? error.message : null}
      >
        {(control) => (
          <input
            {...control}
            name="price"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={values.price}
            onChange={(event) => onChange({ ...values, price: event.target.value })}
            disabled={disabled}
            required
          />
        )}
      </FormField>
    </>
  );
}
