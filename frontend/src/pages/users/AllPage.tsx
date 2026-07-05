import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { buildAuthLink, deleteUser, fetchUserStats, fetchUsers, refreshUserToken, updateUserMark, updateUserRole, type UserListFilters } from "@/api";
import { useAuth } from "@/auth";
import { PaginatedList } from "@/components/PaginatedList";
import { SearchInputGroup } from "@/components/SearchInputGroup";
import { UserCard } from "@/components/UserCard";
import { UserDetailModal } from "@/components/UserDetailModal";
import { UserStatsSummary } from "@/components/UserStatsSummary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, USERNAME_MAX_LENGTH, USER_SEARCH_FIELD_LABELS, type UserSearchField } from "@/constants";
import type { AdminUser, Paginated, UserRole, UserStats } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyPaginated } from "@/utils/pagination";
import { getAssignableRoleOptions } from "@/utils/username";

const ROLE_SEARCH_OPTIONS: UserRole[] = ["user", "admin", "superuser"];

export function UsersAllPage() {
  const { user: currentUser } = useAuth();
  const roleOptions = getAssignableRoleOptions(currentUser?.role);

  const [users, setUsers] = useState<Paginated<AdminUser>>(emptyPaginated);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchField, setSearchField] = useState<UserSearchField>("username");
  const [searchValue, setSearchValue] = useState("");
  const [roleSearch, setRoleSearch] = useState<UserRole>("user");
  const [userFilters, setUserFilters] = useState<UserListFilters>({});
  const userFiltersRef = useRef(userFilters);
  userFiltersRef.current = userFilters;

  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      setStats(await fetchUserStats());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось загрузить статистику пользователей"));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(
    async (page: number, filters?: UserListFilters) => {
      const query = filters ?? userFiltersRef.current;
      setLoading(true);

      try {
        setUsers(await fetchUsers(page, users.limit, Object.keys(query).length ? query : undefined));
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось загрузить пользователей"));
      } finally {
        setLoading(false);
      }
    },
    [users.limit],
  );

  useEffect(() => {
    void loadUsers(1);
    void loadStats();
  }, [loadUsers, loadStats]);

  const refreshPage = useCallback(
    async (page: number, filters?: UserListFilters) => {
      await Promise.all([loadUsers(page, filters), loadStats()]);
    },
    [loadUsers, loadStats],
  );

  const onSearch = (value: string) => {
    if (searchField === "role") {
      const filters: UserListFilters = { role: roleSearch };
      setSearchValue("");
      setUserFilters(filters);
      void loadUsers(1, filters);
      return;
    }

    const trimmed = value.trim();
    setSearchValue(value);

    if (!trimmed) {
      setUserFilters({});
      void loadUsers(1, {});
      return;
    }

    if (searchField === "username") {
      const filters: UserListFilters = { search: trimmed };
      setUserFilters(filters);
      void loadUsers(1, filters);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast.warning("Введите целое число больше 0");
      return;
    }

    const filters: UserListFilters = { user_id: parsed };
    setUserFilters(filters);
    void loadUsers(1, filters);
  };

  const onDeleteUser = async (id: number) => {
    setActionUserId(id);

    try {
      await deleteUser(id);
      toast.success("Пользователь удалён");
      await refreshPage(users.page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось удалить пользователя"));
    } finally {
      setActionUserId(null);
    }
  };

  const onRefreshUserLink = async (id: number) => {
    setActionUserId(id);

    try {
      const link = buildAuthLink(await refreshUserToken(id));
      toast.success("Ссылка для входа обновлена");
      return link;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось получить ссылку"));
      throw error;
    } finally {
      setActionUserId(null);
    }
  };

  const onUpdateUserRole = async (id: number, role: "user" | "admin") => {
    setActionUserId(id);

    try {
      const result = await updateUserRole(id, role);
      toast.success("Роль обновлена");
      await refreshPage(users.page);
      return {
        user: result.user,
        authLink: buildAuthLink(result.token),
      };
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить роль"));
      throw error;
    } finally {
      setActionUserId(null);
    }
  };

  const onUpdateUserMark = async (id: number, mark: string) => {
    setActionUserId(id);

    try {
      await updateUserMark(id, mark);
      toast.success("Заметка обновлена");
      await loadUsers(users.page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить заметку"));
      throw error;
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <UserStatsSummary stats={stats} loading={statsLoading} />

      <SearchInputGroup
        value={searchValue}
        placeholder="Поиск"
        maxLength={searchField === "username" ? USERNAME_MAX_LENGTH : undefined}
        loading={loading}
        leading={
          <Select
            value={searchField}
            onValueChange={(value) => {
              const field = value as UserSearchField;
              setSearchField(field);
              setSearchValue("");
              if (field !== "role") {
                setUserFilters({});
                void loadUsers(1, {});
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[168px] sm:rounded-r-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(USER_SEARCH_FIELD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onChange={(next) => {
          setSearchValue(next);
          if (!next && searchField !== "role") {
            onSearch("");
          }
        }}
        onSearch={() => (searchField === "role" ? onSearch("") : onSearch(searchValue))}
        onRefresh={() => void refreshPage(users.page)}
      />

      {searchField === "role" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleSearch} onValueChange={(value) => setRoleSearch(value as UserRole)}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_SEARCH_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <PaginatedList
        page={users.page}
        pages={users.pages}
        total={users.total}
        loading={loading}
        empty={!users.items.length}
        emptyDescription="Пользователей нет"
        entity="польз."
        onPageChange={(page) => void loadUsers(page)}
      >
        {users.items.map((item) => (
          <UserCard
            key={item.id}
            user={item}
            roleOptions={roleOptions}
            actionUserId={actionUserId}
            onView={setDetailUser}
            onDelete={onDeleteUser}
            onRefreshLink={onRefreshUserLink}
            onUpdateRole={onUpdateUserRole}
            onUpdateMark={onUpdateUserMark}
          />
        ))}
      </PaginatedList>

      <UserDetailModal open={detailUser !== null} user={detailUser} onClose={() => setDetailUser(null)} />
    </div>
  );
}
