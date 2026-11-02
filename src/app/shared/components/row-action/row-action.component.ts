import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { TranslationService } from '@core/services/i18n/translation.service';

type RowAction = 'view' | 'edit' | 'download' | 'deactivate' | 'call';

@Component({
  selector: 'app-row-action',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, NzTooltipDirective],
  template: `
    <ng-template #content>
      <nz-icon [nzType]="icons[action]" aria-hidden="true"></nz-icon>
      <span *ngIf="action === 'view' || showLabel">{{
        text('tableActions.' + action + 'Short')
      }}</span>
    </ng-template>
    <button
      *ngIf="!href; else externalLink"
      type="button"
      class="row-action"
      [class.row-action-view]="action === 'view'"
      [class.row-action-danger]="action === 'deactivate'"
      [disabled]="disabled"
      [routerLink]="route"
      [attr.aria-label]="label"
      nz-tooltip
      [nzTooltipTitle]="label"
      nzTooltipPlacement="top"
      (click)="activated.emit()"
    >
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </button>
    <ng-template #externalLink>
      <a
        class="row-action"
        [href]="href"
        [attr.aria-label]="label"
        nz-tooltip
        [nzTooltipTitle]="label"
      >
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </a>
    </ng-template>
  `,
  styleUrl: './row-action.component.scss',
})
export class RowActionComponent {
  @Input() action: RowAction = 'view';
  @Input() context = '';
  @Input() route: string | any[] | null = null;
  @Input() href: string | null = null;
  @Input() showLabel = false;
  @Input() disabled = false;
  @Input() disabledReason = '';
  @Output() activated = new EventEmitter<void>();
  readonly icons: Record<RowAction, string> = {
    view: 'eye',
    edit: 'edit',
    download: 'download',
    deactivate: 'stop',
    call: 'phone',
  };

  constructor(private translations: TranslationService) {}
  text(key: string): string {
    return this.translations.instant(key);
  }
  get label(): string {
    const description = this.text(
      this.disabled && this.disabledReason ? this.disabledReason : 'tableActions.' + this.action,
    );
    return this.context ? `${description} · ${this.context}` : description;
  }
}
