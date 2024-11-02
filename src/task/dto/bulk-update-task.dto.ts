import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';
import { TaskStatus } from '../../schemas/task.schema';

export class BulkUpdateTaskDto {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  taskIds: string[];

  @ApiProperty()
  @IsEnum(TaskStatus, {
    message: 'Status must be one of pending, in-progress, or completed',
  })
  status: TaskStatus;
}
