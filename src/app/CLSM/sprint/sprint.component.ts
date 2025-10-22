import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SprintService } from '../../services/sprint.service';
import { Sprint } from '../../models/CSM/sprint';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-sprint',
  standalone:false,
  templateUrl: './sprint.component.html',
  styleUrls: ['./sprint.component.scss']
})
export class SprintComponent implements OnInit {

  /* ===== Data ===== */
  allSprints: Sprint[] = [];
  listOfDisplayData: Sprint[] = [];
  searchValue = '';
  isLoading = false;

  /* ===== Summary Counters ===== */
  totalSprints = 0;
  totalEmExecucao = 0;
  totalEncerrados = 0;

  /* ===== Drawer State ===== */
  isSprintDrawerVisible = false;
  sprintForm!: FormGroup;
  currentEditingSprintId: string | null = null;

  /* ===== Inline Editing ===== */
  editingSprint?: Sprint | null = null;
  editingField?: string | null = null;

  /* ===== Saving State ===== */
  isSaving = false;

  constructor(
    private sprintService: SprintService,
    private message: NzMessageService,
    private modal: NzModalService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  /* -------------------- Lifecycle -------------------- */
  ngOnInit(): void {
    this.loadSprints();
  }

  /* -------------------- Data Loaders -------------------- */
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

  /* -------------------- Filters -------------------- */
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

  /* -------------------- Inline Edit -------------------- */
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
        this.resetInlineEdit();
      },
      error: () => {
        this.message.error('Erro ao atualizar 🚫');
        this.resetInlineEdit();
      }
    });
  }

  private resetInlineEdit(): void {
    this.editingSprint = null;
    this.editingField = null;
  }

  /* -------------------- Status Update -------------------- */
  updateStatus(sprint: Sprint, newStatus: string): void {
    if (sprint.status === newStatus) return;
    const updated = { ...sprint, status: newStatus };

    if (newStatus === 'ENCERRADO') {
      this.modal.confirm({
        nzTitle: 'Encerrar Sprint',
        nzContent: `Tem certeza que deseja encerrar a sprint <strong>${sprint.name}</strong>?`,
        nzOkText: 'Sim',
        nzCancelText: 'Cancelar',
        nzOnOk: () => this.changeSprintStatus(sprint, updated, newStatus)
      });
    } else {
      this.changeSprintStatus(sprint, updated, newStatus);
    }
  }

  private changeSprintStatus(sprint: Sprint, updated: Sprint, newStatus: string): void {
    this.sprintService.updateSprint(sprint.id, updated).subscribe({
      next: () => {
        sprint.status = newStatus;
        this.refreshTotals();
        this.message.success(`Sprint atualizada para ${newStatus} ✅`);
      },
      error: () => this.message.error('Erro ao atualizar status 🚫')
    });
  }

  /* -------------------- Delete -------------------- */
  deleteSprint(sprint: Sprint): void {
    this.modal.confirm({
      nzTitle: 'Tens certeza que quer eliminar o Sprint?',
      nzContent: `Sprint: <strong>${sprint.name}</strong>`,
      nzOkText: 'Sim',
      nzCancelText: 'Não',
      nzOnOk: () => {
        this.sprintService.deleteSprint(sprint.id).subscribe({
          next: () => {
            this.loadSprints();
            this.message.success('Sprint deletado com sucesso! 🗑️');
          },
          error: () => this.message.error('Erro ao deletar sprint 🚫')
        });
      }
    });
  }

  /* -------------------- Drawer Control -------------------- */
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

  /* -------------------- Form -------------------- */
  private initForm(): void {
    this.sprintForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      code: ['', Validators.required],
      status: ['EM_EXECUCAO', Validators.required]
    });
  }

  /* -------------------- Submit -------------------- */
  submitSprint(): void {
    if (!this.sprintForm.valid) return;

    const sprintData = this.sprintForm.value;
    this.isSaving = true;

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
        this.isSaving = false;
      },
      error: () => {
        this.message.error(
          this.currentEditingSprintId
            ? 'Erro ao atualizar sprint 🚫'
            : 'Erro ao criar sprint 🚫'
        );
        this.isSaving = false;
      }
    });
  }
}
