import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import { GetUserDto } from './dto/get-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    try {
      await this.usersRepository.findBy({ email: createUserDto.email });
    } catch (errors) {
      console.log(errors);
      return;
    }

    throw new UnprocessableEntityException('User already exists');
  }

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserDto(createUserDto);

    return await this.usersRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
  }

  async verifyUser(email: string, password: string) {
    const user = await this.usersRepository.findBy({ email });
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getUser(getUserDto: GetUserDto) {
    return await this.usersRepository.findBy(getUserDto);
  }

  async findAll() {
    return await this.usersRepository.find({});
  }
}
