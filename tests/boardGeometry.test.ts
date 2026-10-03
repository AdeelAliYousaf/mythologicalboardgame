import { describe, it, expect } from 'vitest';
import { getCellCenter, COLUMN_EDGES_PX, ROW_EDGES_PX } from '../src/game/rules/boardConfig';
import { getTokenClusterOffsets } from '../src/components/board/tokenLayout';

describe('measured artwork geometry', () => {
  it('retains serpentine mapping at diagnostic row ends and inner squares', () => {
    const cases = [[1,0,9,0],[10,0,9,9],[11,1,8,9],[14,1,8,6],[20,1,8,0],[31,3,6,9],[40,3,6,0],[74,7,2,6],[91,9,0,9],[100,9,0,0]];
    for(const [square,logicalRow,visualRow,visualColumn] of cases) expect(getCellCenter(square)).toMatchObject({logicalRow,visualRow,visualColumn});
  });
  it('uses measured rectangular cells for squares 14 and 74', () => {
    expect(getCellCenter(14)).toMatchObject({artworkX:781,artworkY:1191.5});
    expect(getCellCenter(74)).toMatchObject({artworkX:781,artworkY:492.5});
    expect(getCellCenter(1)).toMatchObject({artworkX:118,artworkY:1302.5});
    expect(getCellCenter(100)).toMatchObject({artworkX:118,artworkY:259.5});
  });
  it('preserves nonuniform raster boundary intervals', () => {
    expect(COLUMN_EDGES_PX).toEqual([62,174,268,355,450,591,733,829,914,997,1107]);
    expect(ROW_EDGES_PX).toEqual([219,300,427,558,648,773,917,1013,1131,1252,1353]);
  });
});
describe('cluster origin', () => {
  it('has no singleton offset and centers every multiplayer cluster', () => {
    expect(getTokenClusterOffsets(1)).toEqual([{x:0,y:0}]);
    for(const count of [2,3,4]) {
      const offsets=getTokenClusterOffsets(count);
      expect(offsets.reduce((sum,p)=>sum+p.x,0)).toBeCloseTo(0,12);
      expect(offsets.reduce((sum,p)=>sum+p.y,0)).toBeCloseTo(0,12);
    }
  });
});
