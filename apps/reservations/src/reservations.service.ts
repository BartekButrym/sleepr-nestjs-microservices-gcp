import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs';
import { PAYMENTS_SERVICE, User } from '@app/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { Reservation } from './models/reservation.entity';

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
    { email, id: userId }: User & { id: number },
  ) {
    return this.paymentsService
      .send<CreateChargeResponse>('create_charge', {
        ...createReservationDto.charge,
        email,
      })
      .pipe(
        map((response: CreateChargeResponse) => {
          return this.reservationsRepository.create({
            startDate: createReservationDto.startDate,
            endDate: createReservationDto.endDate,
            invoiceId: response.id,
            timestamp: new Date(),
            userId,
          } as Reservation);
        }),
      );
  }

  async findAll() {
    return await this.reservationsRepository.find({});
  }

  async findOne(id: number) {
    return await this.reservationsRepository.findOne({ id });
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    return await this.reservationsRepository.findOneAndUpdate(
      { id },
      updateReservationDto,
    );
  }

  async remove(id: number) {
    return await this.reservationsRepository.findOneAndDelete({ id });
  }
}
