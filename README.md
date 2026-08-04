## Запуск проєкту

### Встановлення залежностей

npm install

### Запуск Angular-застосунку

Застосунок буде доступний за адресою:http://localhost:4200

Запуск mock backend

В окремому терміналі потрібно запустити mock-сервер командою, визначеною в package.json.

Наприклад:

npm run server

Mock API працює за адресою:http://localhost:3000

Для повноцінної роботи застосунку Angular і mock backend мають бути запущені одночасно.

Для створення платежу використовується окремий тип без поля id:

type CreatePayment = Omit<Payment, 'id'>;

Ідентифікатор нового платежу генерується mock-сервером.

Вибір Grid

Для таблиці використано AG Grid Community.

Причини вибору:

підтримка сортування за кількома колонками;
зручна робота з великими наборами даних;
підтримка кастомних cell renderer;
можливість зміни ширини та порядку колонок;
підтримка вибору рядків;
хороша інтеграція з Angular;
Community-версії достатньо для обов’язкових вимог завдання.

Також розглядалися:

Angular Material Table;
PrimeNG Table;
власна таблиця на базі Angular CDK.

Angular Material Table потребувала б більше власного коду для серверного сортування, пагінації та керування колонками. PrimeNG Table має багато готових можливостей, але AG Grid краще підходить для застосунку, де таблиця є основним робочим інструментом.

# PaymentRegistry

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.32.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
