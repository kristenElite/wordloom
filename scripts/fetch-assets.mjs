import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const timing='https://raw.githubusercontent.com/water0523/RestoreTimingTimer/main/images/';
const libraries={
 'pdf.js':'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
 'pdf.worker.js':'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
 'xlsx.js':'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
 'mammoth.js':'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'
};
const isArt=process.argv[2]==='artwork';
if(!isArt && process.argv[2]!=='vendor')throw Error('Choose vendor or artwork');
const hash=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const assets=isArt?JSON.parse(await readFile(new URL('scripts/timing-images.json',root),'utf8')).map(({name,sha},i)=>({
 target:'android/assets/journey/'+String(i+1).padStart(2,'0')+'.webp', url:timing+name, sha,
 mirror:'https://water0523.github.io/RestoreTimingTimer/images/'+name
})):Object.entries(libraries).map(([name,url])=>({target:'vendor/'+name,url}));
for(const {target,url,sha,mirror} of assets){
 const file=new URL(target,root);
 const existing=await readFile(file).catch(()=>null);
 if(existing && (!sha||hash(existing)===sha))continue;
 async function download(address){
  const response=await fetch(address,{signal:AbortSignal.timeout(25_000)});
  if(!response.ok)throw Error('HTTP '+response.status+' for '+address);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(sha && hash(bytes)!==sha)throw Error('Image changed upstream: '+address);
  return bytes;
 }
 const bytes=await download(url).catch(error=>mirror?download(mirror):Promise.reject(error));
 await mkdir(new URL('./',file),{recursive:true});
 await writeFile(file,bytes);
 console.log(fileURLToPath(file));
}

