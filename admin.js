"use strict";
const $=id=>document.getElementById(id);
const BUCKET='karnee-media';
const KEYS=['boyName','girlName','nickname','birthdayLabel','meetingLabel','theme','heroMessage','storyMessage','birthdayMessage','foreverMessage','finalMessage'];
let client=null,row=null,photos=[],files=new Map(),audioFile=null,currentAudio='',oldObjectUrls=[];
const validId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
function status(message,bad=false){$('saveStatus').textContent=message;$('saveStatus').style.color=bad?'#aa244c':'#3d744b'}
function setScreen(id){for(const x of ['setup','login','dashboard'])$(x).hidden=x!==id}
function localIST(iso){const d=new Date(iso||'2026-11-18T18:30:00.000Z');return new Date(d.getTime()+330*60000).toISOString().slice(0,16)}
function launchISO(){const v=$('launchAt').value;if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v))throw Error('Please enter a valid opening date and time.');const d=new Date(v+':00+05:30');if(Number.isNaN(d.getTime()))throw Error('Invalid IST launch time.');return d.toISOString()}
function clone(v){return JSON.parse(JSON.stringify(v))}
async function isAdmin(){const {data:{user},error}=await client.auth.getUser();if(error||!user)return false;const check=await client.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(check.error)throw check.error;return Boolean(check.data)}
async function startup(){const conf=window.SITE_CONFIG||{};if(!conf.url||!conf.key||!window.supabase){setScreen('setup');return}client=window.supabase.createClient(conf.url,conf.key);try{if(await isAdmin())await loadEditor();else setScreen('login')}catch(e){setScreen('login');$('loginStatus').textContent=e.message}}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginStatus').textContent='Signing in…';try{const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;if(!await isAdmin()){await client.auth.signOut();throw Error('This email is not in the approved site_admins table.')}await loadEditor()}catch(e){$('loginStatus').textContent=e.message}});
$('logout').addEventListener('click',async()=>{await client.auth.signOut();$('logout').hidden=true;setScreen('login')});
async function loadEditor(){if(!await isAdmin())throw Error('Admin access required.');const {data,error}=await client.from('site_config').select('*').eq('id',1).single();if(error)throw error;row=data;photos=(Array.isArray(row.draft?.photos)?row.draft.photos:[]).map(p=>({...p,id:p.id||validId()}));currentAudio=row.draft?.music?.url||'';audioFile=null;setScreen('dashboard');$('logout').hidden=false;fillForm();showReviewLink(row.review_token)}
function fillForm(){const d=row.draft||{};KEYS.forEach(k=>{$(k).value=d[k]||''});$('theme').value=d.theme||'plum';$('launchAt').value=localIST(row.launch_at);$('musicEnabled').checked=d.music?.enabled!==false;$('musicVolume').value=Math.round(100*Number(d.music?.volume??.45));$('volumeLabel').textContent=$('musicVolume').value+'%';$('musicState').textContent=currentAudio?'Current track is available.':'No audio selected.';const g=d.game||{};$('correctMonth').value=g.month||'September';$('correctName').value=g.name||'Karnee';$('correctDay').value=Number(g.day)||19;const e=g.envelopes||['Karna','Karnee','Neela'];for(let i=0;i<3;i++)$('envelope'+i).value=e[i]||'';drawPhotos()}
function showReviewLink(token){if(!token||!row.review_until||new Date(row.review_until).getTime()<=Date.now()){$('reviewLink').value='';$('openReview').hidden=true;return}const url=new URL('index.html',document.baseURI);url.searchParams.set('review',token);$('reviewLink').value=url.href;$('openReview').href=url.href;$('openReview').hidden=false}
function makeField(title,el){const l=document.createElement('label');l.textContent=title;l.append(el);return l}
function drawPhotos(){const host=$('photoList');host.replaceChildren();photos.forEach((p,index)=>{
  const box=document.createElement('div');box.className='photo-editor';const thumb=document.createElement('img');thumb.className='photo-thumb';thumb.alt=`Preview ${index+1}`;
  if(p.preview||p.url)thumb.src=p.preview||p.url;
  const right=document.createElement('div');const row=document.createElement('div');row.className='row';
  const caption=document.createElement('input');caption.value=p.caption||'';caption.placeholder='Write a sweet caption';caption.maxLength=150;caption.addEventListener('input',()=>p.caption=caption.value);
  const role=document.createElement('select');const roles=[['gallery','Gallery only'],['hero','Opening / Hero'],['birthday','Birthday section'],['story','September story'],['forever','Marriage / Future'],['final','Final completion photo']];roles.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;role.append(o)});role.value=p.role||'gallery';role.addEventListener('change',()=>p.role=role.value);
  row.append(makeField('Caption',caption),makeField('Placement',role));
  const picker=document.createElement('input');picker.type='file';picker.accept='image/png,image/jpeg,image/webp';picker.addEventListener('change',()=>{const file=picker.files?.[0];if(!file)return;if(file.size>10*1024*1024){alert('Image must be under 10 MB.');picker.value='';return}files.set(p.id,file);if(p.preview)URL.revokeObjectURL(p.preview);p.preview=URL.createObjectURL(file);oldObjectUrls.push(p.preview);thumb.src=p.preview});
  const controls=document.createElement('div');controls.className='photo-controls';
  const makeButton=(label,callback)=>{const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.addEventListener('click',callback);controls.append(b)};
  makeButton('↑ Move up',()=>{if(index>0){[photos[index-1],photos[index]]=[photos[index],photos[index-1]];drawPhotos()}});
  makeButton('↓ Move down',()=>{if(index<photos.length-1){[photos[index+1],photos[index]]=[photos[index],photos[index+1]];drawPhotos()}});
  makeButton('Remove',()=>{files.delete(p.id);photos.splice(index,1);drawPhotos()});
  right.append(row,makeField('Choose / replace photo',picker),controls);box.append(thumb,right);host.append(box);
})}
$('addPhoto').addEventListener('click',()=>{photos.push({id:validId(),url:'',caption:'Our beautiful memory ♡',role:'gallery'});drawPhotos()});
$('musicVolume').addEventListener('input',()=>{$('volumeLabel').textContent=$('musicVolume').value+'%'});
$('musicFile').addEventListener('change',()=>{const file=$('musicFile').files?.[0];if(!file)return;if(file.size>15*1024*1024){alert('Audio must be under 15 MB.');$('musicFile').value='';return}audioFile=file;$('musicState').textContent=`New song selected: ${file.name}`;$('musicEnabled').checked=true});
$('removeMusic').addEventListener('click',()=>{currentAudio='';audioFile=null;$('musicFile').value='';$('musicEnabled').checked=false;$('musicState').textContent='Music will be removed after saving.'});
function formData(){const d=clone(row.draft||{});KEYS.forEach(k=>d[k]=$(k).value.trim());d.game={month:$('correctMonth').value.trim(),name:$('correctName').value.trim(),day:Number($('correctDay').value),envelopes:[0,1,2].map(i=>$('envelope'+i).value.trim())};if(!d.game.month||!d.game.name||d.game.day<1||d.game.day>31||d.game.envelopes.some(s=>!s))throw Error('Fill in all game settings and envelope names.');d.music={url:currentAudio,volume:Number($('musicVolume').value)/100,enabled:$('musicEnabled').checked};d.photos=photos.map(p=>({id:p.id,url:p.url||'',caption:p.caption||'',role:p.role||'gallery'}));return d}
async function upload(file,folder){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${folder}/${Date.now()}-${validId()}.${ext}`;const {data,error}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});if(error)throw error;return client.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl}
function ownPath(url){try{const path=new URL(url).pathname;const needle='/object/public/'+BUCKET+'/';const i=path.indexOf(needle);return i===-1?null:decodeURIComponent(path.slice(i+needle.length))}catch{return null}}
async function cleanup(before,after){const urls=c=>[...(c?.photos||[]).map(p=>p.url).filter(Boolean),c?.music?.url].filter(Boolean);const used=new Set([...urls(after.draft),...urls(after.published)]);const old=new Set([...urls(before.draft),...urls(before.published)]);const remove=[...old].filter(url=>!used.has(url)).map(ownPath).filter(Boolean);if(remove.length){const {error}=await client.storage.from(BUCKET).remove(remove);if(error)console.warn('Some old files remained in Storage:',error)}}
async function save(mode='draft'){
  const buttons=[$('saveDraft'),$('publish'),$('createReview')];buttons.forEach(b=>b.disabled=true);status(mode==='publish'?'Scheduling birthday website…':'Saving draft…');
  try{
    if(!await isAdmin())throw Error('Please log in as the approved admin.');
    const next=formData();const before=clone(row);
    for(const p of next.photos){if(files.has(p.id)){p.url=await upload(files.get(p.id),'photos')}}
    if(audioFile)next.music.url=await upload(audioFile,'music');
    const changed={draft:next,launch_at:launchISO(),updated_at:new Date().toISOString()};
    if(mode==='publish')changed.published=next;
    const {data,error}=await client.from('site_config').update(changed).eq('id',1).select('*').single();if(error)throw error;
    row=data;photos=(row.draft.photos||[]).map(p=>({...p}));currentAudio=row.draft.music?.url||'';audioFile=null;$('musicFile').value='';files.clear();oldObjectUrls.forEach(u=>URL.revokeObjectURL(u));oldObjectUrls=[];fillForm();
    await cleanup(before,row);
    status(mode==='publish'?'✓ Published and scheduled! Public content stays locked until the selected IST time.':'✓ Draft saved successfully.');
    return true;
  }catch(e){status('Could not save: '+e.message,true);return false}
  finally{buttons.forEach(b=>b.disabled=false)}
}
$('saveDraft').addEventListener('click',()=>save('draft'));
$('publish').addEventListener('click',()=>save('publish'));
$('createReview').addEventListener('click',async()=>{
  if(!await save('draft'))return;
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);const token=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  const launch=new Date(row.launch_at).getTime();const until=new Date(Math.max(Date.now()+7*86400000,launch+3*86400000)).toISOString();
  const {data,error}=await client.from('site_config').update({review_token:token,review_until:until}).eq('id',1).select('*').single();
  if(error){status('Could not generate link: '+error.message,true);return}row=data;showReviewLink(token);status('✓ Review link ready. Share it privately with the client.');
});
$('revokeReview').addEventListener('click',async()=>{const {data,error}=await client.from('site_config').update({review_token:null,review_until:null}).eq('id',1).select('*').single();if(error){status(error.message,true);return}row=data;showReviewLink(null);status('Preview link revoked. Old links no longer reveal the draft.')});
$('copyReview').addEventListener('click',async()=>{const link=$('reviewLink').value;if(!link){status('Generate a link first.',true);return}try{await navigator.clipboard.writeText(link);status('✓ Review link copied!')}catch{$('reviewLink').select();status('Copy the selected link manually.')}});
startup();
