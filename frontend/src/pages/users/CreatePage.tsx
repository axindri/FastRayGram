import { Loader2 } from "lucide-react";

import { CopyableInput } from "@/components/CopyableInput";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FLOW_NONE, FLOW_OPTIONS, MARK_HINT, MARK_MAX_LENGTH, USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/constants";
import type { UserRole } from "@/types";
import { useUsersContext } from "@/pages/users/useUsersContext";

export function UsersCreatePage() {
  const {
    createLoading,
    createdAuthLink,
    createForm,
    setCreateForm,
    createFieldErrors,
    onCreateUser,
    defaultExpiryDays,
    defaultLimitIps,
    roleOptions,
  } = useUsersContext();

  return (
    <SectionCard title="Создать пользователя" hint="Будет создан пользователь и его XUI-клиент">
      <form className="flex flex-col gap-4" onSubmit={onCreateUser}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="create-username">Username</Label>
          <Input
            id="create-username"
            placeholder="Alex"
            maxLength={USERNAME_MAX_LENGTH}
            value={createForm.username}
            aria-invalid={Boolean(createFieldErrors.username)}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
          {createFieldErrors.username ? <p className="text-sm text-destructive">{createFieldErrors.username}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-role">Роль</Label>
          <Select value={createForm.role} onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as UserRole }))}>
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
            value={createForm.mark ?? ""}
            aria-invalid={Boolean(createFieldErrors.mark)}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, mark: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{MARK_HINT}</p>
          {createFieldErrors.mark ? <p className="text-sm text-destructive">{createFieldErrors.mark}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="create-flow">Flow</Label>
          <Select
            value={createForm.flow || FLOW_NONE}
            onValueChange={(value) =>
              setCreateForm((prev) => ({
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
              value={createForm.limit_ips ?? ""}
              onChange={(event) =>
                setCreateForm((prev) => ({
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
              value={createForm.total_gb ?? ""}
              onChange={(event) =>
                setCreateForm((prev) => ({
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
              value={createForm.expiry_time_days ?? ""}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  expiry_time_days: event.target.value === "" ? undefined : Number(event.target.value),
                }))
              }
            />
          </div>
        </div>

        <Button type="submit" disabled={createLoading}>
          {createLoading ? <Loader2 className="animate-spin" /> : null}
          Создать
        </Button>
      </form>

      {createdAuthLink ? <CopyableInput label="Ссылка для входа" value={createdAuthLink} /> : null}
    </SectionCard>
  );
}
