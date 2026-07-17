// Loads and caches JSON documents and images from a manifest, with progress
// reporting for the loading screen. Assets are plain URLs — swapping a file on
// disk changes the game without touching code.

export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.json = new Map();
  }

  /**
   * @param {{json?: Record<string, string>, images?: Record<string, string>}} manifest
   *   Maps asset key -> URL.
   * @param {(progress: number) => void} [onProgress]  Called with 0..1.
   */
  async loadManifest(manifest, onProgress = () => {}) {
    const entries = [
      ...Object.entries(manifest.json ?? {}).map(([key, url]) => ({ kind: 'json', key, url })),
      ...Object.entries(manifest.images ?? {}).map(([key, url]) => ({ kind: 'image', key, url })),
    ];

    let done = 0;
    const total = entries.length || 1;
    const tick = () => onProgress(++done / total);

    await Promise.all(
      entries.map((entry) =>
        (entry.kind === 'json' ? this._loadJSON(entry.url) : this._loadImage(entry.url)).then(
          (asset) => {
            if (entry.kind === 'json') this.json.set(entry.key, asset);
            else this.images.set(entry.key, asset);
            tick();
          }
        )
      )
    );
  }

  async _loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load JSON: ${url} (${res.status})`);
    return res.json();
  }

  _loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  image(key) {
    const img = this.images.get(key);
    if (!img) throw new Error(`Unknown image asset: ${key}`);
    return img;
  }

  data(key) {
    const doc = this.json.get(key);
    if (!doc) throw new Error(`Unknown JSON asset: ${key}`);
    return doc;
  }
}
