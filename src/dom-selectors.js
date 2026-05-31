/**
 * This file isolates everything that depends on Fidelity's page markup: the CSS
 * selectors plus related helpers.
 */

const DOM_SELECTORS = {
  // Container element holding all account groups.
  accountList: ".acct-selector__acct-list",
  // A single account group inside the list; these are the reorderable items.
  accountGroup: ".acct-selector__group",
  // Candidate selectors for the name text inside an account group, tried in order.
  accountGroupLabel: [
    // Primary: expected location of the account group name.
    ".acct-selector__group-name",
    // Backup selector: used if Fidelity drops/renames the BEM class above.
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
