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

  async findAllByOwner(ownerId: Types.ObjectId): Promise<Project[]> {
    return this.project.find({ owner: ownerId, deletedAt: null }).exec();
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
