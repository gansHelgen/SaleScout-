import { useEffect, useState } from "react";
import products from "../../data/products.json";
import type { PriceResult, Product, Reason } from "../../src/types.ts";

const reasonLabels: Record<Reason, string> = {
  UNDERCUT: "Цена ниже конкурента",
  AT_MIN: "Достигнута минимальная цена",
  AT_MAX: "Достигнута максимальная цена",
  NO_COMPETITORS: "Нет конкурентов в наличии",
};

const currency = new Intl.NumberFormat("ru-KZ", {
  style: "currency",
  currency: "KZT",
  maximumFractionDigits: 0,
});

export default function App() {
  const [results, setResults] = useState<PriceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function reprice() {
      try {
        const response = await fetch("/reprice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(products),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Не удалось рассчитать цены (HTTP ${response.status})`);
        }
        setResults((await response.json()) as PriceResult[]);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Неизвестная ошибка");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void reprice();
    return () => controller.abort();
  }, []);

  const productsBySku = new Map((products as Product[]).map((product) => [product.sku, product]));

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SaleScout — главная">
          <span className="brand-mark">S</span>
          <span>Sale<span className="brand-accent">Scout</span></span>
        </a>
        <span className="topbar-label"><span className="status-dot" /> Цены синхронизированы</span>
      </header>

      <section className="intro">
        <p className="eyebrow">ЦЕНОВОЙ МОНИТОРИНГ</p>
        <h1>Ваши цены —<br className="mobile-break" /> всегда на шаг впереди.</h1>
        <p className="subtitle">Следим за конкурентами и подбираем оптимальную цену для каждого товара.</p>
      </section>

      <section className="results-panel" aria-labelledby="results-heading">
        <div className="panel-heading">
          <div>
            <h2 id="results-heading">Результаты переоценки</h2>
            <p>Цены рассчитаны на основе предложений конкурентов</p>
          </div>
          <span className="product-count">{products.length} товаров</span>
        </div>

        {loading && <p className="message">Рассчитываем цены…</p>}
        {error && <p className="message error" role="alert">{error}</p>}

        {!loading && !error && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ТОВАР</th>
                  <th>АРТИКУЛ</th>
                  <th>БЫЛО</th>
                  <th>СТАЛО</th>
                  <th>ПРИЧИНА</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const product = productsBySku.get(result.sku);
                  return (
                    <tr key={result.sku}>
                      <td className="product-name">{product?.name ?? "Товар"}</td>
                      <td className="sku">{result.sku}</td>
                      <td className="old-price">{currency.format(result.oldPrice)}</td>
                      <td className="new-price">{currency.format(result.newPrice)}</td>
                      <td>
                        <span className={`reason reason-${result.reason.toLowerCase()}`}>
                          <span className="reason-dot" />
                          {reasonLabels[result.reason]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="panel-footer">
          <span className="live-indicator"><span /> АВТОПЕРЕОЦЕНКА АКТИВНА</span>
          <span>Данные обновляются при загрузке страницы</span>
        </footer>
      </section>

      <p className="page-note">SaleScout помогает оставаться конкурентоспособными, сохраняя контроль над маржой.</p>
    </main>
  );
}
