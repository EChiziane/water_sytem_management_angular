import { TranslationService } from '@core/services/i18n/translation.service';
import { CompanyProfileService } from '@core/services/company/company-profile.service';
import { COMPANY_PROFILE } from '@shared/config/company-profile';
import { CompanyProfile } from '@shared/models/company-profile';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  company: Pick<CompanyProfile, 'name' | 'address' | 'contact' | 'email' | 'tagline'> = {
    ...COMPANY_PROFILE,
  };
  @Output() loginSuccess = new EventEmitter<void>();

  userForm = new FormGroup({
    login: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    rememberMe: new FormControl(false),
  });

  isRegisterVisible = false;
  responseMessage: string | null = null;
  isLoading = false;

  isPasswordVisible = false;

  isForgotPasswordVisible = false;
  recoveryStep: 0 | 1 | 2 = 0;
  recoveryLoading = false;

  recoveryPreview: { maskedName: string; maskedEmail: string; maskedPhone: string } | null = null;

  forgotPasswordForm = new FormGroup({
    phoneWhatsApp: new FormControl('', [Validators.required]),
  });

  resetPasswordForm = new FormGroup({
    otpCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  isResetPasswordVisible = false;
  isResetConfirmVisible = false;

  constructor(
    private translations: TranslationService,
    private authService: AuthService,
    private companies: CompanyProfileService,
    private router: Router,
    private msg: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.logout();
    this.companies.getPublicProfile().subscribe((profile) => (this.company = profile));
  }

  logout(): void {
    this.authService.logout();
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  isInvalid(controlName: 'login' | 'password'): boolean {
    const c = this.userForm.get(controlName);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  login(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const loginValue = this.userForm.get('login')?.value;
    const passwordValue = this.userForm.get('password')?.value;

    const login = (loginValue ?? '').toString().trim();
    const password = (passwordValue ?? '').toString();

    if (!login || !password) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login(login, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        const key =
          error.status === 409
            ? 'accountSecurity.loginConflict'
            : error.status === 429
              ? 'accountSecurity.loginThrottled'
              : error.status === 0 || error.status >= 500
                ? 'accountSecurity.loginUnavailable'
                : 'accountSecurity.loginInvalid';
        this.responseMessage = this.translations.instant(key);
      },
    });
  }

  openRegisterModal(): void {
    this.isRegisterVisible = true;
  }

  closeRegisterModal(): void {
    this.isRegisterVisible = false;
  }

  openForgotPasswordModal(): void {
    this.isForgotPasswordVisible = true;
    this.recoveryStep = 0;
    this.recoveryPreview = null;
    this.forgotPasswordForm.reset();
    this.resetPasswordForm.reset();
  }

  closeForgotPasswordModal(): void {
    this.isForgotPasswordVisible = false;
  }

  toggleResetPasswordVisibility(): void {
    this.isResetPasswordVisible = !this.isResetPasswordVisible;
  }

  toggleResetConfirmVisibility(): void {
    this.isResetConfirmVisible = !this.isResetConfirmVisible;
  }

  requestRecovery(): void {
    if (this.forgotPasswordForm.invalid) {
      Object.values(this.forgotPasswordForm.controls).forEach((c) => c.markAsTouched());
      this.msg.error('Informe o número de WhatsApp.');
      return;
    }

    const phone = this.normalizeMzPhoneToE164(this.forgotPasswordForm.value.phoneWhatsApp!);
    this.recoveryLoading = true;

    this.authService.requestPasswordReset(phone).subscribe({
      next: (preview) => {
        this.recoveryLoading = false;
        this.recoveryPreview = preview;
        this.recoveryStep = 1;
      },
      error: () => {
        this.recoveryLoading = false;
        this.msg.error('Não foi possível localizar a conta com esse WhatsApp.');
      },
    });
  }

  confirmRecovery(): void {
    const phone = this.normalizeMzPhoneToE164(this.forgotPasswordForm.value.phoneWhatsApp!);
    this.recoveryLoading = true;

    this.authService.confirmPasswordReset(phone).subscribe({
      next: () => {
        this.recoveryLoading = false;
        this.recoveryStep = 2;
        this.msg.success('Enviámos um código para o WhatsApp e email associados.');
      },
      error: () => {
        this.recoveryLoading = false;
        this.msg.error('Não foi possível iniciar o envio do código.');
      },
    });
  }

  backRecovery(): void {
    if (this.recoveryStep === 2) this.recoveryStep = 1;
    else if (this.recoveryStep === 1) this.recoveryStep = 0;
  }

  submitResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      Object.values(this.resetPasswordForm.controls).forEach((c) => c.markAsTouched());
      this.msg.error('Preencha o código e a nova senha.');
      return;
    }

    const v = this.resetPasswordForm.value;

    if (v.newPassword !== v.confirmPassword) {
      this.msg.error('As senhas não coincidem.');
      return;
    }

    const phone = this.normalizeMzPhoneToE164(this.forgotPasswordForm.value.phoneWhatsApp!);
    this.recoveryLoading = true;

    this.authService.resetPassword(phone, v.otpCode!, v.newPassword!).subscribe({
      next: () => {
        this.recoveryLoading = false;
        this.msg.success('Senha alterada com sucesso. Já pode entrar.');
        this.closeForgotPasswordModal();
      },
      error: () => {
        this.recoveryLoading = false;
        this.msg.error('Código inválido ou expirado.');
      },
    });
  }

  private normalizeMzPhoneToE164(raw: string): string {
    const digits = (raw ?? '').toString().replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('258')) return `+${digits}`;
    return `+258${digits}`;
  }
}
