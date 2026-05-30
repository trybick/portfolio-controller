const STORAGE_KEY = "accountOrder";

const accountListElement = document.getElementById("account-list");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");
const emptyMessage = document.getElementById("empty-message");
const headerActions = document.querySelector(".header-actions");
const footer = document.querySelector(".footer");
const aboutButton = document.getElementById("about-button");
const aboutBackButton = document.getElementById("about-back-button");
const aboutPanel = document.getElementById("about-panel");

let accountOrder = [];
let savedOrder = [];
let isBusy = false;
let isFidelityPage = false;

const normalizeAccount = (account) => {
  const id = String(account?.id || "").trim();
  const label = String(account?.label || "").trim();

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

const hasUnsavedChanges = () => {
  return getOrderSignature(accountOrder) !== getOrderSignature(savedOrder);
};

const updateButtonStates = () => {
  const canSave = accountOrder.length > 0 && hasUnsavedChanges();

  saveButton.disabled = isBusy || !canSave;
  saveButton.textContent = "Apply";
  resetButton.disabled = isBusy;
};

const updateControlsVisibility = () => {
  const shouldShow = isFidelityPage && accountOrder.length > 0;

  headerActions.classList.toggle("hidden", !shouldShow);
  footer.classList.toggle("hidden", !shouldShow);
};

const setBusy = (busyState) => {
  isBusy = busyState;
  updateButtonStates();
};

const moveAccount = (fromIndex, toIndex) => {
  if (toIndex < 0 || toIndex >= accountOrder.length || fromIndex === toIndex) {
    return;
  }

  const nextOrder = [...accountOrder];
  const [account] = nextOrder.splice(fromIndex, 1);
  nextOrder.splice(toIndex, 0, account);
  accountOrder = nextOrder;
  renderAccounts();
};

const getDragAfterElement = (clientY) => {
  const items = [...accountListElement.querySelectorAll(".account-item:not(.dragging)")];

  return items.reduce(
    (closest, item) => {
      const box = item.getBoundingClientRect();
      const offset = clientY - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: item };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
};

const commitDraggedOrder = () => {
  const draggedItem = accountListElement.querySelector(".dragging");

  if (!draggedItem) {
    return;
  }

  draggedItem.classList.remove("dragging");

  const orderedIds = [...accountListElement.querySelectorAll(".account-item")].map((item) => item.dataset.id);
  const accountById = new Map(accountOrder.map((account) => [account.id, account]));

  accountOrder = orderedIds.map((id) => accountById.get(id)).filter(Boolean);
  renderAccounts();
};

const handleListDragOver = (event) => {
  const draggedItem = accountListElement.querySelector(".dragging");

  if (!draggedItem) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";

  const afterElement = getDragAfterElement(event.clientY);

  if (!afterElement) {
    accountListElement.append(draggedItem);
    return;
  }

  if (afterElement !== draggedItem.nextElementSibling) {
    accountListElement.insertBefore(draggedItem, afterElement);
  }
};

const dragHandleIcon = `<svg class="icon icon-grip" width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="2.5" cy="3" r="1.5"/><circle cx="7.5" cy="3" r="1.5"/><circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/><circle cx="2.5" cy="13" r="1.5"/><circle cx="7.5" cy="13" r="1.5"/></svg>`;

const chevronIcon = (direction) => {
  const points = direction < 0 ? "5 12 10 7 15 12" : "5 8 10 13 15 8";

  return `<svg class="icon icon-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="${points}"/></svg>`;
};

const createMoveButton = (index, direction) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "move-button";
  button.innerHTML = chevronIcon(direction);
  button.setAttribute("aria-label", `${direction < 0 ? "Move up" : "Move down"} account group`);
  button.disabled = direction < 0 ? index === 0 : index === accountOrder.length - 1;
  button.addEventListener("click", () => moveAccount(index, index + direction));

  return button;
};

const renderAccounts = () => {
  accountListElement.replaceChildren();
  emptyMessage.classList.toggle("hidden", accountOrder.length > 0);
  updateButtonStates();
  updateControlsVisibility();

  accountOrder.forEach((account, index) => {
    const item = document.createElement("li");
    const dragHandle = document.createElement("span");
    const label = document.createElement("span");
    const moveButtons = document.createElement("span");

    item.className = "account-item";
    item.draggable = true;
    item.dataset.index = String(index);
    item.dataset.id = account.id;

    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = dragHandleIcon;
    dragHandle.setAttribute("aria-hidden", "true");

    label.className = "account-label";
    label.textContent = account.label;
    label.title = account.label;

    moveButtons.className = "move-buttons";
    moveButtons.append(
      createMoveButton(index, -1),
      createMoveButton(index, 1)
    );

    item.addEventListener("dragstart", (event) => {
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", account.id);
    });

    item.addEventListener("dragend", commitDraggedOrder);

    item.append(dragHandle, label, moveButtons);
    accountListElement.append(item);
  });
};

const getActiveTab = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!tab?.id) {
        reject(new Error("No active tab found."));
        return;
      }

      resolve(tab);
    });
  });
};

const sendActiveTabMessage = async (message) => {
  const tab = await getActiveTab();

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Open a Fidelity page, then refresh."));
        return;
      }

      resolve(response);
    });
  });
};

const mergeDetectedAccounts = (detectedAccounts) => {
  const normalizedDetectedAccounts = normalizeOrder(detectedAccounts);
  const detectedById = new Map(normalizedDetectedAccounts.map((account) => [account.id, account]));
  const existingAccounts = accountOrder
    .filter((account) => detectedById.has(account.id))
    .map((account) => detectedById.get(account.id));
  const existingIds = new Set(existingAccounts.map((account) => account.id));
  const newAccounts = normalizedDetectedAccounts.filter((account) => !existingIds.has(account.id));

  return [...existingAccounts, ...newAccounts];
};

const pruneSavedOrder = async (detectedAccounts) => {
  const normalizedDetectedAccounts = normalizeOrder(detectedAccounts);
  const detectedById = new Map(normalizedDetectedAccounts.map((account) => [account.id, account]));
  const prunedSavedOrder = savedOrder
    .filter((account) => detectedById.has(account.id))
    .map((account) => detectedById.get(account.id));

  if (getOrderSignature(prunedSavedOrder) === getOrderSignature(savedOrder)) {
    return;
  }

  savedOrder = prunedSavedOrder;

  if (savedOrder.length) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: savedOrder });
    return;
  }

  await chrome.storage.sync.remove(STORAGE_KEY);
};

const refreshDetectedAccounts = async () => {
  const response = await sendActiveTabMessage({ type: "DETECT_ACCOUNTS" });
  const detectedAccounts = response?.accounts || [];

  if (!detectedAccounts.length) {
    return 0;
  }

  await pruneSavedOrder(detectedAccounts);
  accountOrder = mergeDetectedAccounts(detectedAccounts);
  renderAccounts();

  return detectedAccounts.length;
};

const handleDetectAccounts = async () => {
  setBusy(true);

  try {
    await refreshDetectedAccounts();
  } catch {
    accountOrder = [];
    renderAccounts();
  } finally {
    setBusy(false);
  }
};

const handleSaveOrder = async () => {
  if (!accountOrder.length) {
    return;
  }

  setBusy(true);

  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: accountOrder });
    await sendActiveTabMessage({ type: "APPLY_ACCOUNT_ORDER", order: accountOrder });
    savedOrder = normalizeOrder(accountOrder);
  } catch {
  } finally {
    setBusy(false);
    renderAccounts();
  }
};

const handleResetOrder = async () => {
  setBusy(true);

  try {
    accountOrder = [];
    savedOrder = [];
    await chrome.storage.sync.remove(STORAGE_KEY);
    await sendActiveTabMessage({ type: "CLEAR_ACCOUNT_ORDER" }).catch(() => null);
    await refreshDetectedAccounts();
  } catch {
    renderAccounts();
  } finally {
    setBusy(false);
  }
};

const isFidelityUrl = (url) => {
  try {
    const { protocol, hostname } = new URL(url || "");

    return protocol === "https:" && (hostname === "fidelity.com" || hostname.endsWith(".fidelity.com"));
  } catch {
    return false;
  }
};

const updateFidelityPageState = async () => {
  try {
    const tab = await getActiveTab();
    isFidelityPage = isFidelityUrl(tab.url);
  } catch {
    isFidelityPage = false;
  }

  updateControlsVisibility();
};

const loadSavedOrder = async () => {
  const items = await chrome.storage.sync.get([STORAGE_KEY]);
  savedOrder = normalizeOrder(items[STORAGE_KEY]);
  accountOrder = savedOrder;
  renderAccounts();
};

accountListElement.addEventListener("dragover", handleListDragOver);
accountListElement.addEventListener("drop", (event) => event.preventDefault());

const setAboutVisible = (isVisible) => {
  aboutPanel.classList.toggle("hidden", !isVisible);
};

saveButton.addEventListener("click", handleSaveOrder);
resetButton.addEventListener("click", handleResetOrder);
aboutButton.addEventListener("click", () => setAboutVisible(true));
aboutBackButton.addEventListener("click", () => setAboutVisible(false));

updateFidelityPageState();
loadSavedOrder().then(handleDetectAccounts);
