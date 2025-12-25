import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { map } from 'rxjs';
import { PAYMENTS_SERVICE, User } from '@app/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { PrismaService } from './prisma.service';

type CreateChargeResponse = {
  id: string;
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(PAYMENTS_SERVICE) private readonly paymentsService: ClientProxy,
  ) {}

  create(
    createReservationDto: CreateReservationDto,
    { email, id: userId }: User,
  ) {
    return this.paymentsService
      .send<CreateChargeResponse>('create_charge', {
        ...createReservationDto.charge,
        email,
      })
      .pipe(
        map((response: CreateChargeResponse) => {
          return this.prismaService.reservation.create({
            data: {
              startDate: createReservationDto.startDate,
              endDate: createReservationDto.endDate,
              invoiceId: response.id,
              timestamp: new Date(),
              userId,
            },
          });
        }),
      );
  }

  async findAll() {
    return await this.prismaService.reservation.findMany({});
  }

  async findOne(id: number) {
    return await this.prismaService.reservation.findUniqueOrThrow({
      where: { id },
    });
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    return await this.prismaService.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  async remove(id: number) {
    return await this.prismaService.reservation.delete({
      where: { id },
    });
  }
}
