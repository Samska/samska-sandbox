import { useEffect, useState } from "react";

export default function useFilePreview(file: File | null): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file === null) {
      setPreviewUrl(null);
      return;
    }

    let isCancelled = false;
    const reader = new FileReader();

    reader.onload = () => {
      if (!isCancelled && typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    return () => {
      isCancelled = true;
    };
  }, [file]);

  return previewUrl;
}
