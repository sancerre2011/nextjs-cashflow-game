const parseNumericValue = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const applyFundSplit = (entry, type) => {
  if (!entry) return null;

  const currentShares = parseNumericValue(entry.shares);
  const currentCostPerShare = parseNumericValue(entry.costPerShare);

  if (currentShares <= 0 || currentCostPerShare <= 0) {
    return null;
  }

  const nextShares = type === "split" ? currentShares * 2 : currentShares / 2;
  const nextCostPerShare =
    type === "split" ? currentCostPerShare / 2 : currentCostPerShare * 2;

  return {
    ...entry,
    shares: String(nextShares),
    costPerShare: String(nextCostPerShare),
    value: String(nextShares * nextCostPerShare),
  };
};

module.exports = { applyFundSplit };
