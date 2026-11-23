import test from 'node:test';import assert from 'node:assert/strict';import {parseImport} from './core.mjs';
test('CSV recognizes reversed header and BOM',()=>assert.deepEqual(parseImport('\uFEFFmeaning,word\n苹果,apple'),[{word:'apple',meaning:'苹果'}]));
test('CSV quoted comma and multiline definitions',()=>assert.deepEqual(parseImport('word,meaning\nlook up,"查阅,查询\n向上看"'),[{word:'look up',meaning:'查阅,查询\n向上看'}]));
test('unclosed CSV rejected instead of mismatched definitions',()=>assert.throws(()=>parseImport('word,meaning\napple,"苹果'),/引号/));
