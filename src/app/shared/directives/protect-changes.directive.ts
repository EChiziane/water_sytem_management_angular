import { Directive, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';
import { UnsavedChangesService } from '@core/services/dialogs/unsaved-changes.service';
@Directive({ selector: 'form[wsmProtectChanges]', standalone: true })
export class ProtectChangesDirective implements OnInit, OnDestroy {
  private unregister = () => {};
  constructor(
    private form: FormGroupDirective,
    private changes: UnsavedChangesService,
  ) {}
  ngOnInit() {
    this.unregister = this.changes.register(this.form.form);
  }
  ngOnDestroy() {
    this.unregister();
  }
  @HostListener('window:beforeunload', ['$event']) beforeUnload(event: BeforeUnloadEvent) {
    if (this.form.form.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
