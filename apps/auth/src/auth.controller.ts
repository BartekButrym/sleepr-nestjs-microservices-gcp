import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import type { Response } from 'express';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  CurrentUser,
  UserDocument,
} from '@app/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @CurrentUser() user: UserDocument,
    @Res({ passthrough: true }) response: Response,
  ) {
    const jwt = this.authService.login(user, response);

    response.send(jwt);
  }

  @UseGuards(JwtAuthGuard)
  authenticate(@Payload() data: any) {
    return {
      ...data.user,
      id: data.user._id,
    };
  }
}
