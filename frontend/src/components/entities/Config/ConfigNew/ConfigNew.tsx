import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ConfigNew.module.css';
import { apiClient } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export interface ConfigNewProps {
  name: string;
}

export function ConfigNew({ name }: ConfigNewProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleCreate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const config = await apiClient.getOrCreateConfigByType(name);
      console.log('Config created', config);
      toast.success(t('entities.configNew.configCreatedSuccess', { name }));
      navigate(0);
    } catch (error: any) {
      toast.error(error.message || t('entities.configNew.failedToCreateConfig'));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={styles.newConfig} onClick={handleCreate}>
      {isLoading ? <div>{t('entities.configNew.creating')}</div> : <div>{name}</div>}
    </div>
  );
}
