import { Component, Input, OnInit } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import {PaymentService} from '../../../services/payment.service';
import {Payment} from '../../../models/WSM/payment';
import {Recibo} from '../../../models/WSM/Recibo';
import {ReciboService} from '../../../services/recibo.service';

/*import jsPDF from 'jspdf';*/

@Component({
  selector: 'app-payment-details',
  standalone: false,
  templateUrl: './payment-details.component.html',
  styleUrls: ['./payment-details.component.scss']
})
export class PaymentDetailsComponent implements OnInit {
  @Input() paymentId!: string;
  recibo: Recibo[]=[];
  meses: string[] = [];

  listOfDisplayData: Recibo[] = [];

  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private paymentService: PaymentService,
              private reciboService: ReciboService,) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.paymentId = params['id'];
      this.getPaymentIncoices();
    });
  }

  private getPaymentDetails(): void {
    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment: Payment) => {
    //    this.populateMonths();
      }
    });
  }

  private getPaymentIncoices(): void {
    this.reciboService.getRecibosByPayments(this.paymentId).subscribe({
      next: (payment: Recibo[]) => {
        this.recibo = payment;
        this,this.listOfDisplayData=[...this.recibo]
        console.log(this.recibo);
     //   this.populateMonths();
      }
    });
  }

  /*private populateMonths(): void {
   // const referenceMonths = this.payment.referenceMonth.split(',');

    const monthsMap: Record<string, string> = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro'
    };

    this.meses = referenceMonths.map(month => {
      return monthsMap[month.trim()] || month;
    });
  }*/

  // Função para imprimir
 /* print(): void {
    window.print();
  }*/

  // Função para gerar o PDF e realizar o download
/*  download(): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Recibo Para: ' + this.payment.customerName, 20, 20);

    doc.setFontSize(12);
    doc.text('Valor: ' + this.payment.amount.toFixed(2), 20, 30);
    doc.text('Data do Pagamento: ' + this.payment.paymentDate, 20, 40);
    doc.text('Método de Pagamento: ' + this.payment.paymentMethod, 20, 50);
    doc.text('Confirmado: ' + (this.payment.confirmed ? 'Sim' : 'Não'), 20, 60);

    doc.text('Pagamento de Água referente ao(s) mês(es) de:', 20, 70);
    let yOffset = 80;
    this.meses.forEach(mes => {
      doc.text('• ' + mes, 20, yOffset);
      yOffset += 10;
    });

    doc.text('Informações da Empresa:', 20, yOffset + 10);
    doc.text('Nome da Empresa: Transportes Chiziane', 20, yOffset + 20);
    doc.text('Localização: Av. de Moçambique, nº 534, Marginal', 20, yOffset + 30);
    doc.text('NUIT: 123456789', 20, yOffset + 40);
    doc.text('Telefone: 845098583', 20, yOffset + 50);

    doc.save('recibo.pdf'); // Gera e faz o download do PDF
  }*/


  getDownloadUrl(recibo: Recibo) {
    this.reciboService.downloadRecibo(recibo.id).subscribe((fileBlob: Blob) => {
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recibo.fileName; // ou qualquer nome
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
