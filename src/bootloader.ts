
export type BootloaderScriptOptions = {
  compact?: boolean
  loadOnInit?: boolean
}

const resolveCacheKey = (styleId: string, versionOrCacheKey: string): string => {
  styleId = styleId || "fwkui";
  versionOrCacheKey = versionOrCacheKey || "v1";
  return `${styleId}_cache_${versionOrCacheKey}`;
}

export const getBootloaderScript = (
  styleIdInput: string = 'fwkui',
  version: string = 'v1',
  options?: BootloaderScriptOptions,
) => {
  const styleIdValue = String(styleIdInput || '').trim() || 'fwkui'
  const cacheKeyValue = resolveCacheKey(styleIdValue, version)
  const loadOnInitValue = options?.loadOnInit ?? false
  const styleId = JSON.stringify(styleIdValue)
  const cacheKey = JSON.stringify(cacheKeyValue)
  const loadOnInit = JSON.stringify(loadOnInitValue)

  const script = `
(async function () {
  function canUseCacheRuntime() {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      var probeKey = '__xcss_cache_probe__';
      localStorage.setItem(probeKey, '1');
      localStorage.removeItem(probeKey);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function decompressLZW(compressed) {
    if (!compressed) return '';
    var dictionary = {};
    var dictSize = 256;
    var i;
    for (i = 0; i < 256; i++) dictionary[i] = String.fromCharCode(i);
    var codes = compressed.split('').map(function (ch) { return ch.charCodeAt(0); });
    var previous = codes[0];
    var phrase = dictionary[previous] || '';
    var result = phrase;
    for (i = 1; i < codes.length; i++) {
      var current = codes[i];
      var entry = dictionary[current];
      if (!entry) entry = current === dictSize ? phrase + phrase[0] : '';
      result += entry;
      dictionary[dictSize++] = phrase + entry[0];
      phrase = entry;
    }
    return result;
  }

  function canUseStream() {
    return (
      typeof DecompressionStream !== 'undefined' &&
      typeof Blob !== 'undefined' &&
      typeof Response !== 'undefined'
    );
  }

  function base64ToBytes(base64) {
    if (typeof atob === 'function') {
      var binary = atob(base64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    throw new Error('No base64 decoder');
  }

  async function decompressDeflateRawBase64(payload) {
    if (!canUseStream()) return null;
    try {
      var bytes = base64ToBytes(payload);
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(stream).text();
    } catch (_error) {
      return null;
    }
  }

  async function parseCache(raw) {
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.__xcss_cache_v === 3 &&
        parsed.compressed === true &&
        parsed.algorithm === 'deflate-raw' &&
        parsed.encoding === 'base64' &&
        typeof parsed.payload === 'string'
      ) {
        var expandedStream = await decompressDeflateRawBase64(parsed.payload);
        if (!expandedStream) return null;
        parsed = JSON.parse(expandedStream);
      } else if (parsed && parsed.__xcss_cache_v === 2 && parsed.compressed === true && typeof parsed.payload === 'string') {
        var expanded = decompressLZW(parsed.payload);
        if (!expanded) return null;
        parsed = JSON.parse(expanded);
      }
      if (!parsed || !parsed.cssText) return null;
      return parsed;
    } catch (_error) {
      return null;
    }
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (!${loadOnInit}) return;
    if (!canUseCacheRuntime()) return;

    var styleId = ${styleId};
    var key = ${cacheKey};
    var raw = localStorage.getItem(key);
    if (!raw) return;
    var payload=await parseCache(raw);
    if (!payload) {
        localStorage.removeItem(key);
        return;
      }

    var styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    var css = '';
    if (payload.cssText.root) css += payload.cssText.root + '\\n';
    for (var k in payload.cssText) {
      if (k !== 'root') css += (payload.cssText[k] || '') + '\\n';
    }
    styleEl.textContent = css;
  } catch (_error) {}
})();
    `.trim()

  if (options?.compact) {
    return script.replace(/\s+/g, ' ').trim()
  }

  return script
}
