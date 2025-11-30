import { Outlet, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './AppLayout.module.css';
import { UserIcon, ConfigsIcon, HomeIcon, AdminIcon } from '@/components';
import { useAppStore } from '@/store';
import { apiClient } from '@/services';
import { Loader } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export function AppLayout() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  useEffect(() => {
    const checkAdminPermission = async () => {
      if (!user) {
        setHasAdminAccess(false);
        return;
      }

      setIsCheckingPermission(true);
      try {
        const hasAccess = await apiClient.checkPermission('admin');
        setHasAdminAccess(hasAccess);
      } catch (error) {
        setHasAdminAccess(false);
      } finally {
        setIsCheckingPermission(false);
      }
    };

    checkAdminPermission();
  }, [user]);

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>
      {user && (
        <nav className={styles.nav}>
          <NavLink to="/" className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}>
            <HomeIcon />
            {t('layout.appLayout.home')}
          </NavLink>
          <NavLink to="/configs" className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}>
            <ConfigsIcon />
            {t('layout.appLayout.configs')}
          </NavLink>
          <NavLink to="/account" className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}>
            <UserIcon />
            {t('layout.appLayout.account')}
          </NavLink>
          {isCheckingPermission ? (
            <div className={styles.link}>
              <Loader size="small" text="" />
            </div>
          ) : (
            hasAdminAccess && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}>
                <AdminIcon />
                {t('layout.appLayout.admin')}
              </NavLink>
            )
          )}
        </nav>
      )}
    </div>
  );
}
