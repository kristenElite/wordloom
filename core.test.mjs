import test from 'node:test';import assert from 'node:assert/strict';import {review,parseImport,segments} from './core.mjs';
test('failed recall returns in one minute',()=>assert.equal(review({},0,1000).due,61000));
test('successful recall expands intervals',()=>{let c=review({},2,0);assert.equal(c.interval,1);c=review(c,2,0);assert.equal(c.interval,2.5);assert.equal(c.reviews,2);});
test('rating validation and easy order',()=>{assert.throws(()=>review({},9));assert.ok(review({},3).interval>review({},2).interval);});
test('imports Chinese, tab and CRLF',()=>assert.deepEqual(parseImport('apple,苹果\r\nlook up\t查阅'),[{word:'apple',meaning:'苹果'},{word:'look up',meaning:'查阅'}]));
test('invalid imports rejected atomically',()=>assert.throws(()=>parseImport('apple,苹果\nbad')));
test('highlights complete words and phrases case insensitively',()=>assert.deepEqual(segments('Cat catches a cat. Look up!', [{word:'cat'},{word:'look up'}]).filter(x=>x.hit).map(x=>x.text),['Cat','cat','Look up']));
test('literal regex punctuation is safe',()=>assert.equal(segments('a+b', [{word:'a+b'}]).filter(x=>x.hit).length,1));
