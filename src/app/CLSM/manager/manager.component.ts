import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Manager } from '../../models/WSM/manager';
import { ManagerService } from '../../services/manager.service';

@Component({
  selector: 'app-manager',
  standalone:false,
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {

  /* ===== Data ===== */
  listOfDisplayData: Manager[] = [];
  allManagers: Manager[] = [];
  totalManagers = 0;
  totalActiveManagers = 0;
  totalInActiveManagers = 0;
  searchValue = '';
  isLoading = false;

  /* ===== Inline Editing ===== */
  currentEditingManagerId: string | null = null;
  editingField: string | null = null;

  /* ===== Drawer State ===== */
  isManagerDrawerVisible = false;
  managerForm!: FormGroup;

  /* ===== Saving State ===== */
  isSaving = false;

  constructor(
    private managerService: ManagerService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  /* -------------------- Lifecycle -------------------- */
  ngOnInit(): void {
    this.loadManagers();
  }

  get managerDrawerTitle(): string {
    return this.currentEditingManagerId ? 'Atualizar Manager' : 'Criar Manager';
  }

  /* -------------------- Filters -------------------- */
  filterByStatus(status: 'ACTIVO' | 'INACTIVO'): void {
    this.listOfDisplayData = this.allManagers.filter(m => m.status === status);
  }

  showAll(): void {
    this.listOfDisplayData = [...this.allManagers];
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.showAll();
      return;
    }
    this.listOfDisplayData = this.allManagers.filter(manager =>
      manager.name.toLowerCase().includes(val) ||
      manager.contact.toLowerCase().includes(val) ||
      manager.address.toLowerCase().includes(val)
    );
  }

  /* -------------------- Inline Edit -------------------- */
  startInlineEdit(manager: Manager, field: string): void {
    this.currentEditingManagerId = manager.id;
    this.editingField = field;
  }

  saveInlineEdit(manager: Manager, field: string): void {
    if (!this.currentEditingManagerId) return;

    const updated = { ...manager, [field]: (manager as any)[field] };
    this.managerService.updateManager(manager.id, updated).subscribe({
      next: () => {
        Object.assign(manager, updated);
        this.message.success(`Campo ${field} atualizado ✅`);
        this.resetInlineEdit();
      },
      error: () => {
        this.message.error('Erro ao atualizar 🚫');
        this.resetInlineEdit();
      }
    });
  }

  /* -------------------- Drawer Control -------------------- */
  openManagerDrawer(): void {
    this.isManagerDrawerVisible = true;
    this.currentEditingManagerId = null;
    this.managerForm.reset({ status: 'ACTIVO' });
  }

  editManager(manager: Manager): void {
    this.currentEditingManagerId = manager.id;
    this.managerForm.patchValue({
      name: manager.name,
      contact: manager.contact,
      address: manager.address,
      status: manager.status
    });
    this.isManagerDrawerVisible = true;
  }

  closeManagerDrawer(): void {
    this.isManagerDrawerVisible = false;
    this.managerForm.reset({ status: 'ACTIVO' });
    this.currentEditingManagerId = null;
  }

  /* -------------------- Submit -------------------- */
  submitManager(): void {
    if (!this.managerForm.valid) return;

    const managerData = this.managerForm.value;
    this.isSaving = true;

    const request$ = this.currentEditingManagerId
      ? this.managerService.updateManager(this.currentEditingManagerId, managerData)
      : this.managerService.addManager(managerData);

    request$.subscribe({
      next: () => {
        this.loadManagers();
        this.closeManagerDrawer();
        this.message.success(this.currentEditingManagerId ? 'Manager atualizado ✅' : 'Manager criado ✅');
        this.isSaving = false;
      },
      error: () => {
        this.message.error(this.currentEditingManagerId ? 'Erro ao atualizar 🚫' : 'Erro ao criar 🚫');
        this.isSaving = false;
      }
    });
  }

  /* -------------------- Delete -------------------- */
  deleteManager(manager: Manager): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza?',
      nzContent: `Manager: <strong>${manager.name}</strong>`,
      nzOkText: 'Sim',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.managerService.deleteManager(manager.id).subscribe({
          next: () => {
            this.loadManagers();
            this.message.success('Manager deletado ✅');
          },
          error: () => this.message.error('Erro ao deletar 🚫')
        });
      }
    });
  }

  /* -------------------- Load Data -------------------- */
  private loadManagers(): void {
    this.isLoading = true;
    this.managerService.getManagers().subscribe({
      next: (managers) => {
        this.listOfDisplayData = [...managers];
        this.allManagers = [...managers];
        this.totalManagers = managers.length;
        this.totalActiveManagers = managers.filter(m => m.status === 'ACTIVO').length;
        this.totalInActiveManagers = managers.filter(m => m.status === 'INACTIVO').length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Erro ao carregar managers 🚫');
      }
    });
  }

  private initForm(): void {
    this.managerForm = this.fb.group({
      name: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      address: ['', Validators.required],
      status: ['ACTIVO', Validators.required]
    });
  }

  private resetInlineEdit(): void {
    this.currentEditingManagerId = null;
    this.editingField = null;
  }

  /* -------------------- Update Status Inline -------------------- */
  updateStatusManager(manager: Manager, newStatus: 'ACTIVO' | 'INACTIVO'): void {
    if (manager.status === newStatus) return;

    const updated = { ...manager, status: newStatus };

    // Se quiser, pode adicionar confirmação para INACTIVO
    if (newStatus === 'INACTIVO') {
      this.modal.confirm({
        nzTitle: 'Inativar Manager',
        nzContent: `Tem certeza que deseja inativar o manager <strong>${manager.name}</strong>?`,
        nzOkText: 'Sim',
        nzCancelText: 'Não',
        nzOnOk: () => this.changeManagerStatus(manager, updated, newStatus)
      });
    } else {
      this.changeManagerStatus(manager, updated, newStatus);
    }
  }

  private changeManagerStatus(manager: Manager, updated: Manager, newStatus: 'ACTIVO' | 'INACTIVO'): void {
    this.managerService.updateManager(manager.id, updated).subscribe({
      next: () => {
        manager.status = newStatus;
        this.totalActiveManagers = this.allManagers.filter(m => m.status === 'ACTIVO').length;
        this.totalInActiveManagers = this.allManagers.filter(m => m.status === 'INACTIVO').length;
        this.message.success(`Manager atualizado para ${newStatus} ✅`);
      },
      error: () => this.message.error('Erro ao atualizar status 🚫')
    });
  }


}
