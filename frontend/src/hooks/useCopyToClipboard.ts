import { toast } from "sonner";
import { useCallback } from "react";

import { copyToClipboard, type CopySource } from "@/utils/clipboard";

export function useCopyToClipboard() {
  return useCallback((value: string, source?: CopySource | null) => {
    void copyToClipboard(value, source)
      .then((result) => {
        if (result.method === "share") {
          toast.success("Открыт системный шаринг — можно скопировать оттуда");
          return;
        }
        toast.success("Скопировано");
      })
      .catch(() => toast.error("Не удалось скопировать"));
  }, []);
}
