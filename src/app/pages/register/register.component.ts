import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  loading = false;

  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const { username, email, password } = this.form.getRawValue();

    this.authService
      .register({ username: username!, email: email!, password: password! })
      .subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Registro exitoso. Ahora inicia sesión.', 'Cerrar', {
            duration: 4000,
          });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(
            err.error?.message ?? 'No se pudo completar el registro',
            'Cerrar',
            { duration: 4000 }
          );
        },
      });
  }
}
