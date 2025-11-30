import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './UpdateProfileForm.module.css';
import { Input, Button } from '@/components';
import { apiClient, type AccountProfile } from '@/services';
import { useAppStore } from '@/store';
import { validateName, validateLastName, validateEmail } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export interface UpdateProfileFormProps {
  profile: AccountProfile;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const normalizeEmail = (email: string | null | undefined): string => {
  if (!email || email === 'user@example.com') {
    return '';
  }
  return email;
};

export function UpdateProfileForm({ profile, onSuccess, onCancel }: UpdateProfileFormProps) {
  const { t } = useTranslation();
  const { setLoading, isLoading, language, setLanguage } = useAppStore();
  const [firstName, setFirstName] = useState(profile.profile.first_name);
  const [lastName, setLastName] = useState(profile.profile.last_name || '');
  const [email, setEmail] = useState(normalizeEmail(profile.profile.email));
  const [langCode, setLangCode] = useState<'en' | 'ru'>(profile.profile.lang_code as 'en' | 'ru' || language);
  const [errors, setErrors] = useState<{ first_name?: string; last_name?: string; email?: string }>({});

  useEffect(() => {
    setFirstName(profile.profile.first_name);
    setLastName(profile.profile.last_name || '');
    setEmail(normalizeEmail(profile.profile.email));
    setLangCode((profile.profile.lang_code as 'en' | 'ru') || language);
  }, [profile, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const firstNameError = validateName(firstName.trim(), t('profile.firstName'));
    const lastNameError = validateLastName(lastName.trim() || undefined);
    const emailError = validateEmail(email.trim() || undefined);

    const validationErrors: { first_name?: string; last_name?: string; email?: string } = {};

    if (firstNameError) {
      validationErrors.first_name = firstNameError;
    }
    if (lastNameError) {
      validationErrors.last_name = lastNameError;
    }
    if (emailError) {
      validationErrors.email = emailError;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError || t('forms.validation.pleaseFixErrors'));
      return;
    }

    setLoading(true);
    try {
      const profileUpdate = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim() || undefined,
        lang_code: langCode,
      };

      await apiClient.updateProfile(profileUpdate);
      setLanguage(langCode);
      toast.success(t('forms.success.profileUpdated'));
      setErrors({});
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || t('forms.errors.failedToUpdateProfile'));
      if (error.message?.includes('email')) {
        setErrors(prev => ({ ...prev, email: t('forms.errors.emailAlreadyInUse') }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.updateProfileContainer}>
      <div className={styles.updateProfileCard}>
        <h1 className={styles.title}>{t('profile.updateProfile')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="text"
            label={t('profile.firstName')}
            placeholder={t('profile.firstName')}
            value={firstName}
            onChange={e => {
              setFirstName(e.target.value);
              if (errors.first_name) {
                setErrors(prev => ({ ...prev, first_name: undefined }));
              }
            }}
            required
            minLength={1}
            maxLength={255}
            disabled={isLoading}
            error={errors.first_name}
          />
          <Input
            type="text"
            label={t('profile.lastName')}
            placeholder={t('profile.lastNameOptional')}
            value={lastName}
            onChange={e => {
              setLastName(e.target.value);
              if (errors.last_name) {
                setErrors(prev => ({ ...prev, last_name: undefined }));
              }
            }}
            minLength={1}
            maxLength={255}
            disabled={isLoading}
            error={errors.last_name}
          />
          <Input
            type="email"
            label={t('profile.email')}
            placeholder={t('profile.emailOptional')}
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
            <label className={styles.langLabel}>{t('profile.language')}</label>
            <select value={langCode} onChange={e => setLangCode(e.target.value as 'en' | 'ru')} className={styles.select} disabled={isLoading}>
              <option value="ru">{t('common.russian')}</option>
              <option value="en">{t('common.english')}</option>
            </select>
          </div>
        </form>
        <div className={styles.actions}>
          <Button type="submit" fullWidth disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? t('common.updating') : t('common.saveChanges')}
          </Button>
          {onCancel && (
            <Button variant="secondary" fullWidth disabled={isLoading} onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

