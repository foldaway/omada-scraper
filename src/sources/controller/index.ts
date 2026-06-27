import type { Browser } from '@cloudflare/puppeteer';
import TurndownService from 'turndown';
import type { Platform, Release, ReleaseListItem, ReleaseType } from './types';

const CONSOLIDATED_THREAD_URL =
  'https://community.tp-link.com/en/business/forum/topic/245226?moduleId=582&sortDir=DESC&page=1';

const REGEX_TITLE_RELEASE_DATE =
  /(?:Released|Updated|Update|Release|Closed) on ([A-Za-z0-9\s,]+)/i;

const REGEX_TITLE_VERSION = [
  /Network_Application_V([0-9.x]+(?:\sBeta)?)/i,
  /Controller[_\s]+V([0-9.x]+(?:\sBeta)?)/i,
  /Controllers?\s+V([0-9.x]+(?:\sBeta)?)/i,
  /Controller\s+([0-9.x]+(?:\sBeta)?)/i,
];

const ALLOWED_HTML_ATTRIBUTES = new Set([
  'alt',
  'colspan',
  'href',
  'rowspan',
  'src',
  'title',
]);

const SELECTOR_REPLY_CONTENT = '#reply-area .reply-content .content-wrap';
const SELECTOR_TOPIC_BODY = '.topic-content .content-wrap, .topic-content';

function normalizeTopicUrl(link: string): string {
  const url = new URL(link, CONSOLIDATED_THREAD_URL);
  return `${url.origin}${url.pathname}`;
}

function getReleaseType(text: string): ReleaseType {
  const normalizedText = text.trim().toLowerCase();

  if (
    normalizedText.includes('hardware') ||
    /\b(?:oc\d+|er\d+)/i.test(normalizedText)
  ) {
    return 'hardware';
  }

  if (
    normalizedText.includes('software') ||
    normalizedText.includes('network_application') ||
    normalizedText.includes('network application') ||
    normalizedText.includes('sdn controller')
  ) {
    return 'software';
  }

  return 'unknown';
}

function getPlatform(text: string): Platform {
  const normalizedText = text.trim().toLowerCase();

  if (normalizedText.includes('windows')) {
    return 'windows';
  }

  if (normalizedText.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

function parseDate(text: string) {
  const parsedDate = Date.parse(text);

  if (!Number.isNaN(parsedDate)) {
    return new Date(text).toISOString();
  }

  const textPatched = text.replace(/(\d+)(?:st|nd|rd|th)/, (_match, p1) => {
    return p1;
  });

  return new Date(textPatched).toISOString();
}

function parseVersion(text: string): string | null {
  for (const regex of REGEX_TITLE_VERSION) {
    const matches = text.match(regex);

    if (matches != null && matches.length > 1) {
      return matches[1];
    }
  }

  return null;
}

export async function simplifyReleaseHtml(html: string): Promise<string> {
  const rewrittenHtml = await new HTMLRewriter()
    .onDocument({
      comments(comment) {
        comment.remove();
      },
    })
    .on('script, style, iframe, noscript, form, input, button', {
      element(element) {
        element.remove();
      },
    })
    .on('span, font', {
      element(element) {
        element.removeAndKeepContent();
      },
    })
    .on('*', {
      comments(comment) {
        comment.remove();
      },
      element(element) {
        const attributeNames = Array.from(element.attributes, ([name]) => name);

        for (const name of attributeNames) {
          if (!ALLOWED_HTML_ATTRIBUTES.has(name.toLowerCase())) {
            element.removeAttribute(name);
          }
        }
      },
    })
    .transform(
      new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    )
    .text();

  return rewrittenHtml.replace(/<p>(?:\s|&nbsp;|\u00a0)*<\/p>/gi, '').trim();
}

export default async function controller(browser: Browser): Promise<Release[]> {
  const turndownService = new TurndownService();

  const page = await browser.newPage();
  await page.goto(CONSOLIDATED_THREAD_URL);

  const releaseListItems = await page.evaluate((selectorReplyContent) => {
    const results: ReleaseListItem[] = [];
    const linksSeen = new Set<string>();

    const releaseUpdateElements = Array.from(
      document.querySelectorAll(selectorReplyContent),
    );

    for (const releaseUpdateElement of releaseUpdateElements) {
      const releaseLinkElements = Array.from(
        releaseUpdateElement.querySelectorAll<HTMLAnchorElement>(
          'a[href*="/en/business/forum/topic/"]',
        ),
      );

      for (const releaseLinkElement of releaseLinkElements) {
        const title = releaseLinkElement.textContent?.trim() ?? null;
        const link = releaseLinkElement.href;
        const summary = releaseUpdateElement.textContent?.trim() ?? title;

        if (
          title == null ||
          !title.match(/omada|controller/i) ||
          !title.match(/released|updated|update|release|closed/i)
        ) {
          continue;
        }

        const normalizedLink = new URL(link).pathname;

        if (linksSeen.has(normalizedLink)) {
          continue;
        }

        linksSeen.add(normalizedLink);

        results.push({
          title,
          link,
          summary,
        });
      }
    }

    return results;
  }, SELECTOR_REPLY_CONTENT);

  const releases: Release[] = [];

  for (const releaseListItem of releaseListItems) {
    const { title, summary, link } = releaseListItem;

    const releaseDateMatches = title.match(REGEX_TITLE_RELEASE_DATE);

    if (releaseDateMatches == null || releaseDateMatches.length <= 1) {
      console.error(`could not match release date for '${title}'`);
      continue;
    }

    const version = parseVersion(title);

    if (version == null) {
      console.error(`could not match controller version for '${title}'`);
      continue;
    }

    console.error(`working on '${title}'`);

    const normalizedLink = normalizeTopicUrl(link);

    await page.goto(normalizedLink);

    const rawPostBody = await page.evaluate((selectorTopicBody) => {
      return document.querySelector(selectorTopicBody).innerHTML;
    }, SELECTOR_TOPIC_BODY);
    const postBody = await simplifyReleaseHtml(rawPostBody);

    const release: Release = {
      body: turndownService.turndown(postBody),
      body_html: postBody,
      link: normalizedLink,
      summary,
      type: getReleaseType(title),
      version,
      platform: getPlatform(title),
      date: parseDate(releaseDateMatches[1]),
    };

    releases.push(release);

    await new Promise<void>((resolve) => {
      const waitTime = Math.floor(Math.random() * 10000) + 1;
      console.log('waiting for', waitTime, 'ms');
      setTimeout(resolve, waitTime);
    });
  }

  return releases;
}
