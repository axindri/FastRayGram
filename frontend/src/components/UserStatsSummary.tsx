import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserStats } from "@/types";

type UserStatsSummaryProps = {
  stats: UserStats | null;
  loading?: boolean;
};

type StatItemProps = {
  label: string;
  value: number | null;
  loading?: boolean;
};

function StatItem({ label, value, loading = false }: StatItemProps) {
  return (
    <p className="text-sm text-muted-foreground">
      {label}: <span className="font-semibold text-foreground">{loading || value === null ? "—" : value}</span>
    </p>
  );
}

export function UserStatsSummary({ stats, loading = false }: UserStatsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика</CardTitle>
      </CardHeader>
      <CardContent className="grid">
        <StatItem label="Всего на сервере" value={stats?.total ?? null} loading={loading} />
        <StatItem label="Пользователей" value={stats?.users ?? null} loading={loading} />
        <StatItem label="Администраторов" value={stats?.admins ?? null} loading={loading} />
      </CardContent>
    </Card>
  );
}
