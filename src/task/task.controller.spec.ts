import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { TaskStatus } from '../schemas/task.schema';
import { NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../project/dto/pagination-query.dto';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  // Mock for TaskService methods
  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockUser = { _id: new Types.ObjectId() };
  const mockProjectId = new Types.ObjectId().toString();
  const mockTaskId = new Types.ObjectId().toString();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mock calls to reset the service's state
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        status: TaskStatus.PENDING,
      };
      const resultTask = { ...createTaskDto, _id: new Types.ObjectId() };
      mockTaskService.create.mockResolvedValue(resultTask);

      const result = await controller.create(mockProjectId, createTaskDto, {
        user: mockUser,
      });
      expect(result).toEqual(resultTask);
      expect(service.create).toHaveBeenCalledWith(
        createTaskDto,
        new Types.ObjectId(mockProjectId),
      );
    });
  });

  describe('findAll', () => {
    it('should retrieve all tasks for a project with filters and pagination', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      const mockTasks = [{ title: 'Task 1' }, { title: 'Task 2' }];
      mockTaskService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll(
        mockProjectId,
        TaskStatus.PENDING,
        paginationQuery,
        '2024-11-01',
      );
      expect(result).toEqual(mockTasks);
      expect(service.findAll).toHaveBeenCalledWith(
        new Types.ObjectId(mockProjectId),
        paginationQuery,
        TaskStatus.PENDING,
        new Date('2024-11-01'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by ID', async () => {
      const mockTask = { title: 'Existing Task', _id: mockTaskId };
      mockTaskService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(mockTaskId, { user: mockUser });
      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(
        new Types.ObjectId(mockTaskId),
      );
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskService.findOne.mockResolvedValue(null); // Ensure it returns null for this test case

      await expect(
        controller.findOne(mockTaskId, { user: mockUser }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task by ID', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };
      const updatedTask = { ...updateTaskDto, _id: mockTaskId };
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(mockTaskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(
        new Types.ObjectId(mockTaskId),
        updateTaskDto,
      );
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should bulk update tasks status', async () => {
      const bulkUpdateTaskDto: BulkUpdateTaskDto = {
        taskIds: [mockTaskId],
        status: TaskStatus.COMPLETED,
      };
      const updatedTasks = [{ _id: mockTaskId, status: TaskStatus.COMPLETED }];
      mockTaskService.bulkUpdateStatus.mockResolvedValue(updatedTasks);

      const result = await controller.bulkUpdateStatus(bulkUpdateTaskDto);
      expect(result).toEqual({
        message: 'Tasks updated successfully',
        updatedTasks,
      });
      expect(service.bulkUpdateStatus).toHaveBeenCalledWith(bulkUpdateTaskDto);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a task by ID', async () => {
      mockTaskService.softDelete.mockResolvedValue({}); // Ensure softDelete resolves as expected

      const result = await controller.softDelete(mockTaskId);
      expect(result).toEqual({ message: 'Task deleted successfully' });
      expect(service.softDelete).toHaveBeenCalledWith(
        new Types.ObjectId(mockTaskId),
      );
    });
  });
});
