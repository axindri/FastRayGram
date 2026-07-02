import type { ReactNode } from "react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SectionCardProps = {
  title: ReactNode;
  hint?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, hint, extra, children }: SectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hint ? (
          typeof hint === "string" ? (
            <CardDescription>{hint}</CardDescription>
          ) : (
            <div className="col-span-2 text-sm text-muted-foreground">{hint}</div>
          )
        ) : null}
        {extra ? <CardAction>{extra}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
