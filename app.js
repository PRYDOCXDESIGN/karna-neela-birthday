
"use strict";

// Karna & Neela — Birthday to Forever
// 19 November 2026, 12:00 AM IST
const $ = id => document.getElementById(id);
const SITE_LAUNCH = "2026-11-18T18:30:00.000Z";

const MONTHS = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC"
];

const DATE_CHOICES = [7,14,21,12,29,19,16,4,25,9,23,30];

const CHAPTERS = [
  {id:"home",title:"A Birthday Wish"},
  {id:"our-story",title:"September 2023"},
  {id:"birthday",title:"Make a Wish"},
  {id:"memories",title:"Our Memories"},
  {id:"forever",title:"The Road Ahead"},
  {id:"game1",title:"Puzzle One · The Month"},
  {id:"game2",title:"Puzzle Two · The Name"},
  {id:"game3",title:"Puzzle Three · The Date"},
  {id:"final",title:"The Last Letter"}
];

let content=null;
let db=null;
let countdownTimer=null;
let currentLaunch=SITE_LAUNCH;
let musicStarted=false;
let photoFocus=null;
let currentChapter=0;
let maxUnlocked=5;

function setText(id,text) {
  const element=$(id);
  if(element) element.textContent=String(text??"");
}

function showOnly(id) {
  ["loading","locked","errorScreen","invitation","site"]
    .forEach(key=>$(key).hidden=key!==id);

  document.body.classList.toggle("chapter-mode",id==="site");
}

function celebrate(count=30) {
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return;

  const host=$("hearts");

  for(let i=0;i<count;i++) {
    const heart=document.createElement("span");
    heart.className="fall-heart";
    heart.style.left=`${Math.random()*100}%`;
    heart.style.setProperty("--duration",`${3+Math.random()*2.8}s`);
    heart.style.setProperty("--size",`${13+Math.random()*18}px`);
    heart.style.setProperty("--color",
      ["#e1aabb","#f8e0d2","#d6a06d","#a46a93"][i%4]
    );
    heart.style.setProperty("--drift",
      `${Math.round(Math.random()*170-85)}px`
    );
    heart.style.animationDelay=`${Math.random()*.55}s`;

    host.appendChild(heart);
    setTimeout(()=>heart.remove(),6500);
  }
}

function pad(n) {
  return String(n).padStart(2,"0");
}

function updateCountdown() {
  const seconds=Math.max(
    0,
    Math.floor(
      (new Date(currentLaunch).getTime()-Date.now())/1000
    )
  );

  setText("days",pad(Math.floor(seconds/86400)));
  setText("hours",pad(Math.floor(seconds%86400/3600)));
  setText("minutes",pad(Math.floor(seconds%3600/60)));
  setText("seconds",pad(seconds%60));

  if(seconds===0 && countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer=null;
    setTimeout(loadSite,950);
  }
}

function locked(at) {
  currentLaunch=
    at&&!Number.isNaN(new Date(at).getTime())
      ?at:SITE_LAUNCH;

  showOnly("locked");

  if(countdownTimer) clearInterval(countdownTimer);
  countdownTimer=null;

  const dateLabel=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",
    day:"numeric",
    month:"long",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit",
    hour12:true
  }).format(new Date(currentLaunch));

  setText("lockDate",dateLabel+" IST");
  updateCountdown();

  if(new Date(currentLaunch).getTime()>Date.now()) {
    countdownTimer=setInterval(updateCountdown,1000);
  }
}

function errorScreen(message) {
  setText("errorText",message||"Please try again.");
  showOnly("errorScreen");
}

async function loadSite() {
  showOnly("loading");

  if(window.CLIENT_DEMO_DATA) {
    render(window.CLIENT_DEMO_DATA,true);
    return;
  }

  const config=window.SITE_CONFIG||{};

  if(!config.url||!config.key||!window.supabase) {
    errorScreen(
      "Supabase is not configured yet. Add your Project URL and public key to config.js."
    );
    return;
  }

  try {
    db=db||window.supabase.createClient(
      config.url,config.key
    );

    const token=new URLSearchParams(
      location.search
    ).get("review");

    const {data,error}=await db.rpc(
      "get_birthday_site",
      {p_review_token:token||null}
    );

    if(error) throw error;

    if(data?.state==="preview"||data?.state==="live") {
      render(data.content,data.state==="preview");
      return;
    }

    if(data?.state==="locked") {
      locked(data.launch_at);
      return;
    }

    errorScreen(
      "This surprise has not been published yet. Please check again soon."
    );

  } catch(e) {
    console.warn(e);
    errorScreen(
      "Could not connect to the birthday server. Check the connection and try again."
    );
  }
}

function imageFor(role,fallbackIndex=0) {
  const photos=Array.isArray(content.photos)
    ?content.photos.filter(p=>p&&p.url)
    :[];

  return photos.find(p=>p.role===role)
    ||photos[fallbackIndex]
    ||null;
}

function putImage(id,photo) {
  const el=$(id);
  if(!el) return;

  if(photo?.url) {
    el.src=photo.url;
    el.alt=photo.caption||"Beautiful memory";
    el.hidden=false;
  } else {
    el.removeAttribute("src");
    el.hidden=true;
  }
}

function render(data,review) {
  content=data||{};
  content.photos=Array.isArray(content.photos)
    ?content.photos:[];

  const name=content.nickname||"Karnee";

  setText("inviteNickname",name);
  setText("heroText",content.heroMessage);
  setText("storyText",content.storyMessage);
  setText("birthdayText",content.birthdayMessage);
  setText("foreverText",content.foreverMessage);
  setText("finalText",content.finalMessage);
  setText("signName",content.boyName||"Karna");

  setText("inviteDate",
    `${(content.birthdayLabel||"19 November").toUpperCase()} · WITH LOVE`
  );

  document.querySelectorAll(".nick")
    .forEach(el=>el.textContent=name);

  document.querySelector(".birthday h2 em").textContent=
    `my ${name}.`;

  document.querySelector(".hero .eyebrow").textContent=
    `A SPECIAL DAY · ${(content.birthdayLabel||"19 November").toUpperCase()}`;

  document.querySelector(".final h2 em").textContent=
    `you, ${name}.`;

  const storyTitle=document.querySelector(".our-story h2");

  storyTitle.replaceChildren(
    document.createTextNode(content.meetingLabel||"September 2023"),
    document.createElement("br"),
    document.createTextNode("Our first hello.")
  );

  document.querySelector(".invitation-card .invite-sign")
    .textContent=`From ${content.boyName||"Karna"}, with love.`;

  document.body.dataset.theme=content.theme||"plum";

  putImage("heroImage",imageFor("hero",0));
  putImage("storyImage",imageFor("story",2));
  putImage("birthdayImage",imageFor("birthday",1));
  putImage("foreverImage",imageFor("forever",3));
  putImage("finalImage",
    imageFor("final",content.photos.length-1)
  );

  const heroPhoto=imageFor("hero",0);

  $("invitationPhoto").style.backgroundImage=heroPhoto?.url
    ?`url(${JSON.stringify(heroPhoto.url)})`
    :"none";

  for(const id of [
    "heroImage","storyImage","birthdayImage",
    "foreverImage","finalImage"
  ]) {
    const el=$(id);
    if(el) el.parentElement.hidden=el.hidden;
  }

  const grid=$("gallery");
  grid.replaceChildren();

  content.photos.filter(p=>p&&p.url).forEach((p,i)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="memory-photo";
    button.setAttribute("aria-label",`Open memory ${i+1}`);

    const img=document.createElement("img");
    img.src=p.url;
    img.loading="lazy";
    img.alt=p.caption||`Memory ${i+1}`;

    const caption=document.createElement("span");
    caption.textContent=p.caption||`Memory ${i+1}`;

    button.append(img,caption);
    button.addEventListener("click",()=>openPhoto(p));
    grid.append(button);
  });

  const music=content.music||{};

  $("musicButton").hidden=
    !music.url||music.enabled===false;

  $("music").src=music.url||"";
  $("music").volume=Math.max(
    0,Math.min(1,Number(music.volume??0.45))
  );

  $("previewBadge").hidden=!review;

  maxUnlocked=5;
  prepareGame();
  showOnly("invitation");
}

function openPhoto(photo) {
  photoFocus=document.activeElement;
  $("lightboxImage").src=photo.url;
  $("lightboxImage").alt=photo.caption||"Memory";
  setText("lightboxCaption",photo.caption);
  $("lightbox").hidden=false;
  $("closeLightbox").focus();
}

function closePhoto() {
  $("lightbox").hidden=true;
  $("lightboxImage").removeAttribute("src");
  photoFocus?.focus();
}

$("closeLightbox").addEventListener("click",closePhoto);

$("lightbox").addEventListener("click",e=>{
  if(e.target===$("lightbox")) closePhoto();
});

document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!$("lightbox").hidden)
    closePhoto();
});

function startMusic() {
  const el=$("music");

  if(!el.src||$("musicButton").hidden) return;

  el.play().then(()=>{
    musicStarted=true;
    setText("musicLabel","Music on");
    $("musicButton").setAttribute("aria-pressed","true");
  }).catch(()=>{
    musicStarted=false;
    setText("musicLabel","Tap for music");
  });
}

$("musicButton").addEventListener("click",()=>{
  if(musicStarted) {
    $("music").pause();
    musicStarted=false;
    setText("musicLabel","Music off");
    $("musicButton").setAttribute("aria-pressed","false");
  } else {
    startMusic();
  }
});

// Show only ONE chapter at a time.
function showChapter(index,withHearts=true) {
  if(
    index<0||
    index>=CHAPTERS.length||
    index>maxUnlocked
  ) return;

  currentChapter=index;

  const info=CHAPTERS[index];
  const isGame=info.id.startsWith("game");

  for(const section of document.querySelectorAll("#site .section")) {
    const visible=section.id===(isGame?"games":info.id);
    section.hidden=!visible;

    if(visible) section.scrollTop=0;
  }

  for(const id of ["game1","game2","game3"]) {
    $(id).hidden=info.id!==id;
  }

  $("chapterHeading").textContent=info.title;
  $("chapterCount").textContent=
    `${pad(index+1)} / ${pad(CHAPTERS.length)}`;

  $("chapterProgress").style.width=
    `${((index+1)/CHAPTERS.length)*100}%`;

  $("chapterNavTitle").textContent=
    info.title.toUpperCase();

  $("chapterBack").disabled=index===0;

  const next=$("chapterNext");
  const finished=index===CHAPTERS.length-1;

  next.disabled=!finished&&index>=maxUnlocked;

  next.textContent=finished
    ?"REPLAY OUR STORY ↺"
    :(index>=5?"UNLOCK NEXT →":"NEXT CHAPTER →");

  next.setAttribute("aria-label",finished
    ?"Replay our story"
    :`Next chapter after ${info.title}`
  );

  const visibleSection=$(isGame?"games":info.id);

  if(visibleSection) {
    visibleSection.classList.remove("chapter-enter");
    void visibleSection.offsetWidth;
    visibleSection.classList.add("chapter-enter");
  }

  if(withHearts) celebrate(index===8?88:22);
  window.scrollTo(0,0);
}

function unlock(index) {
  maxUnlocked=Math.max(maxUnlocked,index);

  if(currentChapter+1<=maxUnlocked) {
    $("chapterNext").disabled=false;
    $("chapterNext").textContent=
      "CONTINUE THE SURPRISE →";
  }
}

$("openSurprise").addEventListener("click",()=>{
  showOnly("site");
  showChapter(0,false);
  startMusic();
  celebrate(34);
});

$("chapterBack").addEventListener("click",()=>{
  showChapter(currentChapter-1);
});

$("chapterNext").addEventListener("click",()=>{
  if(currentChapter===CHAPTERS.length-1)
    showChapter(0);
  else
    showChapter(currentChapter+1);
});

$("heroNext").addEventListener("click",()=>{
  showChapter(1);
});

$("wishButton").addEventListener("click",()=>{
  celebrate(70);
  setText("wishResult",
    `My favourite wish? Your happiness, ${content.nickname||"Karnee"}. ♡`
  );
});

$("retry").addEventListener("click",loadSite);
$("retryError").addEventListener("click",loadSite);

function markCorrect(button,host,label,unlockIndex) {
  host.querySelectorAll("button")
    .forEach(b=>b.disabled=true);

  button.classList.add("correct");
  label.textContent=
    "That's right, my love! ♥ Your next chapter is ready.";

  celebrate(55);
  unlock(unlockIndex);
}

function prepareGame() {
  const game=content.game||{};

  const rightMonth=String(
    game.month||"September"
  ).slice(0,3).toUpperCase();

  const rightName=String(
    game.name||content.nickname||"Karnee"
  ).trim().toLowerCase();

  const rightDate=Number(game.day||19);

  ["game1","game2","game3","final"]
    .forEach(id=>$(id).hidden=true);

  // Game 1: September month
  const months=$("monthOptions");
  months.replaceChildren();
  setText("monthResult","");

  MONTHS.forEach(month=>{
    const b=document.createElement("button");
    b.type="button";
    b.textContent=month;

    b.addEventListener("click",()=>{
      if(month===rightMonth) {
        markCorrect(b,months,$("monthResult"),6);
      } else {
        setText("monthResult",
          `A little hint: remember ${content.meetingLabel||"our first meeting"}… ♡`
        );
        celebrate(5);
      }
    });

    months.append(b);
  });

  // Game 2: Three closed envelopes
  const names=Array.isArray(game.envelopes)&&game.envelopes.length===3
    ?game.envelopes
    :["Karna",content.nickname||"Karnee","Neela"];

  const envelopes=$("envelopes");
  envelopes.replaceChildren();
  setText("nameResult","");

  names.forEach(n=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="envelope";
    b.setAttribute("aria-label","Open a closed envelope");
    b.innerHTML='<span class="flap">✉</span>';

    b.addEventListener("click",()=>{
      if(b.classList.contains("open")) return;

      b.classList.add("open");
      b.replaceChildren();

      const name=document.createElement("span");
      name.className="envelope-name";
      name.textContent=n;
      b.append(name);

      if(n.trim().toLowerCase()===rightName) {
        markCorrect(b,envelopes,$("nameResult"),7);
      } else {
        setText("nameResult",
          "A lovely name… but one special nickname is still waiting. ♡"
        );
      }
    });

    envelopes.append(b);
  });

  // Game 3: Birthday 19 November
  const ribbon=$("dateRibbon");
  ribbon.replaceChildren();
  setText("dateResult","");

  const days=DATE_CHOICES.includes(rightDate)
    ?DATE_CHOICES
    :[...DATE_CHOICES.slice(0,11),rightDate];

  days.forEach(day=>{
    const b=document.createElement("button");
    b.type="button";
    b.textContent=day;

    b.addEventListener("click",()=>{
      if(day===rightDate) {
        markCorrect(b,ribbon,$("dateResult"),8);
      } else {
        setText("dateResult",
          "Not this one, love. Find our special day! ♡"
        );
        celebrate(5);
      }
    });

    ribbon.append(b);
  });
}

loadSite();
