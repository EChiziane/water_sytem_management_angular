import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

import { DriverService } from '../../services/driver.service';
import { Driver } from '../../models/CSM/driver';

@Component({
  selector: 'app-driver',
  templateUrl: './driver.component.html',
  styleUrls: ['./driver.component.scss'],
  standalone: false
})
export class DriverComponent implements OnInit {

  /* ==================== Data ==================== */
  listOfDisplayData: Driver[] = [];
  searchValue = '';
  isLoading = false;

  /* ==================== Summary Counters ==================== */
  totalDrivers = 0;
  totalActiveDrivers = 0;
  totalInactiveDrivers = 0;

  /* ==================== Drawer State ==================== */
  isDriverDrawerVisible = false;
  driverForm!: FormGroup;
  currentEditingDriverId: string | null = null;

  /* ==================== Inline Editing ==================== */
  editingDriver?: Driver | null = null;
  editingField?: string | null = null;

  /* ==================== Saving State ==================== */
  isSaving = false;

  constructor(
    private driverService: DriverService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  /* ==================== Getters ==================== */
  get driverDrawerTitle(): string {
    return this.currentEditingDriverId ? 'Edição de Motorista' : 'Criação de Motorista';
  }

  /* ==================== Lifecycle ==================== */
  ngOnInit(): void {
    this.loadDrivers();
  }

  /* ==================== Search ==================== */
  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadDrivers();
      return;
    }
    this.listOfDisplayData = this.listOfDisplayData.filter(driver =>
      driver.Name.toLowerCase().includes(val) ||
      driver.Phone.includes(val) ||
      driver.CarDescription.toLowerCase().includes(val)
    );
  }

  /* ==================== Inline Edit ==================== */
  startInlineEdit(driver: Driver, field: string): void {
    this.editingDriver = { ...driver };
    this.editingField = field;
  }

  saveInlineEdit(original: Driver, field: string): void {
    if (!this.editingDriver) return;

    const updated = { ...original, [field]: (this.editingDriver as any)[field] };
    this.isSaving = true;

    this.driverService.updateDriver(original.id, updated).subscribe({
      next: () => {
        Object.assign(original, updated);
        this.message.success(`Campo ${field} atualizado! ✅`);
        this.resetInlineEdit();
        this.isSaving = false;
      },
      error: () => {
        this.message.error('Erro ao atualizar 🚫');
        this.resetInlineEdit();
        this.isSaving = false;
      }
    });
  }

  /* ==================== Drawer Control ==================== */
  openDriverDrawer(): void {
    this.isDriverDrawerVisible = true;
    this.currentEditingDriverId = null;
    this.driverForm.reset({ status: 'ACTIVO' });
  }

  editDriver(driver: Driver): void {
    this.currentEditingDriverId = driver.id;
    this.driverForm.patchValue({
      name: driver.Name,
      phone: driver.Phone,
      carDescription: driver.CarDescription,
      status: driver.status
    });
    this.isDriverDrawerVisible = true;
  }

  closeDriverDrawer(): void {
    this.isDriverDrawerVisible = false;
    this.driverForm.reset({ status: 'ACTIVO' });
    this.currentEditingDriverId = null;
  }

  /* ==================== Submit Drawer ==================== */
  submitDriver(): void {
    if (!this.driverForm.valid) return;

    const driverData = this.driverForm.value;
    this.isSaving = true;

    const request$ = this.currentEditingDriverId
      ? this.driverService.updateDriver(this.currentEditingDriverId, driverData)
      : this.driverService.addDriver(driverData);

    request$.subscribe({
      next: () => {
        this.loadDrivers();
        this.closeDriverDrawer();
        this.message.success(
          this.currentEditingDriverId
            ? 'Motorista atualizado com sucesso! ✅'
            : 'Motorista criado com sucesso! ✅'
        );
        this.isSaving = false;
      },
      error: () => {
        this.message.error(
          this.currentEditingDriverId
            ? 'Erro ao atualizar motorista 🚫'
            : 'Erro ao criar motorista 🚫'
        );
        this.isSaving = false;
      }
    });
  }

  /* ==================== Status Update ==================== */
  updateStatus(driver: Driver, newStatus: string): void {
    if (driver.status === newStatus) return;

    const updated = { ...driver, status: newStatus };

    if (newStatus === 'INACTIVO') {
      this.modal.confirm({
        nzTitle: 'Desativar Driver',
        nzContent: `Tem certeza que deseja desativar o driver <strong>${driver.Name}</strong>?`,
        nzOkText: 'Sim',
        nzCancelText: 'Cancelar',
        nzOnOk: () => this.changeDriverStatus(driver, updated, newStatus)
      });
    } else {
      this.changeDriverStatus(driver, updated, newStatus);
    }
  }

  /* ==================== Delete ==================== */
  deleteDriver(driver: Driver): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar o Motorista?',
      nzContent: `Motorista: <strong>${driver.Name}</strong>`,
      nzOkText: 'Sim',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.driverService.deleteDriver(driver.id).subscribe({
          next: () => {
            this.loadDrivers();
            this.message.success('Motorista eliminado com sucesso! 🗑️');
          },
          error: () => this.message.error('Erro ao eliminar motorista 🚫')
        });
      }
    });
  }

  /* ==================== Private Helpers ==================== */
  private refreshTotals(): void {
    this.totalDrivers = this.listOfDisplayData.length;
    this.totalActiveDrivers = this.listOfDisplayData.filter(s => s.status === 'ACTIVO').length;
    this.totalInactiveDrivers = this.listOfDisplayData.filter(s => s.status === 'INACTIVO').length;
  }

  private loadDrivers(): void {
    this.isLoading = true;
    this.driverService.getDrivers().subscribe({
      next: (drivers) => {
        this.listOfDisplayData = drivers;
        this.refreshTotals();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Erro ao carregar motoristas 🚫');
      }
    });
  }

  private resetInlineEdit(): void {
    this.editingDriver = null;
    this.editingField = null;
  }

  private changeDriverStatus(driver: Driver, updated: Driver, newStatus: string): void {
    this.driverService.updateDriver(driver.id, updated).subscribe({
      next: () => {
        driver.status = newStatus;
        this.refreshTotals();
        this.message.success(`Driver atualizada para ${newStatus} ✅`);
      },
      error: () => this.message.error('Erro ao atualizar status 🚫')
    });
  }

  private initForm(): void {
    this.driverForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      carDescription: ['', Validators.required],
      status: ['ACTIVO', Validators.required]
    });
  }
}
