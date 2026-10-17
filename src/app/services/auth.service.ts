import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const USERNAME_KEY = 'auth_username';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, credentials).pipe(
      tap((res) => this.setToken(res.token)),
      switchMap((res) =>
        this.fetchCurrentUser().pipe(
          catchError(() => of(undefined)),
          map(() => res)
        )
      )
    );
  }

  register(data: RegisterRequest): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/api/auth/register`, data);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  validateSession(): void {
    if (!this.isAuthenticated()) {
      return;
    }

    this.fetchCurrentUser().subscribe({ error: () => undefined });
  }

  private fetchCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/api/auth/me`).pipe(
      tap((user) => this.setUsername(user.username))
    );
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private setUsername(username: string): void {
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
    }
  }
}
