import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PageHeader, PageContent, Section, Button, Pagination, PageLoader, ChevronLeftIcon, Card } from '@/components';
import type { PagedResponse } from '@/services';
import { useTranslation } from '@/hooks/useTranslation';

export interface EntitiesPageProps<T> {
  entityName: string;
  fetchData: (page: number) => Promise<PagedResponse<T>>;
  renderItem: (item: T, onItemClick: (id: string) => void) => ReactNode;
  onItemClick: (id: string) => void;
  description?: string;
  backPath?: string;
  onNewEntityCreate?: () => void;
}

export function EntitiesPage<T extends { id: string }>({ entityName, fetchData, renderItem, onItemClick, description, backPath = '/', onNewEntityCreate }: EntitiesPageProps<T>) {
  const { t } = useTranslation();
  const [data, setData] = useState<PagedResponse<T>>({
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 0,
      has_next: false,
    },
    data: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEntities = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const entitiesData = await fetchData(page);
      setData(entitiesData);
    } catch (error: any) {
      toast.error(error.message || t('layout.entitiesPage.failedToLoad', { entityName: entityName.toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleBackToMenu = () => {
    navigate(backPath);
  };

  const handlePrevious = async () => {
    const currentPage = data.pagination.page;
    if (currentPage > 1) {
      await fetchEntities(currentPage - 1);
    }
  };

  const handleNext = async () => {
    const currentPage = data.pagination.page;
    if (data.pagination.has_next) {
      await fetchEntities(currentPage + 1);
    }
  };

  return (
    <>
      <PageHeader
        title={entityName[0].toUpperCase() + entityName.slice(1)}
        description={description}
        backButton={
          <Button onClick={handleBackToMenu} variant="secondary">
            <ChevronLeftIcon /> <span>{t('layout.entitiesPage.backToMenu')}</span>
          </Button>
        }
      />
      <PageContent>
        {onNewEntityCreate && (
          <Section>
            <Card>
              <Button onClick={onNewEntityCreate} variant="primary">
                {t('layout.entitiesPage.create', { entityName: entityName.toLowerCase() })}
              </Button>
            </Card>
          </Section>
        )}
        {isLoading ? (
          <PageLoader text={t('layout.entitiesPage.loading', { entityName: entityName.toLowerCase() })} />
        ) : (
          <>
            <Section>
              {data.data.length === 0 ? (
                <Card>{t('layout.entitiesPage.noItemsFound', { entityName: entityName.toLowerCase() })}</Card>
              ) : (
                data.data.map(item => <div key={item.id}>{renderItem(item, onItemClick)}</div>)
              )}
            </Section>
            <Pagination pagination={data.pagination} onPrevious={handlePrevious} onNext={handleNext} />
          </>
        )}
      </PageContent>
    </>
  );
}
