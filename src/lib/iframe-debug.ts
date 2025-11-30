/**
 * Wraps HTML content with error capture script for debugging in iframe.
 * Captures: JS errors, resource load errors, console output, unhandled rejections.
 */
export function wrapHtmlWithErrorCapture(html: string): string {
  const errorCaptureScript = `
<script>
(function() {
  var errors = [];
  var logs = [];

  // 1. Capture ALL errors (including SyntaxError in other scripts)
  window.onerror = function(message, source, line, col, error) {
    var errData = {
      type: 'error',
      category: error && error.name ? error.name : 'Error',
      message: message,
      line: line,
      column: col,
      stack: error && error.stack ? error.stack : null,
      source: source,
      timestamp: Date.now()
    };
    errors.push(errData);
    window.parent.postMessage({ channel: 'iframe-debug', payload: errData }, '*');
    return false;
  };

  // 2. Unhandled Promise rejections
  window.onunhandledrejection = function(event) {
    var errData = {
      type: 'error',
      category: 'UnhandledPromiseRejection',
      message: String(event.reason),
      stack: event.reason && event.reason.stack ? event.reason.stack : null,
      timestamp: Date.now()
    };
    errors.push(errData);
    window.parent.postMessage({ channel: 'iframe-debug', payload: errData }, '*');
  };

  // 3. Resource load errors (scripts, images, CSS)
  window.addEventListener('error', function(event) {
    if (event.target !== window && event.target.tagName) {
      var errData = {
        type: 'resource-error',
        category: 'ResourceLoadError',
        message: 'Failed to load: ' + (event.target.src || event.target.href || 'unknown'),
        tagName: event.target.tagName,
        timestamp: Date.now()
      };
      errors.push(errData);
      window.parent.postMessage({ channel: 'iframe-debug', payload: errData }, '*');
    }
  }, true);

  // 4. Console interception
  ['log', 'warn', 'error', 'info', 'debug'].forEach(function(level) {
    var original = console[level];
    console[level] = function() {
      var args = Array.prototype.slice.call(arguments).map(function(arg) {
        try {
          if (arg instanceof Error) {
            return { __error: true, message: arg.message, stack: arg.stack, name: arg.name };
          }
          if (typeof arg === 'object' && arg !== null) {
            return JSON.parse(JSON.stringify(arg));
          }
          return arg;
        } catch(e) {
          return String(arg);
        }
      });

      var logData = {
        type: 'console',
        level: level,
        args: args,
        timestamp: Date.now()
      };
      logs.push(logData);
      window.parent.postMessage({ channel: 'iframe-debug', payload: logData }, '*');
      original.apply(console, arguments);
    };
  });

  // 5. Notify parent when iframe is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.parent.postMessage({
        channel: 'iframe-debug',
        payload: { type: 'ready', errorsCount: errors.length }
      }, '*');
    });
  } else {
    window.parent.postMessage({
      channel: 'iframe-debug',
      payload: { type: 'ready', errorsCount: errors.length }
    }, '*');
  }

  // 6. API for parent to request all errors
  window.addEventListener('message', function(event) {
    if (event.data && event.data.channel === 'iframe-command') {
      if (event.data.command === 'getErrors') {
        window.parent.postMessage({
          channel: 'iframe-debug',
          payload: { type: 'all-errors', errors: errors, logs: logs }
        }, '*');
      } else if (event.data.command === 'clear') {
        errors = [];
        logs = [];
      }
    }
  });
})();
</script>`;

  // Insert at the VERY BEGINNING to catch errors in other scripts
  const trimmedHtml = html.trim();

  // Check if it's already a full HTML document
  if (trimmedHtml.toLowerCase().includes('<!doctype') || trimmedHtml.toLowerCase().startsWith('<html')) {
    if (trimmedHtml.includes('<head>')) {
      return trimmedHtml.replace(/<head>/i, '<head>' + errorCaptureScript);
    }
    if (trimmedHtml.includes('<html>')) {
      return trimmedHtml.replace(/<html>/i, '<html><head>' + errorCaptureScript + '</head>');
    }
    if (trimmedHtml.toLowerCase().includes('<html')) {
      // Handle <html lang="en"> etc
      return trimmedHtml.replace(/<html[^>]*>/i, (match) => match + '<head>' + errorCaptureScript + '</head>');
    }
  }

  // Wrap fragment in full HTML structure
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${errorCaptureScript}
</head>
<body>
${trimmedHtml}
</body>
</html>`;
}

/**
 * Sends a command to the iframe
 */
export function sendIframeCommand(
  iframe: HTMLIFrameElement | null,
  command: 'getErrors' | 'clear'
): void {
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage(
      { channel: 'iframe-command', command },
      '*'
    );
  }
}
