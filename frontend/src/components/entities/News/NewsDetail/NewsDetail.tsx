import styles from './NewsDetail.module.css';
import { Card, Section, Info, Button } from '@/components';
import { formatTime } from '@/utils';
import type { News } from '@/services';
import { useAppStore } from '@/store';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export interface NewsDetailProps {
  news: News;
  onEdit?: () => void;
  onDelete?: () => void;
  isProcessing?: boolean;
  isEditMode?: boolean;
  onSave?: (news: { title: { en: string; ru: string }; content: { en: string; ru: string } }) => void;
  onCancel?: () => void;
}

export function NewsDetail({ news, onEdit, onDelete, isProcessing = false, isEditMode = false, onSave, onCancel }: NewsDetailProps) {
  const { t } = useTranslation();
  const { language } = useAppStore();
  const [titleEn, setTitleEn] = useState(typeof news.title === 'object' ? news.title.en || '' : '');
  const [titleRu, setTitleRu] = useState(typeof news.title === 'object' ? news.title.ru || '' : '');
  const [contentEn, setContentEn] = useState(typeof news.content === 'object' ? news.content.en || '' : '');
  const [contentRu, setContentRu] = useState(typeof news.content === 'object' ? news.content.ru || '' : '');

  useEffect(() => {
    if (news) {
      setTitleEn(typeof news.title === 'object' ? news.title.en || '' : '');
      setTitleRu(typeof news.title === 'object' ? news.title.ru || '' : '');
      setContentEn(typeof news.content === 'object' ? news.content.en || '' : '');
      setContentRu(typeof news.content === 'object' ? news.content.ru || '' : '');
    }
  }, [news]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        title: { en: titleEn, ru: titleRu },
        content: { en: contentEn, ru: contentRu },
      });
    }
  };

  if (isEditMode) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Section title={t('admin.news.edit')}>
            <Card title={t('admin.news.titleEn')}>
              <textarea value={titleEn} onChange={e => setTitleEn(e.target.value)} className={styles.textarea} placeholder={t('entities.newsDetail.enterTitleEn')} rows={2} />
            </Card>
            <Card title={t('admin.news.titleRu')}>
              <textarea value={titleRu} onChange={e => setTitleRu(e.target.value)} className={styles.textarea} placeholder={t('entities.newsDetail.enterTitleRu')} rows={2} />
            </Card>
            <Card title={t('admin.news.contentEn')}>
              <textarea value={contentEn} onChange={e => setContentEn(e.target.value)} className={styles.textarea} placeholder={t('entities.newsDetail.enterContentEn')} rows={6} />
            </Card>
            <Card title={t('admin.news.contentRu')}>
              <textarea value={contentRu} onChange={e => setContentRu(e.target.value)} className={styles.textarea} placeholder={t('entities.newsDetail.enterContentRu')} rows={6} />
            </Card>
          </Section>
          <Section title={t('admin.news.actions')}>
            <Card>
              <div className={styles.actions}>
                <Button variant="success" onClick={handleSave} disabled={isProcessing} fullWidth={true}>
                  {t('admin.news.save')}
                </Button>
                {onCancel && (
                  <Button variant="secondary" onClick={onCancel} disabled={isProcessing} fullWidth={true}>
                    {t('admin.news.cancel')}
                  </Button>
                )}
              </div>
            </Card>
          </Section>
        </div>
      </div>
    );
  }

  const title = typeof news.title === 'object' ? news.title[language] || news.title.en || '' : news.title;
  const content = typeof news.content === 'object' ? news.content[language] || news.content.en || '' : news.content;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Section title={t('admin.news.details')}>
          <Card title={t('admin.news.title')}>
            <div className={styles.text}>{title}</div>
            <div className={styles.languages}>
              <div className={styles.langItem}>
                <strong>EN:</strong> {typeof news.title === 'object' ? news.title.en || '-' : '-'}
              </div>
              <div className={styles.langItem}>
                <strong>RU:</strong> {typeof news.title === 'object' ? news.title.ru || '-' : '-'}
              </div>
            </div>
          </Card>
          <Card title={t('admin.news.content')}>
            <div className={styles.text}>{content}</div>
            <div className={styles.languages}>
              <div className={styles.langItem}>
                <strong>EN:</strong> {typeof news.content === 'object' ? news.content.en || '-' : '-'}
              </div>
              <div className={styles.langItem}>
                <strong>RU:</strong> {typeof news.content === 'object' ? news.content.ru || '-' : '-'}
              </div>
            </div>
          </Card>
          <Card title={t('admin.news.metadata')}>
            <Info title={t('entities.newsDetail.id')} value={news.id} />
            <Info title={t('admin.news.created')} value={formatTime(news._inserted_dttm)} />
          </Card>
        </Section>
        {(onEdit || onDelete) && (
          <Section title={t('admin.news.actions')}>
            <Card>
              <div className={styles.actions}>
                {onEdit && (
                  <Button variant="primary" onClick={onEdit} disabled={isProcessing} fullWidth={true}>
                    {t('admin.news.edit')}
                  </Button>
                )}
                {onDelete && (
                  <Button variant="error" onClick={onDelete} disabled={isProcessing} fullWidth={true}>
                    {t('admin.news.delete')}
                  </Button>
                )}
              </div>
            </Card>
          </Section>
        )}
      </div>
    </div>
  );
}
