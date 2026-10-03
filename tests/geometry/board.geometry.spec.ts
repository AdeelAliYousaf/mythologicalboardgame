import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { getCellCenter } from '../../src/game/rules/boardConfig';
import { newGame } from '../../src/game/engine/game';
import measurements from '../../docs/board-calibration/source-measurements.json';

const out = 'docs/board-calibration';
mkdirSync(out, { recursive: true });
const viewports = [[320,568],[360,800],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[1024,768],[1366,768],[1920,1080]];
type Placement = { square: number; count?: number; cluster?: boolean; scale?: number; camera?: { zoom: number; x: number; y: number } };

test.beforeEach(async ({ page }) => {
  // External font loading has no role in the raster coordinate space.
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
});

async function openHarness(page: Page) {
  await page.goto('/test-board', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.boardTestReady === '1');
  await expect(page.locator('.board-art')).toBeVisible();
}

async function place(page: Page, value: Placement) {
  await page.evaluate(value => window.dispatchEvent(new CustomEvent('board-test-place', { detail: value })), value);
  await page.waitForFunction(({ square, count }) => {
    const anchors = document.querySelectorAll('.token-anchor');
    return anchors.length === (count ?? 1) && Array.from(anchors).every(anchor => anchor.getAttribute('data-square') === String(square));
  }, value);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
}

async function readGeometry(page: Page, square: number) {
  return page.evaluate(square => {
    const rect = (element: Element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, centerX: r.left+r.width/2, centerY: r.top+r.height/2 };
    };
    const board = document.querySelector('.board')!;
    const anchors = Array.from(board.querySelectorAll<HTMLElement>('.token-anchor')).filter(anchor=>anchor.dataset.square===String(square));
    const ancestors = []; let parent: Element | null = board;
    while (parent) { const s=getComputedStyle(parent); ancestors.push({ tag:parent.tagName, class:parent.className, transform:s.transform, zoom:s.zoom, perspective:s.perspective }); parent=parent.parentElement; }
    const image = board.querySelector('.board-art')!;
    const imageStyle = getComputedStyle(image);
    return {
      square,
      boardShell: rect(board), boardImage: rect(image), tokenLayer: rect(board.querySelector('.board-token-layer')!),
      debugCenter: rect(board.querySelector(`.cell-center[data-square="${square}"]`)! ),
      tokens: anchors.map(anchor => ({
        anchor: rect(anchor), visual: rect(anchor.querySelector('.token-visual')!), dot: rect(anchor.querySelector('.token-center-dot')!),
        anchorInlineTransform: anchor.style.transform, anchorComputedTransform:getComputedStyle(anchor).transform,
        clusterTransform:getComputedStyle(anchor.querySelector('.token-cluster')!).transform,
        visualTransform:getComputedStyle(anchor.querySelector('.token-visual')!).transform,
      })),
      imageStyle: { objectFit:imageStyle.objectFit, padding:imageStyle.padding, margin:imageStyle.margin, border:imageStyle.border, maxHeight:imageStyle.maxHeight, maxWidth:imageStyle.maxWidth },
      ancestors,
    };
  }, square);
}

function validateGeometry(geometry: Awaited<ReturnType<typeof readGeometry>>, cluster = false) {
  const canonical = getCellCenter(geometry.square);
  // Independently verify against the measured raster boundaries before testing DOM projection.
  const x=(measurements.columnEdgesPx[canonical.visualColumn]+measurements.columnEdgesPx[canonical.visualColumn+1])/2;
  const y=(measurements.rowEdgesPx[canonical.visualRow]+measurements.rowEdgesPx[canonical.visualRow+1])/2;
  expect(canonical.artworkX).toBe(x); expect(canonical.artworkY).toBe(y);
  const expectedX=geometry.boardImage.left+geometry.boardImage.width*canonical.normalizedX;
  const expectedY=geometry.boardImage.top+geometry.boardImage.height*canonical.normalizedY;
  for (const key of ['left','top','width','height'] as const) {
    expect(Math.abs(geometry.boardImage[key]-geometry.tokenLayer[key]), `image/layer ${key}`).toBeLessThan(.01);
    expect(Math.abs(geometry.boardImage[key]-geometry.boardShell[key]), `image/shell ${key}`).toBeLessThan(.01);
  }
  expect(Math.abs(geometry.debugCenter.centerX-expectedX)).toBeLessThan(1);
  expect(Math.abs(geometry.debugCenter.centerY-expectedY)).toBeLessThan(1);
  let maxX=0,maxY=0;
  for (const token of geometry.tokens) {
    const dx=Math.abs(token.anchor.centerX-expectedX),dy=Math.abs(token.anchor.centerY-expectedY);
    maxX=Math.max(maxX,dx);maxY=Math.max(maxY,dy);
    expect(dx,`square ${geometry.square} anchor X`).toBeLessThan(1);
    expect(dy,`square ${geometry.square} anchor Y`).toBeLessThan(1);
    expect(token.anchorInlineTransform).toBe('');
    if (!cluster) {
      expect(Math.abs(token.visual.centerX-expectedX)).toBeLessThan(1);
      expect(Math.abs(token.visual.centerY-expectedY)).toBeLessThan(1);
    }
    expect(Math.abs(token.dot.centerX-token.visual.centerX)).toBeLessThan(.05);
    expect(Math.abs(token.dot.centerY-token.visual.centerY)).toBeLessThan(.05);
  }
  if (cluster) {
    const meanX=geometry.tokens.reduce((sum,t)=>sum+t.visual.centerX,0)/geometry.tokens.length;
    const meanY=geometry.tokens.reduce((sum,t)=>sum+t.visual.centerY,0)/geometry.tokens.length;
    expect(Math.abs(meanX-expectedX)).toBeLessThan(.05);
    expect(Math.abs(meanY-expectedY)).toBeLessThan(.05);
  }
  return { expectedX, expectedY, maxX, maxY, geometry };
}

for (const [width,height] of viewports) {
  test(`all 100 squares at ${width}x${height}`,async({page})=>{
    await page.setViewportSize({width,height}); await openHarness(page);
    const boundaryRects=await page.locator('.board-debug-grid > line').evaluateAll(lines=>lines.map(line=>{const r=line.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}}));
    const initial=await readGeometry(page,14);
    expect(boundaryRects).toHaveLength(22);
    for(let i=0;i<11;i++) {
      expect(Math.abs(boundaryRects[i].left-(initial.boardImage.left+initial.boardImage.width*measurements.columnEdgesPx[i]/measurements.imageWidth))).toBeLessThan(1);
      expect(Math.abs(boundaryRects[i+11].top-(initial.boardImage.top+initial.boardImage.height*measurements.rowEdgesPx[i]/measurements.imageHeight))).toBeLessThan(1);
    }
    const results=[];
    for(let square=1;square<=100;square++) {
      await place(page,{square,count:1,cluster:false,scale:1});
      results.push(validateGeometry(await readGeometry(page,square)));
    }
    await place(page,{square:14});
    await page.locator('.board-debug-readout').evaluate(element=>element.removeAttribute('open'));
    await page.screenshot({path:`${out}/debug-${width}x${height}.png`,fullPage:false});
    writeFileSync(`${out}/geometry-${width}x${height}.json`,JSON.stringify(results,null,2));
  });
}

test('orientation resize, shared camera transforms, Motion scale, and clustering',async({page})=>{
  const results=[];
  await page.setViewportSize({width:390,height:844}); await openHarness(page);
  for(const square of [1,14,40,74,100]) {
    await place(page,{square,count:1,cluster:false,scale:1});
    for(const [width,height] of [[390,844],[844,390],[390,844]]) {
      await page.setViewportSize({width,height});
      results.push({kind:'resize',viewport:{width,height},...validateGeometry(await readGeometry(page,square))});
    }
    for(const camera of [{zoom:1,x:0,y:0},{zoom:1.35,x:0,y:0},{zoom:1.35,x:31,y:-22},{zoom:1.2,x:-18,y:27}]) {
      await place(page,{square,camera});
      results.push({kind:'camera',camera,...validateGeometry(await readGeometry(page,square))});
    }
    await place(page,{square,scale:1.4,camera:{zoom:1,x:0,y:0}});
    results.push({kind:'motion-scale',...validateGeometry(await readGeometry(page,square))});
  }
  for(const square of [14,74]) for(const count of [1,2,3,4]) {
    await place(page,{square,count,cluster:true,scale:1,camera:{zoom:1,x:0,y:0}});
    results.push({kind:'cluster',count,...validateGeometry(await readGeometry(page,square),true)});
  }
  writeFileSync(`${out}/geometry-resize-camera-cluster.json`,JSON.stringify(results,null,2));
});

test('actual gameplay DOM rectangles at squares 14 and 74',async({page})=>{
  const results=[];
  await page.setViewportSize({width:390,height:844});
  // Seed an actual saved game; this changes no production rules or board coordinates.
  const state=newGame(['Diagnostic','Other']);state.players[0].position=14;
  await page.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));
  await page.goto('/?debugBoard=1',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Continue journey'}).click();
  await expect(page.locator('.token-anchor[data-player-id="0"]')).toHaveAttribute('data-square','14');
  results.push(validateGeometry(await readGeometry(page,14)));
  await page.screenshot({path:`${out}/gameplay-square14-390.png`});
  // A fresh isolated page gives the second case its own test-only saved-game seed.
  const other=await page.context().browser()!.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await other.route('https://fonts.googleapis.com/**',route=>route.abort());await other.route('https://fonts.gstatic.com/**',route=>route.abort());
  state.players[0].position=74;
  await other.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));
  await other.goto('http://127.0.0.1:3100/?debugBoard=1',{waitUntil:'domcontentloaded'});
  await other.getByRole('button',{name:'Continue journey'}).click();
  await expect(other.locator('.token-anchor[data-player-id="0"]')).toHaveAttribute('data-square','74');
  results.push(validateGeometry(await readGeometry(other,74)));
  await other.screenshot({path:`${out}/gameplay-square74-390.png`});await other.close();
  writeFileSync(`${out}/gameplay-dom.json`,JSON.stringify(results,null,2));
});
