import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { Payment } from '../../models/payment';
import { PaymentsService } from '../../services/payments.service';
import { PAYMENT_STATUS_LABELS, formatPaymentAmount } from '../../shared/payment-formatters';
@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-details.html',
  styleUrl: './payment-details.css',
})
export class PaymentDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentsService = inject(PaymentsService);
  private readonly router = inject(Router);
  readonly statusLabels = PAYMENT_STATUS_LABELS;

  readonly formatAmount = formatPaymentAmount;

  readonly paymentId = this.route.snapshot.paramMap.get('id');
  readonly payment = signal<Payment | null>(null);

  // readonly statusLabels: Record<Payment['status'], string> = {
  //   draft: 'Чернетка',
  //   pending: 'Очікує підпису',
  //   signed: 'Підписаний',
  //   sent: 'Відправлений',
  //   rejected: 'Відхилений',
  // };
  constructor() {
    if (!this.paymentId) {
      return;
    }

    this.paymentsService.getPaymentById(this.paymentId).subscribe((payment) => {
      this.payment.set(payment);
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
