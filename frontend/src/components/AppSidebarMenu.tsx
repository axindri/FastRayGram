import { useEffect, useMemo, useState } from "react";
import { Button, Flex, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import { GithubOutlined, HeartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { fetchConfig } from "../api";
import { useAuth } from "../auth";
import { NAV_ITEMS } from "../config/navigation";
import { getSidebarBg } from "../theme/config";
import { isAdminRole } from "../types";

const { Text } = Typography;

export const APP_VERSION = "v2.8.1";

type AppSidebarMenuProps = {
  menuTheme: "light" | "dark";
  resolved: "light" | "dark";
  selectedKey: string[];
  mobile?: boolean;
  onNavigate?: () => void;
};

export function AppSidebarMenu({ menuTheme, resolved, selectedKey, mobile = false, onNavigate }: AppSidebarMenuProps) {
  const { token } = theme.useToken();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sidebarBg = getSidebarBg(resolved);
  const [boostyUrl, setBoostyUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  useEffect(() => {
    void fetchConfig().then((config) => {
      setBoostyUrl(config.boosty_url);
      setGithubUrl(config.github_url);
    });
  }, []);

  const menuItems = useMemo<MenuProps["items"]>(() => {
    const showAdmin = user ? isAdminRole(user.role) : false;
    return NAV_ITEMS.filter((item) => !item.adminOnly || showAdmin).map(({ path, Icon, label }) => ({
      key: path,
      icon: <Icon />,
      label,
    }));
  }, [user]);

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
    onNavigate?.();
  };

  return (
    <Flex vertical style={{ height: "100%", background: sidebarBg }}>
      <Menu className="app-menu" mode="inline" theme={menuTheme} selectedKeys={selectedKey} items={menuItems} onClick={onMenuClick} style={{ flex: 1, borderInlineEnd: 0, background: sidebarBg }} />

      <div
        className={`app-chrome-bar app-sidebar-chrome${mobile ? " app-sidebar-chrome--mobile" : ""}`}
        style={{
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: sidebarBg,
        }}
      >
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: 12, paddingInline: 4 }}>
            {APP_VERSION}
          </Text>
          <Flex gap={2}>
            {boostyUrl ? (
              <Button
                type="text"
                size="small"
                icon={<HeartOutlined style={{ color: token.colorError }} />}
                href={boostyUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Поддержать на Boosty"
              />
            ) : null}
            {githubUrl ? <Button type="text" size="small" icon={<GithubOutlined />} href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Исходный код на GitHub" /> : null}
          </Flex>
        </Flex>
      </div>
    </Flex>
  );
}
