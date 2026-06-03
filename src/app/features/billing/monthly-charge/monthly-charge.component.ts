


// monthly-charge.component.ts
import { Component, OnInit } from '@angular/core';
import {MonthlyCharge} from '@shared/models/monthly-charge';
import {MonthlyChargeService} from '@core/services/monthly-charge.service';
import {NzMessageService} from 'ng-zorro-antd/message';


@Component({
  selector: 'app-monthly-charge',
  standalone: false,
  templateUrl: './monthly-charge.component.html',
  styleUrls: ['./monthly-charge.component.scss']
})
export class MonthlyChargeComponent implements OnInit {

  dataSource: MonthlyCharge[] = [];
  listOfDisplayData: MonthlyCharge[] = [];

  isLoading = false;
  searchValue = '';

  constructor(
    private service: MonthlyChargeService,
    private message: NzMessageService
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
      }
    });
  }

  generateMonth() {
    this.service.generateMonth().subscribe({
      next: () => {
        this.message.success('Mês gerado com sucesso 📅');
        this.load();
      },
      error: () => {
        this.message.error('Erro ao gerar mês ❌');
      }
    });
  }

  filterData() {
    const search = this.searchValue.toLowerCase();

    this.listOfDisplayData = this.dataSource.filter(item =>
      (item.customerNameSnapshot || '').toLowerCase().includes(search)
    );
  }
}
