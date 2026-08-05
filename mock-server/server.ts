import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'node:fs';
import { CreatePayment, Payment } from '../src/app/models/payment';

const app = express();
const PORT = 3000;

// Configure middleware
app.use(cors());
app.use(express.json());

// Read payments from the JSON file
// Зчитуємо платежі з JSON-файлу
function readPayments(): Payment[] {
  const fileContent = readFileSync(new URL('./payments.json', import.meta.url), 'utf-8');

  return JSON.parse(fileContent) as Payment[];
}

function writePayments(payments: Payment[]): void {
  writeFileSync(
    new URL('./payments.json', import.meta.url),
    JSON.stringify(payments, null, 2),
    'utf-8'
  );
}

// Handle payments list requests
// Обробка запитів на отримання списку платежів
app.get(
  '/payments',
  (
    req: express.Request<
      {},
      { items: Payment[]; total: number },
      never,
      Record<string, string | string[] | undefined>
    >,
    res: express.Response<{ items: Payment[]; total: number }>
  ) => {
    // return res.status(500).json({
    //   message: 'Тестова помилка сервера',
    // });

    const payments = readPayments();

    const requestedPage = Number(req.query['page'] ?? 1);
    const requestedSize = Number(req.query['size'] ?? 25);

    const allowedPageSizes = [25, 50, 100];

    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const size = allowedPageSizes.includes(requestedSize) ? requestedSize : 25;

    // Parse sorting and filter parameters
    // Параметри сортування та фільтрації
    const sort = String(req.query['sort'] ?? '');

    const docNumber = String(req.query['docNumber'] ?? '');
    const payerName = String(req.query['payerName'] ?? '');
    const receiverName = String(req.query['receiverName'] ?? '');
    const currency = String(req.query['currency'] ?? '');
    const status = String(req.query['status'] ?? '');
    const amountFrom = req.query['amountFrom'] ? Number(req.query['amountFrom']) : null;
    const amountTo = req.query['amountTo'] ? Number(req.query['amountTo']) : null;
    const dateFrom = String(req.query['dateFrom'] ?? '');
    const dateTo = String(req.query['dateTo'] ?? '');

    // Convert the status query into an array
    // Перетворюємо параметр статусів на масив
    const statuses = status
      ? status
          .toLowerCase()
          .split(',')
          .map((item) => item.trim())
      : [];

    // Create a copy for filtering and sorting
    // Створюємо копію для фільтрації та сортування
    let processedPayments = [...payments];
    // Apply filters
    // Фільтри
    if (docNumber) {
      processedPayments = processedPayments.filter((payment) =>
        payment.docNumber.toLowerCase().includes(docNumber.toLowerCase())
      );
    }

    if (payerName) {
      processedPayments = processedPayments.filter((payment) =>
        payment.payerName.toLowerCase().includes(payerName.toLowerCase())
      );
    }

    if (receiverName) {
      processedPayments = processedPayments.filter((payment) =>
        payment.receiverName.toLowerCase().includes(receiverName.toLowerCase())
      );
    }

    if (currency) {
      processedPayments = processedPayments.filter(
        (payment) => payment.currency.toLowerCase() === currency.toLowerCase()
      );
    }

    if (statuses.length) {
      processedPayments = processedPayments.filter((payment) =>
        statuses.includes(payment.status.toLowerCase())
      );
    }

    if (amountFrom !== null) {
      processedPayments = processedPayments.filter((payment) => payment.amount >= amountFrom);
    }

    if (amountTo !== null) {
      processedPayments = processedPayments.filter((payment) => payment.amount <= amountTo);
    }

    if (dateFrom) {
      processedPayments = processedPayments.filter(
        (payment) => new Date(payment.date).getTime() >= new Date(dateFrom).getTime()
      );
    }

    if (dateTo) {
      processedPayments = processedPayments.filter(
        (payment) => new Date(payment.date).getTime() <= new Date(dateTo).getTime()
      );
    }
    // Apply sorting
    const sortableFields: (keyof Payment)[] = [
      'docNumber',
      'date',
      'payerName',
      'payerIban',
      'receiverName',
      'receiverIban',
      'amount',
      'currency',
      'status',
      'comment',
    ];

    const sortRules = sort
      .split(',')
      .map((rule) => {
        const [field, direction] = rule.split(':');

        return {
          field,
          direction,
        };
      })
      .filter(
        (
          rule
        ): rule is {
          field: keyof Payment;
          direction: 'asc' | 'desc';
        } =>
          sortableFields.includes(rule.field as keyof Payment) &&
          (rule.direction === 'asc' || rule.direction === 'desc')
      );

    if (sortRules.length > 0) {
      processedPayments.sort((a, b) => {
        for (const rule of sortRules) {
          const firstValue = a[rule.field];
          const secondValue = b[rule.field];

          let comparison = 0;

          if (rule.field === 'amount') {
            comparison = Number(firstValue) - Number(secondValue);
          } else if (rule.field === 'date') {
            comparison =
              new Date(String(firstValue)).getTime() - new Date(String(secondValue)).getTime();
          } else {
            comparison = String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'uk');
          }

          if (comparison !== 0) {
            return rule.direction === 'desc' ? -comparison : comparison;
          }
        }

        return 0;
      });
    }
    // Apply pagination
    // Пагінація
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    const items = processedPayments.slice(startIndex, endIndex);
    // Return the paginated result
    // Повертаємо результат із пагінацією
    setTimeout(() => {
      res.json({
        items,
        total: processedPayments.length,
      });
    }, 2000);
  }
);

app.get(
  '/payments/check-doc-number',
  (
    req: express.Request<{}, { exists: boolean }, never, { docNumber?: string }>,
    res: express.Response<{ exists: boolean }>
  ) => {
    const docNumber = req.query.docNumber?.trim().toLowerCase();

    if (!docNumber) {
      return res.json({
        exists: false,
      });
    }

    const payments = readPayments();

    const exists = payments.some((payment) => payment.docNumber.toLowerCase() === docNumber);

    return res.json({
      exists,
    });
  }
);

// Handle a single payment request
// Обробка запиту на отримання одного платежу
app.get(
  '/payments/:id',
  (req: express.Request<{ id: string }>, res: express.Response<Payment | { message: string }>) => {
    const payments = readPayments();

    const payment = payments.find((item) => String(item.id) === req.params['id']);

    if (!payment) {
      return res.status(404).json({
        message: 'Платіж не знайдено',
      });
    }

    return res.json(payment);
  }
);

app.post(
  '/payments',
  (req: express.Request<{}, Payment, CreatePayment>, res: express.Response<Payment>) => {
    const payments = readPayments();

    const newPayment: Payment = {
      ...req.body,
      id: crypto.randomUUID(),
    };

    payments.push(newPayment);

    writePayments(payments);

    return res.status(201).json(newPayment);
  }
);

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
