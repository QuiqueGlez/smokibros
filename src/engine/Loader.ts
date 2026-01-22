import type { LevelData } from '../types';

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = url;
  });
}

export async function loadJSON<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load JSON: ${url}`);
  }
  return response.json();
}

export async function loadLevel(name: string): Promise<LevelData> {
  return loadJSON<LevelData>(`/levels/${name}.json`);
}

// Load multiple assets in parallel
export async function loadAssets<T extends Record<string, Promise<unknown>>>(
  assets: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(assets);
  const values = await Promise.all(entries.map(([_, promise]) => promise));

  return Object.fromEntries(
    entries.map(([key], index) => [key, values[index]])
  ) as { [K in keyof T]: Awaited<T[K]> };
}
