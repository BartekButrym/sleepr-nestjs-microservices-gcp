import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type ClientGrpc } from '@nestjs/microservices';
import Stripe from 'stripe';
import {
  NOTIFICATIONS_SERVICE_NAME,
  NotificationsServiceClient,
} from '@app/common';
import { PaymentsCreateChargeDto } from './dto/payments-create-charge.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private notificationsService: NotificationsServiceClient;

  constructor(
    private readonly configService: ConfigService,
    @Inject(NOTIFICATIONS_SERVICE_NAME)
    private readonly client: ClientGrpc,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async createCharge({ amount, email }: PaymentsCreateChargeDto) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      payment_method: 'pm_card_visa',
      amount: amount * 100,
      confirm: true,
      payment_method_types: ['card'],
      currency: 'usd',
    });

    if (!this.notificationsService) {
      this.notificationsService =
        this.client.getService<NotificationsServiceClient>(
          NOTIFICATIONS_SERVICE_NAME,
        );
    }

    this.notificationsService
      .notifyEmail({
        email,
        text: `Your payment of $${amount} has completed successfully`,
      })
      .subscribe(() => {});

    return paymentIntent;
  }
}
