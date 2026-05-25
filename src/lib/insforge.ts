import { createClient } from '@insforge/sdk';

// VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY must be set in your .env file.
// See .env.example at the repository root for the required variable names.
const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL || '';
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || '';

export const insforge = createClient({
  baseUrl,
  anonKey,
  functionsUrl: `${baseUrl.replace(/\/$/, '')}/functions`,
});
