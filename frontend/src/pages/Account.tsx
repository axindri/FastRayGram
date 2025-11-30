import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContent, PageHeader, Section, Card, InlineSetting, SegmentControl, PageLoader, UserProfile, type SessionProps, Session, LoaderIcon } from '@/components';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services';
import type { AccountProfile } from '@/services';
import { toast } from 'react-hot-toast';
import { formatTime } from '@/utils';
import { getThemes, getLanguages } from '@/config/settings';
import { useTranslation } from '@/hooks/useTranslation';
import styles from './Account.module.css';

export function Account() {
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [sessions, setSessions] = useState<SessionProps[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await apiClient.getProfile();
        setProfile(profileData);
        const sessionsData: SessionProps[] = profileData.sessions.map(session => ({
          id: session.id,
          isCurrent: session.is_current,
          name: session.session_name || session.user_agent || 'Unknown',
          device: session.device_info || 'Unknown',
          ip: session.ip_address || 'Unknown',
          lastActivity: formatTime(session.last_activity),
          expiresAt: formatTime(session.expires_at),
        }));
        setSessions(sessionsData);
      } catch (error: any) {
        toast.error(error.message || t('forms.errors.failedToLoadProfile'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSessionTerminated = (sessionId: string) => {
    setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
  };

  const handleThemeSelect = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
  };

  const handleLanguageSelect = async (language: 'en' | 'ru') => {
    try {
      setIsUpdatingLanguage(true);
      await apiClient.updateProfile({ lang_code: language });
      setLanguage(language);
      toast.success(t('forms.success.languageUpdated'));
    } catch (error: any) {
      toast.error(error.message || t('forms.errors.failedToUpdateLanguage'));
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleChangeProfile = () => {
    navigate('/update-profile');
  };

  const currentSessions = sessions.filter(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <>
      <PageHeader title={t('pages.account.title')} description={t('pages.account.description')} />
      <PageContent>
        {isLoading || !profile ? (
          <PageLoader text={t('pages.account.loadingAccountInfo')} />
        ) : (
          <>
            <UserProfile profile={profile} onProfileChange={handleChangeProfile} onPasswordChange={handleChangePassword} />
            <Section title={t('pages.account.appSettings')}>
              <Card>
                <InlineSetting label={`${t('common.theme')}:`}>
                  <SegmentControl items={getThemes()} selectedItem={theme} onSelect={item => handleThemeSelect(item.label as 'light' | 'dark' | 'system')} />
                </InlineSetting>
                <InlineSetting label={`${t('common.language')}:`}>
                  <div className={styles.languageWrapper}>
                    {isUpdatingLanguage && (
                      <div className={styles.languageLoader}>
                        <LoaderIcon />
                      </div>
                    )}
                    <SegmentControl items={getLanguages()} selectedItem={language} onSelect={item => handleLanguageSelect(item.label as 'en' | 'ru')} disabled={isUpdatingLanguage} />
                  </div>
                </InlineSetting>
              </Card>
            </Section>
            {currentSessions.length > 0 && (
              <Section title={t('pages.account.activeSessions')}>
                {currentSessions.map(session => (
                  <Session
                    key={session.id}
                    id={session.id}
                    isCurrent={session.isCurrent}
                    name={session.name}
                    device={session.device}
                    ip={session.ip}
                    lastActivity={session.lastActivity}
                    expiresAt={session.expiresAt}
                    onSessionTerminated={handleSessionTerminated}
                  />
                ))}
              </Section>
            )}
            {otherSessions.length > 0 && (
              <Section>
                {otherSessions.map(session => (
                  <Session
                    key={session.id}
                    id={session.id}
                    isCurrent={session.isCurrent}
                    name={session.name}
                    device={session.device}
                    ip={session.ip}
                    lastActivity={session.lastActivity}
                    expiresAt={session.expiresAt}
                    onSessionTerminated={handleSessionTerminated}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </PageContent>
    </>
  );
}
