import { useEffect, useRef, useState, type FormEvent } from "react";
import { curatedMediaKeys } from "../catalog/mediaCatalog";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import StatusMessage from "../ui/StatusMessage";

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  mediaKey: string | null;
}

const NAME_ERROR = "Enter a Product name.";
const DESCRIPTION_ERROR = "Enter a Product description.";
const PRICE_ERROR = "Enter a price that is zero or greater.";

type FieldName = "name" | "description" | "price";

export default function ProductForm({
  idPrefix,
  headingId,
  initialValues,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
  onCancel
}: {
  idPrefix: string;
  headingId: string;
  initialValues?: ProductFormValues;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (values: ProductFormValues) => void;
  onCancel?: () => void;
}) {
  const focusOnMount = initialValues !== undefined;
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [price, setPrice] = useState(initialValues === undefined ? "" : String(initialValues.price));
  const [mediaKey, setMediaKey] = useState(initialValues?.mediaKey ?? "");
  const [validationError, setValidationError] = useState<{
    field: FieldName;
    message: string;
  } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnMount) {
      nameInputRef.current?.focus();
    }
  }, [focusOnMount]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    const numericPrice = Number(price);

    if (name.trim().length === 0) {
      setValidationError({ field: "name", message: NAME_ERROR });
      return;
    }

    if (description.trim().length === 0) {
      setValidationError({ field: "description", message: DESCRIPTION_ERROR });
      return;
    }

    if (price.length === 0 || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setValidationError({ field: "price", message: PRICE_ERROR });
      return;
    }

    setValidationError(null);
    onSubmit({
      name,
      description,
      price: numericPrice,
      mediaKey: mediaKey.length === 0 ? null : mediaKey
    });
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      aria-labelledby={headingId}
      noValidate
    >
      <FormField
        id={`${idPrefix}-name`}
        label="Name"
        error={validationError?.field === "name" ? validationError.message : null}
      >
        {(control) => (
          <input
            {...control}
            ref={nameInputRef}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
            required
          />
        )}
      </FormField>
      <FormField
        id={`${idPrefix}-description`}
        label="Description"
        error={validationError?.field === "description" ? validationError.message : null}
      >
        {(control) => (
          <textarea
            {...control}
            name="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isPending}
            required
          />
        )}
      </FormField>
      <FormField
        id={`${idPrefix}-price`}
        label="Price"
        error={validationError?.field === "price" ? validationError.message : null}
      >
        {(control) => (
          <input
            {...control}
            name="price"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            disabled={isPending}
            required
          />
        )}
      </FormField>
      <FormField id={`${idPrefix}-media`} label="Media" error={null}>
        {(control) => (
          <select
            {...control}
            name="mediaKey"
            value={mediaKey}
            onChange={(event) => setMediaKey(event.target.value)}
            disabled={isPending}
          >
            <option value="">No media</option>
            {mediaKeyOptions(initialValues?.mediaKey ?? null).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          id={`${idPrefix}-submit`}
          type="submit"
          className="justify-self-start"
          disabled={isPending}
        >
          {isPending ? pendingLabel : submitLabel}
        </Button>
        {onCancel === undefined ? null : (
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
      {error !== null ? <StatusMessage tone="error">{error}</StatusMessage> : null}
    </form>
  );
}

function mediaKeyOptions(currentMediaKey: string | null): string[] {
  if (
    currentMediaKey === null ||
    (curatedMediaKeys as readonly string[]).includes(currentMediaKey)
  ) {
    return [...curatedMediaKeys];
  }

  return [...curatedMediaKeys, currentMediaKey];
}
