import test from 'node:test';import assert from 'node:assert/strict';import {buildRequest,validateStory,apiError} from './ai.mjs';
test('difficulty and topic are sent to actual model',()=>{const r=buildRequest([{word:'explore',meaning:'探索'}],'荒岛求生','A1');assert.equal(r.model,'deepseek-flash');assert.match(r.messages[0].content,/90-150/);assert.match(r.messages[0].content,/Very common/);assert.match(r.messages[1].content,/荒岛求生/);assert.match(buildRequest([{word:'explore'}],'旅行','C2').messages[0].content,/Literary/);});
test('no selected words blocked',()=>assert.throws(()=>buildRequest([],'旅行','A1')));
const words=[{word:'explore',meaning:'探索'}];const story={title:'Island',text:'We explore the island. '+Array(100).fill('sea').join(' '),translation:'我们探索这座岛屿。',usage:[{word:'explore',explanation:'这里指为了找到水源而实地探查岛屿。'}]};
test('complete structured response accepted',()=>assert.equal(validateStory(story,words,'A1').wordCount,104));
test('missing words cannot pass by substring',()=>assert.throws(()=>validateStory({...story,text:story.text.replace('explore','explored')},words,'A1'),/遗漏/));
test('missing translation and context explanations rejected',()=>{assert.throws(()=>validateStory({...story,translation:''},words,'A1'));assert.throws(()=>validateStory({...story,usage:[]},words,'A1'));});
test('length mismatch preserves complete story and balance error explained',()=>{assert.equal(validateStory(story,words,'C2').text,story.text);assert.match(validateStory(story,words,'C2').lengthNote,/篇幅/);assert.match(apiError(402),/余额不足/);});
