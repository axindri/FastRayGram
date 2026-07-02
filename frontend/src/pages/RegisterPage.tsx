import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { buildAuthLink, registerUser, validateRegistrationCode } from "@/api";
import { useAuth } from "@/auth";
import { HintTooltip } from "@/components/HintTooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getApiErrorMessage } from "@/utils/apiError";
import { MARK_HINT, MARK_MAX_LENGTH } from "@/utils/mark";
import { USERNAME_HINT, USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/utils/username";

type FieldErrors = {
  username?: string;
  mark?: string;
};

function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Введите username";
  }
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return `Не более ${USERNAME_MAX_LENGTH} символов`;
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return "Только латинские буквы и цифры";
  }
  return undefined;
}

function validateMark(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Укажите контакт для связи";
  }
  if (trimmed.length > MARK_MAX_LENGTH) {
    return `Не более ${MARK_MAX_LENGTH} символов`;
  }
  return undefined;
}

export function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code")?.trim() || "";

  const [validating, setValidating] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [registrationExpiryDays, setRegistrationExpiryDays] = useState(3);
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [mark, setMark] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (user) {
      navigate("/profile", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!code) {
      setValidating(false);
      setCodeValid(false);
      setValidationError("Недействительная ссылка для регистрации");
      return;
    }

    let cancelled = false;

    void (async () => {
      setValidating(true);
      setValidationError("");

      try {
        const result = await validateRegistrationCode(code);
        if (cancelled) {
          return;
        }

        setCodeValid(result.valid);
        setRegistrationExpiryDays(result.registration_expiry_days);
        if (!result.valid) {
          setValidationError("Код регистрации недействителен или истёк");
        }
      } catch (error) {
        if (!cancelled) {
          setCodeValid(false);
          setValidationError(getApiErrorMessage(error, "Не удалось проверить код регистрации"));
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!codeValid) {
      return;
    }

    const nextFieldErrors: FieldErrors = {
      username: validateUsername(username),
      mark: validateMark(mark),
    };

    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.username || nextFieldErrors.mark) {
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const token = await registerUser({
        code,
        username: username.trim(),
        mark: mark.trim(),
      });
      window.location.replace(buildAuthLink(token));
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Не удалось зарегистрироваться"));
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-8 pt-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Регистрация</h1>
        <p className="text-sm text-muted-foreground">Создание аккаунта по коду приглашения</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Новый пользователь</CardTitle>
          <CardDescription>Заполните данные для входа в сервис</CardDescription>
        </CardHeader>
        <CardContent>
          {validating ? (
            <div className="grid min-h-[120px] place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !codeValid ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Регистрация недоступна</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <p className="text-sm text-muted-foreground">Заполните данные для создания аккаунта</p>

              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Alex"
                  autoComplete="username"
                  maxLength={USERNAME_MAX_LENGTH}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.username)}
                />
                <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
                {fieldErrors.username ? <p className="text-sm text-destructive">{fieldErrors.username}</p> : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="mark" className="inline-flex items-center gap-1">
                  Контакт для связи
                  <HintTooltip title="Укажите Telegram или e-mail, по которому с вами можно связаться. Номер телефона указывать не нужно." />
                </Label>
                <Input
                  id="mark"
                  placeholder="@username или name@example.com"
                  autoComplete="email"
                  maxLength={MARK_MAX_LENGTH}
                  value={mark}
                  onChange={(event) => setMark(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.mark)}
                />
                <p className="text-xs text-muted-foreground">{MARK_HINT}</p>
                {fieldErrors.mark ? <p className="text-sm text-destructive">{fieldErrors.mark}</p> : null}
              </div>

              <p className="text-sm text-muted-foreground">
                {`После регистрации подписка будет активна ${registrationExpiryDays} дн.`}
              </p>
              <p className="text-sm text-muted-foreground">
                После входа ссылку для повторного входа можно скопировать в профиле.
              </p>

              {submitError ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>{submitError}</AlertTitle>
                </Alert>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Регистрация…" : "Зарегистрироваться"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <ThemeToggle block />
      </div>
    </main>
  );
}
