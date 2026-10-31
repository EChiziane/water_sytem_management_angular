import {OperationConfirmationService} from '@core/services/operation-confirmation.service';
import {tap} from 'rxjs';
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
    private confirmations: OperationConfirmationService,
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

  submitUser(): void {
    if (this.userForm.invalid || this.isSaving) return;
    const userData = {...this.userForm.value};
    const id = this.currentEditingUserId;
    this.confirmations.run({key: 'save-user:' + (id || 'new'), title: this.confirmations.text('saveUserTitle'),
      description: this.confirmations.text('saveUserDescription'),
      fields: [[this.confirmations.text('user'), userData.name], [this.confirmations.text('role'), this.roleLabel(userData.role)], [this.confirmations.text('status'), userData.status]],
      confirmLabel: this.confirmations.text('save')}, () => {
      this.isSaving = true;
      return (id ? this.userService.updateUser(id,userData) : this.userService.addUser(userData)).pipe(tap({
        next: () => { this.loadUsers(); this.closeUserDrawer(); this.message.success('Conta guardada com sucesso.'); this.isSaving = false; },
        error: () => { this.message.error('Erro ao guardar a conta.'); this.isSaving = false; }
      }));
    });
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
    this.userForm.reset({status: 'ACTIVE', role: 'OPERATOR', password: '123456'});
  }

  closeUserDrawer() {
    this.isUserDrawerVisible = false;
    this.currentEditingUserId = null;
    this.userForm.reset({status: 'ACTIVE', role: 'OPERATOR', password: '123456'});
  }


  deleteUser(user: User): void {
    this.confirmations.run({key:'deactivate-user:'+user.id,title:'Desativar utilizador?',description:'A conta deixará de poder iniciar sessão. O histórico será preservado.',fields:[['Utilizador',user.name]],confirmLabel:'Desativar'},
      () => this.userService.deleteUser(user.id).pipe(tap({
        next: () => { this.loadUsers(); this.message.success('Utilizador desativado. O histórico foi preservado.'); },
        error: () => this.message.error('Erro ao eliminar o utilizador.')
      })));
  }

  private initForms(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['123456'],
      status: [''],
      phone: ['', Validators.required],
      role: ['OPERATOR', Validators.required],
    });
  }
}
