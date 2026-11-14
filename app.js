"use strict";
const $ = id => document.getElementById(id);
const SITE_LAUNCH = "2026-11-18T18:30:00.000Z"; // 19 Nov 2026, 00:00 IST
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DATE_CHOICES = [7, 14, 21, 12, 29, 19, 16, 4, 25, 9, 23, 30];
let content=null, db=null, countdownTimer=null, currentLaunch=SITE_LAUNCH, musicStarted=false, photoFocus=null;
function showOnly(id){["loading","locked","errorScreen","invitation","site"].forEach(key=>$(key).hidden=key!==id)}
function setText(id,text){const el=$(id);if(el)el.textContent=String(text??"")}
function celebrate(n=26){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const host=$("hearts");for(let i=0;i<n;i++){const h=document.createElement('span');h.className='fall-heart';h.style.left=`${Math.random()*100}%`;h.style.setProperty('--duration',`${3+Math.random()*2.8}s`);h.style.setProperty('--size',`${13+Math.random()*18}px`);h.style.setProperty('--color',['#d76386','#e5b2c6','#b383bb','#f8e0d2'][i%4]);h.style.setProperty('--drift',`${Math.round(Math.random()*170-85)}px`);h.style.animationDelay=`${Math.random()*.6}s`;host.append(h);setTimeout(()=>h.remove(),6500)}}
function pad(n){return String(n).padStart(2,'0')}
function updateCountdown(){const secs=Math.max(0,Math.floor((new Date(currentLaunch).getTime()-Date.now())/1000));setText('days',pad(Math.floor(secs/86400)));setText('hours',pad(Math.floor(secs%86400/3600)));setText('minutes',pad(Math.floor(secs%3600/60)));setText('seconds',pad(secs%60));if(secs===0 && countdownTimer){clearInterval(countdownTimer);countdownTimer=null;setTimeout(loadSite,900)}}
function locked(at){currentLaunch=(at&&!Number.isNaN(new Date(at).getTime()))?at:SITE_LAUNCH;showOnly('locked');if(countdownTimer)clearInterval(countdownTimer);countdownTimer=null;const label=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(currentLaunch));setText('lockDate',label+' IST');updateCountdown();if(new Date(currentLaunch).getTime()>Date.now())countdownTimer=setInterval(updateCountdown,1000)}
function errorScreen(message){setText('errorText',message||'Please try again.');showOnly('errorScreen')}
async function loadSite(){
  showOnly('loading');
  // This private offline review is NOT included in the GitHub Pages project.
  if(window.CLIENT_DEMO_DATA){render(window.CLIENT_DEMO_DATA,true);return}
  const config=window.SITE_CONFIG||{};
  if(!config.url || !config.key || !window.supabase){errorScreen('Supabase is not configured yet. Add your Project URL and public key to config.js.');return}
  try{
    db=db||window.supabase.createClient(config.url,config.key);
    const token=new URLSearchParams(location.search).get('review');
    const {data,error}=await db.rpc('get_birthday_site',{p_review_token:token||null});
    if(error)throw error;
    if(data?.state==='preview' || data?.state==='live'){render(data.content,data.state==='preview');return}
    if(data?.state==='locked'){locked(data.launch_at);return}
    errorScreen('This surprise has not been published yet. Please check again soon.');
  }catch(e){console.warn(e);errorScreen('Could not connect to the birthday server. Check the connection and try again.')}
}
function imageFor(role,fallbackIndex=0){const photos=Array.isArray(content.photos)?content.photos.filter(p=>p&&p.url):[];return photos.find(p=>p.role===role)||photos[fallbackIndex]||null}
function putImage(id,photo){const el=$(id);if(!el)return;if(photo?.url){el.src=photo.url;el.alt=photo.caption||'Beautiful memory';el.hidden=false}else{el.hidden=true}}
function render(data,review){
  content=data||{};content.photos=Array.isArray(content.photos)?content.photos:[];
  const name=content.nickname||'Karnee';
  setText('inviteNickname',name);setText('heroText',content.heroMessage);setText('storyText',content.storyMessage);setText('birthdayText',content.birthdayMessage);setText('foreverText',content.foreverMessage);setText('finalText',content.finalMessage);
  setText('signName',content.boyName||'Karna');
  setText('inviteDate',`${(content.birthdayLabel||'19 November').toUpperCase()} · WITH LOVE`);
  document.querySelectorAll('.nick').forEach(el=>el.textContent=name);
  document.querySelector('.hero h1 .nick').textContent=name;
  document.querySelector('.birthday h2 em').textContent=`my ${name}.`;
  document.querySelector('.hero .eyebrow').textContent=`A SPECIAL DAY · ${(content.birthdayLabel||'19 November').toUpperCase()}`;
  document.querySelector('.final h2 em').textContent=`you, ${name}.`;
  document.querySelector('.our-story h2').replaceChildren();
  const storyTitle=document.querySelector('.our-story h2');storyTitle.append(document.createTextNode(content.meetingLabel||'September 2023'),document.createElement('br'),document.createTextNode('Our first hello.'));
  document.querySelector('.invitation-card .invite-sign').textContent=`From ${content.boyName||'Karna'}, with love.`;
  document.querySelector('.navbar .brand').innerHTML='K <i>♡</i> N';
  document.body.dataset.theme=content.theme||'plum';
  putImage('heroImage',imageFor('hero',0));putImage('storyImage',imageFor('story',2));putImage('birthdayImage',imageFor('birthday',1));putImage('foreverImage',imageFor('forever',3));putImage('finalImage',imageFor('final',content.photos.length-1));
  const heroPhoto=imageFor('hero',0);$('invitationPhoto').style.backgroundImage=heroPhoto?.url?`url(${JSON.stringify(heroPhoto.url)})`:'none';
  for(const id of ['heroImage','storyImage','birthdayImage','foreverImage','finalImage']){
    const im=$(id);if(im)im.parentElement.hidden=!im.src||im.hidden;
  }
  const grid=$('gallery');grid.replaceChildren();content.photos.filter(p=>p.url).forEach((p,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='memory-photo';btn.setAttribute('aria-label',`Open memory ${i+1}`);
    const im=document.createElement('img');im.src=p.url;im.loading='lazy';im.alt=p.caption||`Memory ${i+1}`;
    const cap=document.createElement('span');cap.textContent=p.caption||`Memory ${i+1}`;btn.append(im,cap);btn.addEventListener('click',()=>openPhoto(p));grid.append(btn);
  });
  const music=content.music||{};$('musicButton').hidden=!music.url||music.enabled===false;
  $('music').src=music.url||'';$('music').volume=Math.max(0,Math.min(1,Number(music.volume??0.45)));
  $('previewBadge').hidden=!review;showOnly('invitation');
  prepareGame();
}
function openPhoto(photo){photoFocus=document.activeElement;$('lightboxImage').src=photo.url;$('lightboxImage').alt=photo.caption||'Memory';setText('lightboxCaption',photo.caption);$('lightbox').hidden=false;$('closeLightbox').focus()}
function closePhoto(){$('lightbox').hidden=true;$('lightboxImage').removeAttribute('src');photoFocus?.focus()}
$('closeLightbox').addEventListener('click',closePhoto);$('lightbox').addEventListener('click',e=>{if(e.target===$('lightbox'))closePhoto()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('lightbox').hidden)closePhoto()});
function startMusic(){const el=$('music');if(!el.src||$('musicButton').hidden)return;el.play().then(()=>{musicStarted=true;setText('musicLabel','Music on');$('musicButton').setAttribute('aria-pressed','true')}).catch(()=>{musicStarted=false;setText('musicLabel','Tap for music')})}
$('musicButton').addEventListener('click',()=>{if(musicStarted){$('music').pause();musicStarted=false;setText('musicLabel','Music off');$('musicButton').setAttribute('aria-pressed','false')}else startMusic()});
$('openSurprise').addEventListener('click',()=>{showOnly('site');startMusic();celebrate(32);$('home').scrollIntoView({behavior:'instant'});watchSections()});
$('wishButton').addEventListener('click',()=>{celebrate(70);setText('wishResult',`My favourite wish? Your happiness, ${content.nickname||'Karnee'}. ♡`)});
$('retry').addEventListener('click',loadSite);$('retryError').addEventListener('click',loadSite);
function watchSections(){const targets=document.querySelectorAll('section.section');if(!('IntersectionObserver' in window))return;const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){celebrate(12);obs.unobserve(e.target)}})},{threshold:.24});targets.forEach(t=>obs.observe(t))}
function markCorrect(button,host,label,callback){host.querySelectorAll('button').forEach(b=>b.disabled=true);button.classList.add('correct');label.textContent='That is right, my love! ♥';celebrate(42);callback()}
function prepareGame(){
  const game=content.game||{};const rightMonth=String(game.month||'September').slice(0,3).toUpperCase();const rightName=String(game.name||content.nickname||'Karnee').trim().toLowerCase();const rightDate=Number(game.day||19);
  ['game2','game3','final','toGame2','toGame3'].forEach(id=>$(id).hidden=true);
  const months=$('monthOptions');months.replaceChildren();setText('monthResult','');
  MONTHS.forEach(month=>{const b=document.createElement('button');b.type='button';b.textContent=month;b.addEventListener('click',()=>{if(month===rightMonth)markCorrect(b,months,$('monthResult'),()=>$('toGame2').hidden=false);else{setText('monthResult',`A little hint: remember ${content.meetingLabel||'our first meeting'}… ♡`);celebrate(4)}});months.append(b)});
  const names=Array.isArray(game.envelopes)&&game.envelopes.length===3?game.envelopes:['Karna',content.nickname||'Karnee','Neela'];const env=$('envelopes');env.replaceChildren();setText('nameResult','');
  names.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='envelope';b.setAttribute('aria-label','Open closed envelope');b.innerHTML='<span class="flap">✉</span>';b.addEventListener('click',()=>{if(b.classList.contains('open'))return;b.classList.add('open');b.replaceChildren();const name=document.createElement('span');name.className='envelope-name';name.textContent=n;b.append(name);if(n.trim().toLowerCase()===rightName)markCorrect(b,env,$('nameResult'),()=>$('toGame3').hidden=false);else setText('nameResult','A lovely name… but there is one special nickname. Try another! ♡')});env.append(b)});
  const ribbon=$('dateRibbon');ribbon.replaceChildren();setText('dateResult','');
  const options=DATE_CHOICES.includes(rightDate)?DATE_CHOICES:[...DATE_CHOICES.slice(0,11),rightDate];
  options.forEach(day=>{const b=document.createElement('button');b.type='button';b.textContent=day;b.addEventListener('click',()=>{if(day===rightDate)markCorrect(b,ribbon,$('dateResult'),()=>{setTimeout(()=>{$('final').hidden=false;$('final').scrollIntoView({behavior:'smooth'});celebrate(100)},700)});else{setText('dateResult',`Not this one, love. Find our special ${rightDate}th! ♡`);celebrate(3)}});ribbon.append(b)});
}
$('toGame2').addEventListener('click',()=>{$('game2').hidden=false;$('game2').scrollIntoView({behavior:'smooth'});celebrate(20)});
$('toGame3').addEventListener('click',()=>{$('game3').hidden=false;$('game3').scrollIntoView({behavior:'smooth'});celebrate(20)});
loadSite();
