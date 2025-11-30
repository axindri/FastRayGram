import toast from 'react-hot-toast';
import styles from './Session.module.css';
import { apiClient } from '@/services';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export interface SessionProps {
  id: string;
  isCurrent: boolean;
  name: string;
  device: string;
  ip: string;
  lastActivity: string;
  expiresAt: string;
  onSessionTerminated?: (sessionId: string) => void;
  showExpiresAt?: boolean;
}

export function Session({ id, isCurrent, name, device, ip, lastActivity, expiresAt, onSessionTerminated, showExpiresAt = false }: SessionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isCurrent) {
        await apiClient.logout();
        navigate('/login');
      } else {
        await apiClient.terminateSession(id);
        toast.success(t('entities.session.sessionTerminated'));
        onSessionTerminated?.(id);
      }
    } catch (error) {
      toast.error(t('entities.session.failedToLogout'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.session} key={id}>
      <div className={styles.header}>
        <h3 className={styles.title}>{name}</h3>
        <div className={styles.actionContainer}>
          {isCurrent && (
            <>
              <span className={styles.current}>{t('entities.session.current')}</span>
            </>
          )}
          {onSessionTerminated && (
            <>
              <div className={styles.separator} />
              <div className={styles.action} onClick={handleLogout}>
                {isLoading ? <div>{t('entities.session.loggingOut')}</div> : <div>{t('entities.session.logout')}</div>}
              </div>
            </>
          )}
        </div>
      </div>
      <div className={styles.item}>
        <div className={styles.label}>{t('entities.session.device')}</div>
        <div className={styles.value}>{device}</div>
      </div>
      <div className={styles.item}>
        <div className={styles.label}>{t('entities.session.ip')}</div>
        <div className={styles.value}>{ip}</div>
      </div>
      <div className={styles.item}>
        <div className={styles.label}>{t('entities.session.lastActivity')}</div>
        <div className={styles.value}>{lastActivity}</div>
      </div>
      {showExpiresAt && (
        <div className={styles.item}>
          <div className={styles.label}>{t('entities.session.expiresAt')}</div>
          <div className={styles.value}>{expiresAt}</div>
        </div>
      )}
    </div>
  );
}
