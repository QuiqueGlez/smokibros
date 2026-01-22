import { TILE_SIZE, TileType } from '../types';

export interface TileMatch {
  x: number;
  y: number;
  type: TileType;
}

export class TileResolver {
  readonly tileSize: number;
  private tiles: number[][];

  constructor(tiles: number[][], tileSize = TILE_SIZE) {
    this.tiles = tiles;
    this.tileSize = tileSize;
  }

  // Convert pixel position to tile index
  toIndex(pos: number): number {
    return Math.floor(pos / this.tileSize);
  }

  // Convert tile index to pixel position
  toPixel(index: number): number {
    return index * this.tileSize;
  }

  // Get tile at tile coordinates (O(1) lookup)
  getByIndex(indexX: number, indexY: number): TileMatch | null {
    if (indexY < 0 || indexY >= this.tiles.length) {
      return null;
    }

    const row = this.tiles[indexY];
    if (indexX < 0 || indexX >= row.length) {
      return null;
    }

    return {
      x: indexX,
      y: indexY,
      type: row[indexX] as TileType
    };
  }

  // Get tile at pixel coordinates
  getByPixel(x: number, y: number): TileMatch | null {
    return this.getByIndex(this.toIndex(x), this.toIndex(y));
  }

  // Get all tiles in a range
  getByRange(
    left: number,
    top: number,
    right: number,
    bottom: number
  ): TileMatch[] {
    const matches: TileMatch[] = [];

    const startX = this.toIndex(left);
    const endX = this.toIndex(right);
    const startY = this.toIndex(top);
    const endY = this.toIndex(bottom);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = this.getByIndex(x, y);
        if (tile) {
          matches.push(tile);
        }
      }
    }

    return matches;
  }

  // Set tile at index
  setTile(indexX: number, indexY: number, type: TileType): void {
    if (indexY >= 0 && indexY < this.tiles.length) {
      const row = this.tiles[indexY];
      if (indexX >= 0 && indexX < row.length) {
        row[indexX] = type;
      }
    }
  }

  // Get dimensions
  get width(): number {
    return this.tiles[0]?.length ?? 0;
  }

  get height(): number {
    return this.tiles.length;
  }
}
