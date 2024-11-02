import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectService } from './project.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Project } from '../schemas/project.schema';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('project')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private readonly projectsService: ProjectService) {}

  @ApiCreatedResponse({ type: Project, description: 'Create a new project' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @Post('create-project')
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    const ownerId = new Types.ObjectId(req.user.userId);
    return this.projectsService.create(createProjectDto, ownerId);
  }

  @ApiOkResponse({
    type: [Project],
    description: 'Retrieve all projects for the user',
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination parameters' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @Get('all-projects')
  async findAll(@Query() paginationQuery: PaginationQueryDto, @Req() req) {
    const ownerId = new Types.ObjectId(req.user.userId);
    return this.projectsService.findAllByOwner(ownerId, paginationQuery);
  }

  @ApiOkResponse({
    type: Project,
    description: 'Retrieve a specific project by ID',
  })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access to the project',
  })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the project' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const projectId = new Types.ObjectId(id);
    const project = await this.projectsService.findOneById(projectId);

    if (!project.owner.equals(req.user.userId)) {
      throw new UnauthorizedException(
        'You are not authorized to view this project',
      );
    }
    return project;
  }

  @ApiOkResponse({ type: Project, description: 'Update an existing project' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access to update the project',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data for update' })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the project' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req,
  ) {
    const projectId = new Types.ObjectId(id);
    const ownerId = new Types.ObjectId(req.user.userId);
    return this.projectsService.update(projectId, ownerId, updateProjectDto);
  }

  @ApiOkResponse({ description: 'Project deleted successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access to delete the project',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the project to delete',
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const projectId = new Types.ObjectId(id);
    const ownerId = new Types.ObjectId(req.user.userId);
    await this.projectsService.delete(projectId, ownerId);
    return { message: 'Project deleted successfully' };
  }
}
