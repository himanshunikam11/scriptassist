import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpException, HttpStatus, UseInterceptors, HttpCode } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { TaskFilterDto } from './dto/task-filter.dto';
import { BatchProcessDto } from './dto/batch-process.dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor)
@RateLimit({ limit: 5, windowMs: 9000 })
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) { }

  /**
   * Create a new task.
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() createTaskDto: CreateTaskDto) {
    try {
      return this.tasksService.create(createTaskDto);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all tasks with optional filters (admin only).
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find all tasks with optional filtering' })
  @Roles('admin')
  async findAll(@Query() filters: TaskFilterDto) {
    try {
      const { page, limit } = filters;
      const result = await this.tasksService.findAllWithFilters(filters)
  
      return {
        data: result.tasks,
        count: result.total,
        page,
        totalPages: Math.ceil(result.total / limit!)
      };
    } catch (error) {
      throw new HttpException('Failed to fetch tasks', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get task statistics.
   */
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats() {
    try {
      return this.tasksService.getStatistics();
    } catch (error) {
      throw new HttpException('Failed to get statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get task by ID.
   */
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@Param('id') id: string) {
    try {
      const task = await this.tasksService.findOne(id);
      return task;
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Update task by ID.
   */
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a task' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    try {
      return this.tasksService.update(id, updateTaskDto);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete task by ID.
   */
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a task' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    try {
      await this.tasksService.remove(id)
      return { message: 'Task deleted successfully' };
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Batch process multiple task operations.
   */
  @Post('batch')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch process multiple tasks' })
  async batchProcess(@Body() operations: BatchProcessDto) {
    try {
      return await this.tasksService.batchProcess(operations);
    } catch (error: any) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
} 