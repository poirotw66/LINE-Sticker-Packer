# LINE Sticker Packer

Pack and export LINE sticker sets for [LINE Creators Market](https://creator.line.me/). Upload images, set order, choose main/tab images, and download a ZIP ready for submission. Optional AI-generated title and description via Google Gemini.

## Prerequisites

- Node.js 18+

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) For AI metadata generation, add your Gemini API key:
   - Copy [.env.example](.env.example) to `.env` or `.env.local`
   - Set `GEMINI_API_KEY=` to your key from [Google AI Studio](https://aistudio.google.com/apikey)
   - Or leave it unset and add the key later in the app **Settings** (stored in browser only)

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3001

## Build & preview

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

- The repo includes a [GitHub Actions workflow](.github/workflows/deploy-pages.yml) that builds and deploys on push to `main`.
- In the repository **Settings → Pages**, set **Source** to **GitHub Actions**.
- After deployment, the app is available at `https://<username>.github.io/LINE-Sticker-Packer/`.
- On the deployed site, add your Gemini API key via the **Settings** (gear) button; it is stored only in your browser (localStorage).

## License

Private.
