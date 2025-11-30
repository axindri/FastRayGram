import { Card, ChevronRightIcon, ConfigsIcon, UserIcon } from '@/components';
import styles from './RequestMenuItem.module.css';
import type { Request } from '@/services';
import { formatTime, getRequestTitle } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export interface RequestMenuItemProps {
  request: Request;
  onItemClick: (requestId: string) => void;
}

export function RequestMenuItem({ request, onItemClick }: RequestMenuItemProps) {
  const { t } = useTranslation();
  const getIconAndClassName = () => {
    switch (request.name) {
      case 'update_config':
        return {
          icon: <ConfigsIcon />,
          className: `${styles.icon} ${styles.updateConfig}`,
        };
      case 'verify':
        return {
          icon: <UserIcon />,
          className: `${styles.icon} ${styles.verify}`,
        };
      case 'renew_config':
        return {
          icon: <ConfigsIcon />,
          className: `${styles.icon} ${styles.renewConfig}`,
        };
      case 'reset_password':
        return {
          icon: <UserIcon />,
          className: `${styles.icon} ${styles.resetPassword}`,
        };
      default:
        return {
          icon: <ConfigsIcon />,
          className: styles.icon,
        };
    }
  };

  const { icon, className } = getIconAndClassName();

  return (
    <Card>
      <div className={styles.item} onClick={() => onItemClick(request.id)}>
        <div className={styles.container}>
          <div className={className}>{icon}</div>
          <div className={styles.header}>
            <span className={styles.title}>{getRequestTitle(request.name)}</span>
            <div className={styles.content}>
              <div className={styles.data}>
                <span className={styles.label}>{t('entities.requestMenuItem.created')} </span>
                <span className={styles.value}>{formatTime(request._inserted_dttm)}</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </Card>
  );
}
