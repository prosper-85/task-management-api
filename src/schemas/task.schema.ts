// src/schemas/task.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @ApiProperty()
  @Prop({ required: true })
  title: string;

  @ApiProperty({ required: false })
  @Prop()
  description: string;

  @ApiProperty()
  @Prop({ required: true, enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ required: false })
  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
