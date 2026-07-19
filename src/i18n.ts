import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Can be imported from a shared config
const locales = ['zh-TW', 'en', 'ja', 'ko'];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    locale: locale || 'zh-TW',
    messages: (await import(`../messages/${locale || 'zh-TW'}.json`)).default
  };
});
