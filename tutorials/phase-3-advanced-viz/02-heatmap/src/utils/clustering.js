/**
 * Hierarchical Clustering Implementation
 * Provides agglomerative clustering for heatmap row/column ordering
 */

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/**
 * Calculate Pearson correlation distance (1 - correlation)
 */
export function correlationDistance(a, b) {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  
  let sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    const devA = a[i] - meanA;
    const devB = b[i] - meanB;
    sumAB += devA * devB;
    sumA2 += devA * devA;
    sumB2 += devB * devB;
  }
  
  const denom = Math.sqrt(sumA2) * Math.sqrt(sumB2);
  if (denom === 0) return 1;
  
  const correlation = sumAB / denom;
  return isNaN(correlation) ? 1 : 1 - correlation;
}

/**
 * Calculate distance matrix
 */
export function distanceMatrix(data, distanceFn = euclideanDistance) {
  const n = data.length;
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = distanceFn(data[i], data[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }
  
  return matrix;
}

/**
 * Agglomerative hierarchical clustering
 * Returns dendrogram structure and optimal leaf ordering
 */
export function hierarchicalCluster(data, options = {}) {
  const {
    distanceFn = correlationDistance,
    linkage = 'average'
  } = options;

  const n = data.length;
  if (n === 0) return { order: [], dendrogram: null };
  if (n === 1) return { order: [0], dendrogram: { id: 0, isLeaf: true, height: 0 } };

  // Calculate initial distance matrix
  const distances = distanceMatrix(data, distanceFn);
  
  // Initialize clusters - each item starts as its own cluster
  // We store cluster info by cluster ID
  let nextClusterId = n; // New clusters get IDs starting from n
  
  const clusterMembers = {}; // clusterID -> list of original indices
  const clusterNodes = {};   // clusterID -> dendrogram node
  
  for (let i = 0; i < n; i++) {
    clusterMembers[i] = [i];
    clusterNodes[i] = { id: i, isLeaf: true, height: 0, members: [i] };
  }
  
  // Active clusters
  let activeClusters = new Set([...Array(n).keys()]);
  
  // Create a mutable distance map for cluster pairs
  const clusterDist = {};
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      clusterDist[`${i}-${j}`] = distances[i][j];
    }
  }
  
  function getClusterDistance(c1, c2) {
    const key = c1 < c2 ? `${c1}-${c2}` : `${c2}-${c1}`;
    return clusterDist[key];
  }
  
  function setClusterDistance(c1, c2, dist) {
    const key = c1 < c2 ? `${c1}-${c2}` : `${c2}-${c1}`;
    clusterDist[key] = dist;
  }
  
  // Merge clusters until one remains
  while (activeClusters.size > 1) {
    // Find closest pair
    let minDist = Infinity;
    let minI = -1, minJ = -1;
    
    const activeList = [...activeClusters];
    for (let i = 0; i < activeList.length; i++) {
      for (let j = i + 1; j < activeList.length; j++) {
        const ci = activeList[i];
        const cj = activeList[j];
        const dist = getClusterDistance(ci, cj);
        
        if (dist < minDist) {
          minDist = dist;
          minI = ci;
          minJ = cj;
        }
      }
    }
    
    // Create new merged cluster
    const newClusterId = nextClusterId++;
    const newMembers = [...clusterMembers[minI], ...clusterMembers[minJ]];
    clusterMembers[newClusterId] = newMembers;
    
    // Create dendrogram node
    clusterNodes[newClusterId] = {
      id: newClusterId,
      isLeaf: false,
      height: minDist,
      left: clusterNodes[minI],
      right: clusterNodes[minJ],
      members: newMembers
    };
    
    // Calculate distances from new cluster to all other active clusters
    for (const otherId of activeClusters) {
      if (otherId === minI || otherId === minJ) continue;
      
      let newDist;
      if (linkage === 'single') {
        newDist = Math.min(
          getClusterDistance(minI, otherId),
          getClusterDistance(minJ, otherId)
        );
      } else if (linkage === 'complete') {
        newDist = Math.max(
          getClusterDistance(minI, otherId),
          getClusterDistance(minJ, otherId)
        );
      } else { // average
        const n1 = clusterMembers[minI].length;
        const n2 = clusterMembers[minJ].length;
        newDist = (
          getClusterDistance(minI, otherId) * n1 +
          getClusterDistance(minJ, otherId) * n2
        ) / (n1 + n2);
      }
      
      setClusterDistance(newClusterId, otherId, newDist);
    }
    
    // Update active clusters
    activeClusters.delete(minI);
    activeClusters.delete(minJ);
    activeClusters.add(newClusterId);
  }
  
  // Get root cluster
  const rootId = [...activeClusters][0];
  const dendrogram = clusterNodes[rootId];
  
  // Extract leaf order
  const order = getLeafOrder(dendrogram);
  
  return { order, dendrogram };
}

/**
 * Extract leaf order from dendrogram (in-order traversal)
 */
function getLeafOrder(node) {
  if (node.isLeaf) {
    return [node.id];
  }
  
  const leftOrder = getLeafOrder(node.left);
  const rightOrder = getLeafOrder(node.right);
  
  return [...leftOrder, ...rightOrder];
}

/**
 * Generate dendrogram coordinates for visualization
 */
export function dendrogramCoordinates(dendrogram, width, height, orientation = 'left') {
  if (!dendrogram) return [];
  
  const coords = [];
  
  // Get leaf order and assign positions
  const leaves = getLeafOrder(dendrogram);
  const numLeaves = leaves.length;
  
  // Map leaf ID to position
  const leafPositions = new Map();
  leaves.forEach((leafId, i) => {
    leafPositions.set(leafId, (i + 0.5) / numLeaves);
  });
  
  // Find max height for scaling
  const maxHeight = findMaxHeight(dendrogram);
  if (maxHeight === 0) return [];
  
  // Generate coordinates recursively
  function traverse(node) {
    if (node.isLeaf) {
      const pos = leafPositions.get(node.id);
      return { 
        pos: pos, // normalized position (0-1)
        depth: 0  // normalized depth (0-1)
      };
    }
    
    const leftCoord = traverse(node.left);
    const rightCoord = traverse(node.right);
    
    const depth = node.height / maxHeight;
    const pos = (leftCoord.pos + rightCoord.pos) / 2;
    
    // Add dendrogram lines
    // These are in normalized coordinates (0-1)
    coords.push({
      type: 'vertical',
      depth: depth,
      pos1: leftCoord.pos,
      pos2: rightCoord.pos
    });
    
    coords.push({
      type: 'horizontal',
      pos: leftCoord.pos,
      depth1: leftCoord.depth,
      depth2: depth
    });
    
    coords.push({
      type: 'horizontal',
      pos: rightCoord.pos,
      depth1: rightCoord.depth,
      depth2: depth
    });
    
    return { pos, depth };
  }
  
  traverse(dendrogram);
  
  // Convert normalized coordinates to actual coordinates based on orientation
  return coords.map(line => {
    if (orientation === 'left') {
      // Row dendrogram: depth goes left (width), pos goes down (height)
      if (line.type === 'vertical') {
        return {
          type: 'vertical',
          x: width * (1 - line.depth * 0.95),
          y1: height * line.pos1,
          y2: height * line.pos2
        };
      } else {
        return {
          type: 'horizontal',
          y: height * line.pos,
          x1: width * (1 - line.depth1 * 0.95),
          x2: width * (1 - line.depth2 * 0.95)
        };
      }
    } else {
      // Column dendrogram: depth goes up (height), pos goes right (width)
      if (line.type === 'vertical') {
        return {
          type: 'horizontal', // swapped for top orientation
          y: height * (1 - line.depth * 0.95),
          x1: width * line.pos1,
          x2: width * line.pos2
        };
      } else {
        return {
          type: 'vertical', // swapped for top orientation
          x: width * line.pos,
          y1: height * (1 - line.depth1 * 0.95),
          y2: height * (1 - line.depth2 * 0.95)
        };
      }
    }
  });
}

function findMaxHeight(node) {
  if (node.isLeaf) return 0;
  return Math.max(
    node.height,
    findMaxHeight(node.left),
    findMaxHeight(node.right)
  );
}

/**
 * Reorder matrix rows and columns based on clustering
 */
export function reorderMatrix(matrix, rowOrder, colOrder) {
  const reordered = [];
  
  for (const r of rowOrder) {
    const row = [];
    for (const c of colOrder) {
      row.push(matrix[r][c]);
    }
    reordered.push(row);
  }
  
  return reordered;
}

export default {
  hierarchicalCluster,
  euclideanDistance,
  correlationDistance,
  dendrogramCoordinates,
  reorderMatrix
};
