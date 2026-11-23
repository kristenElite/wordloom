let closeOpenThemeMenu;
if(typeof document!=='undefined')document.addEventListener('pointerdown',e=>closeOpenThemeMenu?.(e.target));
// Keep the native value and change event as the source of truth for each existing setting.
export function installThemeSelect(select){
 if(select.multiple||select.classList.contains('theme-select-source'))return;
 const wrap=document.createElement('span'),trigger=document.createElement('button'),menu=document.createElement('span');
 const label=select.getAttribute('aria-label')||select.labels?.[0]?.textContent?.trim()||'选项';
 wrap.className='theme-select';trigger.className='theme-select-trigger';trigger.type='button';trigger.setAttribute('aria-label',label);trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
 menu.className='theme-select-menu';menu.hidden=true;menu.setAttribute('role','listbox');menu.setAttribute('aria-label',label);
 select.before(wrap);wrap.append(trigger,menu,select);select.classList.add('theme-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 function refresh(){trigger.textContent=select.selectedOptions[0]?.textContent||label;trigger.setAttribute('aria-label',label+'：'+trigger.textContent);trigger.disabled=select.disabled;wrap.hidden=select.hidden;}
 function close(restore=false){if(menu.hidden)return;menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(closeOpenThemeMenu===outside)closeOpenThemeMenu=null;if(restore)trigger.focus({preventScroll:true});}
 const outside=target=>{if(!wrap.contains(target))close();};
 function open(){closeOpenThemeMenu?.(wrap);closeOpenThemeMenu=outside;menu.replaceChildren();Array.from(select.options).forEach((option,i)=>{const choice=document.createElement('button');choice.type='button';choice.textContent=option.textContent;choice.disabled=option.disabled;choice.setAttribute('role','option');choice.setAttribute('aria-selected',String(i===select.selectedIndex));choice.onclick=()=>{select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));refresh();close(true);};menu.append(choice);});menu.hidden=false;trigger.setAttribute('aria-expanded','true');const room=window.innerHeight-trigger.getBoundingClientRect().bottom;wrap.classList.toggle('theme-select-above',room<Math.min(menu.scrollHeight,230)&&trigger.getBoundingClientRect().top>room);(menu.querySelector('[aria-selected=true]')||menu.querySelector('button'))?.focus({preventScroll:true});}
 trigger.onclick=()=>menu.hidden?open():close();
 wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}else if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(menu.hidden){open();return;}const options=Array.from(menu.querySelectorAll('button:not(:disabled)')),index=options.indexOf(document.activeElement),next=index+(e.key==='ArrowDown'?1:-1);options[Math.max(0,Math.min(options.length-1,next))]?.focus();}});
 wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))close();});
 select.addEventListener('change',refresh);new MutationObserver(refresh).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled']});refresh();
}
