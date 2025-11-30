import { useState } from 'react';
import { Button, Card } from '@/components';
import { apiClient } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export function NotVerified({ isPending }: { isPending: boolean }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [sendRequest, setSendRequest] = useState(false);
  const handleVerifyAccount = async () => {
    try {
      setIsLoading(true);
      await apiClient.verifyAccount();
      setIsLoading(false);
    } catch (error: any) {
      console.error(error.message || t('feedback.notVerified.failedToVerify'));
    } finally {
      setSendRequest(true);
      setIsLoading(false);
    }
  };
  return (
    <Card
      title={isPending || sendRequest ? t('feedback.notVerified.verifyingRequested') : t('feedback.notVerified.accountNotVerified')}
      footer={
        !isPending &&
        !sendRequest && (
          <Button onClick={handleVerifyAccount} disabled={isLoading || isPending || sendRequest}>
            {isLoading ? t('feedback.notVerified.verifying') : t('feedback.notVerified.verifyAccount')}
          </Button>
        )
      }
    >
      {isPending || sendRequest ? <div>{t('feedback.notVerified.waitForVerification')}</div> : <div>{t('feedback.notVerified.pleaseVerify')}</div>}
    </Card>
  );
}
