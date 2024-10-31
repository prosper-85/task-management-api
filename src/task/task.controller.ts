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
} from '@nestjs/swagger';

@ApiTags('Tasks')
@Controller('project/tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(private readonly tasksService: TaskService) {}

  @ApiCreatedResponse({ type: Task, description: 'Create Task' })
  @ApiBadRequestResponse()
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

  @ApiOkResponse({ type: Task, isArray: true })
  // @ApiQuery({ name: 'status', enumName })
  @Get(':projectId')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status: TaskStatus,
    @Query('dueDate') dueDate: string,
  ) {
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
    return this.tasksService.findAll(
      new Types.ObjectId(projectId),
      status,
      parsedDueDate,
    );
  }

  @ApiOkResponse({ type: Task })
  @ApiNotFoundResponse()
  @Get(':taskId')
  async findOne(@Param('taskId') taskId: string) {
    console.log('Task ID:', taskId);
    try {
      const taskID = new Types.ObjectId(taskId);
      const task = await this.tasksService.findOne(taskID);
      return task;
    } catch (error) {
      throw new NotFoundException('Task not found or invalid ID');
    }
  }

  @ApiNotFoundResponse()
  @Put(':taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(new Types.ObjectId(taskId), updateTaskDto);
  }
  @ApiNotFoundResponse()
  @Patch('bulk-update-status')
  async bulkUpdateStatus(@Body() bulkUpdateTaskDto: BulkUpdateTaskDto) {
    const updatedTasks =
      await this.tasksService.bulkUpdateStatus(bulkUpdateTaskDto);
    return {
      message: 'Tasks updated successfully',
      updatedTasks,
    };
  }
  @ApiNotFoundResponse()
  @Delete(':taskId')
  async softDelete(@Param('taskId') taskId: string) {
    await this.tasksService.softDelete(new Types.ObjectId(taskId));
    return { message: 'Task deleted successfully' };
  }
}
