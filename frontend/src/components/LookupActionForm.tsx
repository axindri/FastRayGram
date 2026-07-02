import { Button, Form, Popconfirm, Space } from "antd";
import type { ReactNode } from "react";
import type { Rule } from "antd/es/form";

type LookupActionFormProps = {
  label: string;
  name: string;
  input: ReactNode;
  loading: boolean;
  onGet: () => void;
  onDelete?: () => void;
  deleteConfirmTitle?: string;
  rules?: Rule[];
  result?: ReactNode;
};

export function LookupActionForm({ label, name, input, loading, onGet, onDelete, deleteConfirmTitle, rules, result }: LookupActionFormProps) {
  return (
    <>
      <Form.Item label={label} style={{ marginBottom: 0 }}>
        <Space.Compact block>
          <Form.Item name={name} noStyle rules={rules}>
            {input}
          </Form.Item>
          <Button loading={loading} onClick={onGet}>
            Получить
          </Button>
          {onDelete ? (
            <Popconfirm title={deleteConfirmTitle ?? "Удалить?"} okText="Да" cancelText="Нет" okButtonProps={{ danger: true }} onConfirm={onDelete}>
              <Button danger loading={loading}>
                Удалить
              </Button>
            </Popconfirm>
          ) : null}
        </Space.Compact>
      </Form.Item>
      {result}
    </>
  );
}

type CompactFormActionProps = {
  label: string;
  name: string;
  input: ReactNode;
  loading: boolean;
  submitLabel: string;
  rules?: Rule[];
  danger?: boolean;
};

export function CompactFormAction({ label, name, input, loading, submitLabel, rules, danger = false }: CompactFormActionProps) {
  return (
    <Form.Item label={label} style={{ marginBottom: 0 }}>
      <Space.Compact block>
        <Form.Item name={name} noStyle rules={rules}>
          {input}
        </Form.Item>
        <Button danger={danger} htmlType="submit" loading={loading}>
          {submitLabel}
        </Button>
      </Space.Compact>
    </Form.Item>
  );
}
