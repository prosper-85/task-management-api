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
} from '@nestjs/swagger';
import { Project } from 'src/schemas/project.schema';

@ApiTags('Projects')
@Controller('project')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private readonly projectsService: ProjectService) {}

  @ApiCreatedResponse({ type: Project, description: 'Create Project' })
  @ApiBadRequestResponse()
  @Post('create-project')
  async create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    const ownerId = new Types.ObjectId(req.user.userId);
    return this.projectsService.create(createProjectDto, ownerId);
  }

  @ApiOkResponse({ type: Project, isArray: true })
  @Get('all-projects')
  async findAll(@Req() req) {
    const ownerId = new Types.ObjectId(req.user.userId);
    return this.projectsService.findAllByOwner(ownerId);
  }

  @ApiOkResponse({ type: Project })
  @ApiNotFoundResponse()
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

  @ApiOkResponse({ type: Project })
  @ApiNotFoundResponse()
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

  @ApiNotFoundResponse()
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const projectId = new Types.ObjectId(id);
    const ownerId = new Types.ObjectId(req.user.userId);
    await this.projectsService.delete(projectId, ownerId);
    return { message: 'Project deleted successfully' };
  }
}
