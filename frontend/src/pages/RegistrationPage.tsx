import { useCallback, useEffect, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { App, Button, Form, InputNumber, Space } from "antd";

import { buildRegistrationLink, createRegistrationCode, deleteRegistrationCode, extendRegistrationCode, fetchRegistrationCodes } from "../api";
import { AdminPageColumn, AdminPageLayout } from "../components/AdminPageLayout";
import { AsyncListState } from "../components/AsyncListState";
import { CopyableInput } from "../components/CopyableInput";
import { PaginationFooter } from "../components/PaginationFooter";
import { RegistrationCodeCard } from "../components/RegistrationCodeCard";
import { SectionCard } from "../components/SectionCard";
import { getApiErrorMessage } from "../utils/apiError";
import { emptyPaginated } from "../utils/pagination";
import type { Paginated, RegistrationCode } from "../types";

type CreateCodeForm = {
  valid_days: number;
};

export function RegistrationPage() {
  const { message } = App.useApp();
  const [createForm] = Form.useForm<CreateCodeForm>();
  const [createLoading, setCreateLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState("");

  const [codes, setCodes] = useState<Paginated<RegistrationCode>>(() => emptyPaginated());
  const [codesLoading, setCodesLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadCodes = useCallback(
    async (page: number) => {
      setCodesLoading(true);

      try {
        setCodes(await fetchRegistrationCodes(page, codes.limit));
      } catch (error) {
        message.error(getApiErrorMessage(error, "Не удалось загрузить коды регистрации"));
      } finally {
        setCodesLoading(false);
      }
    },
    [codes.limit, message],
  );

  useEffect(() => {
    void loadCodes(1);
  }, [loadCodes]);

  const onCreate = async (values: CreateCodeForm) => {
    setCreateLoading(true);
    setCreatedLink("");

    try {
      const code = await createRegistrationCode(values.valid_days);
      setCreatedLink(buildRegistrationLink(code.code));
      message.success("Код регистрации создан");
      await loadCodes(1);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось создать код регистрации"));
    } finally {
      setCreateLoading(false);
    }
  };

  const onExtend = async (id: number, extendDays: number) => {
    setActionId(id);

    try {
      await extendRegistrationCode(id, extendDays);
      message.success(`Срок действия кода продлён на ${extendDays} дн.`);
      await loadCodes(codes.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось продлить код"));
    } finally {
      setActionId(null);
    }
  };

  const onDelete = async (id: number) => {
    setActionId(id);

    try {
      await deleteRegistrationCode(id);
      message.success("Код удалён");
      await loadCodes(codes.page);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Не удалось удалить код"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <AdminPageLayout title="Регистрация">
      <AdminPageColumn>
        <SectionCard title="Создать код" hint="Сгенерируйте ссылку и отправьте её новому пользователю">
          <Form form={createForm} layout="vertical" onFinish={onCreate} initialValues={{ valid_days: 7 }}>
            <Form.Item
              label="Срок действия кода, дней"
              name="valid_days"
              rules={[
                { required: true, message: "Введите срок" },
                { type: "number", min: 1, max: 365, message: "От 1 до 365 дней" },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={createLoading}>
              Создать
            </Button>
          </Form>

          {createdLink ? <CopyableInput label="Ссылка для регистрации" value={createdLink} /> : null}
        </SectionCard>
      </AdminPageColumn>

      <AdminPageColumn>
        <SectionCard
          title="Коды регистрации"
          extra={
            <Button icon={<ReloadOutlined />} loading={codesLoading} onClick={() => void loadCodes(codes.page)}>
              Обновить
            </Button>
          }
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <AsyncListState loading={codesLoading} empty={!codes.items.length} emptyDescription="Кодов пока нет" minHeight={80}>
              {codes.items.map((item) => (
                <RegistrationCodeCard
                  key={item.id}
                  item={item}
                  onExtend={onExtend}
                  onDelete={onDelete}
                  extendLoading={actionId === item.id}
                  deleteLoading={actionId === item.id}
                />
              ))}
            </AsyncListState>

            <PaginationFooter page={codes.page} pages={codes.pages} total={codes.total} loading={codesLoading} onPageChange={(page) => void loadCodes(page)} />
          </Space>
        </SectionCard>
      </AdminPageColumn>
    </AdminPageLayout>
  );
}
