import { useEffect } from 'react';

const SITE_URL = 'https://3mdrive.fr';
const DEFAULT_IMAGE = `${SITE_URL}/images/car-hero-toulouse.jpg`;
const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

function upsertMeta(key, value, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${key}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function absolutize(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export default function Seo({
  title,
  description,
  canonicalPath = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  robots,
  noindex = false,
}) {
  useEffect(() => {
    const canonicalUrl = absolutize(canonicalPath);
    const imageUrl = absolutize(image);
    const robotsContent = noindex ? 'noindex, nofollow' : (robots || DEFAULT_ROBOTS);

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robotsContent);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertLink('canonical', canonicalUrl);
  }, [title, description, canonicalPath, image, type, robots, noindex]);

  return null;
}
