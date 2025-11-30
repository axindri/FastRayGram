import { Card, Info, Section, Session } from '@/components';
import { useAppStore } from '@/store';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient, type AccountProfile } from '@/services';
import { useEffect, useState } from 'react';
import { formatTime } from '@/utils';
import { tokenStorage } from '@/services/api/tokenStorage';
import { getTokenExpiration } from '@/utils/jwt';

export function DebugMenu() {
  const { t } = useTranslation();
  const { isTelegramInited, user } = useAppStore();
  const [sessions, setSessions] = useState<AccountProfile['sessions']>([]);
  const [refreshTokenExpiresAt, setRefreshTokenExpiresAt] = useState<string | null>(null);

  const getUserSessions = async () => {
    try {
      const profile = await apiClient.getProfile();
      setSessions(profile.sessions);
    } catch (error) {
      console.error('Failed to get user sessions', error);
    }
  };

  const getRefreshTokenExpiresAt = async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) return;
      const exp = getTokenExpiration(refreshToken);
      if (!exp) return;
      const expDate = new Date(exp * 1000).toISOString().split('Z')[0];
      console.log(`[DebugMenu] Refresh token expires at: ${expDate}`);
      setRefreshTokenExpiresAt(expDate);
    } catch (error) {
      console.error('Failed to get refresh token expires at', error);
    }
  };

  useEffect(() => {
    getUserSessions();
    getRefreshTokenExpiresAt();
  }, []);

  return (
    <>
      <Section title={t('features.debugMenu.title')}>
        <Card>
          {user && (
            <>
              <Info title={t('features.debugMenu.userId')} value={user.id} />
              <Info title={t('features.debugMenu.userRole')} value={user.role} />
            </>
          )}
          {!user && <Info title={t('features.debugMenu.user')} value={t('features.debugMenu.notLoggedIn')} />}
          <Info title={t('features.debugMenu.isTelegramInitialized')} value={isTelegramInited ? t('common.yes') : t('common.no')} />
          <Info title={t('features.debugMenu.refreshTokenExpiresAt')} value={formatTime(refreshTokenExpiresAt || '')} />
        </Card>
        <Section title={t('pages.account.activeSessions')}>
          {sessions.length > 0 &&
            sessions.map(session => (
              <Session
                key={session.id}
                id={session.id}
                isCurrent={session.is_current}
                name={session.session_name || 'Unknown'}
                device={session.device_info || 'Unknown'}
                ip={session.ip_address || 'Unknown'}
                lastActivity={formatTime(session.last_activity)}
                expiresAt={formatTime(session.expires_at)}
                showExpiresAt={true}
              />
            ))}
        </Section>
      </Section>
    </>
  );
}
