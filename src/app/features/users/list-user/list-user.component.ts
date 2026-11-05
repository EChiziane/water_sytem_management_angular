import { ListViewStateService } from '@core/services/dialogs/list-view-state.service';
import { UnsavedChangesService } from '@core/services/dialogs/unsaved-changes.service';
import { OperationFeedbackService } from '@core/services/dialogs/operation-feedback.service';
import { usesBrowserData } from '@shared/config/data-mode';
import { TranslationService } from '@core/services/i18n/translation.service';
import { describeStatus } from '@shared/utils/status-presentation';
import { AuthSessionService } from '@core/auth/auth-session.service';
import { OperationConfirmationService } from '@core/services/dialogs/operation-confirmation.service';
import { tap } from 'rxjs';
import { Component } from '@angular/core';
import { User } from '@shared/models/user';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserService } from '@core/services/users/user.service';
import { Router } from '@angular/router';
import { ROLE_OPTIONS } from '@shared/constants/app-labels';

@Component({
  selector: 'app-listuser',
  standalone: false,
  templateUrl: './list-user.component.html',
  styleUrl: './list-user.component.scss',
})
export class ListuserComponent {
  readonly defaultPassword = !usesBrowserData() ? '' : '123456';
  get passwordHint() {
    return this.translations.instant(
      !usesBrowserData() ? 'accountSecurity.productionPassword' : 'accountSecurity.localPassword',
    );
  }
  dataSource: User[] = [];
  listOfDisplayData: User[] = [];

  readonly roleOptions: Array<{ label: string; value: User['role'] }> = ROLE_OPTIONS;

  drawerWidth: string | number = 720;

  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;

  searchValue = '';
  visible = false;
  visible1 = false; // Controla a visibilidade do modal
  userForm!: FormGroup;
  currentEditingUserId: string | null = null;
  isUserDrawerVisible = false;
  isSaving = false;

  pageIndex = 1;
  ngOnDestroy() {
    this.views.save('users', { searchValue: this.searchValue, pageIndex: this.pageIndex });
  }
  constructor(
    private views: ListViewStateService,
    private unsaved: UnsavedChangesService,
    private feedback: OperationFeedbackService,
    private translations: TranslationService,
    public session: AuthSessionService,
    private confirmations: OperationConfirmationService,
    private http: HttpClient,
    private message: NzMessageService,
    private userService: UserService,
    private modal: NzModalService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.initForms();
  }

  get userDrawerTitle(): string {
    return this.currentEditingUserId ? 'Editar Utilizador' : 'Criar Utilizador';
  }

  roleLabel(role: User['role']): string {
    return this.roleOptions.find((option) => option.value === role)?.label || role;
  }

  onBack() {
    window.history.back();
  }

  loadFailed = false;
  isLoading = false;
  loadUsers() {
    this.loadFailed = false;
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.isLoading = false;
        this.dataSource = users;
        this.listOfDisplayData = [...users];

        this.totalUsers = users.length;
        this.activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
        this.inactiveUsers = users.filter((u) => u.status === 'INACTIVE').length;
        this.search();
      },
      error: () => {
        this.loadFailed = true;
        this.isLoading = false;
      },
    });
  }

  search(): void {
    this.visible = false;

    const q = this.searchValue.toLowerCase().trim();
    this.listOfDisplayData = this.dataSource.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.login?.toLowerCase().includes(q),
    );
  }

  submitUser(): void {
    if (this.userForm.invalid || this.isSaving) return;
    const userData = { ...this.userForm.value };
    const id = this.currentEditingUserId;
    if (id && !userData.password) delete userData.password;
    this.confirmations.run(
      {
        key: 'save-user:' + (id || 'new'),
        title: this.confirmations.text('saveUserTitle'),
        description: this.confirmations.text('saveUserDescription'),
        fields: [
          [this.confirmations.text('user'), userData.name],
          [this.confirmations.text('role'), this.roleLabel(userData.role)],
          [
            this.confirmations.text('status'),
            this.translations.instant(describeStatus('user', userData.status).label),
          ],
        ],
        confirmLabel: this.confirmations.text('save'),
      },
      () => {
        this.isSaving = true;
        return (
          id ? this.userService.updateUser(id, userData) : this.userService.addUser(userData)
        ).pipe(
          tap({
            next: () => {
              if (id === this.session.getUser()?.id && userData.password) {
                this.session.clear();
                this.router.navigate(['/login']);
                this.closeUserDrawer(true);
                this.isSaving = false;
                return;
              }
              this.loadUsers();
              this.closeUserDrawer(true);
              this.message.success('Conta guardada com sucesso.');
              this.isSaving = false;
            },
            error: (error) => {
              this.feedback.error(
                error,
                error.error?.message ||
                  'Não foi possível guardar a conta. O formulário foi preservado.',
              );
              this.isSaving = false;
            },
          }),
        );
      },
    );
  }

  ngOnInit(): void {
    Object.assign(this, this.views.read('users'));
    this.loadUsers();
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  open(): void {
    this.visible1 = true;
  }

  close(): void {
    this.visible1 = false;
  }

  viewUser(data: User) {
    this.router.navigate(['/app/profile', data.id]);
  }

  editUser(user: User) {
    this.currentEditingUserId = user.id;
    this.userForm.controls['password'].setValidators([
      Validators.minLength(!usesBrowserData() ? 12 : 6),
    ]);
    this.userForm.controls['password'].setValue('');
    this.userForm.controls['password'].updateValueAndValidity();

    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      status: user.status,
      phone: user.phone,
      role: user.role,
    });
    this.isUserDrawerVisible = true;
  }

  openUserDrawer() {
    this.isUserDrawerVisible = true;
    this.currentEditingUserId = null;
    this.userForm.controls['password'].setValidators([
      Validators.required,
      Validators.minLength(!usesBrowserData() ? 12 : 6),
    ]);
    this.userForm.reset({ status: 'ACTIVE', role: 'OPERATOR', password: this.defaultPassword });
  }

  async closeUserDrawer(saved = false) {
    if (this.isSaving && !saved) return;
    if (!saved && this.userForm.dirty && !(await this.unsaved.confirm())) return;
    this.isUserDrawerVisible = false;
    this.currentEditingUserId = null;
    this.userForm.reset({ status: 'ACTIVE', role: 'OPERATOR', password: this.defaultPassword });
  }

  deleteUser(user: User): void {
    this.confirmations.run(
      {
        key: 'deactivate-user:' + user.id,
        title: 'Desativar utilizador?',
        description: 'A conta deixará de poder iniciar sessão. O histórico será preservado.',
        fields: [['Utilizador', user.name]],
        confirmLabel: 'Desativar',
      },
      () =>
        this.userService.deleteUser(user.id).pipe(
          tap({
            next: () => {
              this.loadUsers();
              this.message.success('Utilizador desativado. O histórico foi preservado.');
            },
            error: () => this.message.error('Erro ao eliminar o utilizador.'),
          }),
        ),
    );
  }

  private initForms(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: [
        this.defaultPassword,
        [Validators.required, Validators.minLength(!usesBrowserData() ? 12 : 6)],
      ],
      status: [''],
      phone: ['', Validators.required],
      role: ['OPERATOR', Validators.required],
    });
  }
}
