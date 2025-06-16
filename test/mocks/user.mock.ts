import { Task } from "@modules/tasks/entities/task.entity";

// test/mocks/user.entity.mock.ts
export class UserMock {
    id: string;
    email: string;
    name: string;
    password: string;
    role: string;
    tasks: Task[];
    createdAt: Date;
    updatedAt: Date;
}
