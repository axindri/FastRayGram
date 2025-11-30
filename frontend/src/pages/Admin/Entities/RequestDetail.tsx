import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageHeader, PageContent, Button, PageLoader, ChevronLeftIcon, Card, InfoText } from '@/components';
import { adminApiClient, type Request } from '@/services';
import { RequestDetail as RequestDetailComponent } from '@/components/entities';
import { extractPassword, copyToClipboard } from '@/utils';
import { useTranslation } from '@/hooks/useTranslation';

export function RequestDetail() {
  const { t } = useTranslation();
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState<string>('');

  useEffect(() => {
    if (uuid) {
      loadRequest();
    }
  }, [uuid]);

  const loadRequest = async () => {
    if (!uuid) return;
    try {
      setIsLoading(true);
      const requestData = await adminApiClient.getRequest(uuid);
      setRequest(requestData);
    } catch (error: any) {
      toast.error(error.message || t('admin.requests.failedToLoad'));
      navigate('/admin/requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRequests = () => {
    navigate('/admin/requests');
  };

  const handleApply = async (requestId: string) => {
    if (!request) return;
    try {
      setIsProcessing(true);
      const response = await adminApiClient.applyRequest(requestId);

      // check if response contains password
      if (response.msg.includes('Password:')) {
        const password = extractPassword(response.msg);
        setNewPassword(password);
        return;
      }

      toast.success(t('admin.requests.appliedSuccess'));
      navigate('/admin/requests');
    } catch (error: any) {
      toast.error(error.message || t('admin.requests.failedToApply'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      setIsProcessing(true);
      await adminApiClient.denyRequest(requestId);
      toast.success(t('admin.requests.deniedSuccess'));
      navigate('/admin/requests');
    } catch (error: any) {
      toast.error(error.message || t('admin.requests.failedToDeny'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEntityClick = (entityName: string, entityId: string) => {
    navigate(`/admin/${entityName.toLowerCase()}s/${entityId}`);
  };

  const handleCopyPassword = async () => {
    if (!request) return;
    await copyToClipboard(newPassword);
    toast.success(t('admin.requests.passwordCopied'), { duration: 10000 });
    navigate(`/admin/users/${request.related_id}`);
  };

  return (
    <>
      <PageHeader
        title={t('admin.requests.title')}
        description={t('admin.requests.description')}
        backButton={
          <Button onClick={handleBackToRequests} variant="secondary">
            <ChevronLeftIcon /> {t('admin.requests.backToRequests')}
          </Button>
        }
      />
      <PageContent>
        {isLoading ? (
          <PageLoader text={t('admin.requests.loading')} />
        ) : request ? (
          <>
            {!newPassword ? (
              <RequestDetailComponent request={request} onApply={handleApply} onDeny={handleDeny} onEntityClick={handleEntityClick} isProcessing={isProcessing} />
            ) : (
              <>
                <Card>
                  <InfoText>{t('admin.requests.sentNewPassword')}</InfoText>
                </Card>
                <Button variant="success" onClick={handleCopyPassword} disabled={isProcessing} fullWidth={true}>
                  {t('admin.requests.copyAndSend')}
                </Button>
              </>
            )}
          </>
        ) : (
          <Navigate to="/admin/requests" />
        )}
      </PageContent>
    </>
  );
}
