'use client';
import React, { useEffect } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useDialogStore } from '../../stores/dialogStore';
import { useTranslation } from '../../lib/i18n';

/**
 * Global dialog component rendered at root level.
 * Replaces window.confirm() and window.alert() which are blocked
 * in PWA standalone mode on Mac/iOS Chrome and Safari.
 */
export function ConfirmDialog() {
  const { dialog, close } = useDialogStore();
  const { t } = useTranslation();

  // Keyboard accessibility: Escape = cancel, Enter = confirm
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Enter')  { e.preventDefault(); close(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  if (!dialog) return null;

  const isConfirm = dialog.type === 'confirm';

  return (
    <>
      <style>{`
        @keyframes dialog-fade-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes dialog-scale-up {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          animation: 'dialog-fade-in 0.18s ease',
        }}
        onClick={() => isConfirm && close(false)}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem 1.75rem 1.5rem',
            width: '100%', maxWidth: '360px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            animation: 'dialog-scale-up 0.2s ease',
          }}
        >
          {/* Icon */}
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: isConfirm ? 'rgba(239,68,68,0.12)' : 'rgba(37,99,235,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            {isConfirm
              ? <Trash2  size={20} color="#ef4444" />
              : <AlertCircle size={20} color="var(--primary)" />
            }
          </div>

          {/* Message */}
          <p style={{
            color: 'var(--text-main)', fontSize: '0.9375rem',
            lineHeight: 1.65, marginBottom: '1.5rem',
            whiteSpace: 'pre-wrap',
          }}>
            {dialog.message}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
            {isConfirm && (
              <button
                id="dialog-cancel-btn"
                onClick={() => close(false)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
            )}
            <button
              id="dialog-confirm-btn"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onClick={() => close(true)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isConfirm ? '#ef4444' : 'var(--primary)',
                color: '#fff',
                fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer',
              }}
            >
              {isConfirm ? t('common.confirm') : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
