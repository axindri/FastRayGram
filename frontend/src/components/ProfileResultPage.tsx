import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ResultStatus = "success" | "error" | "403" | "404" | "500" | "info" | "warning";

type ProfileResultPageProps = {
  status: ResultStatus;
  title: ReactNode;
  subTitle?: ReactNode;
};

const STATUS_CARD_CLASS: Record<ResultStatus, string> = {
  success: "border-green-500/40 bg-green-50/80 dark:border-green-500/30 dark:bg-green-950/30",
  error: "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  "403": "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  "404": "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  "500": "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
  info: "",
  warning: "border-amber-500/40 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-950/30",
};

export function ProfileResultPage({ status, title, subTitle }: ProfileResultPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg justify-center px-4 py-16">
      <Card className={cn("w-full text-center", STATUS_CARD_CLASS[status])}>
        <CardHeader className="items-center">
          <CardTitle className="text-balance text-xl leading-snug">{title}</CardTitle>
          {subTitle ? <CardDescription className="text-balance">{subTitle}</CardDescription> : null}
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link to="/profile">Перейти в профиль</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
