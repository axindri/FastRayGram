import { Copy } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { cn } from "@/lib/utils";

type CopyableInputProps = {
  value: string;
  label?: string;
  highlight?: boolean;
  buttonVariant?: "text" | "icon";
};

export function CopyableInput({ value, label, highlight = false, buttonVariant = "text" }: CopyableInputProps) {
  const copy = useCopyToClipboard();

  const copyButton =
    buttonVariant === "icon" ? (
      <Button type="button" variant="outline" size="icon" className="rounded-l-none" aria-label="Скопировать" onClick={() => copy(value)}>
        <Copy />
      </Button>
    ) : (
      <Button type="button" variant="outline" className="rounded-l-none" onClick={() => copy(value)}>
        Скопировать
      </Button>
    );

  const input = (
    <div className="flex w-full">
      <Input value={value} readOnly className={cn("rounded-r-none text-foreground", highlight && "font-semibold")} />
      <div className="-ml-px shrink-0">{copyButton}</div>
    </div>
  );

  if (!label) {
    return input;
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {input}
    </div>
  );
}

export function CopyableText({ value, children }: { value: string; children: ReactNode }) {
  const copy = useCopyToClipboard();

  return (
    <button type="button" className="cursor-pointer text-left text-sm text-muted-foreground" onClick={() => copy(value)}>
      {children}
    </button>
  );
}
