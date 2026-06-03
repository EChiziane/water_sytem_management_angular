import {Component} from '@angular/core';
import {User} from '@shared/models/user';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {UserService} from '@core/services/user.service';
import {Router} from '@angular/router';
import {ROLE_OPTIONS} from '@shared/constants/app-labels';


@Component({
  selector: 'app-listuser',
  standalone: false,
  templateUrl: './listuser.component.html',
  styleUrl: './listuser.component.scss'
})
export class ListuserComponent {
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

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private userService: UserService,
    private modal: NzModalService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForms();
  }

  get userDrawerTitle(): string {
    return this.currentEditingUserId ? 'Editar Utilizador' : 'Criar Utilizador';
  }

  roleLabel(role: User['role']): string {
    return this.roleOptions.find(option => option.value === role)?.label || role;
  }

  onBack() {
    window.history.back();
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.dataSource = users;              // <<< importante
      this.listOfDisplayData = [...users];

      this.totalUsers = users.length;
      this.activeUsers = users.filter(u => u.status === 'ACTIVE').length;
      this.inactiveUsers = users.filter(u => u.status === 'INACTIVE').length;
    });
  }

  search(): void {
    this.visible = false;

    const q = this.searchValue.toLowerCase().trim();
    this.listOfDisplayData = this.dataSource.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.login?.toLowerCase().includes(q)
    );
  }

  submitUser() {
    if (!this.userForm.valid) return;

    this.isSaving = true;

    const userData = this.userForm.value;

    if (this.currentEditingUserId) {
      this.userService.updateUser(this.currentEditingUserId, userData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeUserDrawer();
          this.message.success('Utilizador atualizado com sucesso! ✅');
          this.isSaving = false;
        },
        error: () => {
          this.message.error('Erro ao atualizar o utilizador.');
          this.isSaving = false;
        }
      });
    } else {
      this.userService.addUser(userData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeUserDrawer();
          this.message.success('Utilizador guardado com sucesso!');
          this.isSaving = false;
        },
        error: () => {
          this.message.error('Erro ao guardar o utilizador.');
          this.isSaving = false;
        }
      });
    }
  }

  ngOnInit(): void {
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
    this.userForm.reset({status: 'CREATED', role: 'OPERATOR'});
  }

  closeUserDrawer() {
    this.isUserDrawerVisible = false;
    this.currentEditingUserId = null;
    this.userForm.reset({status: 'CREATED', role: 'OPERATOR'});
  }


  deleteUser(user: User): void {
    this.modal.confirm({
      nzTitle: "Tens a certeza de que queres eliminar este utilizador?",
      nzContent: `Utilizador: <strong>${user.name}</strong>`,
      nzOkText: `Sim`,
      nzOkType: `primary`,
      nzCancelText: `Não`,
      nzOnOk: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers();
            this.message.success('Utilizador eliminado com sucesso!');
          },
          error: () => {
            this.message.error("Erro ao eliminar o utilizador.");
          }
        });
      }
    });
  }

  private initForms(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: [''],
      status: [''],
      phone: ['', Validators.required],
      role: ['OPERATOR', Validators.required],
    });
  }
}
