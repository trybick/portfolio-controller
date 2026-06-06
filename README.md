# Portfolio Controller

Do you wish your Fidelity accounts showed up in a different order? This free Chrome
extension lets you drag your account groups into the order you want, and keeps them
that way every time you visit your Fidelity portfolio.

<p align="center">
  <img src="screenshots/screenshot-store.png" alt="Portfolio Controller popup with reorderable account groups" width="358">
</p>

> **Not affiliated with Fidelity.** This is an independent, unofficial extension. It
> is not authorized, endorsed, sponsored by, or produced by Fidelity Investments.
> "Fidelity" is referenced only to describe the website this extension works with.

It only changes how things *look* in your own browser. It never touches your money,
your login, or anything on Fidelity's side.

## How it works

When you open the popup on your Fidelity portfolio page, the extension reads the
account group names from the page itself. It simply detects those HTML titles and lists them so you can reorder them. Nothing is fetched from Fidelity's servers or sent anywhere
else.

## Step 1: Add the extension to Chrome

Install the extension from the Chrome Web Store page: **[Download link coming soon](https://chromewebstore.google.com/PLACEHOLDER)**.

## Step 2: Put your accounts in the order you like

1. When you're on your fidelitiy portfolio page, click the extension's icon in the Chrome toolbar. A small window will pop up.
2. Rearrange the accounts in the list however you like:
   - **Drag and drop** a group up or down, or
   - Use the **Up** and **Dn** buttons next to each group.
3. Click **Save**.

Your accounts will now appear in your chosen order. Chrome remembers your order, so
it stays the same the next time you open Fidelity.

## Good to know

- **Your settings follow you.** If you're signed into Chrome on more than one
  computer, your saved order syncs across them automatically.
- **Nothing leaves your browser.** The extension doesn't send your information
  anywhere. It only rearranges what's displayed on your screen.

## If something isn't working

- Fidelity occasionally updates the design of their website. When that happens, the
  extension may stop recognizing your accounts. If you're comfortable editing code
  (or know someone who is), the part that finds the accounts lives in
  `src/dom-selectors.js` and can be updated.

## License

This project is free and open source under the [MIT](LICENSE) license.
