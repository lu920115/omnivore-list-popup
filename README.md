# Omnivore List Popup Web Extension (Firefox & Chrome)

> [!NOTE]
> **Fork notice.** This is a community fork maintained at [lu920115/omnivore-list-popup](https://github.com/lu920115/omnivore-list-popup) that adds **self-hosted API support** while keeping the official Omnivore API as the default. All credit for the original extension goes to [herrherrmann](https://github.com/herrherrmann/). See [Changes in this fork](#changes-in-this-fork) below for details.

> [!WARNING]
> Omnivore is unfortunately [shutting down](https://blog.omnivore.app/p/details-on-omnivore-shutting-down) soon. I am currently looking into other platforms to migrate this extension to (and keep most or ideally all of the current features). Get in touch if you have specific ideas or requests. RIP, Omnivore.

Show a popup with a list of your [Omnivore](https://omnivore.app/) articles to quickly open or archive.

![Screenshot of the extension running in a browser](docs/screenshot.jpg)

## Changes in this fork

This fork keeps the original behavior unchanged by default but adds an option for users running their own Omnivore-compatible backend:

- **New setting "API source"** in the extension options:
  - **Official** (default) — uses `https://api-prod.omnivore.app/api/graphql`. Behaves exactly like upstream.
  - **Custom (self-hosted)** — uses the URL you configure in "Custom Omnivore API URL". Save is disabled until the URL is provided.
- `host_permissions` now also includes `https://*/*` so that requests can reach any self-hosted instance.
- No data migration is required: existing users continue on the official API after upgrading.

**Maintenance:** this fork tracks the upstream extension and only adds the self-hosted toggle plus the matching permission/UI plumbing. Bug reports specific to this fork should go to [lu920115/omnivore-list-popup/issues](https://github.com/lu920115/omnivore-list-popup/issues); reports applicable to the original extension should be sent upstream to [herrherrmann/omnivore-list-popup](https://github.com/herrherrmann/omnivore-list-popup/issues).

See [Configuring the self-hosted API](#configuring-the-self-hosted-api) below for how to point the extension at your own backend.

## Configuring the self-hosted API

If you run your own Omnivore-compatible backend, configure the extension like this:

1. Open the extension options page (extension icon → right-click → "Extension options", or via `chrome://extensions/` → "Extension options").
2. Under **⚠️ Advanced options → API source**, select **Custom (self-hosted)**. The "Custom Omnivore API URL" field will appear.
3. In **Custom Omnivore API URL**, enter the **full GraphQL endpoint** — *not just the host*. The path is required.
4. Click **Save**. (The Save button stays disabled until the URL is non-empty.)
5. Click the extension icon to open the popup. You should see your library load.

### URL format

The URL **must include the `/api/graphql` path**. A bare host like `https://your-host.example.com` (or with a port like `https://your-host.example.com:10444`) will not work — the request will hit the wrong path and fail.

| ❌ Wrong                                       | ✅ Correct                                                  |
| --------------------------------------------- | ---------------------------------------------------------- |
| `https://your-host.example.com`               | `https://your-host.example.com/api/graphql`                |
| `https://your-host.example.com:10444`         | `https://your-host.example.com:10444/api/graphql`          |
| `https://your-host.example.com/api/graphq1`   | `https://your-host.example.com/api/graphql` (lowercase L!) |

The official endpoint is `https://api-prod.omnivore.app/api/graphql` — follow the same path convention for your own deployment unless you've customized it.

### Things to check if it still doesn't work

- **CORS.** Your backend must allow requests from the extension's origin. The simplest config returns `Access-Control-Allow-Origin: *` plus `Access-Control-Allow-Headers: Authorization, Content-Type` and `Access-Control-Allow-Methods: POST, OPTIONS` for the GraphQL endpoint. If you reverse-proxy with nginx, add these via `add_header`.
- **HTTPS certificate.** Chrome rejects fetches to hosts with invalid / self-signed certs. Use a real cert (Let's Encrypt, ZeroSSL, your own CA already trusted by your OS).
- **Non-standard port.** Ports other than 443 are fine as long as the certificate is valid for the host and the port is reachable from your machine.
- **API key.** Your self-hosted backend may use a different format for the `Authorization` header than the upstream `Bearer`-less token. If your backend logs return 401, check what format it expects.
- **DevTools.** Right-click inside the popup → "Inspect" → Network tab. Re-open the popup, find the POST to your GraphQL endpoint. Check the status code and response body — it will usually tell you whether the issue is CORS, auth, or routing.

### Switching back to the official API

Open the options page, switch **API source** back to **Official**, click Save. The "Custom Omnivore API URL" field will be hidden and ignored.

## Installation & Usage

[![Get the Add-on for Firefox](docs/share-badge-firefox.png)](https://addons.mozilla.org/firefox/addon/omnivore-list-popup/)
[![Get the Add-on for Chrome](docs/share-badge-chrome.png)](https://chrome.google.com/webstore/detail/omnivore-list-popup/dnfckbihnohkfoaclfckbcebclmhleni)

1. Install the extension from the [Firefox Extensions page](https://addons.mozilla.org/firefox/addon/omnivore-list-popup/) or the [Chrome Web Store](https://chrome.google.com/webstore/detail/omnivore-list-popup/dnfckbihnohkfoaclfckbcebclmhleni).
2. Get an [Omnivore API Key](https://omnivore.app/settings/api) through your Omnivore Account.
3. Go into the extension’s settings and paste your Omnivore API key.
4. Launch the extension by clicking the new "Omnivore List Popup" button in your extension toolbar/dropdown.
5. Optional: Add the extension to your always-visible toolbar.

## Development Setup

1. Install the Node version defined in `.nvmrc` (e.g. with `nvm use`).
2. Install dependencies with `npm install`.

### Development Commands

- Run `npm run dev` to watch files for changes and start Firefox for debugging.
  - Run `TARGET=chrome npm run dev` to use Chrome
  - Run `TARGET=vivaldi npm run dev` to use Vivaldi
- Run `npm run format` to format the code with [Prettier](https://prettier.io/).
- Run `npm run lint` to lint the code with [ESLint](https://eslint.org/).
- Run `npm run build` (or `TARGET=chrome npm run build`) to generate the output files in `dist`.

## Releasing

1. Run `npm run create-releases` to generate the extension archives in the root directory.
2. Upload the Firefox release on https://addons.mozilla.org/developers/addon/omnivore-list-popup/
3. Upload the Chrome release on https://chrome.google.com/webstore/devconsole
4. Remove the locally-created files after uploading via `npm run clean`.

## Contributing

If you have ideas or issues, please get in touch! You can either use [GitHub issues](https://github.com/herrherrmann/omnivore-list-popup/issues) or contact [herrherrmann](https://github.com/herrherrmann/) directly.

## Todos & Ideas

- [x] Add pagination to browse beyond 10 items ([issue #9](https://github.com/herrherrmann/omnivore-list-popup/issues/9))
- [x] Add keyboard shortcuts for opening the popup and adding the current page to Omnivore
- [x] Improve generation of fallback images (sometimes broken or very low-contrast characters)
- [x] Cache API results for quicker load times
- [x] Indicate saving of new items when triggered via keyboard shortcut (e.g. via toolbar icon)
- [x] Add possibility to delete items (additionally to archiving)
- [ ] Edit article info (title, description, dates, etc.)
- [ ] Optionally load other sets like archived items (via saved searches dropdown?)
- [ ] Improve onboarding, e.g. make it possible to enter API key in popup
- [ ] Improve error handling
- [ ] Use Omnivore’s `savePage` API instead of `saveUrl` (to capture page content directly)
- [ ] Internationalization
- [ ] Cache list items locally for offline usage
- [ ] Highlight the popup button if the current page is added to Omnivore

## Acknowledgements

- Thanks to [herrherrmann](https://github.com/herrherrmann/) for the original [omnivore-list-popup](https://github.com/herrherrmann/omnivore-list-popup) extension this fork is based on.
- Thanks to the amazing [In My Pocket](https://inmypocketaddon.com/) extension for inspiring this project. 👏
- Thanks to the [Omnivore team](https://omnivore.app/) for the nice Pocket alternative and open API.
- Thanks to the [Lucide project](https://lucide.dev/) for the icon set.
