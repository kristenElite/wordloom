// Optional integration adapter. No network calls occur until explicitly invoked.
export class StudySyncClient {
 constructor(baseUrl,token){const url=new URL(baseUrl);if(url.protocol!=='https:')throw Error('同步服务必须使用 HTTPS');this.base=url.href.replace(/\/$/,'');this.token=token;}
 async request(path,method='GET',body){const response=await fetch(this.base+path,{method,headers:{Authorization:'Bearer '+this.token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('同步失败：'+response.status);return response.json();}
 friends(){return this.request('/v1/friends');}
 daily(userId,day){return this.request('/v1/users/'+encodeURIComponent(userId)+'/study?day='+encodeURIComponent(day));}
 uploadSessions(sessions){return this.request('/v1/study/sessions','PUT',{sessions});}
 publish(text){return this.request('/v1/posts','POST',{text});}
 feed(){return this.request('/v1/posts');}
}
