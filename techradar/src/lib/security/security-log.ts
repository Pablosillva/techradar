/**
 * Logging de eventos de segurança.
 *
 * Emite eventos estruturados no console para auditoria (login falho, acesso
 * negado, upload, etc.). Em produção, estes eventos devem ser coletados por
 * um sistema de observabilidade/SIEM externo.
 */
export type SecurityEvent =
  | { type: "AUTH_LOGIN_FAILED"; email?: string; ip?: string; reason: string }
  | { type: "AUTH_LOGIN_SUCCESS"; userId: string; ip?: string }
  | {
      type: "AUTH_ACCESS_DENIED";
      path?: string;
      userId?: string;
      ip?: string;
      status?: number;
    }
  | { type: "AUTH_UPLOAD"; userId: string; fileName: string; mime: string; ip?: string }
  | { type: "AUTH_RATE_LIMITED"; identifier: string; ip?: string };

export function securityLog(event: SecurityEvent): void {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  // eslint-disable-next-line no-console
  console.warn(`[security] ${event.type}`, entry);
}
