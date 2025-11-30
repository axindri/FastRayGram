import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageHeader, PageContent, Button, PageLoader, ChevronLeftIcon } from '@/components';
import { adminApiClient, type News } from '@/services';
import { NewsDetail as NewsDetailComponent } from '@/components/entities';
import { useTranslation } from '@/hooks/useTranslation';

export function NewsDetail() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const isNew = uuid === 'new';

  useEffect(() => {
    if (uuid && !isNew) {
      loadNews();
    } else if (isNew) {
      setIsLoading(false);
      setNews({
        id: '',
        title: { en: '', ru: '' },
        content: { en: '', ru: '' },
        _inserted_dttm: new Date().toISOString(),
      });
    }
  }, [uuid]);

  const loadNews = async () => {
    if (!uuid) return;
    try {
      setIsLoading(true);
      const newsData = await adminApiClient.getNewsItem(uuid);
      setNews(newsData);
    } catch (error: any) {
      toast.error(error.message || t('admin.news.failedToLoad'));
      navigate('/admin/news');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToNews = () => {
    navigate('/admin/news');
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/admin/news');
    } else {
      setIsEditMode(false);
      loadNews();
    }
  };

  const handleSave = async (newsData: { title: { en: string; ru: string }; content: { en: string; ru: string } }) => {
    if (!news) return;
    try {
      setIsProcessing(true);
      if (isNew) {
        await adminApiClient.createNews(newsData);
        toast.success(t('admin.news.createdSuccess'));
        navigate('/admin/news');
      } else {
        await adminApiClient.updateNews(news.id, newsData);
        toast.success(t('admin.news.updatedSuccess'));
        setIsEditMode(false);
        loadNews();
      }
    } catch (error: any) {
      toast.error(error.message || (isNew ? t('admin.news.failedToSave') : t('admin.news.failedToSave')));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!news || isNew) return;
    try {
      setIsProcessing(true);
      await adminApiClient.deleteNews(news.id);
      toast.success(t('admin.news.deletedSuccess'));
      navigate('/admin/news');
    } catch (error: any) {
      toast.error(error.message || t('admin.news.failedToDelete'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isNew ? t('admin.news.create') : t('admin.news.details')}
        description={isNew ? t('admin.news.createDescription') : t('admin.news.detailsDescription')}
        backButton={
          <Button onClick={handleBackToNews} variant="secondary">
            <ChevronLeftIcon /> {t('admin.news.backToNews')}
          </Button>
        }
      />
      <PageContent>
        {isLoading ? (
          <PageLoader text={isNew ? t('admin.news.initializing') : t('admin.news.loading')} />
        ) : news ? (
          <NewsDetailComponent
            news={news}
            onEdit={isEditMode ? undefined : handleEdit}
            onDelete={isEditMode || isNew ? undefined : handleDelete}
            isProcessing={isProcessing}
            isEditMode={isEditMode || isNew}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Navigate to="/admin/news" />
        )}
      </PageContent>
    </>
  );
}
