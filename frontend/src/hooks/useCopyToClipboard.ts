import { App } from "antd";
import { useCallback } from "react";

import { copyToClipboard } from "../utils/clipboard";

export function useCopyToClipboard() {
  const { message } = App.useApp();

  return useCallback(
    (value: string) => {
      void copyToClipboard(value)
        .then(() => message.success("Скопировано"))
        .catch(() => message.error("Не удалось скопировать"));
    },
    [message],
  );
}
