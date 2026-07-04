/**
 * Resolved API version. `npm_package_version` is injected by npm when the
 * process is started via a package script; falls back to a constant otherwise.
 */
export const APP_VERSION = process.env.npm_package_version ?? '0.1.0';
