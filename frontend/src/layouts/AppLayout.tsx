import { useMemo, useState } from "react";
import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Flex, Layout, Typography, theme } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { AppSidebarMenu } from "../components/AppSidebarMenu";
import { ServiceStatusBanner } from "../components/ServiceStatusBanner";
import { ThemeFooterControls } from "../components/ThemeFooterControls";
import { useAuth } from "../auth";
import { NAV_ITEMS } from "../config/navigation";
import { ServiceStatusProvider } from "../hooks/useServiceStatus";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useTheme } from "../theme/ThemeProvider";
import { getSidebarBg } from "../theme/config";

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const HEADER_BG = "#000000";
const HEADER_TEXT = "#ffffff";
const MOBILE_BREAKPOINT = "(max-width: 991.98px)";

export function AppLayout() {
  const { token } = theme.useToken();
  const { logout } = useAuth();
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuTheme = resolved === "dark" ? "dark" : "light";
  const sidebarBg = getSidebarBg(resolved);

  const selectedKey = useMemo(() => {
    const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
    return match ? [match.path] : [];
  }, [location.pathname]);

  const sidebar = <AppSidebarMenu menuTheme={menuTheme} resolved={resolved} selectedKey={selectedKey} onNavigate={mobile ? () => setMenuOpen(false) : undefined} />;

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: 24,
    background: resolved === "dark" ? token.colorBgContainer : HEADER_BG,
    color: resolved === "dark" ? token.colorText : HEADER_TEXT,
    borderBottom: `1px solid ${resolved === "dark" ? token.colorBorderSecondary : "#1f1f1f"}`,
  } as const;

  const headerTextColor = resolved === "dark" ? token.colorText : HEADER_TEXT;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <ServiceStatusProvider>
      <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
        <Header style={headerStyle}>
          <Flex align="center" gap={12}>
            <img src="/frg_light_on_dark.png" alt="" aria-hidden style={{ height: mobile ? 28 : 36, display: "block" }} />
            <Title level={4} style={{ margin: 0, color: headerTextColor }}>
              Fast Ray Gram
            </Title>
          </Flex>
          {mobile ? <Button type="text" icon={<MenuOutlined />} aria-label="Меню" style={{ color: headerTextColor }} onClick={() => setMenuOpen(true)} /> : null}
        </Header>

        <ServiceStatusBanner />

        <Layout style={{ flex: 1, background: token.colorBgLayout }}>
          {mobile ? (
            <Drawer title="Меню" placement="right" open={menuOpen} onClose={() => setMenuOpen(false)} width={240} styles={{ body: { padding: 0, height: "100%" } }}>
              {sidebar}
            </Drawer>
          ) : (
            <Sider className="app-sider" width={200} theme={menuTheme} style={{ background: sidebarBg, borderRight: `1px solid ${token.colorBorderSecondary}` }}>
              {sidebar}
            </Sider>
          )}

          <Layout style={{ background: token.colorBgLayout }}>
            <Content style={{ padding: "24px 16px", boxSizing: "border-box" }}>
              <Outlet />
            </Content>

            <Footer
              className="app-chrome-bar app-layout-footer"
              style={{
                background: token.colorBgContainer,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                <ThemeFooterControls />
                <Button type="text" icon={<LogoutOutlined />} onClick={onLogout}>
                  Выйти
                </Button>
              </Flex>
            </Footer>
          </Layout>
        </Layout>
      </Layout>
    </ServiceStatusProvider>
  );
}
