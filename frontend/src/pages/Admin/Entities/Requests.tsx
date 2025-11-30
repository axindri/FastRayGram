import { useNavigate } from 'react-router-dom';
import { EntitiesPage } from '@/components';
import { adminApiClient, type Request } from '@/services';
import { RequestMenuItem } from '@/components/entities';
import { useTranslation } from '@/hooks/useTranslation';

export function Requests() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRequestClick = (requestId: string) => {
    navigate(`/admin/requests/${requestId}`);
  };

  return (
    <EntitiesPage<Request>
      entityName="requests"
      description={t('admin.requests.list')}
      fetchData={page => adminApiClient.getRequests(page)}
      renderItem={request => <RequestMenuItem key={request.id} request={request} onItemClick={handleRequestClick} />}
      onItemClick={handleRequestClick}
      backPath="/admin"
    />
  );
}
