// Estilos del editor del Generador de Video — los MISMOS valores del prototipo
// aprobado (colores, tamaños, espaciados), solo aislados bajo .rpv para no
// tocar el resto de la app. El claro/oscuro lo decide el tema de RETADOR
// (clase .rpv-dark) en vez de la preferencia del sistema.
export const PROMO_VIDEO_CSS = `
.rpv {
  --bg: #FAF6EF; --surface: #FFFFFF; --surface-2: #F3ECDE; --text: #1E1A14;
  --text-muted: #756A5A; --border: #E7DCC7; --accent: #F26B0F; --accent-dark: #C2540A;
  --accent-tint: #FDEAD9; --success: #1E8E5A; --danger: #C6402E; --track: #EFE6D3;
  --shadow: 0 1px 2px rgba(30,26,20,0.04), 0 8px 24px rgba(30,26,20,0.06);
  font-family: 'Manrope', system-ui, -apple-system, sans-serif;
  min-height: 100%; background: var(--bg); color: var(--text);
}
.rpv.rpv-dark {
  --bg: #17140F; --surface: #221E17; --surface-2: #2B261D; --text: #F3ECDE;
  --text-muted: #B4A995; --border: #3A3325; --accent: #FF8A3D; --accent-dark: #F26B0F;
  --accent-tint: #3A2A18; --track: #362F22;
  --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35);
}
.rpv * { box-sizing: border-box; }
.rpv input, .rpv select, .rpv button, .rpv textarea { font-family: inherit; }
.rpv input::placeholder { color: var(--text-muted); opacity: .7; }
.rpv .wrap { max-width: 1100px; margin: 0 auto; padding: 18px 16px 40px; }
.rpv header.top { display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px; flex-wrap: wrap; }
.rpv header.top .mark { font-weight: 800; font-size: 22px; letter-spacing: -0.01em; }
.rpv header.top .mark span { color: var(--accent); }
.rpv header.top .sub { color: var(--text-muted); font-size: 14px; }
.rpv p.lede { color: var(--text-muted); font-size: 13px; max-width: 66ch; line-height: 1.45; margin: 2px 0 16px; }
.rpv .layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 900px) { .rpv .layout { grid-template-columns: 1fr 320px; align-items: start; } }
.rpv .preview-col { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.rpv .tablist { display: flex; gap: 4px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 4px; margin-bottom: 10px; }
.rpv .tab-btn { flex: 1; border: none; background: none; padding: 9px 8px; border-radius: 9px; font-family: inherit; font-size: 13px; font-weight: 700; color: var(--text-muted); cursor: pointer; }
.rpv .tab-btn[aria-selected="true"] { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
.rpv .tab-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv .tab-panel { display: none; }
.rpv .tab-panel.active { display: block; }
.rpv .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; box-shadow: var(--shadow); }
.rpv .card h3 { margin: 0 0 3px; font-size: 14px; }
.rpv .hint { color: var(--text-muted); font-size: 11.5px; margin: 0 0 9px; line-height: 1.4; }
.rpv .field-label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin: 0 0 5px; display: block; }
.rpv .field-gap { margin-bottom: 12px; }
.rpv input[type="text"] { width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9px; padding: 8px 10px; font-size: 13.5px; font-family: inherit; }
.rpv input[type="text"]:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.rpv .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.rpv .theme-card { border: 1.5px solid var(--border); border-radius: 12px; padding: 9px; cursor: pointer; background: var(--surface-2); text-align: left; font-family: inherit; display: flex; align-items: center; gap: 8px; }
.rpv .theme-card.active { border-color: var(--accent); }
.rpv .theme-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv .theme-swatch { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; }
.rpv .theme-card strong { font-size: 12px; color: var(--text); }
.rpv .swatch-input { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 10px; padding: 6px 10px; background: var(--surface); }
.rpv .swatch-input input[type="color"] { width: 28px; height: 28px; border: none; border-radius: 6px; padding: 0; background: none; cursor: pointer; }
.rpv .swatch-input span { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.rpv .sliders { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.rpv .slider-row { display: flex; align-items: center; gap: 10px; }
.rpv .slider-row + .slider-row { margin-top: 8px; }
.rpv .slider-row label { font-size: 12px; font-weight: 700; color: var(--text-muted); white-space: nowrap; width: 142px; flex-shrink: 0; }
.rpv .slider-row output { font-size: 12px; font-weight: 800; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; }
.rpv .slider-wrap { position: relative; flex: 1; height: 24px; min-width: 80px; }
.rpv .slider-track { position: absolute; left: 0; right: 0; top: 50%; height: 6px; margin-top: -3px; background: var(--track); border-radius: 999px; }
/* Rayita fija de "velocidad ideal": alineada con el centro del botón
deslizante (20px de ancho total) cuando está en el valor por defecto. */
.rpv .slider-default { position: absolute; top: 50%; width: 3px; height: 18px; margin-top: -9px; margin-left: -1.5px; left: calc(10px + (100% - 20px) * var(--pos)); background: var(--text); opacity: 0.55; border-radius: 2px; pointer-events: none; }
.rpv .nice-range { position: absolute; left: 0; top: 0; width: 100%; height: 24px; margin: 0; background: transparent; -webkit-appearance: none; appearance: none; }
.rpv .nice-range::-webkit-slider-runnable-track { height: 24px; background: transparent; }
.rpv .nice-range::-moz-range-track { height: 24px; background: transparent; }
.rpv .nice-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: 2px; border-radius: 50%; background: var(--accent); border: 3px solid var(--surface); box-shadow: 0 1px 4px rgba(0,0,0,0.35); cursor: pointer; }
.rpv .nice-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--accent); border: 3px solid var(--surface); box-shadow: 0 1px 4px rgba(0,0,0,0.35); cursor: pointer; }
.rpv .nice-range:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 999px; }
.rpv .review-row { display: grid; grid-template-columns: 1fr 74px 26px; gap: 6px; align-items: center; margin-bottom: 6px; }
.rpv .review-row select { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9px; font-family: inherit; font-size: 12.5px; padding: 7px 4px; }
.rpv .review-row button { border: none; background: none; color: var(--danger); font-size: 16px; cursor: pointer; padding: 0; }
.rpv .pos-wrap { display: flex; gap: 12px; align-items: center; margin-top: 10px; }
.rpv .pos-phone { width: 76px; height: 124px; border: 2px solid var(--text-muted); border-radius: 14px; padding: 6px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr; gap: 4px; flex-shrink: 0; }
.rpv .pos-phone button { border: 1.5px dashed var(--border); background: var(--surface-2); border-radius: 5px; cursor: pointer; padding: 0; }
.rpv .pos-phone button.active { background: var(--accent); border: 1.5px solid var(--accent); }
.rpv .pos-phone button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.rpv .pos-label { font-size: 12px; color: var(--text-muted); line-height: 1.45; }
.rpv .pos-label strong { color: var(--text); display: block; font-size: 13px; }
.rpv .item { border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; background: var(--surface-2); }
.rpv .item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.rpv .item-head .n { font-size: 12px; font-weight: 700; color: var(--text-muted); }
.rpv .item-head button.remove { background: none; border: none; color: var(--danger); font-size: 12px; font-weight: 600; cursor: pointer; padding: 2px 4px; font-family: inherit; }
.rpv .emoji-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.rpv .emoji-btn { width: 36px; height: 36px; border-radius: 9px; border: 1.5px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 19px; line-height: 1; padding: 0; }
.rpv .emoji-btn.active { border-color: var(--accent); background: var(--accent-tint); }
.rpv .emoji-btn.more { font-size: 20px; font-weight: 700; color: var(--accent-dark); font-family: inherit; border-style: dashed; }
.rpv .emoji-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv .picker { margin-top: 8px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); padding: 8px; }
.rpv .picker-cats { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; margin-bottom: 8px; }
.rpv .picker-cats::-webkit-scrollbar { display: none; }
.rpv .cat-chip { border: 1px solid var(--border); background: var(--surface-2); color: var(--text-muted); border-radius: 999px; padding: 4px 10px; font-size: 11.5px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit; }
.rpv .cat-chip.active { background: var(--accent-tint); color: var(--accent-dark); border-color: var(--accent); }
.rpv .picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 4px; }
.rpv .picker-grid button { height: 36px; border: none; border-radius: 8px; background: none; font-size: 21px; cursor: pointer; padding: 0; }
.rpv .picker-grid button:hover, .rpv .picker-grid button:focus-visible { background: var(--surface-2); outline: none; }
.rpv .picker-custom { display: flex; gap: 6px; margin-top: 8px; }
.rpv .picker-custom button { border: none; background: var(--accent); color: #fff; border-radius: 9px; padding: 0 12px; font-weight: 700; font-size: 12.5px; cursor: pointer; font-family: inherit; }
.rpv .picker-note { font-size: 11px; color: var(--danger); margin-top: 5px; min-height: 0; }
.rpv .photo-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.rpv .photo-thumb { width: 40px; height: 40px; border-radius: 9px; object-fit: cover; border: 1px solid var(--border); }
.rpv button.upload-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px dashed var(--border); border-radius: 9px; padding: 7px 11px; font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; background: var(--surface); font-family: inherit; }
.rpv button.upload-btn:hover { border-color: var(--accent); color: var(--accent-dark); }
.rpv button.upload-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv button.remove-photo { background: none; border: none; color: var(--danger); font-size: 12px; cursor: pointer; font-family: inherit; }
.rpv .price-box { margin-top: 10px; border-top: 1px dashed var(--border); padding-top: 9px; }
.rpv .price-title { font-size: 12px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
.rpv .price-title span { font-weight: 600; color: var(--text-muted); }
.rpv .price-row { display: grid; grid-template-columns: 1fr 1fr 92px; gap: 6px; }
.rpv .price-field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.rpv .price-field span { font-size: 10.5px; font-weight: 700; color: var(--text-muted); line-height: 1.2; }
.rpv .price-field input, .rpv .price-field select { font-size: 13px; padding: 7px 8px; }
.rpv .price-field select { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9px; font-family: inherit; }
.rpv .pct-row { display: flex; align-items: center; gap: 7px; margin-top: 7px; font-size: 11.5px; color: var(--text); cursor: pointer; }
.rpv .pct-row strong { color: var(--accent-dark); }
.rpv .pct-row.off { color: var(--text-muted); cursor: default; }
.rpv button.add-item { background: none; border: none; color: var(--accent-dark); font-weight: 700; font-size: 13px; cursor: pointer; padding: 4px 0; font-family: inherit; }
.rpv button.add-item:disabled { color: var(--text-muted); cursor: default; }
.rpv .preview-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 12px 10px; box-shadow: var(--shadow); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.rpv .phone { width: 190px; aspect-ratio: 9 / 16; background: #0D0B08; border-radius: 30px; padding: 8px; box-shadow: var(--shadow); }
.rpv .phone canvas { width: 100%; height: 100%; border-radius: 22px; display: block; background: #F7F3EA; }
.rpv .empty-state { font-size: 12px; color: var(--text-muted); text-align: center; max-width: 200px; margin: 0; }
.rpv .carousel-nav { display: flex; align-items: center; justify-content: center; gap: 10px; }
.rpv .carousel-viewport { width: 190px; overflow: hidden; border-radius: 12px; }
.rpv .style-carousel { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.rpv .style-carousel::-webkit-scrollbar { display: none; }
.rpv .style-slide { flex: 0 0 100%; width: 100%; scroll-snap-align: center; border: 1.5px solid var(--border); border-radius: 12px; padding: 11px; background: var(--surface-2); text-align: left; cursor: pointer; font-family: inherit; color: var(--text); }
.rpv .style-slide.active { border-color: var(--accent); background: var(--accent-tint); }
.rpv .style-slide-icon { font-size: 20px; line-height: 1; margin-bottom: 5px; display: block; }
.rpv .style-slide strong { display: block; font-size: 13px; margin-bottom: 2px; }
.rpv .style-slide span.desc { font-size: 11px; color: var(--text-muted); line-height: 1.35; display: block; }
.rpv .style-slide:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv .carousel-arrow { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font-size: 15px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; }
.rpv .carousel-arrow:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv .carousel-arrow:disabled { opacity: 0.35; cursor: default; }
.rpv .carousel-dots { display: flex; gap: 6px; }
.rpv .carousel-dot { width: 7px; height: 7px; border-radius: 50%; border: none; padding: 0; background: var(--border); cursor: pointer; }
.rpv .carousel-dot.active { background: var(--accent); width: 18px; border-radius: 4px; }
.rpv .carousel-hint { font-size: 11px; color: var(--text-muted); text-align: center; margin: 0; }
.rpv .fps-badge { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-muted); font-weight: 600; text-align: center; max-width: 260px; }
.rpv .fps-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
.rpv button.ghost { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; }
.rpv button.ghost:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.rpv .action-card { margin-top: 10px; }
.rpv button.primary { width: 100%; background: var(--accent); color: #fff; border: none; border-radius: 12px; padding: 13px 16px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; }
.rpv button.primary:hover { background: var(--accent-dark); }
.rpv button.primary:disabled { background: var(--border); color: var(--text-muted); cursor: default; }
.rpv button.primary:focus-visible { outline: 2px solid var(--accent-dark); outline-offset: 2px; }
.rpv .progress-wrap { margin-top: 10px; display: none; }
.rpv .progress-wrap.show { display: block; }
.rpv .progress-track { width: 100%; height: 8px; background: var(--track); border-radius: 999px; overflow: hidden; }
.rpv .progress-fill { height: 100%; width: 0%; background: var(--accent); border-radius: 999px; }
.rpv .progress-label { font-size: 12px; color: var(--text-muted); margin-top: 6px; display: flex; justify-content: space-between; }
.rpv .status { font-size: 13px; margin-top: 10px; display: none; }
.rpv .status.show { display: block; }
.rpv .status.error { color: var(--danger); }
.rpv .status.success { color: var(--success); font-weight: 700; }
.rpv a.download-link { display: block; text-align: center; margin-top: 10px; background: var(--success); color: #fff; text-decoration: none; border-radius: 10px; padding: 11px 14px; font-weight: 700; font-size: 14px; }
.rpv .export-detail { font-size: 11.5px; color: var(--text-muted); text-align: center; margin-top: 6px; }
.rpv details.tech { margin-top: 12px; font-size: 12px; color: var(--text-muted); }
.rpv details.tech summary { cursor: pointer; font-weight: 600; }
.rpv details.tech div { margin-top: 6px; line-height: 1.55; }
`;
