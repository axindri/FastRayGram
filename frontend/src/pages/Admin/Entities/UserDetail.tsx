import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageHeader, PageContent, Button, PageLoader, ChevronLeftIcon, UserProfile, UserActions } from '@/components';
import { adminApiClient, apiClient, type AccountProfile } from '@/services';
import { ROLES } from '@/config/settings';
import { extractPassword } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function UserDetail() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<AccountProfile | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSuperuserLoading, setIsSuperuserLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    if (uuid) {
      checkIsSuperuser();
      loadUserProfile();
    }
  }, [uuid]);

  const loadUserProfile = async () => {
    if (!uuid) return;
    try {
      setIsProfileLoading(true);
      const userProfileData = await adminApiClient.getUserProfile(uuid);
      setUserProfile(userProfileData);
    } catch (error: any) {
      toast.error(error.message || t('admin.users.failedToLoad'));
      navigate('/admin/users');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const checkIsSuperuser = async () => {
    try {
      setIsSuperuserLoading(true);
      const isSuperuser = await apiClient.checkPermission(ROLES.SUPERUSER.toLowerCase());
      setIsSuperuser(isSuperuser);
    } catch (error: any) {
      toast.error(error.message || t('admin.users.failedToCheckSuperuser'));
      setIsSuperuser(false);
    } finally {
      setIsSuperuserLoading(false);
    }
  };

  if (!uuid) return;
  const handleVerify = async () => {
    try {
      setIsProcessing(true);
      await adminApiClient.verifyUser(uuid);
      toast.success(t('admin.users.verifiedSuccess'));
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || t('admin.users.failedToVerify'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnverify = async () => {
    try {
      setIsProcessing(true);
      await adminApiClient.unverifyUser(uuid);
      toast.success(t('admin.users.unverifiedSuccess'));
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || t('admin.users.failedToUnverify'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsProcessing(true);
      const newPassword = await adminApiClient.resetUserPassword(uuid);
      setNewPassword(extractPassword(newPassword));
      toast.success(t('admin.users.passwordResetSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('admin.users.failedToResetPassword'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRole = async (role: string) => {
    try {
      setIsProcessing(true);
      await adminApiClient.updateUserRole(uuid, role);
      toast.success(t('admin.users.roleUpdatedSuccess', { role }));
      loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || t('admin.users.failedToUpdateRole'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToUsers = () => {
    navigate('/admin/users');
  };

  return (
    <>
      <PageHeader
        title={t('admin.users.title')}
        description={t('admin.users.description')}
        backButton={
          <Button onClick={handleBackToUsers} variant="secondary">
            <ChevronLeftIcon /> {t('admin.users.backToUsers')}
          </Button>
        }
      />
      <PageContent>
        {isProfileLoading ? (
          <PageLoader text={t('admin.users.loading')} />
        ) : userProfile ? (
          <>
            <UserProfile profile={userProfile} />
            {isSuperuserLoading ? (
              <PageLoader text={t('admin.users.checkingSuperuser')} />
            ) : (
              <>
                <UserActions
                  profileRole={userProfile.role.name}
                  isSuperuser={isSuperuser}
                  isProcessing={isProcessing}
                  newPassword={newPassword}
                  onVerify={handleVerify}
                  onUnverify={handleUnverify}
                  onResetPassword={handleResetPassword}
                  onUpdateRole={handleUpdateRole}
                />
              </>
            )}
          </>
        ) : (
          <Navigate to="/admin/users" />
        )}
      </PageContent>
    </>
  );
}
