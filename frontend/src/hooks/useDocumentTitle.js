import { useEffect } from 'react';
import { APP_NAME } from '../utils/constants';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} • ${APP_NAME}`;
    } else {
      document.title = `${APP_NAME} - Store every receipt. Find it in seconds.`;
    }
  }, [title]);
};
