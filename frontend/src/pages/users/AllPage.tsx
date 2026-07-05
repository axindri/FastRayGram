import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { buildAuthLink, deleteUser, fetchUserStats, fetchUsers, refreshUserToken, updateUserRole } from "@/api";
import { useAuth } from "@/auth";
import { PaginatedList } from "@/components/PaginatedList";
import { SearchInputGroup } from "@/components/SearchInputGroup";
import { UserCard } from "@/components/UserCard";
import { UserDetailModal } from "@/components/UserDetailModal";
import { UserStatsSummary } from "@/components/UserStatsSummary";
import { USERNAME_MAX_LENGTH } from "@/constants";
import type { AdminUser, Paginated, UserStats } from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";
import { emptyPaginated } from "@/utils/pagination";
import { getAssignableRoleOptions } from "@/utils/username";

export function UsersAllPage() {
  const { user: currentUser } = useAuth();
  const roleOptions = getAssignableRoleOptions(currentUser?.role);

  const [users, setUsers] = useState<Paginated<AdminUser>>(emptyPaginated);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef(search);
  searchRef.current = search;

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
    async (page: number, query?: string) => {
      setLoading(true);

      try {
        setUsers(await fetchUsers(page, users.limit, query ?? searchRef.current));
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
    async (page: number, query?: string) => {
      await Promise.all([loadUsers(page, query), loadStats()]);
    },
    [loadUsers, loadStats],
  );

  const onSearch = (value: string) => {
    const query = value.trim();
    setSearch(query);
    setSearchInput(value);
    void loadUsers(1, query);
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

  return (
    <div className="flex w-full flex-col gap-4">
      <UserStatsSummary stats={stats} loading={statsLoading} />

      <SearchInputGroup
        value={searchInput}
        placeholder="Поиск по имени пользователя"
        maxLength={USERNAME_MAX_LENGTH}
        loading={loading}
        onChange={(next) => {
          setSearchInput(next);
          if (!next) {
            onSearch("");
          }
        }}
        onSearch={() => onSearch(searchInput)}
        onRefresh={() => void refreshPage(users.page)}
      />

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
          />
        ))}
      </PaginatedList>

      <UserDetailModal open={detailUser !== null} user={detailUser} onClose={() => setDetailUser(null)} />
    </div>
  );
}
