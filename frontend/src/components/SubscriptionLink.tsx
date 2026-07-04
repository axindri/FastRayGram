import { Link as LinkIcon } from "lucide-react";

type SubscriptionLinkProps = {
  href: string;
  label?: string;
};

export function SubscriptionLink({ href, label = "Ссылка подписки" }: SubscriptionLinkProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
      <LinkIcon className="size-3.5 shrink-0" />
      <span>{label}</span>
    </a>
  );
}
