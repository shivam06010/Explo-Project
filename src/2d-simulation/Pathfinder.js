export const createWarehouseGrid = (rows, cols) => {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0)); // 0 = aisle

  const racks = [];
  let idCounter = 1;

  // Add a block of racks
  const addRackBlock = (startRow, endRow, startCol, endCol, category) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        grid[r][c] = 1; // 1 = rack obstacle
        racks.push({
          id: `rack-${idCounter++}`,
          row: r,
          col: c,
          category,
          idealTemp: category === 'frozen' ? -20 : category === 'cold-chain' ? 5 : 20,
          idealHumidity: category === 'frozen' ? 40 : category === 'cold-chain' ? 50 : 45
        });
      }
    }
  };

  // Warehouse layout
  addRackBlock(3, 8, 3, 4, 'frozen');
  addRackBlock(12, 17, 3, 4, 'frozen');

  addRackBlock(3, 8, 9, 10, 'cold-chain');
  addRackBlock(12, 17, 9, 10, 'cold-chain');

  addRackBlock(3, 8, 15, 16, 'room-temp');
  addRackBlock(12, 17, 15, 16, 'room-temp');

  addRackBlock(3, 8, 21, 22, 'room-temp');
  addRackBlock(12, 17, 21, 22, 'room-temp');

  return { grid, racks };
};

export const getPickupAisleCells = (rack, grid) => {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const cells = [];
  for (let d of directions) {
    const nr = rack.row + d[0];
    const nc = rack.col + d[1];
    if (grid[nr] && grid[nr][nc] === 0) {
      cells.push({ row: nr, col: nc });
    }
  }
  return cells;
};

// Returns an array of {row, col} describing the path
export const dijkstra = (grid, startNode, endNode) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const previous = Array.from({ length: rows }, () => Array(cols).fill(null));
  const queue = [];

  dist[startNode.row][startNode.col] = 0;
  queue.push({ row: startNode.row, col: startNode.col, d: 0 });

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const curr = queue.shift();

    if (curr.d > dist[curr.row][curr.col]) continue;
    if (curr.row === endNode.row && curr.col === endNode.col) break;

    for (let d of dirs) {
      const nr = curr.row + d[0];
      const nc = curr.col + d[1];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0) {
        const alt = dist[curr.row][curr.col] + 1;
        if (alt < dist[nr][nc]) {
          dist[nr][nc] = alt;
          previous[nr][nc] = { row: curr.row, col: curr.col };
          queue.push({ row: nr, col: nc, d: alt });
        }
      }
    }
  }

  if (dist[endNode.row][endNode.col] === Infinity) return null;

  const path = [];
  let curr = endNode;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr.row][curr.col];
  }
  return path;
};

export const calculateMultiStopPath = (grid, start, targets, end) => {
  let currentPos = start;
  let fullPath = [];
  let remainingTargets = [...targets];

  while (remainingTargets.length > 0) {
    let nearestTarget = null;
    let shortestDist = Infinity;
    let bestPath = null;
    let targetIndex = -1;

    for (let i = 0; i < remainingTargets.length; i++) {
      const targetPosList = getPickupAisleCells(remainingTargets[i], grid);
      for (let pos of targetPosList) {
        const p = dijkstra(grid, currentPos, pos);
        if (p && p.length < shortestDist) {
          shortestDist = p.length;
          bestPath = p;
          nearestTarget = remainingTargets[i];
          targetIndex = i;
        }
      }
    }

    if (targetIndex !== -1) {
      if (fullPath.length > 0 && bestPath.length > 0) bestPath.shift();
      fullPath = fullPath.concat(bestPath);
      currentPos = bestPath[bestPath.length - 1];
      remainingTargets.splice(targetIndex, 1);
    } else {
      console.warn("Unreachable target");
      break;
    }
  }

  const toEnd = dijkstra(grid, currentPos, end);
  if (toEnd) {
    if (fullPath.length > 0 && toEnd.length > 0) toEnd.shift();
    fullPath = fullPath.concat(toEnd);
  }

  return fullPath;
};
