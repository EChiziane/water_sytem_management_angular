import { FormBuilder } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { CompanyComponent } from './company.component';
import { CompanyProfileService } from '@core/services/company/company-profile.service';
import { OperationConfirmationService } from '@core/services/dialogs/operation-confirmation.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TranslationService } from '@core/services/i18n/translation.service';
import { COMPANY_PROFILE } from '@shared/config/company-profile';

describe('Company form confirmation', () => {
  let component: CompanyComponent;
  let data: jasmine.SpyObj<CompanyProfileService>;
  let confirmations: jasmine.SpyObj<OperationConfirmationService>;
  beforeEach(() => {
    data = jasmine.createSpyObj('CompanyProfileService', ['getProfile', 'save']);
    data.getProfile.and.returnValue(of({ ...COMPANY_PROFILE, version: 1 }));
    data.save.and.returnValue(of({ ...COMPANY_PROFILE, version: 2 }));
    confirmations = jasmine.createSpyObj('Confirmations', ['run']);
    component = new CompanyComponent(
      new FormBuilder(),
      data,
      confirmations,
      { success: () => {}, error: () => {} } as unknown as NzMessageService,
      { instant: (key: string) => key } as TranslationService,
    );
    component.ngOnInit();
  });
  it('does not save before explicit confirmation and captures the edited profile', async () => {
    component.form.controls.address.setValue('Nova morada');
    component.save();
    expect(data.save).not.toHaveBeenCalled();
    expect(confirmations.run).toHaveBeenCalled();
    const action = confirmations.run.calls.mostRecent().args[1];
    await firstValueFrom(action());
    expect(data.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ address: 'Nova morada', version: 1 }),
    );
    expect(component.form.pristine).toBeTrue();
  });
  it('rejects invalid NUIT and email before opening confirmation', () => {
    component.form.controls.nuit.setValue('123');
    component.form.controls.email.setValue('invalid');
    component.save();
    expect(confirmations.run).not.toHaveBeenCalled();
    expect(data.save).not.toHaveBeenCalled();
  });
  it('requires confirmation before discarding unsaved changes', () => {
    component.form.markAsDirty();
    component.reload();
    expect(confirmations.run).toHaveBeenCalled();
    expect(data.getProfile).toHaveBeenCalledTimes(1);
  });
});
