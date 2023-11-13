export type ReleaseType = 'software' | 'hardware' | 'unknown';

export interface Release {
  version: string;
  summary: string;
  body: string;
  body_html: string;
  date: string;
  link: string;
  platform: string | null;
  type: ReleaseType;
}

export interface ReleaseListItem {
  title: string;
  summary: string;
  link: string;
}

export type Platform = 'windows' | 'linux' | 'unknown';
