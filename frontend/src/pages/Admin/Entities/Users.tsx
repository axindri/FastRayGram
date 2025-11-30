import { useNavigate } from 'react-router-dom';
import { EntitiesPage } from '@/components';
import { adminApiClient, type UserListItem } from '@/services';
import { UserMenuItem } from '@/components/entities';
import type { RoleListItem } from '@/services/api/types';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';

export function Users() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleListItem[]>([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await adminApiClient.getRoles();
      setRoles(response.data);
    } catch (error) {
      toast.error(t('admin.users.errorFetchingRoles'));
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <EntitiesPage<UserListItem>
      entityName="users"
      description={t('admin.users.list')}
      fetchData={page => adminApiClient.getUsers(page)}
      renderItem={user => <UserMenuItem key={user.id} user={user} roles={roles} onItemClick={handleUserClick} />}
      onItemClick={handleUserClick}
      backPath="/admin"
    />
  );
}
