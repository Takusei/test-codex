# Marpit slide rendering API

This repository exposes a tiny HTTP endpoint that turns Marp/Marpit-flavoured Markdown into a themed HTML slide deck. The layout is inspired by the KPMG ESG presentation linked in the prompt and is implemented as a Marpit theme.

## Usage

1. Install dependencies (Marpit is required):

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Send your Marp Markdown to the `/render` endpoint:

   ```bash
   curl -X POST http://localhost:3000/render \
     -H "Content-Type: application/json" \
     -d '{"markdown": "---\\ntitle: Demo\\n---\\n# Title\\n\\n- Point one\\n- Point two"}'
   ```

   The response contains an `html` string with the fully inlined deck rendered through Marpit using the bundled theme (`kpmg-esg`).

## Markdown expectations

- Separate slides with `---` on its own line.
- Front matter is supported and passed directly to Marpit.
- Any Marpit-compatible Markdown and directives can be used; the theme name is `kpmg-esg`.

## Previewing locally

Run the bundled example renderer to see a truncated deck in the console:

```bash
npm test
```

You can also pipe the rendered HTML into a file to open in a browser:

```bash
node -e "const { renderMarpSlides } = require('./src/slideRenderer'); console.log(renderMarpSlides('# Demo\\n\\n- Item'))" > deck.html
```
