import { Subject, of, throwError } from 'rxjs';
import { NzModalService, ModalOptions } from 'ng-zorro-antd/modal';
import { TranslationService } from '../i18n/translation.service';
import { OperationConfirmationService } from './operation-confirmation.service';

describe('Operation confirmations', () => {
  let service: OperationConfirmationService;
  let options: ModalOptions;
  let closed: Subject<void>;
  let modal: { confirm: jasmine.Spy };
  beforeEach(() => {
    closed = new Subject<void>();
    modal = {
      confirm: jasmine.createSpy('confirm').and.callFake((config: ModalOptions) => {
        options = config;
        return {
          afterClose: closed.asObservable(),
          updateConfig: jasmine.createSpy('updateConfig'),
        };
      }),
    };
    service = new OperationConfirmationService(
      modal as unknown as NzModalService,
      { instant: (key: string) => key } as TranslationService,
    );
  });
  const payment = {
    customerId: 'c1',
    customer: 'Cliente <script>alert(1)</script>',
    amount: 1500,
    months: ['2026-09', '2026-10'],
    method: 'MPESA',
  };
  it('requires explicit confirmation, shows the payment summary and escapes customer input', () => {
    const action = jasmine.createSpy('save').and.returnValue(of({}));
    service.payment(payment, action);
    expect(action).not.toHaveBeenCalled();
    expect(options.nzContent as string).toContain('1500');
    expect(options.nzContent as string).toContain('Setembro');
    expect(options.nzContent as string).toContain('Outubro');
    expect(options.nzContent as string).toContain('M-Pesa');
    expect(options.nzContent as string).not.toContain('<script>');
    expect(options.nzAutofocus).toBe('cancel');
    expect(options.nzMaskClosable).toBeFalse();
    closed.next();
    expect(action).not.toHaveBeenCalled();
  });
  it('sends one request after confirmation and blocks repeated submission while processing', async () => {
    const response = new Subject<unknown>();
    const action = jasmine.createSpy('save').and.returnValue(response);
    service.payment(payment, action);
    const confirm = options.nzOnOk as () => Promise<boolean>;
    const first = confirm();
    const second = confirm();
    expect(first).toBe(second);
    expect(action).toHaveBeenCalledTimes(1);
    response.next({});
    response.complete();
    expect(await first).toBeTrue();
  });
  it('keeps a failed operation open and allows deliberate retry', async () => {
    const action = jasmine.createSpy('save').and.returnValues(
      throwError(() => new Error('failed')),
      of({}),
    );
    service.payment(payment, action);
    const confirm = options.nzOnOk as () => Promise<boolean>;
    expect(await confirm()).toBeFalse();
    expect(await confirm()).toBeTrue();
  });
  it('protects every deletion type and prevents opening duplicate dialogs for the same record', async () => {
    for (const entity of ['customer', 'payment', 'receipt', 'user']) {
      const action = jasmine.createSpy('delete').and.returnValue(of({}));
      service.deletion(entity, '1', 'Nome', 'deleteCustomerNote', action);
      service.deletion(entity, '1', 'Nome', 'deleteCustomerNote', action);
      expect(options.nzOkDanger).toBeTrue();
      expect(action).not.toHaveBeenCalled();
      await (options.nzOnOk as () => Promise<boolean>)();
      expect(action).toHaveBeenCalledTimes(1);
      closed.next();
    }
    expect(modal.confirm).toHaveBeenCalledTimes(4);
  });
});
