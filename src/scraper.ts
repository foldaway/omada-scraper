import 'ts-polyfill/lib/es2019-array';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import pug from 'pug';
import os from 'node:os';
import path from 'node:path';

import * as Sentry from '@sentry/node';

import fs from 'node:fs';
import controller from './sources/controller';
import generateFeed from './sources/controller/feed';
import { DateTime } from 'luxon';

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

  // Generate index.html

  const now = DateTime.now();

  const generatedTime = {
    isoString: now.toISO(),
    displayText: now.toLocaleString(DateTime.DATETIME_FULL),
  };

  const osInfo = {
    platform: os.platform(),
    arch: os.arch(),
  };

  const files = fs.readdirSync('output');

  const indexPage = pug.renderFile(
    path.join(__dirname, 'templates/index.pug'),
    {
      files,
      osInfo,
      generatedTime,
    }
  );

  fs.writeFileSync('output/index.html', indexPage);
}

scraper()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    Sentry?.captureException(e);
    process.exit(1);
  });
