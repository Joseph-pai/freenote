import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Prevent Service Worker from intercepting Firebase API requests.
  // Firebase uses WebSocket/long-polling that must not be cached.
  runtimeCaching: [
    {
      // Firebase Firestore, Auth, and Storage APIs → always use network
      urlPattern: /^https:\/\/(firestore|identitytoolkit|securetoken|storage)\.googleapis\.com\//,
      handler: 'NetworkOnly',
    },
    {
      // Firebase Realtime Database
      urlPattern: /^https:\/\/.*\.firebaseio\.com\//,
      handler: 'NetworkOnly',
    },
    {
      // Firebase web app domains
      urlPattern: /^https:\/\/.*\.(firebase|firebaseapp)\.com\//,
      handler: 'NetworkOnly',
    },
    {
      // Next.js app static assets → cache first
      urlPattern: /^\/_next\/static\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      // App pages → network first, fallback to cache
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'app-pages',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  output: 'export',
  // NOTE: turbopack is removed intentionally.
  // next-pwa v5 uses a Webpack plugin (WorkboxPlugin) to generate sw.js.
  // Turbopack does NOT run Webpack plugins, so enabling it prevents sw.js
  // from being generated, breaking PWA installation and offline support.
};

export default withPWA(nextConfig);
