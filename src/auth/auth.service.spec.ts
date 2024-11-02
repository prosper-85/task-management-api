import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    validateUserCredentials: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mocked-access-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'testpassword',
        email: 'test@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue({
        message: 'User registered successfully',
      });

      const result = await authService.register(createUserDto);
      expect(result).toEqual({ message: 'User registered successfully' });
      expect(userService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(userService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw BadRequestException if email is already registered', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'testpassword',
        email: 'test@example.com',
      };

      mockUserService.findByEmail.mockResolvedValue({
        email: createUserDto.email,
      });

      await expect(authService.register(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(createUserDto.email);
    });
  });

  describe('login', () => {
    it('should return an access token if login is successful', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'testpassword',
      };

      const user = { username: 'testuser', _id: 'userId' };
      mockUserService.validateUserCredentials.mockResolvedValue(user);

      const result = await authService.login(loginDto);
      expect(result).toEqual({ access_token: 'mocked-access-token' });
      expect(userService.validateUserCredentials).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: user.username,
        sub: user._id,
      });
    });

    it('should throw UnauthorizedException if login credentials are invalid', async () => {
      const loginDto: LoginUserDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      mockUserService.validateUserCredentials.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userService.validateUserCredentials).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });

  describe('validateUser', () => {
    it('should return a user if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'testpassword';

      const user = { username: 'testuser', email, _id: 'userId' };
      mockUserService.validateUserCredentials.mockResolvedValue(user);

      const result = await authService.validateUser(email, password);
      expect(result).toEqual(user);
      expect(userService.validateUserCredentials).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should return null if credentials are invalid', async () => {
      const email = 'wrong@example.com';
      const password = 'wrongpassword';

      mockUserService.validateUserCredentials.mockResolvedValue(null);

      const result = await authService.validateUser(email, password);
      expect(result).toBeNull();
      expect(userService.validateUserCredentials).toHaveBeenCalledWith(
        email,
        password,
      );
    });
  });
});
