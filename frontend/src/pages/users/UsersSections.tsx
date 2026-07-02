import { Loader2, RefreshCw, Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CopyableInput } from "@/components/CopyableInput";
import { LookupActionForm } from "@/components/LookupActionForm";
import { PaginatedList } from "@/components/PaginatedList";
import { SectionCard } from "@/components/SectionCard";
import { SubscriptionNotFound } from "@/components/SubscriptionNotFound";
import { UserCard } from "@/components/UserCard";
import { XuiClientCard } from "@/components/XuiClientCard";
import { MARK_HINT, MARK_MAX_LENGTH } from "@/utils/mark";
import { USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/utils/username";
import type { UserRole } from "@/types";

import type { UsersAdminContext } from "@/pages/users/useUsersAdmin";

const FLOW_NONE = "__none__";

const FLOW_OPTIONS = [
  { value: FLOW_NONE, label: "Пусто" },
  { value: "xtls-rprx-vision", label: "xtls-rprx-vision" },
] as const;

function useUsersContext() {
  return useOutletContext<UsersAdminContext>();
}

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

export function UsersAllPage() {
  const {
    allUsers,
    allUsersLoading,
    loadAllUsers,
    usersSearchInput,
    setUsersSearchInput,
    onUsersSearch,
    roleOptions,
    actionUserId,
    setDetailUser,
    onDeleteUser,
    onRefreshUserLink,
    onUpdateUserRole,
  } = useUsersContext();

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Все пользователи"
        extra={
          <Button type="button" variant="outline" size="sm" disabled={allUsersLoading} onClick={() => void loadAllUsers(allUsers.page)}>
            {allUsersLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Обновить
          </Button>
        }
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full">
            <Input
              value={usersSearchInput}
              placeholder="Поиск по имени пользователя"
              maxLength={USERNAME_MAX_LENGTH}
              className="rounded-r-none"
              onChange={(event) => {
                const next = event.target.value;
                setUsersSearchInput(next);
                if (!next) {
                  onUsersSearch("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onUsersSearch(usersSearchInput);
                }
              }}
            />
            <Button type="button" variant="outline" className="rounded-l-none shrink-0" onClick={() => onUsersSearch(usersSearchInput)}>
              <Search />
            </Button>
          </div>

          <PaginatedList
            page={allUsers.page}
            pages={allUsers.pages}
            total={allUsers.total}
            loading={allUsersLoading}
            empty={!allUsers.items.length}
            emptyDescription="Пользователей нет"
            onPageChange={(page) => void loadAllUsers(page)}
          >
            {allUsers.items.map((item) => (
              <UserCard
                key={item.id}
                user={item}
                roleOptions={roleOptions}
                actionUserId={actionUserId}
                onView={setDetailUser}
                onDelete={onDeleteUser}
                onRefreshLink={onRefreshUserLink}
                onUpdateRole={onUpdateUserRole}
              />
            ))}
          </PaginatedList>
        </div>
      </SectionCard>
    </div>
  );
}

export function UsersXuiPage() {
  const {
    xuiEmail,
    setXuiEmail,
    xuiEmailError,
    xuiGetLoading,
    xuiClient,
    xuiSearchAttempted,
    defaultExpiryDays,
    xuiActionLoading,
    onFetchXuiClient,
    onUpdateXuiClient,
    onResetXuiTraffic,
    onDeleteXuiClient,
  } = useUsersContext();

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="XUI клиент" hint="Поиск клиента по username и управление подпиской">
        <LookupActionForm
          label="Username"
          name="email"
          input={
            <Input
              id="email"
              placeholder="Alex"
              value={xuiEmail}
              aria-invalid={Boolean(xuiEmailError)}
              onChange={(event) => setXuiEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onFetchXuiClient();
                }
              }}
            />
          }
          loading={xuiGetLoading}
          onGet={() => void onFetchXuiClient()}
          rules={[{ required: true, message: "Введите имя пользователя" }]}
          result={
            <>
              {xuiEmailError ? <p className="text-sm text-destructive">{xuiEmailError}</p> : null}
              {xuiClient ? (
                <div className="mt-4">
                  <XuiClientCard
                    client={xuiClient}
                    access="user"
                    defaultExpiryDays={defaultExpiryDays}
                    actionLoading={xuiActionLoading}
                    onUpdate={onUpdateXuiClient}
                    onResetTraffic={onResetXuiTraffic}
                    onDelete={onDeleteXuiClient}
                  />
                </div>
              ) : xuiSearchAttempted && !xuiGetLoading ? (
                <div className="mt-4">
                  <SubscriptionNotFound embedded />
                </div>
              ) : null}
            </>
          }
        />
      </SectionCard>
    </div>
  );
}
