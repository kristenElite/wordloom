import test from 'node:test';import assert from 'node:assert/strict';import {startFocus,pauseFocus,resumeFocus,finishFocus,focusElapsed,focusDayRows,focusDate,latestSleepMarks,focusLimit} from './focus-core.mjs';import {nightPalettes} from './appearance.mjs';
const make=(mode='normal',now=1000)=>startFocus({category:'英语',mode,minutes:25,id:'test'},now);
test('background elapsed restored from persisted session',()=>assert.equal(focusElapsed(JSON.parse(JSON.stringify(make())),61000),60000));
test('pause excludes idle interval',()=>{let s=pauseFocus(make(),11000);s=resumeFocus(s,51000);assert.equal(focusElapsed(s,61000),20000);});
test('strict cannot pause and early end marked interrupted',()=>{assert.throws(()=>pauseFocus(make('strict'),2000));assert.equal(finishFocus(make('strict'),11000).status,'interrupted');});
test('completion caps at target even after background suspension',()=>{const s=finishFocus(make(),9000000);assert.equal(s.elapsed,1500000);assert.equal(s.ended,1501000);assert.equal(s.status,'completed');});
test('midnight splits duration without duplication',()=>{const now=new Date(2026,10,22,23,55).getTime(),s=finishFocus(make('normal',now),now+600000);assert.equal(focusDayRows([s],focusDate(now))[0].duration,300000);assert.equal(focusDayRows([s],focusDate(now+600000))[0].duration,300000);});
test('five distinct night palettes',()=>{assert.equal(new Set(Object.values(nightPalettes).map(x=>x.glow)).size,5);});
test('open timer survives serialization, can end in strict mode, and caps at 19h',()=>{const s=JSON.parse(JSON.stringify(startFocus({category:'背词',mode:'strict',minutes:null},1000)));assert.equal(focusElapsed(s,61000),60000);assert.equal(finishFocus(s,61000).status,'ended');assert.equal(finishFocus(s,2*focusLimit).elapsed,focusLimit);});

test('sleep marks retain the latest tap per local calendar day',()=>{
 const early=new Date(2026,10,22,21,30).getTime();
 const late=new Date(2026,10,22,23,45).getTime();
 const tomorrow=new Date(2026,10,23,0,30).getTime();
 assert.deepEqual(latestSleepMarks([tomorrow,late,early,late]),[late,tomorrow]);
});
