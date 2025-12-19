const { renderMarpSlides } = require('../src/slideRenderer');

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

try {
  const html = renderMarpSlides(sample);
  console.log(html.substring(0, 300));
  console.log('\n... deck truncated for brevity ...');
} catch (error) {
  console.error('Failed to render sample deck:', error.message);
  process.exit(1);
}
