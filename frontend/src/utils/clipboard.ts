export type CopyResult = {
  method: "clipboard" | "execCommand" | "share";
};

export type CopySource = HTMLInputElement | HTMLTextAreaElement;

type CopyAttempt = {
  step: string;
  ok: boolean;
  detail?: string;
};

function describeError(error: unknown): string {
  if (error instanceof DOMException) {
    return `DOMException ${error.name}: ${error.message}`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

function buildCopyError(attempts: CopyAttempt[], extra: Record<string, string | number | boolean>): Error {
  const lines = [
    "Не удалось скопировать",
    ...attempts.map((attempt) => `- ${attempt.step}: ${attempt.ok ? "ok" : "fail"}${attempt.detail ? ` (${attempt.detail})` : ""}`),
    ...Object.entries(extra).map(([key, value]) => `- ${key}: ${String(value)}`),
  ];

  if (!window.isSecureContext || window.location.protocol !== "https:") {
    lines.push("- hint: на iPhone Clipboard API доступен только по HTTPS (сейчас HTTP)");
  }

  return new Error(lines.join("\n"));
}

function copyFromSource(source: CopySource): void {
  // iOS Safari over HTTP often allows execCommand only for a real on-screen selection,
  // not for an offscreen temporary textarea.
  source.focus({ preventScroll: true });
  source.select();
  source.setSelectionRange(0, source.value.length);

  if (!document.execCommand("copy")) {
    throw new Error("execCommand('copy') returned false for visible input");
  }
}

function copyWithExecCommand(text: string): void {
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
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("execCommand('copy') returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

async function shareText(text: string): Promise<void> {
  if (!navigator.share) {
    throw new Error("navigator.share отсутствует");
  }

  if (/^https?:\/\//i.test(text)) {
    await navigator.share({ url: text, text });
    return;
  }

  await navigator.share({ text });
}

export async function copyToClipboard(text: string, source?: CopySource | null): Promise<CopyResult> {
  const attempts: CopyAttempt[] = [];
  const env = {
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    hasClipboard: Boolean(navigator.clipboard),
    hasWriteText: Boolean(navigator.clipboard?.writeText),
    hasShare: Boolean(navigator.share),
    hasSource: Boolean(source),
    hasFocus: document.hasFocus(),
    visibility: document.visibilityState,
    textLength: text.length,
    ua: navigator.userAgent.slice(0, 80),
  };

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { method: "clipboard" };
    } catch (error) {
      attempts.push({
        step: "clipboard.writeText",
        ok: false,
        detail: describeError(error),
      });
    }
  } else {
    attempts.push({
      step: "clipboard.writeText",
      ok: false,
      detail: env.hasClipboard ? "writeText отсутствует" : "navigator.clipboard отсутствует",
    });
  }

  if (source) {
    try {
      copyFromSource(source);
      return { method: "execCommand" };
    } catch (error) {
      attempts.push({
        step: "execCommand(visible input)",
        ok: false,
        detail: describeError(error),
      });
    }
  }

  try {
    copyWithExecCommand(text);
    return { method: "execCommand" };
  } catch (error) {
    attempts.push({
      step: "execCommand",
      ok: false,
      detail: describeError(error),
    });
  }

  // iOS over HTTP: Clipboard API is unavailable; Share Sheet still works from a tap.
  try {
    await shareText(text);
    return { method: "share" };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { method: "share" };
    }
    attempts.push({
      step: "navigator.share",
      ok: false,
      detail: describeError(error),
    });
  }

  throw buildCopyError(attempts, env);
}
