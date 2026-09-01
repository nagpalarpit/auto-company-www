// Lists every blog post under blog/*/index.html and extracts the real
// per-post title + description for OG image generation.
//
// Deliberately only looks inside the <head>...</head> block of each file.
// At least one post (add-dynamic-og-images-any-site) has the literal
// strings "og:image" and a fake `content="https://yoursite.com/..."` value
// inside an HTML-escaped <pre><code> block in its *article body*, as a code
// example being discussed, not a real meta tag. Restricting the regex scan
// to the <head> section (and relying on the fact that body code samples are
// HTML-entity-escaped, so `<meta` in a code block is literally `&lt;meta`
// in the source) means that content can never be mistaken for the page's
// actual title/description.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const blogDir = path.resolve(process.cwd(), 'blog');

const SITE_SUFFIX = / — Auto Company\s*$/;

function tagFor(slug) {
  if (slug.startsWith('flatline-')) return 'Flatline';
  if (slug.startsWith('snapog-')) return 'SnapOG';
  if (slug.startsWith('og-image-action-')) return 'og-image-action';
  return 'Engineering';
}

function extractHead(html) {
  const match = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!match) throw new Error('no <head> block found');
  return match[1];
}

function extractTitle(head) {
  const match = head.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) throw new Error('no <title> found in head');
  return match[1].trim().replace(SITE_SUFFIX, '');
}

function extractDescription(head) {
  const match = head.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!match) throw new Error('no <meta name="description"> found in head');
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const slugs = readdirSync(blogDir).filter((entry) => {
  const full = path.join(blogDir, entry);
  return statSync(full).isDirectory() && statSync(path.join(full, 'index.html')).isFile();
});

slugs.sort();

const posts = slugs.map((slug) => {
  const html = readFileSync(path.join(blogDir, slug, 'index.html'), 'utf8');
  const head = extractHead(html);
  return {
    slug,
    title: extractTitle(head),
    description: extractDescription(head),
    tag: tagFor(slug),
  };
});

process.stdout.write(JSON.stringify(posts));
