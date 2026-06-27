import { describe, expect, it } from 'vitest';
import { simplifyReleaseHtml } from './index';

describe('simplifyReleaseHtml', () => {
  it('removes presentation markup while keeping release content', async () => {
    const simplifiedHtml = await simplifyReleaseHtml(`
      <!-- tracking marker -->
      <p class="intro" style="font-family: Arial;">
        <span style="font-size: 16px;">Network</span>
        <strong data-v-123="">Controller</strong>
      </p>
      <p>&nbsp;</p>
      <script>alert("unused")</script>
      <a
        class="ga-click"
        data-vars-event-category="Release"
        href="https://example.com/release-notes"
        style="color: #096;"
        target="_blank"
      >
        release notes
      </a>
      <img
        alt="release screenshot"
        data-source="forum"
        height="185"
        src="https://example.com/release.png"
        style="width: 884px;"
        width="884"
      >
    `);

    expect(simplifiedHtml).toContain('Network');
    expect(simplifiedHtml).toContain('<strong>Controller</strong>');
    expect(simplifiedHtml).toContain(
      '<a href="https://example.com/release-notes">',
    );
    expect(simplifiedHtml).toContain('release notes');
    expect(simplifiedHtml).toContain('alt="release screenshot"');
    expect(simplifiedHtml).toContain('src="https://example.com/release.png"');
    expect(simplifiedHtml).not.toContain('style=');
    expect(simplifiedHtml).not.toContain('class=');
    expect(simplifiedHtml).not.toContain('data-');
    expect(simplifiedHtml).not.toContain('target=');
    expect(simplifiedHtml).not.toContain('<span');
    expect(simplifiedHtml).not.toContain('<script');
    expect(simplifiedHtml).not.toContain('tracking marker');
    expect(simplifiedHtml).not.toContain('<p>&nbsp;</p>');
    expect(simplifiedHtml).not.toContain('width=');
    expect(simplifiedHtml).not.toContain('height=');
  });
});
