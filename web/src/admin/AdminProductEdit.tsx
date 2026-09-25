import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  getProduct,
  removeProductMedia,
  updateProduct,
  uploadProductMedia,
  type ProductResponse
} from "../catalog/catalogApi";
import ProductFields, {
  validateProductFields,
  type ProductFieldError,
  type ProductFieldValues
} from "./ProductFields";
import ProductImageSection from "./ProductImageSection";
import useFilePreview from "./useFilePreview";
import Button from "../ui/Button";
import StatusMessage from "../ui/StatusMessage";
import {
  adminLoadErrorMessage,
  adminMediaErrorMessage,
  adminSaveErrorMessage,
  isNetworkError
} from "./messages";

type MediaOperation = { kind: "upload"; file: File } | { kind: "remove" };

export default function AdminProductEdit({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<ProductFieldValues>({ name: "", description: "", price: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewUrl = useFilePreview(selectedFile);
  const [removalStaged, setRemovalStaged] = useState(false);
  const [fieldError, setFieldError] = useState<ProductFieldError | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const [uncertainMessage, setUncertainMessage] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<MediaOperation | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    void loadProduct();
  }, [productId]);

  useEffect(() => {
    if (fieldError !== null) {
      document.getElementById(`admin-edit-${fieldError.field}`)?.focus();
    }
  }, [fieldError]);

  useEffect(() => {
    if (successMessage !== null) {
      successRef.current?.focus();
    } else if (saveError !== null || mediaMessage !== null || uncertainMessage !== null) {
      submitRef.current?.focus();
    }
  }, [successMessage, saveError, mediaMessage, uncertainMessage]);

  async function loadProduct() {
    setIsLoading(true);
    setLoadError(null);
    resetTransientState();

    try {
      const loaded = await getProduct(productId);
      setProduct(loaded);
      setValues({ name: loaded.name, description: loaded.description, price: String(loaded.price) });
    } catch (caughtError) {
      setLoadError(adminLoadErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  function resetTransientState() {
    setSelectedFile(null);
    setRemovalStaged(false);
    setPendingMedia(null);
    setFieldError(null);
    setSaveError(null);
    setMediaMessage(null);
    setUncertainMessage(null);
    setSuccessMessage(null);
  }

  async function tryGetProduct(): Promise<ProductResponse | null> {
    try {
      return await getProduct(productId);
    } catch {
      return null;
    }
  }

  function fieldsMatch(saved: ProductResponse, submitted: ProductFieldValues): boolean {
    return (
      saved.name === submitted.name &&
      saved.description === submitted.description &&
      saved.price === Number(submitted.price)
    );
  }

  function mediaApplied(reconciled: ProductResponse, operation: MediaOperation, previous: ProductResponse): boolean {
    return operation.kind === "upload"
      ? reconciled.uploadedMediaId !== null &&
          reconciled.uploadedMediaId !== previous.uploadedMediaId
      : reconciled.uploadedMediaId === null;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving || product === null) {
      return;
    }

    const submitted = { ...values };
    const validation = validateProductFields(submitted);

    if (validation !== null) {
      setFieldError(validation);
      return;
    }

    setFieldError(null);

    if (pendingMedia !== null && fieldsMatch(product, submitted)) {
      await applyMedia(pendingMedia, product);
      return;
    }

    const operation: MediaOperation | null =
      selectedFile !== null
        ? { kind: "upload", file: selectedFile }
        : removalStaged
          ? { kind: "remove" }
          : null;

    setIsSaving(true);
    setSaveError(null);
    setMediaMessage(null);
    setUncertainMessage(null);
    setSuccessMessage(null);

    let saved: ProductResponse;

    try {
      saved = await updateProduct(productId, {
        name: submitted.name,
        description: submitted.description,
        price: Number(submitted.price),
        mediaKey: product.mediaKey
      });
    } catch (caughtError) {
      if (isNetworkError(caughtError)) {
        const reconciled = await tryGetProduct();

        if (reconciled !== null && fieldsMatch(reconciled, submitted)) {
          saved = reconciled;
        } else {
          setUncertainMessage(
            "The Product service could not be reached, so the save result is unknown. Reload the Product before saving again."
          );
          setIsSaving(false);
          return;
        }
      } else {
        setSaveError(adminSaveErrorMessage(caughtError));
        setIsSaving(false);
        return;
      }
    }

    setProduct(saved);
    setValues({ name: saved.name, description: saved.description, price: String(saved.price) });

    if (operation === null) {
      setIsSaving(false);
      setSuccessMessage(`${saved.name} was saved.`);
      return;
    }

    await applyMedia(operation, saved);
  }

  async function applyMedia(operation: MediaOperation, previous: ProductResponse) {
    setIsSaving(true);
    setSaveError(null);
    setMediaMessage(null);
    setUncertainMessage(null);
    setSuccessMessage(null);
    setPendingMedia(operation);

    try {
      if (operation.kind === "upload") {
        const updated = await uploadProductMedia(productId, operation.file);
        setProduct(updated);
        setValues({ name: updated.name, description: updated.description, price: String(updated.price) });
        setSelectedFile(null);
        setRemovalStaged(false);
        setPendingMedia(null);
        setSuccessMessage(`${updated.name} was saved.`);
      } else {
        await removeProductMedia(productId);
        const reconciled = await tryGetProduct();
        const next = reconciled ?? { ...previous, uploadedMediaId: null };
        setProduct(next);
        setValues({ name: next.name, description: next.description, price: String(next.price) });
        setRemovalStaged(false);
        setPendingMedia(null);
        setSuccessMessage(`${next.name} was saved.`);
      }
    } catch (caughtError) {
      if (isNetworkError(caughtError)) {
        const reconciled = await tryGetProduct();

        if (reconciled !== null && mediaApplied(reconciled, operation, previous)) {
          setProduct(reconciled);
          setValues({
            name: reconciled.name,
            description: reconciled.description,
            price: String(reconciled.price)
          });
          setSelectedFile(null);
          setRemovalStaged(false);
          setPendingMedia(null);
          setSuccessMessage(`${reconciled.name} was saved.`);
        } else if (reconciled !== null) {
          setProduct(reconciled);
          setMediaMessage(
            "The Product details were saved, but the image change could not be confirmed. The current image is shown; retry the image action if needed."
          );
        } else {
          setUncertainMessage(
            "The Product details were saved, but the image change could not be confirmed, and the Product could not be reloaded. Retry the image action or reload the Product."
          );
        }
      } else {
        setMediaMessage(
          `The Product details were saved, but ${
            operation.kind === "upload" ? "the image could not be uploaded" : "the image could not be removed"
          }. ${adminMediaErrorMessage(caughtError)}`
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function reconcileEdit() {
    if (product === null) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const reconciled = await tryGetProduct();
    setIsSaving(false);

    if (reconciled === null) {
      setUncertainMessage("The Product could not be reloaded. Retry the image action or try again.");
      return;
    }

    setProduct(reconciled);
    setValues({
      name: reconciled.name,
      description: reconciled.description,
      price: String(reconciled.price)
    });
    setUncertainMessage(null);
    setMediaMessage(null);

    if (pendingMedia !== null && mediaApplied(reconciled, pendingMedia, product)) {
      setPendingMedia(null);
      setSelectedFile(null);
      setRemovalStaged(false);
      setSuccessMessage(`${reconciled.name} was saved.`);
    } else if (pendingMedia !== null) {
      setMediaMessage("The image change is still pending. Retry the image action when ready.");
    }
  }

  function selectReplacementFile(file: File | null) {
    setSelectedFile(file);
    setRemovalStaged(false);
    setMediaMessage(null);
    setUncertainMessage(null);
    setPendingMedia((current) => {
      if (current === null) {
        return null;
      }

      return file === null ? null : { kind: "upload", file };
    });
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setMediaMessage(null);
    setUncertainMessage(null);
    setPendingMedia((current) => (current?.kind === "upload" ? null : current));
  }

  function undoStagedRemoval() {
    setRemovalStaged(false);
    setMediaMessage(null);
    setUncertainMessage(null);
    setPendingMedia((current) => (current?.kind === "remove" ? null : current));
  }

  function discardImageChange() {
    if (product === null) {
      return;
    }

    setPendingMedia(null);
    setSelectedFile(null);
    setRemovalStaged(false);
    setMediaMessage(null);
    setUncertainMessage(null);
    setValues({ name: product.name, description: product.description, price: String(product.price) });
  }

  if (isLoading) {
    return (
      <section className="mx-auto grid w-full max-w-3xl gap-6" aria-labelledby="admin-edit-heading">
        <h1 id="admin-edit-heading" className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink">
          Edit Product
        </h1>
        <StatusMessage tone="neutral">Loading Product...</StatusMessage>
      </section>
    );
  }

  if (loadError !== null || product === null) {
    return (
      <section className="mx-auto grid w-full max-w-3xl gap-6" aria-labelledby="admin-edit-heading">
        <h1 id="admin-edit-heading" className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink">
          Edit Product
        </h1>
        <StatusMessage tone="error">{loadError ?? "This Product could not be loaded."}</StatusMessage>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void loadProduct()} disabled={isLoading}>
            Retry Product
          </Button>
          <a className="self-center text-sm font-bold text-brand-dark" href="/admin/products">
            Back to Product list
          </a>
        </div>
      </section>
    );
  }

  const submitLabel =
    pendingMedia === null
      ? "Save changes"
      : pendingMedia.kind === "upload"
        ? "Retry image upload"
        : "Retry image removal";

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6" aria-labelledby="admin-edit-heading">
      <div className="grid gap-1.5">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">Admin</p>
        <h1
          id="admin-edit-heading"
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink"
        >
          Edit Product
        </h1>
        <p className="max-w-prose text-muted">
          Update Product details and its JPEG image. Cancel discards unsaved changes.
        </p>
      </div>
      <a
        className="inline-flex min-h-11 items-center justify-center justify-self-start rounded-sm border border-border-strong bg-surface px-4 py-2.5 font-bold text-brand-dark no-underline hover:border-brand hover:bg-brand hover:text-white"
        href="/admin/products"
      >
        <span aria-hidden="true">&#8592;</span> Back to Product list
      </a>

      {successMessage !== null ? (
        <div ref={successRef} tabIndex={-1}>
          <StatusMessage tone="success">{successMessage}</StatusMessage>
        </div>
      ) : null}

      <form className="grid gap-6" onSubmit={handleSave} aria-busy={isSaving} noValidate>
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg leading-[1.15] text-ink">Product details</h2>
          <ProductFields
            idPrefix="admin-edit"
            values={values}
            onChange={setValues}
            error={fieldError}
            disabled={isSaving}
          />
        </div>
        <ProductImageSection
          idPrefix="admin-edit"
          mode="edit"
          product={product}
          name={values.name}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          removalStaged={removalStaged}
          isBusy={isSaving}
          onSelectFile={selectReplacementFile}
          onClearSelection={clearSelectedFile}
          onStageRemoval={() => {
            setRemovalStaged(true);
            setMediaMessage(null);
          }}
          onUndoRemoval={undoStagedRemoval}
        />
        {saveError !== null ? <StatusMessage tone="error">{saveError}</StatusMessage> : null}
        {mediaMessage !== null ? <StatusMessage tone="error">{mediaMessage}</StatusMessage> : null}
        {uncertainMessage !== null ? <StatusMessage tone="error">{uncertainMessage}</StatusMessage> : null}
        {pendingMedia !== null ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void reconcileEdit()} disabled={isSaving}>
              Reload Product
            </Button>
            <Button variant="quiet" onClick={discardImageChange} disabled={isSaving}>
              Discard image change
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button ref={submitRef} type="submit" disabled={isSaving}>
            {isSaving ? "Saving changes..." : submitLabel}
          </Button>
          <a className="text-sm font-bold text-brand-dark" href="/admin/products">
            Cancel
          </a>
        </div>
      </form>
    </section>
  );
}
