import { env, type WorkerEntrypoint } from 'cloudflare:workers';
import os from 'node:os';
import puppeteer from '@cloudflare/puppeteer';
import { DateTime } from 'luxon';
import Mustache from 'mustache';
import controller from './sources/controller';
import generateFeed from './sources/controller/feed';
import indexTemplate from './templates/index.mustache?raw';

const FileNames = {
  Json: 'controller.json' as const,
  Atom: 'controller.atom' as const,
};

export default {
  async scheduled() {
    const browser = await puppeteer.launch(env.BROWSER);

    const controllerReleases = await controller(browser);
    await env.BUCKET.put(FileNames.Json, JSON.stringify(controllerReleases), {
      httpMetadata: { contentType: 'application/json' },
    });
    await env.BUCKET.put(
      FileNames.Atom,
      await generateFeed(controllerReleases),
      {
        httpMetadata: { contentType: 'application/atom+xml' },
      },
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

    const files = Object.values(FileNames);

    const indexPage = Mustache.render(indexTemplate, {
      files,
      osInfo,
      generatedTime,
    });

    await env.BUCKET.put('index.html', indexPage, {
      httpMetadata: { contentType: 'text/html' },
    });
  },
} satisfies WorkerEntrypoint<Env>;
