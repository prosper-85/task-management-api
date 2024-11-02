import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Types } from 'mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: ProjectService;

  const mockUserId = new Types.ObjectId().toString();
  const mockProjectId = new Types.ObjectId().toString();

  const mockProjectService = {
    create: jest.fn(),
    findAllByOwner: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: mockProjectService }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    projectService = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createProjectDto: CreateProjectDto = { name: 'Test Project' };
      mockProjectService.create.mockResolvedValue({
        message: 'Project created successfully',
      });

      const result = await controller.create(createProjectDto, {
        user: { userId: mockUserId },
      });
      expect(result).toEqual({ message: 'Project created successfully' });
      expect(projectService.create).toHaveBeenCalledWith(
        createProjectDto,
        new Types.ObjectId(mockUserId),
      );
    });
  });

  describe('findAll', () => {
    it('should retrieve all projects for the user', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      mockProjectService.findAllByOwner.mockResolvedValue([
        { name: 'Test Project' },
      ]);

      const result = await controller.findAll(paginationQuery, {
        user: { userId: mockUserId },
      });
      expect(result).toEqual([{ name: 'Test Project' }]);
      expect(projectService.findAllByOwner).toHaveBeenCalledWith(
        new Types.ObjectId(mockUserId),
        paginationQuery,
      );
    });
  });

  describe('findOne', () => {
    it('should retrieve a specific project by ID', async () => {
      const mockProject = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: new Types.ObjectId(mockUserId),
      };
      mockProjectService.findOneById.mockResolvedValue(mockProject);

      const result = await controller.findOne(mockProjectId, {
        user: { userId: mockUserId },
      });
      expect(result).toEqual(mockProject);
      expect(projectService.findOneById).toHaveBeenCalledWith(
        new Types.ObjectId(mockProjectId),
      );
    });

    it('should throw UnauthorizedException if user is not the project owner', async () => {
      const mockProject = {
        _id: mockProjectId,
        name: 'Test Project',
        owner: new Types.ObjectId(),
      };
      mockProjectService.findOneById.mockResolvedValue(mockProject);

      await expect(
        controller.findOne(mockProjectId, { user: { userId: mockUserId } }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    it('should update an existing project', async () => {
      const updateProjectDto: UpdateProjectDto = { name: 'Updated Project' };
      const mockUpdatedProject = {
        _id: mockProjectId,
        ...updateProjectDto,
        owner: new Types.ObjectId(mockUserId),
      };

      mockProjectService.update.mockResolvedValue(mockUpdatedProject);

      const result = await controller.update(mockProjectId, updateProjectDto, {
        user: { userId: mockUserId },
      });
      expect(result).toEqual(mockUpdatedProject);
      expect(projectService.update).toHaveBeenCalledWith(
        new Types.ObjectId(mockProjectId),
        new Types.ObjectId(mockUserId),
        updateProjectDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockProjectService.delete.mockResolvedValue({
        message: 'Project deleted successfully',
      });

      const result = await controller.remove(mockProjectId, {
        user: { userId: mockUserId },
      });
      expect(result).toEqual({ message: 'Project deleted successfully' });
      expect(projectService.delete).toHaveBeenCalledWith(
        new Types.ObjectId(mockProjectId),
        new Types.ObjectId(mockUserId),
      );
    });
  });
});
