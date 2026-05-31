// Single source of truth for the page selectors. Update here if their
// markup changes and account detection breaks.
const DOM_SELECTORS = {
  accountList: ".acct-selector__acct-list",
  accountGroup: ".acct-selector__group",
  accountGroupLabel: [
    ".acct-selector__group-name",
    "[data-testid*='accounts-selector-group-title']"
  ]
};

const getAccountListElement = () => document.querySelector(DOM_SELECTORS.accountList);

const getAccountLabel = (element) => {
  const selectors = [...DOM_SELECTORS.accountGroupLabel, "button", "a"];

  for (const selector of selectors) {
    const match = element.querySelector(selector);
    const text = match ? normalizeText(match.textContent || "") : "";

    if (text) {
      return text;
    }
  }

  return normalizeText(element.textContent || "");
};

const getAccountCollection = (list) => {
  const directAccounts = Array.from(list.children).filter((element) => {
    return element.matches?.(DOM_SELECTORS.accountGroup);
  });

  if (directAccounts.length) {
    return { container: list, elements: directAccounts };
  }

  const nestedAccounts = Array.from(list.querySelectorAll(DOM_SELECTORS.accountGroup));
  const nestedParent = nestedAccounts[0]?.parentElement;

  if (nestedParent && nestedAccounts.every((element) => element.parentElement === nestedParent)) {
    return { container: nestedParent, elements: nestedAccounts };
  }

  return { container: list, elements: nestedAccounts };
};
