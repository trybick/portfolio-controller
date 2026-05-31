(() => {
  const ACCOUNT_ID_ATTRIBUTE = "data-fidelity-account-order-id";
  const ORIGINAL_INDEX_ATTRIBUTE = "data-fidelity-account-order-original-index";
  const MAX_PRIORITY = Number.MAX_SAFE_INTEGER;

  let savedOrder = [];
  let applyTimer = 0;
  let isApplying = false;
  let originalIndexCounter = 0;

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

  const getDetectedAccountCollection = () => {
    const list = getAccountListElement();

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

  const reorderElements = (container, sortedAccounts) => {
    const nextSignature = sortedAccounts.map((account) => account.id).join("|");
    const currentSignature = [...sortedAccounts]
      .sort((left, right) => left.index - right.index)
      .map((account) => account.id)
      .join("|");

    if (currentSignature === nextSignature) {
      return { applied: true, count: sortedAccounts.length };
    }

    isApplying = true;
    sortedAccounts.forEach((account) => container.appendChild(account.element));
    window.requestAnimationFrame(() => {
      isApplying = false;
    });

    return { applied: true, count: sortedAccounts.length };
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

    return reorderElements(container, sortedAccounts);
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

    return reorderElements(container, sortedAccounts);
  };

  const scheduleApplyOrder = () => {
    if (isApplying || applyTimer) {
      return;
    }

    applyTimer = window.requestAnimationFrame(() => {
      applyTimer = 0;
      applyOrder();
    });
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

  startObserver();

  chrome.storage.sync.get([STORAGE_KEY], (items) => {
    savedOrder = normalizeOrder(items[STORAGE_KEY]);
    applyOrder(savedOrder);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]) {
      return;
    }

    savedOrder = normalizeOrder(changes[STORAGE_KEY].newValue);
    applyOrder(savedOrder);
  });
})();
