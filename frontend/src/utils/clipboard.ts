function copyWithExecCommand(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  // iOS Safari: keep the node in-viewport and selectable during the user gesture.
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.padding = "0";
  textarea.style.border = "none";
  textarea.style.outline = "none";
  textarea.style.boxShadow = "none";
  textarea.style.background = "transparent";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  const selection = window.getSelection();
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("copy failed");
    }
  } finally {
    document.body.removeChild(textarea);
    if (selection) {
      selection.removeAllRanges();
      if (selectedRange) {
        selection.addRange(selectedRange);
      }
    }
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  // Prefer a synchronous copy path so callers inside closing menus / dropdowns
  // (mobile Safari) still count as a user gesture. Clipboard API is often rejected
  // after Radix DropdownMenu moves focus away on select.
  try {
    copyWithExecCommand(text);
    return;
  } catch {
    // Fall through when execCommand is unavailable or blocked.
  }

  if (!navigator.clipboard?.writeText || !window.isSecureContext) {
    throw new Error("copy failed");
  }

  await navigator.clipboard.writeText(text);
}
