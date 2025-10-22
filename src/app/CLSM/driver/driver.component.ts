import {Component, OnInit} from '@angular/core';
import {Driver} from '../../models/CSM/driver';
import {DriverService} from '../../services/driver.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';

@Component({
  selector: 'app-driver',
  templateUrl: './driver.component.html',
  styleUrls: ['./driver.component.scss'],
  standalone: false
})
export class DriverComponent implements OnInit {
  listOfDisplayData: Driver[] = [];
  totalDrivers = 0;
  totalActiveDrivers = 0;
  totalInactiveDrivers = 0;
  currentEditingDriverId: string | null = null;

  isLoading = false;
  /* ===== Saving State ===== */
  isSaving = false;
  isDriverDrawerVisible = false;
  searchValue = '';
  driverForm!: FormGroup;

  constructor(private driverService: DriverService,
              private fb: FormBuilder,
              private modal: NzModalService,
              private message: NzMessageService) {
    this.initForm();
  }

  get driverDrawerTitle(): string {
    return this.currentEditingDriverId ? 'Edição de Motorista' : 'Criação de Motorista';
  }

  ngOnInit(): void {
    this.loadDrivers();

  }

  openDriverDrawer(): void {
    this.isDriverDrawerVisible = true;
    this.currentEditingDriverId = null; // Garante que seja criação
    this.driverForm.reset({status: 'ACTIVO'});
  }


  submitDriver(): void {
    if (this.driverForm.valid) {
      const driverData = this.driverForm.value;

      if (this.currentEditingDriverId) {
        // Editar motorista existente
        this.driverService.updateDriver(this.currentEditingDriverId, driverData).subscribe({
          next: () => {
            this.loadDrivers();
            this.closeDriverDrawer();
            this.message.success('Motorista atualizado com sucesso! ✅');
          },
          error: () => {
            this.message.error('Erro ao atualizar motorista. 🚫');
          }
        });
      } else {
        // Criar novo motorista
        this.driverService.addDriver(driverData).subscribe({
          next: () => {
            this.loadDrivers();
            this.closeDriverDrawer();
            this.message.success('Motorista criado com sucesso! ✅');
          },
          error: () => {
            this.message.error('Erro ao criar motorista. 🚫');
          }
        });
      }
    }
  }

  deleteDriver(driver: Driver): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar o Driver?',
      nzContent: `Motorista: <strong>${driver.Name}</strong>`,
      nzOkText: 'Sim',
      nzOkType: 'primary',
      nzCancelText: 'Não',
      nzOnOk: () =>
        this.driverService.deleteDriver(driver.id).subscribe({
          next: () => {
            this.loadDrivers();
            this.message.success('Motorista eliminado com sucesso! 🗑️');
          },
          error: () => {
            this.message.error('Erro ao eliminar motorista. 🚫');
          }
        })
    });
  }

  search(): void {
    // Implementa aqui o filtro de pesquisa
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
    this.driverForm.reset({status: 'ACTIVO'});
    this.currentEditingDriverId = null;
  }

  private loadDrivers(): void {
    this.driverService.getDrivers().subscribe(drivers => {
      this.listOfDisplayData = drivers;
      this.totalDrivers = drivers.length;
      this.totalActiveDrivers = drivers.filter(d => d.status === 'ACTIVO').length;
      this.totalInactiveDrivers = drivers.filter(d => d.status === 'INACTIVO').length;
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
