import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn((dto) => {
      return { message: 'User registered successfully' };
    }),
    login: jest.fn((dto) => {
      return { accessToken: 'some-token' };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should return a success message', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'testpassword',
        email: 'test@example.com',
      };

      const result = await controller.register(createUserDto);
      expect(result).toEqual({ message: 'User registered successfully' });
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'testpassword',
      };

      const result = await controller.login(loginUserDto);
      expect(result).toEqual({ accessToken: 'some-token' });
      expect(authService.login).toHaveBeenCalledWith(loginUserDto);
    });
  });
});
