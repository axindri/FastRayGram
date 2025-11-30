import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <div className={styles.wrapper}>
      <input type="checkbox" id={checkboxId} className={`${styles.checkbox} ${className}`} {...props} />
      {label && (
        <label htmlFor={checkboxId} className={styles.label}>
          {label}
        </label>
      )}
    </div>
  );
}

