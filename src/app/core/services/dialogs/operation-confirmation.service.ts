import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable, defer, firstValueFrom } from 'rxjs';
import { TranslationService } from '../i18n/translation.service';
import { money, paymentMethodLabel, referenceMonths } from '@shared/utils/payment-presentation';

export interface ConfirmationDetails {
  key: string;
  title: string;
  description: string;
  fields: Array<[string, string]>;
  consequence?: string;
  confirmLabel: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OperationConfirmationService {
  private readonly openKeys = new Set<string>();
  constructor(
    private modal: NzModalService,
    private translations: TranslationService,
  ) {}
  text(key: string): string {
    return this.translations.instant(`confirmation.${key}`);
  }

  payment(
    details: {
      customerId: string;
      customer: string;
      amount: number;
      months: string[];
      method: string;
    },
    action: () => Observable<unknown>,
  ): void {
    this.run(
      {
        key: `payment:${details.customerId}`,
        title: this.text('paymentTitle'),
        description: this.text('paymentDescription'),
        fields: [
          [this.text('customer'), details.customer],
          [this.text('amount'), money(details.amount)],
          [
            `${this.text('periods')} (${details.months.length})`,
            referenceMonths(details.months.join('|')).join('; '),
          ],
          [this.text('method'), paymentMethodLabel(details.method)],
        ],
        consequence: this.text('paymentConsequence'),
        confirmLabel: this.text('recordPayment'),
      },
      action,
    );
  }

  deletion(
    entity: string,
    id: string,
    name: string,
    consequence: string,
    action: () => Observable<unknown>,
  ): void {
    this.run(
      {
        key: `delete:${entity}:${id}`,
        title: this.text('deleteTitle'),
        description: this.text('deleteDescription'),
        fields: [[this.text(entity), name]],
        consequence: this.text(consequence),
        confirmLabel: this.text('deleteRecord'),
        danger: true,
      },
      action,
    );
  }

  run(details: ConfirmationDetails, action: () => Observable<unknown>): void {
    if (this.openKeys.has(details.key)) return;
    this.openKeys.add(details.key);
    const escape = (value: string) =>
      String(value ?? '').replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
      );
    const content = `<p>${escape(details.description)}</p><dl class="operation-confirmation-fields">${details.fields.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value || '—')}</dd></div>`).join('')}</dl>${details.consequence ? `<p class="operation-confirmation-note">${escape(details.consequence)}</p>` : ''}`;
    let pending: Promise<boolean> | null = null;
    const ref = this.modal.confirm({
      nzTitle: details.title,
      nzContent: content,
      nzWidth: 520,
      nzOkText: details.confirmLabel,
      nzOkDanger: !!details.danger,
      nzCancelText: this.text('cancel'),
      nzAutofocus: 'cancel',
      nzClosable: false,
      nzMaskClosable: false,
      nzKeyboard: false,
      nzOnOk: () => {
        if (pending) return pending;
        ref.updateConfig({ nzCancelDisabled: true });
        pending = firstValueFrom(defer(action))
          .then(() => true)
          .catch(() => false)
          .finally(() => {
            pending = null;
            ref.updateConfig({ nzCancelDisabled: false });
          });
        return pending;
      },
    });
    ref.afterClose.subscribe(() => this.openKeys.delete(details.key));
  }
}
