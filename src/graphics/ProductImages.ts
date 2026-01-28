// Preloads product images for items (papers, filters, grinder)
// Falls back to procedural art if images fail to load

const IMAGE_BASE = '/images/';

const IMAGE_PATHS: Record<string, string> = {
  'paper-green': 'Red-Regular.jpg',
  'paper-gold': 'Blue-Regular.jpg',
  'paper-brown': 'Brown-Regular.jpg',
  'filter': 'bag-slim-120.png',
  'grinder': '3D-Grinder-Euphoria-hand-pink.jpg',
};

class ProductImageCache {
  private images = new Map<string, HTMLImageElement>();
  private loaded = new Map<string, boolean>();

  constructor() {
    this.preload();
  }

  private preload(): void {
    for (const [key, filename] of Object.entries(IMAGE_PATHS)) {
      const img = new Image();
      img.src = IMAGE_BASE + filename;
      img.onload = () => {
        this.loaded.set(key, true);
      };
      img.onerror = () => {
        this.loaded.set(key, false);
      };
      this.images.set(key, img);
    }
  }

  get(key: string): HTMLImageElement | null {
    if (this.loaded.get(key)) {
      return this.images.get(key) || null;
    }
    return null;
  }
}

export const productImages = new ProductImageCache();
