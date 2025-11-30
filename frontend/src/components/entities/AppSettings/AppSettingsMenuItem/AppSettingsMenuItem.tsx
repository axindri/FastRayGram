import { Card, ChevronRightIcon } from '@/components';
import styles from './AppSettingsMenuItem.module.css';

export interface AppSettingsMenuItemProps {
  name: 'basic' | 'service';
  title: string;
  description: string;
  onItemClick?: (name: 'basic' | 'service') => void;
}

export function AppSettingsMenuItem({ name, title, description, onItemClick }: AppSettingsMenuItemProps) {
  return (
    <Card>
      <div className={styles.item} onClick={() => onItemClick?.(name)}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{title}</span>
            </div>
            <div className={styles.content}>
              <div className={styles.data}>
                <span className={styles.description}>{description}</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRightIcon />
      </div>
    </Card>
  );
}

