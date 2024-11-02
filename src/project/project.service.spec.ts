import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from '../schemas/project.schema';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectModel: Model<Project>;

  const mockUserId = new Types.ObjectId();
  const mockProjectId = new Types.ObjectId();
  const mockProject = {
    _id: mockProjectId,
    name: 'Test Project',
    owner: mockUserId,
    save: jest.fn().mockResolvedValue(this), // Ensure save is a resolved promise
  };

  const mockProjectModel = {
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),

    constructor: jest.fn().mockImplementation(() => mockProject),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getModelToken(Project.name),
          useValue: {
            ...mockProjectModel,
            // Ensure that the create method returns a new project instance
            create: jest.fn().mockImplementation((data) => {
              return {
                ...data,
                owner: mockUserId,
                _id: new Types.ObjectId(),
                save: jest.fn().mockResolvedValue(data), // Mock save for the created project
              };
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectModel = module.get<Model<Project>>(getModelToken(Project.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createProjectDto: CreateProjectDto = { name: 'New Project' };
      const createdProject = { ...mockProject, name: createProjectDto.name };

      mockProjectModel.create.mockResolvedValue(createdProject);

      const result = await service.create(createProjectDto, mockUserId);
      expect(result).toEqual(createdProject);
      expect(projectModel.create).toHaveBeenCalledWith({
        ...createProjectDto,
        owner: mockUserId,
      });
    });
  });

  describe('findAllByOwner', () => {
    it('should retrieve all projects for the user with pagination', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      const mockProjects = [mockProject];

      mockProjectModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProjects),
      });
      mockProjectModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAllByOwner(mockUserId, paginationQuery);
      expect(result).toEqual({
        projects: mockProjects,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(projectModel.find).toHaveBeenCalledWith({
        owner: mockUserId,
        deletedAt: null,
      });
    });
  });

  describe('findOneById', () => {
    it('should return a project by ID', async () => {
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      const result = await service.findOneById(mockProjectId);
      expect(result).toEqual(mockProject);
      expect(projectModel.findById).toHaveBeenCalledWith(mockProjectId);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOneById(mockProjectId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a project if user is the owner', async () => {
      const updateProjectDto: UpdateProjectDto = { name: 'Updated Project' };

      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });
      mockProject.save.mockResolvedValue({
        ...mockProject,
        ...updateProjectDto,
      });

      const result = await service.update(
        mockProjectId,
        mockUserId,
        updateProjectDto,
      );
      expect(result).toEqual({ ...mockProject, ...updateProjectDto });
      expect(mockProject.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const otherUserId = new Types.ObjectId();
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      await expect(
        service.update(mockProjectId, otherUserId, { name: 'New name' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('delete', () => {
    it('should delete a project if user is the owner', async () => {
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });
      mockProjectModel.findByIdAndDelete.mockResolvedValue(mockProject);

      await service.delete(mockProjectId, mockUserId);
      expect(projectModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockProjectId,
      );
    });

    it('should throw UnauthorizedException if user is not the owner', async () => {
      const otherUserId = new Types.ObjectId();
      mockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      await expect(service.delete(mockProjectId, otherUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
