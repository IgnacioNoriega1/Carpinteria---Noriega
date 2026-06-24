export interface Part {
  length: number;
  width: number;
  qty: number;
  label: string;
  material: string;
  thickness: number;
  notes?: string;
}

export interface Sheet {
  length: number;
  width: number;
  qty: number;
  material: string;
  thickness: number;
  cost: number;
  notes?: string;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedPart {
  x: number;
  y: number;
  w: number; // Placed width (might be rotated)
  h: number; // Placed length
  label: string;
  rotated: boolean;
  notes?: string;
}

export interface OptimizedSheetResult {
  sheetIndex: number;
  sheetWidth: number;
  sheetLength: number;
  cost: number;
  placedParts: PlacedPart[];
  freeSpaces: FreeRect[];
  utilizationArea: number;
  wasteArea: number;
  utilizationPercentage: number;
}

export interface OptimizationResult {
  results: OptimizedSheetResult[];
  unplacedParts: { label: string; qty: number; w: number; h: number }[];
  totals: {
    totalPartsPlaced: number;
    sheetsUsedCount: number;
    totalUsedArea: number;
    totalWastedArea: number;
    utilizationPercentage: number;
    totalSheetsCost: number;
    wastedCost: number;
  };
}

/**
 * Heurística de empaquetamiento 2D por corte de guillotina.
 * Ordena las piezas por área descendente y las coloca en los espacios libres
 * de las placas disponibles aplicando división horizontal o vertical.
 */
export function optimizeCuts(
  partsInput: Part[],
  sheetsInput: Sheet[],
  options: {
    kerf: number;
    edgeTrim: number;
    useGrain: boolean;
  }
): OptimizationResult {
  const { kerf, edgeTrim, useGrain } = options;

  // 1. Expandir las cantidades de las piezas en un listado plano e individual
  const flatParts: { w: number; h: number; label: string; notes?: string }[] = [];
  partsInput.forEach(p => {
    for (let i = 0; i < p.qty; i++) {
      flatParts.push({
        w: p.width,
        h: p.length,
        label: p.label || `Pieza ${flatParts.length + 1}`,
        notes: p.notes
      });
    }
  });

  // Ordenar piezas por superficie (área) de mayor a menor (mejor empaquetamiento)
  flatParts.sort((a, b) => (b.w * b.h) - (a.w * a.h));

  // 2. Expandir el listado de placas disponibles
  const flatSheets: { w: number; h: number; cost: number; originalIdx: number }[] = [];
  sheetsInput.forEach((s, idx) => {
    for (let i = 0; i < s.qty; i++) {
      flatSheets.push({
        w: s.width,
        h: s.length,
        cost: s.cost || 0,
        originalIdx: idx
      });
    }
  });

  const results: OptimizedSheetResult[] = [];
  const unplacedParts: { label: string; qty: number; w: number; h: number }[] = [];

  // Espacios libres por cada placa activa
  const sheetsFreeSpaces: FreeRect[][] = [];
  const sheetsPlacedParts: PlacedPart[][] = [];

  // Inicializar espacios libres para todas las placas (restando el refilado de bordes)
  flatSheets.forEach((sheet, sheetIdx) => {
    const doubleTrim = edgeTrim * 2;
    const usableW = sheet.w - doubleTrim;
    const usableH = sheet.h - doubleTrim;

    sheetsFreeSpaces.push([
      {
        x: edgeTrim,
        y: edgeTrim,
        w: usableW > 0 ? usableW : 0,
        h: usableH > 0 ? usableH : 0
      }
    ]);
    sheetsPlacedParts.push([]);
  });

  let activeSheetsCount = 0;
  const activeSheetsUsed = new Set<number>();

  // 3. Colocar cada pieza
  for (const part of flatParts) {
    let placed = false;

    // Buscar en las placas que ya hemos empezado a utilizar primero para no abrir placas de más
    const sheetsToTry = Array.from(activeSheetsUsed).sort((a, b) => a - b);
    
    // Si no entra en las ya activas, intentaremos con la primera placa vacía disponible
    for (let i = 0; i < flatSheets.length; i++) {
      if (!activeSheetsUsed.has(i) && sheetsToTry.indexOf(i) === -1) {
        sheetsToTry.push(i);
      }
    }

    for (const sheetIdx of sheetsToTry) {
      const freeSpaces = sheetsFreeSpaces[sheetIdx];
      
      // Buscar el primer espacio libre donde quepa la pieza
      let spaceIdx = -1;
      let rotatePart = false;

      for (let s = 0; s < freeSpaces.length; s++) {
        const space = freeSpaces[s];

        // Caso 1: Sin rotar
        if (part.w <= space.w && part.h <= space.h) {
          spaceIdx = s;
          rotatePart = false;
          break;
        }

        // Caso 2: Rotado (solo si no se exige respetar la veta/grano)
        if (!useGrain && part.h <= space.w && part.w <= space.h) {
          spaceIdx = s;
          rotatePart = true;
          break;
        }
      }

      // Si encontramos espacio, colocar la pieza y dividir el espacio restante
      if (spaceIdx !== -1) {
        const space = freeSpaces[spaceIdx];
        const pw = rotatePart ? part.h : part.w;
        const ph = rotatePart ? part.w : part.h;

        // Añadir pieza colocada
        sheetsPlacedParts[sheetIdx].push({
          x: space.x,
          y: space.y,
          w: pw,
          h: ph,
          label: part.label,
          rotated: rotatePart,
          notes: part.notes
        });

        // Marcar la placa como usada
        if (!activeSheetsUsed.has(sheetIdx)) {
          activeSheetsUsed.add(sheetIdx);
          activeSheetsCount++;
        }

        // Dividir el espacio restante usando corte de guillotina
        // Eliminamos el espacio usado
        freeSpaces.splice(spaceIdx, 1);

        // Generamos dos nuevos espacios resultantes de la subdivisión
        // Espacio a la derecha de la pieza colocada (incluyendo kerf)
        const rightW = space.w - pw - kerf;
        const rightH = ph; // Altura acotada a la pieza para un corte limpio
        if (rightW > 0 && rightH > 0) {
          freeSpaces.push({
            x: space.x + pw + kerf,
            y: space.y,
            w: rightW,
            h: rightH
          });
        }

        // Espacio arriba de la pieza colocada (incluyendo kerf)
        const topW = space.w;
        const topH = space.h - ph - kerf;
        if (topW > 0 && topH > 0) {
          freeSpaces.push({
            x: space.x,
            y: space.y + ph + kerf,
            w: topW,
            h: topH
          });
        }

        // Ordenar espacios libres por área descendente para maximizar encaje futuro
        freeSpaces.sort((a, b) => (b.w * b.h) - (a.w * a.h));
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Registrar pieza que no cupo en ninguna placa
      const existing = unplacedParts.find(u => u.label === part.label && u.w === part.w && u.h === part.h);
      if (existing) {
        existing.qty++;
      } else {
        unplacedParts.push({ label: part.label, qty: 1, w: part.w, h: part.h });
      }
    }
  }

  // 4. Compilar resultados de las placas utilizadas
  let totalPartsPlaced = 0;
  let totalUsedArea = 0;
  let totalWastedArea = 0;
  let totalSheetsCost = 0;

  activeSheetsUsed.forEach(sheetIdx => {
    const sheet = flatSheets[sheetIdx];
    const placed = sheetsPlacedParts[sheetIdx];
    const free = sheetsFreeSpaces[sheetIdx];

    totalPartsPlaced += placed.length;
    totalSheetsCost += sheet.cost;

    // Área total de la placa
    const sheetTotalArea = sheet.w * sheet.h;

    // Área utilizada por piezas colocadas (suma de sus áreas individuales)
    const placedArea = placed.reduce((sum, p) => sum + (p.w * p.h), 0);
    totalUsedArea += placedArea;

    // Área desperdiciada (Toda el área que no es pieza colocada)
    const wasteArea = sheetTotalArea - placedArea;
    totalWastedArea += wasteArea;

    const utilizationPercentage = parseFloat(((placedArea / sheetTotalArea) * 100).toFixed(2));

    results.push({
      sheetIndex: sheetIdx + 1,
      sheetWidth: sheet.w,
      sheetLength: sheet.h,
      cost: sheet.cost,
      placedParts: placed,
      freeSpaces: free,
      utilizationArea: placedArea,
      wasteArea,
      utilizationPercentage
    });
  });

  const totalAreaAllUsedSheets = results.reduce((sum, r) => sum + (r.sheetWidth * r.sheetLength), 0);
  const globalUtilizationPct = totalAreaAllUsedSheets > 0 
    ? parseFloat(((totalUsedArea / totalAreaAllUsedSheets) * 100).toFixed(2))
    : 0;

  // Costo estimado del desperdicio
  const wastedCost = totalSheetsCost * (1 - (globalUtilizationPct / 100));

  return {
    results,
    unplacedParts,
    totals: {
      totalPartsPlaced,
      sheetsUsedCount: results.length,
      totalUsedArea,
      totalWastedArea,
      utilizationPercentage: globalUtilizationPct,
      totalSheetsCost,
      wastedCost: parseFloat(wastedCost.toFixed(2))
    }
  };
}
