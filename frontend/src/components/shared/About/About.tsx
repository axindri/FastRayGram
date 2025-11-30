import styles from './About.module.css';
import { Card, FreeIcon, OpenSourceIcon, EncryptionIcon, HeartIcon } from '@/components';
import { useTranslation, Trans } from 'react-i18next';

export interface AboutProps {
  githubUrl?: string;
}

export function About({ githubUrl }: AboutProps) {
  const { t } = useTranslation();
  return (
    <Card title="Fast Ray Gram">
      <div className={styles.container}>
        <p className={styles.paragraph}>
          <span className={styles.icon}>
            <FreeIcon />
          </span>
          <span>
            <Trans
              i18nKey="about.free.text"
              components={{
                highlight: <span className={styles.highlight} />,
              }}
            />
          </span>
        </p>

        <p className={styles.paragraph}>
          <span className={styles.icon}>
            <OpenSourceIcon />
          </span>
          <span>
            <Trans
              i18nKey="about.openSource.text"
              components={{
                highlight: <span className={styles.highlight} />,
              }}
            />
          </span>
        </p>

        <p className={styles.paragraph}>
          <span className={styles.icon}>
            <EncryptionIcon />
          </span>
          <span>{t('about.encryption.text')}</span>
        </p>

        <p className={styles.paragraph}>
          <span className={styles.icon}>
            <HeartIcon />
          </span>
          <span>
            {githubUrl ? (
              <>
                {t('about.heart.textBeforeLink')}{' '}
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {t('about.heart.githubPage')}
                </a>
                {t('about.heart.textAfterLink')}
              </>
            ) : (
              t('about.heart.text')
            )}
          </span>
        </p>
      </div>
    </Card>
  );
}
