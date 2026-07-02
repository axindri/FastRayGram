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
import { Label } from "@/components/ui/label";

type ValidationRule = {
  required?: boolean;
  message?: string;
};

type LookupActionFormProps = {
  label: string;
  name: string;
  input: ReactNode;
  loading: boolean;
  onGet: () => void;
  onDelete?: () => void;
  deleteConfirmTitle?: string;
  rules?: ValidationRule[];
  result?: ReactNode;
};

export function LookupActionForm({
  label,
  name,
  input,
  loading,
  onGet,
  onDelete,
  deleteConfirmTitle,
  rules: _rules,
  result,
}: LookupActionFormProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex w-full flex-wrap gap-0 sm:flex-nowrap">
        <div className="min-w-0 flex-1 [&_[data-slot=input]]:rounded-r-none [&_input]:rounded-r-none">{input}</div>
        <Button type="button" variant="outline" className="rounded-l-none shrink-0" disabled={loading} onClick={onGet}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          Получить
        </Button>
        {onDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="rounded-l-none shrink-0 sm:ml-0" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                Удалить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{deleteConfirmTitle ?? "Удалить?"}</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Нет</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Да
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
      {result}
    </div>
  );
}

type CompactFormActionProps = {
  label: string;
  name: string;
  input: ReactNode;
  loading: boolean;
  submitLabel: string;
  rules?: ValidationRule[];
  danger?: boolean;
};

export function CompactFormAction({
  label,
  name,
  input,
  loading,
  submitLabel,
  rules: _rules,
  danger = false,
}: CompactFormActionProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex w-full">
        <div className="min-w-0 flex-1 [&_[data-slot=input]]:rounded-r-none [&_input]:rounded-r-none">{input}</div>
        <Button
          type="submit"
          variant={danger ? "destructive" : "default"}
          className="rounded-l-none shrink-0"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
