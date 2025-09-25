import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import {Teacher} from '../models/EISSM/Teacher';
import {TeacherService} from '../services/teacher.service';


@Component({
  selector: 'app-teacher',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss'],
  standalone: false
})
export class TeacherComponent implements OnInit {

  listOfDisplayData: Teacher[] = [];
  teacherForm!: FormGroup;
  isDrawerVisible = false;
  currentEditingId: string | null = null;
  searchValue = '';

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadTeachers();
  }

  get drawerTitle(): string {
    return this.currentEditingId ? 'Editar Professor' : 'Novo Professor';
  }

  openDrawer(): void {
    this.teacherForm.reset({ type: 'FULL_TIME' });
    this.currentEditingId = null;
    this.isDrawerVisible = true;
  }

  closeDrawer(): void {
    this.isDrawerVisible = false;
    this.currentEditingId = null;
    this.teacherForm.reset({ type: 'FULL_TIME' });
  }

  submitTeacher(): void {
    if (this.teacherForm.invalid) return;

    const data = this.teacherForm.value;

    if (this.currentEditingId) {
      this.teacherService.updateTeacher(this.currentEditingId, data).subscribe({
        next: () => {
          this.message.success('Professor atualizado com sucesso!');
          this.loadTeachers();
          this.closeDrawer();
        },
        error: () => this.message.error('Erro ao atualizar professor.')
      });
    } else {
      this.teacherService.addTeacher(data).subscribe({
        next: () => {
          this.message.success('Professor adicionado com sucesso!');
          this.loadTeachers();
          this.closeDrawer();
        },
        error: () => this.message.error('Erro ao adicionar professor.')
      });
    }
  }

  editTeacher(teacher: Teacher): void {
    this.teacherForm.patchValue(teacher);
    this.currentEditingId = teacher.id!;
    this.isDrawerVisible = true;
  }

  deleteTeacher(teacher: Teacher): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que queres eliminar este professor?',
      nzContent: `<b>${teacher.name}</b>`,
      nzOkText: 'Sim',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.teacherService.deleteTeacher(teacher.id!).subscribe({
          next: () => {
            this.message.success('Professor deletado!');
            this.loadTeachers();
          },
          error: () => this.message.error('Erro ao deletar professor.')
        });
      }
    });
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadTeachers();
      return;
    }

    this.listOfDisplayData = this.listOfDisplayData.filter(t =>
      t.name.toLowerCase().includes(val) ||
      t.specialization.toLowerCase().includes(val)
    );
  }

  private loadTeachers(): void {
    this.teacherService.getTeachers().subscribe(teachers => {
      this.listOfDisplayData = teachers;
    });
  }

  private initForm(): void {
    this.teacherForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      specialization: ['', Validators.required],
      type: ['FULL_TIME', Validators.required]
    });
  }
}
