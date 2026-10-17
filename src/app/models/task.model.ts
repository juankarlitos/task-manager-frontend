export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
};

export const TASK_PRIORITY_ICONS: Record<TaskPriority, string> = {
  LOW: 'south',
  MEDIUM: 'remove',
  HIGH: 'north',
};

export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
  PENDING: 'schedule',
  IN_PROGRESS: 'autorenew',
  COMPLETED: 'check_circle',
};

export interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export const TASK_PRIORITY_ORDER: Record<TaskPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};
