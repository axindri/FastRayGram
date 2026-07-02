import { useCallback, useEffect, useMemo, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { App, Button, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";

import {
  buildAuthLink,
  createUser,
  deleteUser,
  deleteXuiClient,
  fetchConfig,
  fetchUserById,
  fetchUsers,
  fetchXuiClient,
  refreshUserToken,
  resetXuiClientTraffic,
  updateUserRole,
  updateXuiClient,
} from "../api";
import { AdminPageColumn, AdminPageLayout } from "../components/AdminPageLayout";
import { AsyncListState } from "../components/AsyncListState";
import { CopyableInput } from "../components/CopyableInput";
import { LookupActionForm } from "../components/LookupActionForm";
import { PaginationFooter } from "../components/PaginationFooter";
import { SectionCard } from "../components/SectionCard";
import { UserCard } from "../components/UserCard";
import { UserLookupPanel, type UserLookupState } from "../components/UserLookupPanel";
import { XuiClientCard } from "../components/XuiClientCard";
import { useAuth } from "../auth";
import { getApiErrorMessage } from "../utils/apiError";
import { emptyPaginated } from "../utils/pagination";
import { MARK_HINT, MARK_MAX_LENGTH, optionalMarkFormRules } from "../utils/mark";
import { USERNAME_HINT, USERNAME_MAX_LENGTH, usernameFormRules } from "../utils/username";
import { ROLE_LABELS, type AdminUser, type Paginated, type UserRole } from "../types";

type CreateUserForm = {
  username: string;
  role: UserRole;
  mark?: string;
  flow?: string;
  limit_ips?: number;
  total_gb?: number;
  expiry_time_days?: number;
};

type UserGetForm = { id: number };

type UserActionsForm = {
  id: number;
  role: UserRole;
};

type XuiGetForm = { email: string };

type XuiUpdateForm = {
  email: string;
  expiry_time_days?: number;
  enable: boolean;
};

export function UsersPage() {
  const { message } = App.useApp();
  const { user: currentUser } = useAuth();
  const [defaultExpiryDays, setDefaultExpiryDays] = useState(30);

  const [createLoading, setCreateLoading] = useState(false);
  const [createdAuthLink, setCreatedAuthLink] = useState("");
  const [createForm] = Form.useForm<CreateUserForm>();

  const [userGetLoading, setUserGetLoading] = useState(false);
  const [managedUser, setManagedUser] = useState<AdminUser | null>(null);
  const [userLookup, setUserLookup] = useState<UserLookupState>("idle");
  const [userGetForm] = Form.useForm<UserGetForm>();
  const [userActionsLoading, setUserActionsLoading] = useState(false);
  const [updatedRoleUser, setUpdatedRoleUser] = useState<AdminUser | null>(null);
  const [roleAuthLink, setRoleAuthLink] = useState("");
  const [authLink, setAuthLink] = useState("");
  const [userActionsForm] = Form.useForm<UserActionsForm>();

  const [xuiGetLoading, setXuiGetLoading] = useState(false);
  const [xuiUpdateLoading, setXuiUpdateLoading] = useState(false);
  const [xuiClient, setXuiClient] = useState<Awaited<ReturnType<typeof fetchXuiClient>> | null>(null);
  const [xuiGetForm] = Form.useForm<XuiGetForm>();
  const [xuiUpdateForm] = Form.useForm<XuiUpdateForm>();

  const [allUsers, setAllUsers] = useState<Paginated<AdminUser>>(emptyPaginated);
  const [allUsersLoading, setAllUsersLoading] = useState(false);

  const loadAllUsers = useCallback(
    async (page: number) => {
      setAllUsersLoading(true);

      try {
        setAllUsers(await fetchUsers(page, allUsers.limit));
      } catch (error) {
        message.error(getApiErrorMessage(error, "Не удалось загрузить пользователей"));
      } finally {
        setAllUsersLoading(false);
      }
    },
    [allUsers.limit, message],
  );

  useEffect(() => {
    void loadAllUsers(1);
  }, [loadAllUsers]);

  const roleOptions = useMemo(() => {
    if (currentUser?.role === "superuser") {
      return [
        { value: "user", label: ROLE_LABELS.user },
        { value: "admin", label: ROLE_LABELS.admin },
      ];
    }
    return [{ value: "user", label: ROLE_LABELS.user }];
  }, [currentUser?.role]);

  useEffect(() => {
    fetchConfig()
      .then((config) => {
        setDefaultExpiryDays(config.default_expiry_time_days);
        createForm.setFieldValue("expiry_time_days", config.default_expiry_time_days);
        xuiUpdateForm.setFieldValue("expiry_time_days", config.default_expiry_time_days);
      })
      .catch(() => undefined);
  }, [createForm, xuiUpdateForm]);

  const onCreateUser = async (values: CreateUserForm) => {
    setCreateLoading(true);
    setCreatedAuthLink("");

    try {
      const token = await createUser({
        ...values,
        mark: values.mark || "",
        flow: values.flow || "",
        limit_ips: values.limit_ips ?? 0,
        total_gb: values.total_gb ?? 0,
        expiry_time_days: values.expiry_time_days ?? defaultExpiryDays,
        enable: true,
      });
      setCreatedAuthLink(buildAuthLink(token));
      message.success("Пользователь создан");
      await loadAllUsers(1);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось создать пользователя"));
    } finally {
      setCreateLoading(false);
    }
  };

  const runUserGetAction = async (action: "get" | "delete") => {
    const { id } = await userGetForm.validateFields();
    setUserGetLoading(true);

    if (action === "get") {
      setManagedUser(null);
      setUserLookup("idle");
    }

    try {
      if (action === "get") {
        const user = await fetchUserById(id);
        setManagedUser(user);
        setUserLookup("found");
        return;
      }

      await deleteUser(id);
      setManagedUser(null);
      setUserLookup("idle");
      message.success("Пользователь удалён");
      await loadAllUsers(allUsers.page);
    } catch (error) {
      if (action === "get") {
        setManagedUser(null);
        setUserLookup("not_found");
      }
      message.error(getApiErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setUserGetLoading(false);
    }
  };

  const runUserRefreshAction = async () => {
    const { id } = await userActionsForm.validateFields(["id"]);
    setUserActionsLoading(true);
    setAuthLink("");

    try {
      setAuthLink(buildAuthLink(await refreshUserToken(id)));
      message.success("Токен обновлён");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setUserActionsLoading(false);
    }
  };

  const onUpdateUserRole = async () => {
    const values = await userActionsForm.validateFields();

    if (values.role === "superuser") {
      return;
    }

    setUserActionsLoading(true);
    setUpdatedRoleUser(null);
    setRoleAuthLink("");

    try {
      const result = await updateUserRole(values.id, values.role);
      setUpdatedRoleUser(result.user);
      setRoleAuthLink(buildAuthLink(result.token));
      message.success("Роль обновлена");
      await loadAllUsers(allUsers.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось обновить роль"));
    } finally {
      setUserActionsLoading(false);
    }
  };

  const runXuiGetAction = async (action: "get" | "delete") => {
    const { email } = await xuiGetForm.validateFields();
    setXuiGetLoading(true);

    if (action === "get") {
      setXuiClient(null);
    }

    try {
      if (action === "get") {
        setXuiClient(await fetchXuiClient(email));
        return;
      }

      await deleteXuiClient(email);
      setXuiClient(null);
      message.success("Клиент удалён");
    } catch (error) {
      if (action === "get") {
        setXuiClient(null);
      }
      message.error(getApiErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setXuiGetLoading(false);
    }
  };

  const runXuiUpdateAction = async (action: "update" | "reset") => {
    const values = await xuiUpdateForm.validateFields();
    setXuiUpdateLoading(true);

    try {
      if (action === "update") {
        await updateXuiClient(values.email, {
          expiry_time_days: values.expiry_time_days ?? defaultExpiryDays,
          enable: values.enable,
        });
        message.success("Клиент обновлён");
        return;
      }

      await resetXuiClientTraffic(values.email);
      message.success("Трафик сброшен");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setXuiUpdateLoading(false);
    }
  };

  return (
    <AdminPageLayout title="Пользователи">
      <AdminPageColumn>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <SectionCard title="Создать пользователя" hint="Будет создан пользователь и его XUI-клиент">
            <Form form={createForm} layout="vertical" onFinish={onCreateUser} initialValues={{ role: "user" }}>
              <Form.Item label="Username" name="username" extra={USERNAME_HINT} rules={usernameFormRules}>
                <Input placeholder="Alex" maxLength={USERNAME_MAX_LENGTH} />
              </Form.Item>

              <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
                <Select options={roleOptions} />
              </Form.Item>

              <Form.Item label="Заметка" name="mark" extra={MARK_HINT} rules={optionalMarkFormRules}>
                <Input placeholder="Заметка или комментарий" maxLength={MARK_MAX_LENGTH} />
              </Form.Item>

              <Form.Item label="Flow" name="flow">
                <Input placeholder="xtls-rprx-vision" />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item label="Лимит IP" name="limit_ips">
                    <InputNumber style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Объем трафика" name="total_gb">
                    <InputNumber style={{ width: "100%" }} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Срок действия" name="expiry_time_days">
                    <InputNumber style={{ width: "100%" }} placeholder={String(defaultExpiryDays)} />
                  </Form.Item>
                </Col>
              </Row>

              <Button type="primary" htmlType="submit" loading={createLoading}>
                Создать
              </Button>
            </Form>

            {createdAuthLink ? <CopyableInput label="Ссылка для входа" value={createdAuthLink} /> : null}
          </SectionCard>

          <SectionCard title="Получить пользователя" hint="Просмотр данных пользователя и удаление">
            <Form form={userGetForm} layout="vertical">
              <LookupActionForm
                label="User ID"
                name="id"
                input={<InputNumber placeholder="1" style={{ width: "100%" }} />}
                loading={userGetLoading}
                onGet={() => void runUserGetAction("get")}
                onDelete={() => void runUserGetAction("delete")}
                deleteConfirmTitle="Удалить пользователя?"
                rules={[{ required: true, message: "Введите ID" }]}
                result={<UserLookupPanel loading={userGetLoading} lookup={userLookup} user={managedUser} />}
              />
            </Form>
          </SectionCard>

          <SectionCard title="Действия с пользователем" hint="Новая ссылка для входа и смена роли по ID">
            <Form form={userActionsForm} layout="vertical" initialValues={{ role: "user" }}>
              <Form.Item label="User ID" name="id" rules={[{ required: true, message: "Введите ID" }]}>
                <InputNumber style={{ width: "100%" }} placeholder="1" />
              </Form.Item>

              <Button type="primary" loading={userActionsLoading} onClick={() => void runUserRefreshAction()} style={{ marginBottom: authLink ? 0 : 16 }}>
                Новая ссылка для входа
              </Button>

              {authLink ? (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <CopyableInput label="Ссылка для входа" value={authLink} />
                </div>
              ) : null}

              <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
                <Select options={roleOptions} />
              </Form.Item>

              <Button type="primary" loading={userActionsLoading} onClick={() => void onUpdateUserRole()}>
                Сохранить роль
              </Button>

              {updatedRoleUser ? (
                <div style={{ marginTop: 16 }}>
                  <UserCard user={updatedRoleUser} />
                </div>
              ) : null}

              {roleAuthLink ? (
                <div style={{ marginTop: 16 }}>
                  <CopyableInput label="Ссылка для входа" value={roleAuthLink} />
                </div>
              ) : null}
            </Form>
          </SectionCard>
        </Space>
      </AdminPageColumn>

      <AdminPageColumn>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <SectionCard title="Просмотр XUI клиента" hint="Просмотр данных клиента и удаление">
            <Form form={xuiGetForm} layout="vertical">
              <LookupActionForm
                label="Username"
                name="email"
                input={<Input placeholder="Alex" style={{ width: "100%" }} />}
                loading={xuiGetLoading}
                onGet={() => void runXuiGetAction("get")}
                onDelete={() => void runXuiGetAction("delete")}
                deleteConfirmTitle="Удалить XUI-клиента?"
                rules={[{ required: true, message: "Введите имя пользователя" }]}
                result={
                  xuiClient ? (
                    <div style={{ marginTop: 16 }}>
                      <XuiClientCard client={xuiClient} variant="admin" />
                    </div>
                  ) : null
                }
              />
            </Form>
          </SectionCard>

          <SectionCard title="Действия с XUI клиентом" hint="Срок действия, статус и сброс трафика">
            <Form form={xuiUpdateForm} layout="vertical" initialValues={{ enable: true }}>
              <Form.Item label="Username" name="email" rules={[{ required: true, message: "Введите имя пользователя" }]}>
                <Input placeholder="Alex" />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="Срок действия, дней" name="expiry_time_days">
                    <InputNumber style={{ width: "100%" }} placeholder={String(defaultExpiryDays)} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Включен по-умолчанию" name="enable">
                    <Select
                      options={[
                        { value: true, label: "Да" },
                        { value: false, label: "Нет" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Space wrap>
                <Button type="primary" loading={xuiUpdateLoading} onClick={() => void runXuiUpdateAction("update")}>
                  Обновить
                </Button>
                <Button loading={xuiUpdateLoading} onClick={() => void runXuiUpdateAction("reset")}>
                  Сбросить трафик
                </Button>
              </Space>
            </Form>
          </SectionCard>

          <SectionCard
            title="Все пользователи"
            extra={
              <Button icon={<ReloadOutlined />} onClick={() => void loadAllUsers(allUsers.page)} loading={allUsersLoading}>
                Обновить
              </Button>
            }
          >
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              <AsyncListState loading={allUsersLoading} empty={!allUsers.items.length} emptyDescription="Пользователей нет" minHeight={80}>
                {allUsers.items.map((item) => (
                  <UserCard key={item.id} user={item} />
                ))}
              </AsyncListState>

              <PaginationFooter page={allUsers.page} pages={allUsers.pages} total={allUsers.total} loading={allUsersLoading} onPageChange={(page) => void loadAllUsers(page)} />
            </Space>
          </SectionCard>
        </Space>
      </AdminPageColumn>
    </AdminPageLayout>
  );
}
