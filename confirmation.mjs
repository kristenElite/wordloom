let activeConfirmation;

export function cancelConfirmation(){
 if(!activeConfirmation?.open)return false;
 activeConfirmation.close('cancel');
 return true;
}

export function askConfirmation({title,detail,action,destructive=false}){
 if(activeConfirmation)return Promise.resolve(false);
 const dialog=document.createElement('dialog');
 dialog.className='theme-confirmation';
 dialog.setAttribute('aria-labelledby','confirmation-title');
 dialog.innerHTML='<form method="dialog"><h2 id="confirmation-title"></h2><p id="confirmation-detail"></p><div class="confirmation-actions"><button value="cancel" autofocus>取消</button><button value="accept" class="confirmation-action"></button></div></form>';
 dialog.querySelector('h2').textContent=title;
 const description=dialog.querySelector('p');
 description.textContent=detail||'';
 description.hidden=!detail;
 if(detail)dialog.setAttribute('aria-describedby',description.id);
 const accept=dialog.querySelector('.confirmation-action');
 accept.textContent=action;
 if(destructive)accept.classList.add('confirmation-delete');
 const origin=document.activeElement;
 activeConfirmation=dialog;
 document.body.append(dialog);
 return new Promise(resolve=>{
  dialog.addEventListener('close',()=>{
   dialog.remove();
   activeConfirmation=null;
   origin?.focus({preventScroll:true});
   resolve(dialog.returnValue==='accept');
  },{once:true});
  dialog.showModal();
 });
}

