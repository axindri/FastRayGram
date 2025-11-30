import { useNavigate } from 'react-router-dom';
import { Button, PageContent, PageHeader, Section } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export function NotAllowed() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageContent>
      <PageHeader title={t('pages.notAllowed.title')} />
      <Section>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>{t('pages.notAllowed.message')}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            {t('pages.notAllowed.goToHome')}
          </Button>
        </div>
      </Section>
    </PageContent>
  );
}
