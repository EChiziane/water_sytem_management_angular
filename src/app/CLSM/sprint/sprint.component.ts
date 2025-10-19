import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SprintService } from '../../services/sprint.service';
import { Sprint } from '../../models/CSM/sprint';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';


@Component({
  selector: 'app-sprint',
  templateUrl: './sprint.component.html',
  standalone: false,
  styleUrls: ['./sprint.component.scss']
})
export class SprintComponent implements OnInit {

  allSprints: Sprint[] = [];
  listOfDisplayData: Sprint[] = [];
  searchValue = '';
  isLoading = false;

  totalSprints = 0;
  totalEmExecucao = 0;
  totalEncerrados = 0;

  // Drawer
  isSprintDrawerVisible = false;
  sprintForm!: FormGroup;
  currentEditingSprintId: string | null = null;

  // Inline editing
  editingSprint?: Sprint | null = null;
  editingField?: string | null = null;

  constructor(
    private sprintService: SprintService,
    private message: NzMessageService,
    private modal: NzModalService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSprints();
  }

  private loadSprints(): void {
    this.isLoading = true;
    this.sprintService.getSprints().subscribe({
      next: (sprints) => {
        this.allSprints = sprints;
        this.listOfDisplayData = [...sprints];
        this.refreshTotals();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Erro ao carregar sprints 🚫');
      }
    });
  }

  private refreshTotals(): void {
    this.totalSprints = this.allSprints.length;
    this.totalEmExecucao = this.allSprints.filter(s => s.status === 'EM_EXECUCAO').length;
    this.totalEncerrados = this.allSprints.filter(s => s.status === 'ENCERRADO').length;
  }

  filterByStatus(status: 'EM_EXECUCAO' | 'ENCERRADO'): void {
    this.listOfDisplayData = this.allSprints.filter(s => s.status === status);
  }

  showAll(): void {
    this.listOfDisplayData = [...this.allSprints];
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.showAll();
      return;
    }
    this.listOfDisplayData = this.allSprints.filter(sprint =>
      sprint.code.toLowerCase().includes(val) ||
      sprint.name.toLowerCase().includes(val) ||
      sprint.description.toLowerCase().includes(val)
    );
  }

  startInlineEdit(sprint: Sprint, field: string): void {
    this.editingSprint = { ...sprint };
    this.editingField = field;
  }

  saveInlineEdit(original: Sprint, field: string): void {
    if (!this.editingSprint) return;

    const updated = { ...original, [field]: (this.editingSprint as any)[field] };

    this.sprintService.updateSprint(original.id, updated).subscribe({
      next: () => {
        Object.assign(original, updated);
        this.message.success(`Campo ${field} atualizado! ✅`);
        this.editingSprint = null;
        this.editingField = null;
      },
      error: () => {
        this.message.error('Erro ao atualizar 🚫');
        this.editingSprint = null;
        this.editingField = null;
      }
    });
  }

  updateStatus(sprint: Sprint, newStatus: string): void {
    if (sprint.status === newStatus) return;

    const updated = { ...sprint, status: newStatus };

    if (newStatus === 'ENCERRADO') {
      this.modal.confirm({
        nzTitle: 'Encerrar Sprint',
        nzContent: `Tem certeza que deseja encerrar a sprint <strong>${sprint.name}</strong>?`,
        nzOkText: 'Sim',
        nzOkType: 'primary',
        nzCancelText: 'Cancelar',
        nzOnOk: () => {
          this.sprintService.updateSprint(sprint.id, updated).subscribe({
            next: () => {
              sprint.status = newStatus;
              this.refreshTotals();
              this.message.success('Sprint encerrada ✅');
            },
            error: () => this.message.error('Erro ao encerrar sprint 🚫')
          });
        }
      });
    } else {
      this.sprintService.updateSprint(sprint.id, updated).subscribe({
        next: () => {
          sprint.status = newStatus;
          this.refreshTotals();
          this.message.success(`Sprint atualizada para ${newStatus} ✅`);
        },
        error: () => this.message.error('Erro ao atualizar status 🚫')
      });
    }
  }

  deleteSprint(sprint: Sprint): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar o Sprint?',
      nzContent: `Sprint: <strong>${sprint.name}</strong>`,
      nzOkText: 'Sim',
      nzOkType: 'primary',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.sprintService.deleteSprint(sprint.id).subscribe({
          next: () => {
            this.loadSprints();
            this.message.success('Sprint deletado com sucesso! 🗑️');
          },
          error: () => this.message.error('Erro ao deletar sprint. 🚫')
        });
      }
    });
  }

  openSprintDrawer(): void {
    this.isSprintDrawerVisible = true;
    this.currentEditingSprintId = null;
    this.sprintForm.reset({ status: 'EM_EXECUCAO' });
  }

  closeSprintDrawer(): void {
    this.isSprintDrawerVisible = false;
    this.sprintForm.reset({ status: 'EM_EXECUCAO' });
    this.currentEditingSprintId = null;
  }

  get sprintDrawerTitle(): string {
    return this.currentEditingSprintId ? 'Edição de Sprint' : 'Criação de Sprint';
  }



  private initForm(): void {
    this.sprintForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      code: ['', Validators.required],
      status: ['EM_EXECUCAO', Validators.required]
    });
  }

  isSaving = false;
  submitSprint(): void {
    if (!this.sprintForm.valid) return;

    const sprintData = this.sprintForm.value;
    this.isSaving = true; // ⚡ Início do spinner

    const request$ = this.currentEditingSprintId
      ? this.sprintService.updateSprint(this.currentEditingSprintId, sprintData)
      : this.sprintService.addSprint(sprintData);

    request$.subscribe({
      next: () => {
        this.loadSprints();
        this.closeSprintDrawer();
        this.message.success(
          this.currentEditingSprintId
            ? 'Sprint atualizado com sucesso! ✅'
            : 'Sprint criada com sucesso! ✅'
        );
        this.isSaving = false; // ⚡ Fim do spinner
      },
      error: () => {
        this.message.error(
          this.currentEditingSprintId
            ? 'Erro ao atualizar sprint 🚫'
            : 'Erro ao criar sprint 🚫'
        );
        this.isSaving = false; // ⚡ Fim do spinner
      }
    });
  }


}
