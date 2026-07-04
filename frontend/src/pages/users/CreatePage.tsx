import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { buildAuthLink, createUser, fetchConfig } from "@/api";
import { useAuth } from "@/auth";
import { CopyableInput } from "@/components/CopyableInput";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FLOW_NONE, FLOW_OPTIONS, MARK_HINT, MARK_MAX_LENGTH, USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/constants";
import type { UserRole } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { getAssignableRoleOptions, validateCreateUser, type CreateUserFieldErrors, type CreateUserForm } from "@/utils/username";

export function UsersCreatePage() {
  const { user: currentUser } = useAuth();
  const roleOptions = getAssignableRoleOptions(currentUser?.role);

  const [defaultExpiryDays, setDefaultExpiryDays] = useState(30);
  const [defaultLimitIps, setDefaultLimitIps] = useState(5);
  const [loading, setLoading] = useState(false);
  const [authLink, setAuthLink] = useState("");
  const [form, setForm] = useState<CreateUserForm>({ username: "", role: "user", limit_ips: 5 });
  const [fieldErrors, setFieldErrors] = useState<CreateUserFieldErrors>({});

  useEffect(() => {
    fetchConfig()
      .then((config) => {
        setDefaultExpiryDays(config.default_expiry_time_days);
        setDefaultLimitIps(config.default_limit_ips);
        setForm((prev) => ({
          ...prev,
          expiry_time_days: config.default_expiry_time_days,
          limit_ips: config.default_limit_ips,
        }));
      })
      .catch(() => undefined);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateCreateUser(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    setAuthLink("");

    try {
      const token = await createUser({
        ...form,
        username: form.username.trim(),
        mark: form.mark || "",
        flow: form.flow || "",
        limit_ips: form.limit_ips ?? defaultLimitIps,
        total_gb: form.total_gb ?? 0,
        expiry_time_days: form.expiry_time_days ?? defaultExpiryDays,
        enable: true,
      });
      setAuthLink(buildAuthLink(token));
      toast.success("Пользователь создан");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось создать пользователя"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Создать пользователя" hint="Будет создан пользователь и его XUI-клиент">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="create-username">Username</Label>
          <Input
            id="create-username"
            placeholder="Alex"
            maxLength={USERNAME_MAX_LENGTH}
            value={form.username}
            aria-invalid={Boolean(fieldErrors.username)}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
          {fieldErrors.username ? <p className="text-sm text-destructive">{fieldErrors.username}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-role">Роль</Label>
          <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as UserRole }))}>
            <SelectTrigger id="create-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-mark">Заметка</Label>
          <Input
            id="create-mark"
            placeholder="Заметка или комментарий"
            maxLength={MARK_MAX_LENGTH}
            value={form.mark ?? ""}
            aria-invalid={Boolean(fieldErrors.mark)}
            onChange={(event) => setForm((prev) => ({ ...prev, mark: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{MARK_HINT}</p>
          {fieldErrors.mark ? <p className="text-sm text-destructive">{fieldErrors.mark}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-flow">Flow</Label>
          <Select
            value={form.flow || FLOW_NONE}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                flow: value === FLOW_NONE ? "" : value,
              }))
            }
          >
            <SelectTrigger id="create-flow" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLOW_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-limit-ips">Лимит IP</Label>
            <Input
              id="create-limit-ips"
              type="number"
              placeholder={String(defaultLimitIps)}
              value={form.limit_ips ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  limit_ips: event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-total-gb">Объем трафика</Label>
            <Input
              id="create-total-gb"
              type="number"
              placeholder="0"
              value={form.total_gb ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  total_gb: event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-expiry">Срок действия</Label>
            <Input
              id="create-expiry"
              type="number"
              placeholder={String(defaultExpiryDays)}
              value={form.expiry_time_days ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  expiry_time_days: event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
            />
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          Создать
        </Button>
      </form>

      {authLink ? <CopyableInput label="Ссылка для входа" value={authLink} /> : null}
    </SectionCard>
  );
}
