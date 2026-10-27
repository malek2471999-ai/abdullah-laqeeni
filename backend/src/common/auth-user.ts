export interface AuthUser {
  id: string;
  email: string;
  sessionId: string;
  emailVerified: boolean;
}

export interface DevicePrincipal {
  id: string;
  userId: string;
  name: string;
  tokenPrefix: string;
}
