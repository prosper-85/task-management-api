import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { Task, TaskStatus } from '../schemas/task.schema';
import { NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../project/dto/pagination-query.dto';

describe('TaskService', () => {
  let service: TaskService;
  let taskModel: any;

  const mockTask = {
    _id: new Types.ObjectId(),
    title: 'Test Task',
    project: new Types.ObjectId(),
    status: TaskStatus.PENDING,
    deletedAt: null,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockTaskModel = {
    create: jest.fn().mockResolvedValue(mockTask),
    find: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockTask]),
    }),
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockTask),
    }),
    countDocuments: jest.fn().mockResolvedValue(1),
    updateMany: jest.fn().mockResolvedValue({ nModified: 1 }),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskModel = module.get(getModelToken(Task.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        status: TaskStatus.PENDING,
      };

      const result = await service.create(createTaskDto, mockTask.project);
      expect(taskModel.create).toHaveBeenCalledWith({
        ...createTaskDto,
        project: mockTask.project,
      });
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return tasks with pagination', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      const total = 1;

      taskModel.countDocuments.mockResolvedValue(total);

      const result = await service.findAll(
        mockTask.project,
        paginationQuery,
        TaskStatus.PENDING,
      );

      expect(result.tasks).toEqual([mockTask]);
      expect(result.total).toBe(total);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(taskModel.find).toHaveBeenCalledWith({
        project: mockTask.project,
        deletedAt: null,
        status: TaskStatus.PENDING,
      });
      expect(taskModel.countDocuments).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a task by ID', async () => {
      const result = await service.findOne(mockTask._id);
      expect(result).toEqual(mockTask);
      expect(taskModel.findById).toHaveBeenCalledWith(mockTask._id);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(mockTask._id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };
      const updatedTask = { ...mockTask, ...updateTaskDto };
      taskModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTask),
      });
      mockTask.save.mockResolvedValue(updatedTask);

      const result = await service.update(mockTask._id, updateTaskDto);
      expect(result).toEqual(updatedTask);
      expect(mockTask.save).toHaveBeenCalled();
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should update the status of multiple tasks', async () => {
      const bulkUpdateTaskDto: BulkUpdateTaskDto = {
        taskIds: [mockTask._id.toString()],
        status: TaskStatus.COMPLETED,
      };
      taskModel.find.mockResolvedValue([mockTask]);
      taskModel.updateMany.mockResolvedValue({ nModified: 1 });

      const result = await service.bulkUpdateStatus(bulkUpdateTaskDto);
      expect(taskModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: [mockTask._id] }, deletedAt: null },
        { $set: { status: TaskStatus.COMPLETED } },
      );
      expect(result).toEqual([mockTask]);
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt to the current date', async () => {
      taskModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTask),
      });
      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      await service.softDelete(mockTask._id);
      expect(mockTask.save).toHaveBeenCalled();
      expect(mockTask.deletedAt).toEqual(now);
    });
  });
});
