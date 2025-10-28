import {Component} from '@angular/core';
import {User} from '../../models/user';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../services/auth.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-listuser',
  standalone: false,
  templateUrl: './listuser.component.html',
  styleUrl: './listuser.component.scss'
})
export class ListuserComponent {
  dataSource: User[] = [];
  listOfDisplayData: User[] = [];

  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;

  searchValue = '';
  visible = false;
  visible1 = false; // Controla a visibilidade do modal
  userForm!: FormGroup;
  currentEditingUserId: string | null = null;
  isUserDrawerVisible = false;

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private userService: AuthService,
    private modal: NzModalService,
    private fb: FormBuilder
  ) {
    this.initForms();
  }

  get userDrawerTitle(): string {
    return this.currentEditingUserId ? 'Editar Utilizador' : 'Criar Utilizador';
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      console.log(users);
      this.listOfDisplayData = users; // Atualiza após receber os dados
      this.totalUsers = users.length;
      this.activeUsers = users.filter(user => user.status === 'ACTIVE').length;
      this.inactiveUsers = users.filter(user => user.status === 'INACTIVE').length;
    });
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  search(): void {
    this.visible = false;
    this.listOfDisplayData = this.dataSource.filter(
      (item: User) => item.name.toLowerCase().includes(this.searchValue.toLowerCase())
    );
  }

  open(): void {
    this.visible1 = true;
  }

  close(): void {
    this.visible1 = false;
  }

  viewUser(data: User) {
    // Implementar visualização do utilizador
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
    this.userForm.reset({status: 'CREATED'});
  }

  closeUserDrawer() {
    this.isUserDrawerVisible = false;
    this.currentEditingUserId = null;
    this.userForm.reset({status: 'CREATED'});
  }

  submitUser() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;

      if (this.currentEditingUserId) {
        this.userService.updateUser(this.currentEditingUserId, userData).subscribe({
          next: () => {
            this.loadUsers();
            this.closeUserDrawer();
            this.message.success('Utilizador atualizado com sucesso! ✅');
          },
          error: () => {
            this.message.error("Erro ao atualizar o utilizador.");
          }
        });
      } else {
        this.userService.addUser(userData).subscribe({
          next: () => {
            this.loadUsers();
            this.closeUserDrawer();
            this.message.success('Utilizador guardado com sucesso!');
          },
          error: () => {
            this.message.error("Erro ao guardar o utilizador.");
          }
        });
      }
    }
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
      role: ['USER', Validators.required],
    });
  }
}
