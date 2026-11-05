import { formatMonthLabel } from '@shared/utils/month-label';
import { maputoMonthKey } from '@shared/utils/business-date';
import { OperationConfirmationService } from '@core/services/dialogs/operation-confirmation.service';
import { tap } from 'rxjs';

// monthly-charge.component.ts
import { Component, OnInit } from '@angular/core';
import { MonthlyCharge } from '@shared/models/monthly-charge';
import { MonthlyChargeService } from '@core/services/billing/monthly-charge.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-monthly-charge',
  standalone: false,
  templateUrl: './monthly-charge.component.html',
  styleUrls: ['./monthly-charge.component.scss'],
})
export class MonthlyChargeComponent implements OnInit {
  dataSource: MonthlyCharge[] = [];
  listOfDisplayData: MonthlyCharge[] = [];

  isLoading = false;
  searchValue = '';

  constructor(
    private confirmations: OperationConfirmationService,
    private service: MonthlyChargeService,
    private message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;

    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource = data;
        this.listOfDisplayData = [...data];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  generateMonth(): void {
    this.confirmations.run(
      {
        key: 'generate-month',
        title: this.confirmations.text('generateTitle'),
        description: this.confirmations.text('generateDescription'),
        fields: [[this.confirmations.text('month'), formatMonthLabel(maputoMonthKey(new Date()))]],
        confirmLabel: this.confirmations.text('generate'),
      },
      () =>
        this.service.generateMonth().pipe(
          tap({
            next: () => {
              this.message.success('Mensalidades geradas com sucesso.');
              this.load();
            },
            error: () => this.message.error('Erro ao gerar mensalidades.'),
          }),
        ),
    );
  }

  filterData() {
    const search = this.searchValue.toLowerCase();

    this.listOfDisplayData = this.dataSource.filter((item) =>
      (item.customerNameSnapshot || '').toLowerCase().includes(search),
    );
  }
}
