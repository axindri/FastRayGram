export type CopyResult = {
  method: "clipboard" | "execCommand" | "share";
};

export type CopySource = HTMLInputElement | HTMLTextAreaElement;

function copyFromSource(source: CopySource): void {
  // iOS Safari over HTTP: execCommand works for a real on-screen selection.
  source.focus({ preventScroll: true });
  source.select();
  source.setSelectionRange(0, source.value.length);

  if (!document.execCommand("copy")) {
    throw new Error("execCommand copy failed");
  }
}

function copyWithTempInput(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    copyFromSource(textarea);
  } finally {
    document.body.removeChild(textarea);
  }
}

async function shareText(text: string): Promise<void> {
  if (!navigator.share) {
    throw new Error("share unavailable");
  }

  if (/^https?:\/\//i.test(text)) {
    await navigator.share({ url: text, text });
    return;
  }

  await navigator.share({ text });
}

export async function copyToClipboard(text: string, source?: CopySource | null): Promise<CopyResult> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { method: "clipboard" };
    } catch {
      // Fall through to legacy paths.
    }
  }

  if (source) {
    try {
      copyFromSource(source);
      return { method: "execCommand" };
    } catch {
      // Fall through.
    }
  }

  try {
    copyWithTempInput(text);
    return { method: "execCommand" };
  } catch {
    // Fall through to share on mobile HTTP.
  }

  try {
    await shareText(text);
    return { method: "share" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { method: "share" };
    }
    throw new Error("Не удалось скопировать");
  }
}
