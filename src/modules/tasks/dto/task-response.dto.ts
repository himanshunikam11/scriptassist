import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { Expose } from 'class-transformer';

export class TaskResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Complete project documentation' })
  @Expose()
  title: string;

  @ApiProperty({ example: 'Add details about API endpoints and data models' })
  @Expose()
  description: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  @Expose()
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  @Expose()
  priority: TaskPriority;

  @ApiProperty({ example: '2023-12-31T23:59:59Z' })
  @Expose()
  dueDate: Date;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  userId: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
} 