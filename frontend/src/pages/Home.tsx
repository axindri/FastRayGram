import { Card, PageContent, PageHeader, Section, CommunitySupport, About, PageLoader, DebugMenu } from '@/components';
import { TELEGRAM_GROUP_URL, DONATION_URL, GITHUB_URL, CONTRIBUTORS, APP_VERSION, DEBUG_MENU_COUNTER } from '@/config/settings';
import type { News } from '@/services';
import { useState, useEffect } from 'react';
import { apiClient } from '@/services';
import { toast } from 'react-hot-toast';
import { useAppStore } from '@/store';
import { getLocalizedText } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function Home() {
  const { language } = useAppStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const [debugCounter, setDebugCounter] = useState(0);

  const handleDebugCounter = () => {
    if (debugCounter === 0) {
      toast.success(t('pages.home.tapToShowDebug', { count: DEBUG_MENU_COUNTER }));
    }
    setDebugCounter(prev => prev + 1);
  };

  useEffect(() => {
    const loadNews = async () => {
      setIsLoading(true);
      try {
        const newsData = await apiClient.getNews();
        setNews(newsData.data);
      } catch (error: any) {
        toast.error(error.message || t('forms.errors.failedToLoadNews'));
      } finally {
        setIsLoading(false);
      }
    };
    loadNews();
  }, []);

  return (
    <>
      <PageHeader title={t('pages.home.title')} description={t('pages.home.description')} />
      <PageContent>
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            {news.length > 0 && (
              <Section title={t('pages.home.news')}>
                {news.map(newsItem => (
                  <Card key={newsItem.id} title={getLocalizedText(newsItem.title, language)}>
                    {getLocalizedText(newsItem.content, language)}
                  </Card>
                ))}
              </Section>
            )}
            <Section title={t('pages.home.about')}>
              <About githubUrl={GITHUB_URL} />
            </Section>
            {(TELEGRAM_GROUP_URL || DONATION_URL || GITHUB_URL) && (
              <Section title={t('pages.home.communitySupport')}>
                <CommunitySupport telegramGroupUrl={TELEGRAM_GROUP_URL} contributors={CONTRIBUTORS} githubUrl={GITHUB_URL} donationUrl={DONATION_URL} />
              </Section>
            )}
            {debugCounter >= DEBUG_MENU_COUNTER && <DebugMenu />}
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', cursor: 'pointer' }} onClick={handleDebugCounter}>
              <p>{t('pages.home.appVersion', { version: APP_VERSION })}</p>
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
