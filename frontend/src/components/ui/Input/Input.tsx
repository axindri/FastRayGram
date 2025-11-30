import { useId, useState } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';
import { EyeIcon, EyeOffIcon } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', type = 'text', ...props }: InputProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordType = type === 'password';
  const inputClasses = [styles.input, error && styles.inputError, isPasswordType && styles.inputWithIcon, className].filter(Boolean).join(' ');
  const inputType = isPasswordType ? (isPasswordVisible ? 'text' : 'password') : type;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        <input id={inputId} className={inputClasses} type={inputType} {...props} />
        {isPasswordType && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setIsPasswordVisible(prev => !prev)}
            aria-label={isPasswordVisible ? t('ui.input.hidePassword') : t('ui.input.showPassword')}
            aria-pressed={isPasswordVisible}
            disabled={props.disabled}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const textareaClasses = [styles.input, styles.textarea, error && styles.inputError, className].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea id={textareaId} className={textareaClasses} {...props} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
