import styles from './Config.module.css';
import { CopyIcon, PlusIcon, MinusIcon, Button, ProgressBar } from '@/components';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { formatTime } from '@/utils';
import { apiClient } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export interface ConfigProps {
  id: string;
  title: string;
  status: string | null | 'not_updated' | 'update_pending' | 'updated';
  validStatus: 'active' | 'inactive';
  validTo: string;
  ipLimit: number;
  maxIpLimit: number;
  usedGb: number;
  totalGb: number;
  maxTotalGb: number;
  connectionUrl: string | null;
  showRenewButton?: boolean;
}

export function Config({ id, title, status, validStatus, validTo, ipLimit, maxIpLimit, usedGb, totalGb, maxTotalGb, connectionUrl, showRenewButton = false }: ConfigProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newIpLimit, setNewIpLimit] = useState(ipLimit);
  const [newTotalGb, setNewTotalGb] = useState(totalGb);
  const [updatePending, setUpdatePending] = useState(status === 'update_pending');

  const isEditingMode = isEditing && !isLoading && !updatePending;

  const handleCopy = () => {
    if (connectionUrl) {
      navigator.clipboard.writeText(connectionUrl);
    }
    toast.success(t('entities.config.connectionUrlCopied'));
  };
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleIPLimitPlus = () => {
    setNewIpLimit(newIpLimit + 1);
  };

  const handleIPLimitMinus = () => {
    setNewIpLimit(newIpLimit - 1);
  };

  const handleTotalGbPlus = () => {
    setNewTotalGb(newTotalGb + 10);
  };

  const handleTotalGbMinus = () => {
    setNewTotalGb(newTotalGb - 10);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiClient.updateConfigLimits(id, {
        limit_ip: newIpLimit,
        total_gb: newTotalGb,
      });
      toast.success(t('entities.config.configUpdateRequested'));
    } catch (error) {
      toast.error(t('entities.config.failedToUpdateConfig'));
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setUpdatePending(true);
    }
  };
  const handleRenew = async () => {
    setIsLoading(true);
    try {
      await apiClient.renewConfig(id);
      toast.success(t('entities.config.configRenewRequested'));
    } catch (error) {
      toast.error(t('entities.config.failedToRenewConfig'));
    } finally {
      setIsLoading(false);
      setUpdatePending(true);
    }
  };
  const handleCancel = () => {
    setIsEditing(false);
    setNewIpLimit(ipLimit);
    setNewTotalGb(totalGb);
  };

  return (
    <div className={styles.config} key={id}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.actionContainer}>
          {!isEditingMode ? (
            <>
              <div className={`${styles.status} ${styles[validStatus]}`}>{validStatus === 'active' ? t('entities.config.active') : t('entities.config.inactive')}</div>

              <div className={styles.separator} />
              {!updatePending ? (
                <div className={styles.action} onClick={handleEdit}>
                  {t('common.edit')}
                </div>
              ) : (
                <div className={`${styles.status} ${styles.update_pending}`}>{t('entities.config.updateRequested')}</div>
              )}
            </>
          ) : (
            <div className={`${styles.action} ${styles.cancel}`} onClick={handleCancel}>
              {t('common.cancel')}
            </div>
          )}
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.item}>
          <div className={styles.label}>{t('entities.config.validTo')}</div>
          <div className={styles.value}>{formatTime(validTo)}</div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>{t('entities.config.devicesLimit')}</div>
          {isEditingMode ? (
            <>
              <div className={styles.editContainer}>
                <div className={styles.value}>
                  {newIpLimit} / {maxIpLimit}
                </div>
                <Button variant="secondary" onClick={handleIPLimitMinus} title={t('entities.config.minus')} disabled={newIpLimit <= 1}>
                  <MinusIcon />
                </Button>
                <Button variant="secondary" onClick={handleIPLimitPlus} title={t('entities.config.plus')} disabled={newIpLimit >= maxIpLimit}>
                  <PlusIcon />
                </Button>
              </div>
            </>
          ) : (
            <div className={styles.value}>{ipLimit}</div>
          )}
        </div>
        <div className={styles.item}>
          {isEditingMode ? (
            <>
              <div className={styles.label}>{t('entities.config.totalGb')}</div>
              <div className={styles.editContainer}>
                <div className={styles.value}>
                  {newTotalGb} / {maxTotalGb}
                </div>
                <Button variant="secondary" onClick={handleTotalGbMinus} title={t('entities.config.minus')} disabled={newTotalGb <= 10}>
                  <MinusIcon />
                </Button>
                <Button variant="secondary" onClick={handleTotalGbPlus} title={t('entities.config.plus')} disabled={newTotalGb >= maxTotalGb}>
                  <PlusIcon />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.label}>{t('entities.config.used')}</div>
              <div className={styles.value}>
                <div className={styles.progressContainer}>
                  {usedGb} GB / {totalGb} GB
                  <ProgressBar value={(usedGb / totalGb) * 100} type="error" />
                </div>
              </div>
            </>
          )}
        </div>
        {!isEditingMode && (
          <>
            <div className={styles.item}>
              <div className={styles.label}>{t('entities.config.connection')}</div>
              <div className={styles.value}>
                <span className={styles.url}>{connectionUrl || '-'}</span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  handleCopy();
                }}
                title={t('entities.config.copyToClipboard')}
              >
                <CopyIcon />
              </Button>
            </div>
          </>
        )}
      </div>
      <div className={styles.footer}>
        {(() => {
          const hasChanges = newIpLimit !== ipLimit || newTotalGb !== totalGb;
          const canShowRenew = showRenewButton && !updatePending;

          if (isEditingMode) {
            return (
              <Button variant="success" onClick={handleSave} title={t('common.save')} fullWidth={true} disabled={!hasChanges}>
                {t('common.save')}
              </Button>
            );
          }

          if (canShowRenew) {
            return (
              <Button variant="primary" onClick={handleRenew} title={t('entities.config.renew')} fullWidth={true}>
                {t('entities.config.renew')}
              </Button>
            );
          }

          return null;
        })()}
      </div>
    </div>
  );
}
