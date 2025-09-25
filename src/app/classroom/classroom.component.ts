import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import {Classroom} from '../models/classroom';
import {ClassroomService} from '../services/classroom.service';
import {TeacherService} from '../services/teacher.service';
import {StudentService} from '../services/student.service';
import {Student} from '../models/EISSM/students';
import {Teacher} from '../models/EISSM/Teacher';


@Component({
  selector: 'app-classroom',
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss'],
  standalone: false
})
export class ClassroomComponent implements OnInit {

  listOfDisplayData: Classroom[] = [];
  isClassroomDrawerVisible = false;
  searchValue = '';
  currentEditingClassroomId: string | null = null;

  allStudents: Student[] = [];
  allTeachers: Teacher[] = [];

  classroomForm!: FormGroup;

  constructor(
    private classroomService: ClassroomService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private modal: NzModalService,
    private teacherService: TeacherService,
    private studentService: StudentService,

  ) {
    this.loadData();

  }

  private loadData(): void {
    this.loadStudents();
    this.loadClassrooms()
    this.loadTeachers()
  }

  get drawerTitle(): string {
    return this.currentEditingClassroomId ? 'Edição de Turma' : 'Criação de Turma';
  }

  ngOnInit(): void {
    this.loadClassrooms();
  }

  openClassroomDrawer(): void {
    this.isClassroomDrawerVisible = true;
    this.currentEditingClassroomId = null;
    this.classroomForm.reset();
  }

  submitClassroom(): void {
    if (this.classroomForm.valid) {
      const data = this.classroomForm.value;

      if (this.currentEditingClassroomId) {
        this.classroomService.updateClassroom(this.currentEditingClassroomId, data).subscribe({
          next: () => {
            this.loadClassrooms();
            this.closeClassroomDrawer();
            this.message.success('Turma atualizada com sucesso! ✅');
          },
          error: () => {
            this.message.error('Erro ao atualizar turma. 🚫');
          }
        });
      } else {
        this.classroomService.addClassroom(data).subscribe({
          next: () => {
            this.loadClassrooms();
            this.closeClassroomDrawer();
            this.message.success('Turma criada com sucesso! ✅');
          },
          error: () => {
            this.message.error('Erro ao criar turma. 🚫');
          }
        });
      }
    }
  }

  deleteClassroom(classroom: Classroom): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar esta turma?',
      nzContent: `Turma: <strong>${classroom.name}</strong>`,
      nzOkText: 'Sim',
      nzOkType: 'primary',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.classroomService.deleteClassroom(classroom.id).subscribe({
          next: () => {
            this.loadClassrooms();
            this.message.success('Turma deletada com sucesso! 🗑️');
          },
          error: () => {
            this.message.error('Erro ao deletar turma. 🚫');
          }
        });
      }
    });
  }

  editClassroom(classroom: Classroom): void {
    this.currentEditingClassroomId = classroom.id;
    this.classroomForm.patchValue({
      name: classroom.name,
      schedule: classroom.schedule
    });
    this.isClassroomDrawerVisible = true;
  }

  closeClassroomDrawer(): void {
    this.isClassroomDrawerVisible = false;
    this.classroomForm.reset();
    this.currentEditingClassroomId = null;
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadClassrooms();
      return;
    }
    this.listOfDisplayData = this.listOfDisplayData.filter(c =>
      c.name.toLowerCase().includes(val) ||
      c.schedule.toLowerCase().includes(val)
    );
  }

  private loadClassrooms(): void {
    this.classroomService.getClassrooms().subscribe(classrooms => {
      this.listOfDisplayData = classrooms;
    });
  }

  private loadTeachers(): void {
    this.teacherService.getTeachers().subscribe(teachers => {
      this.allTeachers = teachers;
    });
  }

  private loadStudents(): void {
    this.studentService.getStudents().subscribe(data => {
      this.allStudents = data;
    });
  }

  private initForms(): void {
    this.classroomForm = this.fb.group({
      name: ['', Validators.required],
      schedule: ['', Validators.required],
      headTeacherId:['', Validators.required],
      assistantTeacherId:['', Validators.required]
    });
  }
}
