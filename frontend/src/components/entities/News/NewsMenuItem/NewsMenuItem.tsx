import { Card, ChevronRightIcon, NewsIcon } from '@/components';
import styles from './NewsMenuItem.module.css';
import type { News } from '@/services';
import { formatTime } from '@/utils';
import { useAppStore } from '@/store';

export interface NewsMenuItemProps {
  news: News;
  onItemClick?: (newsId: string) => void;
}

export function NewsMenuItem({ news, onItemClick }: NewsMenuItemProps) {
  const { language } = useAppStore();
  const title = typeof news.title === 'object' ? news.title[language] || news.title.en || '' : news.title;
  const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;

  return (
    <Card>
      <div className={styles.item} onClick={() => onItemClick?.(news.id)}>
        <div className={styles.container}>
          <div className={styles.icon}>
            <NewsIcon />
          </div>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{truncatedTitle}</span>
            </div>
            <div className={styles.content}>
              <div className={styles.data}>
                <span className={styles.label}>Created: </span>
                <span className={styles.value}>{formatTime(news._inserted_dttm)}</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </Card>
  );
}
