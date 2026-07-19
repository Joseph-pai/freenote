export interface AppUser {
  uid: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  language: 'zh-TW' | 'en' | 'ja' | 'ko';
  theme: 'light' | 'dark' | 'system';
  createdAt: number;
  updatedAt: number;
}
