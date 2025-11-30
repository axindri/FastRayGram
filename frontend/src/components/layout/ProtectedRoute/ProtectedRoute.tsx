import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from './ProtectedRoute.module.css';
import { useAppStore } from '@/store';
import { PageContent, PageLoader } from '@/components';
import { NotAllowed } from '@/pages/NotAllowed';
import { apiClient } from '@/services';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAppStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (!requiredRole || !user) {
        setHasPermission(true);
        return;
      }

      setIsCheckingPermission(true);
      try {
        const hasAccess = await apiClient.checkPermission(requiredRole);
        setHasPermission(hasAccess);
      } catch (error) {
        setHasPermission(false);
      } finally {
        setIsCheckingPermission(false);
      }
    };

    if (isInitialized && user && requiredRole) {
      checkPermission();
    } else if (isInitialized && user && !requiredRole) {
      setHasPermission(true);
    }
  }, [requiredRole, user, isInitialized]);

  if (!isInitialized || isLoading || (requiredRole && isCheckingPermission)) {
    return (
      <div className={styles.protectedRoute}>
        <PageContent>
          <PageLoader />
        </PageContent>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && hasPermission === false) {
    return <NotAllowed />;
  }

  if (requiredRole && hasPermission === null) {
    return (
      <div className={styles.protectedRoute}>
        <PageContent>
          <PageLoader />
        </PageContent>
      </div>
    );
  }

  return <>{children}</>;
}
