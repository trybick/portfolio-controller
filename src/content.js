(() => {
  const STORAGE_KEY = "accountOrder";
  const LIST_SELECTOR = ".acct-selector__acct-list";
  const ACCOUNT_GROUP_SELECTOR = ".acct-selector__group";
  const ACCOUNT_GROUP_LABEL_SELECTORS = [
    ".acct-selector__group-name",
    "[data-testid='ap143528-accounts-selector-group-title']"
  ];
  const ACCOUNT_ID_ATTRIBUTE = "data-fidelity-account-order-id";
  const ORIGINAL_INDEX_ATTRIBUTE = "data-fidelity-account-order-original-index";
  const MAX_PRIORITY = Number.MAX_SAFE_INTEGER;

  let savedOrder = [];
  let applyTimer = 0;
  let isApplying = false;
  let originalIndexCounter = 0;

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const getAccountLabel = (element) => {
    const selectors = [
      ...ACCOUNT_GROUP_LABEL_SELECTORS,
      "button",
      "a"
    ];

    for (const selector of selectors) {
      const match = element.querySelector(selector);
      const text = match ? normalizeText(match.textContent || "") : "";

      if (text) {
        return text;
      }
    }

    return normalizeText(element.textContent || "");
  };

  const getAccountId = (label) => {
    return normalizeText(label)
      .toLowerCase()
      .replace(/\$\s?-?[\d,]+(\.\d{2})?/g, "")
      .replace(/\b-?[\d,]+(\.\d{2})\b/g, "")
      .replace(/\b(today|total|balance|available|positions|activity)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizeOrder = (order) => {
    if (!Array.isArray(order)) {
      return [];
    }

    return order
      .map((account) => {
        if (typeof account === "string") {
          const label = normalizeText(account);
          const id = getAccountId(label);

          return id ? { id, label } : null;
        }

        const label = normalizeText(account?.label || "");
        const id = normalizeText(account?.id || getAccountId(label));

        return id && label ? { id, label } : null;
      })
      .filter(Boolean);
  };

  const getOrderSignature = (order) => {
    return normalizeOrder(order)
      .map((account) => account.id)
      .join("|");
  };

  const pruneSavedOrder = (order, accounts) => {
    const normalizedOrder = normalizeOrder(order);
    const detectedById = new Map(accounts.map((account) => [account.id, account]));
    const prunedOrder = normalizedOrder
      .filter((account) => detectedById.has(account.id))
      .map((account) => {
        const detectedAccount = detectedById.get(account.id);

        return { id: detectedAccount.id, label: detectedAccount.label };
      });

    if (getOrderSignature(prunedOrder) === getOrderSignature(normalizedOrder)) {
      return normalizedOrder;
    }

    savedOrder = prunedOrder;

    if (savedOrder.length) {
      chrome.storage.sync.set({ [STORAGE_KEY]: savedOrder });
      return savedOrder;
    }

    chrome.storage.sync.remove(STORAGE_KEY);
    return savedOrder;
  };

  const getAccountContainer = (list, elements) => {
    const sharedParent = elements[0]?.parentElement;

    if (sharedParent && elements.every((element) => element.parentElement === sharedParent)) {
      return sharedParent;
    }

    return list;
  };

  const getAccountCollection = (list) => {
    const directAccounts = Array.from(list.children).filter((element) => {
      return element.matches?.(ACCOUNT_GROUP_SELECTOR);
    });

    if (directAccounts.length) {
      return { container: list, elements: directAccounts };
    }

    const nestedAccounts = Array.from(list.querySelectorAll(ACCOUNT_GROUP_SELECTOR));
    const nestedParent = nestedAccounts[0]?.parentElement;

    if (nestedParent && nestedAccounts.every((element) => element.parentElement === nestedParent)) {
      return { container: nestedParent, elements: nestedAccounts };
    }

    return { container: list, elements: nestedAccounts };
  };

  const getDetectedAccountCollection = () => {
    const list = document.querySelector(LIST_SELECTOR);

    if (!list) {
      return { container: null, accounts: [] };
    }

    const counts = new Map();
    const { container, elements } = getAccountCollection(list);

    const accounts = elements
      .map((element, index) => {
        const label = getAccountLabel(element);
        const baseId = getAccountId(label) || `account-${index + 1}`;
        const duplicateCount = counts.get(baseId) || 0;
        const id = duplicateCount ? `${baseId}::${duplicateCount + 1}` : baseId;

        counts.set(baseId, duplicateCount + 1);
        element.setAttribute(ACCOUNT_ID_ATTRIBUTE, id);

        if (!element.hasAttribute(ORIGINAL_INDEX_ATTRIBUTE)) {
          element.setAttribute(ORIGINAL_INDEX_ATTRIBUTE, String(originalIndexCounter));
          originalIndexCounter += 1;
        }

        return { id, label, element, index };
      })
      .filter((account) => account.label);

    return { container, accounts };
  };

  const getDetectedAccounts = () => {
    return getDetectedAccountCollection().accounts;
  };

  const applyOrder = (order = savedOrder) => {
    const { container, accounts } = getDetectedAccountCollection();

    if (!container || !accounts.length) {
      return { applied: false, count: 0 };
    }

    const normalizedOrder = pruneSavedOrder(order, accounts);

    if (!normalizedOrder.length) {
      return { applied: false, count: accounts.length };
    }

    const priorityById = new Map(
      normalizedOrder.map((account, index) => [account.id, index])
    );

    const sortedAccounts = [...accounts].sort((left, right) => {
      const leftPriority = priorityById.get(left.id) ?? MAX_PRIORITY;
      const rightPriority = priorityById.get(right.id) ?? MAX_PRIORITY;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.index - right.index;
    });

    const currentSignature = accounts.map((account) => account.id).join("|");
    const nextSignature = sortedAccounts.map((account) => account.id).join("|");

    if (currentSignature === nextSignature) {
      return { applied: true, count: accounts.length };
    }

    isApplying = true;
    sortedAccounts.forEach((account) => container.appendChild(account.element));
    window.requestAnimationFrame(() => {
      isApplying = false;
    });

    return { applied: true, count: accounts.length };
  };

  const restoreOriginalOrder = () => {
    const { container, accounts } = getDetectedAccountCollection();

    if (!container || !accounts.length) {
      return { applied: false, count: 0 };
    }

    const getOriginalIndex = (element) => {
      const value = Number(element.getAttribute(ORIGINAL_INDEX_ATTRIBUTE));

      return Number.isFinite(value) ? value : MAX_PRIORITY;
    };

    const sortedAccounts = [...accounts].sort((left, right) => {
      const leftIndex = getOriginalIndex(left.element);
      const rightIndex = getOriginalIndex(right.element);

      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return left.index - right.index;
    });

    const currentSignature = accounts.map((account) => account.id).join("|");
    const nextSignature = sortedAccounts.map((account) => account.id).join("|");

    if (currentSignature === nextSignature) {
      return { applied: true, count: accounts.length };
    }

    isApplying = true;
    sortedAccounts.forEach((account) => container.appendChild(account.element));
    window.requestAnimationFrame(() => {
      isApplying = false;
    });

    return { applied: true, count: accounts.length };
  };

  const scheduleApplyOrder = () => {
    if (isApplying) {
      return;
    }

    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(() => applyOrder(), 150);
  };

  const startObserver = () => {
    const observer = new MutationObserver(scheduleApplyOrder);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "DETECT_ACCOUNTS") {
      const accounts = getDetectedAccounts().map(({ id, label }) => ({ id, label }));
      sendResponse({ ok: true, accounts });
      return false;
    }

    if (message?.type === "APPLY_ACCOUNT_ORDER") {
      savedOrder = normalizeOrder(message.order);
      const result = applyOrder(savedOrder);
      sendResponse({ ok: true, ...result });
      return false;
    }

    if (message?.type === "CLEAR_ACCOUNT_ORDER") {
      savedOrder = [];
      const result = restoreOriginalOrder();
      sendResponse({ ok: true, ...result });
      return false;
    }

    return false;
  });

  chrome.storage.sync.get([STORAGE_KEY], (items) => {
    savedOrder = normalizeOrder(items[STORAGE_KEY]);
    applyOrder(savedOrder);
    startObserver();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) {
      return;
    }

    savedOrder = normalizeOrder(changes[STORAGE_KEY].newValue);
    applyOrder(savedOrder);
  });
})();
