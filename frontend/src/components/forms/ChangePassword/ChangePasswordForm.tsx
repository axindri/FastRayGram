import { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './ChangePasswordForm.module.css';
import { Input, Button } from '@/components';
import { apiClient } from '@/services';
import { useAppStore } from '@/store';
import { validatePassword } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const { setLoading, isLoading, logout } = useAppStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<{ old_password?: string; new_password?: string }>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate new password
    const newPasswordError = validatePassword(newPassword);
    const validationErrors: { old_password?: string; new_password?: string } = {};

    if (!oldPassword) {
      validationErrors.old_password = t('forms.validation.oldPasswordRequired');
    }

    if (newPasswordError) {
      validationErrors.new_password = newPasswordError;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || t('forms.validation.pleaseFixErrors'));
      return;
    }

    setLoading(true);
    try {
      await apiClient.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success(t('forms.success.passwordChanged'));
      setOldPassword('');
      setNewPassword('');
      setErrors({});
      onSuccess?.();
      logout();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || t('forms.errors.failedToChangePassword'));
      if (error.message?.includes('Invalid old password')) {
        setErrors({ old_password: t('forms.errors.invalidOldPassword') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/account');
  };

  return (
    <div className={styles.changePasswordContainer}>
      <div className={styles.changePasswordCard}>
        <h1 className={styles.title}>{t('changePassword.title')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="password"
            label={t('changePassword.currentPasswordLabel')}
            placeholder={t('changePassword.currentPasswordPlaceholder')}
            value={oldPassword}
            onChange={e => {
              setOldPassword(e.target.value);
              if (errors.old_password) {
                setErrors(prev => ({ ...prev, old_password: undefined }));
              }
            }}
            required
            disabled={isLoading}
            error={errors.old_password}
          />
          <Input
            type="password"
            label={t('changePassword.newPasswordLabel')}
            placeholder={t('changePassword.newPasswordPlaceholder')}
            value={newPassword}
            onChange={e => {
              setNewPassword(e.target.value);
              if (errors.new_password) {
                setErrors(prev => ({ ...prev, new_password: undefined }));
              }
            }}
            required
            minLength={6}
            maxLength={255}
            disabled={isLoading}
            error={errors.new_password}
          />
        </form>
        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? t('common.changingPassword') : t('changePassword.changePasswordButton')}
          </Button>
          <Button variant="secondary" fullWidth disabled={isLoading} onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
