// src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { Task, TaskStatus } from '../schemas/task.schema';
import { PaginationQueryDto } from '../project/dto/pagination-query.dto';

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
    paginationQuery: PaginationQueryDto,
    status?: TaskStatus,
    dueDate?: Date,
  ): Promise<{
    tasks: Task[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const query: any = { project: projectId, deletedAt: null };

    if (status) {
      query['status'] = status;
    }
    if (dueDate) {
      query['dueDate'] = { $lte: dueDate };
    }
    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.taskModel.countDocuments(query),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      tasks,
      total,
      page,
      totalPages,
    };
  }

  async findOne(taskId: Types.ObjectId): Promise<Task> {
    const task = await this.taskModel.findById({ _id: taskId }).exec();
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
