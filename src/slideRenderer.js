const { Marpit } = require('@marp-team/marpit');

const theme = `
/* @theme kpmg-esg */

:root {
  --kpmg-navy: #002855;
  --kpmg-blue: #003b8e;
  --kpmg-cyan: #0091da;
  --kpmg-ink: #0f1a2b;
  --kpmg-gray: #5b6670;
  --kpmg-border: #e4e7eb;
  --kpmg-card: #ffffff;
  --kpmg-radius: 18px;
  --kpmg-padding: 40px;
  font-size: 18px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

section {
  background: var(--kpmg-card);
  color: var(--kpmg-ink);
  border-radius: var(--kpmg-radius);
  padding: var(--kpmg-padding);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.18);
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 720px;
  border: 1px solid rgba(0, 40, 85, 0.06);
  position: relative;
  overflow: hidden;
}

section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 59, 142, 0.16) 0%, rgba(0, 145, 218, 0.08) 60%, transparent 70%);
  pointer-events: none;
}

section::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 40, 85, 0.08) 0%, transparent 35%);
  mix-blend-mode: multiply;
  pointer-events: none;
}

header {
  position: relative;
  z-index: 1;
  margin: -var(--kpmg-padding);
  margin-bottom: 24px;
  padding: 18px var(--kpmg-padding);
  background: linear-gradient(90deg, var(--kpmg-navy) 0%, var(--kpmg-blue) 60%, var(--kpmg-cyan) 100%);
  color: white;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.9em;
}

h1, h2, h3 {
  color: var(--kpmg-navy);
  margin: 0 0 12px 0;
}

p {
  margin: 0 0 16px 0;
  line-height: 1.6;
}

ul, ol {
  margin: 0 0 12px 0;
  padding-left: 1.1em;
  color: var(--kpmg-ink);
}

li {
  margin: 6px 0;
}

strong {
  color: var(--kpmg-blue);
}

footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--kpmg-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--kpmg-gray);
  font-size: 0.9em;
}

footer .badge {
  background: var(--kpmg-cyan);
  color: white;
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

a[href] {
  color: var(--kpmg-blue);
  text-decoration: none;
  border-bottom: 1px solid rgba(0, 59, 142, 0.25);
}

a[href]:hover {
  color: var(--kpmg-cyan);
  border-bottom-color: rgba(0, 145, 218, 0.4);
}
`;

const marpit = new Marpit({ inlineSVG: true });
marpit.themeSet.add(theme);

function renderMarpSlides(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Markdown content is required');
  }

  const { html, css } = marpit.render(markdown, { theme: 'kpmg-esg' });

  // Marpit already injects the compiled theme CSS, but add the raw theme CSS as a
  // fallback to ensure the intended layout still appears even if Marpit strips
  // theme metadata. This keeps the KPMG-inspired look visible in exported HTML.
  const combinedCss = `${css}\n${theme}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated Marp Deck</title>
  <style>${combinedCss}</style>
</head>
<body style="background:#f4f6f8; padding:24px;">
  ${html}
</body>
</html>`;
}

module.exports = { renderMarpSlides };
