import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseEnglishVoice} from './speech.mjs';

test('browser speech prefers an enhanced American male voice over novelty and other locales',()=>{
 const voice=(name,lang='en-US')=>({name,lang,localService:true});
 const alex=voice('Alex (Enhanced)');
 assert.equal(chooseEnglishVoice([voice('Fred'),voice('Samantha'),voice('Tom','en-GB'),voice('David'),alex]),alex);
 assert.equal(chooseEnglishVoice([voice('Whisper'),voice('Tingting','zh-CN')]),undefined);
 assert.equal(chooseEnglishVoice([voice('Samantha')]),undefined);
 const samantha={...voice('Samantha'),voiceURI:'samantha'};
 assert.equal(chooseEnglishVoice([alex,samantha],'samantha'),alex);
});

