import { WifiOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ListEmptyState } from "@/components/ListEmptyState";

type SubscriptionNotFoundProps = {
  className?: string;
  minHeight?: number;
  embedded?: boolean;
};

export function SubscriptionNotFound({ className, minHeight = 120, embedded = false }: SubscriptionNotFoundProps) {
  const state = (
    <ListEmptyState icon={WifiOff} title="Подписка не найдена" minHeight={minHeight} className={className} />
  );

  if (embedded) {
    return state;
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardContent>{state}</CardContent>
    </Card>
  );
}
