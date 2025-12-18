import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  PaymentsServiceController,
  PaymentsServiceControllerMethods,
} from '@app/common';
import { PaymentsService } from './payments.service';
import { PaymentsCreateChargeDto } from './dto/payments-create-charge.dto';

@Controller()
@PaymentsServiceControllerMethods()
export class PaymentsController implements PaymentsServiceController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UsePipes(new ValidationPipe())
  async createCharge(data: PaymentsCreateChargeDto) {
    return await this.paymentsService.createCharge(data);
  }
}
