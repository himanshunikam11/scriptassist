import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
export class TaskFilterDto {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.PENDING, description: 'Filter by task status' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.MEDIUM, description: 'Filter by task priority' })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Search in title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID (UUID)' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Start of due date range (ISO date string)' })
  @IsDateString()
  @IsOptional()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'End of due date range (ISO date string)' })
  @IsDateString()
  @IsOptional()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Pagination: page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Pagination: limit per page', default: 10 })
  @IsOptional()
  limit?: number;
} 