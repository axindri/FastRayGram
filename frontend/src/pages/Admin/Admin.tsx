import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, PageContent, Menu, NewsIcon, ConfigsIcon } from '@/components';
import { getAdminMenuItems, ROLES } from '@/config/settings';
import { useAppStore } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';

export function Admin() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const adminMenuItems = getAdminMenuItems(t);

  if (user?.role === ROLES.SUPERUSER) {
    adminMenuItems.push({
      id: 'news',
      label: t('pages.admin.news'),
      icon: <NewsIcon />,
    });
    adminMenuItems.push({
      id: 'app/settings',
      label: t('pages.admin.appSettings'),
      icon: <ConfigsIcon />,
    });
  }
  const isAdminRoot = location.pathname === '/admin';

  const handleMenuClick = (itemId: string) => {
    navigate(`/admin/${itemId}`);
  };

  return (
    <>
      {isAdminRoot && (
        <>
          <PageHeader title={t('pages.admin.title')} description={t('pages.admin.description')} />
          <PageContent>
            <Menu items={adminMenuItems} onItemClick={handleMenuClick} />
          </PageContent>
        </>
      )}
      <Outlet />
    </>
  );
}
