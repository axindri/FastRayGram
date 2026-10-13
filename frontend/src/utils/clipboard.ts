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
  return new Error(lines.join("\n"));
}

function copyWithExecCommand(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("execCommand('copy') returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  const attempts: CopyAttempt[] = [];
  const env = {
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    hasClipboard: Boolean(navigator.clipboard),
    hasWriteText: Boolean(navigator.clipboard?.writeText),
    hasFocus: document.hasFocus(),
    visibility: document.visibilityState,
    textLength: text.length,
    ua: navigator.userAgent.slice(0, 80),
  };

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
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

  try {
    copyWithExecCommand(text);
    return;
  } catch (error) {
    attempts.push({
      step: "execCommand",
      ok: false,
      detail: describeError(error),
    });
  }

  throw buildCopyError(attempts, env);
}
