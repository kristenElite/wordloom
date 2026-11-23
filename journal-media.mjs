let pendingAlbum;
const momentPhotoLimit=20;
let galleryDatabase;
function openGallery(){
 if(!galleryDatabase)galleryDatabase=new Promise((resolve,reject)=>{const request=indexedDB.open('wordloom-moment-photos',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}).catch(error=>{galleryDatabase=null;throw error;});
 return galleryDatabase;
}
async function storeGallery(photos){
 if(!photos.length)return [];
 const db=await openGallery(),ids=photos.map(()=>`photo:${Date.now().toString(36)}-${Array.from(crypto.getRandomValues(new Uint32Array(3)),n=>n.toString(36)).join('-')}`);
 await new Promise((resolve,reject)=>{const transaction=db.transaction('photos','readwrite'),store=transaction.objectStore('photos');photos.forEach((src,i)=>store.put(src,ids[i]));transaction.oncomplete=resolve;transaction.onabort=()=>reject(transaction.error);});return ids;
}
async function loadGalleryPhoto(id){const db=await openGallery();return new Promise((resolve,reject)=>{const request=db.transaction('photos').objectStore('photos').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function removeGallery(photos){const ids=(photos||[]).filter(src=>src.startsWith('photo:'));if(!ids.length)return;const db=await openGallery();await new Promise((resolve,reject)=>{const transaction=db.transaction('photos','readwrite'),store=transaction.objectStore('photos');ids.forEach(id=>store.delete(id));transaction.oncomplete=resolve;transaction.onabort=()=>reject(transaction.error);});}
window.receiveJournalPhoto=(encoded,mime,done=true)=>{const callback=pendingAlbum;if(done)pendingAlbum=null;callback?.(encoded?`data:${mime};base64,${encoded}`:null,done);};

export function journalMedia(form){
 const controls=document.createElement('div');controls.className='journal-controls';
 controls.innerHTML='<button type="button">＋ 相册</button><span class="moment-swatches" role="group" aria-label="发布卡片底色"></span><input type="file" accept="image/*" multiple hidden><div class="journal-draft"></div>';
 form.querySelector('button').before(controls);
 const file=controls.querySelector('input'),preview=controls.querySelector('.journal-draft'),palette=controls.querySelector('.moment-swatches'),pick=controls.querySelector('button');
 let busy=false,photos=[],cardColor='paper';
 const colors=[['paper','白色'],['cream','奶油'],['pink','浅粉'],['green','薄荷'],['slate','深灰']];
 function selectColor(value){cardColor=value;for(const swatch of palette.children)swatch.setAttribute('aria-pressed',String(swatch.dataset.swatch===value));}
 for(const [value,label] of colors){const swatch=document.createElement('button');swatch.type='button';swatch.dataset.swatch=value;swatch.setAttribute('aria-label',label);swatch.title=label;swatch.onclick=()=>selectColor(value);palette.append(swatch);}selectColor('paper');
 function render(){preview.replaceChildren();photos.forEach((src,index)=>{const item=document.createElement('div'),img=new Image(),remove=document.createElement('button');img.src=src;img.alt='待发布照片';remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','移除照片 '+(index+1));remove.onclick=()=>{photos.splice(index,1);render();};item.append(img,remove);preview.append(item);});pick.textContent=busy?'读取照片…':photos.length?`相册 ${photos.length}/${momentPhotoLimit}`:'＋ 相册';pick.disabled=busy||photos.length>=momentPhotoLimit;}
 async function attach(src){if(!src||photos.length>=momentPhotoLimit)return;try{const img=new Image();img.src=src;await img.decode();const scale=Math.min(1,1440/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);photos.push(canvas.toDataURL('image/jpeg',.80));}catch{window.alert('这张图片无法打开，请尝试 JPG、PNG 或 WebP。');}finally{render();}}
 pick.onclick=()=>{if(window.WordloomAndroid?.pickJournalPhoto){busy=true;render();let queue=Promise.resolve();pendingAlbum=(src,done)=>{if(src)queue=queue.then(()=>attach(src));if(done)queue.finally(()=>{busy=false;render();});};WordloomAndroid.pickJournalPhoto(momentPhotoLimit-photos.length);}else file.click();};
 file.onchange=async()=>{const selected=Array.from(file.files).slice(0,momentPhotoLimit-photos.length);busy=true;render();try{for(const photo of selected){const url=URL.createObjectURL(photo);try{await attach(url);}finally{URL.revokeObjectURL(url);}}}finally{busy=false;file.value='';render();}};
 form.addEventListener('reset',()=>{photos=[];selectColor('paper');render();});
 return {get busy(){return busy;},get count(){return photos.length;},async storeSnapshot(){const selected=[...photos],color=cardColor;return {images:await storeGallery(selected),color};}};
}

export function journalCard(card,post){
 card.dataset.journalColor=['paper','cream','pink','green','slate'].includes(post.color)?post.color:'paper';
 const media=document.createElement('div');media.className='journal-gallery';
 for(const value of post.images||[]){if(typeof value!=='string'||!value.startsWith('photo:')&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value))continue;const img=new Image(),open=document.createElement('button');img.alt='动态照片';img.loading='lazy';open.type='button';open.className='journal-photo';open.setAttribute('aria-label','查看大图');open.append(img);open.onclick=()=>{if(img.getAttribute('src'))openJournalPhoto(img.src,open);};media.append(open);if(value.startsWith('photo:'))loadGalleryPhoto(value).then(src=>{if(src)img.src=src;else img.alt='照片不可用';}).catch(()=>{img.alt='无法读取照片';});else img.src=value;}
 if(media.childElementCount)card.append(media);
}

function openJournalPhoto(src,trigger){
 const overlay=document.createElement('div');overlay.className='journal-photo-view';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','照片大图');
 const close=document.createElement('button'),image=new Image();close.type='button';close.textContent='‹ 返回';image.src=src;image.alt='动态照片大图';overlay.append(close,image);
 const previous=document.body.style.overflow;
 window.closeJournalPhoto=()=>{overlay.remove();document.body.style.overflow=previous;window.closeJournalPhoto=null;trigger.focus({preventScroll:true});return true;};
 close.onclick=window.closeJournalPhoto;overlay.onclick=e=>{if(e.target===overlay)window.closeJournalPhoto();};overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();window.closeJournalPhoto();}else if(e.key==='Tab'){e.preventDefault();close.focus();}};
 document.body.style.overflow='hidden';document.body.append(overlay);close.focus();
}
