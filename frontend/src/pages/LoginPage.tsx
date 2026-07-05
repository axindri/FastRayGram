import { AlertCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState(() => (location.state as { error?: string } | null)?.error ?? "");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token.trim()) {
      setFieldError("Введите токен");
      return;
    }

    setFieldError("");
    setLoading(true);
    setError("");

    try {
      await login(token.trim());
      navigate("/profile", { replace: true });
    } catch {
      setError("Неверный токен");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-8 pt-16">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/frg_dark.png" alt="" aria-hidden className="h-12 dark:hidden" />
        <img src="/frg_light_on_dark.png" alt="" aria-hidden className="hidden h-12 dark:block" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fast Ray Gram</h1>
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Войти</CardTitle>
          <CardDescription>Вставьте токен, который вы получили при регистрации</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="token">Токен</Label>
              <Input id="token" type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} aria-invalid={Boolean(fieldError)} />
              {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Вход…" : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <ThemeToggle block />
      </div>
    </main>
  );
}
