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

  listOfDisplayData: Sprint[] = [];
  totalSprints = 0;
  totalEmExecucao = 0;
  totalEncerrados = 0;
  searchValue = '';

  // Drawer
  isSprintDrawerVisible = false;
  sprintForm!: FormGroup;
  currentEditingSprintId: string | null = null;


  // Para edição inline
  editingSprint?: Sprint | null = null;
  editingField?: string | null = null;

  constructor(
    private sprintService: SprintService,
    private message: NzMessageService,
    private modal: NzModalService,
    private fb: FormBuilder,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSprints();
  }

  // Iniciar edição inline
  startInlineEdit(sprint: Sprint, field: string): void {
    this.editingSprint = { ...sprint };
    this.editingField = field;
  }

  // Salvar edição inline
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

  updateStatus(sprint: Sprint, newStatus: string): void {
    if (sprint.status === newStatus) return;

    // 🧭 Caso o utilizador tente ENCERRAR o sprint
    if (newStatus === 'ENCERRADO') {
      this.modal.confirm({
        nzTitle: 'Encerrar Sprint',
        nzContent: `
        <p>Ao executar esta ação, a sprint será marcada como <strong>Encerrada</strong>.</p>
        <p>Tem certeza que deseja prosseguir?</p>
      `,
        nzOkText: 'Sim, encerrar',
        nzOkType: 'primary',
        nzCancelText: 'Cancelar',
        nzOnOk: () => {
          const updated = { ...sprint, status: newStatus };
          this.sprintService.updateSprint(sprint.id, updated).subscribe({
            next: () => {
              sprint.status = newStatus;
              this.message.success('Sprint encerrada com sucesso! ✅');
              this.refreshTotals();
            },
            error: () => this.message.error('Erro ao encerrar sprint 🚫')
          });
        }
      });
    } else {
      // 🟢 Atualização normal de status (ex: para EM_EXECUCAO)
      const updated = { ...sprint, status: newStatus };
      this.sprintService.updateSprint(sprint.id, updated).subscribe({
        next: () => {
          sprint.status = newStatus;
          this.message.success(`Sprint atualizada para ${newStatus}! ✅`);
          this.refreshTotals();
        },
        error: () => this.message.error('Erro ao atualizar status 🚫')
      });
    }
  }

  /**
   * 🔄 Atualiza os totais de status (Em execução / Encerrados)
   */
  private refreshTotals(): void {
    this.totalEmExecucao = this.listOfDisplayData.filter(s => s.status === 'EM_EXECUCAO').length;
    this.totalEncerrados = this.listOfDisplayData.filter(s => s.status === 'ENCERRADO').length;
  }


  filterByStatus(status: 'EM_EXECUCAO' | 'ENCERRADO'): void {
    this.listOfDisplayData = this.listOfDisplayData.filter(s => s.status === status);
  }

  showAll(): void {
    this.loadSprints();
  }

  search(): void {
    const val = this.searchValue.toLowerCase();
    if (!val) {
      this.loadSprints();
      return;
    }
    this.listOfDisplayData = this.listOfDisplayData.filter(sprint =>
      sprint.code.toLowerCase().includes(val) ||
      sprint.description.toLowerCase().includes(val) ||
      sprint.name.toLowerCase().includes(val)
    );
  }

  private loadSprints(): void {
    this.sprintService.getSprints().subscribe(sprints => {
      this.listOfDisplayData = sprints;
      this.totalEmExecucao = sprints.filter(d => d.status === 'EM_EXECUCAO').length;
      this.totalEncerrados = sprints.filter(d => d.status === 'ENCERRADO').length;
      this.totalSprints = sprints.length;
    });
  }


  // Mostrar Drawer
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

  // Submeter (Criar ou Editar)
  submitSprint(): void {
    if (this.sprintForm.valid) {
      const sprintData = this.sprintForm.value;

      if (this.currentEditingSprintId) {
        this.sprintService.updateSprint(this.currentEditingSprintId, sprintData).subscribe({
          next: () => {
            this.loadSprints();
            this.closeSprintDrawer();
            this.message.success('Sprint atualizado com sucesso! ✅');
          },
          error: () => this.message.error('Erro ao atualizar sprint 🚫')
        });
      } else {
        this.sprintService.addSprint(sprintData).subscribe({
          next: () => {
            this.loadSprints();
            this.closeSprintDrawer();
            this.message.success('Sprint criada com sucesso! ✅');
          },
          error: () => this.message.error('Erro ao criar sprint 🚫')
        });
      }
    }
  }
  private initForm(): void {
    this.sprintForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      code: ['', Validators.required],
      status: ['EM_EXECUCAO', Validators.required]
    });
  }

  viewSprint(sprint: Sprint) {
    
  }
}
