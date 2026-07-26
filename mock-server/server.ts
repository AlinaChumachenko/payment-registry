import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { Payment } from '../src/app/models/payment';

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
// Handle payments list requests
// Обробка запитів на отримання списку платежів
app.get('/payments', (req, res) => {
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
  // Сортування
  const [sortField, sortDirection] = sort.split(':');

  if (sortField) {
    processedPayments.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }

      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      if (
        sortField === 'docNumber' ||
        sortField === 'payerName' ||
        sortField === 'receiverName' ||
        sortField === 'currency' ||
        sortField === 'status'
      ) {
        comparison = a[sortField].localeCompare(b[sortField], 'uk');
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }
  // Apply pagination
  // Пагінація
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;

  const items = processedPayments.slice(startIndex, endIndex);
  // Return the paginated result
  // Повертаємо результат із пагінацією
  res.json({
    items,
    total: processedPayments.length,
  });
});

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
