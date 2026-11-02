import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
import { businessTimestamp } from '@shared/utils/business-date';
@Pipe({ name: 'businessDate', standalone: true })
export class BusinessDatePipe implements PipeTransform {
  transform(
    value: string | number | Date | null | undefined,
    detail: 'date' | 'datetime' | 'month' | 'short' = 'datetime',
  ): string {
    if (value == null || value === '') return '—';
    const stamp =
      value instanceof Date
        ? value.getTime()
        : typeof value === 'number'
          ? value
          : businessTimestamp(value);
    if (!Number.isFinite(stamp)) return '—';
    const format = {
      date: 'dd/MM/yyyy',
      datetime: 'dd/MM/yyyy HH:mm',
      month: 'MM/yyyy',
      short: 'dd/MM HH:mm',
    }[detail];
    return formatDate(stamp, format, 'en', '+0200');
  }
}
