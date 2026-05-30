# Fidelity Account Group Order

A Chrome extension that lets users manually reorder account groups in the Fidelity portfolio account selector.

## Install locally

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select this folder: `fidelity-account-order-extension`.

## Use

1. Open the Fidelity portfolio page.
2. Click the extension icon.
3. Click Detect groups.
4. Drag account groups or use Up/Dn.
5. Click Save & apply.

The saved order is stored in `chrome.storage.sync`. New or unmatched account groups stay visible and are appended after the manually ordered groups.

## Fidelity selectors

The extension currently targets:

- Account list: `.acct-selector__acct-list`
- Account groups: `.acct-selector__group`
- Account group labels: `.acct-selector__group-name`

If Fidelity changes the page markup, update those selectors in `src/content.js`.
