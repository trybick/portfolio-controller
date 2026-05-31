const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const getAccountId = (label) => {
  return normalizeText(label)
    .toLowerCase()
    .replace(/\$\s?-?[\d,]+(\.\d{2})?/g, "")
    .replace(/\b-?[\d,]+(\.\d{2})\b/g, "")
    .replace(/\b(today|total|balance|available|positions|activity)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeAccount = (account) => {
  if (typeof account === "string") {
    const label = normalizeText(account);
    const id = getAccountId(label);

    return id ? { id, label } : null;
  }

  const label = normalizeText(account?.label || "");
  const id = normalizeText(account?.id || getAccountId(label));

  return id && label ? { id, label } : null;
};

const normalizeOrder = (order) => {
  if (!Array.isArray(order)) {
    return [];
  }

  return order.map(normalizeAccount).filter(Boolean);
};

const getOrderSignature = (order) => {
  return normalizeOrder(order)
    .map((account) => account.id)
    .join("|");
};
