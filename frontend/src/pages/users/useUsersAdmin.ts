import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  ApiError,
  buildAuthLink,
  createUser,
  deleteUser,
  deleteXuiClient,
  fetchConfig,
  fetchUsers,
  fetchXuiClient,
  refreshUserToken,
  resetXuiClientTraffic,
  updateUserRole,
  updateXuiClient,
} from "@/api";
import { useAuth } from "@/auth";
import { getApiErrorMessage } from "@/utils/apiError";
import { MARK_MAX_LENGTH } from "@/utils/mark";
import { emptyPaginated } from "@/utils/pagination";
import { USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/utils/username";
import { ROLE_LABELS, type AdminUser, type Paginated, type UserRole } from "@/types";

export type CreateUserForm = {
  username: string;
  role: UserRole;
  mark?: string;
  flow?: string;
  limit_ips?: number;
  total_gb?: number;
  expiry_time_days?: number;
};

export type CreateUserFieldErrors = Partial<Record<"username" | "mark", string>>;

export function validateCreateUser(values: CreateUserForm): CreateUserFieldErrors {
  const errors: CreateUserFieldErrors = {};
  const username = values.username.trim();

  if (!username) {
    errors.username = "Введите username";
  } else if (username.length > USERNAME_MAX_LENGTH) {
    errors.username = `Не более ${USERNAME_MAX_LENGTH} символов`;
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Только латинские буквы и цифры";
  }

  if (values.mark && values.mark.length > MARK_MAX_LENGTH) {
    errors.mark = `Не более ${MARK_MAX_LENGTH} символов`;
  }

  return errors;
}

export function useUsersAdmin() {
  const { user: currentUser } = useAuth();
  const [defaultExpiryDays, setDefaultExpiryDays] = useState(30);
  const [defaultLimitIps, setDefaultLimitIps] = useState(5);

  const [createLoading, setCreateLoading] = useState(false);
  const [createdAuthLink, setCreatedAuthLink] = useState("");
  const [createForm, setCreateForm] = useState<CreateUserForm>({ username: "", role: "user", limit_ips: 5 });
  const [createFieldErrors, setCreateFieldErrors] = useState<CreateUserFieldErrors>({});

  const [xuiGetLoading, setXuiGetLoading] = useState(false);
  const [xuiActionLoading, setXuiActionLoading] = useState(false);
  const [xuiClient, setXuiClient] = useState<Awaited<ReturnType<typeof fetchXuiClient>> | null>(null);
  const [xuiEmail, setXuiEmail] = useState("");
  const [xuiEmailError, setXuiEmailError] = useState("");
  const [xuiSearchAttempted, setXuiSearchAttempted] = useState(false);

  const [allUsers, setAllUsers] = useState<Paginated<AdminUser>>(emptyPaginated);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersSearchInput, setUsersSearchInput] = useState("");
  const usersSearchRef = useRef(usersSearch);
  usersSearchRef.current = usersSearch;
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  const loadAllUsers = useCallback(
    async (page: number, search?: string) => {
      const query = search ?? usersSearchRef.current;
      setAllUsersLoading(true);

      try {
        setAllUsers(await fetchUsers(page, allUsers.limit, query));
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось загрузить пользователей"));
      } finally {
        setAllUsersLoading(false);
      }
    },
    [allUsers.limit],
  );

  useEffect(() => {
    void loadAllUsers(1);
  }, [loadAllUsers]);

  const roleOptions = useMemo(() => {
    if (currentUser?.role === "superuser") {
      return [
        { value: "user" as const, label: ROLE_LABELS.user },
        { value: "admin" as const, label: ROLE_LABELS.admin },
      ];
    }
    return [{ value: "user" as const, label: ROLE_LABELS.user }];
  }, [currentUser?.role]);

  useEffect(() => {
    fetchConfig()
      .then((config) => {
        setDefaultExpiryDays(config.default_expiry_time_days);
        setDefaultLimitIps(config.default_limit_ips);
        setCreateForm((prev) => ({
          ...prev,
          expiry_time_days: config.default_expiry_time_days,
          limit_ips: config.default_limit_ips,
        }));
      })
      .catch(() => undefined);
  }, []);

  const onCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateCreateUser(createForm);
    setCreateFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setCreateLoading(true);
    setCreatedAuthLink("");

    try {
      const token = await createUser({
        ...createForm,
        username: createForm.username.trim(),
        mark: createForm.mark || "",
        flow: createForm.flow || "",
        limit_ips: createForm.limit_ips ?? defaultLimitIps,
        total_gb: createForm.total_gb ?? 0,
        expiry_time_days: createForm.expiry_time_days ?? defaultExpiryDays,
        enable: true,
      });
      setCreatedAuthLink(buildAuthLink(token));
      toast.success("Пользователь создан");
      await loadAllUsers(1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось создать пользователя"));
    } finally {
      setCreateLoading(false);
    }
  };

  const onDeleteUser = async (id: number) => {
    setActionUserId(id);

    try {
      await deleteUser(id);
      toast.success("Пользователь удалён");
      await loadAllUsers(allUsers.page);
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
      await loadAllUsers(allUsers.page);
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

  const reloadXuiClient = async (email: string) => {
    setXuiClient(await fetchXuiClient(email));
  };

  const onFetchXuiClient = async () => {
    const email = xuiEmail.trim();
    if (!email) {
      setXuiEmailError("Введите имя пользователя");
      return;
    }

    setXuiEmailError("");
    setXuiGetLoading(true);
    setXuiClient(null);
    setXuiSearchAttempted(false);

    try {
      await reloadXuiClient(email);
      setXuiSearchAttempted(true);
    } catch (error) {
      setXuiClient(null);
      setXuiSearchAttempted(true);
      if (!(error instanceof ApiError && (error.status === 404 || error.status === 400))) {
        toast.error(getApiErrorMessage(error, "Не удалось получить подписку"));
      }
    } finally {
      setXuiGetLoading(false);
    }
  };

  const onDeleteXuiClient = async (email: string) => {
    setXuiActionLoading(true);

    try {
      await deleteXuiClient(email);
      setXuiClient(null);
      toast.success("Клиент удалён");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось удалить клиента"));
    } finally {
      setXuiActionLoading(false);
    }
  };

  const onUpdateXuiClient = async (email: string, payload: { expiry_time_days: number; enable: boolean }) => {
    setXuiActionLoading(true);

    try {
      await updateXuiClient(email, payload);
      await reloadXuiClient(email);
      toast.success("Клиент обновлён");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось обновить клиента"));
      throw error;
    } finally {
      setXuiActionLoading(false);
    }
  };

  const onResetXuiTraffic = async (email: string) => {
    setXuiActionLoading(true);

    try {
      await resetXuiClientTraffic(email);
      await reloadXuiClient(email);
      toast.success("Трафик сброшен");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось сбросить трафик"));
    } finally {
      setXuiActionLoading(false);
    }
  };

  const onUsersSearch = (value: string) => {
    const query = value.trim();
    setUsersSearch(query);
    setUsersSearchInput(value);
    void loadAllUsers(1, query);
  };

  return {
    defaultExpiryDays,
    defaultLimitIps,
    createLoading,
    createdAuthLink,
    createForm,
    setCreateForm,
    createFieldErrors,
    onCreateUser,
    xuiGetLoading,
    xuiActionLoading,
    xuiClient,
    xuiEmail,
    setXuiEmail,
    xuiEmailError,
    xuiSearchAttempted,
    onFetchXuiClient,
    onDeleteXuiClient,
    onUpdateXuiClient,
    onResetXuiTraffic,
    allUsers,
    allUsersLoading,
    loadAllUsers,
    usersSearchInput,
    setUsersSearchInput,
    onUsersSearch,
    actionUserId,
    detailUser,
    setDetailUser,
    roleOptions,
    onDeleteUser,
    onRefreshUserLink,
    onUpdateUserRole,
  };
}

export type UsersAdminContext = ReturnType<typeof useUsersAdmin>;
