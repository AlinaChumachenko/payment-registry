import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { Payment } from '../src/app/models/payment';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

function readPayments(): Payment[] {
  const fileContent = readFileSync(new URL('./payments.json', import.meta.url), 'utf-8');

  return JSON.parse(fileContent) as Payment[];
}

app.get('/payments', (req, res) => {
  const payments = readPayments();

  const page = Number(req.query['page'] ?? 1);
  const size = Number(req.query['size'] ?? 25);

  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;

  const items = payments.slice(startIndex, endIndex);

  res.json({
    items,
    total: payments.length,
  });
});

app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});
