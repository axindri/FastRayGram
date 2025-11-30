import { useNavigate } from 'react-router-dom';
import { EntitiesPage } from '@/components';
import { adminApiClient, type Config } from '@/services';
import { ConfigMenuItem } from '@/components/entities';
import { useTranslation } from '@/hooks/useTranslation';

export function Configs() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleConfigClick = (configId: string) => {
    navigate(`/admin/configs/${configId}`);
  };

  return (
    <EntitiesPage<Config>
      entityName="configs"
      description={t('admin.configs.list')}
      fetchData={page => adminApiClient.getConfigs(page)}
      renderItem={config => <ConfigMenuItem key={config.id} config={config} onItemClick={handleConfigClick} />}
      backPath="/admin"
      onItemClick={handleConfigClick}
    />
  );
}
