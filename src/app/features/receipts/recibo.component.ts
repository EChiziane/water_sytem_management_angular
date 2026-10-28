import {OperationConfirmationService} from '@core/services/operation-confirmation.service';
import {tap} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {Recibo} from '@shared/models/WSM/Recibo';
import {ReciboService} from '@core/services/recibo.service';
import {Payment} from '@shared/models/WSM/payment';
import {PaymentService} from '@core/services/payment.service';
import {CustomerPaymentInvoiceService} from '@core/services/customer-payment-invoice.service';
import {PaymentInvoiceService} from '@core/services/payment-invoice.service';
import {money, paymentMethodLabel, referenceMonths} from '@shared/utils/payment-presentation';
import {finalize, forkJoin} from 'rxjs';

@Component({
  selector: 'app-recibo',
  standalone: false,
  templateUrl: './recibo.component.html',
  styleUrls: ['./recibo.component.scss']
})
export class ReciboComponent implements OnInit {
  dataSource: Recibo[] = [];
  payments: Payment[] = [];
  listOfDisplayData: Recibo[] = [];

  searchValue = '';
  visible = false;
  visibleDrawer = false;

  isEditMode = false;
  drawerTitle = 'Criar Recibo';
  selectedReciboId: string | null = null;

  reciboForm = new FormGroup({
    paymentId: new FormControl('', Validators.required),
  });
  isLoading = false;
  totalRecibos = 0;
  recibosComFicheiro = 0;
  recibosSemCaminho = 0;

  constructor(
    private confirmations: OperationConfirmationService,
    private http: HttpClient,
    private reciboService: ReciboService,
    private customerPaymentInvoice: CustomerPaymentInvoiceService,
    private paymentInvoiceService: PaymentInvoiceService,
    private paymentService: PaymentService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
  }

  ngOnInit(): void {
    this.getRecibos();
  }

  getRecibos() {
    this.isLoading = true;
    forkJoin({
      receipts: this.customerPaymentInvoice.getCustomerPaymentInvoice(),
      payments: this.paymentService.getPayments()
    }).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: ({receipts, payments}) => {
        this.payments = payments;
        this.dataSource = receipts.map(receipt => ({
          ...receipt,
          payment: receipt.payment || payments.find(payment => payment.id === receipt.paymentId)
        }));
        this.search();
        this.calcStats();
      },
      error: () => this.message.error('Não foi possível carregar o arquivo de documentos. Tente novamente.')
    });
  }

  search(): void {
    this.visible = false;

    const q = this.searchValue.toLowerCase().trim();
    this.listOfDisplayData = this.dataSource.filter((item: Recibo) =>
      item.customerName?.toLowerCase().includes(q) ||
      item.fileName?.toLowerCase().includes(q) ||
      item.invoiceCode?.toLowerCase?.().includes?.(q)
    );
  }

  getPayments() {
    this.isLoading = true;
    this.paymentService.getPayments().subscribe((payments: Payment[]) => {
      this.payments = payments;
      this.isLoading = false;
    });
  }

  reset(): void {
    this.searchValue = '';
    this.search();
  }

  open(): void {
    this.isEditMode = false;
    this.drawerTitle = 'Criar Recibo';
    this.reciboForm.reset();
    this.getPayments();
    this.visibleDrawer = true;
  }

  close(): void {
    this.visibleDrawer = false;
    this.reciboForm.reset();
    this.selectedReciboId = null;
  }

  createRecibo() {
    if (this.reciboForm.invalid) {
      this.message.warning('Preencha todos os campos obrigatórios!');
      return;
    }

    if (this.isEditMode && this.selectedReciboId) {
      this.reciboService.updateRecibo(this.selectedReciboId, this.reciboForm.value as Recibo).subscribe({
        next: () => {
          this.getRecibos();
          this.close();
          this.message.success('Recibo atualizado com sucesso! ✅');
        },
        error: () => {
          this.message.error('Erro ao atualizar recibo. 🚫');
        }
      });
    } else {
      this.reciboService.addRecibo(this.reciboForm.value.paymentId!).subscribe({
        next: (newRecibo) => {
          this.dataSource = [...this.dataSource, newRecibo];
          this.listOfDisplayData = [...this.dataSource];
          this.reciboForm.reset();
          this.close();
          this.message.success('Recibo criado com sucesso! ✅');
        },
        error: () => {
          this.message.error('Erro ao criar recibo. 🚫');
        }
      });
    }
  }

  editRecibo(recibo: Recibo): void {
    this.isEditMode = true;
    this.drawerTitle = 'Editar Recibo';
    this.selectedReciboId = recibo.id;
    this.getPayments();
    this.visibleDrawer = true;

    this.reciboForm.patchValue({
      paymentId: recibo.paymentId,
    });
  }

  deleteRecibo(data: Recibo): void {
    this.confirmations.deletion('receipt', data.id, [data.invoiceCode, data.customerName, data.fileName].filter(Boolean).join(' · '), 'deleteReceiptNote',
      () => this.reciboService.deleteRecibo(data.id).pipe(tap({
        next: () => { this.getRecibos(); this.message.success('Recibo eliminado com sucesso.'); },
        error: () => this.message.error('Erro ao eliminar o recibo.')
      })));
  }

  getDownloadUrl(recibo: Recibo): void {
    const exportPayment = (payment: Payment) => this.paymentInvoiceService.downloadPaymentInvoice(payment, {
      reference: recibo.invoiceCode || payment.referenceCode,
      issuedAt: recibo.createdAt || payment.paymentDate
    });
    const payment = recibo.payment || this.payments.find(item => item.id === recibo.paymentId);
    if (payment) { exportPayment(payment); return; }
    if (!recibo.paymentId) { this.message.warning('Este documento não tem um pagamento associado.'); return; }
    this.paymentService.getPaymentById(recibo.paymentId).subscribe({
      next: exportPayment,
      error: () => this.message.error('Não foi possível obter os dados do pagamento para gerar o documento.')
    });
  }

  get confirmedReceipts(): number { return this.dataSource.filter(item => item.payment?.confirmed === true).length; }
  get totalReceiptAmount(): string { return money(this.dataSource.reduce((sum, item) => sum + (item.payment?.confirmed ? Number(item.payment.amount || 0) : 0), 0)); }
  receiptMoney(receipt: Recibo): string { return receipt.payment ? money(receipt.payment.amount) : receipt.total || 'Não disponível'; }
  receiptPeriods(receipt: Recibo): string { return referenceMonths(receipt.payment?.referenceMonth).join(', ') || receipt.monthDescription || 'Não informados'; }
  receiptMethod(receipt: Recibo): string { return paymentMethodLabel(receipt.payment?.paymentMethod); }

  // ========= Navigation =========
  onBack() {
    window.history.back();
  }

  private calcStats() {
    this.totalRecibos = this.dataSource.length;
    this.recibosComFicheiro = this.dataSource.filter(r => !!r.fileName).length;
    this.recibosSemCaminho = this.dataSource.filter(r => !r.filePath).length;
  }

}
