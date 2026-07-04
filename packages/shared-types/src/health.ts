/** Health-check contracts consumed by the web client and monitoring. */

export type ServiceState = 'up' | 'down';

export interface HealthStatus {
  /** Overall status — 'ok' only when every critical dependency is up. */
  status: 'ok' | 'degraded';
  /** API semantic version. */
  version: string;
  /** Server time in ISO-8601. */
  timestamp: string;
  /** Process uptime in seconds. */
  uptime: number;
  /** Per-dependency health. */
  services: {
    database: ServiceState;
  };
}
