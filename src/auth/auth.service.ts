import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/register-user.dto';
import { User } from '../schemas/user.schema';
import { UserService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    return this.userService.createUser(createUserDto);
  }

  async login(loginDto: LoginUserDto): Promise<{
    user: {
      access_token: string;
      username: string;
      id: any;
      email: string;
      full_name: string;
    };
  }> {
    const user = await this.userService.validateUserCredentials(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      username: user.username,
      sub: user._id,
    };

    return {
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
        access_token: this.jwtService.sign(payload),
      },
    };
  }
  async validateUser(email: string, password: string): Promise<User | null> {
    return this.userService.validateUserCredentials(email, password);
  }
}
