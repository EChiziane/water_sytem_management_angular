import {FIRST_BUSINESS_YEAR,LAST_BUSINESS_YEAR} from '@shared/utils/billing-period';
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit {
  weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  shiftOptions = [
    {value: 1, label: 'Dia', description: 'Turno diurno', time: '08:00 - 17:00', className: 'shift-dia'},
    {value: 2, label: 'Noite', description: 'Turno noturno', time: '17:00 - 08:00', className: 'shift-noite'},
    {value: 3, label: 'Folga 1', description: 'Primeiro dia de descanso', time: 'Descanso', className: 'shift-folga1'},
    {value: 4, label: 'Folga 2', description: 'Segundo dia de descanso', time: 'Descanso', className: 'shift-folga2'}
  ];

  // array usado para renderizar a grid (null = célula vazia)
  displayDays: (number | null)[] = [];

  month = 0;
  monthName = '';
  year = 0;

  // Estado atual selecionado no select (1=Dia,2=Noite,3=Folga1,4=Folga2)
  todayShift: number | null = null;

  // referência absoluta: data completa (dia+mes+ano) da qual o padrão 4-dias será calculado
  referenceDateObj: Date | null = null;

  // turno correspondente à referenceDateObj (null = none)
  referenceShift: number | null = null;

  get selectedShiftLabel(): string {
    return this.shiftOptions.find(option => option.value === this.todayShift)?.label || 'Sem referencia';
  }

  get selectedShiftDescription(): string {
    return this.shiftOptions.find(option => option.value === this.todayShift)?.description || 'Escolha o estado de hoje para projetar o ciclo.';
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  ngOnInit() {
    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();
    // por defeito, a referência fica vazia até o utilizador escolher (None por default)
    this.updateCalendar();
  }

  /**
   * Chamado quando o utilizador seleciona o turno "hoje".
   * Guarda a referência como uma Date absoluta (hoje) e o turno escolhido.
   */
  updateReference() {
    if (!this.todayShift) {
      // None: remove referência absoluta
      this.referenceShift = null;
      this.referenceDateObj = null;
    } else {
      // guarda a data absoluta de hoje como referência
      const now = new Date();
      // normaliza horas para 00:00 para evitar problemas com horário de verão / horas
      this.referenceDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.referenceShift = this.todayShift;
    }

    // atualiza a view imediatamente
    this.updateCalendar();
  }

  /** Constroi displayDays com blanks no inicio para alinhar o dia 1 com o weekday correto */
  updateCalendar() {
    const firstDay = new Date(this.year, this.month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 (domingo) .. 6 (sábado)
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    this.monthName = firstDay.toLocaleString('pt-PT', {month: 'long'});

    const blanks = Array(firstDayIndex).fill(null);
    const monthDays = Array.from({length: daysInMonth}, (_, i) => i + 1);
    this.displayDays = [...blanks, ...monthDays];
  }

  /** Navegação de mês e ano */
  prevMonth() {
    this.changeMonth(-1);
    this.updateCalendar();
  }

  nextMonth() {
    this.changeMonth(1);
    this.updateCalendar();
  }

  prevYear() {
    if(this.year<=FIRST_BUSINESS_YEAR)return;
    this.year--;
    this.updateCalendar();
  }

  nextYear() {
    if(this.year>=LAST_BUSINESS_YEAR)return;
    this.year++;
    this.updateCalendar();
  }

  goToday() {
    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();
    this.updateCalendar();
  }

  get atFirstMonth(){return this.year===FIRST_BUSINESS_YEAR && this.month===0;}
  get atLastMonth(){return this.year===LAST_BUSINESS_YEAR && this.month===11;}
  get atFirstYear(){return this.year===FIRST_BUSINESS_YEAR;}
  get atLastYear(){return this.year===LAST_BUSINESS_YEAR;}
  changeMonth(offset:number){
    const target=new Date(this.year,this.month+offset,1);
    if(target.getFullYear()<FIRST_BUSINESS_YEAR || target.getFullYear()>LAST_BUSINESS_YEAR)return;
    this.year=target.getFullYear();this.month=target.getMonth();
  }

  /**
   * Calcula a classe CSS do dia da célula.
   * Aqui usamos differenceInDays entre cellDate (ano/mes/date) e referenceDateObj (data absoluta).
   */
  getDayClass(day: number | null) {
    if (day === null) return '';

    // sem referência absoluta -> sem cores
    if (!this.referenceShift || !this.referenceDateObj) return '';

    // cria a data absoluta da célula (ano e mês atualmente mostrados)
    const cellDate = new Date(this.year, this.month, day);
    // normalizar horas
    const cellDateMid = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
    const ref = new Date(this.referenceDateObj.getFullYear(), this.referenceDateObj.getMonth(), this.referenceDateObj.getDate());

    // diferença em milissegundos -> converter para dias inteiros
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = cellDateMid.getTime() - ref.getTime();
    // arredonda para inteiro (pode ser negativo)
    const diffDays = Math.round(diffMs / msPerDay);

    // aplica o padrão de 4 dias: shiftNumber varia 1..4
    // se referenceShift é 1 (Dia) e diffDays = 0 -> 1
    // se diffDays = 1 -> 2, etc.
    const shiftNumber = ((this.referenceShift - 1 + (diffDays % 4) + 4) % 4) + 1;

    switch (shiftNumber) {
      case 1:
        return 'shift-dia';
      case 2:
        return 'shift-noite';
      case 3:
        return 'shift-folga1';
      case 4:
        return 'shift-folga2';
      default:
        return '';
    }
  }

  getShiftByClass(className: string) {
    return this.shiftOptions.find(option => option.className === className);
  }

  /** Verifica se a célula representa hoje (usada para destacar) */
  isToday(day: number | null): boolean {
    if (day === null) return false;
    const today = new Date();
    return today.getFullYear() === this.year &&
      today.getMonth() === this.month &&
      today.getDate() === day;
  }
}
