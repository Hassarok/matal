/**
 * Type-safe access to the Vite-exposed environment. Only `VITE_`-prefixed
 * variables reach the browser. Centralising access here keeps `import.meta.env`
 * lookups out of feature code.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME ?? 'MATAL',
  /** Base path for the versioned REST API. */
  apiBasePath: '/api/v1',
} as const;

/** Fully-qualified REST base, e.g. `http://localhost:3000/api/v1`. */
export const apiBaseUrl = `${env.apiUrl}${env.apiBasePath}`;
