import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {Student} from '../models/EISSM/students';
import {StudentService} from '../services/student.service';


@Component({
  selector: 'app-student',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
  standalone: false
})
export class StudentComponent implements OnInit {

  listOfDisplayData: Student[] = [];
  studentForm!: FormGroup;
  isStudentDrawerVisible = false;
  currentEditingStudentId: string | null = null;
  searchValue = '';

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  get studentDrawerTitle(): string {
    return this.currentEditingStudentId ? 'Edição de Estudante' : 'Criação de Estudante';
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  openStudentDrawer(): void {
    this.isStudentDrawerVisible = true;
    this.currentEditingStudentId = null;
    this.studentForm.reset();
  }

  closeStudentDrawer(): void {
    this.isStudentDrawerVisible = false;
    this.studentForm.reset();
    this.currentEditingStudentId = null;
  }

  submitStudent(): void {
    if (this.studentForm.valid) {
      const studentData = this.studentForm.value;

      if (this.currentEditingStudentId) {
        this.studentService.updateStudent(this.currentEditingStudentId, studentData).subscribe({
          next: () => {
            this.loadStudents();
            this.closeStudentDrawer();
            this.message.success('Estudante atualizado com sucesso! ✅');
          },
          error: () => {
            this.message.error('Erro ao atualizar estudante. 🚫');
          }
        });
      } else {
        this.studentService.addStudent(studentData).subscribe({
          next: () => {
            this.loadStudents();
            this.closeStudentDrawer();
            this.message.success('Estudante criado com sucesso! ✅');
          },
          error: () => {
            this.message.error('Erro ao criar estudante. 🚫');
          }
        });
      }
    }
  }

  editStudent(student: Student): void {
    this.currentEditingStudentId = student.id;

    this.studentForm.patchValue({
      nome: student.nome,
      numeroEstudante: student.numeroEstudante,
      bi: student.bi,
      dataNascimento: student.dataNascimento,
      endereco: student.endereco,
      nivelAcademico: student.nivelAcademico,
      ultimoNivelIngles: student.ultimoNivelIngles
    });

    this.isStudentDrawerVisible = true;
  }

  deleteStudent(student: Student): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar o Estudante?',
      nzContent: `Estudante: <strong>${student.nome}</strong>`,
      nzOkText: 'Sim',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.studentService.deleteStudent(student.id).subscribe({
          next: () => {
            this.loadStudents();
            this.message.success('Estudante deletado com sucesso! 🗑️');
          },
          error: () => {
            this.message.error('Erro ao deletar estudante. 🚫');
          }
        });
      }
    });
  }

  printStudent(student: Student): void {
    this.studentService.printStudentInvoice(student.id).subscribe({})
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadStudents();
      return;
    }
    this.listOfDisplayData = this.listOfDisplayData.filter(student =>
      student.nome.toLowerCase().includes(val) ||
      student.numeroEstudante.toLowerCase().includes(val)
    );
  }

  private loadStudents(): void {
    this.studentService.getStudents().subscribe(data => {
      this.listOfDisplayData = data;
    });
  }

  private initForm(): void {
    this.studentForm = this.fb.group({
      nome: ['', Validators.required],
      numeroEstudante: ['', Validators.required],
      bi: ['', Validators.required],
      dataNascimento: ['', Validators.required],
      endereco: ['', Validators.required],
      nivelAcademico: ['', Validators.required],
      ultimoNivelIngles: ['', Validators.required]
    });
  }

}
