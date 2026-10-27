import { Global, Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { MailService } from './mail.service';
import { PushService } from './push.service';

@Global()
@Module({
  providers: [CryptoService, MailService, PushService],
  exports: [CryptoService, MailService, PushService],
})
export class CommonModule {}
