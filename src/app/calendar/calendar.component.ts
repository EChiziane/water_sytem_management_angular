import { Component } from '@angular/core';





@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  dates: number[] = [];
  month: number = 0;
  monthName: string = '';
  year: number = 0;

  // Estado atual de hoje selecionado
  todayShift: number | null = null;

  // Dia de referência e turno correspondente
  referenceDate!: number;
  referenceShift: number | null = null;

  ngOnInit() {
    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();
    this.referenceDate = today.getDate(); // hoje como referência
    this.updateCalendar();
  }

  // Atualiza o dia de referência com base no turno selecionado
  updateReference() {
    // Se selecionou None, não há referência
    if (!this.todayShift) {
      this.referenceShift = null;
      return;
    }
    this.referenceShift = this.todayShift;
  }

  // Atualiza os dias do mês
  updateCalendar() {
    const firstDay = new Date(this.year, this.month, 1);
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    this.monthName = firstDay.toLocaleString('default', { month: 'long' });
    this.dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  // Navegação de mês e ano
  prevMonth() { this.changeMonth(-1); }
  nextMonth() { this.changeMonth(1); }
  prevYear() { this.year--; this.updateCalendar(); }
  nextYear() { this.year++; this.updateCalendar(); }

  changeMonth(offset: number) {
    this.month += offset;
    if (this.month < 0) { this.month = 11; this.year--; }
    if (this.month > 11) { this.month = 0; this.year++; }
    this.updateCalendar();
  }

  // Retorna a classe CSS de cada dia
  getDayClass(date: number) {
    // Se não há referência, calendário volta ao normal
    if (!this.referenceShift) return '';

    const diff = date - this.referenceDate;
    const shiftNumber = ((this.referenceShift - 1 + diff % 4 + 4) % 4) + 1;

    switch (shiftNumber) {
      case 1: return 'shift-dia';
      case 2: return 'shift-noite';
      case 3: return 'shift-folga1';
      case 4: return 'shift-folga2';
      default: return '';
    }
  }

  // Verifica se o dia é hoje
  isToday(date: number): boolean {
    const today = new Date();
    return today.getDate() === date && today.getMonth() === this.month && today.getFullYear() === this.year;
  }
}
