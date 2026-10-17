import { Component, Inject, ViewChild } from '@angular/core';
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
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import {
  Task,
  TASK_PRIORITIES,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_ICONS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
} from '../../../models/task.model';
import { EsClDateAdapter } from './es-cl-date-adapter';

export interface TaskDialogData {
  task?: Task;
}

interface TimeOption {
  value: string;
  disabled: boolean;
}

function buildTimeValues(): string[] {
  const values: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      values.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return values;
}

const TIME_VALUES = buildTimeValues();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

interface DueDateValue {
  date: Date | null;
  time: string;
}

function isUnchangedDueDate(date: Date, time: string, original: DueDateValue): boolean {
  if (!original.date) {
    return false;
  }

  return (
    date.getFullYear() === original.date.getFullYear() &&
    date.getMonth() === original.date.getMonth() &&
    date.getDate() === original.date.getDate() &&
    time === (original.time || '00:00')
  );
}

function futureDueDateValidator(original: DueDateValue) {
  return (group: AbstractControl): ValidationErrors | null => {
    const date = group.get('dueDateDate')?.value as Date | null;
    if (!date) {
      return null;
    }

    const time = (group.get('dueDateTime')?.value as string) || '00:00';

    if (isUnchangedDueDate(date, time, original)) {
      return null;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);

    return combined.getTime() > Date.now() ? null : { pastDate: true };
  };
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
    MatDatepickerModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: DateAdapter, useClass: EsClDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
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

  @ViewChild('timeSelect') timeSelect?: MatSelect;

  touchUi = window.matchMedia('(max-width: 599px)').matches;

  minSelectableDate = this.isEdit ? null : this.startOfToday();

  private readonly initialDueDate = this.parseDueDate(this.data.task?.dueDate);

  timeOptions: TimeOption[] = this.buildInitialTimeOptions();

  form = this.fb.group(
    {
      title: [this.data.task?.title ?? '', Validators.required],
      description: [this.data.task?.description ?? ''],
      priority: [this.data.task?.priority ?? '', Validators.required],
      status: [this.data.task?.status ?? '', Validators.required],
      completed: [this.data.task?.completed ?? false],
      dueDateDate: [this.initialDueDate.date],
      dueDateTime: [this.initialDueDate.time],
    },
    { validators: futureDueDateValidator(this.initialDueDate) }
  );

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {}

  clearDueDate(): void {
    this.form.patchValue({ dueDateDate: null, dueDateTime: '' });
    this.timeOptions = this.buildTimeOptionsForDate(null);
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value ?? null;
    this.timeOptions = this.buildTimeOptionsForDate(date);

    if (!date) {
      return;
    }

    const isToday = this.isToday(date);
    const currentTime = this.form.controls.dueDateTime.value;

    if (!currentTime) {
      this.form.controls.dueDateTime.setValue(isToday ? this.nearestQuarterHour() : '09:00');
      return;
    }

    if (isToday && timeToMinutes(currentTime) < this.nowMinutes()) {
      this.form.controls.dueDateTime.setValue(this.nearestQuarterHour());
    }
  }

  onTimeSelectOpened(opened: boolean): void {
    if (!opened || this.form.controls.dueDateTime.value) {
      return;
    }

    const index = this.timeOptions.findIndex((option) => option.value === this.nearestQuarterHour());
    if (index >= 0) {
      setTimeout(() => this.timeSelect?._scrollOptionIntoView(index));
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    const result: Task = {
      ...this.data.task,
      title: raw.title!,
      description: raw.description ?? '',
      priority: raw.priority as Task['priority'],
      status: raw.status as Task['status'],
      completed: raw.completed!,
      dueDate: raw.dueDateDate
        ? this.combineDueDate(raw.dueDateDate, raw.dueDateTime || '00:00')
        : undefined,
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private combineDueDate(date: Date, time: string): string {
    const [hours, minutes] = time.split(':');
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  }

  private parseDueDate(value?: string): { date: Date | null; time: string } {
    if (!value) {
      return { date: null, time: '' };
    }

    const date = new Date(value);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date, time: `${hours}:${minutes}` };
  }

  private buildInitialTimeOptions(): TimeOption[] {
    const values =
      this.initialDueDate.time && !TIME_VALUES.includes(this.initialDueDate.time)
        ? [...TIME_VALUES, this.initialDueDate.time].sort()
        : TIME_VALUES;

    return values.map((value) => ({ value, disabled: false }));
  }

  private buildTimeOptionsForDate(date: Date | null): TimeOption[] {
    if (!date || !this.isToday(date)) {
      return TIME_VALUES.map((value) => ({ value, disabled: false }));
    }

    const startOfCurrentHour = new Date().getHours() * 60;
    const nowMinutes = this.nowMinutes();

    return TIME_VALUES.filter((value) => timeToMinutes(value) >= startOfCurrentHour).map(
      (value) => ({ value, disabled: timeToMinutes(value) < nowMinutes })
    );
  }

  private isToday(date: Date): boolean {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  private nowMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private nearestQuarterHour(): string {
    const now = new Date();
    let hours = now.getHours();
    let minutes = Math.ceil(now.getMinutes() / 15) * 15;

    if (minutes === 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
