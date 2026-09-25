import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  createProduct,
  getProduct,
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
import { adminMediaErrorMessage, adminSaveErrorMessage, isNetworkError } from "./messages";

const backLinkClassName =
  "inline-flex min-h-11 items-center justify-center justify-self-start rounded-sm border border-border-strong bg-surface px-4 py-2.5 font-bold text-brand-dark no-underline hover:border-brand hover:bg-brand hover:text-white";

type PostCreateImageState =
  | { kind: "none" }
  | { kind: "ready" }
  | { kind: "uploaded" }
  | { kind: "failed"; message: string }
  | { kind: "unknown" };

export default function AdminProductCreate() {
  const [values, setValues] = useState<ProductFieldValues>({ name: "", description: "", price: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewUrl = useFilePreview(selectedFile);
  const [fieldError, setFieldError] = useState<ProductFieldError | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResultUnknown, setCreateResultUnknown] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<ProductResponse | null>(null);
  const [imageState, setImageState] = useState<PostCreateImageState>({ kind: "none" });
  const [isUploading, setIsUploading] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const completionHeadingRef = useRef<HTMLHeadingElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const isBusy = isCreating || isUploading || isReconciling;
  const hasPendingMedia =
    imageState.kind === "ready" || imageState.kind === "failed" || imageState.kind === "unknown";

  useEffect(() => {
    if (fieldError !== null) {
      document.getElementById(`admin-create-${fieldError.field}`)?.focus();
    }
  }, [fieldError]);

  useEffect(() => {
    if (createdProduct === null) {
      return;
    }

    if (hasPendingMedia) {
      document.getElementById("admin-create-media-file")?.focus();
    } else {
      completionHeadingRef.current?.focus();
    }
  }, [createdProduct, hasPendingMedia]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    if (createdProduct !== null) {
      await uploadSelectedImage(createdProduct, selectedFile);
      return;
    }

    const validation = validateProductFields(values);

    if (validation !== null) {
      setFieldError(validation);
      return;
    }

    setFieldError(null);
    setIsCreating(true);
    setCreateError(null);
    setCreateResultUnknown(false);

    try {
      const created = await createProduct({
        name: values.name,
        description: values.description,
        price: Number(values.price),
        mediaKey: null
      });
      setCreatedProduct(created);
      setIsCreating(false);

      if (selectedFile !== null) {
        setImageState({ kind: "ready" });
        await uploadSelectedImage(created, selectedFile);
      }
    } catch (caughtError) {
      setIsCreating(false);

      if (isNetworkError(caughtError)) {
        setCreateResultUnknown(true);
      } else {
        setCreateError(adminSaveErrorMessage(caughtError));
        submitButtonRef.current?.focus();
      }
    }
  }

  async function uploadSelectedImage(created: ProductResponse, file: File | null) {
    if (file === null) {
      return;
    }

    setIsUploading(true);

    try {
      const updated = await uploadProductMedia(created.id, file);
      setCreatedProduct(updated);
      setSelectedFile(null);
      setImageState({ kind: "uploaded" });
    } catch (caughtError) {
      if (isNetworkError(caughtError)) {
        setIsReconciling(true);
        try {
          const current = await getProduct(created.id);
          setCreatedProduct(current);

          if (current.uploadedMediaId !== null) {
            setSelectedFile(null);
            setImageState({ kind: "uploaded" });
          } else {
            setImageState({
              kind: "failed",
              message:
                "The upload could not be confirmed, and the Product currently has no uploaded image."
            });
          }
        } catch {
          setImageState({ kind: "unknown" });
        } finally {
          setIsReconciling(false);
        }
      } else {
        setImageState({ kind: "failed", message: adminMediaErrorMessage(caughtError) });
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function reconcileCreatedProduct() {
    if (createdProduct === null) {
      return;
    }

    setIsReconciling(true);

    try {
      const current = await getProduct(createdProduct.id);
      setCreatedProduct(current);

      if (current.uploadedMediaId !== null) {
        setSelectedFile(null);
        setImageState({ kind: "uploaded" });
      } else {
        setImageState({
          kind: "failed",
          message: "No uploaded image was found for this Product. Choose an image and retry the upload."
        });
      }
    } catch {
      setImageState({ kind: "unknown" });
    } finally {
      setIsReconciling(false);
    }
  }

  function selectFileInPendingPanel(file: File | null) {
    setSelectedFile(file);

    if (file !== null) {
      setImageState({ kind: "ready" });
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6" aria-labelledby="admin-create-heading">
      <div className="grid gap-1.5">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">Admin</p>
        <h1
          id="admin-create-heading"
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] tracking-[-0.03em] text-ink"
        >
          Create Product
        </h1>
        <p className="max-w-prose text-muted">
          Add a Product to the Catalog. An image is optional and can be added now or later.
        </p>
      </div>
      <a className={backLinkClassName} href="/admin/products">
        <span aria-hidden="true">&#8592;</span> Back to Product list
      </a>

      {createResultUnknown ? (
        <div className="grid gap-4 rounded-lg border border-danger bg-surface p-5">
          <h2 className="text-lg leading-[1.15] text-ink">Create result unknown</h2>
          <StatusMessage tone="error">
            The Product service could not be reached, so the create result is unknown. Check the
            Product list before creating again.
          </StatusMessage>
          <a className={backLinkClassName} href="/admin/products">
            Go to Product list
          </a>
        </div>
      ) : createdProduct !== null ? (
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-5">
          <h2 ref={completionHeadingRef} tabIndex={-1} className="text-lg leading-[1.15] text-ink">
            {hasPendingMedia ? "Product created; image not saved" : "Product created"}
          </h2>
          {imageState.kind === "uploaded" ? (
            <StatusMessage tone="success">Product created with its uploaded image.</StatusMessage>
          ) : imageState.kind === "none" ? (
            <StatusMessage tone="success">
              Product created without an image. You can add one later from the Product list.
            </StatusMessage>
          ) : imageState.kind === "failed" ? (
            <StatusMessage tone="error">
              Product created; image could not be uploaded. {imageState.message}
            </StatusMessage>
          ) : imageState.kind === "unknown" ? (
            <StatusMessage tone="error">
              Product created; the image upload could not be confirmed. Check the current image
              before retrying.
            </StatusMessage>
          ) : (
            <StatusMessage tone="pending">
              {selectedFile === null
                ? "Choose an image to upload for this Product."
                : "The selected image has not been uploaded yet. Retry the upload when ready."}
            </StatusMessage>
          )}
          {hasPendingMedia ? (
            <>
              <ProductImageSection
                idPrefix="admin-create-media"
                mode="create"
                product={createdProduct}
                name={createdProduct.name}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                removalStaged={false}
                isBusy={isBusy}
                showRemoval={false}
                onSelectFile={selectFileInPendingPanel}
                onClearSelection={() => setSelectedFile(null)}
                onStageRemoval={() => {}}
                onUndoRemoval={() => {}}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void uploadSelectedImage(createdProduct, selectedFile)}
                  disabled={isBusy || selectedFile === null}
                >
                  {isUploading ? "Uploading image..." : "Retry image upload"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void reconcileCreatedProduct()}
                  disabled={isBusy}
                >
                  {isReconciling ? "Reloading..." : "Reload Product"}
                </Button>
              </div>
            </>
          ) : null}
          <a className={backLinkClassName} href="/admin/products">
            Go to Product list
          </a>
        </div>
      ) : (
        <form className="grid gap-6" onSubmit={handleSubmit} aria-busy={isBusy} noValidate>
          <div className="grid gap-4 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg leading-[1.15] text-ink">Product details</h2>
            <ProductFields
              idPrefix="admin-create"
              values={values}
              onChange={setValues}
              error={fieldError}
              disabled={isBusy}
            />
          </div>
          <ProductImageSection
            idPrefix="admin-create"
            mode="create"
            product={null}
            name={values.name}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            removalStaged={false}
            isBusy={isBusy}
            showRemoval={false}
            onSelectFile={(file) => setSelectedFile(file)}
            onClearSelection={() => setSelectedFile(null)}
            onStageRemoval={() => {}}
            onUndoRemoval={() => {}}
          />
          {createError !== null ? <StatusMessage tone="error">{createError}</StatusMessage> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button ref={submitButtonRef} type="submit" disabled={isBusy}>
              {isCreating ? "Creating Product..." : "Create Product"}
            </Button>
            <a className="text-sm font-bold text-brand-dark" href="/admin/products">
              Cancel
            </a>
          </div>
        </form>
      )}
    </section>
  );
}
