import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { AuthSessionService } from '@core/auth/auth-session.service';
import { UserService } from '@core/services/users/user.service';
import { ROLE_LABELS } from '@shared/constants/app-labels';
import { User } from '@shared/models/user';

type ProfileUser = Partial<Omit<User, 'password'>>;

type ProfileField = {
  label: string;
  value: string;
  icon: string;
  kind?: 'status';
};

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user: ProfileUser | null = null;

  fields: ProfileField[] = [];

  isLoading = false;

  isCurrentUserProfile = true;

  constructor(
    private session: AuthSessionService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    if (userId) {
      this.loadUserProfile(userId);
      return;
    }

    this.user = this.session.getUser();
    this.isCurrentUserProfile = true;
    this.buildFields();
  }

  get displayName(): string {
    return this.user?.name || this.user?.login || 'Utilizador';
  }

  get initials(): string {
    const initials = this.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'UT';
  }

  get roleLabel(): string {
    return this.user?.role ? ROLE_LABELS[this.user.role] : '-';
  }

  get memberSince(): string {
    return this.formatDate(this.user?.createdAt);
  }

  goBack(): void {
    this.router.navigate([this.isCurrentUserProfile ? '/app/dashboard' : '/app/users']);
  }

  private loadUserProfile(userId: string): void {
    this.isLoading = true;
    this.isCurrentUserProfile = this.session.getUser()?.id === userId;

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user || null;
        this.buildFields();
        this.isLoading = false;
      },
      error: () => {
        this.user = null;
        this.buildFields();
        this.isLoading = false;
      },
    });
  }

  private buildFields(): void {
    this.fields = [
      {
        label: 'Nome completo',
        value: this.user?.name || '-',
        icon: 'user',
      },
      {
        label: 'Login',
        value: this.user?.login || '-',
        icon: 'idcard',
      },
      {
        label: 'Email',
        value: this.user?.email || '-',
        icon: 'mail',
      },
      {
        label: 'Telefone',
        value: this.user?.phone || '-',
        icon: 'phone',
      },
      {
        label: 'Perfil de acesso',
        value: this.roleLabel,
        icon: 'safety-certificate',
      },
      {
        label: 'Estado',
        value: this.user?.status || '',
        kind: 'status',
        icon: 'check-circle',
      },
      {
        label: 'Criado em',
        value: this.memberSince,
        icon: 'calendar',
      },
    ];
  }

  private formatDate(value: string | number | Date | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
}
