import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyFrame,journeyStages,journeyStep,journeyDuration,journeyWavePhase} from './journey.mjs';
import {focusElapsed,pauseFocus,resumeFocus,startFocus} from './focus-core.mjs';

test('the journey covers exactly 36 ordered scenes across 19 hours',()=>{
 assert.equal(journeyDuration,19*3600000);
 assert.equal(journeyStep,1900000);
 assert.equal(journeyStages.length,36);
 assert.equal(journeyStages[0][0],'奇点');
 assert.equal(journeyStages.at(-1)[0],'宇宙毁灭');
 for(let index=0;index<36;index++){
  assert.equal(journeyFrame(index*journeyStep).index,index);
  assert.equal(journeyFrame(index*journeyStep).progress,0);
 }
 assert.equal(journeyFrame(journeyDuration).index,35);
 assert.equal(journeyFrame(journeyDuration).progress,1);
});

test('the image moves left to right at 1.3 times the original speed',()=>{
 const time=[0,5000,10000,15000,20000,30000,40000];
 const expected=[-1,-.5,0,.5,1,0,-1];
 time.forEach((elapsed,index)=>assert.ok(Math.abs(journeyFrame(elapsed/1.3).pan-expected[index])<1e-8));
 assert.ok(journeyFrame(journeyStep).pan-journeyFrame(journeyStep-10).pan<.002);
});

test('three waves expand in staggered cycles tied to elapsed time',()=>{
 assert.deepEqual([0,1,2].map(wave=>journeyWavePhase(5500,wave)),[5500/6000,3500/6000,1500/6000]);
 assert.equal(journeyWavePhase(6500,0),journeyWavePhase(500,0));
});

test('pausing across a boundary freezes the scene until active time reaches it',()=>{
 const started=startFocus({category:'背单词',minutes:null},0);
 const stopped=pauseFocus(started,journeyStep-1000);
 assert.deepEqual(journeyFrame(focusElapsed(stopped,journeyStep+30000)),journeyFrame(journeyStep-1000));
 const resumed=resumeFocus(stopped,journeyStep+30000);
 assert.equal(journeyFrame(focusElapsed(resumed,journeyStep+31000)).index,1);
});

test('focus accepts 19 hours and rejects longer targets',()=>{
 assert.equal(startFocus({category:'背单词',minutes:1140},0).target,journeyDuration);
 assert.throws(()=>startFocus({category:'背单词',minutes:1141},0));
});

