export const journeyDuration = 19 * 60 * 60_000;
export const journeyStages = [
 ['奇点','深空中的光点，作为旅程的起点。'],
 ['大爆炸','宇宙从炽热而致密的早期状态开始膨胀。'],
 ['星云','气体和尘埃聚成孕育恒星的云。'],
 ['太阳系','年轻的太阳被旋转的气体和尘埃盘包围。'],
 ['地球形成','岩石不断聚集，构成早期地球。'],
 ['冥古宙','岩浆、撞击与逐渐冷却的地表。'],
 ['太古代','早期微生物在古老的水域中留下痕迹。'],
 ['元古代','地球的大气和海洋开始经历漫长的变化。'],
 ['震旦纪','柔软的生物在海底形成群落。'],
 ['寒武纪','古老海洋中出现了多种新的动物形态。'],
 ['奥陶纪','浅海礁区内的生命日渐多样。'],
 ['志留纪','早期陆生植物出现在潮湿的岸边。'],
 ['泥盆纪','河流两侧，最早的一批森林逐渐扩展。'],
 ['石炭纪','湿润的沼泽里长着高大的石松类植物。'],
 ['二叠纪','大陆深处，干燥的地貌逐渐展开。'],
 ['三叠纪','早期恐龙开始在陆地上活动。'],
 ['侏罗纪','巨大的蜥脚类恐龙穿过山谷。'],
 ['白垩纪','一次来自太空的撞击改变了地球。'],
 ['古近纪','哺乳动物在新的生态环境里演化。'],
 ['石器时代','石器和火光，是早期人类生活的一部分。'],
 ['古代','河岸的聚落在往来与耕作中成长。'],
 ['部落','人们围着营地生活、劳作和协作。'],
 ['农业革命','耕种和驯养逐渐改变了人类的生活。'],
 ['村庄','固定的住处连成邻里。'],
 ['文字发明','文字让人们能把消息留给远处和后来的人。'],
 ['人群','交易和相遇让街市变得繁忙。'],
 ['近代','远洋航线把相隔很远的港口连了起来。'],
 ['工业革命','蒸汽与机器改变了城市和生产方式。'],
 ['现代','街道、电车和灯光构成日常风景。'],
 ['信息时代','跨越海洋和天空的通信把世界连在一起。'],
 ['城市','暮色里，河流两岸的灯渐渐亮起。'],
 ['未来城市','想象中的未来，城市把更多空间留给绿意。'],
 ['核爆炸','以远景呈现的假想片段。'],
 ['地球毁灭','关于行星远未来的想象。'],
 ['太阳毁灭','太阳在遥远的未来将经历红巨星阶段。'],
 ['宇宙毁灭','把旅程收在一幅遥远未来的想象里。'],
];
export const journeyStep = journeyDuration / journeyStages.length;
const fadeDuration = 1050;
const panLegDuration = 20_000;
const panSpeed = 1.3;
const waveDuration = 6_000;

export function journeyFrame(elapsed) {
 const time = Math.min(journeyDuration, Math.max(0, elapsed));
 const index = Math.min(journeyStages.length - 1, Math.floor(time / journeyStep));
 const phase = time - index * journeyStep;
 const panPhase = ((time * panSpeed) % (2 * panLegDuration)) / panLegDuration;
 const pan = 1 - 2 * Math.abs(1 - panPhase);
 const breath = .9 + .1 * Math.cos(phase / 20_000 * 2 * Math.PI);
 return {index, phase, progress:phase / journeyStep, pan, breath};
}

export function journeyWavePhase(elapsed, wave) {
 const age = elapsed - wave * (waveDuration / 3);
 return age < 0 ? 0 : (age % waveDuration) / waveDuration;
}

export function mountJourney(backdrop, ring, caption, waves, marker) {
 const base = window.WordloomAndroid ? 'journey/' : 'android/assets/journey/';
 const cache = new Map();
 let fadeStart = 0;
 let current;
 let previous;
 let animation = 0;

 function load(index) {
  if (index < 0 || index >= journeyStages.length) return null;
  if (cache.has(index)) return cache.get(index);
  const image = new Image();
  const entry = {index, image, ready:false};
  image.alt = '';
  image.className = 'journey-image';
  image.onload = async () => {
   try { await image.decode(); } catch { /* onload already confirmed the image */ }
   entry.ready = true;
  };
  image.src = base + String(index + 1).padStart(2, '0') + '.webp';
  cache.set(index, entry);
  return entry;
 }

 function draw(view) {
  const frame = journeyFrame(view.elapsed);
  const incoming = load(frame.index);
  load(frame.index + 1);
  const animate = !view.quiet;
  if (incoming.ready && current !== incoming) {
   previous = current;
   current = incoming;
   backdrop.replaceChildren(...(previous ? [previous.image, current.image] : [current.image]));
   fadeStart = view.elapsed;
   for (const index of cache.keys()) {
    if (index !== previous?.index && Math.abs(frame.index - index) > 1) cache.delete(index);
   }
  }

  const opacity = previous && animate ? Math.max(0, Math.min(1, (view.elapsed - fadeStart) / fadeDuration)) : 1;
  const transform = animate ? 'translate3d(' + (frame.pan * 9).toFixed(4) + '%,0,0) scale(1.2)' : 'scale(1)';
  if (current) {
   current.image.style.opacity = opacity;
   current.image.style.transform = transform;
  }
  if (previous) {
   previous.image.style.transform = transform;
   previous.image.style.opacity = '1';
   if (opacity === 1) { previous.image.remove(); previous = null; }
  }
  ring.style.strokeDashoffset = 704 * (1 - frame.progress);
  caption.style.opacity = animate ? frame.breath : 1;
  marker.style.transform = 'rotate(' + (frame.progress * 360).toFixed(3) + 'deg)';
  for (const [index, wave] of waves.entries()) {
   const phase = journeyWavePhase(view.elapsed, index);
   wave.style.transform = 'scale(' + (1 + phase * .55).toFixed(3) + ')';
   wave.style.opacity = animate ? Math.min(phase * 4, 1) * (1 - phase) * .34 : 0;
  }
 }

 return {
  show(getView) {
   if (animation) return;
   const paint = () => {
    animation = 0;
    const view = getView();
    if (!view.visible || (document.hidden && !document.documentElement.classList.contains('focus-pip'))) return;
    draw(view);
    animation = requestAnimationFrame(paint);
   };
   paint();
  },
 };
}

