/**
 * Wraps HTML content with a script that mutes all audio/video elements
 * until user interacts with the iframe
 */
export function wrapHtmlWithMute(html: string): string {
  const muteScript = `
<script>
(function() {
  let isMuted = true;
  let hasInteracted = false;

  // Mute all existing media elements
  function muteAllMedia() {
    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');

    videos.forEach(video => {
      if (isMuted) {
        video.muted = true;
        video.volume = 0;
      }
    });

    audios.forEach(audio => {
      if (isMuted) {
        audio.muted = true;
        audio.volume = 0;
      }
    });
  }

  // Unmute all media on first interaction
  function unmute() {
    if (hasInteracted) return;
    hasInteracted = true;
    isMuted = false;

    const videos = document.querySelectorAll('video');
    const audios = document.querySelectorAll('audio');

    videos.forEach(video => {
      video.muted = false;
      video.volume = 1;
    });

    audios.forEach(audio => {
      audio.muted = false;
      audio.volume = 1;
    });
  }

  // Mute on load
  muteAllMedia();

  // Watch for dynamically added media elements
  const observer = new MutationObserver((mutations) => {
    if (isMuted) {
      muteAllMedia();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Unmute on first user interaction
  ['click', 'touchstart', 'keydown'].forEach(eventType => {
    document.addEventListener(eventType, unmute, { once: true, capture: true });
  });

  // Also handle when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', muteAllMedia);
  } else {
    muteAllMedia();
  }
})();
</script>
`;

  // Insert the script before </head> or at the beginning of <body>
  if (html.includes('</head>')) {
    return html.replace('</head>', `${muteScript}</head>`);
  } else if (html.includes('<body')) {
    return html.replace(/<body([^>]*)>/, `<body$1>${muteScript}`);
  } else {
    // If no head or body, prepend to the HTML
    return muteScript + html;
  }
}
