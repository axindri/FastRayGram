import type { ReactNode } from "react";

import { PageShell } from "@/components/PageShell";

type AdminPageLayoutProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function AdminPageLayout({ title, description, action, children }: AdminPageLayoutProps) {
  return (
    <PageShell title={title} description={description} action={action}>
      <div className="flex w-full flex-col gap-6">{children}</div>
    </PageShell>
  );
}

export function AdminPageColumn({ children }: { children: ReactNode; span?: number }) {
  return <div className="min-w-0">{children}</div>;
}
