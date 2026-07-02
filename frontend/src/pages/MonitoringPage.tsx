import { useCallback, useEffect, useState } from "react";
import { LinkOutlined, LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Badge, Button, Space, Spin, Typography } from "antd";

import { fetchAdminLinks, fetchStatus } from "../api";
import { AdminPageColumn, AdminPageLayout } from "../components/AdminPageLayout";
import { SectionCard } from "../components/SectionCard";
import { getApiErrorMessage } from "../utils/apiError";
import { ADMIN_LINKS_META, getStatusServices, type AdminLinks, type StatusResponse } from "../types";

const { Link, Text } = Typography;

function statusColor(status: string) {
  if (status === "ok") return "success";
  if (status === "error") return "error";
  return "warning";
}

export function MonitoringPage() {
  const { message } = App.useApp();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [links, setLinks] = useState<AdminLinks | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    await Promise.all([
      fetchStatus()
        .then(setStatus)
        .catch((error) => {
          setStatus(null);
          message.error(getApiErrorMessage(error, "Не удалось загрузить статус сервисов"));
        }),
      fetchAdminLinks()
        .then(setLinks)
        .catch((error) => {
          setLinks(null);
          message.error(getApiErrorMessage(error, "Не удалось загрузить ссылки на панели"));
        }),
    ]);

    setLoading(false);
  }, [message]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPageLayout title="Мониторинг">
      <AdminPageColumn span={12}>
        <SectionCard
          title="Статус"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>
              Обновить
            </Button>
          }
        >
          {status ? (
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {getStatusServices(status).map(([name, item]) => (
                <Space key={name}>
                  <Badge status={statusColor(item.status)} />
                  <Text strong>{name}</Text>
                  {item.status === "ok" ? <Text type="secondary">{item.version ? ` · v${item.version}` : ""}</Text> : null}
                </Space>
              ))}
            </Space>
          ) : null}
          {!status && loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
          ) : null}
        </SectionCard>
      </AdminPageColumn>

      <AdminPageColumn span={12}>
        <SectionCard title="Ссылки">
          {links ? (
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              {ADMIN_LINKS_META.map(({ key, title, hint }) => (
                <Space key={key} orientation="vertical" size={0}>
                  <Text strong>{title}</Text>
                  <Text type="secondary">{hint}</Text>
                  <Link href={links[key]} target="_blank">
                    <LinkOutlined /> {links[key]}
                  </Link>
                </Space>
              ))}
            </Space>
          ) : null}
          {!links && loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
          ) : null}
        </SectionCard>
      </AdminPageColumn>
    </AdminPageLayout>
  );
}
