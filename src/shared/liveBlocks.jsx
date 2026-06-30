// ═════════════════════════════════════════════════════════════════════════════
// BLOQUES EN VIVO — anuncios/banners colocados desde el Editor Visual.
// Compartido entre el marketplace (App) y otras pantallas (p. ej. envío intl.).
// Solo lee el layout guardado en localStorage; no depende de los cimientos.
// ═════════════════════════════════════════════════════════════════════════════
export function getPageLayout(page){
  try{ const r=localStorage.getItem('retador_editor'); if(r){ const d=JSON.parse(r); return d[page]||[]; } }catch{}
  return [];
}
// Bloques de anuncio (activos) que el usuario colocó ENTRE el marcador fromId y el toId.
// fromId=null → desde el principio; toId=null → hasta el final.
export function liveSlot(page, fromId, toId){
  const arr=getPageLayout(page).filter(b=>b.active);
  const isSys=b=>b.type==='syszone'||b.type==='productzone';
  let start = fromId==null ? 0 : (arr.findIndex(b=>b.id===fromId)+1);
  if(fromId!=null && start===0) return [];          // ancla no encontrada → nada
  let end = toId==null ? arr.length : arr.findIndex(b=>b.id===toId);
  if(toId!=null && end<0) end=arr.length;
  return arr.slice(start,end).filter(b=>!isSys(b));
}
export function LiveBlock({ b, onNav }){
  const Btn=({txt,act,primary})=> txt ? (
    <button onClick={()=>{ if(act&&onNav) onNav(act); }} style={{
      background: primary?'#fff':'rgba(255,255,255,.16)',
      color: primary?'#111':'#fff',
      border: primary?'none':'1px solid rgba(255,255,255,.45)',
      fontSize:12, fontWeight:800, padding:'9px 18px', borderRadius:22,
      cursor:'pointer', WebkitTapHighlightColor:'transparent'
    }}>{txt}</button>
  ) : null;
  const ov='rgba(0,0,0,.48)';
  const bg=b.image ? `linear-gradient(${ov},${ov}), url(${b.image}) center/cover` : (b.bg||'linear-gradient(135deg,#1a2a5e,#0d1526)');
  return (
    <div style={{ position:'relative', borderRadius:18, overflow:'hidden', padding:'22px 18px',
      background:bg, minHeight: b.type==='hero'?156:112, display:'flex', flexDirection:'column', justifyContent:'center',
      boxShadow:'0 6px 22px rgba(0,0,0,.18)' }}>
      {b.badge && <span style={{ alignSelf:'flex-start', fontSize:9, fontWeight:800, letterSpacing:1.2, color:'#fff', background:'rgba(255,255,255,.18)', padding:'3px 10px', borderRadius:20, marginBottom:9, textTransform:'uppercase' }}>{b.badge}</span>}
      {b.title && <div style={{ fontSize:19, fontWeight:900, color:'#fff', marginBottom:6, lineHeight:1.18, textShadow:'0 1px 8px rgba(0,0,0,.3)' }}>{b.title}</div>}
      {b.sub && <div style={{ fontSize:12, color:'rgba(255,255,255,.82)', marginBottom:14, maxWidth:440, lineHeight:1.5 }}>{b.sub}</div>}
      {(b.cta||b.cta2) && <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
        <Btn txt={b.cta} act={b.ctaAction} primary/>
        <Btn txt={b.cta2} act={b.cta2Action}/>
      </div>}
    </div>
  );
}
// Renderiza el tramo de anuncios entre dos marcadores. No ocupa espacio si está vacío.
export function LiveSlot({ page, from=null, to=null, onNav, pad='12px 16px 4px' }){
  const blocks=liveSlot(page, from, to);
  if(!blocks.length) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, padding:pad }}>
      {blocks.map(b=><LiveBlock key={b.id} b={b} onNav={onNav}/>)}
    </div>
  );
}
