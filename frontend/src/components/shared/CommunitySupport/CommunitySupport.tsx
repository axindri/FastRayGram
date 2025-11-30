import styles from './CommunitySupport.module.css';
import { Card, InfoText, Button, HelpIcon, ContributorsIcon, HeartIcon } from '@/components';
import { useTranslation } from 'react-i18next';

export interface Contributor {
  name: string;
  github: string;
  role?: string;
}

export interface CommunitySupportProps {
  telegramGroupUrl?: string;
  contributors: Contributor[];
  githubUrl?: string;
  donationUrl?: string;
}

export function CommunitySupport({ telegramGroupUrl, contributors, githubUrl, donationUrl }: CommunitySupportProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.section}>
          {telegramGroupUrl && (
            <>
              <div className={styles.sectionTitle}>
                <HelpIcon />
                <span>{t('communitySupport.needHelp.title')}</span>
              </div>

              <div className={styles.sectionText}>
                {t('communitySupport.needHelp.textBeforeLink')}{' '}
                <a href={telegramGroupUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {t('communitySupport.needHelp.telegramGroup')}
                </a>{' '}
                {t('communitySupport.needHelp.textAfterLink')}
              </div>
            </>
          )}
        </div>
        {donationUrl && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <HeartIcon />
              <span>{t('communitySupport.supportDevelopment.title')}</span>
            </div>
            <div className={styles.sectionText}>{t('communitySupport.supportDevelopment.text')}</div>
            <Button
              variant="secondary"
              onClick={() => {
                window.open(donationUrl, '_blank', 'noopener,noreferrer');
              }}
              className={styles.donateButton}
            >
              {t('communitySupport.supportDevelopment.donate')}
            </Button>
          </div>
        )}
        {githubUrl && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <ContributorsIcon />
              <span>{t('communitySupport.contributors.title')}</span>
            </div>
            <div className={styles.contributorsList}>
              {contributors.map((contributor, index) => (
                <div key={index} className={styles.contributor}>
                  <a href={contributor.github} target="_blank" rel="noopener noreferrer" className={styles.contributorLink}>
                    {contributor.name}
                  </a>
                  {contributor.role && <span className={styles.contributorRole}>• {contributor.role}</span>}
                </div>
              ))}
            </div>

            <InfoText>
              {t('communitySupport.contributors.wantToContributeBefore')}{' '}
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {t('communitySupport.contributors.github')}
              </a>
              {t('communitySupport.contributors.wantToContributeAfter')}
            </InfoText>
          </div>
        )}
      </div>
    </Card>
  );
}
