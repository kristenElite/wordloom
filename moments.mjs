import {askConfirmation} from './confirmation.mjs';
import {journalMedia,journalCard,removeGallery} from './journal-media.mjs';
export function initMoments({root,tab,el,button,diaryPosts=[]}){
  const key='timing-moments-v1';let posts=[],importedDiary=false,parent='profile';
  const diaryByRef=new Map(diaryPosts.map((post,index)=>[post.id||'diary-'+index,post]));
  try{const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved))posts=saved;else if(Array.isArray(saved?.posts)){posts=saved.posts.map(post=>({...diaryByRef.get(post.diaryRef),...post}));importedDiary=!!saved.importedDiary;}}catch{}
  const save=()=>localStorage.setItem(key,JSON.stringify({posts:posts.map(post=>post.diaryRef?{diaryRef:post.diaryRef,liked:post.liked,comments:post.comments}:post),importedDiary}));
  if(!importedDiary){posts=[...posts,...Array.from(diaryByRef,([diaryRef,post])=>({...post,diaryRef,liked:false,comments:[]}))].sort((a,b)=>b.created-a.created);importedDiary=true;try{save();}catch{}}
  root.innerHTML=`<button id="moments-back">‹ 我的</button><div class="section-heading moments-heading"><h2>Moments</h2><button id="open-moment-form" type="button" class="primary" aria-expanded="false">＋ 发动态</button></div><form id="moment-form" hidden><textarea name="text" rows="3" maxlength="1000" placeholder="记下这一刻" aria-label="动态内容"></textarea><div class="moment-publish"><button type="button" id="cancel-moment-form">收起</button><button class="primary">发布</button></div></form><p id="moments-status" role="status" class="muted"></p><div id="moments-list"></div>`;
  const form=root.querySelector('form'),list=root.querySelector('#moments-list'),status=root.querySelector('#moments-status');
  const openForm=root.querySelector('#open-moment-form');function composer(open){form.hidden=!open;openForm.setAttribute('aria-expanded',String(open));if(open)form.querySelector('textarea').focus();}openForm.onclick=()=>composer(form.hidden);root.querySelector('#cancel-moment-form').onclick=()=>composer(false);
  const journal=journalMedia(form);
  window.closeMoments=()=>tab(parent);root.querySelector('#moments-back').onclick=window.closeMoments;
  function update(post,changes){const old={...post};Object.assign(post,changes);try{save();return true;}catch{Object.assign(post,old);status.textContent='保存失败，记录未更改。';return false;}}
  function render(){list.replaceChildren();for(const post of posts){
    const card=el('article',undefined,'moment-card'),date=new Date(post.created),head=el('header',date.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'}));
    const footer=el('footer'),details=[post.weather,post.place,post.temperature!=null&&post.temperature!==''?post.temperature+'°C':''].filter(Boolean);
    const context=el('span',details.join(' · '),'moment-context'),actions=el('div',undefined,'moment-actions');
    const heart=button(post.liked?'♥':'♡',()=>{if(update(post,{liked:!post.liked})){heart.textContent=post.liked?'♥':'♡';heart.setAttribute('aria-pressed',String(post.liked));}});heart.setAttribute('aria-label','喜欢');heart.setAttribute('aria-pressed',String(!!post.liked));
    const comments=el('div',undefined,'moment-comments');comments.hidden=true;
    const reply=button('评论 '+post.comments.length,()=>{comments.hidden=!comments.hidden;if(!comments.hidden)comments.querySelector('input').focus();});
    const commentForm=el('form'),input=el('input'),send=el('button','保存');input.required=true;input.maxLength=200;input.placeholder='写一条评论';input.setAttribute('aria-label','评论');commentForm.append(input,send);
    const replies=el('div');for(const text of post.comments)replies.append(el('p',text));
    commentForm.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;if(update(post,{comments:[...post.comments,text]})){replies.append(el('p',text));reply.textContent='评论 '+post.comments.length;input.value='';}};
    comments.append(replies,commentForm);actions.append(heart,reply,el('time',date.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})));const remove=button('删除',async()=>{if(!await askConfirmation({title:'删除这条 Moments？',detail:'这条动态及它的照片、评论会一起删除。',action:'删除动态',destructive:true}))return;const previous=posts;posts=posts.filter(item=>item!==post);try{save();render();}catch{posts=previous;status.textContent='删除失败，记录未更改。';return;}removeGallery(post.images).catch(()=>{});});remove.className='remove-moment';actions.append(remove);footer.append(context,actions);card.append(head);if(post.text)card.append(el('p',post.text,'moment-text'));journalCard(card,post);card.append(footer,comments);list.append(card);
  }if(!posts.length)list.append(el('p','还没有动态。','muted'));}
  const publish=form.querySelector('button[type=submit],.moment-publish .primary');
  form.onsubmit=async e=>{e.preventDefault();const fields=new FormData(form),text=String(fields.get('text')).trim();if(journal.busy||publish.disabled||(!text&&!journal.count))return;
    publish.disabled=true;let media;
    try{media=await journal.storeSnapshot();const post={created:Date.now(),text,temperature:'',liked:false,comments:[],...media};posts.unshift(post);try{save();}catch(error){posts.shift();throw error;}form.reset();composer(false);status.textContent='';render();}
    catch{if(media)removeGallery(media.images).catch(()=>{});status.textContent='保存失败，请检查手机存储空间。';}
    finally{publish.disabled=false;}
  };render();
  return from=>{parent=from;root.querySelector('#moments-back').textContent=from==='home'?'‹ 首页':'‹ 我的';tab('moments');};
}
