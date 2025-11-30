import { useNavigate } from 'react-router-dom';
import { PageContent, Section, Button } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <PageContent>
        <Section>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>{t('pages.notFound.title')}</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
              {t('pages.notFound.message')}
              <br />
              {t('pages.notFound.comeBack')}
            </p>
            <Button onClick={() => navigate('/')} variant="primary">
              {t('pages.notFound.backButton')}
            </Button>
          </div>
        </Section>
      </PageContent>
    </>
  );
}
