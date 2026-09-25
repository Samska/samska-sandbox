import { useEffect, useRef, useState } from "react";
import type { ProductResponse } from "../catalog/catalogApi";
import ProductMedia from "../catalog/ProductMedia";
import { curatedMediaSource } from "../catalog/mediaCatalog";
import Button from "../ui/Button";
import FormField from "../ui/FormField";

const IMAGE_GUIDANCE =
  "JPEG only, up to 2 MiB, up to 2048 pixels per side, and at most 4 million pixels. The image is validated and re-encoded; EXIF rotation may be lost, so some phone photos can appear sideways.";

export default function ProductImageSection({
  idPrefix,
  mode,
  product,
  name,
  selectedFile,
  previewUrl,
  removalStaged,
  isBusy,
  showRemoval = true,
  onSelectFile,
  onClearSelection,
  onStageRemoval,
  onUndoRemoval
}: {
  idPrefix: string;
  mode: "create" | "edit";
  product: ProductResponse | null;
  name: string;
  selectedFile: File | null;
  previewUrl: string | null;
  removalStaged: boolean;
  isBusy: boolean;
  showRemoval?: boolean;
  onSelectFile: (file: File | null) => void;
  onClearSelection: () => void;
  onStageRemoval: () => void;
  onUndoRemoval: () => void;
}) {
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const confirmHeadingRef = useRef<HTMLHeadingElement>(null);
  const cancelConfirmRef = useRef<HTMLButtonElement>(null);
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirmingRemoval) {
      confirmHeadingRef.current?.focus();
    }
  }, [isConfirmingRemoval]);

  useEffect(() => {
    if (selectedFile === null) {
      setFileInputKey((key) => key + 1);
    }
  }, [selectedFile]);

  const placeholder = {
    id: "",
    name: name.trim().length > 0 ? name : "New Product",
    mediaKey: null,
    uploadedMediaId: null
  };
  const displayProduct =
    removalStaged && product !== null ? { ...product, uploadedMediaId: null } : product ?? placeholder;
  const sourceOverride = selectedFile !== null ? previewUrl : undefined;
  const hasSavedUpload = product !== null && product.uploadedMediaId !== null;

  function confirmRemoval() {
    onStageRemoval();
    setIsConfirmingRemoval(false);
    undoButtonRef.current?.focus();
  }

  function cancelRemoval() {
    setIsConfirmingRemoval(false);
    removeButtonRef.current?.focus();
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-surface p-5" aria-labelledby={`${idPrefix}-image`}>
      <h2 id={`${idPrefix}-image`} className="text-lg leading-[1.15] text-ink">
        Product image
      </h2>
      <div className="grid gap-5 min-[44rem]:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="w-40 max-w-full">
          <ProductMedia product={displayProduct} variant="square" sourceOverride={sourceOverride} />
        </div>
        <div className="grid content-start gap-3">
          <p className="text-sm leading-relaxed text-muted">
            {stateText({ mode, product, selectedFile, removalStaged })}
          </p>
          <FormField id={`${idPrefix}-file`} label="Image file" error={null}>
            {(control) => (
              <input
                {...control}
                key={fileInputKey}
                type="file"
                accept="image/jpeg,.jpg,.jpeg"
                disabled={isBusy}
                onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
              />
            )}
          </FormField>
          <p className="text-xs leading-relaxed text-muted">{IMAGE_GUIDANCE}</p>
          <div className="flex flex-wrap gap-2">
            {selectedFile !== null ? (
              <Button variant="secondary" size="sm" onClick={onClearSelection} disabled={isBusy}>
                Clear selection
              </Button>
            ) : removalStaged ? (
              <Button ref={undoButtonRef} variant="secondary" size="sm" onClick={onUndoRemoval} disabled={isBusy}>
                Keep uploaded image
              </Button>
            ) : showRemoval && hasSavedUpload ? (
              <Button
                ref={removeButtonRef}
                variant="danger"
                size="sm"
                onClick={() => setIsConfirmingRemoval(true)}
                disabled={isBusy}
              >
                Remove image
              </Button>
            ) : null}
          </div>
          {isConfirmingRemoval && product !== null ? (
            <div
              className="grid gap-3 rounded-md border border-danger bg-surface-muted p-3"
              role="group"
              aria-labelledby={`${idPrefix}-remove-heading`}
            >
              <h3
                id={`${idPrefix}-remove-heading`}
                ref={confirmHeadingRef}
                tabIndex={-1}
                className="font-bold text-ink"
              >
                Remove the uploaded image?
              </h3>
              <p className="text-sm text-muted">
                The Market will show {removalFallback(product)} after you save. Nothing changes until
                then.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button ref={cancelConfirmRef} variant="secondary" size="sm" onClick={cancelRemoval} disabled={isBusy}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={confirmRemoval} disabled={isBusy}>
                  Remove on save
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function stateText({
  mode,
  product,
  selectedFile,
  removalStaged
}: {
  mode: "create" | "edit";
  product: ProductResponse | null;
  selectedFile: File | null;
  removalStaged: boolean;
}): string {
  if (selectedFile !== null) {
    return mode === "create"
      ? "A new image is selected. It will be uploaded after the Product is created."
      : "A new image is selected. It will replace the saved image when you save.";
  }

  if (removalStaged && product !== null) {
    return `The saved image will be removed when you save. The Market will show ${removalFallback(product)}.`;
  }

  if (product === null) {
    return "No image yet. The Market shows the monogram fallback.";
  }

  if (product.uploadedMediaId !== null) {
    return "This is the current uploaded image.";
  }

  if (product.mediaKey === null) {
    return "No image yet. The Market shows the monogram fallback.";
  }

  return curatedMediaSource(product.mediaKey) !== undefined
    ? `This is the current curated image "${product.mediaKey}".`
    : `Media key "${product.mediaKey}" has no matching local asset; the monogram is shown.`;
}

function removalFallback(product: ProductResponse): string {
  if (product.mediaKey === null) {
    return "the monogram fallback";
  }

  return curatedMediaSource(product.mediaKey) !== undefined
    ? `the curated image "${product.mediaKey}"`
    : `the monogram fallback because media key "${product.mediaKey}" has no matching local asset`;
}
