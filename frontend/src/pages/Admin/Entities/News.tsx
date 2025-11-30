import { useNavigate } from 'react-router-dom';
import { EntitiesPage } from '@/components';
import { adminApiClient, type News } from '@/services';
import { NewsMenuItem } from '@/components/entities';
import { useTranslation } from '@/hooks/useTranslation';

export function News() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNewsClick = (newsId: string) => {
    navigate(`/admin/news/${newsId}`);
  };

  const handleCreateClick = () => {
    navigate('/admin/news/new');
  };

  return (
    <EntitiesPage<News>
      entityName="news"
      description={t('admin.news.list')}
      fetchData={page => adminApiClient.getNews(page)}
      renderItem={news => <NewsMenuItem key={news.id} news={news} onItemClick={handleNewsClick} />}
      onItemClick={handleNewsClick}
      backPath="/admin"
      onNewEntityCreate={handleCreateClick}
    />
  );
}
