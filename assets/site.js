const menu=document.querySelector('#menu');
const toggle=document.querySelector('#menu-toggle');
const mobileMenu=matchMedia('(max-width:900px)');
const content=[...document.querySelectorAll('main,body>footer,.rail')];
function setMenu(open,restore=false){
  open=!!open&&mobileMenu.matches;
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');
  menu.classList.toggle('open',open);
  document.documentElement.classList.toggle('menu-open',open);
  document.body.classList.toggle('menu-open',open);
  for(const el of content)el.inert=open;
  if(restore)toggle.focus();
  else if(open)menu.querySelector('a')?.focus({preventScroll:true});
}
toggle.addEventListener('click',()=>setMenu(!menu.classList.contains('open')));
menu.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false)});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menu.classList.contains('open')){setMenu(false,true);return;}
  if(event.key==='Tab'&&menu.classList.contains('open')){
    const links=[toggle,...menu.querySelectorAll('a')].filter(el=>el.getClientRects().length);
    const index=links.indexOf(document.activeElement);
    event.preventDefault();
    const next=(index+(event.shiftKey?-1:1)+links.length)%links.length;
    links[next]?.focus({preventScroll:true});
  }
});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header')&&menu.classList.contains('open'))setMenu(false)});
mobileMenu.addEventListener('change',()=>setMenu(false));
const detailButtons=[...document.querySelectorAll('[data-detail]')];
const detailPanels=[...document.querySelectorAll('.mobile-offer-panel')];
function showDetail(key){
  for(const b of detailButtons)b.setAttribute('aria-expanded',String(b.dataset.detail===key));
  for(const panel of detailPanels)panel.hidden=panel.id!=='detail-'+key;
}
for(const b of detailButtons)b.addEventListener('click',()=>{
  const open=b.getAttribute('aria-expanded')==='true';showDetail(open?'':b.dataset.detail);
  if(!open)document.getElementById('detail-'+b.dataset.detail).scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
});
for(const b of document.querySelectorAll('[data-close-detail]'))b.addEventListener('click',()=>{showDetail('');const trigger=detailButtons.find(el=>el.dataset.detail===b.dataset.closeDetail);trigger?.focus();trigger?.scrollIntoView({block:'nearest'})});
matchMedia('(max-width:767px)').addEventListener('change',()=>showDetail(''));
const items=[...document.querySelectorAll('.scene')];
const links=[...document.querySelectorAll('.rail a,#menu a:not([data-request])')];
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
    const active='#'+entry.target.id;
    for(const link of links){
      if(link.hash===active)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    document.body.dataset.scene=entry.target.id;
  }
},{rootMargin:'-25% 0px -45% 0px'});
items.forEach(section=>observer.observe(section));
