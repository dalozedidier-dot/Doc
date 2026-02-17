
function $(sel){return document.querySelector(sel);}
function $all(sel){return Array.from(document.querySelectorAll(sel));}

function scrollToPage(n){
  const el = document.getElementById(`p${n}`);
  if(!el) return false;
  el.scrollIntoView({behavior:'smooth', block:'start'});
  return true;
}

function currentPage(){
  const pages = $all('.page');
  let best = null;
  let bestTop = -Infinity;
  const y = window.scrollY || document.documentElement.scrollTop;
  for(const p of pages){
    const rect = p.getBoundingClientRect();
    const top = rect.top;
    if(top <= 120 && top > bestTop){
      bestTop = top;
      best = p;
    }
  }
  if(!best) best = pages[0];
  if(!best) return null;
  const id = best.id || '';
  const m = id.match(/^p(\d+)$/);
  return m ? parseInt(m[1],10) : null;
}

function updatePageIndicator(){
  const n = currentPage();
  const ind = $('#pageIndicator');
  if(ind && n!==null) ind.textContent = `Page ${n}`;
  const inp = $('#pageInput');
  if(inp && n!==null && document.activeElement !== inp) inp.value = n;
}

window.addEventListener('scroll', () => {
  window.requestAnimationFrame(updatePageIndicator);
});

window.addEventListener('DOMContentLoaded', () => {

  // Clean up common extraction artefacts across ALL pages.
  const norm = (s) => (s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/^\s*(?:[•\u2022\-]+)\s+/, '')
    .replace(/^\s*\d+\s*[\.\)]\s+/, '');

  const shouldDrop = (t) => {
    if(!t) return false;
    return /K\?\?/.test(t) || /EOtext/.test(t) || /□square□/.test(t);
  };

  const fixInline = (t) => {
    if(!t) return t;
    t = t.replace(/EOtext/g, '');
    t = t.replace(/□square□/g, '').replace(/□/g, '');
    t = t.replace(/\b(Q\d)(?:\1){1,}\b/g, '$1');
    // remove the placeholder duplicate enforcement lines
    t = t.replace(/(?:\b3\.\s*enforcement\s*\(\?K\?\?B\)\s*,\s*)+/gi, '');
    // normalize @ subscript
    t = t.replace(/@_on/g, '@_{\\mathrm{on}}');
    // wrap a few common math fragments if they are not already in MathJax delimiters
    if(!/\\\(|\\\[/.test(t)){
      t = t.replace(/Δ\s*d\(t\)/g, '\\(\\Delta d(t)\\)');
      t = t.replace(/@\s*\(t\)/g, '\\(@(t)\\)');
      t = t.replace(/\b([POERGL])\(t\)/g, (m,p1)=>`\\(${p1}(t)\\)`);
      t = t.replace(/G\(t\)\s*(?:≥|>=)\s*G_[A-Za-z]+/g, (m)=>`\\(${m.replace('≥','\\\\ge ').replace('>=','\\\\ge ')}\\)`);
      t = t.replace(/@_\{\\mathrm\{on\}\}/g, '\\(@_{\\mathrm{on}}\\)');
    }
    return t;
  };

  for(const page of $all('.page')){
    const last = [];
    for(const el of Array.from(page.querySelectorAll('p, li'))){
      const raw = (el.textContent || '').trim();
      if(shouldDrop(raw) && raw.length < 160){
        el.remove();
        continue;
      }
      const fixed = fixInline(raw);
      if(fixed !== raw){
        el.textContent = fixed;
      }
      const key = `${el.tagName}:${norm(el.textContent)}`;
      const k = norm(el.textContent);
      if(k && last.includes(key) && k.length >= 12){
        el.remove();
        continue;
      }
      last.push(key);
      if(last.length > 6) last.shift();
    }
  }

      prevKey = key;
    }
  }

  const prev = $('#btnPrev');
  const next = $('#btnNext');
  const go = $('#btnGo');
  const inp = $('#pageInput');

  if(prev) prev.addEventListener('click', () => {
    const n = currentPage();
    if(n!==null) scrollToPage(Math.max(1, n-1));
  });
  if(next) next.addEventListener('click', () => {
    const n = currentPage();
    const max = parseInt(document.body.dataset.maxPage || '1',10);
    if(n!==null) scrollToPage(Math.min(max, n+1));
  });
  if(go) go.addEventListener('click', () => {
    const n = parseInt(inp.value,10);
    if(!Number.isFinite(n)) return;
    scrollToPage(n);
  });
  if(inp) inp.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const n = parseInt(inp.value,10);
      if(Number.isFinite(n)) scrollToPage(n);
    }
  });

  updatePageIndicator();
});
