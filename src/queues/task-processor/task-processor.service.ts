import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';
import { DataSource, EntityManager } from 'typeorm';
import { retry } from 'rxjs';

/**
 * BullMQ processor for handling task-related jobs like status updates and overdue notifications.
 */
@Injectable()
@Processor('task-processing', { concurrency: 5 })
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(private readonly tasksService: TasksService, private readonly dataSource: DataSource) {
    super();
  }

  /**
   * Processes jobs received in the `task-processing` queue.
   * Routes to appropriate handler based on job name.
   * 
   * @param job - The BullMQ job to process
   */
  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    
    try {
      switch (job.name) {
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'overdue-tasks-notification':
          return await this.handleOverdueTasks(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Handles the 'task-status-update' job by updating task status in a transaction.
   *
   * @param job - The job containing taskId and new status
   */
  private async handleStatusUpdate(job: Job) {
    const { taskId, status } = job.data;
    
    if (!taskId || !status) {
      return { success: false, error: 'Missing required data' };
    }
       
    try {
      return this.dataSource.transaction(async (manager: EntityManager) => {
        const task = await this.tasksService.updateStatus(taskId, status);
  
        return { 
          success: true,
          taskId: task.id,
          newStatus: task.status
        };
      })
    } catch (error: any) {
      this.logger.error(`Failed to update task status: ${error.message}`, error.stack);
      throw error;
    }
    
  }

  /**
   * Handles the 'overdue-tasks-notification' job by logging overdue tasks in batches.
   *
   * @param job - The job object (payload is unused here)
   */
  private async handleOverdueTasks(job: Job) {
    this.logger.debug('Processing overdue tasks notification');
    
    const pageSize = 50;
    let page = 1;
    let hasMore = true;

    try {
      while (hasMore) {
        const [tasks, total] = await this.tasksService.findOverdueTasks(page, pageSize);
  
        for (const task of tasks) {
          this.logger.log(`Task ${task.id} is overdue.`);
        }
  
        hasMore = page * pageSize < total;
        page++;
      }
      return { success: true, message: 'Overdue tasks processed' };
    } catch (error: any) {
      this.logger.error(`Failed to process overdue tasks: ${error.message}`, error.stack);
      throw error;
    }
  }
} 