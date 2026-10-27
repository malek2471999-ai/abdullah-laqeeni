import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport?: Transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transport = createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        secure: Number(this.config.get('SMTP_PORT') ?? 587) === 465,
        auth: this.config.get('SMTP_USER')
          ? { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') }
          : undefined,
      });
    }
  }

  private get webUrl(): string {
    return this.config.get<string>('WEB_PUBLIC_URL') ?? 'http://localhost:3000';
  }

  async sendVerification(email: string, token: string): Promise<void> {
    await this.send(
      email,
      'تأكيد بريدك — عبدالله لاقيني',
      'Confirm your e-mail — Abdullah Laqeeni',
      `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`,
    );
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    await this.send(
      email,
      'إعادة تعيين كلمة المرور — عبدالله لاقيني',
      'Reset your password — Abdullah Laqeeni',
      `${this.webUrl}/reset-password?token=${encodeURIComponent(token)}`,
    );
  }

  private async send(email: string, arabic: string, english: string, link: string): Promise<void> {
    this.logger.log(`Mail "${arabic}" -> ${email}: ${link}`);
    if (!this.transport) return;
    await this.transport.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: email,
      subject: arabic,
      text: `${english}\n\n${link}\n\nعبدالله لاقيني — Abdullah Laqeeni`,
      html: `<div style="font-family:system-ui;background:#071426;color:#fff;padding:32px;border-radius:16px">
        <h1 style="color:#00D69A;margin:0 0 8px">عبدالله لاقيني</h1>
        <p style="color:#9fb3c8">Abdullah Laqeeni — Phone Recovery</p>
        <p>${english}</p>
        <p><a href="${link}" style="display:inline-block;background:#087CFF;color:#fff;padding:12px 22px;border-radius:12px;text-decoration:none">Open link</a></p>
        <p style="color:#7f95b5;font-size:12px">If you did not request this, ignore this message.</p>
      </div>`,
    });
  }
}
