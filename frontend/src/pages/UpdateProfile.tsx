import { useEffect, useState } from 'react';
import { UpdateProfileForm, PageLoader } from '@/components';
import { apiClient } from '@/services';
import type { AccountProfile } from '@/services';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export function UpdateProfile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await apiClient.getProfile();
        setProfile(profileData);
      } catch (error: any) {
        toast.error(error.message || t('pages.updateProfile.failedToLoadProfile'));
        navigate('/account');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSuccess = () => {
    navigate('/account');
  };

  const handleCancel = () => {
    navigate('/account');
  };

  if (isLoading) {
    return <PageLoader text={t('pages.updateProfile.loadingProfile')} />;
  }

  if (!profile) {
    return null;
  }

  return <UpdateProfileForm profile={profile} onSuccess={handleSuccess} onCancel={handleCancel} />;
}

