import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { NotifyEmailDto } from './dto/notify-email.dto';

@Injectable()
export class NotificationsService {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get<string>('SMTP_USER')!,
        clientId: this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
        clientSecret: this.configService.get<string>(
          'GOOGLE_OAUTH_CLIENT_SECRET',
        ),
        refreshToken: this.configService.get<string>(
          'GOOGLE_OAUTH_REFRESH_TOKEN',
        ),
      },
    });
  }

  async notifyEmail({ email, text }: NotifyEmailDto) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_USER'),
      to: email,
      subject: 'Sleepr - Payment Confirmation',
      text,
    });
  }
}
