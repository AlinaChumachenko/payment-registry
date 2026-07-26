import { writeFileSync } from 'node:fs';
import { Payment, Currency, PaymentStatus } from '../src/app/models/payment';

const currencies: Currency[] = ['EUR', 'USD', 'UAH'];
const statuses: PaymentStatus[] = ['draft', 'pending', 'signed', 'sent', 'rejected'];
const payerCompanies = [
  'ТОВ Альфа',
  'ТОВ Бета',
  'ТОВ Ромашка',
  'ТОВ Сігма',
  'ТОВ Гамма',
  'ТОВ Дельта',
  'ТОВ Омега',
  'ТОВ Вектор',
  'ТОВ Горизонт',
  'ТОВ Прогрес',
];
const receiverCompanies = [
  'ТОВ Меркурій',
  'ТОВ Оріон',
  'ТОВ Верес',
  'ТОВ Прайм',
  'ТОВ Логістик Плюс',
  'ТОВ ТехноСвіт',
  'ТОВ Будінвест',
  'ТОВ АгроЛайн',
  'ТОВ ЕнергоСервіс',
  'ТОВ Фінанс Груп',
];
function getRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomAmount(): number {
  return Math.floor(Math.random() * 100000) + 100;
}

function getRandomDate(): string {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * 365);
  today.setDate(today.getDate() - randomDays);
  return today.toISOString();
}
function createPayment(index: number): Payment {
  return {
    id: crypto.randomUUID(),
    docNumber: `PAY-${String(index).padStart(6, '0')}`,
    date: getRandomDate(),
    payerName: getRandomItem(payerCompanies),
    payerIban: `UA11${String(index).padStart(25, '0')}`,
    receiverName: getRandomItem(receiverCompanies),
    receiverIban: `UA22${String(index).padStart(25, '0')}`,
    amount: getRandomAmount(),
    currency: getRandomItem(currencies),
    status: getRandomItem(statuses),
    comment: null,
  };
}

const payments: Payment[] = Array.from({ length: 10_000 }, (_, index) => createPayment(index + 1));

writeFileSync('mock-server/payments.json', JSON.stringify(payments, null, 2), 'utf-8');

console.log(`Generated payments: ${payments.length}`);
console.log(payments.slice(0, 3));
