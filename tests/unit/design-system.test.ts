import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('flat design system', () => {
  const css = readFileSync(resolve(process.cwd(), 'app/assets/css/main.css'), 'utf8');

  it('does not use gradient backgrounds', () => {
    expect(css).not.toMatch(/(?:linear|radial)-gradient\(/);
  });

  it('does not use full-pill border radii', () => {
    expect(css).not.toContain('999px');
  });
});
