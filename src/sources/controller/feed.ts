import type { Element, Root } from 'xast';
import { toXml } from 'xast-util-to-xml';
import type { Release } from './types';

function generateEntry(release: Release): Element {
  return {
    type: 'element',
    name: 'entry',
    attributes: {},
    children: [
      {
        type: 'element',
        name: 'id',
        attributes: {},
        children: [
          {
            type: 'text',
            value: release.link,
          },
        ],
      },
      {
        type: 'element',
        name: 'title',
        attributes: {},
        children: [
          {
            type: 'text',
            value: `v${release.version}${
              release.platform !== 'unknown' ? ` for ${release.platform}` : ''
            }`,
          },
        ],
      },
      {
        type: 'element',
        name: 'content',
        attributes: {
          type: 'html',
        },
        children: [
          {
            type: 'text',
            value: release.body_html,
          },
        ],
      },
      {
        type: 'element',
        name: 'updated',
        attributes: {},
        children: [
          {
            type: 'text',
            value: release.date,
          },
        ],
      },
      {
        type: 'element',
        name: 'link',
        attributes: {
          href: release.link,
        },
        children: [],
      },
      {
        type: 'element',
        name: 'category',
        attributes: {
          term: release.platform,
        },
        children: [],
      },
      {
        type: 'element',
        name: 'category',
        attributes: {
          term: release.type,
        },
        children: [],
      },
      {
        type: 'element',
        name: 'category',
        attributes: {
          term: 'Omada Controller',
        },
        children: [],
      },
      {
        type: 'element',
        name: 'author',
        attributes: {},
        children: [
          {
            type: 'element',
            name: 'name',
            attributes: {},
            children: [
              {
                type: 'text',
                value: 'TP-Link',
              },
            ],
          },
        ],
      },
    ],
  };
}

export default async function generateFeed(
  releases: Release[],
): Promise<string> {
  const root: Root = {
    type: 'root',
    children: [
      {
        type: 'instruction',
        name: 'xml',
        value: 'version="1.0" encoding="utf-8"',
      },
      {
        type: 'element',
        name: 'feed',
        attributes: {
          xmlns: 'http://www.w3.org/2005/Atom',
        },
        children: [
          {
            type: 'element',
            name: 'id',
            attributes: {},
            children: [
              {
                type: 'text',
                value:
                  'https://community.tp-link.com/en/business/forum/582?tagId=684,854',
              },
            ],
          },
          {
            type: 'element',
            name: 'title',
            attributes: {},
            children: [
              {
                type: 'text',
                value: 'Omada Release Changelogs',
              },
            ],
          },
          {
            type: 'element',
            name: 'updated',
            attributes: {},
            children: [
              {
                type: 'text',
                value: releases[0]?.date ?? new Date().toISOString(),
              },
            ],
          },
          {
            type: 'element',
            name: 'link',
            attributes: {
              href: 'https://community.tp-link.com/en/business/forum/582?tagId=684,854',
            },
            children: [],
          },
          {
            type: 'element',
            name: 'link',
            attributes: {
              rel: 'self',
              href: 'https://fourthclasshonours.github.io/omada-scraper/controller.atom',
            },
            children: [],
          },
          ...releases.map(generateEntry),
        ],
      },
    ],
  };

  return toXml(root);
}
