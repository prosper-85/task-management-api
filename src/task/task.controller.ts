import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { TaskService } from './task.service';
import { Task, TaskStatus } from 'src/schemas/task.schema';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/project/dto/pagination-query.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('project/tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @ApiCreatedResponse({ type: Task, description: 'Create Task' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiParam({
    name: 'projectId',
    type: String,
    description: 'ID of the project',
  })
  @Post(':projectId')
  async create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Req() req,
  ) {
    const ownerId = new Types.ObjectId(req.user._id);
    return this.tasksService.create(
      createTaskDto,
      new Types.ObjectId(projectId),
    );
  }

  @ApiOkResponse({ type: [Task], description: 'List of tasks for the project' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiQuery({
    name: 'status',
    enum: TaskStatus,
    required: false,
    description: 'Filter tasks by status',
  })
  @ApiQuery({
    name: 'dueDate',
    type: String,
    required: false,
    description: 'Filter tasks due on or before a specific date',
  })
  @ApiParam({
    name: 'projectId',
    type: String,
    description: 'ID of the project',
  })
  @Get(':projectId')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status: TaskStatus,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('dueDate') dueDate: string,
  ) {
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
    return this.tasksService.findAll(
      new Types.ObjectId(projectId),
      paginationQuery,
      status,
      parsedDueDate,
    );
  }

  @ApiOkResponse({ type: Task, description: 'Get task by ID' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiParam({ name: 'id', type: String, description: 'ID of the task' })
  @Get('task/:id')
  async findOne(@Param('id') id: string, @Req() req) {
    const taskId = new Types.ObjectId(id);
    const task = await this.tasksService.findOne(taskId);
    return task;
  }

  @ApiOkResponse({ type: Task, description: 'Task updated successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  @ApiParam({
    name: 'taskId',
    type: String,
    description: 'ID of the task to update',
  })
  @Put(':taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(new Types.ObjectId(taskId), updateTaskDto);
  }

  @ApiOkResponse({
    description: 'Tasks updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        updatedTasks: {
          type: 'array',
          items: { $ref: '#/components/schemas/Task' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid bulk update data' })
  @Patch('bulk-update-status')
  async bulkUpdateStatus(@Body() bulkUpdateTaskDto: BulkUpdateTaskDto) {
    const updatedTasks =
      await this.tasksService.bulkUpdateStatus(bulkUpdateTaskDto);
    return {
      message: 'Tasks updated successfully',
      updatedTasks,
    };
  }

  @ApiOkResponse({ description: 'Task deleted successfully' })
  @ApiNotFoundResponse({ description: 'Task not found' })
  @ApiParam({
    name: 'taskId',
    type: String,
    description: 'ID of the task to delete',
  })
  @Delete(':taskId')
  async softDelete(@Param('taskId') taskId: string) {
    await this.tasksService.softDelete(new Types.ObjectId(taskId));
    return { message: 'Task deleted successfully' };
  }
}
