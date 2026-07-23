import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { PaymentsPage } from './pages/payments/payments';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: PaymentsPage,
      },
    ],
  },
];
