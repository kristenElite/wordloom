const noveltyVoice = /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Trinoids|Whisper|Wobble|Zarvox|Fred|eSpeak)\b/i;
const maleVoice = /\b(Male|Alex|Tom|Evan|Nathan|Aaron|Matthew|Guy|David|Andrew|Christopher|Eric|Roger)\b/i;

export function englishVoices(voices) {
 const candidates=voices.filter(voice=>/^en(?:[-_]US)$/i.test(voice.lang)&&maleVoice.test(voice.name)&&!noveltyVoice.test(voice.name));
 const rank=voice=> (/\b(Premium|Enhanced|Natural|Neural)\b/i.test(voice.name)?10:0) +
  (voice.localService?3:0) + (voice.default?1:0);
 return candidates.sort((a,b)=>rank(b)-rank(a));
}

export function chooseEnglishVoice(voices,preferred='') {
 const candidates=englishVoices(voices);
 return candidates.find(voice=>voice.voiceURI===preferred)||candidates[0];
}

