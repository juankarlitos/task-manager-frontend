import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./pages/tasks/tasks.component').then((m) => m.TasksComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'tasks' },
];
