import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskFilterDto } from './dto/task-filter.dto';
import { BatchProcessDto } from './dto/batch-process.dto';
import { plainToInstance } from 'class-transformer';
import { TaskResponseDto } from './dto/task-response.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private dataSource: DataSource,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
  ) { }

  /**
   * Creates a new task and enqueues it for processing.
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const task = manager.create(Task, createTaskDto);
      console.log(createTaskDto);

      const savedTask = await manager.save(task);

      try {
        const job = await this.taskQueue.add('task-status-update', {
          taskId: savedTask.id,
          status: savedTask.status,
        });
      } catch (error) {
        throw new HttpException(
          'Failed to queue task for processing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return savedTask;
    });

  }

  /**
   * Retrieves tasks based on filter criteria with pagination support.
   */
  async findAllWithFilters(filters: TaskFilterDto): Promise<{ tasks: TaskResponseDto[]; total: number }> {
    const { status, priority, search, userId, dueDateFrom, dueDateTo, page = 1, limit = 10 } = filters;

    const query = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user');

    if (status) query.andWhere('task.status = :status', { status });
    if (priority) query.andWhere('task.priority = :priority', { priority });
    if (userId) query.andWhere('task.userId = :userId', { userId });

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (dueDateFrom) query.andWhere('task.dueDate >= :dueDateFrom', { dueDateFrom });
    if (dueDateTo) query.andWhere('task.dueDate <= :dueDateTo', { dueDateTo });

    const [tasks, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('task.createdAt', 'DESC')
      .getManyAndCount();

    return {
      tasks: plainToInstance(TaskResponseDto, tasks, { excludeExtraneousValues: true }),
      total
    };
  }

  /**
  * Returns aggregated task statistics grouped by status and priority.
  */
  async getStatistics() {
    try {
      const result = this.tasksRepository
        .createQueryBuilder('task')
        .select([
          'COUNT(*) AS total',
          `COUNT(*) FILTER (WHERE task.status = 'COMPLETED') AS completed`,
          `COUNT(*) FILTER (WHERE task.status = 'IN_PROGRESS') AS inProgress`,
          `COUNT(*) FILTER (WHERE task.status = 'PENDING') AS pending`,
          `COUNT(*) FILTER (WHERE task.priority = 'HIGH') AS highPriority`,
        ])
        .getRawOne();

      return result;
    } catch (error) {
      throw new HttpException('Failed to fetch task statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
  * Finds a task by ID and includes user relation.
  */
  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException(`Task not found`);
    }

    return task;

  }

  /**
   * Updates a task and enqueues a status update job if needed.
   */
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const task = await manager.findOneOrFail(Task, { where: { id } });
      const originalStatus = task.status;

      const updated = manager.merge(Task, task, updateTaskDto) as Task;
      const saved = await manager.save(updated);

      if (originalStatus !== saved.status) {
        try {
          await this.taskQueue.add('task-status-update', {
            taskId: saved.id,
            status: saved.status,
          });
        } catch (error) {
          console.warn('Failed to enqueue status update for task:', error);
        }
      }

      return saved;
    })
  }

   /**
   * Deletes a task by ID.
   */
  async remove(id: string): Promise<void> {
    const task = await this.tasksRepository.delete(id);
    if (task.affected === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  /**
   * Finds tasks by status using raw SQL.
   */
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const query = 'SELECT * FROM tasks WHERE status = $1';
    return this.tasksRepository.query(query, [status]);
  }

  /**
   * Updates task status within a transaction.
   * Used by the queue processor.
   */
  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const task = await manager.findOne(Task, { where: { id } });
      if (!task) {
        throw new NotFoundException(`Task not found`);
      }
      task.status = status;
      return manager.save(task);
    });
  }

  /**
   * Processes a batch of tasks: mark as complete or delete.
   */
  async batchProcess(operations: BatchProcessDto) {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const tasks = await manager.findBy(Task, { id: In(operations.tasks) });

      switch (operations.action) {
        case 'complete': {
          const updateTask = tasks.map(task => {
            task.status = TaskStatus.COMPLETED;
            return task;
          });

          const saveTasks = await manager.save(updateTask);

          await Promise.all(saveTasks.map(task =>
            this.taskQueue.add('task-status-update',
              {
                taskId: task.id,
                status: task.status
              })
          ));

          return { updated: saveTasks }
        }

        case 'delete': {
          await manager.remove(tasks);
          return { deleted: tasks };
        }

        default:
          throw new HttpException(`Unknown batch action: ${operations.action}`,HttpStatus.BAD_REQUEST,);

      }
    })
  }

  /**
   * Finds tasks that are overdue (due date in the past and not completed).
   */
  async findOverdueTasks(page: number, limit: number): Promise<[Task[], number]> {
    return this.tasksRepository
      .createQueryBuilder('task')
      .where('task.dueDate < :now', { now: new Date().toISOString() })
      .andWhere('task.status != :completed', { completed: TaskStatus.COMPLETED })
      .orderBy('task.dueDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
}
