import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeleteOutlined, EditOutlined, EyeOutlined, LinkOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { App, Button, Col, Form, Input, InputNumber, Row, Select, Space, Tabs } from "antd";

import { buildAuthLink, createUser, deleteUser, deleteXuiClient, fetchConfig, fetchUsers, fetchXuiClient, refreshUserToken, resetXuiClientTraffic, updateUserRole, updateXuiClient } from "../api";
import { ActionLegend } from "../components/ActionLegend";
import { AdminPageColumn, AdminPageLayout } from "../components/AdminPageLayout";
import { AsyncListState } from "../components/AsyncListState";
import { CopyableInput } from "../components/CopyableInput";
import { LookupActionForm } from "../components/LookupActionForm";
import { PaginationFooter } from "../components/PaginationFooter";
import { SectionCard } from "../components/SectionCard";
import { UserCard } from "../components/UserCard";
import { UserDetailModal } from "../components/UserDetailModal";
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

type XuiGetForm = { email: string };

const USER_ACTION_LEGEND = [
  { icon: <EyeOutlined />, label: "просмотр" },
  { icon: <EditOutlined />, label: "смена роли" },
  { icon: <LinkOutlined />, label: "новая ссылка для входа" },
  { icon: <DeleteOutlined />, label: "удаление" },
] as const;

const XUI_ACTION_LEGEND = [
  { icon: <EditOutlined />, label: "срок и статус подписки" },
  { icon: <ReloadOutlined />, label: "сброс трафика" },
  { icon: <DeleteOutlined />, label: "удаление клиента" },
] as const;

export function UsersPage() {
  const { message } = App.useApp();
  const { user: currentUser } = useAuth();
  const [defaultExpiryDays, setDefaultExpiryDays] = useState(30);

  const [createLoading, setCreateLoading] = useState(false);
  const [createdAuthLink, setCreatedAuthLink] = useState("");
  const [createForm] = Form.useForm<CreateUserForm>();

  const [xuiGetLoading, setXuiGetLoading] = useState(false);
  const [xuiActionLoading, setXuiActionLoading] = useState(false);
  const [xuiClient, setXuiClient] = useState<Awaited<ReturnType<typeof fetchXuiClient>> | null>(null);
  const [xuiGetForm] = Form.useForm<XuiGetForm>();

  const [allUsers, setAllUsers] = useState<Paginated<AdminUser>>(emptyPaginated);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");
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
        createForm.setFieldValue("expiry_time_days", config.default_expiry_time_days);
      })
      .catch(() => undefined);
  }, [createForm]);

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

  const onDeleteUser = async (id: number) => {
    setActionUserId(id);

    try {
      await deleteUser(id);
      message.success("Пользователь удалён");
      await loadAllUsers(allUsers.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось удалить пользователя"));
    } finally {
      setActionUserId(null);
    }
  };

  const onRefreshUserLink = async (id: number) => {
    setActionUserId(id);

    try {
      const link = buildAuthLink(await refreshUserToken(id));
      message.success("Ссылка для входа обновлена");
      return link;
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось получить ссылку"));
      throw error;
    } finally {
      setActionUserId(null);
    }
  };

  const onUpdateUserRole = async (id: number, role: "user" | "admin") => {
    setActionUserId(id);

    try {
      const result = await updateUserRole(id, role);
      message.success("Роль обновлена");
      await loadAllUsers(allUsers.page);
      return {
        user: result.user,
        authLink: buildAuthLink(result.token),
      };
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось обновить роль"));
      throw error;
    } finally {
      setActionUserId(null);
    }
  };

  const reloadXuiClient = async (email: string) => {
    setXuiClient(await fetchXuiClient(email));
  };

  const onFetchXuiClient = async () => {
    const { email } = await xuiGetForm.validateFields();
    setXuiGetLoading(true);
    setXuiClient(null);

    try {
      await reloadXuiClient(email);
    } catch (error) {
      setXuiClient(null);
      message.error(getApiErrorMessage(error, "Не удалось получить клиента"));
    } finally {
      setXuiGetLoading(false);
    }
  };

  const onDeleteXuiClient = async (email: string) => {
    setXuiActionLoading(true);

    try {
      await deleteXuiClient(email);
      setXuiClient(null);
      message.success("Клиент удалён");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось удалить клиента"));
    } finally {
      setXuiActionLoading(false);
    }
  };

  const onUpdateXuiClient = async (email: string, payload: { expiry_time_days: number; enable: boolean }) => {
    setXuiActionLoading(true);

    try {
      await updateXuiClient(email, payload);
      await reloadXuiClient(email);
      message.success("Клиент обновлён");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось обновить клиента"));
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
      message.success("Трафик сброшен");
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось сбросить трафик"));
    } finally {
      setXuiActionLoading(false);
    }
  };

  const tabItems = [
    {
      key: "create",
      label: "Создать пользователя",
      children: (
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
      ),
    },
    {
      key: "all",
      label: "Все пользователи",
      children: (
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <ActionLegend title="Действия в карточке пользователя" items={[...USER_ACTION_LEGEND]} />

          <SectionCard
            title="Все пользователи"
            extra={
              <Button icon={<ReloadOutlined />} onClick={() => void loadAllUsers(allUsers.page)} loading={allUsersLoading}>
                Обновить
              </Button>
            }
          >
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              <Input.Search
                allowClear
                placeholder="Поиск по имени пользователя"
                enterButton={<SearchOutlined />}
                maxLength={USERNAME_MAX_LENGTH}
                onSearch={(value) => {
                  const query = value.trim();
                  setUsersSearch(query);
                  void loadAllUsers(1, query);
                }}
                onClear={() => {
                  setUsersSearch("");
                  void loadAllUsers(1, "");
                }}
              />

              <AsyncListState loading={allUsersLoading} empty={!allUsers.items.length} emptyDescription="Пользователей нет" minHeight={80}>
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
              </AsyncListState>

              <PaginationFooter page={allUsers.page} pages={allUsers.pages} total={allUsers.total} loading={allUsersLoading} onPageChange={(page) => void loadAllUsers(page)} />
            </Space>
          </SectionCard>
        </Space>
      ),
    },
    {
      key: "xui",
      label: "XUI клиент",
      children: (
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <ActionLegend title="Действия в карточке подписки" items={[...XUI_ACTION_LEGEND]} />

          <SectionCard title="XUI клиент" hint="Поиск клиента по username и управление подпиской">
            <Form form={xuiGetForm} layout="vertical">
              <LookupActionForm
                label="Username"
                name="email"
                input={<Input placeholder="Alex" style={{ width: "100%" }} />}
                loading={xuiGetLoading}
                onGet={() => void onFetchXuiClient()}
                rules={[{ required: true, message: "Введите имя пользователя" }]}
                result={
                  xuiClient ? (
                    <div style={{ marginTop: 16 }}>
                      <XuiClientCard
                        client={xuiClient}
                        variant="profile"
                        defaultExpiryDays={defaultExpiryDays}
                        actionLoading={xuiActionLoading}
                        onUpdate={onUpdateXuiClient}
                        onResetTraffic={onResetXuiTraffic}
                        onDelete={onDeleteXuiClient}
                      />
                    </div>
                  ) : null
                }
              />
            </Form>
          </SectionCard>
        </Space>
      ),
    },
  ];

  return (
    <AdminPageLayout title="Пользователи">
      <AdminPageColumn span={24}>
        <Tabs items={tabItems} />
      </AdminPageColumn>

      <UserDetailModal open={detailUser !== null} user={detailUser} onClose={() => setDetailUser(null)} />
    </AdminPageLayout>
  );
}
