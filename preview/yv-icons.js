/* Youverse line icons: one stroke style for the whole site (replaces emoji). YVI(name, size, colour) returns inline SVG. */
(function(){
const P={
 /* the five Lights */
 H:'<path d="M3 16.5h18M6.5 20h11"/><path d="M7 16.5a5 5 0 0 1 10 0"/><path d="M12 6.5V4M6.3 9.3 4.6 7.6M17.7 9.3l1.7-1.7"/>',
 F:'<path d="M12 3.2 19.8 7.6v8.8L12 20.8 4.2 16.4V7.6Z"/><path d="M4.4 7.7 12 12l7.6-4.3M12 12v8.6"/>',
 O:'<circle cx="12" cy="12" r="3.8"/><ellipse cx="12" cy="12" rx="9.8" ry="3.9" transform="rotate(-24 12 12)"/>',
 S:'<path d="M11 4.5 12.6 10.4 18.5 12 12.6 13.6 11 19.5 9.4 13.6 3.5 12 9.4 10.4Z"/><path d="M18.5 3.5v3.4M16.8 5.2h3.4"/>',
 C:'<circle cx="12" cy="12" r="8.8"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1Z"/>',
 /* everyday */
 book:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5Z"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 media:'<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/>',
 award:'<circle cx="12" cy="9" r="5.5"/><path d="m9 13.8-1.5 6.7L12 18l4.5 2.5-1.5-6.7"/>',
 flame:'<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4-6.5-4.5-10-2 1.5-3.5 3.5-3.5 6-1-.5-1.8-1.6-2-3-1.6 1.6-3 4-3 7A6.5 6.5 0 0 0 12 21Z"/>',
 stack:'<path d="M12 3.5 21 8l-9 4.5L3 8Z"/><path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5"/>',
 bolt:'<path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6Z"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
 world:'<circle cx="12" cy="12" r="8.8"/><path d="M3.5 12h17M12 3.2a13 13 0 0 1 0 17.6M12 3.2a13 13 0 0 0 0 17.6"/>',
 cap:'<path d="M2.5 9.5 12 5l9.5 4.5L12 14Z"/><path d="M6.5 11.5V16c3 2.2 8 2.2 11 0v-4.5M21.5 9.5V15"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 mail:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
 sparkle:'<path d="M12 3.5 13.7 10.3 20.5 12 13.7 13.7 12 20.5 10.3 13.7 3.5 12 10.3 10.3Z"/>',
 bulb:'<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
 play:'<path d="M8 5.5v13l10-6.5Z"/>'};
window.YVI=function(n,s,c,w){return '<svg class="yvi" viewBox="0 0 24 24" width="'+(s||20)+'" height="'+(s||20)+'" fill="none" stroke="'+(c||'currentColor')+'" stroke-width="'+(w||1.7)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;vertical-align:-0.18em">'+(P[n]||'')+'</svg>';};
window.YVI.paths=P;
})();
