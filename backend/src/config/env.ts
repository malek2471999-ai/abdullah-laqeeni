export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPublicUrl: string;
  webPublicUrl: string;
  corsOrigins: string[];
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  tokenPepper: string;
  locationEncryptionKey: string;
  accessTokenTtl: string;
  refreshTokenTtlDays: number;
  googleClientId?: string;
  exposeDevTokens: boolean;
  smtp: {
    host?: string;
    port: number;
    user?: string;
    pass?: string;
    from: string;
  };
  firebaseServiceAccountJson?: string;
}

function required(name: string, fallback: string): string {
  const value = process.env[name];
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set to at least 32 characters in production`);
  }
  return fallback;
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    apiPublicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:4000',
    webPublicUrl: process.env.WEB_PUBLIC_URL ?? 'http://localhost:3000',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-only-access-secret-change-me-0123456789'),
    jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me-0123456789'),
    tokenPepper: required('TOKEN_PEPPER', 'dev-only-token-pepper-change-me-0123456789'),
    locationEncryptionKey:
      process.env.LOCATION_ENCRYPTION_KEY ?? '',
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
    googleClientId: process.env.GOOGLE_CLIENT_ID || undefined,
    exposeDevTokens: (process.env.EXPOSE_DEV_TOKENS ?? 'true') === 'true',
    smtp: {
      host: process.env.SMTP_HOST || undefined,
      port: Number(process.env.SMTP_PORT ?? 587),
      user: process.env.SMTP_USER || undefined,
      pass: process.env.SMTP_PASS || undefined,
      from: process.env.MAIL_FROM ?? 'Abdullah Laqeeni <no-reply@laqeeni.app>',
    },
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || undefined,
  };
}
