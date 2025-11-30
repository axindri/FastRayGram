import styles from './SegmentControl.module.css';

export interface SegmentControlProps {
  items: { label: string; icon: React.ReactNode }[];
  selectedItem: string;
  onSelect: (item: { label: string; icon: React.ReactNode }) => void;
  disabled?: boolean;
}

export function SegmentControl({ items, selectedItem, onSelect, disabled = false }: SegmentControlProps) {
  return (
    <div className={styles.segmentControl}>
      {items.map(item =>
        item.icon ? (
          <div
            key={item.label}
            className={`${styles.item} ${item.label === selectedItem ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && onSelect(item)}
          >
            {item.icon}
            <span className={styles.labelWithIcon}>{item.label.charAt(0).toUpperCase() + item.label.slice(1)}</span>
          </div>
        ) : (
          <div
            key={item.label}
            className={`${styles.item} ${item.label === selectedItem ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && onSelect(item)}
          >
            <span className={styles.labelWithoutIcon}>{item.label.charAt(0).toUpperCase() + item.label.slice(1)}</span>
          </div>
        )
      )}
    </div>
  );
}
