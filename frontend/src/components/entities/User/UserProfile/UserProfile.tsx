import styles from './UserProfile.module.css';
import { Info, InfoCard, Card, Section } from '@/components';
import type { AccountProfile } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export interface UserProfileProps {
  profile: AccountProfile;
  onProfileChange?: () => void;
  onPasswordChange?: () => void;
}

export function UserProfile({ profile, onProfileChange, onPasswordChange }: UserProfileProps) {
  const fullName = [profile.profile.first_name, profile.profile.last_name].filter(Boolean).join(' ') || '-';

  const { t } = useTranslation();
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'verified':
        return { text: t('status.verified'), type: 'success' as const };
      case 'verification_pending':
        return { text: t('status.verificationPending'), type: 'info' as const };
      case 'not_verified':
      default:
        return { text: t('status.notVerified'), type: 'error' as const };
    }
  };

  const statusInfo = getStatusInfo(profile.user.status);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Section title={t('entities.userProfile.accountInformation')}>
          <InfoCard title={fullName} statusText={statusInfo.text} status={statusInfo.type}>
            <div className={styles.infoContainer}>
              <Info title={t('entities.userProfile.login')} value={profile.user.login} />
              {onProfileChange && (
                <span className={styles.changeLink} onClick={onProfileChange}>
                  {t('entities.userProfile.editProfile')}
                </span>
              )}
            </div>
            <div className={styles.infoContainer}>
              <Info title={t('entities.userProfile.email')} value={profile.profile.email || '-'} />
            </div>
            {onPasswordChange && (
              <div className={styles.infoContainer}>
                <Info title={t('entities.userProfile.password')} value="••••••" />

                <span className={styles.changeLink} onClick={onPasswordChange}>
                  {t('entities.userProfile.changePassword')}
                </span>
              </div>
            )}
          </InfoCard>

          {profile.socials.length > 0 && (
            <Card title={t('entities.userProfile.social')}>
              {profile.socials.map((social, index) => {
                const isTelegram = social.name.toLowerCase() === 'telegram';
                const telegramLink = isTelegram && social.email ? `https://t.me/${social.email}` : null;
                const emailLink = !isTelegram && social.email ? `mailto:${social.email}` : null;

                return (
                  <div key={index} className={styles.socialItem}>
                    <Info title={`${social.name[0].toUpperCase() + social.name.slice(1)}:`} value={social.login} />
                    {social.email &&
                      (isTelegram && telegramLink ? (
                        <div className={styles.info}>
                          <div className={styles.title}>{t('entities.userProfile.username')}</div>
                          <div className={styles.value}>
                            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
                              @{social.email}
                            </a>
                          </div>
                        </div>
                      ) : emailLink ? (
                        <div className={styles.info}>
                          <div className={styles.title}>{t('entities.userProfile.email')}</div>
                          <div className={styles.value}>
                            <a href={emailLink} className={styles.link}>
                              {social.email}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <Info title={t('entities.userProfile.email')} value={social.email} />
                      ))}
                  </div>
                );
              })}
            </Card>
          )}
        </Section>
      </div>
    </div>
  );
}
