// src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { UpdateResult } from 'mongodb';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { Task, TaskStatus } from 'src/schemas/task.schema';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async create(
    createTaskDto: CreateTaskDto,
    projectId: Types.ObjectId,
  ): Promise<Task> {
    const newTask = new this.taskModel({
      ...createTaskDto,
      project: projectId,
    });
    return newTask.save();
  }

  async findAll(
    projectId: Types.ObjectId,
    status?: TaskStatus,
    dueDate?: Date,
  ): Promise<Task[]> {
    const query = { project: projectId, deletedAt: null };

    if (status) {
      query['status'] = status;
    }
    if (dueDate) {
      query['dueDate'] = { $lte: dueDate };
    }

    return this.taskModel.find(query).exec();
  }

  async findOne(taskID: Types.ObjectId): Promise<Task | null> {
    if (!isValidObjectId(taskID)) {
      throw new NotFoundException('Invalid Task ID format');
    }
    console.log('Searching for task with ID:', taskID);
    const task = await this.taskModel.findById({ taskId: taskID }).exec();
    console.log('Query result:', task);

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    taskId: Types.ObjectId,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(taskId);
    Object.assign(task, updateTaskDto);
    return task.save();
  }

  async bulkUpdateStatus(
    bulkUpdateTaskDto: BulkUpdateTaskDto,
  ): Promise<Task[]> {
    const { taskIds, status } = bulkUpdateTaskDto;
    const objectIds = taskIds.map((id) => new Types.ObjectId(id));
    const tasks = await this.taskModel
      .find({
        _id: { $in: objectIds },
        deletedAt: null,
      })
      .exec();
    await this.taskModel
      .updateMany(
        { _id: { $in: objectIds }, deletedAt: null },
        { $set: { status } },
      )
      .exec();
    const updatedTasks = await this.taskModel
      .find({ _id: { $in: objectIds } })
      .exec();

    return updatedTasks;
  }

  async softDelete(taskId: Types.ObjectId): Promise<void> {
    const task = await this.findOne(taskId);
    task.deletedAt = new Date();
    await task.save();
  }
}
