const text=(x,y,s,extra='')=>`<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="17" fill="#214d59" ${extra}>${s}</text>`;
export function foundationScene(id,input,result,progress){
 const mid='text-anchor="middle"';let b='';
 if(id==='light'){
  b='<rect x="35" y="105" width="95" height="190" rx="18" fill="#435e6c"/><circle cx="120" cy="199" r="34" fill="#ffe2a1"/><path d="M120 165L400 110V290L120 235Z" fill="#ffe5a2" opacity=".65"/><rect x="388" y="90" width="24" height="224" rx="6" fill="#667b82"/>';
  b+=`<path d="M412 110L690 80V320L412 290Z" fill="#ffe29a" opacity="${(100-input)/125}"/><rect x="690" y="65" width="35" height="270" rx="6" fill="rgb(${Math.round(80+(100-input)*1.6)},${Math.round(110+(100-input)*1.3)},${Math.round(120+(100-input)*.9)})"/>`;
  b+=text(88,350,'Source',mid)+text(400,350,`${input}% blocked`,mid)+text(685,378,`${100-input}% transmitted`,mid);
 }else if(id==='vibration'){
  const points=Array.from({length:181},(_,i)=>`${70+i*3.65},${190-input*17*Math.sin(4*Math.PI*(i/180-progress))}`).join(' ');
  b=`<rect x="35" y="60" width="730" height="260" rx="20" fill="#e7f1e8"/><path d="M60 190H740" stroke="#829fa2" stroke-dasharray="5 5"/><polyline points="${points}" stroke="#237877" stroke-width="4" fill="none"/><path d="M730 ${190-input*17}v${input*34}" stroke="#bc862e" stroke-width="4"/>`+text(400,37,'Same repetition rate: 2 cycles per second',mid)+text(400,368,`Peak-to-peak motion: ${input*2} mm`,mid);
 }else if(id==='density'){
  const fraction=Math.min(1,input/1000),sink=input>1000,centerY=sink?290:170-45+90*fraction;
  b='<rect x="115" y="70" width="570" height="280" rx="15" fill="#def1ed" stroke="#6a959c" stroke-width="5"/><path d="M119 170H681V332Q681 347 666 347H134Q119 347 119 332Z" fill="#8eced8"/><path d="M120 170H680" stroke="#fbf9db" stroke-width="3"/>';
  b+=`<rect x="345" y="${centerY-45}" width="110" height="90" rx="6" fill="#ecc878" stroke="#9b7b41" stroke-width="3"/>`+text(400,45,`${input<1000?'Floats':input===1000?'Neutrally buoyant':'Sinks'} · water density 1000 kg/m³`,mid)+text(400,390,`${fraction*100}% submerged${sink?' — fully submerged and sinking':''}`,mid);
 }else if(id==='heat'){
  const temperature=20+input*progress/4.2;
  b='<path d="M260 95v215q0 25 25 25h230q25 0 25-25V95" fill="#d7eee7" stroke="#77969a" stroke-width="5"/><path d="M264 195H536V312Q536 331 515 331H285Q264 331 264 312Z" fill="#96cfd2"/><rect x="353" y="345" width="96" height="20" rx="7" fill="#d5995f"/>';
  b+=`<path d="M600 300V130" stroke="#6c9398" stroke-width="22" stroke-linecap="round"/><path d="M600 300V${300-(temperature-15)*8}" stroke="#d88a6d" stroke-width="12" stroke-linecap="round"/>`+text(400,55,'1 kg liquid water · no phase change',mid)+text(400,175,`${temperature.toFixed(2)}°C`,mid)+text(400,393,`${(input*progress).toFixed(1)} kJ transferred`,mid);
 }else if(id==='circuit'){
  b='<path d="M145 195V100H400M530 100H655V300H145V225" stroke="#3e7784" stroke-width="8" fill="none"/><path d="M120 193H170M130 223H160" stroke="#254755" stroke-width="6"/><path d="M400 100l12-18 24 36 24-36 24 36 24-36 22 18" stroke="#b88b44" stroke-width="6" fill="none"/>';
  b+=text(145,355,'6 V source',mid)+text(465,60,`${input} Ω resistor`,mid)+text(410,205,`I = ${(6/input).toFixed(2)} A`,mid)+text(410,241,`Resistor power = ${(36/input).toFixed(2)} W`,mid)+text(410,385,'One closed path · ideal low-voltage model',mid);
 }else if(id==='heredity'){
  const values=[input/2,50,50-input/2],labels=['AA','Aa','aa'];
  b=text(400,45,`Aa × ${input===0?'aa':input===50?'Aa':'AA'}`,mid)+text(400,82,'Expected genotype percentages — not a promised small-family ratio',mid);
  values.forEach((v,i)=>{const x=200+i*200;b+=`<rect x="${x-55}" y="${300-v*2}" width="110" height="${Math.max(1,v*2)}" rx="8" fill="${i<2?'#ae94c5':'#f0e8cd'}" stroke="#76688b" stroke-width="2"/>`+text(x,330,labels[i],mid)+text(x,365,`${v}%`,mid);});
 }else if(id==='diffusion'){
  const mean=(input+2)/2,inside=mean+(input-2)/2*Math.exp(-10*progress),outside=input+2-inside;
  b='<rect x="75" y="90" width="650" height="220" rx="15" fill="#e6eeeb" stroke="#679396" stroke-width="4"/><path d="M400 92V310" stroke="#6e789b" stroke-width="7" stroke-dasharray="10 8"/>';
  b+=`<rect x="78" y="93" width="318" height="214" fill="#877bbc" opacity="${inside/14}"/><rect x="404" y="93" width="318" height="214" fill="#877bbc" opacity="${outside/14}"/>`;
  b+=text(235,50,'Inside · 1 L',mid)+text(563,50,'Outside · 1 L',mid)+text(235,200,`${inside.toFixed(2)} units/L`,mid)+text(563,200,`${outside.toFixed(2)} units/L`,mid)+text(400,350,`Total dye: ${input+2} units · predicted equilibrium: ${mean} units/L`,mid)+text(400,385,'Membrane passes dye · microscopic movement continues at equilibrium',mid);
 }else if(id==='shadow'){
  const length=1/Math.tan(input*Math.PI/180),scale=110,tip=210+length*scale;
  b='<rect width="800" height="410" fill="#deeeeb"/><path d="M40 290H760" stroke="#917f60" stroke-width="8"/><path d="M210 290V180" stroke="#745e45" stroke-width="10"/>';
  const sunX=Math.max(70,210-130/Math.tan(input*Math.PI/180)),sunY=180-(210-sunX)*Math.tan(input*Math.PI/180);b+=`<circle cx="${sunX}" cy="${sunY}" r="22" fill="#f6cd6e"/><path d="M210 295H${tip}" stroke="#466c74" stroke-width="12"/><path d="M${tip} 290L210 180L80 ${180-(210-80)*Math.tan(input*Math.PI/180)}" stroke="#e4b74e" stroke-width="4" fill="none"/>`;
  b+=text(150,160,'1 m pole',mid)+text(400,55,`Sun elevation: ${input}°`,mid)+text(400,345,`Shadow length: ${length.toFixed(2)} m`,mid)+text(400,382,'Schematic: keep pole height fixed; vary light direction',mid);
 }
 return b;
}
