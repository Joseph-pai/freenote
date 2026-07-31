import { create } from 'zustand';

type DialogType = 'confirm' | 'alert';

interface Dialog {
  type: DialogType;
  message: string;
  resolve: (result: boolean) => void;
}

interface DialogState {
  dialog: Dialog | null;
  showConfirm: (message: string) => Promise<boolean>;
  showAlert: (message: string) => Promise<void>;
  close: (result: boolean) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  dialog: null,

  showConfirm: (message: string) =>
    new Promise<boolean>((resolve) => {
      set({ dialog: { type: 'confirm', message, resolve } });
    }),

  showAlert: (message: string) =>
    new Promise<void>((resolve) => {
      set({ dialog: { type: 'alert', message, resolve: () => resolve() } });
    }),

  close: (result: boolean) => {
    const { dialog } = get();
    if (dialog) {
      dialog.resolve(result);
      set({ dialog: null });
    }
  },
}));

// Module-level utility functions – callable outside React components (e.g. in event handlers).
// These replace window.confirm() and window.alert() which are blocked in PWA standalone mode.
export const showConfirm = (message: string): Promise<boolean> =>
  useDialogStore.getState().showConfirm(message);

export const showAlert = (message: string): Promise<void> =>
  useDialogStore.getState().showAlert(message);
