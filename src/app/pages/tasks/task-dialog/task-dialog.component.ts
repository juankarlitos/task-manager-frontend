import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import {
  Task,
  TASK_PRIORITIES,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_ICONS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from '../../../models/task.model';
import { MatIconModule } from '@angular/material/icon';

export interface TaskDialogData {
  task?: Task;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.css',
})
export class TaskDialogComponent {
  isEdit = !!this.data.task;

  priorities = TASK_PRIORITIES;
  statuses = TASK_STATUSES;
  priorityLabels = TASK_PRIORITY_LABELS;
  statusLabels = TASK_STATUS_LABELS;
  priorityIcons = TASK_PRIORITY_ICONS;
  statusIcons = TASK_STATUS_ICONS;

  form = this.fb.group({
    title: [this.data.task?.title ?? '', Validators.required],
    description: [this.data.task?.description ?? ''],
    priority: [this.data.task?.priority ?? '', Validators.required],
    status: [this.data.task?.status ?? '', Validators.required],
    completed: [this.data.task?.completed ?? false],
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {}

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const result: Task = {
      ...this.data.task,
      ...this.form.getRawValue(),
    } as Task;

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
