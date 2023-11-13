import 'ts-polyfill/lib/es2019-array';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import * as Sentry from '@sentry/node';

import fs from 'fs';
import controller from './sources/controller';
import generateFeed from './sources/controller/feed';

const { NODE_ENV, SENTRY_DSN } = process.env;

const isProduction = NODE_ENV === 'production';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
  });
}

try {
  fs.mkdirSync('traces');
} catch (e) {}

try {
  fs.mkdirSync('output');
} catch (e) {}

async function scraper() {
  const browser = await puppeteer.use(StealthPlugin()).launch({
    headless: isProduction ? 'new' : false,
    defaultViewport: null,
    args: isProduction ? ['--no-sandbox'] : [],
  });

  const controllerReleases = await controller(browser);
  fs.writeFileSync(
    'output/controller.json',
    JSON.stringify(controllerReleases),
    {
      encoding: 'utf8',
    }
  );
  fs.writeFileSync(
    'output/controller.atom',
    await generateFeed(controllerReleases),
    {
      encoding: 'utf8',
    }
  );

  await browser.close();
}

scraper()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    Sentry?.captureException(e);
    process.exit(1);
  });
