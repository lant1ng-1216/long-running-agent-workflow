export function createMarketSummary({ asset, price, sourceTimestamp }) {
  if (!asset || !Number.isFinite(price) || !sourceTimestamp) {
    throw new TypeError("asset, a finite price, and sourceTimestamp are required");
  }

  return {
    asset,
    price,
    sourceTimestamp,
    displayLabel: `${asset} · ${price}`,
    disclosure: "Illustrative sample data — not a live quote.",
  };
}
