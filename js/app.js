/* ============================================================
   app.js — 渲染 / 抽取 / 记录 / 存储
   ============================================================ */
'use strict';

/* ---------- 存储 ---------- */
const LS_KEY = 'fit-almanac-v1';
let state = load();
function load(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || { logs:{}, ui:{} }; }
  catch{ return { logs:{}, ui:{} }; }
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

/* ---------- 日期工具 ---------- */
function dkey(d=new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const TODAY = dkey();

/* ---------- 配额随机抽取 ---------- */
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];} return a; }

function sample(dayKey){
  const day = PLAN[dayKey];
  const q = day.quota;
  const picked = [];
  if(dayKey==='A'){
    // 胸 3
    picked.push(...shuffle(day.exercises.filter(e=>e.group==='chest')).slice(0,q.chest));
    // 肩 3，至少 1 个后束
    const rear = shuffle(day.exercises.filter(e=>e.group==='shoulder'&&e.rear));
    const front = shuffle(day.exercises.filter(e=>e.group==='shoulder'&&!e.rear));
    const sh = [rear[0]];
    const rest = shuffle([...rear.slice(1),...front]).slice(0,q.shoulder-1);
    picked.push(...sh,...rest);
  }else{
    for(const g in q){
      picked.push(...shuffle(day.exercises.filter(e=>e.group===g)).slice(0,q[g]));
    }
  }
  return picked.map(e=>e.id);
}

/* 取今日训练（无则生成） */
function ensureToday(){
  if(!state.logs[TODAY]){
    const day = suggestDay();
    state.logs[TODAY] = { day, sel: sample(day), rec:{} };
    save();
  }
  return state.logs[TODAY];
}
function suggestDay(){
  const dates = Object.keys(state.logs).filter(k=>k!==TODAY).sort();
  if(!dates.length) return 'A';
  const last = state.logs[dates[dates.length-1]].day;
  return CYCLE[(CYCLE.indexOf(last)+1)%CYCLE.length];
}

/* ---------- 人体肌肉发力图 ---------- */
function bodySVG(mp=[], ms=[]){
  const pri=new Set(mp), sec=new Set(ms);
  const c = k => 'part'+(pri.has(k)?' pri':sec.has(k)?' sec':'');
  return `<svg viewBox="0 0 132 116" width="100%">
    <!-- 正面 -->
    <text class="bodylbl" x="33" y="113" text-anchor="middle">FRONT</text>
    <circle class="silhouette" cx="33" cy="10" r="6"/>
    <rect class="silhouette" x="31" y="15" width="4" height="4"/>
    <!-- 三角肌前/中 -->
    <ellipse class="${c('f-delt')}" cx="22" cy="24" rx="5.2" ry="5"/>
    <ellipse class="${c('f-delt')}" cx="44" cy="24" rx="5.2" ry="5"/>
    <!-- 胸 -->
    <path class="${c('f-chest')}" d="M24 22 H32 V35 Q28 38 24 35 Z"/>
    <path class="${c('f-chest')}" d="M34 22 H42 V35 Q38 38 34 35 Z"/>
    <!-- 腹直肌 -->
    <rect class="${c('f-abs')}" x="28" y="37" width="10" height="18" rx="3"/>
    <!-- 腹斜肌 -->
    <path class="${c('f-obliques')}" d="M24 38 h3 v15 l-3 -2 Z"/>
    <path class="${c('f-obliques')}" d="M42 38 h-3 v15 l3 -2 Z"/>
    <!-- 二头 -->
    <rect class="${c('f-biceps')}" x="16" y="26" width="5.5" height="15" rx="2.5"/>
    <rect class="${c('f-biceps')}" x="44.5" y="26" width="5.5" height="15" rx="2.5"/>
    <!-- 前臂 -->
    <rect class="${c('f-forearm')}" x="15" y="42" width="5" height="14" rx="2.3"/>
    <rect class="${c('f-forearm')}" x="46" y="42" width="5" height="14" rx="2.3"/>
    <circle class="silhouette" cx="17.5" cy="59" r="2.6"/>
    <circle class="silhouette" cx="48.5" cy="59" r="2.6"/>
    <!-- 髋 -->
    <path class="silhouette" d="M27 55 h12 l1 7 q-7 3 -14 0 Z"/>
    <!-- 股四头 -->
    <rect class="${c('f-quads')}" x="26" y="62" width="6.2" height="26" rx="3"/>
    <rect class="${c('f-quads')}" x="33.8" y="62" width="6.2" height="26" rx="3"/>
    <rect class="silhouette" x="27" y="89" width="5" height="18" rx="2.5"/>
    <rect class="silhouette" x="34" y="89" width="5" height="18" rx="2.5"/>

    <!-- 背面 -->
    <text class="bodylbl" x="99" y="113" text-anchor="middle">BACK</text>
    <circle class="silhouette" cx="99" cy="10" r="6"/>
    <!-- 斜方肌 -->
    <path class="${c('b-traps')}" d="M93 16 h12 l-2 9 h-8 Z"/>
    <!-- 后束 -->
    <ellipse class="${c('b-delt')}" cx="88" cy="24" rx="5.2" ry="5"/>
    <ellipse class="${c('b-delt')}" cx="110" cy="24" rx="5.2" ry="5"/>
    <!-- 中背 -->
    <rect class="${c('b-midback')}" x="93" y="25" width="12" height="9" rx="2"/>
    <!-- 背阔 -->
    <path class="${c('b-lats')}" d="M92 34 h6 v12 l-7 -3 Z"/>
    <path class="${c('b-lats')}" d="M106 34 h-6 v12 l7 -3 Z"/>
    <!-- 下背 -->
    <rect class="${c('b-lowback')}" x="94" y="46" width="10" height="9" rx="2"/>
    <!-- 三头 -->
    <rect class="${c('b-triceps')}" x="82" y="26" width="5.5" height="15" rx="2.5"/>
    <rect class="${c('b-triceps')}" x="110.5" y="26" width="5.5" height="15" rx="2.5"/>
    <rect class="silhouette" x="81" y="42" width="5" height="14" rx="2.3"/>
    <rect class="silhouette" x="111" y="42" width="5" height="14" rx="2.3"/>
    <!-- 臀中肌 -->
    <ellipse class="${c('b-glutemed')}" cx="89" cy="58" rx="3.4" ry="4.5"/>
    <ellipse class="${c('b-glutemed')}" cx="109" cy="58" rx="3.4" ry="4.5"/>
    <!-- 臀大肌 -->
    <path class="${c('b-glute')}" d="M92 55 q7 -2 14 0 q1 9 -7 9 q-8 0 -7 -9 Z"/>
    <!-- 腘绳肌 -->
    <rect class="${c('b-hams')}" x="92" y="64" width="6.2" height="24" rx="3"/>
    <rect class="${c('b-hams')}" x="99.8" y="64" width="6.2" height="24" rx="3"/>
    <!-- 小腿 -->
    <rect class="${c('b-calves')}" x="93" y="89" width="5" height="18" rx="2.5"/>
    <rect class="${c('b-calves')}" x="100" y="89" width="5" height="18" rx="2.5"/>
  </svg>`;
}

/* ---------- 渲染：今日 ---------- */
function renderToday(){
  const log = ensureToday();
  const day = PLAN[log.day];
  const exs = log.sel.map(id => findEx(id)).filter(Boolean);
  const doneCount = exs.filter(e=>log.rec[e.id]?.done).length;

  // 头牌
  document.getElementById('dayHead').innerHTML = `
    <div class="day-tag">
      <div class="day-letter">${day.key}</div>
      <div class="day-meta">
        <div class="day-cycle">DAY ${day.key} · 三练循环</div>
        <div class="day-title">${day.title}</div>
        <div class="day-en">${day.en}</div>
      </div>
    </div>
    <div class="day-note">${day.note}</div>`;

  // 日切换
  document.getElementById('daySwitch').innerHTML = CYCLE.map(k=>`
    <button class="${k===log.day?'on':''}" data-day="${k}">${k}
      <span class="zh">${PLAN[k].title.replace(/ · /g,'·')}</span></button>`).join('');

  // 进度环
  const pct = exs.length ? doneCount/exs.length : 0;
  const R=24, C=2*Math.PI*R;
  document.getElementById('progress').innerHTML = `
    <div class="ring">
      <svg width="54" height="54">
        <circle class="bg" cx="27" cy="27" r="${R}" fill="none" stroke-width="5"/>
        <circle class="fg" cx="27" cy="27" r="${R}" fill="none" stroke-width="5"
          stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}"/>
      </svg>
      <div class="num">${doneCount}</div>
    </div>
    <div class="progress-txt"><b>今日进度 ${doneCount}/${exs.length}</b>
      ${doneCount===exs.length?'全部完成，干得漂亮 💪':'完成动作点击右侧圆钮打勾'}</div>
    <button class="reroll" id="rerollBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
      换一组</button>`;

  // 卡片
  document.getElementById('cards').innerHTML = exs.map((e,i)=>{
    const r = log.rec[e.id]||{};
    const labels = [...e.mp,...e.ms].map(m=>MUSCLE_LABELS[m]).filter(Boolean);
    return `<div class="card ${r.done?'done':''}" style="animation-delay:${i*60}ms" data-id="${e.id}">
      <div class="card-top">
        <div class="idx">${String(i+1).padStart(2,'0')}</div>
        <div class="binfo">
          <div class="bname">${e.name}</div>
          <div class="bsub">${e.sub}</div>
          <div class="bmeta">
            <span class="tag">${e.sets} × ${e.reps}</span>
            <span class="tag alt">间歇 ${e.rest}s</span>
          </div>
        </div>
        <div class="bodywrap">${bodySVG(e.mp,e.ms)}
          <div class="mlabel">${labels.slice(0,2).join(' · ')}</div></div>
      </div>
      <ul class="cues">${e.cues.map(c=>`<li>${c}</li>`).join('')}</ul>
      ${e.img?`<div class="demo"><img src="${e.img}" alt="${e.name}" loading="lazy"
          onerror="this.parentNode.innerHTML='<div class=ph><b>演示图待补充</b>可在 plan.js 填入动图链接</div>'"></div>`:''}
      <div class="rec">
        <div class="fld"><label>重量 KG</label>
          <input type="number" inputmode="decimal" placeholder="—" value="${r.w??''}" data-f="w"></div>
        <div class="fld"><label>完成次数</label>
          <input type="number" inputmode="numeric" placeholder="${e.reps}" value="${r.r??''}" data-f="r"></div>
        <button class="toggle" data-act="toggle" aria-label="完成">
          <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

function findEx(id){
  for(const k of CYCLE){ const e=PLAN[k].exercises.find(x=>x.id===id); if(e) return e; }
  return null;
}

/* ---------- 事件：今日 ---------- */
document.addEventListener('click', e=>{
  // 切换日
  const ds = e.target.closest('[data-day]');
  if(ds){ const k=ds.dataset.day; const log=state.logs[TODAY];
    if(log.day!==k){ log.day=k; log.sel=sample(k); save(); renderToday(); }
    return; }
  // 换一组
  if(e.target.closest('#rerollBtn')){
    const log=state.logs[TODAY]; log.sel=sample(log.day); log.rec={}; save();
    e.target.closest('#rerollBtn').classList.add('shuf');
    renderToday(); toast('已换一组新动作'); return; }
  // 完成切换
  const tg = e.target.closest('[data-act="toggle"]');
  if(tg){ const card=tg.closest('.card'); const id=card.dataset.id;
    const log=state.logs[TODAY]; const r=log.rec[id]||(log.rec[id]={});
    r.done=!r.done; save(); renderToday();
    if(r.done) toast('已记录完成 ✓'); return; }
});
// 输入记录
document.addEventListener('input', e=>{
  const inp=e.target.closest('input[data-f]'); if(!inp) return;
  const card=inp.closest('.card'); const id=card.dataset.id;
  const log=state.logs[TODAY]; const r=log.rec[id]||(log.rec[id]={});
  r[inp.dataset.f] = inp.value; save();
});

/* ---------- 渲染：历史日历 ---------- */
let calRef = new Date();
function renderHistory(){
  const y=calRef.getFullYear(), m=calRef.getMonth();
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();
  const wd=['日','一','二','三','四','五','六'];
  let cells = wd.map(w=>`<div class="wd">${w}</div>`).join('');
  for(let i=0;i<first;i++) cells+=`<div class="cell pad"></div>`;
  for(let d=1;d<=days;d++){
    const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const log=state.logs[key];
    const done = log && Object.values(log.rec).some(r=>r.done);
    const cls = done?log.day:'';
    cells+=`<div class="cell ${cls} ${key===TODAY?'today':''}">${d}${done?`<span class="dot"></span>`:''}</div>`;
  }
  document.getElementById('history').innerHTML = `
    <div class="sec-title">训练日历</div>
    <div class="cal">
      <div class="cal-head">
        <button data-cal="-1">‹</button>
        <div class="cal-month">${y} . ${String(m+1).padStart(2,'0')}</div>
        <button data-cal="1">›</button>
      </div>
      <div class="cal-grid">${cells}</div>
      <div class="legend">
        <span><i style="background:var(--rust)"></i>A 胸肩</span>
        <span><i style="background:var(--clay)"></i>B 背臂</span>
        <span><i style="background:var(--olive)"></i>C 臀腿</span>
      </div>
    </div>
    ${statsHTML()}`;
}
function statsHTML(){
  const all=Object.entries(state.logs);
  const sessions=all.filter(([k,l])=>Object.values(l.rec).some(r=>r.done));
  const exDone=all.reduce((s,[k,l])=>s+Object.values(l.rec).filter(r=>r.done).length,0);
  const ym=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
  const monthSess=sessions.filter(([k])=>k.startsWith(ym)).length;
  return `<div class="stat-row">
    <div class="stat"><b>${monthSess}</b><span>本月训练</span></div>
    <div class="stat"><b>${sessions.length}</b><span>累计训练</span></div>
    <div class="stat"><b>${exDone}</b><span>完成动作</span></div>
  </div>`;
}
document.addEventListener('click', e=>{
  const c=e.target.closest('[data-cal]');
  if(c){ calRef.setMonth(calRef.getMonth()+ +c.dataset.cal); renderHistory(); }
});

/* ---------- 渲染：我的 ---------- */
function renderProfile(){
  document.getElementById('profile').innerHTML = `
    <div class="sec-title">我的档案</div>
    <div class="profile">
      <h3>身体数据</h3>
      <div class="pgrid">
        <div class="pitem"><div class="k">身高 CM</div><div class="v">158</div></div>
        <div class="pitem"><div class="k">体重 KG</div><div class="v">57</div></div>
        <div class="pitem"><div class="k">体脂率</div><div class="v">30%</div></div>
        <div class="pitem"><div class="k">BMI</div><div class="v">22.8</div></div>
      </div>
      <div class="goal">🎯 目标：减脂塑形 + 提臀（recomposition）。上肢求紧致线条，下肢全程髋主导提臀线、控腿围。</div>
    </div>
    <div class="profile">
      <h3>数据备份</h3>
      <div class="btn-row">
        <button class="btn solid" id="exportBtn">⬇ 导出备份</button>
        <button class="btn" id="importBtn">⬆ 导入恢复</button>
      </div>
      <input type="file" id="importFile" accept="application/json" hidden>
      <div class="hint">记录保存在本机浏览器。换设备或清缓存前请先导出备份。<br>
      想加入动作演示动图？在 <b>js/plan.js</b> 中给动作填 <b>img</b> 链接即可。</div>
    </div>`;
}
document.addEventListener('click', e=>{
  if(e.target.closest('#exportBtn')){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`健身记录_${TODAY}.json`; a.click(); toast('已导出备份文件'); }
  if(e.target.closest('#importBtn')) document.getElementById('importFile').click();
});
document.addEventListener('change', e=>{
  if(e.target.id!=='importFile'||!e.target.files[0]) return;
  const fr=new FileReader();
  fr.onload=()=>{ try{ const d=JSON.parse(fr.result);
    if(d&&d.logs){ state=d; if(!state.ui)state.ui={}; save(); switchView('today'); toast('导入成功'); }
    else toast('文件格式不正确'); }catch{ toast('文件解析失败'); } };
  fr.readAsText(e.target.files[0]);
});

/* ---------- 导航 ---------- */
function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+v));
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.view===v));
  if(v==='today') renderToday();
  if(v==='history') renderHistory();
  if(v==='profile') renderProfile();
}
document.addEventListener('click', e=>{
  const nb=e.target.closest('.nav button'); if(nb) switchView(nb.dataset.view);
});

/* ---------- toast ---------- */
let toastT;
function toast(msg){
  let t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),1800);
}

/* ---------- 启动 ---------- */
document.getElementById('dateChip').textContent =
  new Date().toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',weekday:'short'});
switchView('today');
