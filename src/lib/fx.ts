let cachedRates: Record<string, number> | null = null;
let lastFetchTime = 0;

export let lastUpdated: number | null = null;

export async function getFxRates() {
  const now = Date.now();

  // Cache for 1 hour
  if (cachedRates && now - lastFetchTime < 60 * 60 * 1000) {
    return cachedRates;
  }

  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exchange rates");
  }

  const data = await response.json();

  if (!data || !data.rates) {
    throw new Error("Invalid FX response");
  }

  cachedRates = data.rates;
  lastFetchTime = now;
  lastUpdated = now;

  return cachedRates;
}