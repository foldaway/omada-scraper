import { Browser } from 'puppeteer';
import { Release, ReleaseListItem, ReleaseType } from './types';
import TurndownService from 'turndown';

const REGEX_TITLE_CONTROLLER = /Omada (\w+) Controller_V([0-9.]+)[_|\s]?(\w+)?/i;
const REGEX_TITLE_RELEASE_DATE = /(?:Released|Updated) on ([A-Za-z0-9\s,]+)/i;

function getReleaseType(text: string): ReleaseType {
  switch (text.trim().toLowerCase()) {
    case 'sdn':
    case 'software': {
      return 'software';
    }
    case 'hardware': {
      return 'hardware';
    }
    default: {
      return 'unknown';
    }
  }
}

function parseDate(text: string) {
  const parsedDate = Date.parse(text);

  if (!isNaN(parsedDate)) {
    return new Date(text).toISOString();
  }

  const textPatched = text.replace(/(\d+)(?:st|nd|rd|th)/, (match, p1) => {
    return p1;
  });

  return new Date(textPatched).toISOString();
}

export default async function controller(browser: Browser): Promise<Release[]> {
  const turndownService = new TurndownService();

  const page = await browser.newPage();
  await page.goto(
    'https://community.tp-link.com/en/business/forum/582?tagId=684,854'
  );

  const releaseListItems = await page.evaluate(() => {
    const results: ReleaseListItem[] = [];

    const topicListItemElements = Array.from(
      document.querySelectorAll('.topic-list .item-wrap')
    );

    for (const topicListItemElement of topicListItemElements) {
      const title =
        topicListItemElement.querySelector('.title-wrap a')?.textContent ??
        null;

      const link =
        // @ts-ignore
        topicListItemElement.querySelector('.title-wrap a')?.href ?? null;

      const summary =
        topicListItemElement.querySelector('.text-wrap')?.textContent ?? null;

      if (title == null || link == null || summary == null) {
        continue;
      }

      results.push({
        title,
        link,
        summary,
      });
    }

    return results;
  });

  const releases: Release[] = [];

  for (const releaseListItem of releaseListItems) {
    const { title, summary, link } = releaseListItem;

    const releaseDateMatches = title.match(REGEX_TITLE_RELEASE_DATE);

    if (releaseDateMatches == null || releaseDateMatches.length <= 1) {
      console.error(`could not match release date for '${title}'`);
      continue;
    }

    const controllerMatches = title.match(REGEX_TITLE_CONTROLLER);

    if (controllerMatches == null || controllerMatches.length < 3) {
      continue;
    }

    console.error(`working on '${title}'`);

    await page.goto(link);

    const postBody = await page.evaluate(() => {
      return document.querySelector('.topic-content').innerHTML;
    });

    const release: Release = {
      body: turndownService.turndown(postBody),
      body_html: postBody,
      link,
      summary,
      type: getReleaseType(controllerMatches[1]),
      version: controllerMatches[2],
      platform: controllerMatches[3] ?? null,
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
