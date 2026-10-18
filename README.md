# SaleScout — мини-прайс-бот

Мини-приложение для расчёта конкурентных цен. Сервер на Express предоставляет `POST /reprice`, а React-интерфейс отправляет ему список из `data/products.json` и показывает результаты.

## Требования

- Node.js 20 или новее
- npm

## Установка и запуск

```bash
npm install
npm run dev
```

Откройте адрес Vite, показанный в терминале (обычно <http://localhost:5173>). API запускается на <http://localhost:3001>, а Vite проксирует запросы `/reprice` на сервер.

Для отдельного запуска доступны `npm run dev:server` и `npm run dev:web`. Порт API можно изменить переменной окружения `PORT`.

## API

`POST /reprice` принимает JSON-массив товаров и возвращает рассчитанные результаты в исходном порядке:

```bash
curl -X POST http://localhost:3001/reprice \
  -H "Content-Type: application/json" \
  --data-binary "@data/products.json"
```

Некорректное тело или товар возвращает `400` с описанием ошибки.

## Расчёт цены

`calculatePrice` в `src/pricing.ts` — чистая функция. Она выбирает минимальную цену среди конкурентов в наличии, вычитает шаг и округляет вниз до целого тенге. Результат ограничивается `minPrice` и `maxPrice`. Если конкурентов в наличии нет, используется `maxPrice`. `myPrice` возвращается как `oldPrice` и не влияет на расчёт.

## Проверки и production-сборка

```bash
npm test
npm run typecheck
npm run build
```

`npm run build` собирает клиент в `dist/`. Для production API запускайте отдельно командой `npm start`; раздачу собранного клиентского приложения можно настроить на reverse proxy перед API.
