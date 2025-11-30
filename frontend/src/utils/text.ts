export const getRequestTitle = (name: string) => {
  switch (name) {
    case 'update_config':
      return 'Update Config';
    case 'verify':
      return 'Verify User';
    case 'renew_config':
      return 'Renew Config';
    case 'reset_password':
      return 'Reset Password';
    default:
      return name.toUpperCase();
  }
};

export const extractPassword = (passwordText: string): string => {
  const passwordMatch = passwordText.match(/Password:\s*(.+)/);
  return passwordMatch ? passwordMatch[1].trim() : passwordText;
};

export const getLocalizedText = (content: { en: string; ru: string }, language: 'en' | 'ru'): string => {
  return content[language] || content.en || content.ru || '';
};
