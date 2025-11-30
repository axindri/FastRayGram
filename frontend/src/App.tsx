import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@/styles/App.css';
import { AppLayout, ProtectedRoute } from '@/components';
import { Home, NotFound, Configs, Account, Login, Register, ChangePassword, UpdateProfile } from '@/pages';
import { useTheme } from '@/hooks/useTheme';
import { useTelegram } from '@/hooks/useTelegram';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { tokenStorage } from '@/services/api/tokenStorage';
import { isTokenExpiringSoon } from '@/utils/jwt';
import { apiClient } from '@/services';
import { KEEPALIVE_INTERVAL_SEC, ACCESS_TOKEN_REFRESH_THRESHOLD_SEC } from '@/config/settings';
import { Admin, Requests, RequestDetail, Users, UserDetail, Configs as AdminConfigs, ConfigDetail as AdminConfigDetail, News, NewsDetail, AppSettings, AppSettingsDetail } from '@/pages/Admin';

function App() {
  const { checkAuth, isInitialized } = useAppStore();

  useEffect(() => {
    if (!isInitialized) {
      console.log('[App] Initializing authentication first');
      checkAuth();
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      console.log('[App] Skip keepalive, store is not initialized');
      return;
    }

    const keepAlive = async () => {
      console.log('[App] keepalive check');
      const access = tokenStorage.getAccessToken();
      if (!access) {
        console.log('[App] keepalive check: no access token');
        return;
      }
      if (!isTokenExpiringSoon(access, ACCESS_TOKEN_REFRESH_THRESHOLD_SEC)) {
        console.log('[App] keepalive check: token not expiring soon, everything is OK!');
        return;
      }
      try {
        console.log('[App] keepalive refresh triggered');
        await apiClient.refreshToken();
      } catch (error) {
        console.warn('[App] keepalive refresh failed', error);
      }
    };

    const intervalId = window.setInterval(keepAlive, KEEPALIVE_INTERVAL_SEC * 1000);
    console.log(`[App] keepalive interval id:${intervalId} started ${KEEPALIVE_INTERVAL_SEC} seconds`);

    return () => {
      window.clearInterval(intervalId);
      console.log(`[App] keepalive interval id:${intervalId} cleared`);
    };
  }, [isInitialized]);

  useTheme();
  useTelegram();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: 'var(--color-font-family)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-bg-secondary)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: 'var(--color-bg-secondary)',
            },
          },
          loading: {
            iconTheme: {
              primary: 'var(--color-accent)',
              secondary: 'var(--color-bg-secondary)',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          path="/update-profile"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<AppLayout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="configs"
            element={
              <ProtectedRoute>
                <Configs />
              </ProtectedRoute>
            }
          />
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          >
            <Route path="requests" element={<Requests />} />
            <Route path="requests/:uuid" element={<RequestDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:uuid" element={<UserDetail />} />
            <Route path="configs" element={<AdminConfigs />} />
            <Route path="configs/:uuid" element={<AdminConfigDetail />} />
            <Route path="news" element={<News />} />
            <Route path="news/:uuid" element={<NewsDetail />} />
            <Route
              path="app/settings"
              element={
                <ProtectedRoute requiredRole="superuser">
                  <AppSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="app/settings/:type"
              element={
                <ProtectedRoute requiredRole="superuser">
                  <AppSettingsDetail />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
