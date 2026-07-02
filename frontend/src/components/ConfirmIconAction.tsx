import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ConfirmIconActionProps = {
  label: string;
  title: string;
  ariaLabel: string;
  icon: ReactNode;
  onConfirm: () => void;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export function ConfirmIconAction({
  label,
  title,
  ariaLabel,
  icon,
  onConfirm,
  destructive = false,
  disabled = false,
  loading = false,
}: ConfirmIconActionProps) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="icon-sm" aria-label={ariaLabel} disabled={disabled || loading}>
              {loading ? <Loader2 className="animate-spin" /> : icon}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Нет</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            Да
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
