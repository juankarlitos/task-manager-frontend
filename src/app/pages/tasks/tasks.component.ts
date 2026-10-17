import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Task,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_ICONS,
  TASK_STATUS_LABELS,
} from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { TaskDialogComponent, TaskDialogData } from './task-dialog/task-dialog.component';

const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  pendingTasks: Task[] = [];
  completedTasks: Task[] = [];
  completedCollapsed = true;
  loading = false;

  priorityLabels = TASK_PRIORITY_LABELS;
  statusLabels = TASK_STATUS_LABELS;
  priorityIcons = TASK_PRIORITY_ICONS;
  statusIcons = TASK_STATUS_ICONS;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.groupTasks();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudieron cargar las tareas', 'Cerrar', {
          duration: 4000,
        });
      },
    });
  }

  openCreateDialog(): void {
    this.openDialog({});
  }

  openEditDialog(task: Task): void {
    this.openDialog({ task });
  }

  private openDialog(data: TaskDialogData): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, { data });

    dialogRef.afterClosed().subscribe((result: Task | undefined) => {
      if (!result) {
        return;
      }

      if (data.task?.id != null) {
        this.updateTask(data.task.id, result);
      } else {
        this.createTask(result);
      }
    });
  }

  private createTask(task: Task): void {
    this.taskService.createTask(task).subscribe({
      next: () => {
        this.snackBar.open('Tarea creada', 'Cerrar', { duration: 2500 });
        this.loadTasks();
      },
      error: (err) =>
        this.snackBar.open(this.getErrorMessage(err), 'Cerrar', { duration: 5000 }),
    });
  }

  private updateTask(id: number, task: Task): void {
    this.taskService.updateTask(id, task).subscribe({
      next: () => {
        this.snackBar.open('Tarea actualizada', 'Cerrar', { duration: 2500 });
        this.loadTasks();
      },
      error: (err) =>
        this.snackBar.open(this.getErrorMessage(err), 'Cerrar', { duration: 5000 }),
    });
  }

  private getErrorMessage(err: unknown): string {
    const fallback = 'No se pudo guardar la tarea';
    const body = (err as { error?: unknown })?.error as
      | { errors?: unknown; error?: unknown }
      | undefined;

    if (!body) {
      return fallback;
    }

    if (typeof body.errors === 'string' && body.errors) {
      return body.errors;
    }
    if (Array.isArray(body.errors) && body.errors.length) {
      return body.errors.join(', ');
    }
    if (body.errors && typeof body.errors === 'object') {
      const values = Object.values(body.errors).filter((v) => typeof v === 'string');
      if (values.length) {
        return values.join(', ');
      }
    }
    if (typeof body.error === 'string' && body.error) {
      return body.error;
    }

    return fallback;
  }

  toggleCompleted(task: Task): void {
    if (task.id == null) {
      return;
    }
    const nowCompleted = task.status !== 'COMPLETED';
    this.updateTask(task.id, {
      ...task,
      completed: nowCompleted,
      status: nowCompleted ? 'COMPLETED' : 'PENDING',
    });
  }

  toggleCompletedSection(): void {
    this.completedCollapsed = !this.completedCollapsed;
  }

  priorityLabel(task: Task): string {
    return task.priority ? this.priorityLabels[task.priority] : '';
  }

  priorityIcon(task: Task): string {
    return task.priority ? this.priorityIcons[task.priority] : '';
  }

  statusLabel(task: Task): string {
    return task.status ? this.statusLabels[task.status] : '';
  }

  statusIcon(task: Task): string {
    return task.status ? this.statusIcons[task.status] : '';
  }

  formatDueDate(dueDate: string): string {
    const date = new Date(dueDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = MONTHS_ES[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'COMPLETED') {
      return false;
    }
    return new Date(task.dueDate).getTime() < Date.now();
  }

  cardClasses(task: Task): string[] {
    const classes: string[] = [];
    if (task.priority) {
      classes.push('priority-' + task.priority);
    }
    if (task.status === 'COMPLETED') {
      classes.push('completed-card');
    }
    return classes;
  }

  private groupTasks(): void {
    this.pendingTasks = this.tasks
      .filter((task) => task.status !== 'COMPLETED')
      .sort((a, b) => {
        const orderA = a.priority ? TASK_PRIORITY_ORDER[a.priority] : 3;
        const orderB = b.priority ? TASK_PRIORITY_ORDER[b.priority] : 3;
        return orderA - orderB;
      });

    this.completedTasks = this.tasks.filter((task) => task.status === 'COMPLETED');
  }

  deleteTask(task: Task): void {
    if (task.id == null) {
      return;
    }

    if (!confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.snackBar.open('Tarea eliminada', 'Cerrar', { duration: 2500 });
        this.loadTasks();
      },
      error: () =>
        this.snackBar.open('No se pudo eliminar la tarea', 'Cerrar', { duration: 4000 }),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
