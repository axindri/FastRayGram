import styles from './UserActions.module.css';
import { Section, Card, Button } from '@/components';
import { ROLES } from '@/config/settings';
import { copyToClipboard } from '@/utils';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';

export interface UserActionsProps {
  profileRole: string;
  isSuperuser: boolean;
  isProcessing: boolean;
  newPassword?: string;
  onVerify: () => void;
  onUnverify: () => void;
  onResetPassword: () => void;
  onUpdateRole: (roleName: string) => void;
}

export function UserActions({ profileRole, isSuperuser, isProcessing, newPassword, onVerify, onUnverify, onResetPassword, onUpdateRole }: UserActionsProps) {
  const { t } = useTranslation();
  if (profileRole.toLowerCase() === ROLES.SUPERUSER.toLowerCase()) {
    return null;
  }

  const handleCopyPassword = async () => {
    if (!newPassword) return;
    await copyToClipboard(newPassword);
    toast.success(t('features.userActions.passwordCopied'));
  };

  return (
    <Section title={t('admin.news.actions')}>
      <Card>
        <div className={styles.actions}>
          <div className={styles.actionsRow}>
            <Button variant="success" onClick={onVerify} disabled={isProcessing} fullWidth={true}>
              {t('features.userActions.verify')}
            </Button>
            <Button variant="error" onClick={onUnverify} disabled={isProcessing} fullWidth={true}>
              {t('features.userActions.unverify')}
            </Button>
          </div>

          {isSuperuser && (
            <>
              <div className={styles.actionsRow}>
                <Button variant="warning" onClick={() => onUpdateRole('admin')} disabled={isProcessing} fullWidth={true}>
                  {t('features.userActions.setAdmin')}
                </Button>
                <Button variant="secondary" onClick={() => onUpdateRole('user')} disabled={isProcessing} fullWidth={true}>
                  {t('features.userActions.setUser')}
                </Button>
              </div>
              <div className={styles.actionsRow}>
                {!newPassword ? (
                  <Button variant="warning" onClick={onResetPassword} disabled={isProcessing} fullWidth={true}>
                    {t('features.userActions.resetPassword')}
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleCopyPassword} disabled={isProcessing} fullWidth={true}>
                    {t('features.userActions.copyNewPassword')}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </Section>
  );
}
