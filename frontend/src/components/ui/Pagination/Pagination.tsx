import { Button, ChevronLeftIcon, ChevronRightIcon } from '@/components';
import type { Pagination as PaginationType } from '@/services';
import styles from './Pagination.module.css';
import { useTranslation } from '@/hooks/useTranslation';

export interface PaginationProps {
  pagination: PaginationType;
  onPrevious: () => void;
  onNext: () => void;
}

export function Pagination({ pagination, onPrevious, onNext }: PaginationProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.pagination}>
      <Button variant="secondary" onClick={onPrevious} disabled={pagination.page === 1} title={t('ui.pagination.previous')}>
        <ChevronLeftIcon />
      </Button>
      <div className={styles.pageInfo}>
        <span>
          {pagination.page} / {pagination.total_pages}
        </span>
      </div>
      <Button variant="secondary" onClick={onNext} disabled={!pagination.has_next} title={t('ui.pagination.next')}>
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
