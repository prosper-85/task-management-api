import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from 'src/schemas/project.schema';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Project.name) private project: Model<Project>) {}

  async create(
    createProjectDto: CreateProjectDto,
    ownerId: Types.ObjectId,
  ): Promise<Project> {
    const newProject = new this.project({
      ...createProjectDto,
      owner: ownerId,
    });
    return newProject.save();
  }

  async findAllByOwner(
    ownerId: Types.ObjectId,
    paginationQuery: PaginationQueryDto,
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const [projects, total] = await Promise.all([
      this.project
        .find({ owner: ownerId, deletedAt: null })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.project.countDocuments({ owner: ownerId, deletedAt: null }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      projects,
      total,
      page,
      totalPages,
    };
  }

  async findOneById(projectId: Types.ObjectId): Promise<Project> {
    const project = await this.project.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    projectId: Types.ObjectId,
    ownerId: Types.ObjectId,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOneById(projectId);
    if (!project.owner.equals(ownerId)) {
      throw new UnauthorizedException(
        'You are not authorized to update this project',
      );
    }
    Object.assign(project, updateProjectDto);
    return project.save();
  }

  async delete(
    projectId: Types.ObjectId,
    ownerId: Types.ObjectId,
  ): Promise<void> {
    const project = await this.findOneById(projectId);

    if (!project.owner.equals(ownerId)) {
      throw new UnauthorizedException(
        'You are not authorized to delete this project',
      );
    }

    await this.project.findByIdAndDelete(projectId);
  }
}
