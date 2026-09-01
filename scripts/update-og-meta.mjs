// Points every blog/<slug>/index.html's og:image and twitter:image meta
// tags at its own newly-generated image under assets/og/posts/<slug>.png,
// replacing the 4 generic shared placeholders (hub.png, flatline.png,
// snapog.png, og-image-action.png) every post previously reused.
//
// Only touches the literal <meta property="og:image" ...> and
// <meta name="twitter:image" ...> tags in <head>. The add-dynamic-og-images-any-site
// post has an HTML-escaped `&lt;meta property="og:image" ...&gt;` example inside
// a <pre><code> block in its article body — that's already a different string
// (entity-escaped, not a literal tag) so this regex-based replacement can't
// touch it, and it isn't touched.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const blogDir = path.resolve(process.cwd(), 'blog');
const BASE_URL = 'https://nagpalarpit.github.io/auto-company-www/assets/og/posts';

const slugs = readdirSync(blogDir).filter((entry) => {
  const full = path.join(blogDir, entry);
  return statSync(full).isDirectory() && statSync(path.join(full, 'index.html')).isFile();
});

let changed = 0;

for (const slug of slugs.sort()) {
  const file = path.join(blogDir, slug, 'index.html');
  const original = readFileSync(file, 'utf8');
  const newUrl = `${BASE_URL}/${slug}.png`;

  let updated = original.replace(
    /(<meta property="og:image" content=")[^"]*(")/,
    `$1${newUrl}$2`
  );
  updated = updated.replace(
    /(<meta name="twitter:image" content=")[^"]*(")/,
    `$1${newUrl}$2`
  );

  if (updated !== original) {
    writeFileSync(file, updated);
    changed++;
    console.log(`updated ${slug}`);
  } else {
    console.log(`WARNING: no change for ${slug}`);
  }
}

console.log(`\n${changed}/${slugs.length} posts updated`);
