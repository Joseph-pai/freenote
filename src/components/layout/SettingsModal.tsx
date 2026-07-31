'use client';
import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { updateUserProfile } from '../../lib/firebase/auth';
import { useTranslation } from '../../lib/i18n';
import { showAlert } from '../../stores/dialogStore';
import { Settings, X } from 'lucide-react';
import { AppUser } from '../../types';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  
  const [theme, setTheme] = useState<AppUser['theme']>(user?.theme || 'system');
  const [language, setLanguage] = useState<AppUser['language']>(user?.language || 'zh-TW');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { theme, language });
      onClose();
    } catch (err: any) {
      showAlert(t('common.saveFailed') + ': ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem', width: '100%', maxWidth: '400px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} /> {t('settings.title')}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div className="input-group">
          <label>{t('settings.theme')}</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as AppUser['theme'])}
            style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', background: 'var(--background)',
              color: 'var(--text-main)', fontSize: '1rem', outline: 'none',
            }}
          >
            <option value="system">{t('settings.theme.system')}</option>
            <option value="light">{t('settings.theme.light')}</option>
            <option value="dark">{t('settings.theme.dark')}</option>
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
          <label>{t('settings.language')}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as AppUser['language'])}
            style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', background: 'var(--background)',
              color: 'var(--text-main)', fontSize: '1rem', outline: 'none',
            }}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
      </div>
    </div>
  );
}
