/**
 * Quadtree for efficient spatial queries
 * Used for fast point lookup on hover/click
 */

export class Quadtree {
  constructor(bounds, capacity = 4) {
    this.bounds = bounds; // { x, y, width, height }
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  contains(point) {
    return (
      point.x >= this.bounds.x &&
      point.x < this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y < this.bounds.y + this.bounds.height
    );
  }

  intersects(range) {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  subdivide() {
    const { x, y, width, height } = this.bounds;
    const w = width / 2;
    const h = height / 2;

    this.northwest = new Quadtree({ x, y, width: w, height: h }, this.capacity);
    this.northeast = new Quadtree({ x: x + w, y, width: w, height: h }, this.capacity);
    this.southwest = new Quadtree({ x, y: y + h, width: w, height: h }, this.capacity);
    this.southeast = new Quadtree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;
  }

  insert(point) {
    if (!this.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northwest.insert(point) ||
      this.northeast.insert(point) ||
      this.southwest.insert(point) ||
      this.southeast.insert(point)
    );
  }

  query(range, found = []) {
    if (!this.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (
        point.x >= range.x &&
        point.x < range.x + range.width &&
        point.y >= range.y &&
        point.y < range.y + range.height
      ) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }

    return found;
  }

  findNearest(x, y, radius) {
    const range = {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2
    };

    const candidates = this.query(range);
    
    let nearest = null;
    let minDist = radius * radius;

    for (const point of candidates) {
      const dx = point.x - x;
      const dy = point.y - y;
      const dist = dx * dx + dy * dy;
      
      if (dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }

    return nearest;
  }

  clear() {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }
}

/**
 * Build quadtree from data points
 */
export function buildQuadtree(points, padding = 1) {
  // Calculate bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const bounds = {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };

  const quadtree = new Quadtree(bounds);

  for (const point of points) {
    quadtree.insert(point);
  }

  return quadtree;
}

export default Quadtree;
