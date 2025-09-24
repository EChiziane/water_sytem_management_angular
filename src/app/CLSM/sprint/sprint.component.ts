import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SprintService } from '../../services/sprint.service';
import { Sprint } from '../../models/CSM/sprint';


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

  // Para edição inline
  editingSprint?: Sprint | null = null;
  editingField?: string | null = null;

  constructor(
    private sprintService: SprintService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

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

    const updated = { ...sprint, status: newStatus };
    this.sprintService.updateSprint(sprint.id, updated).subscribe({
      next: () => {
        sprint.status = newStatus;
        this.message.success(`Sprint atualizado para ${newStatus}! ✅`);
        this.totalEmExecucao = this.listOfDisplayData.filter(s => s.status === 'EM_EXECUCAO').length;
        this.totalEncerrados = this.listOfDisplayData.filter(s => s.status === 'ENCERRADO').length;
      },
      error: () => this.message.error('Erro ao atualizar status 🚫')
    });
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

}
