(function downloadYouTubePlaylistCsv() {
  try {
    const escapeCsv = s => {
      if (s === null || s === undefined) return '""';
      const str = String(s).replace(/"/g, '""');
      return `"${str}"`;
    };

    const getText = (root, sel) => {
      const el = root.querySelector(sel);
      return el ? el.textContent.trim() : '';
    };

    const items = Array.from(document.querySelectorAll('ytd-playlist-video-renderer'));
    if (!items.length) {
      console.warn('No playlist items found. Make sure items are loaded in the page.');
      return;
    }

    const header = [
      'index',
      'title',
      'videoUrl',
      'channelName',
      'channelUrl',
      'views',
      'age',
      'duration',
      'watchedState',
      'thumbnailUrl'
    ];
    const rows = [header.map(escapeCsv).join(',')];

    items.forEach(item => {
      const index = getText(item, '#index');

      const aTitle = item.querySelector('a#video-title') || item.querySelector('ytd-thumbnail a');
      const title = aTitle ? aTitle.textContent.trim() : '';
      const rawHref = aTitle ? (aTitle.getAttribute('href') || aTitle.href || '') : '';
      const videoUrl = rawHref ? (new URL(rawHref, location.href)).href : '';

      const channelA = item.querySelector('ytd-channel-name a');
      const channelName = channelA ? channelA.textContent.trim() : '';
      const channelUrl = channelA ? (new URL(channelA.getAttribute('href') || channelA.href, location.href)).href : '';

      // views and age
      let views = '';
      let age = '';
      const infoSpans = Array.from(item.querySelectorAll('yt-formatted-string#video-info > span'))
        .map(s => s.textContent.trim())
        .filter(Boolean);
      if (infoSpans.length >= 1) views = infoSpans[0] || '';
      if (infoSpans.length >= 2) age = infoSpans[infoSpans.length - 1] || '';

      // duration
      const duration = getText(item, '.yt-badge-shape__text') ||
                       getText(item, 'ytd-thumbnail-overlay-time-status-renderer .yt-badge-shape__text') || '';

      // watched state or progress
      let watchedState = '';
      const playbackBadge = item.querySelector('ytd-thumbnail-overlay-playback-status-renderer');
      if (playbackBadge && playbackBadge.textContent.trim()) {
        watchedState = playbackBadge.textContent.trim();
      } else if (item.querySelector('ytd-thumbnail-overlay-now-playing-renderer')) {
        watchedState = 'Now playing';
      } else {
        const progress = item.querySelector('#progress');
        const w = progress?.style?.width || '';
        if (w) watchedState = `progress:${w}`;
      }

      // thumbnail
      const thumb = item.querySelector('ytd-thumbnail img');
      const thumbnailUrl = thumb ? (thumb.getAttribute('src') || thumb.src || '') : '';

      const row = [
        index, title, videoUrl, channelName, channelUrl, views, age, duration, watchedState, thumbnailUrl
      ].map(escapeCsv).join(',');
      rows.push(row);
    });

    const csv = rows.join('\n');
    // Add BOM so Excel detects UTF-8
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `youtube_playlist_export_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // revoke after a short delay to ensure download started
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    console.log('CSV download started:', a.download);
  } catch (err) {
    console.error('Error exporting playlist to CSV', err);
  }
})();
