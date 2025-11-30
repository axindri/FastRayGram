import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './LoginForm.module.css';
import { Input, Button } from '@/components';
import { useAppStore } from '@/store';
import { apiClient } from '@/services';
import { isTelegramWebAppAvailable, initializeTelegramWebApp, prepareTelegramLoginData } from '@/utils';
import { TELEGRAM_BOT_URL } from '@/config/settings';
import { useTranslation } from '@/hooks/useTranslation';

interface LoginErrors {
  login?: string;
  password?: string;
}

export function LoginForm() {
  const { login: loginUser, telegramLogin, isLoading } = useAppStore();
  const { t } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: LoginErrors = {};

    if (!login.trim()) {
      newErrors.login = t('forms.validation.fieldRequired');
    }

    if (!password.trim()) {
      newErrors.password = t('forms.validation.fieldRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await loginUser(login.trim(), password.trim());
      toast.success(t('forms.success.loggedIn'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('forms.errors.loginFailed'));
    }
  };

  const handleTelegramLogin = async () => {
    if (!isTelegramWebAppAvailable()) {
      toast.error(t('forms.errors.telegramLoginNotAvailable'));
      return;
    }

    initializeTelegramWebApp();

    const telegramData = prepareTelegramLoginData();
    if (!telegramData) {
      toast.error(t('forms.errors.telegramLoginNotAvailable'));
      return;
    }

    try {
      await telegramLogin(telegramData);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('forms.errors.telegramLoginFailed'));
    }
  };

  const handleGoToTelegramBot = () => {
    if (TELEGRAM_BOT_URL) {
      window.open(TELEGRAM_BOT_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const handleForgotPassword = async () => {
    if (!login.trim()) {
      toast.error(t('forms.validation.enterLogin'));
      return;
    }

    try {
      await apiClient.forgotPassword({ login });
      toast.success(t('forms.success.resetPasswordRequested'));
    } catch (error: any) {
      toast.error(error.message || t('forms.errors.resetPasswordFailed'));
    }
  };

  const isTelegramAvailable = isTelegramWebAppAvailable();
  const isTelegramData = prepareTelegramLoginData();

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>{t('login.title')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="text"
            label={t('login.loginLabel')}
            placeholder={t('login.loginPlaceholder')}
            value={login}
            onChange={e => {
              setLogin(e.target.value);
              if (errors.login) {
                setErrors(prev => ({ ...prev, login: undefined }));
              }
            }}
            required
            disabled={isLoading}
            error={errors.login}
          />
          <Input
            type="password"
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: undefined }));
              }
            }}
            required
            disabled={isLoading}
            error={errors.password}
          />
          <span className={styles.registerLink}>
            {t('login.forgotPassword')}{' '}
            <span className={styles.noticeLink} onClick={handleForgotPassword}>
              {t('login.reset')}
            </span>
          </span>
        </form>

        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? t('common.loggingIn') : t('login.loginButton')}
          </Button>
          {TELEGRAM_BOT_URL && (
            <>
              {isTelegramAvailable && isTelegramData ? (
                <Button type="button" variant="secondary" fullWidth disabled={isLoading} onClick={handleTelegramLogin}>
                  {t('login.loginWithTelegram')}
                </Button>
              ) : (
                <Button type="button" variant="secondary" fullWidth disabled={isLoading} onClick={handleGoToTelegramBot}>
                  {t('login.loginWithTelegram')}
                </Button>
              )}
            </>
          )}
          <div className={styles.notice}>
            <span className={styles.registerLink}>
              {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
