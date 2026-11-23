import {askConfirmation} from './confirmation.mjs';
import {startFocus,focusElapsed,pauseFocus,resumeFocus,finishFocus,focusDayRows,focusDate,focusClock,focusDuration} from './focus-core.mjs';
import {journeyFrame,journeyStages,journeyStep,mountJourney} from './journey.mjs';
import {initMoments} from './moments.mjs';
import {focusLimit,latestSleepMarks} from './focus-core.mjs';
export function initFocusApp({tab,el,button,tell}){
 const by=id=>document.getElementById(id),storage='timing-focus-v1';let data={sessions:[],active:null,posts:[],sleep:null,sleepMarks:[]},previewing=false,previewIndex=0,previewStarted=0,wakeLock=null;
 try{const saved=JSON.parse(localStorage.getItem(storage));if(saved&&Array.isArray(saved.sessions)&&Array.isArray(saved.posts))data={...data,...saved};}catch{tell('学习计时记录未能读取，请先保留备份。');}
 const persist=()=>{try{localStorage.setItem(storage,JSON.stringify(data));return true;}catch{tell('学习记录保存失败，请检查剩余存储空间。');return false;}};
 if(data.active?.target>focusLimit)data.active.target=focusLimit;
 if(!Array.isArray(data.sleepMarks))data.sleepMarks=[];
 data.sleepMarks=latestSleepMarks([...data.sleepMarks,data.sleep?.started]);
 window.hasFocusSession=()=>!!data.active&&data.active.status==='running';
 window.studySnapshot=()=>({version:1,sessions:data.sessions,posts:data.posts,sleep:data.sleep});
 const focus=by('focus'),records=by('focus-records'),sleep=by('sleep');
 const focusArtwork=window.WordloomAndroid?'focus-art/':'android/assets/focus-art/';
 focus.innerHTML=`<div id="focus-setup"><div class="focus-toolbar"><button id="preview-cosmos" type="button">▶ 预览宇宙旅程</button><button id="open-focus-records" type="button">记录</button></div><label class="focus-label">这次学什么<select id="focus-category" aria-label="学习内容"><option>背单词</option><option>英语阅读</option><option>做题</option><option>网课</option><option>阅读</option><option>写作</option><option value="custom">自定义</option></select><input id="focus-custom" maxlength="40" placeholder="输入任务名称" aria-label="自定义任务" hidden></label><div class="focus-settings"><label class="focus-label">目标时长<select id="focus-goal" aria-label="目标时长"><option value="none">无</option><option value="25" selected>25 min</option><option value="45">45 min</option><option value="60">1 h</option><option value="custom">自定义</option></select><input id="focus-minutes" type="number" min="1" max="1140" value="25" aria-label="自定义分钟" hidden></label><label class="focus-label">计时模式<select id="focus-mode" aria-label="计时模式"><option value="normal">自由 · 可以暂停</option><option value="strict">严格 · 不可暂停</option></select></label></div><p id="focus-mode-help" class="muted">切到后台仍计时，结束后记录起止时间。</p><div class="focus-actions"><button id="start-focus" class="primary wide" type="button">开始学习 <span aria-hidden="true">📖</span></button><img class="focus-action-photo study-cat" src="${focusArtwork}study-cat.jpg" alt="在笔记本电脑旁学习的小猫"><button id="open-sleep" class="wide" type="button"><span aria-hidden="true">☾</span> 睡觉了 <span aria-hidden="true">💤</span></button><img class="focus-action-photo sleep-cat" src="${focusArtwork}sleep-cat.jpg" alt="趴在书上睡着的小猫"></div></div><div id="focus-running" hidden><div id="journey-backdrop" aria-hidden="true"></div><div class="focus-top"><button id="leave-focus">‹ 收起</button><span id="focus-mode-badge"></span><button id="focus-pip" hidden>小窗</button><button id="quiet-animation" aria-pressed="false">静止画面</button></div><div class="focus-center"><p id="running-category"></p><div class="orbital-clock"><div class="journey-waves" aria-hidden="true"><i></i><i></i><i></i></div><svg viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="112"/><circle id="focus-progress" cx="120" cy="120" r="112"/><circle id="journey-marker" cx="232" cy="120" r="2.7"/></svg><div class="clock-face"><strong id="focus-elapsed">00:00:00</strong><h2 id="cosmic-stage"></h2></div></div><small id="focus-target"></small><p id="cosmic-note"></p></div><div class="focus-bottom"><p id="focus-status"></p><div id="journey-preview-controls" hidden><button type="button" id="journey-prev" aria-label="上一幕">‹</button><input id="journey-slider" type="range" min="1" max="36" value="1" aria-label="预览阶段"><button type="button" id="journey-next" aria-label="下一幕">›</button></div><div><button id="pause-focus">暂停</button><button id="end-focus">结束学习</button></div><button id="discard-focus">删除本次计时</button></div></div>`;
 records.innerHTML=`<button id="focus-records-back">‹ 返回</button><div class="section-heading"><h2>Timing</h2><input type="date" id="focus-day" aria-label="记录日期"></div><div class="focus-donut" id="focus-donut" role="img"><div><strong id="focus-day-total">0s</strong><span id="focus-day-caption"></span></div></div><div id="focus-legend"></div><div class="section-heading"><h3>时间明细</h3><span id="focus-session-count"></span></div><div id="focus-history"></div><div id="sleep-marks"></div><p class="muted">这里记录主动开启的学习计时。</p><div id="automatic-stats"></div>`;
 sleep.innerHTML=`<div class="sleep-sky"><div class="sleep-stars">✦　·　✧<br>　·　　　✦</div><button id="sleep-back">‹ 返回</button><p class="eyebrow">REST IS PART OF GROWTH</p><div class="sleep-card"><p id="sleep-date"></p><span class="sleep-moon">☾</span><h2>今天就到这里</h2><strong id="sleep-time"></strong><p id="sleep-summary"></p><blockquote id="sleep-quote"></blockquote><p id="sleep-author"></p></div><button id="wake-up">起床了</button></div>`;
 by('automatic-stats').append(by('records').querySelector('.review-duration-card'),by('records').querySelector('.study-panel'));
 by('focus-custom').hidden=true;by('focus-category').onchange=()=>{by('focus-custom').hidden=by('focus-category').value!=='custom';if(!by('focus-custom').hidden)by('focus-custom').focus();};
 by('focus-day').value=focusDate(Date.now());
 const nativeAwake=on=>{if(window.WordloomAndroid?.keepAwake)WordloomAndroid.keepAwake(on);else window.WordloomIOS?.request('keepAwake',{on}).catch(()=>{});};
 async function setAwake(on){nativeAwake(on);try{if(on&&!wakeLock&&navigator.wakeLock)wakeLock=await navigator.wakeLock.request('screen');if(!on&&wakeLock){await wakeLock.release();wakeLock=null;}}catch{}}
 function activeView(){by('focus-setup').hidden=!!data.active||previewing;by('focus-running').hidden=!data.active&&!previewing;document.body.classList.toggle('focus-immersive',(!focus.hidden)&&(!!data.active||previewing));}
 function showFocus(){tab('focus');activeView();tick();}
 function finish(){const session=data.active;if(!session)return;const result=finishFocus(session,Date.now());data.sessions.push(result);data.active=null;persist();setAwake(false);previewing=false;activeView();renderRecords();renderHomeFocus();tell(result.status==='completed'?'已记录 '+focusDuration(result.elapsed):result.status==='interrupted'?'本次提前结束，已标记为中断':'已记录 '+focusDuration(result.elapsed));}
 const previewElapsed=()=>previewIndex*journeyStep+Math.min(journeyStep-1,Math.max(0,performance.now()-previewStarted));
 function viewJourney(){return {visible:!focus.hidden&&(!!data.active||previewing),elapsed:previewing?previewElapsed():focusElapsed(data.active,Date.now()),quiet};}
 function tick(){
  if(data.active&&focusElapsed(data.active,Date.now())>=(data.active.target??focusLimit))finish();
  if(!focus.hidden&&(data.active||previewing)){
   const view=viewJourney(),{index}=journeyFrame(view.elapsed),[title,note]=journeyStages[index];
   by('focus-elapsed').textContent=focusClock(view.elapsed);
   by('cosmic-stage').textContent=title;
   by('cosmic-note').textContent=note;
   by('running-category').textContent=previewing?'宇宙旅程预览':data.active.category;
   by('focus-target').textContent=previewing?'预览时间轴':data.active.target==null?'无目标 · 上限 19 小时':'目标 '+focusDuration(data.active.target);
   by('focus-mode-badge').textContent=previewing?'预览':data.active.mode==='strict'?'严格模式':'自由模式';
   by('focus-status').textContent=(index+1)+' / '+journeyStages.length+(data.active?.status==='paused'?' · 已暂停':'');
   by('journey-preview-controls').hidden=!previewing;
   by('pause-focus').hidden=previewing||data.active?.mode==='strict';
   by('pause-focus').textContent=data.active?.status==='paused'?'继续':'暂停';
   by('discard-focus').hidden=previewing;
   by('focus-pip').hidden=previewing||!window.WordloomAndroid?.supportsFocusWindow?.();
   by('end-focus').textContent=previewing?'关闭预览':'结束学习';
   journey.show(viewJourney);
  }
  renderHomeFocus();
 }
 function renderHomeFocus(){const total=focusDayRows(data.sessions,focusDate(Date.now())).reduce((n,r)=>n+r.duration,0);by('home-focus-total').textContent='今天 '+focusDuration(total);by('home-focus-action').textContent=data.active?'继续 · '+focusClock(focusElapsed(data.active,Date.now())):'开始一段学习';}
 function renderRecords(){const day=by('focus-day').value||focusDate(Date.now()),sessions=data.active?[...data.sessions,finishFocus(data.active,Date.now())]:data.sessions,rows=focusDayRows(sessions,day),groups=new Map();for(const r of rows)groups.set(r.category,(groups.get(r.category)||0)+r.duration);const total=rows.reduce((n,r)=>n+r.duration,0),colors=['#9bbec4','#e4aa8f','#c6b0d7','#d8c580','#8db3a0','#a0b5d3'];let offset=0;const stops=[];by('focus-legend').replaceChildren();let i=0;for(const [category,duration] of groups){const color=colors[i++%colors.length],end=offset+duration/total*360;stops.push(color+' '+offset+'deg '+end+'deg');offset=end;const row=el('div',undefined,'focus-legend-row'),dot=el('i');dot.style.background=color;row.append(dot,el('span',category),el('strong',focusDuration(duration)));by('focus-legend').append(row);}by('focus-donut').style.background=total?'conic-gradient('+stops.join(',')+')':'var(--wash)';by('focus-donut').setAttribute('aria-label',day+' 学习总时长 '+focusDuration(total));by('focus-day-total').textContent=focusDuration(total);by('focus-day-caption').textContent=day;by('focus-session-count').textContent=new Set(rows.map(r=>r.id)).size+' 次';by('focus-history').replaceChildren();const hhmm=ms=>new Date(ms).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});for(const r of rows.sort((a,b)=>b.start-a.start)){const row=el('div',undefined,'focus-history-row');row.append(el('strong',r.category),el('span',hhmm(r.start)+' – '+hhmm(r.end)),el('small',focusDuration(r.duration)+(r.status==='interrupted'?' · 中断':'')));if(data.sessions.some(session=>session.id===r.id)){const remove=button('删除',async()=>{if(!await askConfirmation({title:'删除这条计时记录？',detail:'「'+r.category+'」的整段时长会从学习记录中移除，包括跨日部分。',action:'删除记录',destructive:true}))return;const previous=data.sessions;data.sessions=previous.filter(session=>session.id!==r.id);if(!persist()){data.sessions=previous;return;}renderRecords();renderHomeFocus();});remove.className='remove-session';remove.setAttribute('aria-label','删除 '+r.category+' '+hhmm(r.start)+' 的计时');row.append(remove);}by('focus-history').append(row);}if(!rows.length)by('focus-history').append(el('p','这一天还没有学习计时记录。','muted'));const marks=by('sleep-marks');marks.replaceChildren();for(const at of data.sleepMarks.filter(time=>focusDate(time)===day).sort((a,b)=>b-a)){const line=el('div',undefined,'sleep-record');line.append(el('span','☾ 睡觉了'),el('time',hhmm(at)));marks.append(line);}}
 async function showSleep(){const session=data.active;if(session){if(!await askConfirmation({title:'结束学习，去休息？',detail:session.mode==='strict'&&session.target!=null?'未达目标的严格计时会记为中断。':'本次学习时长会存入 Timing。',action:'结束并休息'}))return;if(data.active===session)finish();}const now=Date.now();const previousSleep=data.sleep,previousMarks=data.sleepMarks;data.sleep={started:now};data.sleepMarks=latestSleepMarks([...previousMarks,now]);if(!persist()){data.sleep=previousSleep;data.sleepMarks=previousMarks;return;}renderRecords();const when=data.sleep.started,quotes=[['要有勇气运用你自己的理解力。','康德 ·《什么是启蒙？》'],['从如此简单的开端，演化出了无数美丽而奇妙的生命形态。','达尔文 ·《物种起源》'],['首要的原则是，别欺骗自己。','理查德·费曼 · 1974 年加州理工学院演讲'],['把每一个难题分成尽可能多、也确有需要的小部分。','勒内·笛卡尔 ·《谈谈方法》']];const day=focusDate(when),d=new Date(when),dayIndex=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000),quote=quotes[dayIndex%quotes.length];by('sleep-date').textContent=day;by('sleep-time').textContent=new Date(when).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});by('sleep-summary').textContent='今天已学习 '+focusDuration(focusDayRows(data.sessions,day).reduce((n,r)=>n+r.duration,0));by('sleep-quote').textContent=quote[0];by('sleep-author').textContent='— '+quote[1];tab('sleep');setAwake(false);}
 by('start-focus').onclick=()=>{try{const category=by('focus-category').value==='custom'?by('focus-custom').value.trim():by('focus-category').value;if(!category){tell('请输入任务名称。');return;}const next=startFocus({category,mode:by('focus-mode').value,minutes:by('focus-goal').value==='none'?null:Number(by('focus-goal').value==='custom'?by('focus-minutes').value:by('focus-goal').value),id:'session-'+Date.now()+'-'+Math.random().toString(36).slice(2)},Date.now());data.active=next;if(!persist()){data.active=null;return;}previewing=false;setAwake(true);activeView();tick();}catch(e){tell(e.message);}};
 by('focus-goal').onchange=()=>{by('focus-minutes').hidden=by('focus-goal').value!=='custom';};
 by('focus-mode').onchange=()=>by('focus-mode-help').textContent=by('focus-mode').value==='strict'?'开始后不可暂停；提前结束会标记中断。':'切到后台仍计时，结束后记录起止时间。';
 by('pause-focus').onclick=()=>{if(!data.active)return;try{data.active=data.active.status==='paused'?resumeFocus(data.active,Date.now()):pauseFocus(data.active,Date.now());persist();setAwake(data.active.status==='running');tick();}catch(e){tell(e.message);}};
 by('end-focus').onclick=async()=>{if(previewing){previewing=false;activeView();return;}const session=data.active;if(session?.mode==='strict'&&session.target!=null&&focusElapsed(session,Date.now())<session.target&&!await askConfirmation({title:'提前结束严格计时？',detail:'这次学习会标记为中断。',action:'结束学习'}))return;if(data.active===session)finish();};
 by('discard-focus').onclick=async()=>{const previous=data.active;if(!previous||previewing)return;if(!await askConfirmation({title:'删除本次计时？',detail:'这段时间将被舍弃。',action:'删除计时',destructive:true})||data.active!==previous)return;data.active=null;if(!persist()){data.active=previous;return;}setAwake(false);activeView();renderRecords();renderHomeFocus();tell('已删除本次计时。');};
 window.focusPipChanged=active=>{document.documentElement.classList.toggle('focus-pip',active);tick();};
 by('focus-pip').onclick=()=>window.WordloomAndroid.openFocusWindow();
 by('leave-focus').onclick=()=>{previewing=false;tab('home');activeView();};
 function selectPreview(index){
  previewIndex=Math.max(0,Math.min(journeyStages.length-1,index));
  previewStarted=performance.now();
  by('journey-slider').value=String(previewIndex+1);
  by('journey-slider').setAttribute('aria-valuetext',journeyStages[previewIndex][0]);
  by('journey-prev').disabled=previewIndex===0;
  by('journey-next').disabled=previewIndex===journeyStages.length-1;
  tick();
 }
 by('preview-cosmos').onclick=()=>{previewing=true;activeView();selectPreview(0);};
 by('journey-slider').oninput=()=>selectPreview(Number(by('journey-slider').value)-1);
 by('journey-prev').onclick=()=>selectPreview(previewIndex-1);
 by('journey-next').onclick=()=>selectPreview(previewIndex+1);
 let quiet=matchMedia('(prefers-reduced-motion: reduce)').matches;by('quiet-animation').setAttribute('aria-pressed',String(quiet));by('quiet-animation').textContent=quiet?'开启动画':'静止画面';by('quiet-animation').onclick=()=>{quiet=!quiet;by('quiet-animation').textContent=quiet?'开启动画':'静止画面';by('quiet-animation').setAttribute('aria-pressed',String(quiet));};
 const journey=mountJourney(by('journey-backdrop'),by('focus-progress'),by('cosmic-note'),by('focus-running').querySelectorAll('.journey-waves i'),by('journey-marker'));
 let timingParent='profile';function showRecords(parent='profile'){timingParent=parent;by('focus-day').value=focusDate(Date.now());renderRecords();tab('focus-records');}
 by('open-focus-records').onclick=()=>showRecords('focus');by('focus-day').onchange=renderRecords;by('focus-records-back').onclick=()=>tab(timingParent);by('open-sleep').onclick=showSleep;by('sleep-back').onclick=()=>tab('home');by('wake-up').onclick=()=>{data.sleep=null;persist();tab('home');};
 by('home-focus').onclick=showFocus;document.querySelector('[data-tab="focus"]').onclick=showFocus;
 window.focusSectionBack=()=>{tab(timingParent);};
 window.focusNavigationChanged=()=>{activeView();if(focus.hidden){previewing=false;setAwake(false);}else if(data.active?.status==='running')setAwake(true);};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){wakeLock=null;tick();if(!focus.hidden&&data.active?.status==='running')setAwake(true);}});
 by('profile-options').prepend(button('🕒 Timing',()=>showRecords()),button('🥭 Moments',()=>openMoments('profile')));
 const openMoments=initMoments({root:by('moments'),tab,el,button,diaryPosts:data.posts});
 by('home-moments').onclick=()=>openMoments('home');
 tick();setInterval(tick,500);renderRecords();activeView();
}



