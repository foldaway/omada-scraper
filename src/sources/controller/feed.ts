import { Element, Root } from 'xast';
import { Release } from './types';

function generateEntry(release: Release): Element {
  return {
    type: 'element',
    name: 'entry',
    children: [
      {
        type: 'element',
        name: 'id',
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
        children: [
          {
            type: 'element',
            name: 'name',
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
  releases: Release[]
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
              href:
                'https://community.tp-link.com/en/business/forum/582?tagId=684,854',
            },
            children: [],
          },
          {
            type: 'element',
            name: 'link',
            attributes: {
              rel: 'self',
              href:
                'https://fourthclasshonours.github.io/omada-scraper/controller.atom',
            },
            children: [],
          },
          ...releases.map(generateEntry),
        ],
      },
    ],
  };

  const { toXml } = await import('xast-util-to-xml');

  return toXml(root);
}
