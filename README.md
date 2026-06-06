# Portfolio Controller

Do you wish your Fidelity accounts showed up in a different order? This free Chrome
extension lets you drag your account groups into the order you want, and keeps them
that way every time you visit your Fidelity portfolio.

> **Not affiliated with Fidelity.** This is an independent, unofficial extension. It
> is not authorized, endorsed, sponsored by, or produced by Fidelity Investments.
> "Fidelity" is referenced only to describe the website this extension works with.

It only changes how things *look* in your own browser. It never touches your money,
your login, or anything on Fidelity's side.

## What you need

- A computer running the **Google Chrome** web browser.
- A **Fidelity** account that you log into on the web.

## Step 1: Add the extension to Chrome

The easiest way to install is straight from the Chrome Web Store:

1. Open the extension's Chrome Web Store page: **[Download link coming soon](https://chromewebstore.google.com/PLACEHOLDER)**.
2. Click **Add to Chrome**.
3. In the confirmation box that appears, click **Add extension**.

That's it. You should now see "Portfolio Controller" in your list of
extensions.

> Tip: Click the little puzzle-piece icon near the top-right of Chrome and pin the
> extension so its icon is always easy to find.

### Advanced: install manually from the source code

If you'd rather load the extension from the source files (for example, to try the
latest changes before they reach the store), you can install it as an unpacked
extension instead:

1. Download this project to your computer. If you got it as a ZIP file, unzip it so
   you have a regular folder.
2. Open Chrome and, in the address bar at the top, type `chrome://extensions` and
   press Enter.
3. In the top-right corner of that page, turn on the **Developer mode** switch.
4. A few new buttons will appear. Click **Load unpacked**.
5. Find and select the folder named `portfolio-controller` (the folder
   you unzipped in step 1), then click **Select**.

## Step 2: Put your accounts in the order you like

1. Go to your Fidelity portfolio page and log in as usual.
2. Click the extension's icon in the Chrome toolbar. A small window will pop up.
3. Click **Detect groups**. The extension reads the account groups currently shown
   on the page and lists them in the pop-up.
4. Rearrange them however you like:
   - **Drag and drop** a group up or down, or
   - Use the **Up** and **Dn** buttons next to each group.
5. Click **Save & apply**.

Your accounts will now appear in your chosen order. Chrome remembers your order, so
it stays the same the next time you open Fidelity.

## Good to know

- **Your settings follow you.** If you're signed into Chrome on more than one
  computer, your saved order syncs across them automatically.
- **New accounts won't get lost.** If you open a new account later, it simply shows
  up after the groups you've already arranged. You can re-detect and reorder anytime.
- **Nothing leaves your browser.** The extension doesn't send your information
  anywhere. It only rearranges what's displayed on your screen.

## If something isn't working

- Make sure you're on the Fidelity portfolio page before clicking **Detect groups**.
- If no groups appear, refresh the Fidelity page and try **Detect groups** again.
- Fidelity occasionally updates the design of their website. When that happens, the
  extension may stop recognizing your accounts. If you're comfortable editing code
  (or know someone who is), the part that finds the accounts lives in
  `src/dom-selectors.js` and can be updated.

## License

This project is free and open source under the [MIT](LICENSE) license.
