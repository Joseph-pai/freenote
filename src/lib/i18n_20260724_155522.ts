import { useAuthStore } from '../stores/authStore';

const dictionaries: Record<string, Record<string, string>> = {
  'zh-TW': {
    'nav.tasks': '任務',
    'nav.notes': '記事',
    'nav.calendar': '日曆',
    'nav.friends': '好友',
    'nav.messages': '私訊',
    'nav.settings': '設定',
    'nav.logout': '登出',
    'settings.title': '系統設定',
    'settings.theme': '佈景主題',
    'settings.theme.system': '跟隨系統',
    'settings.theme.light': '淺色模式',
    'settings.theme.dark': '深色模式',
    'settings.language': '語言',
    'settings.save': '儲存設定',
    'settings.saving': '儲存中...',
  },
  'en': {
    'nav.tasks': 'Tasks',
    'nav.notes': 'Notes',
    'nav.calendar': 'Calendar',
    'nav.friends': 'Friends',
    'nav.messages': 'Messages',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.theme.system': 'System',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.language': 'Language',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
  }
};

export function useTranslation() {
  const { user } = useAuthStore();
  const lang = user?.language === 'en' ? 'en' : 'zh-TW';
  
  const t = (key: string): string => {
    return dictionaries[lang]?.[key] || dictionaries['zh-TW']?.[key] || key;
  };

  return { t, lang };
}
