import { Component } from '@angular/core';
import {MaterialItem} from '../../models/MaterialItem';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {MaterialItemService} from '../../services/MaterialItem.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-material-item',
  standalone: false,
  templateUrl: './material-item.component.html',
  styleUrl: './material-item.component.scss'
})
export class MaterialItemComponent {
  listOfDisplayData: MaterialItem[] = [];
  materialItemForm!: FormGroup;
  isDrawerVisible = false;
  currentEditingId: string | null = null;

  constructor(
    private materialService: MaterialItemService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  get drawerTitle(): string {
    return this.currentEditingId ? 'Edit Material Item' : 'Create Material Item';
  }

  ngOnInit(): void {
    this.loadData();
  }

  openDrawer(): void {
    this.isDrawerVisible = true;
    this.currentEditingId = null;
    this.materialItemForm.reset();
  }

  submit(): void {
    if (this.materialItemForm.valid) {
      const data = this.materialItemForm.value;

      if (this.currentEditingId) {
        this.materialService.update(this.currentEditingId, data).subscribe({
          next: () => {
            this.loadData();
            this.closeDrawer();
            this.message.success('Material item updated successfully ✅');
          },
          error: () => this.message.error('Error updating material item 🚫')
        });
      } else {
        this.materialService.create(data).subscribe({
          next: () => {
            this.loadData();
            this.closeDrawer();
            this.message.success('Material item created successfully ✅');
          },
          error: () => this.message.error('Error creating material item 🚫')
        });
      }
    }
  }

  delete(item: MaterialItem): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this material item?',
      nzContent: `Material: <strong>${item.materialDescription}</strong>`,
      nzOkText: 'Yes',
      nzCancelText: 'No',
      nzOnOk: () => {
        this.materialService.delete(item.id).subscribe({
          next: () => {
            this.loadData();
            this.message.success('Material item deleted successfully 🗑️');
          },
          error: () => this.message.error('Error deleting material item 🚫')
        });
      }
    });
  }

  edit(item: MaterialItem): void {
    this.currentEditingId = item.id;
    this.materialItemForm.patchValue(item);
    this.isDrawerVisible = true;
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.materialItemForm.reset();
    this.currentEditingId = null;
  }

  private loadData(): void {
    this.materialService.getAll().subscribe({
      next: (data) => (this.listOfDisplayData = data),
      error: () => this.message.error('Error loading material items 🚫')
    });
  }

  private initForm(): void {
    this.materialItemForm = this.fb.group({
      materialDescription: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      totalItemValue: [{ value: 0, disabled: true }],
      createdAt: [new Date().toISOString()]
    });

    this.materialItemForm.valueChanges.subscribe(val => {
      if (val.quantity && val.unitPrice) {
        this.materialItemForm.patchValue({
          totalItemValue: val.quantity * val.unitPrice
        }, { emitEvent: false });
      }
    });
  }
}
