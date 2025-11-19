import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs';
import { PAYMENTS_SERVICE, UserDto } from '@app/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';

type CreateChargeResponse = {
  id: string;
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    @Inject(PAYMENTS_SERVICE) private readonly paymentsService: ClientProxy,
  ) {}

  create(
    createReservationDto: CreateReservationDto,
    { email, _id: userId }: UserDto,
  ) {
    return this.paymentsService
      .send<CreateChargeResponse>('create_charge', {
        ...createReservationDto.charge,
        email,
      })
      .pipe(
        map((response: CreateChargeResponse) => {
          return this.reservationsRepository.create({
            ...createReservationDto,
            invoiceId: response.id,
            timestamp: new Date(),
            userId,
          });
        }),
      );
  }

  async findAll() {
    return await this.reservationsRepository.find({});
  }

  async findOne(_id: string) {
    return await this.reservationsRepository.findBy({ _id });
  }

  async update(_id: string, updateReservationDto: UpdateReservationDto) {
    return await this.reservationsRepository.findOneAndUpdate(
      { _id },
      { $set: updateReservationDto },
    );
  }

  async remove(_id: string) {
    return await this.reservationsRepository.findOneAndDelete({ _id });
  }
}
