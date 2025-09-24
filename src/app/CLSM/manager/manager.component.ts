import {Component} from '@angular/core';
import {Manager} from '../../models/WSM/manager';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';
import {ManagerService} from '../../services/manager.service';


@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  standalone: false,
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent {
  listOfDisplayData: Manager[] = [];
  totalManagers = 0;
  totalActiveManagers = 0;
  totalInActiveManagers = 0;
  currentEditingManagerId: string | null = null;
  managerForm!: FormGroup;
  isManagerDrawerVisible = false;
  searchValue = '';

  constructor(
    private managerService: ManagerService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private modal: NzModalService,
  ) {
    this.initForm();
  }

  get managerDrawerTitle(): string {
    return this.currentEditingManagerId ? 'Update Manager' : 'Create Manager';
  }

  ngOnInit(): void {
    this.loadManagers();
  }

  openManagerDrawer(): void {
    this.isManagerDrawerVisible = true;
    this.currentEditingManagerId = null;
    this.managerForm.reset({status: 'ACTIVO'});
  }

  closeManagerDrawer(): void {
    this.isManagerDrawerVisible = false;
    this.managerForm.reset({status: 'ACTIVO'});
    this.currentEditingManagerId = null;
  }

  submitManager(): void {
    if (this.managerForm.valid) {
      const managerData = this.managerForm.value;
      if (this.currentEditingManagerId) {
        this.managerService.updateManager(this.currentEditingManagerId, managerData).subscribe({
            next: () => {
              this.loadManagers();
              this.closeManagerDrawer();
              this.message.success('Manager successfully updated! ✅');
            },
            error: () => {
              this.message.error('An error occurred Updating Manager.');
            }
          }
        )

      } else {
        this.managerService.addManager(managerData).subscribe({
          next: () => {
            this.loadManagers();
            this.closeManagerDrawer();
            this.message.success('Manager successfully added! <UNK>');
          },
          error: () => {
            this.message.error('An error occurred Saving Manager.');
          }
        })
      }
    }
  }

  deleteManager(manager: Manager): void {
    this.modal.confirm({
      nzTitle: 'Are you sure?',
      nzContent: `Manager: <strong>${manager.name}</strong>`,
      nzOkText: 'Yes',
      nzCancelText: 'Cancel',
      nzOkType: 'primary',
      nzOnOk: () => this.managerService.deleteManager(manager.id).subscribe({
        next: () => {
          this.loadManagers();
          this.message.success('Manager successfully deleted!');
        },
        error: () => {
          this.message.error('An error occurred Deleting Manager.');
        }
      })
    })
  }

  search(): void {
    // Implementar filtro de pesquisa se necessário
  }

  editManager(manager: Manager): void {
    this.currentEditingManagerId = manager.id;
    this.managerForm.patchValue({
      address: manager.address,
      status: manager.status,
      contact: manager.contact,
      name: manager.name,

    })
    this.isManagerDrawerVisible = true;
  }

  private loadManagers(): void {
    this.managerService.getManagers().subscribe(managers => {
      this.listOfDisplayData = managers;
      this.totalManagers = managers.length;
      this.totalActiveManagers = managers.filter(m => m.status === 'ACTIVO').length;
      this.totalInActiveManagers = managers.filter(m => m.status === 'INACTIVO').length;
    });
  }

  private initForm(): void {
    this.managerForm = this.fb.group({
      name: ['', Validators.required],
      contact: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      address: ['', Validators.required],
      status: ['Active', Validators.required]
    });
  }

}
