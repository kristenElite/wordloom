import test from 'node:test';import assert from 'node:assert/strict';import {activeMilliseconds} from './core.mjs';
test('idle review with no action adds no time',()=>assert.equal(activeMilliseconds(1000,2000,0,true),0));
test('background adds no time',()=>assert.equal(activeMilliseconds(1000,2000,1000,false),0));
test('counts only the interval before ten second cutoff',()=>assert.equal(activeMilliseconds(10500,11500,1000,true),500));
test('after cutoff adds no time',()=>assert.equal(activeMilliseconds(12000,13000,1000,true),0));
test('new interaction does not count preceding idle time',()=>assert.equal(activeMilliseconds(20000,21000,20500,true),500));
test('suspended timer does not backfill time',()=>assert.equal(activeMilliseconds(1000,60000,1000,true),0));
