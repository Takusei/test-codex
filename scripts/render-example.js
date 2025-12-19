const fs = require('fs');
const path = require('path');
const sample = `---
title: ESG overview
---
# ESG Roadmap

- Establish baseline measurements
- Align stakeholders around priorities
- Launch quick wins in the next 90 days
---
## Carbon reduction

- Track energy consumption per site
- Automate offset reporting
- Share progress with transparent dashboards
---
## Social commitments

- Strengthen community partnerships
- Expand learning & development access
- Publish diversity metrics quarterly
`;
const OUTPUT_PATH = path.join(__dirname, '..', 'test-output.html');

const writeFailure = (message) => {
  fs.writeFileSync(OUTPUT_PATH, `${message}\n`);
  console.error(message);
  process.exit(1);
};

const run = async () => {
  const moduleOrDefault = await import('../src/slideRenderer.js')
    .then((mod) => mod.renderMarpSlides || mod.default?.renderMarpSlides)
    .catch((error) => {
      writeFailure(`Failed to load renderer: ${error.message}`);
      return null;
    });

  if (!moduleOrDefault) {
    return;
  }

  try {
    const html = moduleOrDefault(sample);
    fs.writeFileSync(OUTPUT_PATH, html);
    console.log(`Rendered sample deck saved to ${OUTPUT_PATH}`);
    console.log(html.substring(0, 300));
    console.log('\n... deck truncated for brevity ...');
  } catch (error) {
    writeFailure(`Failed to render sample deck: ${error.message}`);
  }
};

run();
