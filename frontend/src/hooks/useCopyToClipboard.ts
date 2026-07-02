import { toast } from "sonner";
import { useCallback } from "react";

import { copyToClipboard } from "@/utils/clipboard";

export function useCopyToClipboard() {
  return useCallback((value: string) => {
    void copyToClipboard(value)
      .then(() => toast.success("Скопировано"))
      .catch(() => toast.error("Не удалось скопировать"));
  }, []);
}
