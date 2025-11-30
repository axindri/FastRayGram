import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './RegisterForm.module.css';
import { Input, Button } from '@/components';
import { apiClient, type RegisterRequest } from '@/services';
import { useAppStore } from '@/store';
import { parseValidationError, validateRegisterForm, hasValidationErrors, type ValidationErrors } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function RegisterForm() {
  const { t } = useTranslation();
  const { setLoading, isLoading } = useAppStore();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [langCode, setLangCode] = useState<'ru' | 'en'>('ru');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const registerRequest: RegisterRequest = {
      user: {
        login: login.trim(),
        password: password.trim(),
      },
      profile: {
        first_name: firstName.trim(),
        last_name: lastName?.trim() || undefined,
        lang_code: langCode.trim(),
        email: email?.trim() || undefined,
      },
    };

    // Validate form data
    const validationErrors = validateRegisterForm(registerRequest);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || t('forms.validation.pleaseFixErrors'));
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.register(registerRequest);

      if ('detail' in response) {
        const errorMessage = parseValidationError(response);
        toast.error(`${t('forms.errors.validationError')}: ${errorMessage}`);
        return;
      }

      if ('msg' in response) {
        toast.success(response.msg || t('forms.success.registered'));
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.detail || t('forms.errors.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>{t('register.title')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="text"
            label={t('register.loginLabel')}
            placeholder={t('register.loginPlaceholder')}
            value={login}
            onChange={e => {
              setLogin(e.target.value);
              if (errors.login) {
                setErrors(prev => ({ ...prev, login: undefined }));
              }
            }}
            required
            minLength={6}
            maxLength={20}
            disabled={isLoading}
            error={errors.login}
          />
          <Input
            type="password"
            label={t('register.passwordLabel')}
            placeholder={t('register.passwordPlaceholder')}
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors(prev => ({ ...prev, password: undefined }));
              }
            }}
            required
            minLength={6}
            disabled={isLoading}
            error={errors.password}
            maxLength={255}
          />
          <Input
            type="text"
            label={t('register.firstNameLabel')}
            placeholder={t('register.firstNamePlaceholder')}
            value={firstName}
            onChange={e => {
              setFirstName(e.target.value);
              if (errors.first_name) {
                setErrors(prev => ({ ...prev, first_name: undefined }));
              }
            }}
            required
            disabled={isLoading}
            error={errors.first_name}
          />
          <Input
            type="text"
            label={t('register.lastNameLabel')}
            placeholder={t('register.lastNamePlaceholder')}
            value={lastName}
            onChange={e => {
              setLastName(e.target.value);
              if (errors.last_name) {
                setErrors(prev => ({ ...prev, last_name: undefined }));
              }
            }}
            disabled={isLoading}
            error={errors.last_name}
          />
          <Input
            type="email"
            label={t('register.emailLabel')}
            placeholder={t('register.emailPlaceholder')}
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: undefined }));
              }
            }}
            disabled={isLoading}
            error={errors.email}
          />
          <div className={styles.langSelect}>
            <label className={styles.langLabel}>{t('register.languageLabel')}</label>
            <select value={langCode} onChange={e => setLangCode(e.target.value as 'ru' | 'en')} className={styles.select} disabled={isLoading}>
              <option value="ru">{t('common.russian')}</option>
              <option value="en">{t('common.english')}</option>
            </select>
          </div>
        </form>
        <div className={styles.notice}>
          <span className={styles.loginLink}>
            {t('register.alreadyHaveAccount')} <Link to="/login">{t('register.loginLink')}</Link>
          </span>
        </div>
        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? t('common.registering') : t('register.registerButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
