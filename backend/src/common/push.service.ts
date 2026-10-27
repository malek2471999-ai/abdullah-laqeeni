import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

/**
 * Sends high-priority FCM data messages so a phone can wake up and poll for
 * commands. Delivery is best-effort: the device always has a polling fallback.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private auth?: GoogleAuth;
  private projectId?: string;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) return;
    try {
      const serviceAccount = JSON.parse(raw) as ServiceAccount;
      this.projectId = serviceAccount.project_id;
      this.auth = new GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
    } catch (error) {
      this.logger.warn(`FCM is misconfigured: ${String(error)}`);
    }
  }

  get enabled(): boolean {
    return Boolean(this.auth && this.projectId);
  }

  async sendDataMessage(
    token: string | null | undefined,
    data: Record<string, string>,
  ): Promise<boolean> {
    if (!this.enabled || !token) return false;
    try {
      const client = await this.auth!.getClient();
      const access = await client.getAccessToken();
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              android: { priority: 'HIGH' },
              data,
            },
          }),
        },
      );
      if (!response.ok) {
        this.logger.warn(`FCM rejected a message (${response.status}): ${await response.text()}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`FCM send failed: ${String(error)}`);
      return false;
    }
  }
}
