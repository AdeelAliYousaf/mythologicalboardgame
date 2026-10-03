import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = 'docs/board-calibration';
const read = name => JSON.parse(readFileSync(`${root}/${name}`, 'utf8'));
const source = read('source-measurements.json');
const viewports = [[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[1024,768],[1366,768],[1920,1080]];
const batches = viewports.map(([width,height]) => {
  const rows=read(`geometry-${width}x${height}.json`);
  if(rows.length!==100 || rows.some((row,index)=>row.geometry.square!==index+1)) throw Error(`Incomplete viewport: ${width}x${height}`);
  return {width,height,rows};
});
const extras=read('geometry-resize-camera-cluster.json');
const gameplay=read('gameplay-dom.json');
const all=[...batches.flatMap(batch=>batch.rows),...extras,...gameplay];
const anchorChecks=all.flatMap(row=>row.geometry.tokens.map(token=>({
  x:Math.abs(token.anchor.centerX-row.expectedX),
  y:Math.abs(token.anchor.centerY-row.expectedY),
})));
const directVisualChecks=all.filter(row=>row.kind!=='cluster').flatMap(row=>row.geometry.tokens.map(token=>({
  x:Math.abs(token.visual.centerX-row.expectedX),
  y:Math.abs(token.visual.centerY-row.expectedY),
})));
const clusterChecks=extras.filter(row=>row.kind==='cluster').map(row=>({
  x:Math.abs(row.geometry.tokens.reduce((sum,t)=>sum+t.visual.centerX,0)/row.geometry.tokens.length-row.expectedX),
  y:Math.abs(row.geometry.tokens.reduce((sum,t)=>sum+t.visual.centerY,0)/row.geometry.tokens.length-row.expectedY),
}));
const max = (rows,key)=>Math.max(...rows.map(row=>row[key]));
const assetHash=createHash('sha256').update(readFileSync('public/assets/board.webp')).digest('hex');
if(assetHash!==source.sha256)throw Error('Served board differs from original source');
const summary={
  source,
  sourceAndServedBoardIdentical:true,
  gridModel:'measured row-column edges (nonuniform)',
  viewports:viewports.map(([width,height])=>`${width}x${height}`),
  allSquareViewportCases:batches.reduce((sum,b)=>sum+b.rows.length,0),
  renderedGridLineChecks:viewports.length*22,
  extraCases:extras.length+gameplay.length,
  totalTokenAnchorChecks:anchorChecks.length,
  tokenAnchorAxisAssertions:anchorChecks.length*2,
  maxObservedXError:max(anchorChecks,'x'),
  maxObservedYError:max(anchorChecks,'y'),
  maxVisualXError:max(directVisualChecks,'x'),
  maxVisualYError:max(directVisualChecks,'y'),
  maxClusterCentroidXError:max(clusterChecks,'x'),
  maxClusterCentroidYError:max(clusterChecks,'y'),
  gameplayDiagnostics:gameplay.map(row=>({
    square:row.geometry.square,
    expectedCenter:{x:row.expectedX,y:row.expectedY},
    actualAnchorCenter:{x:row.geometry.tokens[0].anchor.centerX,y:row.geometry.tokens[0].anchor.centerY},
    actualVisualCenter:{x:row.geometry.tokens[0].visual.centerX,y:row.geometry.tokens[0].visual.centerY},
    boardShell:row.geometry.boardShell,
    boardImage:row.geometry.boardImage,
    tokenLayer:row.geometry.tokenLayer,
    tokenAnchor:row.geometry.tokens[0].anchor,
    tokenVisual:row.geometry.tokens[0].visual,
    imageStyle:row.geometry.imageStyle,
    ancestors:row.geometry.ancestors,
  })),
  baseline:read('baseline.json'),
};
writeFileSync(`${root}/verification-summary.json`,JSON.stringify(summary,null,2));
const fmt=n=>n.toFixed(9);
const rectText=r=>`left=${fmt(r.left)}, top=${fmt(r.top)}, width=${fmt(r.width)}, height=${fmt(r.height)}`;
const points=summary.gameplayDiagnostics;
const text=`# Measured board coordinate report

## Source calibration

The unchanged source image is **${source.imageWidth} × ${source.imageHeight}px**. Its SHA-256 is \`${source.sha256}\`; the served board has the same hash.

Playable bounds in source pixels: **left=${source.boundsPx.left}, top=${source.boundsPx.top}, right=${source.boundsPx.right}, bottom=${source.boundsPx.bottom}**.

Normalized bounds (0–1): left=${fmt(source.boundsNormalized.left)}, top=${fmt(source.boundsNormalized.top)}, right=${fmt(source.boundsNormalized.right)}, bottom=${fmt(source.boundsNormalized.bottom)}.

Grid model: **${summary.gridModel}**.

\`COLUMN_EDGES_PX = [${source.columnEdgesPx.join(', ')}]\`

\`ROW_EDGES_PX = [${source.rowEdgesPx.join(', ')}]\`

Column widths: [${source.columnWidthsPx.join(', ')}]px. Row heights: [${source.rowHeightsPx.join(', ')}]px. Equal interpolation would be incorrect.

The measurements identify peak raster boundary samples. Thin lines are antialiased over approximately 1–3 source pixels; original vector coordinates are unavailable. Interior lines are detected by median local contrast across the grid, rather than glyphs. Outer boundaries use the strongest median transition in each border region. Run \`python scripts/measure-board-grid.py\` to reproduce the scan. Pillow and NumPy are required for this optional measurement script. See \`source-grid-overlay.png\` for all measured boundaries and 100 centers over the original artwork.

## Root cause and transformation audit

Two separate transformations introduced the drift:

1. The previous geometry divided an approximately measured rectangle into equal tenths. The source grid has unequal widths and heights. Square 14's old canonical screen point was (247.312500, 452.625000) at 390×844, versus the measured cell center (260.333333, 455.166667).
2. A lone token was assigned \`cluster-0\`, adding (-7.02px, -7.02px) in that viewport. Its actual center was (240.292496, 445.605011), around 20.041px left and 9.562px above the true cell center.

The old negative-half-size anchor itself centered the inner token at the already displaced cluster origin. Motion did **not** overwrite a centering transform in the measured baseline. The old image used \`object-fit: fill\`, with no image padding, margin, border, or letterboxing. Image and shell rectangles matched exactly. All measured gameplay ancestors had \`transform: none\`, \`zoom: 1\`, and \`perspective: none\`. Neither object-fit nor ancestor transforms caused the baseline drift.

The new \`getCellCenter(square)\` is the only coordinate function. It retains the existing pure serpentine mapping, then averages adjacent measured edges. CSS positions a sized anchor and applies \`translate(-50%, -50%)\`. A separate cluster child applies symmetric offsets; a singleton has zero offset. Motion owns only the visual child. The active outline and magenta center dot share that visual's center. Image, token, atmosphere, effect, and debug layers use the same absolute inset rectangle.

## Actual gameplay DOM measurements

At **390×844**, with no camera transform:

| Element | Left | Top | Width | Height |
|---|---:|---:|---:|---:|
${['boardShell','boardImage','tokenLayer','tokenAnchor','tokenVisual'].map(key=>`| ${key} (square 14) | ${points[0][key].left.toFixed(6)} | ${points[0][key].top.toFixed(6)} | ${points[0][key].width.toFixed(6)} | ${points[0][key].height.toFixed(6)} |`).join('\n')}

| Square | Artwork center | Expected screen center | Actual anchor center | Actual visual center |
|---|---|---|---|---|
${points.map(point=>{
 const square=point.square,logicalRow=Math.floor((square-1)/10),visualRow=9-logicalRow,col=logicalRow%2===0?(square-1)%10:9-(square-1)%10;
 const x=(source.columnEdgesPx[col]+source.columnEdgesPx[col+1])/2,y=(source.rowEdgesPx[visualRow]+source.rowEdgesPx[visualRow+1])/2;
 return `| ${square} | (${x}, ${y}) | (${point.expectedCenter.x.toFixed(6)}, ${point.expectedCenter.y.toFixed(6)}) | (${point.actualAnchorCenter.x.toFixed(6)}, ${point.actualAnchorCenter.y.toFixed(6)}) | (${point.actualVisualCenter.x.toFixed(6)}, ${point.actualVisualCenter.y.toFixed(6)}) |`;
}).join('\n')}

Square 14: logical row 1, visual row 8, visual column 6; normalized center (781/1170, 1191.5/1560). Square 74: logical row 7, visual row 2, visual column 6; normalized center (781/1170, 492.5/1560). These are cell centers, not number-glyph centers.

## Verification results

- **${summary.allSquareViewportCases} square/viewport cases:** every square 1–100 at all 11 requested viewports: ${summary.viewports.join(', ')}.
- **${summary.renderedGridLineChecks} rendered grid-line checks:** all 11 column boundaries and 11 row boundaries per viewport, independently projected from source measurements.
- **${summary.extraCases} additional scenarios:** orientation changes for squares 1, 14, 40, 74, 100; common zoom/pan/camera-follow transforms; Motion scale 1.4; clusters of 1–4 on 14 and 74; and actual gameplay pages on 14 and 74.
- **${summary.totalTokenAnchorChecks} total token-anchor checks**, or **${summary.tokenAnchorAxisAssertions} X/Y assertions**. Each requires less than 1px error.
- Maximum observed anchor X error: **${fmt(summary.maxObservedXError)}px**.
- Maximum observed anchor Y error: **${fmt(summary.maxObservedYError)}px**.
- Maximum unclustered visual X/Y error: **${fmt(summary.maxVisualXError)} / ${fmt(summary.maxVisualYError)}px**.
- Maximum cluster centroid X/Y error: **${fmt(summary.maxClusterCentroidXError)} / ${fmt(summary.maxClusterCentroidYError)}px**.

The production game has no zoom/pan camera. The isolated harness tests a shared camera ancestor at scale 1, 1.35, and 1.2 with translations, confirming that image and token layers remain coincident under those transforms. Portrait→landscape→portrait tests use 390×844→844×390→390×844.

Use \`?debugBoard=1\` in the game for red outer bounds, cyan grid lines, yellow crosshairs, white square labels, magenta actual token centers, and DOM rectangle readouts. Clustering is disabled in this calibration mode. Normal gameplay enables symmetric clustering.

Run \`npm run build\`, then \`npx playwright test --config playwright.geometry.config.ts\` and \`node scripts/summarize-board-geometry.mjs\`. The harness URL is \`/test-board\` and returns 404 unless \`BOARD_GEOMETRY_TESTING=1\`; Playwright sets that flag on its server. No game rules or original artwork were changed. The service-worker cache version was advanced to discard cached app code using the previous geometry.

Full measurements are in \`board-calibration/verification-summary.json\`, \`gameplay-dom.json\`, and the per-viewport JSON files. Debug captures are in the same directory.
`;
writeFileSync('docs/BOARD_COORDINATE_REPORT.md',text);
console.log(JSON.stringify({allSquareViewportCases:summary.allSquareViewportCases,totalTokenAnchorChecks:summary.totalTokenAnchorChecks,maxObservedXError:summary.maxObservedXError,maxObservedYError:summary.maxObservedYError,maxClusterCentroidXError:summary.maxClusterCentroidXError,maxClusterCentroidYError:summary.maxClusterCentroidYError,gameplayDiagnostics:summary.gameplayDiagnostics.map(p=>({square:p.square,expected:p.expectedCenter,actual:p.actualAnchorCenter,boardImage:p.boardImage,tokenLayer:p.tokenLayer}))},null,2));
