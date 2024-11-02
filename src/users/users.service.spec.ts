import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../auth/dto/register-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;

  const mockUser = {
    _id: 'userId',
    email: 'test@example.com',
    password: 'hashedPassword',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUserModel = {
    // Simulate the findOne method
    findOne: jest.fn().mockImplementation((query) => ({
      exec: jest
        .fn()
        .mockResolvedValue(query.email === mockUser.email ? mockUser : null),
    })),

    // Simulate the create method
    create: jest.fn().mockResolvedValue(mockUser),

    // Simulate the constructor for the user model
    // Here we simulate the instantiation of the model with `new`
    new: jest.fn().mockImplementation(() => mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with a hashed password', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => Promise.resolve('hashedPassword'));

      const result = await service.createUser(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(result).toEqual({ message: 'User created successfully' });
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      const result = await service.findByEmail('test@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      const result = await service.findByEmail('nonexistent@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'nonexistent@example.com',
      });
      expect(result).toBeNull();
    });
  });

  describe('validateUserCredentials', () => {
    it('should return user if credentials are valid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUserCredentials(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should return null if credentials are invalid', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUserCredentials(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });

    it('should return null if user is not found', async () => {
      mockUserModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.validateUserCredentials(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });
  });
});
