import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from './guard/local.guard';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/schemas/user.schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCreatedResponse({ type: User, description: 'Register User' })
  @ApiBadRequestResponse()
  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    return this.authService.register(createUserDto);
  }

  @ApiCreatedResponse({ type: User, description: 'Login User' })
  @ApiBadRequestResponse()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }
}
