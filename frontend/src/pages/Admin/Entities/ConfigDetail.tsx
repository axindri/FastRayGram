import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageHeader, PageContent, Button, PageLoader, ChevronLeftIcon, ConfigDetail as ConfigDetailComponent, ConfigActions } from '@/components';
import { adminApiClient, type Config } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export function ConfigDetail() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (uuid) {
      loadConfig();
    }
  }, [uuid]);

  const loadConfig = async () => {
    if (!uuid) return;
    try {
      setIsLoading(true);
      const configData = await adminApiClient.getConfig(uuid);
      setConfig(configData);
    } catch (error: any) {
      toast.error(error.message || t('admin.configs.failedToLoad'));
      navigate('/admin/configs');
    } finally {
      setIsLoading(false);
    }
  };

  if (!uuid) return;
  const handleAddTime = async () => {
    try {
      setIsProcessing(true);
      await adminApiClient.addTimeToConfig(uuid);
      toast.success(t('admin.configs.timeAddedSuccess'));
      loadConfig();
    } catch (error: any) {
      toast.error(error.message || t('admin.configs.failedToAddTime'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveTime = async () => {
    try {
      setIsProcessing(true);
      await adminApiClient.removeTimeFromConfig(uuid);
      toast.success(t('admin.configs.timeRemovedSuccess'));
      loadConfig();
    } catch (error: any) {
      toast.error(error.message || t('admin.configs.failedToRemoveTime'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToConfigs = () => {
    navigate('/admin/configs');
  };

  //TODO: add user preview to understand which user is using the config

  return (
    <>
      <PageHeader
        title={t('admin.configs.title')}
        description={t('admin.configs.description')}
        backButton={
          <Button onClick={handleBackToConfigs} variant="secondary">
            <ChevronLeftIcon /> {t('admin.configs.backToConfigs')}
          </Button>
        }
      />
      <PageContent>
        {isLoading ? (
          <PageLoader text={t('admin.configs.loading')} />
        ) : config ? (
          <>
            <ConfigDetailComponent config={config} />
            <ConfigActions isProcessing={isProcessing} onAddTime={handleAddTime} onRemoveTime={handleRemoveTime} />
          </>
        ) : (
          <Navigate to="/admin/configs" />
        )}
      </PageContent>
    </>
  );
}
