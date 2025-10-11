import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit {
  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
    this.monthName = firstDay.toLocaleString('default', { month: 'long' });

    const blanks = Array(firstDayIndex).fill(null);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
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
    this.year--;
    this.updateCalendar();
  }

  nextYear() {
    this.year++;
    this.updateCalendar();
  }

  changeMonth(offset: number) {
    this.month += offset;
    if (this.month < 0) {
      this.month = 11;
      this.year--;
    } else if (this.month > 11) {
      this.month = 0;
      this.year++;
    }
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
      case 1: return 'shift-dia';
      case 2: return 'shift-noite';
      case 3: return 'shift-folga1';
      case 4: return 'shift-folga2';
      default: return '';
    }
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
