import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const date = new Date(control.value);
  return date.getTime() > Date.now() ? null : { pastDate: true };
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
    dueDate: [this.data.task?.dueDate?.slice(0, 16) ?? '', futureDateValidator],
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {}

  clearDueDate(): void {
    this.form.controls.dueDate.setValue('');
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    const result: Task = {
      ...this.data.task,
      ...raw,
      dueDate: raw.dueDate ? this.normalizeDueDate(raw.dueDate) : undefined,
    } as Task;

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private normalizeDueDate(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }
}
