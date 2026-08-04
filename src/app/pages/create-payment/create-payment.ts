import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import {
  Currency,
  PaymentStatus,
  CreatePayment as CreatePaymentPayload,
} from '../../models/payment';

const ibanChecksumValidator: ValidatorFn = (
  control: AbstractControl<string>
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  const iban = control.value.replace(/\s/g, '').toUpperCase();

  if (!/^UA\d{27}$/.test(iban)) {
    return null;
  }

  const rearrangedIban = iban.slice(4) + iban.slice(0, 4);

  const numericIban = rearrangedIban.replace(/[A-Z]/g, (letter) =>
    String(letter.charCodeAt(0) - 55)
  );

  let remainder = 0;

  for (const digit of numericIban) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1 ? null : { invalidIbanChecksum: true };
};
const ibanFormatValidator: ValidatorFn = (
  control: AbstractControl<string>
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  const ibanRegex = /^UA\d{27}$/;

  return ibanRegex.test(control.value) ? null : { invalidIban: true };
};

const nonZeroValidator: ValidatorFn = (
  control: AbstractControl<number | null>
): ValidationErrors | null => {
  if (control.value === null) {
    return null;
  }
  return control.value === 0 ? { nonZero: true } : null;
};

const maximumAmountValidator: ValidatorFn = (
  control: AbstractControl<number>
): ValidationErrors | null => {
  return Math.abs(control.value) > 999_999.99 ? { maximumAmount: true } : null;
};

const maximumTwoDecimalsValidator: ValidatorFn = (
  control: AbstractControl<number>
): ValidationErrors | null => {
  const value = control.value;

  return Number.isInteger(value * 100) ? null : { maximumTwoDecimals: true };
};

const notPastDateValidator: ValidatorFn = (
  control: AbstractControl<string>
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  const selectedDate = new Date(`${control.value}T00:00:00`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate < today ? { pastDate: true } : null;
};

const differentIbansValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const payerIban = control.get('payerIban')?.value;
  const receiverIban = control.get('receiverIban')?.value;

  if (!payerIban || !receiverIban) {
    return null;
  }

  return payerIban === receiverIban ? { sameIbans: true } : null;
};
@Component({
  selector: 'app-create-payment',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-payment.html',
  styleUrl: './create-payment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePayment {
  private readonly fb = inject(FormBuilder);

  readonly closed = output<void>();
  readonly submitted = output<CreatePaymentPayload>();

  readonly form = this.fb.group(
    {
      docNumber: this.fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      date: this.fb.nonNullable.control('', {
        validators: [Validators.required, notPastDateValidator],
      }),

      payerName: this.fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      payerIban: this.fb.nonNullable.control('', {
        validators: [Validators.required, ibanFormatValidator, ibanChecksumValidator],
      }),

      receiverName: this.fb.nonNullable.control('', {
        validators: [Validators.required],
      }),
      receiverIban: this.fb.nonNullable.control('', {
        validators: [Validators.required, ibanFormatValidator, ibanChecksumValidator],
      }),

      amount: this.fb.nonNullable.control<number | null>(null, {
        validators: [
          Validators.required,
          nonZeroValidator,
          maximumAmountValidator,
          maximumTwoDecimalsValidator,
        ],
      }),

      currency: this.fb.nonNullable.control<Currency>('UAH'),

      status: this.fb.nonNullable.control<PaymentStatus>('draft'),

      comment: this.fb.control<string | null>(null),
    },
    {
      validators: [differentIbansValidator],
    }
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.amount === null) {
      return;
    }

    this.submitted.emit({
      ...value,
      amount: value.amount,
      date: new Date(value.date).toISOString(),
    });
  }

  close(): void {
    this.closed.emit();
  }
}
