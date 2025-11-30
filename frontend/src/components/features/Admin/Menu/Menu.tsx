import styles from './Menu.module.css';
import { ChevronRightIcon } from '@/components/ui/Icons';
export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface MenuProps {
  items: MenuItem[];
  onItemClick: (itemId: string) => void;
}

export function Menu({ items, onItemClick }: MenuProps) {
  return (
    <div className={styles.menu}>
      {items.map(item => (
        <div key={item.id} className={styles.menuItem} onClick={() => onItemClick(item.id)}>
          <div className={styles.menuItemContent}>
            {item.icon && <div className={styles.icon}>{item.icon}</div>}
            <span className={styles.label}>{item.label}</span>
          </div>
          <div className={styles.arrow}>
            <ChevronRightIcon />
          </div>
        </div>
      ))}
    </div>
  );
}
