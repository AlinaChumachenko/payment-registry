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

const nonZeroValidator: ValidatorFn = (
  control: AbstractControl<number>
): ValidationErrors | null => {
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

  readonly form = this.fb.group({
    docNumber: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),
    date: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),

    payerName: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),
    payerIban: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),

    receiverName: this.fb.nonNullable.control('', {
      validators: [Validators.required],
    }),
    receiverIban: this.fb.nonNullable.control('', {
      validators: [Validators.required],
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
  });

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
