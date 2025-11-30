import { Card, ChevronRightIcon, UserIcon } from '@/components';
import styles from './UserMenuItem.module.css';
import type { UserListItem } from '@/services';
import type { RoleListItem } from '@/services/api/types';
import { ROLES } from '@/config/settings';
import { useTranslation } from '@/hooks/useTranslation';

export interface UserMenuItemProps {
  user: UserListItem;
  roles: RoleListItem[];
  onItemClick?: (userId: string) => void;
}

export function UserMenuItem({ user, roles, onItemClick }: UserMenuItemProps) {
  const { t } = useTranslation();
  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return t('status.verified');
      case 'verification_pending':
        return t('status.verificationPending');
      case 'not_verified':
      default:
        return t('status.notVerified');
    }
  };

  const getUserRole = (): string => {
    const foundRole = roles.find(r => r.id === user.role_id);
    return foundRole?.name || t('common.unknown');
  };

  const userRole = getUserRole();
  const getIconClassName = () => {
    if (userRole === ROLES.SUPERUSER) return `${styles.icon} ${styles.superuser}`;
    if (userRole === ROLES.ADMIN) return `${styles.icon} ${styles.admin}`;
    return `${styles.icon} ${styles.user}`;
  };

  return (
    <Card>
      <div className={styles.item} onClick={() => onItemClick?.(user.id)}>
        <div className={styles.container}>
          <div className={getIconClassName()}>
            <UserIcon />
          </div>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{user.login}</span>
              <span className={styles.status}>{getStatusText(user.status)}</span>
            </div>
            <div className={styles.content}>
              <div className={styles.data}>
                <span className={styles.label}>{t('entities.userMenuItem.role')} </span>
                <span className={styles.value}>{userRole[0].toUpperCase() + userRole.slice(1)}</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </Card>
  );
}
