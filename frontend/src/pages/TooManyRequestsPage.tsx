import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RATE_LIMIT_RETURN_KEY, RATE_LIMIT_RETRY_MS } from "@/constants";

function formatCountdown(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TooManyRequestsPage() {
  const navigate = useNavigate();
  const [endsAt] = useState(() => Date.now() + RATE_LIMIT_RETRY_MS);
  const [remainingMs, setRemainingMs] = useState(RATE_LIMIT_RETRY_MS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = endsAt - Date.now();
      setRemainingMs(next);

      if (next <= 0) {
        window.clearInterval(timer);
        const returnPath = sessionStorage.getItem(RATE_LIMIT_RETURN_KEY) || "/profile";
        sessionStorage.removeItem(RATE_LIMIT_RETURN_KEY);
        navigate(returnPath, { replace: true });
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [endsAt, navigate]);

  const goBack = () => {
    const returnPath = sessionStorage.getItem(RATE_LIMIT_RETURN_KEY) || "/profile";
    sessionStorage.removeItem(RATE_LIMIT_RETURN_KEY);
    navigate(returnPath, { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-4 py-16">
      <Card className="w-full border-amber-500/40 bg-amber-50/80 text-center dark:border-amber-500/30 dark:bg-amber-950/30">
        <CardHeader className="items-center">
          <CardTitle className="text-balance text-xl leading-snug">Слишком много запросов</CardTitle>
          <CardDescription className="text-balance">Превышен лимит обращений к API. Спустя 1 минуту страница откроется автоматически.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button type="button" variant="outline" disabled={remainingMs > 0} onClick={goBack}>
            {remainingMs > 0 ? `Подождите ${formatCountdown(remainingMs)}` : "Вернуться"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
