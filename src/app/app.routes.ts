import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/payments/payments').then((m) => m.PaymentsPage),
      },
      {
        path: 'payments/:id',
        loadComponent: () =>
          import('./pages/payment-details/payment-details').then((m) => m.PaymentDetailsPage),
      },
    ],
  },
];
