import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

/**
 * Service responsible for identifying and queueing overdue tasks for processing.
 */
@Injectable()
export class OverdueTasksService {
  private readonly logger = new Logger(OverdueTasksService.name);

  constructor(
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  /**
   * Cron job that runs every hour to check for overdue tasks.
   * Overdue tasks are those whose due date has passed and are still pending.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.debug('Checking for overdue tasks...');
    
    const now = new Date();
    try {
      const overdueTasks = await this.tasksRepository.find({
        where: {
          dueDate: LessThan(now),
          status: TaskStatus.PENDING,
        },
        select: ['id', 'status']
      });
  
      if (!overdueTasks.length) {
        this.logger.log('No overdue tasks found');
        return;
      }
      
      this.logger.log(`Found ${overdueTasks.length} overdue tasks`);
      
      // Add tasks to the queue to be processed
      await Promise.all(
        overdueTasks.map(task => 
          this.taskQueue.add('overdue-tasks-notification',
            {
              taskId: task.id,
              status: task.status
            }
          )
        )
      )
      
      this.logger.debug('Overdue tasks check completed');
    } catch (error: any) {
      this.logger.error('Error while checking overdue tasks', error.stack);
    }
  }
} 