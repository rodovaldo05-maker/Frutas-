// Formas híbridas e completas das frutas de fera do FRUTO Laboratório Voxel, Edição 18,
// trazidas do HTML (FRUTO_Laboratorio_Voxel_Edicao_18.html) sem alterar modelos nem lógica:
// FRUTOWolf (Lobo), FRUTOFalcon (Falcão), FRUTOMythBeast (Besta), FRUTOMythPhoenix (Fênix),
// FRUTOMythEast (Dragão Oriental) e FRUTOMythWest (Dragão Ocidental), mais os sinais de
// dinâmica dos animais. Únicas adições: export e registerActions (golpes M1 novos nas tabelas
// de ação do Lobo e do Falcão; ver combat/formM1.js). Recebem o THREE como parâmetro (T).
/* eslint-disable */
/* Two separately articulated silhouettes share a coat palette and a forward axis (+Z). */
export const FRUTOWolf=(()=>{
 const colors={ink:'#303849',back:'#46536a',coat:'#718099',side:'#93a1af',pale:'#c6cfcf',cream:'#e8e3d4',amber:'#ffba58',nose:'#272c37',mouth:'#674755',claw:'#eed6ac',saddle:'#54667d',throat:'#dddccf',flank:'#a7b3bd',pad:'#655663',guard:'#889aaa'};
 const cache=new Map(),materials=new Map(),sides=[['E',1],['D',-1]],tau=2*Math.PI;
 const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
 const fileNames={hibrida:'Lobo_Hibrido.glb',completa:'Lobo_Completo.glb'};
 function specs(data,form){
  const parts=[],add=(id,parent,pivot)=>parts.push({id,parent,pivot,rotation:[0,0,0]});
  if(form==='hibrida')parts.push(...data.segments);
  else {
   add('dorso',null,[0,1.45,0]);add('garupa','dorso',[0,.04,-.68]);add('peitoral','dorso',[0,.07,.61]);
   add('pescoco','peitoral',[0,.24,.28]);add('cabeca','pescoco',[0,.24,.35]);
   for(const [side,x] of sides)for(const front of [true,false]){
    const leg=(front?'dianteira_':'traseira_')+side,up=(front?'escapula_':'quadril_')+side;
    add(up,'dorso',[x*(front?.35:.345),front?.14:0,front?.69:-.73]);
    add('perna_'+leg,up,[0,front?-.68:-.62,0]);add('jarrete_'+leg,'perna_'+leg,[0,front?-.61:-.59,0]);add('pata_'+leg,'jarrete_'+leg,[0,front?-.22:-.40,0]);
   }
  }
  add('mandibula','cabeca',[0,form==='completa'?.03:.24,.18]);
  for(const [side,x] of sides)add('orelha_'+side,'cabeca',[x*.29,form==='completa'?.49:.74,-.095]);
  add('cauda_base',form==='hibrida'?'cintura':'garupa',form==='hibrida'?[0,.23,-.25]:[0,.14,-.38]);
  add('cauda_meio','cauda_base',[0,-.12,-.50]);add('cauda_ponta','cauda_meio',[0,-.20,-.53]);
  return parts;
 }
 function sculpture(T,models,id,form,level){
  const key=[id,form,level].join('/');if(cache.has(key))return cache.get(key);
  const s=new models.Surface(T),rgb=Object.fromEntries(Object.entries(colors).map(([k,c])=>[k,new T.Color(c).toArray()]));
  const box=(p,d,c,b=.04)=>models.bevel(s,p,d,level===0?Math.min(b,Math.min(...d)*.24):0,rgb[c]);
  // A stack of bevelled cross sections keeps the angular coat continuous between blocks.
  function loft(layers,c,top=c,belly=c){
   const rings=layers.map(([x,y,z,w,h])=>[[-.72,-1],[.72,-1],[1,-.64],[1,.57],[.68,1],[-.68,1],[-1,.57],[-1,-.64]].map(([u,v])=>[x+u*w/2,y+v*h/2,z]));
   const outside=(points,dir,col)=>s.polygon(models.oriented(points,dir),rgb[col]);
   const dir=Math.sign(layers.at(-1)[2]-layers[0][2]);
   outside(rings[0].slice(),[0,0,-dir],c);
   for(let k=1;k<rings.length;k++)for(let i=0;i<8;i++){const next=(i+1)%8,a=rings[k-1],b=rings[k],mx=(a[i][0]+a[next][0])/2-layers[k-1][0],my=(a[i][1]+a[next][1])/2-layers[k-1][1];
    outside([a[i],a[next],b[next],b[i]],[mx,my,0],i>=3&&i<=5?top:i===0||i===7?belly:c);}
   outside(rings.at(-1).slice(),[0,0,dir],c);
  }
  function taper(base,tip,baseSize,tipSize,c){
   const ring=(p,d)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[p[0]+x*d[0]/2,p[1],p[2]+z*d[1]/2]);
   const a=ring(base,baseSize),b=ring(tip,tipSize),up=Math.sign(tip[1]-base[1])||1;
   const face=(p,n)=>s.polygon(models.oriented(p,n),rgb[c]);face(a.slice(),[0,-up,0]);face(b.slice(),[0,up,0]);
   for(let i=0;i<4;i++){const j=(i+1)%4;face([a[i],a[j],b[j],b[i]],[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]][i]);}
  }
  const quad=form==='completa',side=id.endsWith('_E')?1:-1;
  function paw(halfWidth,length,hand=false){
   const baseY=hand?-.20:-.11,span=halfWidth*2;
   loft([[0,baseY+.031,-.19,span*.66,.21],[0,baseY,0,span,.26],
    [0,baseY-.022,length*.62,span*.94,.18],[0,baseY-.038,length*.83,span*.73,.12]],'pale','flank','ink');
   const digits=level===0?4:3;
   for(let digit=0;digit<digits;digit++){
    const u=2*digit/(digits-1)-1,w=span/(digits+.45),x=u*halfWidth*.74,z=length-.064*u*u;
    const cuff=hand?-.245:-.143,tip=hand?-.321:-.174;
    loft([[x*.86,cuff,z-.18,w*.95,.128],[x,tip,z-.055,w*1.08,.124],[x,tip+.002,z+.029,w*.69,.08]],'flank','pale','ink');
    if(level<2){taper([x,tip+.015,z+.016],[x,tip-(hand?.092:.028),z+(hand?.094:.08)],[w*.56,.079],[.017,.015],'claw');}
    if(level===0)box([x,tip-.058,z-.063],[w*.66,.024,.090],'pad',.004);
   }
   if(level<2){
    box([0,hand?-.336:-.226,.005],[span*.51,.024,.18],'pad',.009);
    if(hand)taper([-side*halfWidth*.71,-.07,.008],[-side*(halfWidth+.056),-.213,.17],[.14,.18],[.062,.057],'pale');
   }
  }
  if(id==='cabeca'){
   const y=quad?0:.23;
   loft([[0,y+.22,-.30,.58,.55],[0,y+.24,-.04,.89,.65],[0,y+.20,.27,.78,.51],[0,y+.14,.45,.47,.32]],'coat','back','pale');
   for(const [,x] of sides){
    loft([[x*.32,y+.11,-.20,.25,.36],[x*.43,y+.07,-.04,.24,.38],[x*.34,y+.10,.27,.19,.22]],'side','side','cream');
    taper([x*.39,y+.19,-.12],[x*.47,y-.09,-.22],[.24,.36],[.09,.12],'pale');
    // A single sloped socket wraps the outer corner toward the profile.
    function eye(left,right,bottom,top,col,offset){
     const point=(u,v)=>[x*(.225+.162*u+offset),y+.255+v+.026*u,.470-.142*u+offset];
     const face=[point(left,bottom),point(right,bottom),point(right,top),point(left,top)];
     s.polygon(models.oriented(face,[x,0,1]),rgb[col]);
    }
    eye(0,1,0,.117,'ink',0);eye(.10,.92,.018,.080,'amber',.004);
    eye(.34,.44,.017,.082,'nose',.008);if(level===0)eye(.47,.57,.054,.077,'cream',.009);
    eye(.05,.94,.123,.170,'saddle',.001);
    if(level<2){
     loft([[x*.309,y+.254,.225,.139,.105],[x*.342,y+.276,.333,.169,.084],[x*.273,y+.325,.42,.096,.055]],'flank','pale','side');
     taper([x*.335,y+.095,-.162],[x*.463,y-.089,-.264],[.24,.33],[.055,.032],'cream');
    }
    if(level===0){box([x*.125,y+.136,.761],[.053,.038,.008],'ink',.002);box([x*.193,y+.117,.516],[.014,.033,.041],'side',.002);}

   }
   loft([[0,y+.14,.28,.47,.28],[0,y+.095,.54,.40,.22],[0,y+.09,.70,.32,.17]],'cream','pale','ink');
   box([0,y+.136,.69],[.31,.145,.15],'nose',.034);
   if(level<2)box([0,y+.218,.663],[.15,.024,.06],'back',.005);
  }else if(id.startsWith('orelha_')){
   taper([0,0,-.018],[side*.091,.37,-.084],[.285,.22],[.074,.078],'back');
   taper([side*.012,.069,.085],[side*.077,.285,-.012],[.16,.04],[.037,.025],'pale');
   if(level<2)taper([side*.014,.09,.108],[side*.067,.23,.035],[.087,.022],[.02,.014],'side');
  }else if(id==='mandibula'){
   loft([[0,-.02,.035,.41,.13],[0,-.045,.29,.38,.14],[0,-.04,.49,.28,.105]],'pale','mouth','cream');
   for(const [,x] of sides)taper([x*.149,.018,.31],[x*.147,.106,.316],[.065,.077],[.016,.020],'claw');
  }else if(id.startsWith('cauda_')){
   const a=id==='cauda_base',b=id==='cauda_meio',c=a?'coat':b?'side':'cream';
   const w=a?.28:b?.44:.42;
   loft([[0,.00,.07,w,w*.85],[0,-.055,-.20,a?.42:b?.48:.39,a?.35:.40],[0,a?-.14:b?-.19:-.22,a?-.54:b?-.57:-.54,a?.41:b?.40:.09,a?.34:b?.36:.09]],c,a?'back':b?'coat':'pale',a?'side':b?'pale':'cream');
  }else if(quad){
   if(id==='dorso'){
    loft([[0,.06,-.83,.70,.62],[0,.09,-.55,.77,.69],[0,.13,-.25,.76,.59],[0,.09,.01,.86,.72],[0,.065,.34,.94,.89],[0,.10,.76,.83,.93]],'coat','back','pale');
    if(level<2)loft([[0,.365,-.63,.25,.12],[0,.416,-.22,.47,.129],[0,.445,.21,.52,.13],[0,.414,.49,.28,.13]],'saddle','back','coat');
   }
   else if(id==='garupa'){
    loft([[0,.021,-.47,.52,.53],[0,.058,-.27,.82,.79],[0,.082,-.03,.86,.82],[0,.066,.24,.71,.66]],'coat','saddle','side');
    if(level===0)for(const [,x] of sides)taper([x*.331,.20,-.18],[x*.373,-.07,-.31],[.125,.20],[.067,.045],'guard');
   }
   else if(id==='peitoral'){
    loft([[0,.07,-.34,.87,.76],[0,.10,-.07,1.01,1.01],[0,.20,.22,.91,.92],[0,.27,.38,.62,.70]],'side','back','pale');
    for(const [,x] of sides){
     taper([x*.34,.28,.08],[x*.43,-.25,-.12],[.28,.33],[.09,.095],'pale');
     if(level<2)taper([x*.378,.32,-.017],[x*.45,-.01,-.216],[.228,.30],[.061,.065],'guard');
    }
    taper([0,.15,.238],[0,-.385,.101],[.52,.264],[.188,.098],'throat');
   }else if(id==='pescoco'){
    loft([[0,.01,-.13,.76,.70],[0,.15,.11,.73,.75],[0,.22,.34,.59,.58]],'pale','coat','cream');
   }else if(id.startsWith('escapula_')||id.startsWith('quadril_')){
    const hind=id.startsWith('quadril');
    taper([0,.22,0],[0,hind?-.59:-.64,0],[hind?.42:.34,hind?.66:.44],[hind?.29:.23,hind?.32:.26],hind?'coat':'side');
    if(hind){
     loft([[side*.035,-.18,-.27,.29,.39],[side*.059,-.17,-.099,.41,.67],[side*.032,-.20,.16,.35,.57],[0,-.24,.23,.22,.34]],'coat','saddle','side');
     if(level<2)taper([side*.203,-.094,-.077],[side*.116,-.49,-.077],[.098,.258],[.055,.078],'guard');
    }else{
     loft([[0,.04,-.255,.18,.285],[side*.035,.032,-.11,.32,.61],[0,-.025,.133,.31,.52],[0,-.078,.235,.178,.25]],'side','guard','pale');
     if(level<2)taper([side*.146,.19,-.148],[side*.148,-.218,.079],[.089,.186],[.057,.061],'flank');
    }
   }else if(id.startsWith('perna_')){
    const hind=id.includes('traseira');taper([0,.055,0],[0,hind?-.59:-.61,0],[hind?.30:.23,hind?.33:.25],[.18,.22],'pale');
   }else if(id.startsWith('jarrete_')){
    const hind=id.includes('traseira');taper([0,.03,-.01],[0,hind?-.40:-.22,0],[.20,.23],[.175,.18],'side');
   }else if(id.startsWith('pata_'))paw(.17,.33);
  }else{
   const kind=id.split('_')[0];
   if(kind==='cintura'){loft([[0,.22,-.34,.68,.37],[0,.22,-.14,1.04,.47],[0,.21,.23,.95,.42],[0,.19,.33,.69,.32]],'back','coat','ink');}
   if(kind==='tronco'){
    taper([0,.03,0],[0,.88,.01],[.83,.58],[1.36,.78],'coat');
    loft([[0,.91,-.39,1.01,.45],[0,.91,-.15,1.44,.46],[0,.90,.13,1.38,.54],[0,.81,.37,.98,.49]],'side','back','pale');
    taper([0,1.01,.31],[0,.24,.30],[.86,.22],[.25,.16],'pale');
    taper([0,.93,.442],[0,.48,.422],[.49,.055],[.13,.043],'cream');
    for(const [,x] of sides){taper([x*.39,.96,.31],[x*.32,.61,.366],[.32,.20],[.09,.06],'pale');if(level<2)taper([x*.54,.91,.20],[x*.58,.66,.19],[.23,.21],[.08,.06],'coat');}
   }
   if(kind==='ombro'){box([side*.015,.015,0],[.51,.46,.67],'coat',.07);taper([side*.12,.14,-.03],[side*.245,-.25,-.12],[.32,.48],[.12,.13],'side');}
   if(kind==='braco'){
    taper([0,.04,0],[0,-.59,.005],[.40,.52],[.32,.39],'coat');
    if(level<2)loft([[side*.08,-.195,-.197,.19,.37],[side*.093,-.21,-.02,.253,.46],[side*.070,-.235,.173,.177,.32]],'guard','coat','side');
   }
   if(kind==='antebraco'){taper([0,.055,-.02],[0,-.61,0],[.43,.51],[.31,.34],'side');taper([side*.14,-.03,-.13],[side*.21,-.43,-.20],[.16,.23],[.058,.06],'back');}
   if(kind==='mao')paw(.237,.36,true);
   if(kind==='coxa'){
    taper([0,.06,0],[0,-.70,.015],[.52,.62],[.36,.44],'coat');
    if(level<2)taper([side*.175,-.025,-.07],[side*.145,-.50,.11],[.21,.38],[.11,.15],'guard');
   }
   if(kind==='canela'){taper([0,.06,.02],[0,-.68,-.005],[.39,.43],[.285,.33],'side');if(level<2)box([0,-.24,-.11],[.33,.35,.33],'coat');}
   if(kind==='pe')paw(.25,.54);
  }
  const geo=s.geometry();cache.set(key,geo);return geo;
 }
 const quadSockets={peito:['peitoral',[0,.23,.29]],boca:['cabeca',[0,.07,.77]],pegada:['mandibula',[0,0,.48]]};
 for(const [side] of sides){quadSockets['apoio_'+side]=['pata_traseira_'+side,[0,-.20,.09]];for(const prefix of ['palma_','punho_'])quadSockets[prefix+side]=['pata_dianteira_'+side,[0,-.15,.29]];}
 function create(T,models,data,form,level=0){
  const parts=specs(data,form),root=new T.Group(),joints={},meshes={},sockets={};
  root.name=form==='completa'?'Lobo_Completo':'Lobo_Hibrido';
  if(!materials.has(T))materials.set(T,new T.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:.015}));
  for(const part of parts){const joint=new T.Group();joint.name=part.id;joint.position.fromArray(part.pivot);joint.rotation.set(...part.rotation);
   (part.parent?joints[part.parent]:root).add(joint);joints[part.id]=joint;
   const mesh=new T.Mesh(sculpture(T,models,part.id,form,level),materials.get(T));mesh.castShadow=mesh.receiveShadow=true;mesh.name=part.id+'_pelagem';meshes[part.id]=mesh;joint.add(mesh);}
  const points=form==='completa'?quadSockets:{...models.sockets,boca:['cabeca',[0,.30,.77]],punho_E:['mao_E',[0,-.26,.25]],punho_D:['mao_D',[0,-.26,.25]]};
  for(const [key,[parent,p]] of Object.entries(points)){const anchor=new T.Object3D();anchor.name=key;anchor.position.fromArray(p);joints[parent].add(anchor);sockets[key]=anchor;}
  return {form,root,joints,meshes,sockets,points,parts,contacts:{},setLOD(next){for(const p of parts)meshes[p.id].geometry=sculpture(T,models,p.id,form,next);}};
 }
 function legIK(j,side,front,down,z,roll,hock,spread,base,heading){
  const leg=(front?'dianteira_':'traseira_')+side,up=(front?'escapula_':'quadril_')+side;
  const a=front?.68:.62,b=front?.61:.59,c=front?.22:.40;
  const dy=down-c*Math.cos(hock),dz=z+c*Math.sin(hock),theta=Math.atan2(-dz,dy);
  const bend=(front?-1:1)*Math.acos(clamp((dy*dy+dz*dz-a*a-b*b)/(2*a*b),-.99999,.99999));
  const upper=theta-Math.atan2(b*Math.sin(bend),a+b*Math.cos(bend));
  j[up].rotation.set(upper,0,spread,'ZXY');j['perna_'+leg].rotation.set(bend,0,0);
  j['jarrete_'+leg].rotation.set(hock-upper-bend,0,0);
  j['pata_'+leg].rotation.set(roll-hock-base.rotation.x,heading-base.rotation.y,-spread-base.rotation.z);
 }
 const event=(t,peak,before,after)=>{const v=clamp(t<peak?(t-peak+before)/before:(peak+after-t)/after);return v*v*(3-2*v);};
 // The contact always lands at phase 1. Phase 0..1 is anticipation,
 // phase 1..2 is follow-through and recovery. Distances are local metres.
 const wolfNeutral={height:0,reach:0,chest:0,turn:0,bank:0,snout:0,jaw:0,tail:0,front:0,rear:0,rake:0,lift:0};
 const wolfAction={
  lobo_j1:{release:.14,duration:.41,labels:['Garra oblíqua','Presa de viés'],frames:[
   [.53,{height:-.075,reach:-.11,chest:.09,turn:.27,bank:.11,snout:-.08,jaw:.58,tail:-.34,rake:.18}],
   [1,{height:.012,reach:.22,chest:.16,turn:-.26,bank:-.073,snout:.18,jaw:.12,tail:.27,front:.085,rake:.32}],
   [1.30,{height:-.026,reach:.115,chest:.08,turn:-.34,snout:.035,jaw:.015,tail:.37,rake:.12}]]},
  lobo_j2:{release:.175,duration:.48,labels:['Rasgo de retorno','Mordida de arrasto'],frames:[
   [.60,{height:-.095,reach:-.095,chest:.13,turn:-.44,bank:-.16,snout:.10,jaw:.54,tail:.39,rake:-.25}],
   [1,{height:-.067,reach:.19,chest:.145,turn:.42,bank:.15,snout:.24,jaw:.045,tail:-.43,front:.08,rake:-.26}],
   [1.32,{height:-.11,reach:.05,chest:.10,turn:.63,bank:.095,snout:.11,jaw:.07,tail:-.46,rear:-.07,rake:-.13}]]},
  lobo_j3:{release:.225,duration:.60,labels:['Garra da garganta','Presa da Lua'],frames:[
   [.57,{height:-.24,reach:-.16,chest:.34,turn:.16,bank:.065,snout:.20,jaw:.54,tail:.28,rear:.075,rake:.15}],
   [1,{height:.012,reach:.24,chest:-.09,turn:-.19,bank:-.10,snout:.055,jaw:.08,tail:-.30,front:.24,rear:-.17,lift:.23,rake:.18}],
   [1.31,{height:.10,reach:.14,chest:-.32,turn:-.26,snout:-.23,jaw:.055,tail:-.32,front:.19,rear:-.15,lift:.24}],
   [1.65,{height:-.050,reach:.015,chest:.09,front:.03,lift:.012}]]},
  lobo_dash:{release:.09,duration:.52,labels:['Passada Feral','Passada Feral'],frames:[
   [.65,{height:-.20,reach:-.15,chest:.18,snout:.14,tail:-.20,rear:.23,front:-.09}],
   [1,{height:-.052,reach:.13,chest:-.13,snout:.015,tail:.18,rear:-.27,front:.33,lift:.18}],
   [1.48,{height:.095,reach:.18,chest:.075,snout:-.125,tail:.21,rear:-.37,front:.38,lift:.21}],
   [1.74,{height:-.15,reach:.062,chest:.17,snout:-.08,tail:-.17,rear:.27,front:-.12,lift:.075}]]},
  lobo3:{release:.30,duration:.87,labels:['Uivo de Caça','Uivo de Caça'],frames:[
   [.55,{height:-.14,reach:-.07,chest:.16,snout:.19,jaw:.025,tail:-.10,rear:.09}],
   [1,{height:.035,reach:-.08,chest:-.27,snout:-.63,jaw:.65,tail:.17,front:.08,rear:-.10}],
   [1.38,{height:.053,reach:-.105,chest:-.34,snout:-.70,jaw:.57,tail:.21,front:.06,rear:-.14}],
   [1.62,{height:.04,chest:-.19,snout:-.39,jaw:.38,tail:.12}]]},
  lobo4:{release:.22,duration:.86,labels:['Caçada Lunar','Caçada Lunar'],frames:[
   [.62,{height:-.20,reach:-.10,chest:.23,turn:-.33,bank:-.14,snout:.14,jaw:.36,tail:.29,rake:-.27,rear:.11}],
   [1,{height:.035,reach:.21,chest:.07,turn:.31,bank:.15,snout:.05,jaw:.085,tail:-.31,rake:-.45,front:.14,rear:-.21,lift:.14}],
   [1.25,{height:-.14,reach:-.045,chest:.18,turn:.50,bank:.20,snout:.11,jaw:.48,tail:-.35,rake:.13}],
   [1.453125,{height:.035,reach:.27,chest:-.17,turn:-.48,bank:-.14,snout:.12,jaw:.075,tail:.39,rake:.46,front:.21,rear:-.18,lift:.23}],
   [1.70,{height:-.07,reach:.08,chest:.09,turn:-.32,snout:-.11,jaw:.025,tail:.22,rake:.13}]]}
 };
 const mix=(a,b,t)=>a+(b-a)*t;
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 const between=(a,b,x)=>smooth((x-a)/(b-a));
 const fract=x=>x-Math.floor(x);
 // Monotone cubic tangents carry motion through an intermediate pose and stop
 // cleanly at a reversal. Release poses are interpolated exactly, including the jaw.
 function tangent(a,b,c,va,vb,vc){
  const left=(vb-va)/(b-a),right=(vc-vb)/(c-b);
  if(left*right<=0)return 0;
  const w1=2*(c-b)+(b-a),w2=(c-b)+2*(b-a);return (w1+w2)/(w1/left+w2/right);
 }
 function prepareAction(def){
  const rows=[[0,wolfNeutral],...def.frames,[2,wolfNeutral]];
  def.poses=rows.map(([at,values],i)=>{const slope={};for(const key in wolfNeutral){
   slope[key]=i===0||i===rows.length-1?0:tangent(rows[i-1][0],at,rows[i+1][0],rows[i-1][1][key]||0,values[key]||0,rows[i+1][1][key]||0);
  }return {at,values,slope};});
 }
 for(const def of Object.values(wolfAction))prepareAction(def);
 // FRUTO Legacy (atualização 21): golpes M1 das formas completas entram na mesma tabela
 function registerActions(defs){for(const [id,def] of Object.entries(defs)){wolfAction[id]=def;prepareAction(def);}}
 function wolfFrame(def,t,timing){
  if(!def)return wolfNeutral;
  const release=timing?.release??def.release,duration=timing?.duration??def.duration;
  const phase=t<=release?t/release:1+(t-release)/(duration-release);
  if(phase<=0||phase>=2)return wolfNeutral;
  const rows=def.poses;let i=1;while(rows[i].at<phase)i++;
  const a=rows[i-1],b=rows[i],dt=b.at-a.at,u=(phase-a.at)/dt,w=u*u*(3-2*u),lo=u*(1-u)*(1-u),hi=-u*u*(1-u),pose={};
  for(const key in wolfNeutral)pose[key]=(1-w)*(a.values[key]||0)+w*(b.values[key]||0)+dt*(lo*a.slope[key]+hi*b.slope[key]);
  return pose;
 }
 function strideRate(form,drive){return tau*(form==='completa'?1.08+1.08*clamp(drive):1.04+.88*clamp(drive));}
 // Each trajectory has continuous position and velocity at lift-off and touchdown.
 // The offsets interpolate unwrapped, letting lateral walk, diagonal trot and
 // transverse gallop share a continuous phase when the player accelerates.
 function pawFrame(side,front,phase,drive){
  const trot=between(.29,.59,drive),gallop=between(.69,.96,drive),left=side==='E';
  const walk=front?(left?.23:.73):(left?0:.50),diagonal=front?(left?.50:1):(left?0:.50);
  const fast=front?(left?.45:.58):(left?0:.12);
  const shift=mix(mix(walk,diagonal,trot),fast,gallop),p=fract(phase/tau-shift);
  const duty=mix(mix(.69,.53,trot),front?.275:.29,gallop),ground=p<duty;
  const u=ground?p/duty:(p-duty)/(1-duty),v=-2*(1-duty)/duty;
  const track=ground?1-2*u:-1+2*smooth(u)+v*u*(1-u)*(1-2*u);
  const swing=ground?0:Math.sin(Math.PI*u)**2,load=ground?Math.sin(Math.PI*u)**2:0;
  const contact=ground?between(0,.075,u)*(1-between(.83,1,u)):0;
  const reach=Math.min(.60,6.1*drive*tau/strideRate('completa',drive)*duty*.5);
  const roll=ground?.074*(1-between(0,.22,u))-.14*between(.75,1,u)
    :mix(-.14,.074,smooth(u))-.12*Math.sin(tau*u);
  return {track:track*reach,swing,load,contact:mix(1,contact,between(.025,.17,drive)),roll:roll*drive,push:ground?load*between(.32,.78,u):0};
 }
 function support(lift,air){return (1-between(.011,.078,lift))*(1-between(.003,.095,air));}
 function clipInputs(state,id,t){
  const preview=state.clock===undefined,landPreview=id==='land',braking=id==='brake',turning=id==='turn';
  const gait=clamp(state.gait??(id==='walk'?.35:id==='run'?1:braking?.57*(1-between(.03,.48,t)):turning?.27*Math.sin(Math.PI*clamp(t/.78))**2:0));
  const drive=clamp(state.drive??gait);
  const rate=id==='walk'?7.7:id==='run'?10.2:strideRate('completa',drive);
  return {gait,drive,phase:state.phase??(braking?4.65*Math.sin(Math.PI*.5*clamp(t/.49)):t*rate),
   turn:clamp(state.turn??(turning?event(t,.35,.31,.37):0),-1,1), brake:clamp(state.brake??(braking?event(t,.205,.185,.38):0)),
   air:clamp(state.air??(id==='jump'?Math.sin(Math.PI*clamp(t/.8)):landPreview?1-between(.02,.15,t):0)),
   rise:clamp(state.rise??(id==='jump'&&t<.8?Math.cos(Math.PI*t/.8):landPreview?-(1-between(.12,.20,t)):0),-1,1),
   compression:clamp(state.compression??(landPreview?event(t,.245,.095,.355):state.landing||0)),
   launch:clamp(state.takeoff??(id==='jump'?event(t,.115,.105,.125):0)),
   rhythm:preview&&['idle','walk','run'].includes(id)?t*(id==='idle'?2.45:rate):null};
 }
 const waterCycle=1.2, floatCycle=2.4;
 const dodgePreviews={dashFront:'Avanço',dashBack:'Recuo',dashLeft:'Esquiva à esquerda',dashRight:'Esquiva à direita',
  dashFrontLeft:'Avanço à esquerda',dashFrontRight:'Avanço à direita',dashBackLeft:'Recuo à esquerda',dashBackRight:'Recuo à direita',dashSlide:'Deslize horizontal'};
 function waterPose(T,motion,data,body,state){
  const j=body.joints,quad=body.form==='completa',t=state.t||0;
  const drive=clamp(state.gait??(state.id==='tread'?0:1)),phase=state.phase??tau*t/(state.id==='tread'?floatCycle:waterCycle);
  const float=state.clock===undefined?phase:(state.clock*Math.PI+phase*.14);
  if(!quad){
   motion.apply(T,body,data,{...state,gait:drive,id:state.id,t,phase});
  }else{
   // Alternating diagonal pairs catch beneath the chest; the return folds each hock to reduce drag.
   const base=j.dorso,sway=Math.sin(phase);
   base.position.set(.026*sway*drive,1.44+.035*Math.cos(phase*2)*drive+.028*Math.sin(float)*(1-drive),.018*Math.cos(phase*2)*drive);
   base.rotation.set(-.103+.06*drive+.035*Math.sin(phase*2+.4),.055*sway*drive,.052*Math.cos(phase)*drive);
   j.peitoral.rotation.set(-.048+.028*Math.sin(phase*2-.4),.047*sway*drive,-.032*Math.cos(phase)*drive);
   j.garupa.rotation.set(.095+.046*Math.sin(phase*2-.9),-.077*sway*drive,.035*Math.cos(phase)*drive);
   j.pescoco.rotation.set(-.23-base.rotation.x*.4,-.032*sway*drive,-.52*base.rotation.z);
   j.cabeca.rotation.set(.12+.016*Math.sin(float),-.023*sway*drive,-.27*base.rotation.z);
   for(const [side,sign] of sides)for(const front of [true,false]){
    const a=phase+(sign<0?Math.PI:0)+(front?0:Math.PI-.30),reach=Math.cos(a),recovery=.5+.5*Math.sin(a);
    const down=(front?.91:.83)-recovery*(.17+.14*drive),z=(front?.15:-.20)+reach*(.13+.38*drive);
    legIK(j,side,front,down,z,-.24+.22*reach,(front?-.25:-.62)-recovery*.22,sign*(.085+.09*recovery),base,0);
    body.contacts['pata_'+(front?'dianteira_':'traseira_')+side]=0;
   }
  }
  for(const [side,sign] of sides){
   if(!quad)body.contacts['pe_'+side]=0;
   j['orelha_'+side].rotation.set(.17+.035*Math.cos(phase+sign*.6),-.09*sign,.09*sign);
  }
  j.mandibula.rotation.x=.014+.018*(1+Math.cos(float));
  for(const [i,name] of ['cauda_base','cauda_meio','cauda_ponta'].entries()){
   j[name].rotation.set((quad?-.26:-.43)+i*.09+.053*Math.cos(phase-i*.35),(.12+.075*i)*Math.sin(phase-i*.65),0);
  }
 }
 function fallPose(T,motion,data,body,state){
  const j=body.joints,quad=body.form==='completa',t=Math.min(state.t||0,1.15);
  const fold=between(.04,.43,t),fall=between(.20,.71,t),settle=between(.70,1.15,t),impact=event(t,.72,.11,.21);
  if(quad){
   animate(T,motion,data,body,{id:'idle',t:0,clock:0,phase:0,gait:0,drive:0});
   const base=j.dorso;
   base.position.set(-.08*fold-.17*fall,1.45-.31*fold-.52*fall-.035*impact,-.07*fold);
   base.rotation.set(.15*fold-.18*fall,.05*fall,.14*fold+1.22*fall-.10*settle);
   j.peitoral.rotation.x+=.13*fold-.15*fall;
   j.garupa.rotation.z-=.14*fall-.08*settle;
   j.pescoco.rotation.x+=.22*fold+.08*impact;
   j.cabeca.rotation.set(.042+.16*fall,.20*fall,-.24*fall+.12*impact);
   for(const [side,sign] of sides)for(const front of [true,false]){
    const limb=(front?'dianteira_':'traseira_')+side;
    const load=sign<0?.65:1;
    j[(front?'escapula_':'quadril_')+side].rotation.x+=(front?.25:-.43)*fold*load;
    j['perna_'+limb].rotation.x+=(front?-.62:.53)*fold*load;
    j['jarrete_'+limb].rotation.x+=(front?.26:-.26)*settle;
    body.contacts['pata_'+limb]=0;
   }
  }else{
   motion.apply(T,body,data,{id:'death',t});
   for(const [side] of sides)body.contacts['pe_'+side]=0;
  }
  for(const [side,sign] of sides)j['orelha_'+side].rotation.set(.06+.76*fold,-sign*.14,sign*(.06+.18*settle));
  j.mandibula.rotation.x=.022+.17*fold-.11*settle;
  for(const [i,name] of ['cauda_base','cauda_meio','cauda_ponta'].entries()){
   const lag=between(.30+i*.10,.78+i*.13,t);
   j[name].rotation.set(-.15+.22*fold+.16*lag+(quad?0:(i===0?1.35:.15)*fall),-(.15+.33*lag),.10*lag);
  }
  // In the falling pose a feather, paw or tail may become the first support.
  // Sample the displayed mesh once per pose and reuse the terminal contact.
  const contact=body.fallContact??={time:-1,offset:0,bounds:new T.Box3(),origin:new T.Vector3(),scale:new T.Vector3()};
  if(contact.time!==t){
   body.root.updateWorldMatrix(true,true);
   const floor=body.root.getWorldPosition(contact.origin).y,scale=body.root.getWorldScale(contact.scale).y;
   contact.offset=.01+(floor-contact.bounds.setFromObject(body.root,true).min.y)/scale;
   contact.time=t;
  }
  (quad?j.dorso:j.cintura).position.y+=contact.offset;
 }
 function animate(T,motion,data,body,state){
  if(state.id==='swim'||state.id==='tread'){waterPose(T,motion,data,body,state);return;}
  if(state.id==='death'){fallPose(T,motion,data,body,state);return;}
  if(dodgePreviews[state.id]){
   const clip=motion.clips.lobo_dash;
   state={...state,id:'lobo_dash',t:(state.t||0)*clip.duration/.40,dashDirection:motion.clips[state.id].previewDirection};
  }
  const j=body.joints,quad=body.form==='completa',id=state.id||'idle',t=state.t||0,clock=state.clock??t;
  const k=clipInputs(state,id,t),{gait,drive,phase,turn,brake,air,compression,launch}=k;
  const rhythm=rate=>k.rhythm??clock*rate;
  const clip=motion.clips[id],attack=['jab','direto','gancho','lobo0'].includes(id),bite=attack?event(t,clip.release,.14,.23):0;
  const signature=wolfAction[id],f=wolfFrame(signature,t,clip),transform=id==='lobo1'||id==='lobo2';
  const rise=transform?event(t,clip.release,.25,.37):0,howl=id==='despertar_lobo'?event(t,.42,.32,.43):0;
  const breathe=Math.sin(rhythm(2.45)),flee=id==='dash'?event(t,.16,.14,.19):0;
  const pace=attack||transform||signature?0:drive;
  const run=clamp(state.runBlend??0)*pace*(1-air);
  const direction=state.dashDirection,travel=direction?event(t,(clip?.release||.09)+.07,(clip?.release||.09)+.07,Math.max(.14,(clip?.duration||.4)-(clip?.release||.09)-.07)):0;
  const lateral=(direction?.x||0)*travel,reverse=Math.max(0,-(direction?.z||0))*travel,slide=direction?.slide?travel:0;
  const contacts=body.contacts;
  if(!quad){
   motion.apply(T,body,data,{...state,id,t,phase:k.rhythm!==null&&id==='idle'?k.rhythm:phase,clock:k.rhythm===null?clock:k.rhythm/2.4,gait,air,landing:0});
   const pelvis=j.cintura,torso=j.tronco,head=j.cabeca;
   const feet=sides.map(([side])=>body.root.worldToLocal(j['pe_'+side].getWorldPosition(new T.Vector3())));
   const roll=Math.sin(phase),swing=Math.cos(phase),tip=clip?.release||.23;
   const coil=signature||attack?event(t,tip*.59,tip*.53,tip*.40):0,follow=signature||attack?event(t,tip+.072,.070,.155):0;
   pelvis.position.x+=.048*roll*pace-turn*.058+.042*f.rake;
   pelvis.position.z+=.074*launch-.093*brake+.044*compression;
   pelvis.position.y-=.112*compression+.072*brake+.047*launch;
   pelvis.rotation.y+=.095*swing*pace+.11*turn;pelvis.rotation.z+=.039*roll*pace+.092*turn;
   torso.rotation.x+=.105+.105*pace+f.chest*.40-.15*brake+.075*compression+.05*launch;
   torso.rotation.y+=-.15*swing*pace+f.turn*.26+.16*turn;torso.rotation.z+=-.060*roll*pace+f.bank*.32-.09*turn;
   head.rotation.x+=-.075-.08*pace-.20*howl+f.snout*.64+.09*brake-.04*compression;
   head.rotation.y+=.10*swing*pace+f.turn*.36+.225*turn;head.rotation.z-=.050*roll*pace+.08*turn;
   for(const [n,[side,sign]] of sides.entries()){
    const ankle=feet[n],stroke=motion.gaitFrame(phase,side,pace),relative=fract(phase/tau+(side==='E'?0:.5));
    const key='pe_'+side,weight=relative<.5?between(0,.055,relative)*(1-between(.43,.5,relative)):0;
    const groundLoad=clip?1:mix(1,weight,between(.045,.17,pace));
    contacts[key]=groundLoad*support(Math.max(0,ankle.y-.25),air);
    const footPitch=air?stroke.roll-.13*air:stroke.roll;
    if(!clip||brake+compression+launch>.01){motion.twoBone(T,body,j['coxa_'+side],j['canela_'+side],j[key],ankle,new T.Vector3(sign*.36,.95,1.72),.73,.72,footPitch);}
    const lead=Math.max(0,sign*f.rake),counter=Math.max(0,-sign*f.rake);
    j['ombro_'+side].rotation.z+=sign*(.055+.055*launch+.065*brake+.078*lead);
    j['ombro_'+side].rotation.x+=-.075*stroke.wave*pace+.075*counter;
    j['braco_'+side].rotation.z+=sign*(.068+.11*brake+.16*launch);
    j['braco_'+side].rotation.y-=sign*lead*.38;
    j['antebraco_'+side].rotation.x-=.16*pace*(.55+.45*stroke.wave)+lead*.16*coil;
    j['mao_'+side].rotation.z+=sign*(lead*(.97+.31*follow)-counter*.15);
    j['mao_'+side].rotation.x+=.16*stroke.wave*pace-.15*coil*lead+.12*follow*lead;
   }
   if(id==='jab'||id==='direto'||id==='gancho'){const side=id==='direto'?'D':'E',sign=side==='E'?1:-1;j['braco_'+side].rotation.y+=sign*(bite*.64-.16);j['mao_'+side].rotation.z+=sign*bite*.56;}
   if(id==='lobo0')torso.rotation.y+=.16*event(t,.53,.12,.17)-.16*bite;
  }else{
   const legs=[],fronts=[],rears=[];
   for(const [side,sign] of sides)for(const front of [true,false]){
    const g=pawFrame(side,front,phase,pace);legs.push({side,sign,front,g});(front?fronts:rears).push(g);
   }
   const frontLoad=(fronts[0].load+fronts[1].load)*.5*pace,hindLoad=(rears[0].load+rears[1].load)*.5*pace;
   const push=(rears[0].push+rears[1].push)*pace,gallop=between(.69,.96,pace);
   const gather=Math.sin(phase-.68)*gallop,sway=(legs[0].g.load+legs[1].g.load-legs[2].g.load-legs[3].g.load)*.032*pace;
   const lunge=id==='lobo0'?event(t,.42,.23,.22):bite*.37,crouch=transform?rise*.20:id==='lobo0'?event(t,.14,.13,.13)*.22:0;
   const base=j.dorso;
   base.position.set(sway-.068*turn,1.45-.15*slide-.045*run+.014*breathe+.039*pace+.072*push-.107*frontLoad-.058*hindLoad+.031*gather-crouch-.112*compression-.071*brake+.096*lunge+f.height,
    (attack?bite*.097:0)+f.reach+.058*launch-.093*brake);
   base.rotation.set(.07*run-.25*reverse+(hindLoad-frontLoad)*.082+.036*gather+.044*brake+.036*compression,.038*Math.sin(phase)*pace+.055*turn,-sway*.63+.103*turn-.32*lateral);
   j.peitoral.rotation.set(.087*frontLoad-.075*push-.17*lunge+.105*compression-.23*howl+f.chest,turn*.11+f.turn*.28,f.bank*.72-sway*.54);
   j.garupa.rotation.set(-.075*hindLoad+.115*gather+.14*lunge-f.chest*.31,-.037*Math.sin(phase)*pace-turn*.12-f.turn*.16,sway*.81-f.bank*.34);
   const neck=j.pescoco,head=j.cabeca;
   neck.rotation.set(-.11-.05*run-base.rotation.x*.61-.044*frontLoad+.046*Math.cos(phase-.21)*pace+bite*.23-howl*.60+crouch*.58+f.snout*.64-.087*brake+.047*compression,
    turn*.14+f.turn*.33,-base.rotation.z*.56-f.bank*.21);
   head.rotation.set(.042-base.rotation.x*.35-j.peitoral.rotation.x*.36-.029*Math.cos(phase+.04)*pace+bite*.15-howl*.19+f.snout*.36,
    -.080*Math.sin(rhythm(.83))*(1-pace)+(id==='direto'?-.15:.13)*bite+f.turn*.39+turn*.23,
    .026*Math.sin(phase)*pace+f.bank*.27-base.rotation.z*.43);
   const inverse=base.quaternion.clone().invert(),goal=new T.Vector3();
   for(const {side,sign,front,g} of legs){
    const lead=front?Math.max(0,sign*f.rake):0,pivot=j[(front?'escapula_':'quadril_')+side].position;
    const phaseClearance=g.swing*(front?.23:.285)*pace*(1+.20*gallop);
    const airborneLift=air*((front?.14:.24)+(front?.080:-.044)*k.rise);
    const landStep=id==='land'&&!front?.125*(1-between(.130,.205,t)):0;
    const attackLift=lunge*(front?.24:.10)+.11*flee+Math.max(0,f.lift)*(front?1:.55)+lead*.61;
    const lift=phaseClearance+airborneLift+attackLift+landStep;
    const strideZ=g.track*(1-turn*sign*.14),stanceZ=front?.13:.055;
    const footZ=pivot.z+stanceZ+strideZ+reverse*(front?-.23:.20)+slide*(front?.21:-.16)+(front?1:-1)*(.21*lunge+.20*air+.19*flee+.12*launch)+(front?f.front:f.rear)+lead*.60+(front?.13:-.045)*brake;
    const footX=pivot.x+lateral*(front?.20:-.11)+sign*(.023+g.swing*.038*pace+.034*brake)+turn*(front?.062:-.064);
    goal.set(footX,.25+lift,footZ).sub(base.position).applyQuaternion(inverse).sub(pivot);
    const hock=(front?-.08:-.39)+g.swing*(front?.18:.28)*pace+(front?-.13:.20)*air+(front?-.045:.14)*compression;
    legIK(j,side,front,Math.hypot(goal.x,goal.y),goal.z,g.roll-.09*air,hock,Math.atan2(goal.x,-goal.y),base,turn*(front?.12:.05));
    const name='pata_'+(front?'dianteira_':'traseira_')+side;
    contacts[name]=g.contact*support(airborneLift+attackLift+landStep,air);
   }
  }
  j.mandibula.rotation.x=.022+.019*(breathe+1)+bite*(quad?.56:.32)+howl*.50+rise*.16+f.jaw;
  for(const [side,sign] of sides){
   const ear=j['orelha_'+side],step=Math.sin(phase-.22+sign*.13)*pace;
   ear.rotation.set(.045+.049*Math.sin(rhythm(2.1)+sign*1.3)+step*.063+bite*.19+f.jaw*.28+.15*brake-.11*launch,
    -sign*(.095+Math.sin(rhythm(.9)+sign*.4)*.048)+.13*turn,sign*(.057+howl*.10+f.jaw*.10+.052*gait));
  }
  for(const [i,name] of ['cauda_base','cauda_meio','cauda_ponta'].entries()){
   const tail=j[name],w=Math.sin((pace>0?phase:rhythm(2.0))-i*.52),speedWave=Math.cos(phase-i*.46)*pace;
   const delayed=i&&signature?wolfFrame(signature,Math.max(0,t-i*.026),clip):f;
   tail.rotation.set((quad?[-.16,-.13,.10]:[-.30,.12,.33])[i]+Math.cos(rhythm(1.8)-i*.58)*.038+.046*speedWave+.11*brake-.09*launch+(quad?.20:.17)*bite+rise*.18-delayed.chest*.4+delayed.lift*.53,
    w*(.10+.15*pace)+(i?0:.085)+delayed.tail*(.59+.15*i)-lateral*(.16+.09*i)-turn*(.24+.10*i),.021*Math.sin(phase-i*.41)*pace-turn*.045);
  }
 }
 function clips(form,motion){return [{id:'idle',label:'Respiração',duration:tau/2.45},{id:'walk',label:form==='completa'?'Passo a quatro tempos':'Passada',duration:tau/7.7},{id:'run',label:form==='completa'?'Galope':'Corrida',duration:tau/10.2},{id:'brake',label:'Frenagem',duration:.62},{id:'turn',label:'Mudança de direção',duration:.78},{id:'land',label:'Recepção do salto',duration:.60},{id:'jump',label:'Salto',duration:.92},{id:'jab',label:form==='completa'?'Mordida':'Garra esquerda',duration:.35},{id:'direto',label:form==='completa'?'Mordida lateral':'Garra direita',duration:.43},{id:'gancho',label:form==='completa'?'Presa ascendente':'Garra ascendente',duration:.56},{id:'lobo0',label:form==='completa'?'Bote Feral':'Garras Cruzadas',duration:.79},{id:form==='completa'?'lobo2':'lobo1',label:'Transformação',duration:.80},{id:'despertar_lobo',label:'Uivo do despertar',duration:.92},{id:'dash',label:'Esquiva',duration:.40},{id:'swim',label:'Nado de travessia',duration:waterCycle,loop:true},{id:'tread',label:'Flutuação',duration:floatCycle,loop:true},{id:'death',label:'Queda e repouso',duration:1.55},...Object.entries(dodgePreviews).map(([id,label])=>({id,label,duration:.40})),...Object.entries(wolfAction).map(([id,a])=>({id,label:a.labels[form==='completa'?1:0],duration:motion?.clips[id]?.duration??a.duration}))];}
 return {create,animate,clips,fileNames,strideRate,registerActions,hasAction:id=>!!wolfAction[id]};
})();

/* Deterministic flight phrases for the inspector and the GLB tracks.
   Heights are measured from the contact plane, +Z points along travel.
   Leg phase stays unwrapped so a changing stride never skips an ankle. */
export const FRUTOFalconFlightClips=(()=>{
 const tau=2*Math.PI;
 const shapes={
  completa:{forward:2.96,launch:2.00,landing:2.16,height:1.12,toe:.84,touch:.75,climb:.75,baseHz:1.36,perDrive:.74,lead:-1},
  hibrida:{forward:3.26,launch:2.20,landing:2.34,height:.86,toe:.98,touch:.88,climb:.70,baseHz:1.10,perDrive:.76,lead:1}
 };
 const limit=x=>Math.max(0,Math.min(1,x));
 const blend=(a,b,u)=>a+(b-a)*u;
 function smooth(a,b,t){const u=limit((t-a)/(b-a));return u*u*(3-2*u);}
 function window(a,b,c,d,t){return smooth(a,b,t)*(1-smooth(c,d,t));}
 // The integral of a smoothstep ramp gives the number of strides, even during
 // acceleration. It has the same speed and acceleration on both sides of a key.
 function rampArea(a,b,t){
  if(t<=a)return 0;if(t>=b)return t-(a+b)*.5;
  const u=(t-a)/(b-a);return (b-a)*u*u*u*(1-u*.5);
 }
 function groundStride(cfg,launch,t){
  const start=launch?.06:cfg.touch-.28,end=launch?cfg.toe-.12:cfg.touch+.66;
  const from=launch?.35:.79,to=launch?.83:.39,pivot=launch?cfg.toe:cfg.touch;
  const cycles=x=>(cfg.baseHz+cfg.perDrive*from)*x+cfg.perDrive*(to-from)*rampArea(start,end,x);
  // On launch the final foot is pushing behind the body. At touchdown the
  // receiving leg is forward and the other foot is still in its swing.
  const phaseAtContact=launch?.45+(cfg.lead>0?.5:0):.21+(cfg.lead<0?.5:0);
  return {drive:blend(from,to,smooth(start,end,t)),cycles:phaseAtContact+cycles(t)-cycles(pivot)};
 }
 function clips(form){
  const cfg=shapes[form];if(!cfg)return [];
  return [
   {id:'forwardFlight',label:'Voo em avanço',duration:cfg.forward,loop:true},
   {id:'walkTakeoff',label:'Da passada à decolagem',duration:cfg.launch},
   {id:'landWalk',label:'Do voo à caminhada',duration:cfg.landing}
  ];
 }
 function forward(cfg,t){
  const progress=t/cfg.forward,cycle=tau*progress,unit=progress-Math.floor(progress);
  const coast=window(.54,.70,.84,.995,unit);
  // Four whole wing beats. The wrist recovery takes longer during the long
  // glide, then gives way to the next power stroke without restarting phase.
  const beat=4*cycle+.28*Math.sin(cycle-.55)+.15*Math.sin(2*cycle+.40);
  const drive=.82+.045*Math.sin(cycle+.60);
  const power=.78-.53*coast+.07*Math.cos(cycle-.32);
  const h=cfg.height+power*(.019*Math.sin(beat-1.0)+.004*Math.sin(2*beat-1.1));
  // The hybrid and full rigs use different breathing periods. A bounded,
  // periodic clock lets both rigs arrive at exactly the same loop pose.
  const clock=.36*Math.sin(cycle-.28)+.07*Math.sin(2*cycle);
  return {height:h,pose:{id:'flight',t,clock,phase:2*cycle,gait:drive,drive,turn:.042*Math.sin(cycle-.25),
   brake:0,rise:.038*power*Math.cos(beat-1),compression:0,takeoff:0,flare:0,
   flightMix:1,glideMix:.12+.76*coast,flapPhase:beat,air:1,grounded:false,
   forwardAir:.90+.035*Math.sin(cycle+.60),wingPower:power,liftDemand:.17+.18*power,
   collection:0,stepLead:0,touchdownMix:0}};
 }
 function takeoff(cfg,t){
  const toe=cfg.toe,u=limit((t-toe)/cfg.climb),height=cfg.height*(1-(1-u)**3);
  const {drive,cycles}=groundStride(cfg,true,t),fly=smooth(toe,toe+.32,t);
  const press=window(toe-.225,toe,toe+.03,toe+.35,t);
  const collection=window(toe-.31,toe-.015,toe+.05,toe+.44,t);
  const climb=window(toe-.075,toe+.035,toe+.13,toe+cfg.climb,t);
  const wingPower=window(toe-.27,toe-.045,toe+.44,toe+.92,t);
  // Wings crest just before the last toe leaves the ground and drive down
  // during extension. Both forms gain altitude before settling into forward flight.
  const beatHz=cfg.lead<0?1.54:1.35;
  const beat=tau*beatHz*(t-toe+.034);
  return {height,pose:{id:'takeoff',t:Math.max(0,t-toe+.25),clock:t,phase:tau*cycles,gait:drive,drive,
   turn:0,brake:0,rise:climb,compression:.30*window(toe-.28,toe-.14,toe-.12,toe+.012,t),takeoff:press,
   flare:0,flightMix:fly,glideMix:.30*smooth(toe+.47,toe+cfg.climb+.16,t),flapPhase:beat,
   air:1-(1-u)**3,grounded:t<=toe,forwardAir:.87*smooth(toe-.06,toe+.61,t),
   wingPower:.65*fly+(1-.65*fly)*wingPower,liftDemand:.23*fly+(1-.23*fly)*climb,
   collection,stepLead:cfg.lead,touchdownMix:0}};
 }
 function landing(cfg,t){
  const touch=cfg.touch,u=limit(t/touch),remaining=1-u;
  const height=cfg.height*remaining*(1-.48*u);
  const {drive,cycles}=groundStride(cfg,false,t),fly=1-smooth(touch-.29,touch,t);
  const flare=window(.025,touch-.15,touch+.055,touch+.52,t);
  const braking=window(touch-.36,touch-.035,touch+.060,touch+.67,t);
  const compression=window(touch,touch+.092,touch+.095,touch+.405,t);
  const collection=window(touch-.31,touch-.09,touch+.11,touch+.53,t);
  const touchdownMix=window(touch-.15,touch,touch+.055,touch+.24,t);
  const air=1-smooth(touch-.42,touch,t),settle=smooth(touch-.21,touch+.07,t);
  const descent=-cfg.height*(1.48-.96*u)/(touch*5)*(1-settle);
  return {height,pose:{id:'land',t:Math.max(0,t-touch+.42),clock:t,phase:tau*cycles,gait:drive,drive,turn:0,
   brake:.85*braking,rise:descent,compression:.85*compression,takeoff:0,flare,flightMix:fly,
   glideMix:.80*(1-smooth(touch-.47,touch-.09,t)),flapPhase:tau*(cfg.baseHz-.12)*(t-touch)+.92,
   air,grounded:t>=touch,forwardAir:.89*(1-smooth(touch-.38,touch+.24,t)),
   wingPower:.19*(1-settle)+.60*flare,liftDemand:.10*(1-settle)+.50*flare,
   collection,stepLead:cfg.lead,touchdownMix}};
 }
 function sample(id,t,form){
  const cfg=shapes[form];if(!cfg||!Number.isFinite(t))return null;
  if(id==='forwardFlight')return forward(cfg,t);
  if(id==='walkTakeoff')return takeoff(cfg,Math.max(0,Math.min(cfg.launch,t)));
  if(id==='landWalk')return landing(cfg,Math.max(0,Math.min(cfg.landing,t)));
  return null;
 }
 function contacts(id,form){
  const cfg=shapes[form],launch=id==='walkTakeoff';
  if(!cfg||(!launch&&id!=='landWalk'))return [];
  const from=launch?0:cfg.touch,to=launch?cfg.toe:cfg.landing;
  // Mark every alternating footfall, including the trailing foot following
  // first contact. Key times remain exact when the export grid falls between them.
  const phase=t=>groundStride(cfg,launch,t).cycles;
  const events=[launch?cfg.toe:cfg.touch];
  for(let foot=Math.ceil(phase(from)*2)/2;foot<phase(to);foot+=.5){
   let lo=from,hi=to;
   for(let i=0;i<28;i++){const m=(lo+hi)*.5;if(phase(m)<foot)lo=m;else hi=m;}
   events.push(Number(((lo+hi)*.5).toFixed(6)));
  }
  return events.sort((a,b)=>a-b);
 }
 return {clips,sample,contacts};
})();

/* A perched peregrine and a winged biped share the same layered feather palette.
   Forward is +Z. Both wings chain shoulder, wrist and primaries. */
export const FRUTOFalcon=(()=>{
 const flightClips=typeof FRUTOFalconFlightClips!=='undefined'?FRUTOFalconFlightClips:require('./falcon-flight-clips.js');
 const sides=[['E',1],['D',-1]],tau=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const tones={hood:'#27384a',ink:'#1c2938',mantle:'#415774',covert:'#596e86',slate:'#778ba0',silver:'#a0b1bc',buff:'#dbb88c',cream:'#efe5c9',white:'#fff2d6',ochre:'#c08a38',gold:'#edb64d',wax:'#ffcf69',iris:'#463221',pupil:'#171d21',talon:'#30313b'};
 const fileNames={hibrida:'Falcao_Hibrido.glb',completa:'Falcao_Completo.glb'};
 const geometryCache=new Map(),materials=new Map();
 function skeleton(data,form){
  const bird=form==='completa',parts=bird?[]:[...data.segments];
  const add=(id,parent,pivot)=>parts.push({id,parent,pivot,rotation:[0,0,0]});
  if(bird){
   add('dorso',null,[0,1.07,0]);add('pescoco','dorso',[0,.12,.45]);add('cabeca','pescoco',[0,.22,.23]);
   for(const [side,s] of sides){add('coxa_'+side,'dorso',[.235*s,-.16,-.04]);add('tarso_'+side,'coxa_'+side,[0,-.47,0]);add('pe_'+side,'tarso_'+side,[0,-.48,0]);}
  }
  add('bico','cabeca',[0,bird?.09:.30,.33]);
  add('cauda',bird?'dorso':'cintura',bird?[0,.075,-.64]:[0,.23,-.29]);
  for(const [side,s] of sides){
   const sole=bird?0:-.10;
   add('garras_'+side,'pe_'+side,[0,-.051+sole,.095]);
   add('halux_'+side,'pe_'+side,[0,-.036+sole,-.095]);
   add('leque_'+side,'cauda',[.09*s,0,-.18]);
   add('asa_'+side,bird?'dorso':'tronco',bird?[s*.39,.15,.21]:[s*.47,.92,-.27]);
   add('carpo_'+side,'asa_'+side,[s*.84,.045,.08]);
   add('primarias_'+side,'carpo_'+side,[s*.71,.015,-.045]);
  }
  return parts;
 }
 function geometry(T,models,part,form,level){
  const id=part.id,key=form+'/'+level+'/'+id;
  if(geometryCache.has(key))return geometryCache.get(key);
  const sf=new models.Surface(T),pal=Object.fromEntries(Object.entries(tones).map(([k,v])=>[k,new T.Color(v).toArray()]));
  const bird=form==='completa',s=id.endsWith('_D')?-1:1;
  const face=(points,n,c)=>sf.polygon(models.oriented(points,n),pal[c]);
  const box=(center,size,c,bevel=.025)=>models.bevel(sf,center,size,level===0?Math.min(bevel,...size.map(v=>v*.24)):0,pal[c]);
  // Octagonal transverse sections establish the breast, hood and hooked bill.
  function loft(rows,c,cap=c,belly=c,front=c){
   const rings=rows.map(([x,y,z,w,h])=>[[-.67,-1],[.67,-1],[1,-.57],[1,.56],[.65,1],[-.65,1],[-1,.56],[-1,-.57]].map(([u,v])=>[x+w*u/2,y+h*v/2,z]));
   const sign=Math.sign(rows.at(-1)[2]-rows[0][2])||1;
   face(rings[0].slice(),[0,0,-sign],belly);
   for(let k=1;k<rings.length;k++)for(let i=0;i<8;i++){
    const a=rings[k-1],b=rings[k],j=(i+1)%8;
    const nx=(a[i][0]+a[j][0])/2-rows[k-1][0],ny=(a[i][1]+a[j][1])/2-rows[k-1][1];
    face([a[i],a[j],b[j],b[i]],[nx,ny,0],i>=3&&i<=5?cap:i<=1||i===7?belly:c);
   }
   face(rings.at(-1).slice(),[0,0,sign],front);
  }
  function taper(base,tip,a,b,c){
   const ring=(p,r)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[p[0]+x*r[0]/2,p[1],p[2]+z*r[1]/2]);
   const low=ring(base,a),high=ring(tip,b),sign=Math.sign(tip[1]-base[1])||1;
   face(low.slice(),[0,-sign,0],c);face(high.slice(),[0,sign,0],c);
   for(let i=0;i<4;i++){const j=(i+1)%4;face([low[i],low[j],high[j],high[i]],[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]][i],c);}
  }
  // Raised shaft, darker narrow vane and pointed distal blade remain visible in profile.
  function feather(start,tip,width,color,shade='hood',barred=false){
   const dx=tip[0]-start[0],dz=tip[2]-start[2],len=Math.hypot(dx,dz)||1,px=-dz/len,pz=dx/len;
   const at=(u,q=0,h=0)=>[start[0]+dx*u+px*width*q,start[1]+(tip[1]-start[1])*u+h,start[2]+dz*u+pz*width*q];
   const base=at(0),fl=at(.24,.49),fr=at(.26,-.47),l=at(.77,.39),r=at(.73,-.30),tipPt=at(1);
   const root=at(.20,0,.038),spine=at(.72,0,.024),normal=[0,1,0],down=[0,-1,0];
   face([base,fr,root],normal,color);face([base,root,fl],normal,color);
   face([fl,root,spine,l],normal,color);face([root,fr,r,spine],normal,shade);face([l,spine,tipPt],normal,color);face([spine,r,tipPt],normal,shade);
   face([base,fl,l,tipPt,r,fr].reverse(),down,'silver');
   if(barred&&level<2){for(const q of (level===0?[.43,.64]:[.54])){
    face([at(q,-.37,.027),at(q+.048,-.36,.029),at(q+.075,.40,.029),at(q+.025,.42,.030)],normal,'slate');
   }}
  }
  function toes(hand=false){
   // The central digit leads and the lateral pair spreads under load.
   const reach=hand?.72:1,sz=hand?.82:1;
   const y=hand?-.21:0,baseZ=hand?.035:0;
   for(const finger of [-1,0,1]){
    const x=finger*.089*sz,z=(finger?.29:.394)*reach;
    loft([[x,y,baseZ,.112*sz,.091],[x*1.48,y-.005,baseZ+z*.45,.102*sz,.098],
          [x*1.87,y-.034,baseZ+z*.89,.076*sz,.075],[x*1.87,y-.033,baseZ+z,.068*sz,.064]],'ochre','gold','ochre');
    loft([[x*1.87,y-.020,baseZ+z-.016,.080*sz,.074],[x*1.91,y-.006,baseZ+z+.026,.068*sz,.071],
          [x*1.95,y-.029,baseZ+z+.065,.047*sz,.054]],'talon','slate','ink');
    taper([x*1.95,y-.027,baseZ+z+.056],[x*1.98,y-(hand?.139:.102),baseZ+z+.068],[.052*sz,.062],[.009,.019],'talon');
    if(level===0&&!hand)box([x*1.48,y+.034,z*.45],[.067,.012,.036],'wax',.004);
   }
  }
  function hallux(){
   loft([[0,0,.012,.119,.095],[-s*.023,-.012,-.105,.103,.088],[-s*.041,-.030,-.197,.079,.068]],'ochre','gold');
   loft([[-s*.041,-.014,-.180,.080,.065],[-s*.053,-.014,-.223,.064,.061]],'talon','slate');
   taper([-s*.053,-.014,-.218],[-s*.060,-.103,-.233],[.063,.073],[.011,.019],'talon');
  }
  function footPad(){
   const y=bird?0:-.10;
   loft([[0,y-.008,-.14,.19,.145],[0,y-.043,.025,.34,.155],[0,y-.063,.147,.27,.119]],'ochre','gold','ochre');
   if(!bird)taper([0,.015,-.038],[0,-.14,.04],[.18,.18],[.215,.21],'gold');
  }
  function cheekBar(x,y,z,w){ // A pair of slanted vanes follows the pectoral surface.
   const p=(u,v)=>[x*(w+u*.085),y+v,z-(u*.107)];
   face([p(0,0),p(.50,.021),p(1,.043),p(.65,-.025),p(.18,-.040)],[x,0,1],'mantle');
  }
  if(id==='cabeca'){
   const y=bird?0:.21;
   loft([[0,y+.17,-.38,.47,.46],[0,y+.19,-.15,.79,.67],[0,y+.18,.18,.76,.62],[0,y+.15,.38,.54,.43],[0,y+.10,.46,.31,.23]],'slate','hood','cream');
   loft([[0,y+.30,-.24,.65,.39],[0,y+.32,.08,.79,.36],[0,y+.25,.32,.63,.24],[0,y+.21,.40,.45,.14]],'hood','hood','ink');
   for(const [,x] of sides){
    // Ivory cheek and descending black moustache identify a peregrine even with folded wings.
    taper([x*.322,y+.17,.10],[x*.319,y-.067,-.012],[.146,.36],[.11,.20],'cream');
    taper([x*.346,y+.20,.232],[x*.342,y-.044,.178],[.115,.125],[.068,.083],'ink');
    const patch=(u0,u1,v0,v1,c,o)=>{
     const point=(u,v)=>[x*(.235+.139*u+o),y+.151+.025*u+v,.399-.164*u+o];
     face([point(u0,v0),point(u1,v0),point(u1,v1),point(u0,v1)],[x,0,1],c);
    };
    patch(.00,1.01,.035,.166,'ink',0);patch(.12,.90,.048,.137,'wax',.004);
    patch(.30,.74,.048,.130,'iris',.009);patch(.40,.65,.054,.121,'pupil',.013);
    if(level<2)patch(.425,.53,.096,.120,'white',.017);
   }
   loft([[0,y+.312,-.32,.43,.15],[0,y+.349,-.02,.69,.215],[0,y+.301,.23,.62,.17]],'mantle','hood','hood');
   if(level<2)for(const [,x] of sides){
    feather([x*.22,y+.27,-.19],[x*.35,y+.005,-.365],.105,'mantle','hood');
    taper([x*.322,y+.105,-.094],[x*.294,y+.014,-.20],[.084,.12],[.041,.07],'buff');
   }
   loft([[0,y+.136,.37,.31,.22],[0,y+.113,.49,.33,.19],[0,y+.068,.62,.22,.16],[0,y+.010,.68,.12,.13]],'gold','wax','ochre');
   loft([[0,y+.066,.565,.223,.147],[0,y+.032,.635,.173,.142],[0,y-.012,.676,.113,.104]],'slate','mantle','ink');
   taper([0,y-.004,.656],[0,y-.116,.662],[.130,.093],[.045,.045],'ink');
   if(level<2)for(const [,x] of sides)box([x*.117,y+.177,.478],[.040,.031,.058],'iris',.005);
  }else if(id.startsWith('garras_'))toes();
  else if(id.startsWith('halux_'))hallux();
  else if(id==='bico'){
   loft([[0,-.046,.035,.25,.08],[0,-.061,.16,.22,.086],[0,-.065,.285,.086,.054]],'ochre','iris','gold');
  }else if(id==='cauda'){
   loft([[0,.05,.10,.63,.22],[0,.045,-.14,.65,.20],[0,.01,-.39,.48,.12]],'mantle','covert','silver');
   feather([0,.047,-.15],[0,-.17,-1.14],.34,'mantle','covert',true);
  }else if(id.startsWith('leque_')){
   const count=level===2?2:3;
   for(let i=0;i<count;i++){
    const u=i/(count-1);
    feather([s*(.030+.045*u),.039-.030*u,-.01],[s*(.145+.28*u),-.128-.060*u,-1.065+.15*u],.225,i%2?'covert':'mantle','slate',true);
   }
  }else if(id.startsWith('asa_')||id.startsWith('carpo_')||id.startsWith('primarias_')){
   const inner=id.startsWith('asa_'),outer=id.startsWith('primarias_'),span=inner?.89:outer?.90:.77;
   const sc=(x,y,z)=>[s*x,y,z];
   // One airfoil bridges adjacent feather roots, leaving gaps only at the primary tips.
   const chord=outer?.42:inner?.76:.64;
   const stations=[[-.064,inner?.23:.16,1],[span*.43,inner?.25:.18,.95],[span*(outer?.64:1.03),inner?.22:outer?.06:.16,outer?.45:.73]];
   const airfoil=stations.map(([x,front,scale])=>[[.0,.0],[.061,-.18],[.084,-.42],[.038,-.78],[-.004,-1],[-.039,-.64],[-.05,-.18]].map(([h,z])=>sc(x,h+.03,front+z*chord*scale)));
   face(airfoil[0].slice(),[-s,0,0],'mantle');
   for(let k=1;k<airfoil.length;k++)for(let n=0;n<7;n++){
    const a=airfoil[k-1],b=airfoil[k],m=(n+1)%7;
    const dir=n===0?[0,.3,1]:n<=3?[0,1,0]:n<=5?[0,-1,-.2]:[0,-.4,1];
    face([a[n],a[m],b[m],b[n]],dir,n===0?'slate':n<=3?'covert':n===6?'mantle':'silver');
   }
   face(airfoil.at(-1).slice(),[s,0,0],'covert');
   feather(sc(-.09,.028,-.015),sc(span,.051,inner?.105:-.07),inner?.68:outer?.36:.57,'covert','mantle');
   const count=inner?(level===2?3:5):outer?(level===2?4:6):(level===2?3:5);
   for(let i=0;i<count;i++){
    const u=(i+.33)/(count+.03),rootX=span*u*(outer?.57:.94),tipX=outer?.50+u*.73:rootX+.22+.15*u;
    const y=.017-i*.011;
    const z=outer?(-.94+.54*u):inner?(-.72+.065*u):(-.72-.15*u);
    feather(sc(rootX,y,inner?.12:.065),sc(tipX,y-.085,z),outer?.26:inner?.31:.30,i%3===0?'slate':'covert',outer?'ink':'mantle',true);
   }
   // The alula breaks the outline at the leading wrist edge.
   if(!inner&&!outer)feather(sc(.02,.068,.095),sc(.39,.125,.285),.166,'mantle','ink');
   // The overlapping short coverts hide the wing skeleton when folded.
   if(level<2)for(let i=0;i<(level===0?4:2);i++){
    const u=(i+.4)/(level===0?4:2);feather(sc(span*u*.84,.057,.12),sc(span*u*.86+.19,.039,-.32),.20,'slate','covert');
   }
  }else if(bird){
   if(id==='dorso'){
    loft([[0,.087,-.83,.39,.34],[0,.053,-.55,.72,.58],[0,.023,-.10,.99,.83],[0,.084,.32,1.04,.98],[0,.167,.59,.77,.79]],'covert','mantle','cream');
    loft([[0,-.14,-.32,.56,.42],[0,-.16,.10,.85,.70],[0,-.064,.45,.90,.79],[0,.098,.66,.63,.60],[0,.169,.71,.39,.34]],'buff','cream','cream');
    for(const [,x] of sides){
     for(let i=0;i<(level===2?2:4);i++){const z=-.31+i*.13;box([x*(.415+i*.009),-.143,z],[.081,.050,.109],'mantle',.009);}
     cheekBar(x,-.072,.631,.315);cheekBar(x,.006,.64,.314);
     if(level<2){cheekBar(x,-.139,.558,.351);feather([x*.246,.289,-.05],[x*.35,.164,-.67],.28,'mantle','covert',true);}
    }
   }else if(id==='pescoco'){
    loft([[0,.04,-.28,.69,.60],[0,.10,-.04,.69,.63],[0,.22,.24,.57,.57],[0,.23,.32,.50,.45]],'cream','mantle','cream');
   }else if(id.startsWith('coxa_'))taper([0,.17,0],[0,-.45,-.01],[.39,.46],[.21,.20],'buff');
   else if(id.startsWith('tarso_')){taper([0,.055,0],[0,-.48,0],[.155,.159],[.115,.13],'gold');if(level<2)for(const y of [-.12,-.25,-.38])box([0,y,.014],[.148,.036,.144],'ochre',.008);}
   else if(id.startsWith('pe_'))footPad();
  }else{
   const kind=id.split('_')[0];
   if(kind==='pe')footPad();
   else if(kind==='mao'){box([0,-.125,.008],[.33,.33,.32],'covert');toes(true);}
   else if(kind==='tronco'){
    taper([0,.03,0],[0,.92,0],[.88,.63],[1.37,.76],'mantle');
    loft([[0,.84,-.37,1.07,.47],[0,.84,-.06,1.36,.50],[0,.78,.22,1.16,.61],[0,.72,.392,.94,.54]],'slate','covert','cream','cream');
    taper([0,.99,.37],[0,.15,.304],[1.07,.19],[.49,.12],'cream');
    if(level<2)for(const [,x] of sides){
     taper([x*.46,.96,.16],[x*.51,.55,.235],[.27,.28],[.13,.13],'covert');
     taper([x*.40,.69,.31],[x*.325,.32,.297],[.22,.16],[.08,.09],'buff');
    }
    for(const [,x] of sides)for(let i=0;i<(level===2?2:3);i++){const y=.38+i*.18;box([x*(.16+i*.070),y,.396+i*.024],[.148+i*.014,.051,.041],'mantle',.005);}
   }else if(kind==='cintura')loft([[0,.19,-.33,.68,.32],[0,.21,.00,1.04,.44],[0,.20,.29,.82,.38]],'mantle','covert','buff');
   else if(kind==='canela'){
    taper([0,.031,0],[0,-.22,-.015],[.40,.43],[.29,.31],'buff');
    taper([0,-.16,0],[0,-.687,.003],[.28,.27],[.184,.22],'ochre');
    if(level<2)for(let i=0;i<3;i++)box([0,-.26-i*.14,.035],[.262-i*.019,.055,.25-i*.014],'gold',.014);
   }else{
    const dims=part.size,center=part.center;
    const c=kind==='antebraco'?'covert':kind==='coxa'?'mantle':'slate';
    box(center,dims,c,.062);
    if(kind==='ombro')taper([s*.04,.16,.0],[s*.19,-.22,-.07],[.47,.65],[.28,.28],'mantle');
    if(kind==='antebraco'){taper([s*.08,-.005,-.14],[s*.16,-.62,-.22],[.37,.33],[.095,.10],'mantle');}
   }
  }
  const g=sf.geometry();geometryCache.set(key,g);return g;
 }
 function create(T,models,data,form,level=0){
  const bird=form==='completa',parts=skeleton(data,form),root=new T.Group(),joints={},meshes={},sockets={};
  root.name=bird?'Falcao_Completo':'Falcao_Hibrido';
  if(!materials.has(T))materials.set(T,new T.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.03}));
  for(const part of parts){
   const joint=new T.Group();joint.name=part.id;joint.position.fromArray(part.pivot);joint.rotation.set(...part.rotation);
   (part.parent?joints[part.parent]:root).add(joint);joints[part.id]=joint;
   const mesh=new T.Mesh(geometry(T,models,part,form,level),materials.get(T));mesh.name=part.id+'_plumagem';
   mesh.receiveShadow=mesh.castShadow=true;joint.add(mesh);meshes[part.id]=mesh;
  }
  const points=bird?{peito:['dorso',[0,.10,.58]],boca:['cabeca',[0,.058,.704]],pegada:['pe_D',[0,-.07,.30]]}:
   {...models.sockets,boca:['cabeca',[0,.267,.704]]};
  for(const [side,s] of sides){
   points['ponta_asa_'+side]=['primarias_'+side,[s*1.13,-.10,-.36]];
   points['talao_'+side]=['garras_'+side,[0,-.049,.395]];
   if(bird){
    points['apoio_'+side]=['pe_'+side,[0,-.14,.06]];
    points['palma_'+side]=['carpo_'+side,[s*.61,0,0]];
    points['punho_'+side]=['pe_'+side,[0,-.10,.42]];
   }
  }
  for(const [name,[parent,p]] of Object.entries(points)){const o=new T.Object3D();o.name=name;o.position.fromArray(p);joints[parent].add(o);sockets[name]=o;}
  return {form,root,joints,meshes,sockets,parts,points,contacts:{pe_E:1,pe_D:1},setLOD(next){for(const p of parts)meshes[p.id].geometry=geometry(T,models,p,form,next);}};
 }
 const peak=(t,at,before,after)=>{const x=clamp(t<at?(t-at+before)/before:(at+after-t)/after);return x*x*(3-2*x);};
 const dodgePreviews={dashFront:"Avanço",dashBack:"Recuo",dashLeft:"Esquiva à esquerda",dashRight:"Esquiva à direita",
  dashFrontLeft:"Avanço à esquerda",dashFrontRight:"Avanço à direita",dashBackLeft:"Recuo à esquerda",dashBackRight:"Recuo à direita",dashSlide:"Deslize horizontal"};
 const cycleTimes={idle:2.8,walk:.84,run:.62,flight:.84,glide:2.40};
 // The first unit of phase ends at contact; the second covers follow-through.
 // The blade and foot values are signed. Positive values select the left side.
 const neutral={height:0,reach:0,pitch:0,neck:0,turn:0,bank:0,bill:0,open:0,fold:0,stroke:0,blade:0,foot:0,fan:0};
 const actions={
  falcao_j1:{release:.12,duration:.37,labels:['Talão rasante','Bicada de agulha'],frames:[
   [.54,{height:-.065,reach:-.11,pitch:-.12,neck:-.22,turn:.15,bill:.22,fold:.30,fan:.08}],
   [1,{height:-.045,reach:.24,pitch:.26,neck:.40,turn:-.14,bill:.035,open:.30,stroke:.05,fan:.12}],
   [1.32,{height:-.02,reach:.10,pitch:.07,neck:.16,turn:-.23,open:.22,fan:.05}]]},
  falcao_j2:{release:.155,duration:.45,labels:['Corte de asa','Talão em gancho'],frames:[
   [.53,{height:-.085,reach:-.10,pitch:.14,neck:.08,turn:-.14,bank:-.095,open:.36,stroke:.48,foot:-.22}],
   [1,{height:.07,reach:.13,pitch:-.17,neck:.16,turn:.19,bank:.15,open:.85,stroke:.36,foot:-1,fan:.47}],
   [1.43,{height:.025,reach:.085,pitch:-.14,turn:.28,bank:.12,open:.57,stroke:.046,foot:-.49,fan:.45}]]},
  falcao_j3:{release:.205,duration:.56,labels:['Garra das alturas','Asa de varredura'],frames:[
   [.60,{height:-.10,reach:-.08,pitch:.11,neck:-.16,turn:.36,bank:.14,open:.83,stroke:.67,blade:-.12,fan:.40}],
   [1,{height:-.01,reach:.14,pitch:.12,neck:.06,turn:-.23,bank:-.14,open:.99,stroke:.04,blade:.98,fan:.72}],
   [1.37,{height:-.04,reach:.09,pitch:.03,turn:-.36,bank:-.10,open:.78,stroke:.03,blade:.85,fan:.58}]]},
  falcao_dash:{release:.085,duration:.54,labels:['Rasante de Asas','Rasante de Asas'],frames:[
   [.60,{height:-.17,reach:-.12,pitch:.24,neck:-.10,open:.72,stroke:.65,fan:.23}],
   [1,{height:.045,reach:.05,pitch:.32,neck:-.31,open:.71,fold:.23,stroke:-.16,fan:.05}],
   [1.32,{height:.10,reach:.29,pitch:.57,neck:-.57,fold:.91,bank:-.09,fan:-.17}],
   [1.67,{height:.035,reach:.16,pitch:.065,neck:-.13,open:.98,stroke:.48,fan:.90}],
   [1.86,{height:-.065,reach:.005,pitch:.12,open:.53,stroke:.19,fan:.35}]]},
  falcao3:{release:.225,duration:.70,labels:['Foice de Vento','Foice de Vento'],frames:[
   [.52,{height:-.12,reach:-.055,pitch:.095,neck:-.10,turn:.43,bank:.17,open:.94,stroke:.80,fan:.62}],
   [.77,{height:-.07,turn:.25,bank:.09,open:1,stroke:.52,blade:.25,fan:.87}],
   [1,{height:.075,reach:.20,pitch:.16,neck:.065,turn:-.29,bank:-.24,open:1,stroke:.15,blade:1,fan:.79}],
   [1.32,{height:.035,reach:.09,pitch:-.015,turn:-.52,bank:-.18,open:.96,stroke:.26,blade:.64,fan:.68}],
   [1.65,{height:-.045,turn:-.20,open:.48,stroke:.25,fan:.27}]]},
  falcao4:{release:.28,duration:.87,labels:['Corrente Ascendente','Corrente Ascendente'],frames:[
   [.31,{height:-.15,reach:-.075,pitch:.19,neck:.18,open:.32,fold:.30,fan:.19}],
   [.77,{height:-.12,pitch:-.14,neck:-.22,open:1,stroke:.83,fan:.62}],
   [1,{height:.15,reach:.05,pitch:-.19,neck:-.24,bill:.15,open:1,stroke:-.22,fan:.95}],
   [1.32,{height:.19,pitch:-.12,neck:-.12,open:.94,stroke:.49,fan:.82}],
   [1.56,{height:.13,pitch:-.065,open:.96,stroke:.32,fan:.67}],
   [1.79,{height:-.04,open:.61,stroke:.17,fan:.28}]]}
 };
 function actionFrame(action,time,timing){
  if(!action)return neutral;
  const release=timing?.release??action.release,duration=timing?.duration??action.duration;
  const phase=time<=release?time/release:1+(time-release)/(duration-release);
  if(phase<=0||phase>=2)return neutral;
  let start=0,end=2,a=neutral,b=neutral;
  for(const [at,pose] of action.frames){if(at>=phase){end=at;b=pose;break;}start=at;a=pose;}
  const u=clamp((phase-start)/(end-start)),blend=u*u*(3-2*u),out={};
  for(const ch in neutral)out[ch]=(a[ch]||0)+blend*((b[ch]||0)-(a[ch]||0));
  return out;
 }
 function clips(form,motion){
  const bird=form==='completa';
  return [{id:'idle',label:bird?'Pousado':'Respiração',duration:cycleTimes.idle},
   {id:'walk',label:bird?'Passos no poleiro':'Passada',duration:cycleTimes.walk},
   {id:'run',label:bird?'Corrida para decolagem':'Corrida',duration:cycleTimes.run},
   ...flightClips.clips(form),{id:'flight',label:'Voo batido',duration:cycleTimes.flight},{id:'glide',label:'Planar',duration:cycleTimes.glide},
   {id:'jump',label:'Salto',duration:.92},{id:'takeoff',label:'Impulso e decolagem',duration:.82},
   {id:'land',label:'Aproximação e pouso',duration:.76},{id:'turn',label:'Curva em voo',duration:.90},
   {id:'brake',label:'Frenagem em solo',duration:.62},{id:'jab',label:bird?'Bicada':'Garra esquerda',duration:.35},
   {id:'direto',label:bird?'Talão direito':'Garra direita',duration:.43},{id:'gancho',label:bird?'Golpe de asa':'Talho ascendente',duration:.56},
   {id:'falcao0',label:bird?'Mergulho Real':'Talho das Asas',duration:.69},{id:bird?'falcao2':'falcao1',label:'Transformação',duration:.8},
   {id:'despertar_falcao',label:'Grito do Falcão',duration:.92},{id:'dash',label:'Esquiva',duration:.4},
   {id:'swim',label:bird?'Nado de superfície':'Travessia com asas recolhidas',duration:1.2,loop:true},
   {id:'tread',label:'Flutuação',duration:2.4,loop:true},{id:'death',label:'Queda e repouso',duration:1.55},
   ...Object.entries(dodgePreviews).map(([id,label])=>({id,label,duration:.40})),...Object.entries(actions).map(([id,a])=>({id,label:a.labels[bird?1:0],duration:motion?.clips[id]?.duration??a.duration}))];
 }
 const mix=(a,b,w)=>a+(b-a)*w;
 function ease(a,b,t){const u=clamp((t-a)/(b-a));return u*u*(3-2*u);}
 function strideRate(form,drive){
  if(drive<.0001)return 0;
  return tau*(form==='completa'?1.36+.74*drive:1.10+.76*drive);
 }
 function strideSample(phase,drive,bird){
  const p=(phase/tau%1+1)%1,duty=mix(bird?.66:.63,bird?.51:.50,drive);
  const u=p<duty?p/duty:(p-duty)/(1-duty);
  const planted=p<duty;
  // Cubic Hermite return matches the velocity of the planted digit at both ends.
  const blend=u*u*(3-2*u),swing=planted?0:Math.sin(Math.PI*u)**2;
  const track=planted?1-2*u:-1+2*blend-2*(1-duty)/duty*u*(1-u)*(1-2*u);
  const distance=drive>.0001?(bird?3.6:4.2)*drive*duty*tau/(2*strideRate(bird?'completa':'hibrida',drive)):0;
  const contact=planted?ease(0,.12,u)*(1-ease(.84,1,u)):0;
  const roll=planted?.09*(1-ease(0,.19,u))-.13*ease(.80,1,u):-.13*Math.cos(Math.PI*u);
  return {reach:distance*track,swing:swing*drive,support:1-ease(.04,.40,drive)*(1-contact),roll:roll*drive};
 }
 // Keep the knee flexed at the ends of a long step. Shorten the horizontal
 // reach smoothly, preserving sole height as the body passes the planted foot.
 function softenStep(goal,hip,length){
  const reach=length*.981,vertical=goal.y-hip.y,limit=Math.sqrt(Math.max(.0001,reach*reach-vertical*vertical));
  const dx=goal.x-hip.x,dz=goal.z-hip.z,span=Math.hypot(dx,dz);
  const soft=Math.min(length*.14,limit*.52),start=limit-soft;
  if(span>start&&span>.0001){
   const scale=(limit-soft*Math.exp((start-span)/soft))/span;
   goal.x=hip.x+dx*scale;goal.z=hip.z+dz*scale;
  }
 }
 // Asymmetry separates the pressure stroke from the folded return. The different
 // sample phases across the three wing bones propagate the force out to the tip.
 function wingCycle(a){return Math.cos(a+.19*Math.sin(a)+.08*Math.sin(2*a));}
 // A falcon on the water supports its chest with the inner wings. The long tips
 // fold on recovery while the feet alternate short, backward sculling strokes.
 function waterPose(T,motion,data,rig,state){
  const j=rig.joints,bird=rig.form==='completa',t=state.t||0;
  const drive=clamp(state.gait??(state.id==='tread'?0:1));
  const phase=state.phase??tau*t/(state.id==='tread'?2.4:1.2);
  const rock=Math.sin(phase),wave=Math.cos(2*phase);
  if(bird){
   j.dorso.position.set(.022*drive*rock,1.10+.029*wave,.024*drive*wave);
   j.dorso.rotation.set(-.091+.047*drive+.035*wave,.048*drive*rock,.060*rock);
   j.pescoco.position.z=.45+.048*drive*Math.sin(2*phase-.36);
   j.pescoco.rotation.set(-.105-.036*wave,-.022*rock,-.034*rock);
   j.cabeca.rotation.set(-.095+.018*wave,.031*Math.sin(phase-.32),-.027*rock);
  }else motion.apply(T,rig,data,state);
  for(const [side,sign] of sides){
   const a=phase+(sign<0?Math.PI:0),sweep=Math.sin(a),returning=(1+Math.cos(a))*.5;
   if(bird){
    j['coxa_'+side].rotation.set(.29+drive*.66*sweep,sign*.04,sign*(.17+.12*returning));
    j['tarso_'+side].rotation.set(-.85-.37*returning+.16*drive*sweep,0,0);
    j['pe_'+side].rotation.set(.58+.40*returning-.16*sweep,sign*.08,0);
   }
   j['garras_'+side].rotation.set(.065+.39*returning,sign*.04,0);
   j['halux_'+side].rotation.set(-.10-.43*returning,0,0);
   const sweepSize=(bird?.46:.19)*drive+.09;
   const pull=Math.sin(a-.18),wrist=Math.sin(a-.58);
   j['asa_'+side].rotation.set(bird?-.06:-.66,sign*((bird?.53:1.03)+sweepSize*pull),sign*(.18+.13*returning));
   j['carpo_'+side].rotation.set(-.08+.10*returning,sign*(.41+sweepSize*wrist+.31*returning),sign*(.045+.10*wrist));
   j['primarias_'+side].rotation.set(.04+.11*returning,sign*(-.18+.20*returning),sign*(.08+.07*Math.sin(a-.85)));
   j['leque_'+side].rotation.set(0,-sign*(.17+.046*wave),0);
   rig.contacts['pe_'+side]=0;
  }
  j.cauda.rotation.set((bird?-.105:-.70)+.055*wave,.085*rock,-.046*rock);
  j.bico.rotation.set(.026+.016*(1+wave),0,0);
 }
 function fallPose(T,motion,data,rig,state){
  const j=rig.joints,bird=rig.form==='completa',t=Math.min(state.t||0,1.15);
  const knees=ease(.035,.36,t),drop=ease(.19,.74,t),settle=ease(.75,1.15,t),hit=peak(t,.72,.09,.18);
  if(bird){
   animate(T,motion,data,rig,{id:'idle',t:0,clock:0,gait:0,phase:0});
   j.dorso.position.set(-.08*knees-.16*drop,1.07-.22*knees-.26*drop-.04*hit,.12*drop);
   j.dorso.rotation.set(.22*knees+.07*drop,.12*drop,.17*knees+1.11*drop-.11*settle);
   j.pescoco.rotation.x+=.22*knees+.27*drop;
   j.cabeca.rotation.set(-.07+.17*drop,.17*drop,-.16*drop+.1*hit);
   for(const [side,sign] of sides){
    j['coxa_'+side].rotation.x+=.42*knees;
    j['tarso_'+side].rotation.x-=.64*knees;
    j['pe_'+side].rotation.set(.18+.19*drop,sign*.08*drop,0);
   }
  }else motion.apply(T,rig,data,{id:'death',t});
  for(const [side,sign] of sides){
   const near=sign<0,brace=peak(t,near?.40:.51,.31,.29);
   j['asa_'+side].rotation.set((bird?-.13:-.91)+(bird?.22:.06)*drop,sign*(1.15-.70*brace-(bird?.12:.38)*drop),sign*(-.11+(bird?.51:.23)*brace+(bird?.14:-.88)*drop));
   j['carpo_'+side].rotation.set(-.06+.12*hit,sign*(.43-.43*brace+.08*drop),sign*(-.1+.26*brace));
   j['primarias_'+side].rotation.set(-.05+.21*hit,sign*(-.19+.11*drop),sign*(-.09+.12*brace));
   j['leque_'+side].rotation.set(0,-sign*(.03+.19*knees-.14*settle),0);
   j['garras_'+side].rotation.set(.38*drop,0,0);j['halux_'+side].rotation.set(-.43*drop,0,0);rig.contacts['pe_'+side]=0;
  }
  j.cauda.rotation.set((bird?-.20:-.83)+.16*knees+(bird?-.22:1.65)*drop+.13*settle,.15*drop,.12*drop);
  j.bico.rotation.set(.024+.10*knees-.08*settle,0,0);
  // In the falling pose a feather, paw or tail may become the first support.
  // Sample the displayed mesh once per pose and reuse the terminal contact.
  const contact=rig.fallContact??={time:-1,offset:0,bounds:new T.Box3(),origin:new T.Vector3(),scale:new T.Vector3()};
  if(contact.time!==t){
   rig.root.updateWorldMatrix(true,true);
   const floor=rig.root.getWorldPosition(contact.origin).y,scale=rig.root.getWorldScale(contact.scale).y;
   contact.offset=.01+(floor-contact.bounds.setFromObject(rig.root,true).min.y)/scale;
   contact.time=t;
  }
  (bird?j.dorso:j.cintura).position.y+=contact.offset;
 }
 function animate(T,motion,data,rig,state){
  if(state.id==='swim'||state.id==='tread'){waterPose(T,motion,data,rig,state);return;}
  if(state.id==='death'){fallPose(T,motion,data,rig,state);return;}
  if(dodgePreviews[state.id]){
   state={...state,id:'falcao_dash',dashDirection:motion.clips[state.id].previewDirection,t:(state.t||0)*motion.clips.falcao_dash.duration/.40};
  }
  const phrase=flightClips.sample(state.id,state.t||0,rig.form);
  if(phrase)state=phrase.pose;
  const j=rig.joints,bird=rig.form==='completa',id=state.id||'idle',t=state.t||0,clock=state.clock??t;
  const loop=state.clock===undefined&&cycleTimes[id]?tau*t/cycleTimes[id]:null;
  const unit=loop??clock*tau/2.8,breath=Math.sin(unit);
  const takeClip=id==='takeoff',landClip=id==='land',turnClip=id==='turn',brakeClip=id==='brake';
  const prep=takeClip?peak(t,.15,.15,.105):0;
  const kickOff=takeClip?peak(t,.248,.13,.165):0;
  const touchdown=landClip?peak(t,.50,.115,.235):0;
  const rise=clamp(state.rise??(takeClip?ease(.19,.39,t)*(1-ease(.53,.82,t)):landClip?-(1-ease(.33,.48,t)):0),-1,1);
  const turn=clamp(state.turn??(turnClip?peak(t,.46,.38,.41):0),-1,1);
  const braking=clamp(state.brake??(brakeClip?peak(t,.215,.215,.36):0));
  const drive=clamp(state.drive??state.gait??(id==='walk'?.52:id==='run'?1:brakeClip?.80*(1-ease(.03,.50,t)):0));
  const taking=Math.max(kickOff,clamp(state.takeoff||0)),crouch=Math.max(prep,taking*.26);
  const compression=clamp(state.compression??state.landing??touchdown);
  const flare=clamp(state.flare??(landClip?ease(0,.255,t)*(1-ease(.43,.74,t)):0));
  const fly=clamp(state.flightMix??(takeClip?ease(.245,.48,t):landClip?1-ease(.388,.435,t):id==='flight'||id==='glide'||turnClip?1:Number(state.flying)||0));
  const glide=clamp(state.glideMix??(id==='glide'||turnClip?1:landClip?.65*(1-ease(.18,.46,t)):Number(state.gliding)||0));
  const air=clamp(state.air??(id==='jump'?Math.sin(Math.PI*clamp(t/.80)):fly));
  const lift=Math.max(fly,air*.86),groundDrive=drive*(1-lift),phase=state.phase??loop??t*(bird?12.3:10.8);
  const wave=state.flapPhase??(loop===null?clock*tau/.84:loop);
  // Take-off begins with the wings lifted. The first high-force downstroke follows toe-off.
  const wingAngle=state.flapPhase??(takeClip?(t-.22)*tau/.70:landClip?(t+.20)*tau/.86:wave);
  const forward=clamp(state.forwardAir??(id==='glide'||turnClip?.91*lift:0));
  const demand=clamp(state.liftDemand??Math.max(0,rise)),power=clamp(state.wingPower??(1-glide*.96));
  const wingWork=lift*power,stroke=wingCycle(wingAngle);
  // Stroke starts high and travels down from 0 to π. Fold on the upward
  // recovery only, while the flight feathers trail the change at the wrist.
  const recovery=.5-.5*Math.sin(wingAngle),coast=forward*(1-power);
  const collection=clamp(state.collection??0),stepLead=clamp(state.stepLead??0,-1,1);
  const arrival=collection*Math.max(flare,state.touchdownMix||0);
  const airborne=clamp(Math.max(fly,air));
  const beatLoad=wingWork*(.66*Math.sin(wingAngle-.48)+.22*Math.sin(2*wingAngle-.70));
  const attack=['jab','direto','gancho','falcao0'].includes(id),skill=id==='falcao0',release=motion.clips[id]?.release??(skill?.21:.16);
  const signature=actions[id],f=actionFrame(signature,t,motion.clips[id]);
  const span=motion.clips[id]?.duration??signature?.duration??1;
  const outer=signature?actionFrame(signature,t-.037*Math.sin(Math.PI*clamp(t/span)),motion.clips[id]):neutral;
  const hit=attack?peak(t,release,skill?.19:.13,skill?.31:.21):0;
  const bloom=id==='falcao1'||id==='falcao2'?peak(t,release,.27,.40):0;
  const cry=id==='despertar_falcao'?peak(t,.40,.31,.40):0,dodge=id==='dash'?peak(t,.17,.13,.21):0;
  const tuck=bird&&skill?peak(t,release+.10,.18,.185):dodge*.36;
  const weightShift=Math.sin(phase+.18)*groundDrive,sideLoad=-turn*(.11*groundDrive+.61*lift);
  const travelling=forward*lift,streamline=travelling*(1-.85*flare)*(1-tuck);
  const lean=streamline*(bird?.18:.38)-lift*demand*.10+Math.min(rise,0)*-.035;
  const groundRhythm=2*phase-.56;
  const headReach=(.64*Math.sin(groundRhythm)-.24*Math.sin(2*groundRhythm+.15))*groundDrive;
  const feetSeek=clamp(flare*.95+Math.max(-rise,0)*.15+compression*.24);
  const footAir=state.grounded===true?0:airborne*(state.grounded===false?ease(0,.21,air):1);
  const feetFold=clamp(footAir*(1-feetSeek)*(1-tuck*.56));
  const brakeLean=braking*(1-lift),bank=sideLoad+f.bank*(bird?1:.58);
  const explicitLeg=!signature&&!attack&&!bloom&&!cry||bird||lift>.01;
  if(!bird){
   motion.apply(T,rig,data,{...state,id,t,clock:loop===null?clock:loop/2.4,phase,gait:groundDrive,air,landing:0,externalLegs:explicitLeg});
   const pelvis=j.cintura;
   pelvis.position.x+=weightShift*.055;pelvis.position.y+=beatLoad*.044-.126*crouch-.110*compression-.053*brakeLean;
   pelvis.position.z+=.065*lift-.082*brakeLean-.05*compression;
   pelvis.rotation.x+=.21*lift-.16*flare+.11*crouch-.15*brakeLean+.65*lean;
   pelvis.rotation.z+=bank*.49-.026*weightShift;
   j.tronco.rotation.x+=.17*lift+.115*brakeLean-.20*flare+.071*beatLoad+.055*hit+f.pitch*.37+.35*lean;
   j.tronco.rotation.y+=.052*weightShift+turn*.12+f.turn*.21;j.tronco.rotation.z+=bank*.40+.040*weightShift;
   j.cabeca.rotation.x+=-.29*lift+.24*flare-.09*beatLoad-cry*.27+f.neck*.37-.79*lean;
   j.cabeca.position.z+=.024*headReach;
   j.cabeca.rotation.z+=-.55*bank-.035*weightShift;j.cabeca.rotation.y+=.16*turn;
   j.braco_E.rotation.z+=.24*lift+.095*brakeLean;j.braco_D.rotation.z-=.24*lift+.095*brakeLean;
   j.braco_E.rotation.x+=.13*lift+.075*weightShift;j.braco_D.rotation.x+=.13*lift-.075*weightShift;
   if(skill){j.tronco.rotation.y+=.25*hit;j.ombro_D.rotation.z-=.23*hit;}
  }else{
   const bob=(.032*Math.cos(groundRhythm)-.013)*groundDrive;
   const base=j.dorso,pt=.038+.16*groundDrive+.115*lift-.20*flare+.51*tuck-.14*cry+f.pitch+.069*beatLoad-.165*brakeLean+.10*crouch+.13*compression+lean;
   base.position.set(weightShift*.061,1.07+.013*breath+bob-.135*crouch-.146*compression-.062*brakeLean+.052*beatLoad+lift*.053+f.height,f.reach+.063*lift-.085*brakeLean-.057*compression);
   base.rotation.set(pt,.06*weightShift+.17*turn+f.turn*.70,bank+.047*weightShift);
   j.pescoco.position.z=.45+.069*headReach+.040*streamline;
   j.pescoco.rotation.set(-.11-.50*lean-.038*headReach-.22*lift-.30*cry+.18*hit+.06*flare-.16*compression+.15*brakeLean-.074*beatLoad+f.neck*.62,.10*turn+f.turn*.21,-.24*bank);
   j.cabeca.rotation.set(-.07-.36*lean+.023*headReach-.53*tuck-.13*hit+.145*flare+.035*compression-.06*groundDrive+f.neck*.38,-.104*Math.sin(unit)*(1-lift)*(1-hit)+.22*turn+f.turn*.09,.018*breath-.53*bank-.027*weightShift);
  }
  const direction=state.dashDirection,shift=direction?peak(t,release+.08,release+.08,Math.max(.13,span-release-.08)):0;
  const lateral=(direction?.x||0)*shift,back=Math.max(0,-(direction?.z||0))*shift,slide=direction?.slide?shift:0;
  const sprint=clamp(state.runBlend??(id==='run'?1:0))*groundDrive;
  const spine=bird?j.dorso:j.cintura;
  if(bird){
   spine.position.x+=.11*lateral;spine.position.y-=.21*slide+.07*back;
   spine.rotation.z-=.24*lateral;spine.rotation.x+=.46*slide-.39*back+.085*sprint;
   j.pescoco.rotation.x-=.27*slide-.19*back+.05*sprint;j.cabeca.rotation.z+=.12*lateral;
  }
  for(const [side,sign] of sides){
   const foot=strideSample(phase+(sign<0?Math.PI:0),groundDrive,bird);
   const kick=Math.max(0,sign*f.foot)+(bird?(id==='direto'&&sign<0?1:id==='gancho'&&sign>0?.58:skill?.67:0)*hit:0);
   const lead=(1+sign*stepLead)*.5,trailing=1-lead;
   const lastPush=collection*taking,stagger=arrival*trailing;
   const releasing=lastPush*lead,receiving=arrival*lead;
   let support=foot.support*(1-ease(.018,.28,footAir))*(1-clamp(kick));
   if(groundDrive<.025&&footAir<.015&&kick<.01)support=1;
   if(state.grounded===false)support=0;
   else support=clamp(Math.max(receiving,support)*(1-Math.max(stagger,releasing)));
   rig.contacts['pe_'+side]=support;
   if(explicitLeg){
    const height=bird?.154:.25,amplitude=bird?.235:.275,legFold=bird?.36:.43;
    const raised=stagger*(bird?.15:.19)+releasing*(bird?.11:.16);
    const ankleY=height+foot.swing*amplitude*(1-receiving)+feetFold*(legFold+streamline*.16)+footAir*feetSeek*.075+raised+kick*(bird?.34:.21);
    const ankleZ=(bird?.066:sign*.070)+foot.reach*(1-.48*arrival)-feetFold*((bird?.45:.52)+streamline*(bird?.20:.24))+feetSeek*footAir*(bird?.30:.26)+arrival*(lead*.17-trailing*.10)+lastPush*(lead*.07-trailing*.12)+kick*(bird?.68:.48);
    const ankle=new T.Vector3(sign*((bird?.235:.31)+feetSeek*.058+kick*.045),ankleY,ankleZ);
    ankle.x+=lateral*(sign*lateral>0?.31:.10);ankle.z+=sign*(.18*slide-.21*back);
    ankle.y+=sprint*foot.swing*.10+.07*shift*Math.max(0,sign*(direction?.x||0));
    const roll=.30*foot.roll+feetFold*(.67+.38*streamline)+foot.swing*.11-feetSeek*footAir*.50+.15*stagger-kick*.51;
    const chain=bird?[j['coxa_'+side],j['tarso_'+side],j['pe_'+side]]:[j['coxa_'+side],j['canela_'+side],j['pe_'+side]];
    const pole=rig.root.worldToLocal(chain[0].getWorldPosition(new T.Vector3()));
    softenStep(ankle,pole,bird?.95:1.45);
    pole.set(sign*(bird?.33:.40),bird?.61:.98,bird?-1.35:1.65);
    motion.twoBone(T,rig,...chain,ankle,pole,bird?.47:.73,bird?.48:.72,roll);
   }
   // Three front digits curl in opposition to the hallux, then spread before contact.
   const grasp=clamp(feetFold*(1+.15*streamline)+.29*foot.swing+.16*releasing)*(1-clamp(kick))*(1-feetSeek*.35);
   j['garras_'+side].rotation.set(.77*grasp-.15*feetSeek-.12*kick,sign*(.042*grasp-.052*feetSeek),0);
   j['halux_'+side].rotation.set(-.89*grasp+.12*feetSeek+.15*kick,-sign*.052*grasp,0);
  }
  const extend=clamp(Math.max(lift*(1-f.fold),.90*bloom,.95*cry,(skill&&!bird?1:.52)*hit,.55*dodge,f.open,.96*taking,.90*flare,.20*brakeLean));
  const fold=1-extend,guard=1-Math.max(f.open,f.fold),recover=wingWork*recovery*guard;
  for(const [side,sign] of sides){
   const off=(id==='direto'&&sign<0||id==='gancho'&&sign>0)?hit*.19:0;
   const slice=Math.max(0,sign*f.blade),tipSlice=Math.max(0,sign*outer.blade);
   // Upstroke narrows the span at the wrist. Downstroke opens feather overlap;
   // the smaller outside-wing beat and tail deflection steer a banked turn.
   const bankWing=turn*sign*lift,amplitude=wingWork*(1-.15*bankWing)*guard;
   const shoulderStep=groundDrive*Math.sin(phase+sign*Math.PI*.5),wristStep=groundDrive*Math.sin(phase-.39+sign*Math.PI*.5);
   const sweep=streamline*(.105+.32*recovery*power)-.075*coast;
   const hang=glide*lift*.043*Math.sin(wingAngle+(sign<0?.40:0));
   const driveStroke=stroke*(.68+.085*demand)*amplitude;
   const wristStroke=wingCycle(wingAngle-.57)*(.32+.052*forward)*amplitude;
   const tipStroke=wingCycle(wingAngle-1.14)*(.235+.035*forward)*amplitude;
   const ready=takeClip?prep*.58+taking*.25:taking*.53;
   const elevation=-.13*fold+.06*extend+driveStroke+ready+.265*flare+hang+.27*bloom+.20*cry+off+f.stroke;
   const floorGuard=clamp(air/.70);
   const rootRoll=Math.max(-.27-.48*floorGuard,elevation+.027*shoulderStep+.048*coast);
   j['asa_'+side].rotation.set((bird?-.12:-.91)*fold-.055*extend+.11*recover+.105*flare+.084*streamline+.029*shoulderStep,
    sign*((bird?1.19:1.10)*fold+.018*extend+.29*recover+tuck+.25*f.fold-1.26*slice+.085*bankWing+sweep),
    sign*(rootRoll-.13*bankWing+(sign<0?.14:-.075)*Math.abs(f.blade)),'XYZ');
   j['carpo_'+side].rotation.set(-.055*fold-.15*amplitude*Math.sin(wingAngle-.44)+.15*flare+.042*wristStep,
    sign*(.43*fold+.072*extend+.47*recover+.33*tuck-.77*slice-.12*flare+.14*sweep-.10*coast),
    sign*(-.10*fold+.11*extend+wristStroke+.14*ready-.095*flare+.29*outer.stroke-.085*bankWing),'XYZ');
   j['primarias_'+side].rotation.set(-.045*fold-.21*amplitude*Math.sin(wingAngle-.88)+.12*flare,
    sign*(-.21*fold+.027*extend+.32*recover+.29*tuck-.29*tipSlice-.14*flare+.16*recovery*streamline),
    sign*(-.085+tipStroke-.11*flare+.22*outer.stroke-.052*bankWing),'XYZ');
   j['asa_'+side].rotation.z+=.24*lateral+sign*(.18*back-.08*slide);
   j['carpo_'+side].rotation.y+=.19*lateral+sign*.16*slide;
   j['primarias_'+side].rotation.z+=.10*lateral;
   j['leque_'+side].rotation.set(-.046*flare+wingWork*.027*Math.sin(wingAngle-.62),
    -sign*(.029+.12*extend+.31*flare+.065*demand-.083*streamline+.13*compression+.09*brakeLean+.075*Math.abs(turn)-.075*tuck+.28*f.fan),
    sign*(-.054*flare-.029*Math.abs(turn)));
  }
  j.cauda.rotation.set((bird?-.20:-.83)*(1-lift)+.039*breath+.09*headReach-.28*lean+.25*tuck+.25*flare-.14*compression-.14*brakeLean-.071*beatLoad-f.pitch*.53,
   .043*Math.sin(unit)+.068*hit-turn*(.27*lift+.13*groundDrive)-f.turn*.52,-.27*bank-.035*weightShift);
  j.bico.rotation.set(.022+.015*(breath+1)+.29*hit+.38*cry+.065*bloom+f.bill+.044*taking,0,0);
  return phrase?.height;
 }
 // FRUTO Legacy (atualização 21): golpes M1 das formas completas entram na mesma tabela
 function registerActions(defs){Object.assign(actions,defs);}
 return {create,animate,clips,strideRate,fileNames,contactTimes:flightClips.contacts,registerActions,hasAction:id=>!!actions[id]};
})();

/* Besta do Marfim.
   - Forma Híbrida: corpo humanoide forte mantendo rosto/tronco voxel base, modificando apenas braços, pernas, cauda, chifres, olhos e cabelo branco e vermelho.
   - Forma Completa: corpo musculoso e atlético estilo cavalo + tigre, maior e imponente, com chifres rubros, armadura carmesim/marfim e cauda em chama erguida. */
export const FRUTOMythBeast=(()=>{
 const wolf=typeof FRUTOWolf!=='undefined'?FRUTOWolf:require('./wolf.js');
 const fileNames={hibrida:'Besta_Hibrida.glb',completa:'Besta_Completa.glb'};
 const palettes={
  fur:['#aba5b8','#e3e0ea','#ffffff','#f2eff7'],
  silver:['#787285','#b9b5c4','#f5f3fa','#d2cedc'],
  dark:['#1c0c14','#33121e','#592634','#260f19'],
  horn:['#24060d','#6e0c1d','#c81d2e','#8f1124'],
  ruby:['#4a0714','#980f24','#eb2f3e','#b8142c'],
  enamel:['#7a0b1d','#cc142b','#ff5454','#e82238'],
  pearl:['#c9c0cc','#ece7ee','#ffffff','#f7f2f6'],
  tooth:['#b5a39d','#ebdcca','#fff8e6','#f5ead8'],
  socket:['#1a0810','#290c17','#3d1221','#220a14'],
  eye:['#ff2814','#ff7722','#fff088','#ff521c'],
  skin:['#9ba3a0','#c7cfca','#e4eae6','#b4bcb8']
 };
 const geometryCache=new WeakMap(),materialCache=new WeakMap();
 function sculpt(T,models,id,form,level){
  let cache=geometryCache.get(T);if(!cache){cache=new Map();geometryCache.set(T,cache);}
  const key=[form,id,level].join('/');if(cache.has(key))return cache.get(key);
  const surface=new models.Surface(T),rgb={};
  for(const [tone,ramp] of Object.entries(palettes))rgb[tone]=ramp.map(c=>new T.Color(c).toArray());
  const vec=p=>new T.Vector3().fromArray(p),sides=[1,-1];
  const hi=level===0,med=level<2,quad=form==='completa',side=id.endsWith('_E')?1:-1,kind=id.split('_')[0];
  const face=(p,n,c,f)=>surface.polygon(models.oriented(p,n.toArray()),rgb[c][f]);
  const box=(c,sz,tone='skin',f=1)=>models.bevel(surface,c,sz,hi?Math.min(...sz)*.08:0,rgb[tone][f]);
  function sweep(rows,color,guide=[1,0,0],facets=8-level*2){
   let lastU=null;
   const centers=rows.map(r=>vec(r));
   const rings=rows.map((row,i)=>{
    const tangent=centers[Math.min(i+1,rows.length-1)].clone().sub(centers[Math.max(i-1,0)]).normalize();
    let u=vec(guide).addScaledVector(tangent,-vec(guide).dot(tangent));
    if(u.lengthSq()<.05){u=(lastU||new T.Vector3(0,0,1)).clone();u.addScaledVector(tangent,-u.dot(tangent));}
    if(u.lengthSq()<.01)u.crossVectors(tangent,new T.Vector3(0,1,0));
    u.normalize();if(lastU&&u.dot(lastU)<0)u.negate();lastU=u;
    const v=new T.Vector3().crossVectors(tangent,u).normalize();
    return Array.from({length:facets},(_,j)=>{const a=2*Math.PI*(j+.5)/facets;return centers[i].clone().addScaledVector(u,row[3]*Math.cos(a)).addScaledVector(v,row[4]*Math.sin(a));});
   });
   const along=centers.at(-1).clone().sub(centers[0]);
   face(rings[0].map(p=>p.toArray()),along.clone().negate(),color,0);
   for(let i=1;i<rings.length;i++)for(let j=0;j<facets;j++){
    const k=(j+1)%facets,verts=[rings[i-1][j],rings[i-1][k],rings[i][k],rings[i][j]];
    const outward=verts[0].clone().add(verts[1]).multiplyScalar(.5).sub(centers[i-1]);
    const light=outward.clone().normalize().dot(new T.Vector3(-.24,.82,.52));
    face(verts.map(p=>p.toArray()),outward,color,light>.62?2:light>.10?1:light>-.42?3:0);
   }
   face(rings.at(-1).map(p=>p.toArray()),along,color,1);
  }
  function lock(a,b,width,tone='fur',depth=width*.54,guide=[1,0,0],tipTone=null){
   const middle=a.map((v,i)=>v*.56+b[i]*.44);middle[1]+=.08*width;
   if(tipTone&&med){
    const split=a.map((v,i)=>v*.28+b[i]*.72);split[1]+=.04*width;
    sweep([[...a,width*.62,depth*.68],[...middle,width,depth],[...split,width*.58,depth*.55]],tone,guide,level===2?4:5);
    sweep([[...split,width*.58,depth*.55],[...b,.007,.007]],tipTone,guide,level===2?4:5);
   }else{
    sweep([[...a,width*.65,depth*.7],[...middle,width,depth],[...b,.006,.006]],tone,guide,level===2?4:5);
   }
  }
  function shield(pos,w,h,normal,lean=0,outerTone='enamel',innerTone='pearl'){
   const n=vec(normal).normalize(),u=new T.Vector3().crossVectors(new T.Vector3(0,1,0),n).normalize();
   const v=new T.Vector3().crossVectors(n,u).normalize();
   const at=(x,y,z)=>vec(pos).addScaledVector(u,(x+lean*y)*w).addScaledVector(v,y*h).addScaledVector(n,z);
   const outline=[[-.54,.26],[-.36,.50],[0,.38],[.36,.50],[.54,.26],[.38,-.08],[.18,-.28],[0,-.54],[-.18,-.28],[-.38,-.08]];
   const ring=outline.map(([x,y])=>at(x,y,0)),rim=outline.map(([x,y])=>at(x*.82,y*.84,.055*w));
   const peak=at(0,.12,.20*w);
   for(let i=0;i<outline.length;i++){const k=(i+1)%outline.length;
    face([ring[i],ring[k],rim[k],rim[i]].map(pt=>pt.toArray()),n,outerTone,i%2===0?2:1);
    face([rim[i],rim[k],peak].map(pt=>pt.toArray()),n,i===0||i===4||i===5||i===9?'silver':innerTone,i<5?2:1);
   }
   if(med){
    const tip=at(0,-.44,.065*w);
    face([at(-.08,.25,.18*w),peak,tip].map(p=>p.toArray()),n,'ruby',1);
    face([peak,at(.08,.25,.18*w),tip].map(p=>p.toArray()),n,'enamel',2);
   }
  }
  function band(y0,y1,rx,rz,zOff=0,tone='enamel'){
   sweep([[0,y0,zOff,rx*.96,rz*.96],[0,(y0+y1)*.5,zOff,rx*1.08,rz*1.08],[0,y1,zOff,rx*.95,rz*.95]],tone,[1,0,0],level===2?5:8);
  }

  // ===== FORMA HÍBRIDA: corpo humanoide forte, membros, cauda, chifres e olhos; sem cabelo =====
  if(!quad){
   if(id==='cabeca'){
    // Rosto humanoide voxel base (sem focinho)
    box([0,.48,0],[1.02,.96,.94],'skin',1);
    box([0,.02,0],[.44,.22,.42],'skin',0);
    // Olhos vermelhos brilhantes da Besta
    for(const q of sides){
     const z=.476,ey=.52;
     face([[q*.12,ey-.05,z],[q*.38,ey-.03,z],[q*.36,ey+.07,z],[q*.14,ey+.05,z]],vec([0,0,1]),'socket',0);
     face([[q*.15,ey-.03,z+.006],[q*.35,ey-.015,z+.006],[q*.33,ey+.05,z+.006],[q*.17,ey+.035,z+.006]],vec([0,0,1]),'eye',2);
     // Chifres curvos carmesim saindo das têmporas
     sweep([
      [q*.46,.76,.02,.16,.15],
      [q*.72,.84,.06,.135,.125],
      [q*.92,1.04,.10,.10,.095],
      [q*.92,1.28,.15,.060,.056],
      [q*.80,1.48,.20,.010,.010]
     ],'horn',[0,0,1],med?8:5);
     if(med)sweep([[q*.46,.76,.02,.18,.17],[q*.56,.79,.035,.165,.155]],'enamel',[0,0,1],6);
    }
    // Cabeça sem cabelo: preserva rosto, olhos e chifres.
   }else if(id==='mandibula'||kind==='orelha'){
    // Sem focinho ou orelhas animais na forma híbrida
   }else if(id==='tronco'||id==='cintura'){
    // Corpo humanoide forte e musculoso
    if(id==='tronco'){
     box([0,.54,0],[1.44,1.08,.78],'skin',1);
     box([0,.02,0],[.86,.20,.52],'skin',0);
     // Peitoral forte esculpido
     for(const q of sides)box([q*.32,.74,.38],[.54,.36,.16],'skin',2);
     if(med)box([0,.32,.36],[.74,.36,.10],'skin',3);
    }else{
     box([0,.22,0],[1.10,.44,.64],'skin',1);
     box([0,.38,0],[1.12,.08,.66],'ruby',1);
    }
   }else if(kind==='cauda'){
    const tip=id==='cauda_ponta',mid=id==='cauda_meio',wide=tip?.40:mid?.32:.28;
    sweep([[0,.02,.08,wide*.65,wide*.68],[0,-.02,-.20,wide,wide],[0,.08,-.46,wide*.92,wide*.84],[0,tip?.38:.06,tip?-.94:-.62,tip?.016:wide*.60,tip?.014:wide*.62]],mid?'pearl':'fur');
    for(const q of sides){
     lock([q*wide*.38,.02,-.14],[q*wide*(tip?1.26:1.04),.14,-.70],wide*.54,'enamel',wide*.32);
     if(med)lock([q*wide*.36,.12,-.14],[q*wide*.68,.24,-.78],wide*.42,'fur',wide*.26,[1,0,0],'enamel');
    }
    lock([0,.18,-.14],[0,tip?.52:.22,tip?-1.06:-.68],wide*.48,'enamel',wide*.30);
   }else if(kind==='pe'||kind==='mao'){
    const hand=kind==='mao',width=hand?.28:.29,height=hand?-.16:-.10,length=hand?.30:.50;
    sweep([[0,height+.03,-.18,width*.86,.13],[0,height+.01,.00,width*1.28,.17],[0,height-.04,length*.56,width*1.32,.13],[0,height-.05,length*.86,width*1.04,.095]],'fur');
    if(med)band(height+.08,height,width*1.12,width*1.14,-.04,'enamel');
    const digits=level===2?3:4;
    for(let i=0;i<digits;i++){
     const u=i/(digits-1)*2-1,x=u*width*.92,z=length-Math.abs(u)*.068,w=width*.37;
     sweep([[x*.9,height-.024,z-.20,w,.096],[x,height-.056,z-.04,w*1.15,.090],[x,height-.07,z+.042,w*.86,.058]],'pearl');
     sweep([[x,height-.032,z+.006,w*.74,.062],[x+u*.008,height-.046,z+.092,w*.54,.044],[x+u*.016,height-.11,z+.185,.007,.005]],'tooth');
    }
    if(hand)lock([-side*.20,-.09,.06],[-side*.36,-.28,.24],.085,'tooth');
   }else{
    // Braços e pernas transformados em membros musculosos da Besta (pelagem branca + braceletes/grevas carmesim)
    const shoulder=kind==='ombro',fore=kind==='antebraco'||kind==='canela',thigh=kind==='coxa',arm=kind==='braco';
    const length=shoulder?.28:thigh||kind==='canela'?.72:.62;
    const w=shoulder?.40:thigh?.35:arm?.29:fore?.27:.22;
    sweep([[0,shoulder?.16:.06,0,w*.85,w*1.02],[side*.02,-.22*length,0,w*1.18,w*1.26],[0,-.66*length,0,w*.90,w*1.00],[0,-length,0,w*.72,w*.80]],'fur');
    if(shoulder){
     shield([side*w*.88,.02,.03],w*2.05,.68,[side,.20,.18],side*.13,'enamel','pearl');
     lock([side*w*.60,.14,-.06],[side*(w+.22),.28,-.44],.17,'fur',.10,[1,0,0],'enamel');
    }else if(fore){
     band(-length*.22,-length*.44,w*1.16,w*1.22,0,'enamel');
     band(-length*.54,-length*.88,w*1.06,w*1.12,.01,'ruby');
     shield([0,-.58*length,w*1.02],w*1.60,length*.74,[0,.04,1],0,'enamel','pearl');
     if(med)lock([side*w*.80,-.30*length,-.08],[side*w*1.38,-length*.74,-.16],.09,'enamel',.055);
    }else if(arm||thigh){
     lock([side*w*.62,-.14,0],[side*w*1.24,-.54,-.16],.16,'fur',.09,[1,0,0],'enamel');
     if(med)lock([side*w*.54,-.06,-.08],[side*w*1.42,-.40,-.28],.13,'silver');
    }
   }
   const g=surface.geometry();cache.set(key,g);return g;
  }

  // ===== FORMA COMPLETA: corpo forte e atlético estilo cavalo + tigre, chifres monumentais e cauda em chama =====
  if(id==='cabeca'){
   const y=.03,sc=1.18;
   sweep([[0,y+.24,-.36,.42*sc,.37*sc],[0,y+.26,-.02,.64*sc,.45*sc],[0,y+.21,.34,.55*sc,.37*sc],[0,y+.14,.52,.35*sc,.26*sc]],'fur');
   sweep([[0,y+.14,.26,.39*sc,.24*sc],[0,y+.12,.58,.36*sc,.21*sc],[0,y+.10,.82,.25*sc,.12*sc]],'pearl');
   sweep([[0,y+.16,.68,.23*sc,.10*sc],[0,y+.17,.82,.19*sc,.08*sc],[0,y+.15,.87,.13*sc,.055*sc]],'ruby');
   shield([0,y+.52,.42],.76*sc,.80*sc,[0,.44,1],0,'enamel','pearl');
   if(med)shield([0,y+.26,.65],.34,.38,[0,.38,1],0,'ruby','pearl');
   for(const q of sides){
    sweep([
     [q*.36,y+.46,-.02,.25,.23],
     [q*.68,y+.52,.02,.22,.20],
     [q*.98,y+.70,.06,.18,.165],
     [q*1.16,y+.98,.11,.135,.122],
     [q*1.16,y+1.30,.17,.085,.078],
     [q*1.02,y+1.58,.24,.042,.040],
     [q*.84,y+1.78,.30,.009,.009]
    ],'horn',[0,0,1],hi?10:med?7:5);
    if(med)sweep([[q*.38,y+.46,-.01,.285,.265],[q*.52,y+.49,.01,.26,.24]],'enamel',[0,0,1],8);
    const normal=vec([q*.52,.14,.86]),p=(u,v,z)=>[q*(.19+.30*u),y+.25+v+.14*u,.60-.23*u+z];
    face([p(0,0,.01),p(1,0,.01),p(1,.17,.01),p(0,.105,.01)],normal,'socket',0);
    face([p(.08,.02,.018),p(.92,.06,.018),p(.84,.115,.018),p(.16,.07,.018)],normal,'eye',2);
    if(med)face([p(.46,.038,.022),p(.54,.042,.022),p(.55,.092,.022),p(.47,.088,.022)],normal,'socket',0);
    sweep([[q*.12,y+.39,.62,.06,.064],[q*.38,y+.50,.47,.098,.080],[q*.58,y+.55,.18,.056,.056]],'enamel',[0,1,0],6);
    shield([q*.50,y+.25,.16],.46*sc,.48*sc,[q*.90,.12,.42],q*.16,'enamel','pearl');
    sweep([[q*.26,y+.07,.60,.082,.076],[q*.275,y-.04,.62,.072,.058],[q*.26,y-.19,.61,.044,.040],[q*.22,y-.31,.64,.007,.007]],'tooth');
    if(med){
     lock([q*.19,y+.03,.74],[q*.185,y-.09,.755],.042,'tooth');
     lock([q*.11,y+.02,.78],[q*.105,y-.06,.79],.034,'tooth');
    }
    lock([q*.42,y+.12,-.02],[q*.80,y-.24,-.36],.22,'fur',.13,[1,0,0],'enamel');
    lock([q*.44,y+.30,-.14],[q*.88,y+.24,-.66],.24,'fur',.14,[1,0,0],'ruby');
    lock([q*.36,y+.48,-.12],[q*.76,y+.80,-.62],.23,'fur',.13,[1,0,0],'enamel');
    lock([q*.24,y+.60,-.06],[q*.50,y+1.10,-.46],.21,'pearl',.12,[1,0,0],'ruby');
    if(hi)lock([q*.48,y+.02,.08],[q*.82,y-.34,-.10],.18,'fur',.11,[1,0,0],'ruby');
   }
   lock([0,y+.58,.26],[0,y+1.12,-.04],.17,'pearl',.12,[1,0,0],'enamel');
   lock([0,y+.56,-.06],[0,y+1.20,-.52],.25,'fur',.15,[1,0,0],'ruby');
   if(med)lock([0,y+.50,-.30],[0,y+.98,-.88],.23,'fur',.14,[1,0,0],'enamel');
  }else if(id==='mandibula'){
   sweep([[0,-.03,-.02,.32,.135],[0,-.08,.26,.34,.14],[0,-.08,.50,.26,.105],[0,-.06,.64,.18,.078]],'dark');
   for(const q of sides){
    sweep([[q*.19,-.065,.36,.082,.078],[q*.22,.078,.40,.056,.052],[q*.24,.16,.38,.008,.008]],'tooth');
    lock([q*.14,-.12,.16],[q*.16,-.40,-.02],.11,'fur',.065,[1,0,0],'silver');
   }
   lock([0,-.13,.22],[0,-.46,.04],.125,'pearl',.075);
  }else if(kind==='orelha'){
   lock([0,-.04,-.01],[side*.22,.30,-.34],.135,'fur',.08,[1,0,0],'enamel');
  }else if(kind==='cauda'){
   const tip=id==='cauda_ponta',mid=id==='cauda_meio',wide=tip?.48:mid?.40:.34;
   if(id==='cauda_base'){
    sweep([[0,.02,.08,wide*.70,wide*.74],[0,-.02,-.24,wide,wide*1.04],[0,.08,-.58,wide*.96,wide*.94],[0,.24,-.76,wide*.80,wide*.80]],'fur');
    for(const q of sides)lock([q*wide*.42,.04,-.18],[q*wide*1.18,.24,-.70],wide*.56,'fur',wide*.35,[1,0,0],'enamel');
    lock([0,.24,-.16],[0,.56,-.70],wide*.54,'pearl',wide*.32,[1,0,0],'ruby');
   }else if(mid){
    sweep([[0,.00,.06,wide*.74,wide*.76],[0,.24,-.18,wide*1.06,wide*1.04],[0,.56,-.38,wide*.98,wide*.94],[0,.88,-.48,wide*.74,wide*.74]],'pearl');
    for(const q of sides){
     lock([q*wide*.45,.18,-.14],[q*wide*1.36,.70,-.50],wide*.60,'fur',wide*.36,[1,0,0],'enamel');
     if(med)lock([q*wide*.36,.44,-.26],[q*wide*1.14,1.02,-.58],wide*.50,'enamel',wide*.30);
    }
    lock([0,.28,-.22],[0,1.00,-.66],wide*.56,'enamel',wide*.34);
   }else{
    sweep([[0,.00,.04,wide*.72,wide*.72],[0,.36,-.08,wide*.98,wide*.90],[0,.80,.06,wide*.68,wide*.64],[0,1.32,.30,.018,.018]],'enamel');
    for(const q of sides){
     lock([q*wide*.38,.12,-.06],[q*wide*1.40,.94,-.18],wide*.60,'fur',wide*.36,[1,0,0],'enamel');
     lock([q*wide*.28,.44,-.02],[q*wide*1.00,1.36,.18],wide*.48,'enamel',wide*.30);
    }
    lock([0,.30,-.10],[0,1.52,.20],wide*.54,'enamel',wide*.34);
    if(med)lock([0,.16,.10],[0,1.16,.48],wide*.46,'pearl',wide*.28,[1,0,0],'ruby');
   }
  }else if(id==='dorso'||id==='garupa'||id==='peitoral'||id==='pescoco'){
   // Anatomia poderosa cavalo + tigre: tronco mais longo e atlético, peitoral profundo e garupa musculosa
   if(id==='dorso'){
    sweep([[0,.08,-1.04,.48,.44],[0,.12,-.66,.58,.54],[0,.09,-.18,.54,.48],[0,.18,.30,.70,.66],[0,.17,.86,.72,.70]],'fur');
    shield([0,.58,-.12],.68,.90,[0,1,-.08],0,'enamel','pearl');
    for(const [z,h,len] of [[-.64,.48,.60],[-.18,.54,.68],[.28,.60,.76],[.66,.64,.82]]){
     lock([0,h,z],[0,h+len*.74,z-len],.22,'enamel',.13);
     if(med)for(const q of sides)lock([q*.32,h-.04,z],[q*.62,h+.18,z-.62],.21,'fur',.13,[1,0,0],'ruby');
    }
   }else if(id==='garupa'){
    sweep([[0,.02,-.64,.40,.36],[0,.12,-.24,.64,.60],[0,.11,.14,.62,.56],[0,.10,.46,.50,.48]],'fur');
    shield([0,.58,-.18],.70,.78,[0,.96,-.28],0,'enamel','pearl');
    for(const q of sides){
     shield([q*.58,.15,-.06],.84,.84,[q,.22,-.12],0,'enamel','pearl');
     lock([q*.36,.44,-.12],[q*.62,.40,-.78],.22,'fur',.13,[1,0,0],'enamel');
    }
    lock([0,.50,-.38],[0,.70,-.98],.24,'enamel',.14);
   }else if(id==='peitoral'){
    sweep([[0,.10,-.54,.66,.58],[0,.14,-.08,.84,.78],[0,.24,.24,.82,.76],[0,.32,.50,.60,.56]],'fur');
    shield([0,.02,.58],1.00,1.04,[0,-.10,1],0,'enamel','pearl');
    if(med)shield([0,-.30,.48],.68,.60,[0,-.26,1],0,'ruby','pearl');
    for(const q of sides){
     shield([q*.52,.18,.34],.80,1.16,[q*.62,.04,.78],q*.08,'enamel','pearl');
     lock([q*.36,.60,.16],[q*.82,.72,-.48],.30,'pearl',.17,[1,0,0],'enamel');
     lock([q*.30,.10,.30],[q*.54,-.60,.04],.25,'fur',.15,[1,0,0],'ruby');
    }
    for(let k=0;k<(level===2?2:4);k++)lock([0,.70,.28-k*.20],[0,1.28-k*.07,-.16-k*.25],.22,k%2?'enamel':'pearl',.13,[1,0,0],'enamel');
   }else{
    // Pescoço arqueado e poderoso estilo garanhão/tigre
    sweep([[0,.04,-.24,.62,.56],[0,.18,.08,.62,.62],[0,.32,.44,.52,.52]],'fur');
    for(const q of sides){
     for(const k of [0,1,2,3]){
      if(!med&&k===3)continue;
      lock([q*(.32+k*.05),.50-k*.12,.24-k*.04],[q*(.56+k*.11),.90-k*.26,-.52+k*.04],.24,'fur',.14,[1,0,0],k%2===0?'enamel':'ruby');
     }
    }
    for(let k=0;k<(level===2?2:3);k++)lock([0,.60,.28-k*.20],[0,1.18-k*.06,-.18-k*.24],.22,'pearl',.13,[1,0,0],'enamel');
   }
  }else if(kind==='pata'){
   const width=.285,height=-.08,length=.43;
   sweep([[0,height+.03,-.18,width*.88,.14],[0,height+.01,.00,width*1.30,.18],[0,height-.04,length*.56,width*1.36,.14],[0,height-.05,length*.86,width*1.06,.10]],'fur');
   if(med)band(height+.08,height,width*1.14,width*1.16,-.04,'enamel');
   const digits=level===2?3:4;
   for(let i=0;i<digits;i++){
    const u=i/(digits-1)*2-1,x=u*width*.92,z=length-Math.abs(u)*.068,w=width*.38;
    sweep([[x*.9,height-.024,z-.20,w,.10],[x,height-.056,z-.04,w*1.16,.094],[x,height-.07,z+.044,w*.88,.062]],'pearl');
    sweep([[x,height-.032,z+.006,w*.76,.064],[x+u*.008,height-.046,z+.096,w*.56,.046],[x+u*.016,height-.115,z+.195,.007,.005]],'tooth');
   }
  }else{
   const shoulder=kind==='escapula'||kind==='quadril',fore=kind==='perna',tiny=kind==='jarrete';
   const length=tiny?(id.includes('traseira')?.42:.24):.64;
   const w=shoulder?.42:fore?.305:.225;
   sweep([[0,shoulder?.20:.07,0,w*.86,w*1.04],[side*.02,-.20*length,0,w*1.20,w*1.30],[0,-.64*length,0,w*.92,w*1.04],[0,-length,0,w*.74,w*.82]],'fur');
   if(shoulder){
    shield([side*w*.94,.02,.03],w*2.28,.96,[side,.20,.18],side*.14,'enamel','pearl');
    lock([side*w*.64,.16,-.06],[side*(w+.26),.36,-.50],.19,'fur',.12,[1,0,0],'enamel');
    if(med)lock([side*w*.60,-.12,-.10],[side*(w+.22),-.04,-.52],.17,'enamel',.10);
   }else{
    band(-length*.22,-length*.44,w*1.18,w*1.24,0,'enamel');
    band(-length*.52,-length*.88,w*1.08,w*1.14,.01,'ruby');
    shield([0,-.58*length,w*1.06],w*1.72,length*.80,[0,.04,1],0,'enamel','pearl');
    if(med){
     lock([side*w*.84,-.28*length,-.08],[side*w*1.46,-length*.74,-.18],.10,'enamel',.06);
     lock([0,-.22*length,-w*.94],[0,-.58*length,-w*1.42],.09,'ruby',.055);
    }
   }
  }
  const g=surface.geometry();cache.set(key,g);return g;
 }
 function create(T,models,data,form,level=0){
  const body=wolf.create(T,models,data,form,level);
  body.species='besta';body.root.name=fileNames[form].split('.')[0];
  body.parts=body.parts.map(p=>({...p,pivot:[...p.pivot],rotation:[...p.rotation]}));
  if(form==='completa'){
   // Escala imponente estilo cavalo + tigre
   body.root.scale.setScalar(1.38);
   for(const p of body.parts){
    if(p.id==='garupa')p.pivot[2]-=.12;
    if(p.id==='peitoral')p.pivot[2]+=.10;
    if(p.id==='cabeca')p.pivot[1]+=.08;
    if(p.id.startsWith('escapula_')||p.id.startsWith('quadril_'))p.pivot[0]*=1.22;
    if(p.id==='cauda_meio')p.pivot=[0,.22,-.70];
    if(p.id==='cauda_ponta')p.pivot=[0,.80,-.44];
    body.joints[p.id].position.fromArray(p.pivot);
   }
  }else{
   // Híbrida: corpo humanoide forte e musculoso
   body.root.scale.setScalar(1.14);
   for(const p of body.parts){
    if(p.id.startsWith('ombro_'))p.pivot[0]*=1.14;
    body.joints[p.id].position.fromArray(p.pivot);
   }
  }
  if(!materialCache.has(T))materialCache.set(T,new T.MeshStandardMaterial({vertexColors:true,roughness:.50,metalness:.20}));
  for(const mesh of Object.values(body.meshes)){mesh.material=materialCache.get(T);mesh.name=mesh.parent.name+'_marfim_e_carmim';}
  body.setLOD=next=>{for(const p of body.parts)body.meshes[p.id].geometry=sculpt(T,models,p.id,form,next);};
  body.setLOD(level);return body;
 }
 function clips(form,motion){
  const names={lobo0:'Presa de Marfim',lobo3:'Rugido Carmesim',lobo4:'Pisão da Besta',despertar_lobo:'Despertar da Besta',lobo_j1:'Talho de marfim',lobo_j2:'Garra carmesim',lobo_j3:'Presa de marfim',lobo_dash:'Arrancada de Chifres'};
  return wolf.clips(form,motion).map(c=>({...c,label:names[c.id]||c.label}));
 }
 function animate(T,motion,data,body,state){
  const id=state.id,t=state.t||0,quad=body.form==='completa',j=body.joints;
  const envelope=(center,before,after)=>{
   const x=Math.max(0,Math.min(1,t<center?1-(center-t)/before:1-(t-center)/after));
   return x*x*(3-2*x);
  };
  if(id!=='lobo4'&&id!=='lobo0'){
   const res=wolf.animate(T,motion,data,body,state);
   if(quad&&id!=='death'){j.cauda_base.rotation.x+=.28;j.cauda_meio.rotation.x+=.16;}
   if(['idle','walk','run'].includes(id)){
    const clock=state.clock??t, pace=Math.max(0,Math.min(1,state.gait??(id==='idle'?0:1))), phase=state.phase??clock*(id==='run'?10:7);
    const breath=Math.sin(clock*2.7)*(1-pace), swing=Math.sin(phase-.6)*pace;
    j.cauda_base.rotation.y+=.12*swing+.045*breath;
    j.cauda_meio.rotation.y+=.15*Math.sin(phase-1.25)*pace+.055*breath;
    j.cauda_ponta.rotation.y+=.18*Math.sin(phase-1.9)*pace+.065*breath;
    if(quad){j.pescoco.rotation.x+=.035*breath-.025*swing;j.cabeca.rotation.x-=.025*breath;}
    else {j.tronco.rotation.x+=.025*breath+.035*pace;j.cabeca.rotation.x-=.025*breath;for(const side of ['E','D']){const sign=side==='E'?1:-1;j['ombro_'+side].rotation.x+=sign*.045*swing;j['mao_'+side].rotation.x+=sign*.055*Math.sin(phase-.95)*pace;}}
   }

   if(id==='lobo3'||id==='despertar_lobo'){
    const clip=motion.clips[id],rel=clip?.release??.34;
    const charge=envelope(rel*.5,rel*.5,rel*.45),roar=envelope(rel+.08,rel*.42,.38);
    j.mandibula.rotation.x+=.56*roar;
    if(quad){
     j.dorso.rotation.x+=.14*charge-.22*roar;
     j.peitoral.rotation.x+=.16*charge-.24*roar;
     j.pescoco.rotation.x+=.22*charge-.34*roar;
     j.cabeca.rotation.x-=.18*roar;
     j.cauda_base.rotation.x+=.34*roar;
     for(const side of ['E','D']){const s=side==='E'?1:-1;j['escapula_'+side].rotation.z+=s*.16*roar;}
    }else{
     j.tronco.rotation.x+=.22*charge-.28*roar;
     j.cabeca.rotation.x-=.24*roar;
     for(const side of ['E','D']){const s=side==='E'?1:-1;j['ombro_'+side].rotation.z+=s*.36*roar;}
    }
   }
   return res;
  }
  const release=motion.clips[id].release;
  const pose=id==='lobo4'?{...state,id:'idle',gait:0,drive:0}:state;
  wolf.animate(T,motion,data,body,pose);
  if(quad){j.cauda_base.rotation.x+=.28;j.cauda_meio.rotation.x+=.16;}
  const ready=envelope(release*.54,release*.54,release*.46),strike=envelope(release,release*.43,.25);
  if(id==='lobo0'){
   const neck=quad?j.pescoco:j.cabeca;
   neck.rotation.x+=.52*ready-.62*strike;
   j.mandibula.rotation.x+=.44*strike;
   if(quad){
    j.peitoral.rotation.x+=.24*ready-.22*strike;
    j.dorso.rotation.x+=.14*ready-.12*strike;
    j.cauda_base.rotation.x+=.26*strike;
   }
  }else{
   j.mandibula.rotation.x+=.48*ready+.28*strike;
   if(quad)j.cauda_base.rotation.x+=.35*strike;
   const trunk=quad?j.dorso:j.cintura,skull=quad?j.pescoco:j.cabeca;
   trunk.position.y+=.15*ready-.13*strike;
   trunk.rotation.x+=-.19*ready+.15*strike;
   skull.rotation.x+=-.15*ready+.15*strike;
   for(const side of ['E','D']){
    if(quad){
     j['escapula_'+side].rotation.x-=.49*ready;
     j['escapula_'+side].rotation.x+=.17*strike;
     j['perna_dianteira_'+side].rotation.x-=.34*ready+.29*strike;
     j['quadril_'+side].rotation.x-=.13*strike;
     j['perna_traseira_'+side].rotation.x+=.22*strike;
     j['pata_dianteira_'+side].rotation.x+=.45*ready;
     body.contacts['pata_dianteira_'+side]*=1-ready;
    }else{
     j['coxa_'+side].rotation.x-=.24*strike;j['canela_'+side].rotation.x+=.42*strike;
     j['ombro_'+side].rotation.x-=.27*ready;
     j['antebraco_'+side].rotation.x-=.51*ready;
     if(side==='D'){
      j.coxa_D.rotation.x-=.70*ready;j.canela_D.rotation.x+=.83*ready;
      body.contacts.pe_D*=1-ready;
     }
    }
   }
   const floor=body.stompFloor??={feet:quad?['pata_dianteira_E','pata_dianteira_D','pata_traseira_E','pata_traseira_D']:['pe_E','pe_D'],inverse:new T.Matrix4(),local:new T.Matrix4()};
   body.root.updateWorldMatrix(true,false);floor.inverse.copy(body.root.matrixWorld).invert();
   let min=Infinity;
   for(const name of floor.feet){
    const mesh=body.meshes[name],v=mesh.geometry.attributes.position;
    mesh.updateWorldMatrix(true,false);
    const e=floor.local.multiplyMatrices(floor.inverse,mesh.matrixWorld).elements;
    for(let i=0;i<v.count;i++)min=Math.min(min,e[1]*v.getX(i)+e[5]*v.getY(i)+e[9]*v.getZ(i)+e[13]);
   }
   trunk.position.y+=.016-min;
  }
 }
 return {create,animate,clips,strideRate:wolf.strideRate,fileNames};
})();

/* Phoenix of the aurora.
   - Forma Híbrida: modifica APENAS braços (que viram asas de fênix) e pernas (garras/talões azuis e dourados), mantendo cabeça e tronco humanos.
   - Forma Completa: maior e majestosa igual à prancha de referência, com cabeça esculpida, chifres flamejantes dourados, asas imensas em camadas e cauda em cascata. */
export const FRUTOMythPhoenix=(()=>{
 const flight=typeof FRUTOFalcon!=='undefined'?FRUTOFalcon:require('./falcon.js');
 const fileNames={hibrida:'Fenix_Hibrida.glb',completa:'Fenix_Completa.glb'};
 const tau=Math.PI*2;
 const featherInk={
  night:'#0e1040',ink:'#181466',cobalt:'#1b2ec9',sapphire:'#1058eb',blue:'#0a88ff',
  jade:'#00c8f5',glacier:'#5ef2ff',frost:'#d4fdff',purple:'#6c22d9',iris:'#b838ff',
  pink:'#ff2a9d',tangerine:'#ff6e12',gold:'#ffb81c',sun:'#ffea6b',cream:'#fff9c4',
  skin:'#c7cfca',skinDark:'#9ea7a3',skinLight:'#e2e8e4'
 };
 const baseInks=[
  ['27384a','1826a8'],['1c2938','0e1048'],['415774','1b3cd4'],['596e86','0a82f5'],
  ['778ba0','00c2f0'],['a0b1bc','5ef2ff'],['dbb88c','7828d8'],['efe5c9','22d4f5'],
  ['fff2d6','d4fdff'],['c08a38','d9620e'],['edb64d','ffb81c'],['ffcf69','ffea6b'],
  ['463221','ff7a14'],['171d21','2a1252'],['30313b','ffa818']
 ];
 const meshCaches=new WeakMap(),materialCache=new WeakMap();
 const normalize=v=>{const len=Math.hypot(...v)||1;return v.map(x=>x/len);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
 const plus=(p,n,f)=>p.map((v,i)=>v+n[i]*f);
 const gradients={
  azure:[['cobalt','sapphire','blue'],['blue','jade','glacier'],['jade','glacier','frost']],
  solar:[['pink','tangerine','gold'],['tangerine','gold','sun'],['gold','sun','cream']],
  aurora:[['cobalt','purple','iris'],['purple','pink','tangerine'],['tangerine','gold','sun']],
  prism:[['sapphire','purple','pink'],['pink','tangerine','gold'],['jade','glacier','frost']],
  violet:[['ink','purple','iris'],['purple','iris','pink'],['iris','jade','glacier']],
  ocean:[['night','cobalt','sapphire'],['cobalt','sapphire','blue'],['sapphire','blue','glacier']],
  gold:[['tangerine','gold','sun'],['gold','sun','cream'],['gold','sun','cream']]
 };
 function sculpt(T,models,rig,part,level,base){
  const id=part.id,bird=rig.form==='completa',cacheKey=rig.form+'/'+level+'/'+id;
  if(!meshCaches.has(T))meshCaches.set(T,new Map());const cache=meshCaches.get(T);
  if(cache.has(cacheKey))return cache.get(cacheKey);
  const surface=new models.Surface(T),colors={};
  for(const [key,hex] of Object.entries(featherInk))colors[key]=new T.Color(hex).toArray();
  const hi=level===0,med=level<2;
  const face=(points,normal,ink)=>surface.polygon(models.oriented(points,normal),colors[ink]);
  const box=(c,sz,ink='skin')=>models.bevel(surface,c,sz,hi?Math.min(...sz)*.08:0,colors[ink]);
  function loft(rows,c,topC=c,botC=c){
   const ring=[[-.65,-1],[.65,-1],[1,-.55],[1,.52],[.62,1],[-.62,1],[-1,.52],[-1,-.55]];
   const rings=rows.map(([x,y,z,w,h])=>ring.map(([u,v])=>[x+w*u,y+h*v,z]));
   face(rings[0].slice(),[0,0,-1],botC);
   for(let k=1;k<rings.length;k++)for(let i=0;i<8;i++){
    const a=rings[k-1],b=rings[k],j=(i+1)%8;
    const nx=(a[i][0]+a[j][0])/2-rows[k-1][0],ny=(a[i][1]+a[j][1])/2-rows[k-1][1];
    face([a[i],a[j],b[j],b[i]],[nx,ny,0],i>=3&&i<=5?topC:i<=1||i===7?botC:c);
   }
   face(rings.at(-1).slice(),[0,0,1],topC);
  }
  function plume(a,b,bow,width,normal,gradient,twist=0){
   const shades=gradients[gradient],axis=normalize(b.map((n,i)=>n-a[i]));
   let side=normalize(cross(normal,axis));
   if(Math.abs(dot(normalize(normal),axis))>.97)side=normalize(cross([1,0,0],axis));
   const top=normalize(cross(axis,side)),curvature=.32;
   const ts=level===2?[0,.36,.80,1]:[0,.20,.46,.76,1];
   let last=null;
   for(const t of ts){
    const arch=4*t*(1-t),p=a.map((n,i)=>n+(b[i]-n)*t+bow[i]*arch);
    const w=width*(t===1?.010:t===0?.07:Math.pow(Math.sin(t*Math.PI),.76)*(1.18-.44*t));
    const tangent=side.map((v,i)=>v*Math.cos(t*twist)+top[i]*Math.sin(t*twist));
    const up=normalize(cross(axis,tangent)),ridge=plus(p,up,w*curvature);
    const ring=[plus(p,tangent,w*.64),ridge,plus(p,tangent,-w*.46),plus(p,up,-w*.19)];
    if(last){
     const row=t<.38?0:t<.78?1:2;
     for(let k=0;k<4;k++){
      const j=(k+1)%4,quad=[last[k],last[j],ring[j],ring[k]];
      face(quad,plus(k<2?up:up.map(v=>-v),tangent,k===0||k===3?.44:-.44),shades[row][k===0?2:k===1?1:0]);
     }
    }else face(ring.slice(),axis.map(n=>-n),shades[0][0]);
    last=ring;
   }
   face(last.slice(),axis,shades[2][2]);
  }
  function foundation(){
   const attr=base.attributes,positions=attr.position.array,ink=attr.color.array;
   const lookup=baseInks.map(([a,b])=>[new T.Color('#'+a).toArray(),new T.Color('#'+b).toArray()]);
   const mapped=new Map();
   for(const poly of base.userData.polygons){
    const offset=3*poly[0],r=ink[offset],g=ink[offset+1],b=ink[offset+2],key=(r*65535|0)+','+(g*65535|0)+','+(b*65535|0);
    if(!mapped.has(key)){
     let best=Infinity,pigment;
     for(const [src,dst] of lookup){
      const d=(src[0]-r)**2+(src[1]-g)**2+(src[2]-b)**2;if(d<best){best=d;pigment=dst;}
     }
     mapped.set(key,pigment);
    }
    surface.polygon(poly.map(i=>[positions[3*i],positions[3*i+1],positions[3*i+2]]),mapped.get(key));
   }
  }
  const sign=id.endsWith('_D')?-1:1;

  // ===== FORMA HÍBRIDA: modifica APENAS braços (que viram asas) e pernas (talões da Fênix) =====
  if(!bird){
   if(id==='cabeca'){
    box([0,.48,0],[1.00,.96,.94],'skin');
    box([0,0,0],[.43,.20,.42],'skinDark');
   }else if(id==='tronco'){
    box([0,.515,0],[1.22,1.03,.67],'skin');
    box([0,0,0],[.80,.19,.48],'skinDark');
   }else if(id==='cintura'){
    box([0,.21,0],[1.01,.42,.59],'skin');
    box([0,.34,0],[1.018,.066,.602],'skinLight');
   }else if(id==='bico'||id==='cauda'||id.startsWith('leque_')||id.startsWith('fita_')||/^(braco|antebraco|mao)_/.test(id)){
    // Na híbrida da Fênix: sem bico, sem cauda, e os braços humanos são substituídos diretamente pelas asas!
   }else if(id.startsWith('ombro_')){
    // Ombro emplumado conectando o tronco humano diretamente às asas-braços
    plume([0,.06,.04],[sign*.36,.08,-.14],[0,.08,0],.26,[0,1,0],'azure');
    plume([0,.02,.06],[sign*.32,-.16,-.10],[0,.05,0],.22,[sign,.2,.3],'ocean');
   }else if(/^(asa|carpo|primarias)_/.test(id)){
    const section=id.startsWith('asa_')?0:id.startsWith('carpo_')?1:2;
    const point=(x,y,z)=>[sign*x,y,z],up=[0,1,0],span=[.92,.86,1.06][section];
    plume(point(-.10,.09,.04),point(span+.12,.12,.03),[0,.10,.13],section===2?.40:.58,up,'azure');
    const number=(hi?[7,7,9]:med?[5,5,7]:[3,3,4])[section];
    for(let i=0;i<number;i++){
     const u=i/(number-1),x=span*(.04+.82*u),y=.032*(1-u);
     const reach=section===2?.34+.56*u:section===1?.34+.26*u:.22+.18*u;
     const aft=section===2?1.42-.68*u:section===1?1.32+.16*u:1.08+.20*u;
     const key=section===2?(i%3===0?'azure':'ocean'):(u>.72?'azure':i%2===0?'ocean':'violet');
     plume(point(x,y,.06),point(x+reach,y-.14+.14*u,-aft),point(.09,.07,-.02),section===2?.37:.36,up,key,sign*(.18-.15*u));
     if(med&&u>.10&&u<.90)plume(point(x-.02,.08,.065),point(x+reach*.78,.02,-aft*.72),point(.05,.09,-.02),.24,up,i%2===0?'solar':'aurora',sign*.12);
    }
    const coverts=hi?5:med?3:2;
    for(let i=0;i<coverts;i++){
     const u=(i+.2)/coverts,x=span*u*.90;
     plume(point(x,.115,.12),point(x+.34,.04,-.50-.14*u),point(.02,.08,0),.31,up,i%2?'azure':'ocean');
    }
   }else{
    // Pernas e garras transformadas em pernas de fênix azuis com talões dourados
    foundation();
    if(id.startsWith('coxa_')){
     for(let i=0;i<(level===2?2:3);i++){
      const z=.18-i*.14;
      plume([sign*.12,.02,z],[sign*.28,-.64-(i%2)*.08,z-.10],[sign*.08,0,0],.21,[sign,.15,.25],i===1?'azure':'ocean');
     }
    }
   }
   const result=surface.geometry();cache.set(cacheKey,result);return result;
  }

  // ===== FORMA COMPLETA: Fênix majestosa e grande igual à referência =====
  if(/^(asa|carpo|primarias)_/.test(id)){
   const section=id.startsWith('asa_')?0:id.startsWith('carpo_')?1:2;
   const point=(x,y,z)=>[sign*x,y,z],up=[0,1,0],scale=1.34;
   const span=[.96,.90,1.22][section]*scale;
   plume(point(-.12,.11,.05),point(span+.16,.15,.04),[0,.12,.15],(section===2?.46:.66)*scale,up,'azure');
   if(med)plume(point(-.06,.14,.09),point(span*.90,.16,.08),[0,.10,.11],.36*scale,up,'ocean');
   const number=(hi?[9,9,11]:med?[7,7,8]:[4,4,5])[section];
   for(let i=0;i<number;i++){
    const u=i/(number-1),x=span*(.03+.85*u),y=.035*(1-u);
    const reach=(section===2?.42+.76*u:section===1?.38+.34*u:.26+.24*u)*scale;
    const aft=(section===2?1.82-.68*u:section===1?1.66+.20*u:1.34+.26*u)*scale;
    const dip=-.20+.18*u;
    const key=section===2?(i%3===0?'azure':i%3===1?'ocean':'prism'):(u>.74?'azure':i%2===0?'ocean':'violet');
    plume(point(x,y,.06),point(x+reach,y+dip,-aft),point(.12,.09,-.02),(section===2?.42:.41)*scale,up,key,sign*(.22-.18*u));
    if(med&&u>.06&&u<.94){
     const bandAft=aft*(section===2?.60:.78);
     const bandKey=section===2?(u<.46?'aurora':'solar'):(i%2===0?'solar':'aurora');
     plume(point(x-.02,.09,.07),point(x+reach*.80,.03,-bandAft),point(.07,.12,-.02),.30*scale,up,bandKey,sign*.15);
    }
   }
   const coverts=hi?7:med?5:2;
   for(let i=0;i<coverts;i++){
    const u=(i+.18)/coverts,x=span*u*.94;
    plume(point(x,.13,.13),point(x+.42*scale,.05,-.64*scale-.18*u*scale),point(.03,.10,0),.36*scale,up,i%2?'azure':'ocean');
    if(hi&&section<2&&i%2===1)plume(point(x+.04,.15,.11),point(x+.30*scale,.08,-.42*scale),point(.02,.08,0),.24*scale,up,'violet');
   }
   if(section===1)plume(point(.05,.13,.11),point(.68*scale,.22*scale,.36*scale),point(-.06,.06,.11),.20*scale,up,'azure');
  }else if(id.startsWith('fita_')){
   // Cascata majestosa de plumas da cauda fluindo para trás e para baixo
   const i=Number(id.slice(5)),s=i<3?-1:i>3?1:0,u=Math.abs(i-3)/3;
   const depth=3.85-.90*u,drop=-.72+.26*u,spread=s*(.26+1.16*u);
   const tip=[spread,drop,-depth],bend=[s*.22,-.14,-.06];
   const layer=i===3?'prism':i%3===1?'aurora':i%3===0?'azure':'violet';
   plume([0,0,0],tip,bend,.54-.07*u,[0,1,.14],layer,s*.36);
   const t=.50,mid=tip.map((v,k)=>v*t+bend[k]*4*t*(1-t));
   plume(plus(mid,[0,1,0],.05),[tip[0]+s*.20,tip[1]-.08,tip[2]+.16],[s*.09,.06,.02],.36,[0,1,.16],i%2===0?'solar':'aurora',s*.26);
   if(med){
    plume([0,.07,-.06],[mid[0]+s*.28,mid[1]+.06,mid[2]-.14],[s*.08,.07,0],.32,[0,1,.10],'azure',s*.20);
    if(hi)plume(plus(mid,[0,1,0],.04),[tip[0]+s*.48,tip[1]-.20,tip[2]+.48],[s*.14,-.05,.04],.25,[0,1,.08],i===3?'solar':'azure',s*.42);
   }
  }else if(id==='cauda'||id.startsWith('leque_')){
   const s=id==='cauda'?0:sign;
   plume([0,.06,.05],[s*.54,-.14,-1.20],[s*.10,.07,-.06],.54,[0,1,0],'ocean');
   if(med){
    plume([0,.11,.06],[s*.36,-.02,-.86],[s*.06,.08,0],.38,[0,1,0],'azure');
    plume([0,.14,.04],[s*.24,.03,-.60],[s*.04,.07,0],.28,[0,1,0],'solar');
   }
  }else if(id==='cabeca'){
   // Cabeça aviária esculpida majestosa com olhos flamejantes e chifres de fogo dourados
   loft([[0,.16,-.32,.20,.19],[0,.22,-.04,.29,.27],[0,.20,.24,.26,.22],[0,.14,.42,.17,.14]],'sapphire','blue','cobalt');
   for(const s of [-1,1]){
    // Olho flamejante dourado-laranja
    face([[s*.18,.20,.28],[s*.28,.22,.14],[s*.26,.29,.15],[s*.17,.27,.29]],[s,.1,.7],'sun');
    face([[s*.21,.22,.23],[s*.26,.23,.17],[s*.25,.27,.18],[s*.20,.26,.24]],[s,.1,.7],'tangerine');
    // Chifres flamejantes dourados curvos (assinatura da referência!)
    plume([s*.14,.36,.04],[s*.54,1.38,-.52],[s*.26,.18,.10],.26,[0,.32,1],'solar',s*.32);
    plume([s*.24,.34,-.06],[s*.76,1.08,-.68],[s*.20,.05,.05],.23,[0,.22,1],'gold',s*.34);
    if(med)plume([s*.16,.44,-.06],[s*.30,1.20,-.78],[-s*.10,.10,0],.16,[0,.52,1],'gold');
    // Penas faciais e crista ciano-safira
    plume([s*.26,.22,.02],[s*.48,.00,-.82],[s*.12,.02,0],.26,[s,.3,.18],'azure');
    plume([s*.27,.28,-.02],[s*.62,.40,-.74],[s*.12,.03,0],.22,[s,.4,.3],'ocean');
    plume([s*.20,.29,.36],[s*.42,.38,.02],[s*.02,.07,0],.10,[s,.22,1],'gold');
   }
   plume([0,.38,.26],[0,1.06,-.40],[0,.14,.09],.34,[0,.56,1],'azure');
   plume([0,.42,.16],[0,1.28,-.22],[0,.09,.05],.20,[0,.36,1],'gold');
  }else if(id==='pescoco'){
   loft([[0,-.06,-.06,.26,.24],[0,.14,.06,.24,.23],[0,.34,.18,.21,.20]],'sapphire','blue','cobalt');
   for(const s of [-1,1]){
    plume([s*.18,.34,.14],[s*.44,-.20,-.18],[s*.09,.01,.07],.26,[s,.15,.27],'azure');
    if(med)plume([s*.12,.24,.24],[s*.28,-.26,.20],[s*.05,0,.07],.20,[s*.3,.1,1],'ocean');
   }
  }else if(id==='dorso'){
   // Corpo nobre esculpido com escudo solar dourado no peito e manto de penas safira/ciano
   loft([[0,.06,-.62,.24,.22],[0,.08,-.20,.38,.36],[0,.06,.24,.42,.40],[0,.12,.64,.30,.30]],'sapphire','cobalt','blue');
   const y=.03,z=.68;
   for(const s of [-1,1]){
    for(let i=0;i<(level===2?3:5);i++){
     const u=i/(level===2?2:4),x=.06+.38*u,ey=y+.26-.12*u,ez=z-.24*u;
     plume([s*x,ey,ez],[s*(.20+.60*u),y-.42-.08*u,ez-.06],[s*.065,-.015,.085],.25,[s*.34,.10,1],u<.46?'gold':u<.76?'azure':'ocean');
    }
    if(med)plume([s*.32,y+.32,z-.06],[s*.58,y-.18,z-.05],[s*.11,-.03,.06],.20,[s*.25,.18,1],'azure');
    if(med)plume([s*.26,y+.40,-.12],[s*.52,y+.20,-.86],[s*.07,.09,0],.28,[s*.3,1,0],'azure');
   }
   plume([0,y+.32,z+.02],[0,y-.48,z-.04],[0,-.01,.12],.42,[0,.04,1],'solar');
   if(med)plume([0,y+.44,-.08],[0,y+.28,-.90],[0,.10,0],.34,[0,1,0],'ocean');
  }else{
   foundation();
   if(id.startsWith('coxa_')){
    for(let i=0;i<(level===2?2:3);i++){
     const z=.19-i*.14;
     plume([sign*.12,.01,z],[sign*.28,-.48-(i%2)*.09,z-.10],[sign*.08,0,0],.22,[sign,.15,.25],i===1?'azure':'ocean');
    }
   }
  }
  const result=surface.geometry();cache.set(cacheKey,result);return result;
 }
 function create(T,models,data,form,level=0){
  const rig=flight.create(T,models,data,form,level),bird=form==='completa';
  rig.root.name=bird?'Fenix_Completa':'Fenix_Hibrida';
  rig.species='fenix';
  if(!materialCache.has(T))materialCache.set(T,new T.MeshStandardMaterial({vertexColors:true,roughness:.46,metalness:.16}));
  const material=materialCache.get(T),originalParts=rig.parts.slice(),baseLOD=rig.setLOD;
  rig.parts=originalParts.map(p=>({...p,pivot:[...p.pivot],rotation:[...p.rotation]}));
  if(bird){
   // Fênix Completa bem maior e mais majestosa igual à referência!
   rig.root.scale.setScalar(1.52);
  }else{
   // Híbrida: conecta as asas diretamente nos ombros no lugar dos braços!
   for(const p of rig.parts){
    if(p.id.startsWith('asa_')){
     const s=p.id.endsWith('_E')?1:-1;
     p.pivot=[s*.76,.88,0];
     rig.joints[p.id].position.fromArray(p.pivot);
    }
   }
  }
  for(let i=0;i<7;i++){
   const u=(i-3)/3,p={id:'fita_'+i,parent:'cauda',pivot:[u*.26,.005-.045*Math.abs(u),-.28+.04*Math.abs(u)],rotation:[0,0,0]};
   const joint=new T.Group();joint.name=p.id;joint.position.fromArray(p.pivot);rig.joints.cauda.add(joint);
   const mesh=new T.Mesh(undefined,material);mesh.name=p.id+'_de_aurora';mesh.castShadow=mesh.receiveShadow=true;joint.add(mesh);
   rig.parts.push(p);rig.joints[p.id]=joint;rig.meshes[p.id]=mesh;
  }
  rig.setLOD=next=>{
   next=Math.max(0,Math.min(2,next));baseLOD(next);
   for(const p of rig.parts){const mesh=rig.meshes[p.id];mesh.geometry=sculpt(T,models,rig,p,next,mesh.geometry);mesh.material=material;}
   rig.profile=next;
  };
  rig.setLOD(level);return rig;
 }
 const names={idle:'Guarda da Fênix',flight:'Batida das asas solares',glide:'Planeio de aurora',falcao0:'Pluma de Aurora',falcao3:'Leque Solar',falcao4:'Pulso de Renascimento',despertar_falcao:'Canto do renascimento',falcao_j1:'Bicada de aurora',falcao_j2:'Talão solar',falcao_j3:'Leque de chamas',falcao_dash:'Rasante Solar',falcao1:'Ascensão híbrida',falcao2:'Ascensão da Fênix'};
 function clips(form,motion){return flight.clips(form,motion).map(c=>({...c,label:names[c.id]||c.label}));}
 const forwardPeriods=Object.fromEntries(['hibrida','completa'].map(form=>[form,flight.clips(form).find(clip=>clip.id==='forwardFlight').duration]));
 const periods={idle:2.8,walk:.84,run:.62,flight:.84,glide:2.4,swim:1.2,tread:2.4};
 function animate(T,motion,data,rig,state){
  const j=rig.joints,bird=rig.form==='completa',id=state.id||'idle',t=state.t||0,dead=id==='death';
  const phase=dead?0:state.clock===undefined?tau*t/(id==='forwardFlight'?forwardPeriods[rig.form]:periods[id]||2.8):state.clock*tau/2.8;
  const flying=state.flying||['flight','forwardFlight','glide','takeoff','turn'].includes(id),swimming=id==='swim'||id==='tread';
  const speed=Math.min(1,state.gait??(id==='run'?1:id==='walk'?.5:0));
  const cast=motion.clips[id],pulse=id==='falcao4'?Math.sin(Math.PI/2*Math.min(1,t/cast.release))**2*(1-Math.min(1,Math.max(0,t-cast.release)/(cast.duration-cast.release))**2):0;
  for(let i=0;i<7;i++){
   const u=(i-3)/3,lag=Math.abs(u)*1.14;
   const sway=dead?0:Math.sin(phase-lag),wave=dead?0:Math.cos(phase-lag);
   const basePitch=bird?(flying?-.08:-.18):(.46);
   j['fita_'+i].rotation.set(basePitch+(flying?.12:.05)*wave+.08*speed+(swimming?.18:0),
    -u*(.32+.04*sway+.52*pulse)+.035*sway+(state.turn||0)*.09,
    -.12*u+(dead?0:.048)*wave);
  }
  const height=flight.animate(T,motion,data,rig,state);
  if(!dead&&!swimming){
   const openness=flying?.22:.58;
   const env=(c,b,a)=>{const x=Math.max(0,Math.min(1,t<c?1-(c-t)/b:1-(t-c)/a));return x*x*(3-2*x);};
   const rel=cast?.release??.32;
   const fanCharge=id==='falcao3'?env(rel*.52,rel*.52,rel*.46):0;
   const fanSweep=id==='falcao3'?env(rel+.04,rel*.38,.28):0;
   const rebirthCharge=id==='falcao4'||id==='despertar_falcao'?env(rel*.54,rel*.54,rel*.44):0;
   const rebirthBloom=id==='falcao4'||id==='despertar_falcao'?env(rel+.06,rel*.36,.42):0;
   const shotSnap=id==='falcao0'?env(rel,rel*.40,.24):0;
   for(const [side,s] of [['E',1],['D',-1]]){
    j['asa_'+side].rotation.y-=s*(openness+.36*fanCharge-.58*fanSweep-.42*rebirthCharge+.62*rebirthBloom-.22*shotSnap);
    j['asa_'+side].rotation.z+=s*((flying?.10:.24)+.44*fanCharge-.38*fanSweep-.54*rebirthCharge+.68*rebirthBloom+.26*shotSnap);
    j['carpo_'+side].rotation.z+=s*((flying?.08:.12)+.28*fanCharge-.24*fanSweep-.38*rebirthCharge+.42*rebirthBloom);
    j['primarias_'+side].rotation.z-=s*((bird?.26:.15)-.22*fanSweep-.30*rebirthBloom);
   }
   if(rebirthBloom||fanSweep||shotSnap){
    const head=j.cabeca,neck=bird?j.pescoco:j.tronco;
    if(neck)neck.rotation.x+=-.24*rebirthBloom+.16*fanCharge-.14*shotSnap;
    if(head)head.rotation.x+=-.32*rebirthBloom-.18*shotSnap;
    for(let i=0;i<7;i++){
     const u=(i-3)/3;
     j['fita_'+i].rotation.y+=-u*(.42*rebirthBloom+.34*fanSweep+.18*shotSnap);
     j['fita_'+i].rotation.x+=.24*rebirthBloom-.14*rebirthCharge;
    }
   }
  }
  return height;
 }
 return {create,animate,clips,fileNames,strideRate:flight.strideRate,contactTimes:flight.contactTimes};
})();

/* Dragão Oriental.
   - Forma Híbrida: corpo maior e mais imponente mantendo rosto/tronco/pernas humanoides, modificando cauda, chifres (galhada dourada) e braços de dragão.
   - Forma Completa: corpo bem maior e mais articulado (pescoço em S em 2 vértebras + cauda longa de 6 segmentos), com ataques de disparos de fogo e invocação de nuvens de raios. */
export const FRUTOMythEast=(()=>{
 const wolf=typeof FRUTOWolf==='undefined'?require('./wolf.js'):FRUTOWolf;
 const tau=Math.PI*2,sides=[-1,1];
 const pigments={
  lacquer:'#a80f2c',ruby:'#d62038',ember:'#ff4d4d',wine:'#680b24',claret:'#3e0d24',
  mane:'#4c0c26',maneLight:'#96163c',maneDark:'#240818',ivory:'#ffe3b0',bone:'#fff2d1',
  belly:'#ebb178',shade:'#b86544',ochre:'#a8501c',gold:'#f5a824',light:'#ffde66',
  lemon:'#fff5ad',ink:'#201422',ebony:'#382334',tongue:'#cc455c',coral:'#ffab73',
  skin:'#c7cfca',skinDark:'#9da6a2',skinLight:'#e2e8e4'
 };
 const cache=new Map();
 const fileNames={hibrida:'Oriental_Hibrido.glb',completa:'Oriental_Completo.glb'};
 const extraTail=['cauda_onda','cauda_folha','cauda_lamina'];
 function sculpt(T,M,id,form,lod){
  const key=form+'/'+id+'/'+lod;if(cache.has(key))return cache.get(key);
  const mesh=new M.Surface(T),rgb=Object.fromEntries(Object.entries(pigments).map(([k,v])=>[k,new T.Color(v).toArray()]));
  const complete=form==='completa',sign=id.endsWith('_E')?1:-1,hi=lod===0,med=lod<2;
  const end=(id)=>id.split('_')[0],p=(x,y,z)=>new T.Vector3(x,y,z);
  function face(v,n,c){mesh.polygon(M.oriented(v,n),rgb[c]);}
  const box=(c,sz,tone='skin')=>M.bevel(mesh,c,sz,hi?Math.min(...sz)*.08:0,rgb[tone]);
  function sculptPath(rows,skin,underside=skin,dorsal=skin,slices=lod===2?6:8){
   const centers=rows.map(r=>p(...r.slice(0,3)));
   const rings=rows.map(([x,y,z,w,h],i)=>{
    const t=centers[Math.min(rows.length-1,i+1)].clone().sub(centers[Math.max(0,i-1)]).normalize();
    const projected=p(1,0,0).addScaledVector(t,-t.x);
    const u=projected.lengthSq()>.012?projected.normalize():p(0,1,0).addScaledVector(t,-t.y).normalize();
    const v=p(0,0,0).crossVectors(t,u).normalize();
    if(v.y<-.0001||(Math.abs(v.y)<.0001&&v.z>0))v.negate();
    return Array.from({length:slices},(_,k)=>{
     const a=(k+.5)*tau/slices;return p(x,y,z).addScaledVector(u,w*Math.cos(a)).addScaledVector(v,h*Math.sin(a)).toArray();
    });
   });
   face(rings[0].slice(),centers[0].clone().sub(centers[1]).toArray(),skin);
   for(let i=1;i<rows.length;i++)for(let k=0;k<slices;k++){
    const next=(k+1)%slices,a=rings[i-1],b=rings[i],n=p(...a[k]).add(p(...a[next])).multiplyScalar(.5).sub(centers[i-1]);
    const c=n.y>.55*rows[i-1][4]?dorsal:n.y<-.35*rows[i-1][4]?underside:skin;
    face([a[k],a[next],b[next],b[k]],n.toArray(),c);
   }
   face(rings.at(-1).slice(),centers.at(-1).clone().sub(centers.at(-2)).toArray(),dorsal);
  }
  function leaf(a,b,c,width,depth,palette){
   const start=p(...a),mid=p(...b),tip=p(...c);
   const axis=tip.clone().sub(start).normalize(),side=p(...width),normal=p(0,0,0).crossVectors(axis,side).normalize();
   const c0=start.toArray(),c1=mid.clone().add(side).toArray(),c2=tip.toArray(),c3=mid.clone().sub(side).toArray();
   const ridge=mid.clone().addScaledVector(normal,depth).toArray(),bottom=mid.clone().addScaledVector(normal,-depth*.58).toArray();
   for(const [v,k] of [[[c0,c1,ridge],0],[[c1,c2,ridge],1],[[c2,c3,ridge],1],[[c3,c0,ridge],0]])
    face(v,normal.toArray(),palette[k]);
   for(const [u0,u1] of [[c0,c1],[c1,c2],[c2,c3],[c3,c0]])face([u0,u1,bottom],normal.clone().negate().toArray(),palette[2]);
  }
  const armor=['gold','light','ochre'],scarlet=['ruby','lacquer','wine'],darkFur=['maneLight','mane','maneDark'],brightGold=['light','lemon','gold'];
  function vane(base,height,len,w,colors=darkFur,lean=0){
   const [x,y,z]=base;leaf(base,[x+lean*.46,y+height*.58,z-len*.39],[x+lean,y+height,z-len],[w,0,0],Math.min(w*.8,.11),colors);
  }
  function curlingHorn(s){
   const sc=complete?1.36:1.18;
   const bend=[
    [0,-.04,0,.12*sc,.14*sc],
    [s*.08*sc,.26*sc,-.11*sc,.105*sc,.112*sc],
    [s*.20*sc,.52*sc,-.22*sc,.085*sc,.090*sc],
    [s*.18*sc,.72*sc,-.38*sc,.062*sc,.066*sc],
    [s*.30*sc,.94*sc,-.52*sc,.042*sc,.044*sc],
    [s*.34*sc,1.14*sc,-.62*sc,.007,.009]
   ];
   sculptPath(bend,'gold','ochre','light',med?6:4);
   sculptPath([[s*.14*sc,.44*sc,-.17*sc,.070*sc,.072*sc],[s*.32*sc,.56*sc,-.08*sc,.050*sc,.052*sc],[s*.44*sc,.74*sc,-.02*sc,.009,.009]],'gold','ochre','light',5);
   if(med){
    sculptPath([[s*.19*sc,.68*sc,-.35*sc,.048*sc,.046*sc],[s*.11*sc,.88*sc,-.46*sc,.034*sc,.032*sc],[s*.09*sc,1.04*sc,-.54*sc,.006,.008]],'gold','ochre','lemon',5);
    sculptPath([[s*.25*sc,.82*sc,-.46*sc,.042*sc,.042*sc],[s*.42*sc,.92*sc,-.42*sc,.028*sc,.028*sc],[s*.54*sc,1.08*sc,-.36*sc,.006,.007]],'gold','ochre','lemon',5);
   }
   sculptPath([[0,-.02,.01,.14*sc,.135*sc],[s*.02,.09,-.025,.13*sc,.132*sc]],'ochre','ochre','light',6);
  }
  function plate(s,x,y,z,h,w,colors=scarlet){
   leaf([s*x,y+h*.47,z+w*.49],[s*(x+.040),y,z],[s*(x-.014),y-h*.65,z-w*.44],[0,h*.28,-w*.44],.040,colors);
  }
  function scaleCourse(w,h,z0,z1,kind){
   const rows=hi?5:med?3:2;
   for(const s of sides)for(let i=0;i<rows;i++){
    const z=z0+(z1-z0)*(i+.5)/rows;
    plate(s,w,.085,z,h*.74,(z1-z0)/rows*1.22,kind||scarlet);
    if(hi)plate(s,w*.82,.21,z+.054,h*.58,(z1-z0)/rows*.96,['lacquer','ruby','wine']);
   }
  }
  function paw(hand=false){
   const w=hand?.26:complete?.21:.23,len=hand?.30:complete?.41:.48;
   sculptPath([[0,-.09,-.17,w*.66,.115],[0,-.11,.02,w*1.04,.15],[0,-.13,len*.69,w*.82,.09]],'ebony','ink','claret');
   for(const k of [-1,0,1]){
    const x=k*w*.68,z=len-.055*Math.abs(k);
    sculptPath([[x*.75,-.12,.095,.078,.095],[x,-.125,z-.092,.082,.070],[x*1.18,-.15,z+.015,.052,.050]],'claret','ink','ebony',med?6:4);
    sculptPath([[x*1.16,-.128,z-.007,.050,.054],[x*1.25,-.132,z+.076,.034,.034],[x*1.34,-.18,z+.145,.004,.007]],'bone','ivory','lemon',5);
   }
   if(med)leaf([0,-.005,-.12],[0,.042,.045],[0,-.048,.23],[w*.62,0,0],.032,armor);
  }

  // ===== FORMA HÍBRIDA: corpo maior e imponente + apenas cauda, chifres e braços de dragão =====
  if(!complete){
   if(id==='cabeca'){
    box([0,.48,0],[1.02,.96,.94],'skin');
    box([0,0,0],[.44,.20,.42],'skinDark');
    for(const s of sides){
     const z=.476,ey=.52;
     face([[s*.12,ey-.05,z],[s*.38,ey-.03,z],[s*.36,ey+.07,z],[s*.14,ey+.05,z]],[0,0,1],'ink');
     face([[s*.15,ey-.03,z+.006],[s*.35,ey-.015,z+.006],[s*.33,ey+.05,z+.006],[s*.17,ey+.035,z+.006]],[0,0,1],'light');
    }
   }else if(id==='mandibula'){
    // Sem focinho na forma híbrida
   }else if(id.startsWith('orelha_'))curlingHorn(sign);
   else if(id.startsWith('bigode_')){
    sculptPath([[0,0,0,.028,.034],[sign*.22,.02,-.04,.025,.029],[sign*.44,-.04,-.22,.020,.023],[sign*.56,-.18,-.38,.014,.018],[sign*.72,-.14,-.58,.006,.008]],'gold','ochre','light',med?5:4);
   }else if(id==='tronco'||id==='cintura'){
    // Corpo humanoide maior e imponente (tronco largo, peitoral definido)
    if(id==='tronco'){
     box([0,.54,0],[1.48,1.10,.80],'skin');
     box([0,0,0],[.86,.20,.52],'skinDark');
     for(const s of sides)box([s*.34,.76,.39],[.56,.36,.16],'skinLight');
    }else{
     box([0,.22,0],[1.12,.44,.64],'skin');
     box([0,.37,0],[1.14,.08,.66],'gold');
    }
   }else if(id.startsWith('coxa_')||id.startsWith('canela_')||id.startsWith('pe_')){
    // Pernas humanas fortes (sem transformação em pata)
    if(id.startsWith('coxa_')){box([0,-.35,0],[.50,.70,.60],'skin');box([0,0,0],[.40,.18,.44],'skinDark');}
    else if(id.startsWith('canela_')){box([0,-.345,0],[.46,.70,.56],'skin');box([0,0,0],[.36,.17,.40],'skinDark');}
    else{box([0,-.125,.13],[.52,.26,.82],'skin');box([0,-.22,.14],[.53,.07,.82],'skinDark');}
   }else if(id.startsWith('cauda_')){
    const index=['cauda_base','cauda_meio','cauda_ponta',...extraTail].indexOf(id);
    const size=[.28,.245,.20,.15,.105,.058][index],delta=tailStep(index,false),wEnd=size*(index===5?.08:.82);
    sculptPath([[0,0,.05,size,size*.88],[delta[0]*.46,delta[1]*.44,delta[2]*.42,size*.95,size*.82],[...delta,wEnd,wEnd*.88]],'lacquer','ivory','wine');
    vane([delta[0]*.40,size*.70+delta[1]*.34,-.28],index===5?.34:size+.18,.28,.062,index>=2?brightGold:armor,delta[0]*.28);
    if(med&&index>=2)for(const s of sides)leaf([delta[0]*.5+s*(size+.05),delta[1]*.5+.04,delta[2]*.5],[delta[0]*.5+s*(size+.20),delta[1]*.5+.14,delta[2]*.5-.20],[delta[0]*.5+s*(size+.32),delta[1]*.5+.24,delta[2]*.5-.46],[0,.05,-.02],.024,brightGold);
   }else if(end(id)==='mao')paw(true);
   else{
    // Braços transformados em braços de dragão oriental (escamas carmesim + ombreiras douradas + braceletes)
    const kind=end(id),upper=kind==='ombro'||kind==='braco',fore=kind==='antebraco';
    const len=kind==='ombro'?.28:.62,w=kind==='ombro'?.38:upper?.27:.25;
    sculptPath([[0,.07,0,w*.84,w*.96],[0,-.12,-.025,w*1.10,w*1.20],[0,-len*.68,-.012,w*.82,w*.92],[0,-len+.01,.013,w*.66,w*.72]],upper?'lacquer':'ebony','ink',upper?'ruby':'claret');
    if(kind==='ombro'){
     leaf([sign*.12,.14,.06],[sign*.52,.38,-.02],[sign*.82,.64,-.22],[0,.14,-.08],.06,brightGold);
     leaf([sign*.16,.04,.12],[sign*.48,.16,.04],[sign*.72,.30,-.14],[0,.10,-.06],.05,armor);
    }else if(upper||fore){
     plate(sign,w*1.00,-.16,0,w*1.75,w*2.00,upper?scarlet:armor);
     vane([sign*w*.74,-.02,-.07],upper?.26:.13,upper?.38:.24,w*.54,armor,sign*.13);
    }
    if(hi||fore)for(let i=0;i<(hi?2:1);i++)
     leaf([0,-len*.32-i*.12,w*.90],[0,-len*.42-i*.12,w*1.12],[0,-len*.54-i*.12,w*.76],[w*.72,0,0],.036,i===0?armor:scarlet);
   }
   const result=mesh.geometry();cache.set(key,result);return result;
  }

  // ===== FORMA COMPLETA: Dragão Oriental bem maior, majestoso e ultra-articulado =====
  if(id==='cabeca'){
   const y=.03;
   sculptPath([[0,y+.24,-.36,.32,.29],[0,y+.26,-.12,.45,.365],[0,y+.24,.18,.42,.31],[0,y+.16,.40,.33,.21],[0,y+.10,.74,.23,.14],[0,y+.16,.89,.235,.115],[0,y+.12,.95,.185,.084]],'lacquer','ivory','wine');
   for(const s of sides){
    const eye=(u,v,off)=>[s*(.20+.178*u+off),y+.265+v+.038*u,.51-.23*u+off];
    for(const [l,r,b,t,c,o] of [[-.025,1.04,-.012,.145,'ink',.0],[.08,.94,.016,.112,'light',.005],[.39,.53,.012,.108,'wine',.008],[.53,.64,.074,.106,'lemon',.010]])
     face([eye(l,b,o),eye(r,b,o),eye(r,t,o),eye(l,t,o)],[s,0,.8],c);
    sculptPath([[s*.13,y+.39,.52,.028,.030],[s*.27,y+.42,.40,.092,.054],[s*.40,y+.45,.16,.085,.076],[s*.54,y+.62,-.16,.016,.024]],'gold','ochre','light',6);
    sculptPath([[s*.16,y+.21,.89,.054,.044],[s*.185,y+.21,.94,.038,.028]],'ink','ink','ochre',6);
    const maneCount=hi?7:med?5:3;
    for(let i=0;i<maneCount;i++){
     const q=i/(maneCount-1),spread=.48+.36*Math.sin(q*Math.PI),backLen=-.92+.34*q;
     leaf([s*(.35-.06*q),y+.38-.42*q,-.08+.20*q],[s*(.48+.12*Math.sin(i)),y+.36-.56*q,-.42+.18*q],[s*spread,y+.44-.86*q,backLen],[0,.115,-.055],.075,i%2?darkFur:['maneLight','lacquer','maneDark']);
    }
    leaf([s*.11,y+.30,.48],[s*.31,y+.23,.31],[s*.48,y+.18,.04],[0,.058,-.020],.048,armor);
    if(med)sculptPath([[s*.32,y+.08,.12,.042,.040],[s*.56,y+.04,-.12,.034,.032],[s*.76,y+.12,-.30,.022,.022],[s*.86,y+.26,-.38,.006,.006]],'gold','ochre','light',5);
    sculptPath([[s*.16,y+.045,.68,.044,.048],[s*.18,y-.105,.71,.007,.009]],'bone','ivory','lemon',5);
    if(med)sculptPath([[s*.195,y+.04,.54,.034,.038],[s*.20,y-.055,.56,.005,.006]],'bone','ivory','lemon',5);
   }
   vane([0,y+.50,.12],.38,.78,.19,['maneLight','ruby','maneDark']);
   vane([0,y+.52,-.10],.56,.88,.21,darkFur);
   if(med)for(const s of sides)vane([s*.18,y+.48,-.12],.52,.82,.16,darkFur,s*.24);
   leaf([0,y+.50,-.06],[0,y+.56,.18],[0,y+.38,.60],[.112,0,0],.052,armor);
   if(hi)leaf([0,y+.55,.08],[0,y+.59,.16],[0,y+.51,.28],[.052,0,0],.022,['coral','ruby','ochre']);
  }else if(id==='mandibula'){
   sculptPath([[0,-.04,.015,.29,.122],[0,-.05,.26,.25,.112],[0,-.05,.52,.192,.080],[0,-.042,.69,.165,.084]],'ivory','belly','tongue');
   const n=hi?3:2;for(const s of sides)for(let i=0;i<n;i++)sculptPath([[s*(.23-.024*i),.008,.22+i*.14,.031,.038],[s*(.225-.024*i),.096,.24+i*.14,.005,.007]],'ivory','belly','bone',4);
   for(const s of sides)vane([s*.17,-.09,.15],-.34,.22,.085,['bone','ivory','belly'],s*.04);
  }else if(id.startsWith('orelha_'))curlingHorn(sign);
  else if(id.startsWith('bigode_')){
   const sc=1.32;
   sculptPath([[0,0,0,.032,.038],[sign*.24*sc,.02,-.05,.029,.033],[sign*.48*sc,-.04,-.24*sc,.023,.026],[sign*.60*sc,-.20*sc,-.42*sc,.016,.021],[sign*.78*sc,-.18*sc,-.66*sc,.011,.014],[sign*.88*sc,-.03,-.82*sc,.004,.005]],'gold','ochre','light',med?5:4);
  }else if(id==='pescoco'||id==='colo_alto'){
   const upper=id==='colo_alto';
   const centers=upper?[[0,-.05,-.05,.29,.285],[0,.26,-.04,.295,.26],[0,.54,.06,.255,.235],[0,.72,.22,.245,.235]]:
    [[0,-.07,-.02,.38,.34],[0,.28,.04,.38,.33],[0,.64,-.02,.335,.29],[0,.96,-.10,.30,.27]];
   sculptPath(centers,'ruby','belly','wine');
   const count=upper?4:5;
   for(let i=0;i<count;i++){
    const t=i/(count-1),y=upper?.02+.18*i:.01+.20*i,z=upper?.21+.20*t:.27-.11*t,w=(upper?.255:.33)-.045*t;
    sculptPath([[0,y-.045,z-.025,w*.88,.092],[0,y+.052,z,w*1.04,.11],[0,y+.132,z-.017,w*.90,.088]],'ivory','belly','bone',med?8:6);
    if(i%2===0||hi)for(const s of sides)vane([s*(upper?.21:.25),y+.15,-.18],.22+.18*(1-t),.68+.24*t,.15,darkFur,s*.18);
    if(med&&i%2===1)vane([0,y+.14,-.24],.18,.30,.055,armor,0);
    if(hi)for(const s of sides)plate(s,w,.06+y,-.068,.24,.25,['lacquer','ruby','wine']);
   }
  }else if(id==='dorso'||id==='garupa'||id==='peitoral'){
   const core=id==='dorso',rear=id==='garupa',width=core?.41:rear?.36:.46,top=core?.36:rear?.33:.46;
   const a=core?-1.12:rear?-.54:-.28,b=core?.90:rear?.32:.48;
   sculptPath([[0,.085,a,width*.74,top*.74],[0,.10,a+(b-a)*.25,width*.98,top],[0,.085,a+(b-a)*.64,width*1.02,top*1.02],[0,.10,b,width*.78,top*.88]],'lacquer','ivory','wine');
   scaleCourse(width*.96,top,a+.07,b-.035);
   if(id==='peitoral'){
    leaf([0,.16,.52],[0,-.04,.60],[0,-.38,.46],[.34,0,0],.075,['claret','wine','ink']);
    leaf([0,.22,.54],[0,-.02,.62],[0,-.34,.49],[.22,0,0],.055,armor);
    for(const s of sides){
     leaf([s*.34,.36,.16],[s*.70,.58,.06],[s*1.00,.86,-.16],[0,.14,-.08],.065,brightGold);
     leaf([s*.38,.26,.24],[s*.68,.40,.12],[s*.94,.56,-.10],[0,.11,-.06],.055,armor);
     if(med)leaf([s*.34,.18,.30],[s*.60,.24,.16],[s*.80,.34,-.04],[0,.09,-.05],.045,armor);
    }
   }
   const num=core?(hi?7:5):3;
   for(let i=0;i<num;i++){
    const z=a+(b-a)*(i+.5)/num,k=Math.sin((i+.5)*Math.PI/num);
    vane([0,top+.04+.04*k,z],.26+.14*k,.26+.12*k,.082,armor);
    if(core||rear)for(const s of sides)vane([s*width*.46,top+.02,z],.34+.18*k,(rear?.96:.82)+.24*k,.14,darkFur,s*(.22+.12*k));
    if((core&&i%2===0)||!core)for(const s of sides)vane([s*width*.85,.24,z],.14,.32,.065,armor,s*.13);
   }
  }else if(id.startsWith('cauda_')){
   const index=['cauda_base','cauda_meio','cauda_ponta',...extraTail].indexOf(id);
   const size=[.32,.28,.235,.18,.125,.068][index],step=.82,delta=tailStep(index,true),wEnd=size*(index===5?.08:.82);
   sculptPath([[0,0,.06,size,size*.88],[delta[0]*.46,delta[1]*.44,delta[2]*.42,size*.95,size*.82],[...delta,wEnd,wEnd*.88]],'lacquer','ivory','wine');
   vane([delta[0]*.40,size*.72+delta[1]*.34,-step*.30],index===5?.38:size+.22,.32,.068,index>=2?brightGold:armor,delta[0]*.28);
   if(index<=1)for(const s of sides)vane([s*size*.55,size*.55+delta[1]*.2,-step*.25],.32,.76,.12,darkFur,s*.18);
   if(med)for(const s of sides)plate(s,size*.90,delta[1]*.3,-step*.28,size*.88,step*.54,scarlet);
   if(index>=2){
    const blades=hi?2:1;
    for(let b=0;b<blades;b++){
     const frac=.28+b*.44,bx=delta[0]*frac,by=delta[1]*frac,bz=delta[2]*frac;
     for(const s of sides)leaf([bx+s*(size+.06),by+.04,bz],[bx+s*(size+.24),by+.16,bz-.24],[bx+s*(size+.40),by+.28,bz-.56],[0,.058,-.02],.026,brightGold);
    }
   }
   if(index===5)for(const s of sides)leaf([0,0,.04],[s*.12,delta[1]*.45,-.28],[s*.40,delta[1]+.26,delta[2]-.10],[s*.075,.095,.04],.038,brightGold);
  }else if(id.startsWith('pata_'))paw(false);
  else{
   const kind=end(id),upper=['escapula','quadril'].includes(kind),hind=id.includes('traseira');
   const len=kind==='jarrete'?(hind?.42:.22):.62,w=upper?.21:.155;
   sculptPath([[0,.065,0,w*.80,w*.92],[0,-.11,-.025,w*1.06,w*1.16],[0,-len*.68,-.012,w*.78,w*.88],[0,-len+.01,.013,w*.62,w*.69]],upper?'lacquer':'ebony','ink',upper?'ruby':'claret');
   if(upper){
    plate(sign,w*.98,-.155,0,w*1.70,w*1.98,scarlet);
    vane([sign*w*.72,-.02,-.067],.24,.36,w*.52,armor,sign*.12);
   }
   if(hi)for(let i=0;i<2;i++)leaf([0,-len*.32-i*.12,w*.88],[0,-len*.42-i*.12,w*1.08],[0,-len*.54-i*.12,w*.74],[w*.70,0,0],.034,i===0?armor:scarlet);
  }
  const result=mesh.geometry();cache.set(key,result);return result;
 }
 function tailStep(index,complete){
  const w=complete?1.20:.82;
  return [[.06,.10,-.72],[.15,.02,-.72],[.24,-.04,-.68],[.30,-.06,-.60],[.28,.04,-.50],[.20,.18,-.42]][index].map(v=>v*w);
 }
 function create(T,models,data,form,lod=0){
  const rig=wolf.create(T,models,data,form,lod),complete=form==='completa',base=rig.parts.map(part=>({...part,pivot:part.pivot.slice()}));
  rig.root.name=complete?'Dragao_Oriental_Completo':'Dragao_Oriental_Hibrido';rig.species='oriental';
  if(complete){
   // Dragão Oriental Completo bem maior e mais articulado!
   rig.root.scale.setScalar(1.62);
   base.find(v=>v.id==='garupa').pivot[2]=-1.02;
   for(const p of base){if(p.id.startsWith('quadril_'))p.pivot[2]=-1.02;}
   const skull=base.findIndex(v=>v.id==='cabeca');base[skull].parent='colo_alto';base[skull].pivot=[0,.68,.21];
   base.splice(skull,0,{id:'colo_alto',parent:'pescoco',pivot:[0,.92,-.09]});
  }else{
   // Híbrida maior e mais imponente
   rig.root.scale.setScalar(1.24);
   for(const p of base){if(p.id.startsWith('ombro_'))p.pivot[0]*=1.16;}
  }
  const cauda=base.find(v=>v.id==='cauda_base');cauda.pivot=complete?[0,.13,-.45]:[0,.23,-.30];
  base.find(v=>v.id==='cauda_meio').pivot=tailStep(0,complete);base.find(v=>v.id==='cauda_ponta').pivot=tailStep(1,complete);
  for(const [i,id] of extraTail.entries())base.push({id,parent:i?extraTail[i-1]:'cauda_ponta',pivot:tailStep(i+2,complete)});
  for(const [suffix,s] of [['E',1],['D',-1]]){
   base.push({id:'bigode_'+suffix,parent:'cabeca',pivot:[s*.19,complete?.17:.42,complete?.86:.48]});
   base.find(v=>v.id==='orelha_'+suffix).pivot=[s*.28,complete?.52:.90,complete?-.09:-.05];
  }
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.50,metalness:.20});
  for(const part of base){
   let joint=rig.joints[part.id],mesh=rig.meshes[part.id];
   if(!joint){
    joint=new T.Group();joint.name=part.id;rig.joints[part.id]=joint;
    mesh=new T.Mesh();mesh.castShadow=mesh.receiveShadow=true;rig.meshes[part.id]=mesh;joint.add(mesh);
   }
   (part.parent?rig.joints[part.parent]:rig.root).add(joint);
   joint.position.fromArray(part.pivot);mesh.name=part.id+'_escamas';mesh.material=material;
  }
  rig.parts=base;rig.setLOD=next=>{for(const part of base)rig.meshes[part.id].geometry=sculpt(T,models,part.id,form,next);};rig.setLOD(lod);
  rig.points={...rig.points,boca:['cabeca',[0,complete?.12:.36,complete?.94:.52]]};
  rig.sockets.boca.position.fromArray(rig.points.boca[1]);return rig;
 }
 const soaring=[
  {id:'flight',label:'Ondulação celeste',duration:2.16,loop:true},
  {id:'forwardFlight',label:'Travessia do céu',duration:1.68,loop:true},
  {id:'glide',label:'Planeio imperial',duration:3.24,loop:true},
  {id:'takeoff',label:'Ascensão da serpente',duration:1.12}
 ];
 function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
 function animate(T,motion,data,rig,state){
  const id=state.id||'idle',complete=rig.form==='completa',j=rig.joints,t=state.t??0;
  const preview=state.clock===undefined,flight=soaring.find(c=>c.id===id);
  const launch=id==='takeoff',land=id==='land';
  const airborne=Boolean(flight||state.flying)&&id!=='death'&&id!=='swim'&&id!=='tread';
  const lift=launch?ease(t/.70):land?1-ease(t/.58):airborne?1:0;
  const duration=flight?.duration??(id==='tread'?2.40:id==='swim'?1.20:id==='run'?tau/10.2:id==='walk'?tau/7.7:tau/2.45);
  const phase=state.phase??t*tau/duration;
  const moving=airborne?0:state.gait??(id==='swim'||id==='run'?1:id==='walk'?.46:0);
  const w=wolf.animate(T,motion,data,rig,flight?{...state,id:'idle',gait:0,drive:0,air:lift,clock:preview?0:state.clock,phase:0}:state);
  const clock=id==='death'?0:preview?t*tau/duration:state.clock*2.45;
  const swing=id==='death'?0:airborne||state.phase===undefined?clock:phase;
  if(complete){
   const neck=j.colo_alto,swim=id==='swim'||id==='tread';
   neck.rotation.set((swim?.47:-.06)+.068*Math.sin(clock)-.14*moving+.20*j.pescoco.rotation.x,
    .095*Math.sin(clock-.43)+.52*j.pescoco.rotation.y,.038*Math.sin(clock+.58));
   j.peitoral.rotation.y+=.045*Math.sin(clock-.2);
   j.garupa.rotation.y+=.055*Math.sin(clock-1.1);
   if(swim)j.cabeca.rotation.x-=.29;
  }
  for(const [i,key] of extraTail.entries()){
   const k=i+1,q=swing-k*.71;
   j[key].rotation.set(.105-.043*k+.048*Math.cos(q),.15+.058*k+(.078+.14*moving)*Math.sin(q),.032*Math.sin(q+.73));
  }
  for(const [side,sign] of [['E',1],['D',-1]]){
   j['bigode_'+side].rotation.set(.026*Math.sin(clock+.6*sign),sign*.045*Math.sin(clock-.5*sign)-.032*j.cabeca.rotation.y,sign*.025*Math.cos(clock));
   const horn=j['orelha_'+side];horn.rotation.x*=.10;horn.rotation.y*=.13;horn.rotation.z*=.12;
  }
  if(['lobo0','lobo3','lobo4','despertar_lobo'].includes(id)){
   const rel=motion.clips[id]?.release??.34;
   const env=(c,b,a)=>{const x=Math.max(0,Math.min(1,t<c?1-(c-t)/b:1-(t-c)/a));return x*x*(3-2*x);};
   const coil=env(rel*.54,rel*.54,rel*.46),burst=env(rel+.04,rel*.38,.36);
   j.mandibula.rotation.x+=.52*burst;
   if(id==='lobo0'){
    if(complete){
     j.pescoco.rotation.x+=-.36*coil+.42*burst;
     j.colo_alto.rotation.x+=.44*coil-.38*burst;
     j.cabeca.rotation.x-=.24*burst;
     j.peitoral.rotation.x+=-.14*coil+.18*burst;
    }else{j.tronco.rotation.x+=-.20*coil+.26*burst;j.cabeca.rotation.x-=.18*burst;}
   }else if(id==='lobo3'){
    const spin=Math.sin(Math.min(1,t/(rel+.38))*Math.PI*2)*burst;
    if(complete){
     j.dorso.rotation.y+=.36*spin;j.peitoral.rotation.y+=.42*spin;
     j.pescoco.rotation.y+=.52*spin;j.colo_alto.rotation.y+=.44*spin;
    }else j.tronco.rotation.y+=.48*spin;
    for(const [i,key] of ['cauda_base','cauda_meio','cauda_ponta',...extraTail].entries())
     j[key].rotation.y+=(.26+.04*i)*Math.sin(t*11-i*.65)*burst;
   }else{
    if(complete){
     j.pescoco.rotation.x-=.42*coil-.28*burst;
     j.colo_alto.rotation.x-=.32*coil-.22*burst;
     j.cabeca.rotation.x-=.36*coil;
     j.peitoral.rotation.x-=.18*coil;
    }else{j.tronco.rotation.x-=.26*coil;j.cabeca.rotation.x-=.30*coil;}
    for(const [i,key] of ['cauda_base','cauda_meio','cauda_ponta',...extraTail].entries())
     j[key].rotation.x+=(.16+.03*i)*burst;
   }
  }
  if(lift>0){
   const wave=(preview?t:state.clock)*tau/(flight?.duration??2.16);
   const amp=lift*(id==='glide'?.52:1),bank=(state.turn||0)*.20;
   const torso=complete?j.dorso:j.cintura;
   torso.rotation.z+=(.079*Math.sin(wave+.12)+bank)*amp;
   torso.rotation.x+=(.085+.073*Math.cos(wave+.16))*lift;
   if(complete){
    j.peitoral.rotation.y+=.16*Math.sin(wave+.71)*amp;
    j.garupa.rotation.y+=.20*Math.sin(wave-.20)*amp;
    j.pescoco.rotation.x+=(.43+.11*Math.cos(wave+.84))*lift;
    j.colo_alto.rotation.x+=(.21+.11*Math.cos(wave+1.11))*lift;
    j.pescoco.rotation.y+=.18*Math.sin(wave+.92)*amp;
    j.colo_alto.rotation.y+=.13*Math.sin(wave+1.19)*amp;
    j.cabeca.rotation.x-=.48*lift;
    for(const side of ['E','D'])for(const front of [true,false]){
     const suffix=(front?'dianteira_':'traseira_')+side;
     j[(front?'escapula_':'quadril_')+side].rotation.x+=(front?.37:-.55)*lift;
     j['perna_'+suffix].rotation.x+=(front?-.68:.83)*lift;
     j['pata_'+suffix].rotation.x+=.29*lift;
     rig.contacts['pata_'+suffix]=0;
    }
   }else{
    j.tronco.rotation.x+=.21*lift;j.cabeca.rotation.x-=.22*lift;
    for(const [side,sign] of [['E',1],['D',-1]]){
     j['coxa_'+side].rotation.x+=(.28+.06*sign*Math.sin(wave))*lift;
     j['canela_'+side].rotation.x+=.51*lift;
     j['ombro_'+side].rotation.z+=sign*.21*lift;rig.contacts['pe_'+side]=0;
    }
   }
   for(const [i,key] of ['cauda_base','cauda_meio','cauda_ponta',...extraTail].entries()){
    const delayed=wave-.52*i-.70;
    j[key].rotation.y+=(.16+.024*i)*Math.sin(delayed)*amp;
    j[key].rotation.x+=(.095+.012*i)*Math.cos(delayed)*amp;
   }
  }
  if(preview&&flight)return launch?.96*ease((t-.14)/.91):.96+.073*Math.sin(t*tau/duration);
  return w;
 }
 function clips(form,motion){
  const names={lobo0:'Disparo de Fogo e Raio',lobo1:'Ascensão híbrida',lobo2:'Corpo imperial',lobo_j1:'Garra de jade',lobo_j2:'Talho do poente',lobo_j3:'Presa imperial',lobo3:'Espiral de Nuvens',lobo4:'Nuvem de Raios',lobo_dash:'Passo Serpentino',despertar_lobo:'Coroa do poente'};
  return [...wolf.clips(form,motion).map(c=>({...c,label:names[c.id]||c.label})),...soaring];
 }
 return {create,animate,clips,strideRate:wolf.strideRate,fileNames};
})();

/* Obsidian & Molten Gold Western Dragon.
   - Forma Híbrida: o corpo humanoide mais imponente de todos, com braços, pernas, cauda, asas e chifres de dragão.
   - Forma Completa: colossal, peitoral enorme com chevrons dourados, pernas imponentes, asas monumentais e ataques de meteoros, bolas de fogo, rajada de chamas e golpes de garras. */
export const FRUTOMythWest=(()=>{
 const wolf=typeof FRUTOWolf!=='undefined'?FRUTOWolf:require('./wolf.js');
 const fileNames={hibrida:'Ocidental_Hibrido.glb',completa:'Ocidental_Completo.glb'};
 const shades={
  void:'#0b0c14',black:'#181a26',graphite:'#2c3042',edge:'#484e66',glint:'#7a819c',
  rootGold:'#8a4714',bronze:'#c97114',gold:'#f7a81e',honey:'#ffd44d',ivory:'#fff4ad',eye:'#fff9a6',
  cavity:'#2b1420',tooth:'#ffe7b3',web:'#e68e17',webDark:'#8f3d10',webSun:'#ffca3a',webGlow:'#ffec85',
  skin:'#c7cfca',skinDark:'#9da6a2',skinLight:'#e2e8e4'
 };
 const ink=new WeakMap(),geometries=new WeakMap(),materials=new WeakMap();
 const sides=[['E',1],['D',-1]],tau=2*Math.PI,unit=x=>Math.min(1,Math.max(0,x));
 const smooth=x=>{x=unit(x);return x*x*(3-2*x);};
 function surface(T,models,id,form,level){
  if(!geometries.has(T))geometries.set(T,new Map());
  const cache=geometries.get(T),key=form+':'+id+':'+level;
  if(cache.has(key))return cache.get(key);
  if(!ink.has(T))ink.set(T,Object.fromEntries(Object.entries(shades).map(([k,c])=>[k,new T.Color(c).toArray()])));
  const colors=ink.get(T),s=new models.Surface(T),quad=form==='completa',sign=id.endsWith('_E')?1:-1;
  const hi=level===0,med=level<2;
  const face=(p,n,c)=>s.polygon(models.oriented(p,n),colors[c]);
  const box=(p,size,c)=>models.bevel(s,p,size,hi?Math.min(...size)*.10:0,colors[c]);
  const mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
  const vector=p=>new T.Vector3(...p);
  function sweep(nodes,palette,sideCount=hi?8:med?6:5){
   const rings=[],centers=nodes.map(n=>vector(n));
   const axis=centers.at(-1).clone().sub(centers[0]).normalize();
   const helper=Math.abs(axis.x)>.85?new T.Vector3(0,0,1):new T.Vector3(1,0,0);
   let previous=helper;
   nodes.forEach((node,i)=>{
    const tangent=centers[Math.min(nodes.length-1,i+1)].clone().sub(centers[Math.max(0,i-1)]).normalize();
    const u=previous.clone().addScaledVector(tangent,-previous.dot(tangent)).normalize();
    if(u.lengthSq()<.2)u.set(0,1,0).cross(tangent).normalize();
    const v=tangent.clone().cross(u).normalize();previous=u;
    const rx=node[3],ry=node[4]??rx;
    const ring=Array.from({length:sideCount},(_,j)=>{
     const a=(j+.5)*tau/sideCount;
     return centers[i].clone().addScaledVector(u,Math.cos(a)*rx).addScaledVector(v,Math.sin(a)*ry).toArray();
    });
    rings.push(ring);
    if(!i)return;
    for(let k=0;k<sideCount;k++){
     const h=(k+1)%sideCount,prev=rings[i-1],out=vector(prev[k]).sub(centers[i-1]).add(vector(ring[h]).sub(centers[i])).toArray();
     const c=typeof palette==='function'?palette(i-1,k,sideCount):palette;
     face([prev[k],prev[h],ring[h],ring[k]],out,c);
    }
   });
   const c=typeof palette==='function'?palette(0,0,sideCount):palette;
   face(rings[0],axis.clone().negate().toArray(),c);face(rings.at(-1),axis.toArray(),c);
  }
  const horn=nodes=>sweep(nodes,(i,k)=>i===nodes.length-2?(k%3===0?'gold':'ivory'):i===0?(k%3===0?'bronze':'rootGold'):k%3===0?'gold':'honey',hi?7:5);
  const scales=(i,k,n)=>k<n*.22?'edge':k<n*.5?'graphite':k>n*.87?'graphite':'black';
  function bodyLoft(rows){
   const ring=[[-.63,-1],[.63,-1],[1,-.55],[1,.38],[.58,1],[-.58,1],[-1,.38],[-1,-.55]];
   const rings=rows.map(([z,y,w,h])=>ring.map(([x,dy])=>[x*w,y+h*dy,z]));
   for(let i=1;i<rows.length;i++)for(let k=0;k<8;k++){const l=(k+1)%8;
    face([rings[i-1][k],rings[i-1][l],rings[i][l],rings[i][k]],
     [ring[k][0]+ring[l][0],ring[k][1]+ring[l][1],0],
     k===0?'gold':k===1||k===7?'black':k===3||k===5?'edge':k===4?'graphite':'black');
   }
   face(rings[0],[0,0,-1],'black');face(rings.at(-1),[0,0,1],'graphite');
  }
  function shield(o,u,v,n,w,h,gilt=true){
   const P=(x,y,d)=>o.map((k,i)=>k+u[i]*x+v[i]*y+n[i]*d);
   const outline=[P(-w*.44,h*.38,0),P(0,h*.56,.02),P(w*.44,h*.38,0),P(w*.54,h*.04,-.01),P(0,-h*.58,.02),P(-w*.54,h*.04,-.01)];
   const mid=P(0,h*.02,Math.min(w,h)*.24);
   for(let i=0;i<6;i++){const j=(i+1)%6;face([outline[i],outline[j],mid],n,['edge','graphite','black','void','black','graphite'][i]);}
   if(gilt){const end=outline[4];
    face([mix(outline[3],end,.24),end,mid],n,'gold');
    face([mid,end,mix(outline[5],end,.76)],n,'honey');
   }
  }
  function chevron(o,u,v,n,w,h){
   const P=(x,y,d)=>o.map((k,i)=>k+u[i]*x+v[i]*y+n[i]*d);
   const topL=P(-w*.52,h*.42,0),topC=P(0,h*.12,.05),topR=P(w*.52,h*.42,0);
   const botL=P(-w*.36,-h*.10,.02),botC=P(0,-h*.54,.08),botR=P(w*.36,-h*.10,.02);
   const peak=P(0,-.08,.12);
   face([topL,topC,peak,botL],n,'gold');
   face([topC,topR,botR,peak],n,'honey');
   face([botL,peak,botC],n,'bronze');
   face([peak,botR,botC],n,'ivory');
  }
  const up=[0,1,0],across=[1,0,0],ahead=[0,0,1];
  function crest(p,height,sweepBack,width=.13){
   horn([[...p,width,width*1.30],[p[0],p[1]+height*.54,p[2]-sweepBack*.30,width*.64,width],
    [p[0],p[1]+height,p[2]-sweepBack,.012,.014]]);
  }
  function ribcage(zList,width,y,plateHeight){
   for(const a of [-1,1])for(let i=0;i<zList.length;i++){
    const z=zList[i];shield([a*width,y,z],[0,0,-a],up,[a,.15,0],.54,plateHeight,true);
    if(hi)shield([a*width*.95,y-plateHeight*.34,z-.12],[0,0,-a],up,[a,0,0],.34,plateHeight*.54,i%2===0);
   }
  }
  function paw(w,length){
   bodyLoft([[-.18,-.065,w*.76,.135],[-.04,-.07,w*1.08,.19],[.16,-.08,w*1.08,.145],[length*.72,-.103,w*.86,.095]]);
   for(let i=-1;i<=1;i++){
    const x=i*w*.68,z=length-Math.abs(i)*.07,r=w*.27;
    sweep([[x*.8,-.092,.10,r,r*.85],[x,-.126,z-.07,r,r*.70],[x+i*.024,-.14,z+.018,r*.64,r*.58]],scales,5);
    horn([[x+i*.024,-.14,z,r*.82,r*.75],[x+i*.040,-.15,z+.11,r*.50,r*.44],[x+i*.058,-.20,z+.20,.009,.005]]);
   }
  }

  // ===== FORMA HÍBRIDA: o corpo mais imponente de todos + braços, pernas, cauda, asas e chifres =====
  if(!quad&&id==='cabeca'){
   box([0,.48,0],[1.04,.98,.96],'skin');
   box([0,0,0],[.46,.22,.44],'skinDark');
   for(const a of [-1,1]){
    const z=.486,ey=.52;
    face([[a*.12,ey-.05,z],[a*.38,ey-.03,z],[a*.36,ey+.07,z],[a*.14,ey+.05,z]],ahead,'rootGold');
    face([[a*.15,ey-.03,z+.006],[a*.35,ey-.015,z+.006],[a*.33,ey+.05,z+.006],[a*.17,ey+.035,z+.006]],ahead,'eye');
    // Chifres monumentais de dragão ocidental
    horn([[a*.36,.84,-.04,.18,.16],[a*.62,1.08,-.22,.145,.135],[a*.78,1.44,-.44,.105,.095],[a*.74,1.78,-.56,.056,.050],[a*.60,2.04,-.60,.012,.012]]);
    horn([[a*.26,.88,.18,.09,.08],[a*.40,1.14,.04,.068,.060],[a*.46,1.40,-.12,.012,.010]]);
   }
   const geometry=s.geometry();cache.set(key,geometry);return geometry;
  }
  if(!quad&&id==='mandibula'){const geometry=s.geometry();cache.set(key,geometry);return geometry;}
  if(!quad&&(id==='tronco'||id==='cintura')){
   // Corpo humanoide ultra-imponente (peitoral e ombros largos)
   if(id==='tronco'){
    box([0,.56,0],[1.62,1.16,.90],'skin');
    box([0,0,0],[.94,.22,.56],'skinDark');
    for(const a of [-1,1])box([a*.38,.80,.44],[.64,.40,.18],'skinLight');
    if(med)box([0,.32,.42],[.82,.38,.12],'skinDark');
   }else{
    box([0,.23,0],[1.18,.46,.68],'skin');
    box([0,.38,0],[1.20,.09,.70],'gold');
   }
   const geometry=s.geometry();cache.set(key,geometry);return geometry;
  }

  if(id==='cabeca'){
   const h=.16;
   bodyLoft([[-.44,h+.13,.26,.24],[-.22,h+.14,.48,.33],[.08,h+.12,.51,.31],[.36,h+.105,.39,.215],[.58,h+.045,.25,.138],[.79,h+.025,.23,.098],[.90,h+.005,.15,.072]]);
   for(const a of [-1,1]){
    const E=(q,y,o=0)=>[a*(.26+q*.18+o),h+y+.035*q,.49-q*.25+o];
    face([E(0,.076),E(.99,.125),E(.89,.248),E(.1,.190)],[a,.1,1],'rootGold');
    face([E(.07,.102,.008),E(.90,.150,.008),E(.79,.215,.008),E(.17,.170,.008)],[a,.1,1],'eye');
    face([E(.44,.124,.012),E(.55,.135,.012),E(.52,.185,.012)],[a,.1,1],'black');
    sweep([[a*.18,h+.21,.52,.068,.078],[a*.38,h+.26,.31,.112,.10],[a*.54,h+.31,.02,.060,.074],[a*.68,h+.40,-.26,.009,.012]],scales);
    horn([[a*.30,h+.28,-.14,.19,.17],[a*.52,h+.50,-.30,.155,.145],[a*.68,h+.86,-.52,.115,.100],[a*.66,h+1.22,-.66,.065,.055],[a*.54,h+1.52,-.70,.012,.012]]);
    horn([[a*.22,h+.28,.18,.098,.084],[a*.34,h+.54,.04,.078,.068],[a*.40,h+.82,-.14,.045,.040],[a*.42,h+1.04,-.28,.010,.008]]);
    horn([[a*.40,h+.04,.02,.115,.125],[a*.62,h+.09,-.24,.10,.082],[a*.78,h+.24,-.48,.058,.055],[a*.84,h+.38,-.66,.008,.010]]);
    shield([a*.43,h-.012,.02],[0,0,-a],up,[a,0,0],.42,.33,true);
    if(med){
     shield([a*.41,h+.02,-.24],[0,0,-a],up,[a,0,0],.34,.32,true);
     box([a*.115,h+.092,.77],[.095,.038,.095],'void');
     for(let k=0;k<(hi?3:1);k++){const z=.66-k*.12,x=a*(.21+k*.032);sweep([[x,h-.04,z,.028],[x,h-.15,z+.02,.004]],'tooth',4);}
    }
   }
   shield([0,h+.40,-.01],across,[0,-.35,1],[0,1,.35],.40,.62,true);
   crest([0,h+.36,-.25],.48,.28,.125);
  }else if(id.startsWith('orelha')){
   horn([[0,0,0,.095],[sign*.13,.16,-.10,.072],[sign*.24,.28,-.36,.009]]);
  }else if(id==='mandibula'){
   bodyLoft([[-.02,.004,.25,.118],[.20,-.013,.30,.122],[.44,-.035,.225,.082],[.70,-.023,.178,.074]]);
   box([0,.046,.42],[.32,.04,.38],'cavity');
   for(const a of [-1,1]){
    horn([[a*.21,.032,.40,.044],[a*.23,.21,.43,.009]]);
    if(med)horn([[a*.15,-.072,.52,.070],[a*.14,-.24,.40,.008]]);
   }
  }else if(id==='dorso'||id==='garupa'||id==='peitoral'||id==='pescoco'){
   if(id==='dorso'){
    bodyLoft([[-.94,.12,.44,.38],[-.60,.13,.56,.46],[-.24,.105,.55,.49],[.16,.12,.68,.58],[.56,.18,.74,.64],[.88,.17,.56,.56]]);
    ribcage(level===2?[-.5,.0,.45]:[-.66,-.34,-.02,.32,.60],.60,.19,.52);
    for(const z of [-.70,-.36,-.02,.32,.62])crest([0,.58,z],.30,.20,.105);
   }else if(id==='garupa'){
    bodyLoft([[-.66,.055,.36,.32],[-.38,.07,.54,.48],[-.06,.08,.60,.52],[.36,.085,.48,.38]]);
    ribcage([-.34,-.04],.50,.19,.45);crest([0,.50,-.34],.28,.17,.105);crest([0,.52,-.04],.26,.16,.095);
   }else if(id==='peitoral'){
    // PEITORAL GRANDE E IMPONENTE com grandes placas douradas em V
    bodyLoft([[-.44,.10,.56,.48],[-.14,.12,.82,.72],[.16,.24,.80,.74],[.50,.36,.52,.52]]);
    for(let k=0;k<4;k++)chevron([0,-.28+k*.21,.44+k*.06],across,up,[0,-.06,1],.88-k*.05,.40);
    for(const a of [-1,1]){
     shield([a*.66,.18,.24],[.75,0,-a*.66],up,[a*.66,.08,.75],.58,.72,true);
     crest([a*.44,.62,-.06],.30,.16,.105);
    }
   }else{
    bodyLoft([[-.22,.06,.44,.38],[-.04,.22,.46,.42],[.18,.48,.39,.36],[.42,.74,.33,.32],[.60,.94,.28,.28]]);
    for(let k=0;k<4;k++)chevron([0,.08+k*.20,.26+k*.13],across,[0,.60,.80],[0,-.55,.84],.58-k*.05,.30);
    for(const [y,z] of [[.44,-.02],[.68,.12],[.90,.28]])crest([0,y,z],.28,.21,.10);
   }
  }else if(id.startsWith('cauda_')){
   const stage=['cauda_base','cauda_meio','cauda_ponta','cauda_lamina'].indexOf(id);
   if(stage<3){
    const w=[.33,.25,.185][stage],dy=[-.12,-.18,-.06][stage],len=(quad?[.70,.74,.72]:[.58,.60,.58])[stage];
    bodyLoft([[-len,dy,w*.75,w*.64],[-len*.51,dy*.53,w*.98,w*.86],[0,0,w,w*.88],[.09,.01,w*.95,w*.82]]);
    for(const z of [-len*.76,-len*.40,-len*.10])crest([0,w*.74+dy*.30,z],.22-stage*.02,.15,.075);
    for(const a of [-1,1])shield([a*w*.90,dy*.42,-len*.36],[0,0,-a],up,[a,0,0],.42,w*1.32,true);
   }else{
    sweep([[0,0,.07,.14,.13],[0,.08,-.28,.12,.135],[0,.32,-.56,.075,.095],[0,.62,-.74,.008,.010]],scales);
    for(const a of [-1,1])horn([[a*.04,.01,-.10,.09],[a*.20,.08,-.32,.10],[a*.30,.28,-.54,.062],[a*.30,.50,-.66,.008]]);
    horn([[0,.22,-.42,.11],[0,.46,-.64,.062],[0,.74,-.76,.008]]);
   }
  }else if(id.startsWith('asa_')||id.startsWith('vela_')){
   const inner=id.startsWith('asa_'),a=sign,size=quad?1.52:1.02;
   const W=p=>[p[0]*a*size,p[1]*size,p[2]*size];
   const bone=(nodes,col)=>sweep(nodes.map(([x,y,z,r])=>[...W([x,y,z]),r*size]),col,hi?7:5);
   function membrane(rows){
    const spans=level===2?2:3;
    for(let i=0;i<rows.length-1;i++){
     const L=rows[i],R=rows[i+1];
     for(let j=0;j<spans;j++){
      const u=j/spans,v=(j+1)/spans;
      const rib=(row,t)=>t<.48?mix(row[0],row[1],t/.48):mix(row[1],row[2],(t-.48)/.52);
      const belly=t=>{const pt=mix(rib(L,t),rib(R,t),.5);pt[1]-=.08*Math.sin(t*Math.PI);pt[2]+=.38*t*t*t;return pt;};
      const surf=(poly,col)=>{const p=poly.map(W);face([...p],up,col);face(p.slice().map(([x,y,z])=>[x,y-.012*size,z]),[0,-1,0],col==='webGlow'?'ivory':col==='webSun'?'honey':col==='web'?'gold':'webDark');};
      surf([rib(L,u),belly(u),belly(v),rib(L,v)],j===0?'webDark':j===spans-1?'webGlow':'webSun');
      surf([belly(u),rib(R,u),rib(R,v),belly(v)],j===0?'bronze':j===spans-1?'webSun':'web');
     }
    }
   }
   if(inner){
    bone([[0,.02,0,.17],[.39,.24,-.04,.15],[.68,.36,.04,.135],[1.0,.46,.16,.12]],scales);
    bone([[.02,.15,.01,.082],[.43,.35,.01,.064],[.78,.48,.13,.048],[1.01,.53,.18,.024]],'gold');
    membrane([[[.035,.01,-.01],[.12,-.08,-.42],[.05,-.18,-1.02]],[[.53,.28,.00],[.62,.06,-.44],[.62,-.14,-1.38]],[[1,.45,.15],[1.1,.08,-.58],[1.20,-.28,-1.52]]]);
    bone([[.49,.27,-.02,.062],[.56,.07,-.44,.046],[.62,-.14,-1.38,.012]],'graphite');
   }else{
    const rows=[[[0,0,0],[.09,-.34,-.74],[.20,-.70,-1.68]],[[.028,.028,.00],[.54,.00,-.68],[.88,-.56,-1.92]],[[.056,.048,.02],[1.02,.04,-.46],[1.62,-.36,-1.48]],[[.095,.052,.055],[1.32,.15,-.16],[2.18,-.20,-.88]]];
    membrane(rows);
    for(const [i,row] of rows.entries()){
     bone(row.map((p,j)=>[...p,[i===3?.125:.088,i===3?.070:.046,.010][j]]),scales);
     if(med||i===3){const p=row[1],q=row[2];bone([[...mix(p,q,.48),.036],[...mix(p,q,.82),.022],[q[0]+.10,q[1]-.04,q[2]-.04,.005]],'gold');}
    }
    bone([[0,0,0,.115],[.11,.28,.05,.095],[.09,.52,.04,.055],[.01,.72,-.04,.008]],(i,k)=>i===0?'bronze':k%3?'honey':'gold');
   }
  }else if(id.startsWith('pata_')||id.startsWith('mao_')||id.startsWith('pe_')){
   paw(quad?.285:id.startsWith('mao_')?.25:.29,quad?.47:id.startsWith('mao_')?.35:.54);
  }else{
   // PERNAS E BRAÇOS IMPONENTES blindados em obsidiana e ouro
   const kind=id.split('_')[0],front=id.includes('dianteira'),hind=kind==='quadril'||kind==='coxa',shoulder=kind==='escapula'||kind==='ombro';
   const upper=hind||shoulder||kind==='braco',short=kind==='ombro';
   const length=short?.32:kind==='jarrete'?(front?.24:.42):['coxa','canela'].includes(kind)?.74:.66;
   const w=short?.36:hind?(quad?.39:.35):shoulder?(quad?.36:.31):kind==='braco'?.27:kind==='antebraco'?.28:kind==='canela'?.26:kind==='perna'?(quad?.24:.20):.185;
   sweep([[0,short?.14:.07,0,w*.92,w*1.04],[0,-length*.27,-.025,w*1.08,w*1.26],[0,-length*.68,.014,w*.86,w*.94],[0,-length,.005,w*.72,w*.82]],scales);
   if(kind!=='jarrete'){
    const p=[sign*w*.86,-length*.23,-.025];
    shield(p,[0,0,-sign],up,[sign,.15,0],w*2.25,length*.90,true);
    if(upper&&kind!=='braco')horn([[sign*w*.78,.02,-.055,.092],[sign*(w+.048),.14,-.15,.070],[sign*(w+.16),.28,-.28,.010]]);
    if(med)shield([0,-length*.50,w*.80],across,up,ahead,w*1.38,length*.56,true);
   }
  }
  const geometry=s.geometry();cache.set(key,geometry);return geometry;
 }
 function addPart(T,b,id,parent,pivot){
  const p={id,parent,pivot,rotation:[0,0,0]},j=new T.Group();j.name=id;j.position.fromArray(pivot);
  const m=new T.Mesh();m.name=id+'_escamas';m.castShadow=m.receiveShadow=true;j.add(m);b.joints[parent].add(j);
  b.parts.push(p);b.joints[id]=j;b.meshes[id]=m;
 }
 function create(T,models,data,form,level=0){
  const b=wolf.create(T,models,data,form,level),quad=form==='completa';
  b.parts=b.parts.map(p=>({...p,pivot:[...p.pivot],rotation:[...p.rotation]}));
  b.points=Object.fromEntries(Object.entries(b.points).map(([k,[p,v]])=>[k,[p,[...v]]]));
  b.species='ocidental';b.root.name=quad?'Dragao_Ocidental_Completo':'Dragao_Ocidental_Hibrido';
  if(quad){
   // Dragão Ocidental Completo COLOSSAL — o mais imponente de todos!
   b.root.scale.setScalar(1.72);
   for(const p of b.parts){
    if(p.id==='pescoco')p.pivot=[0,.38,.42];
    if(p.id==='cabeca')p.pivot=[0,.90,.56];
    if(p.id==='cauda_meio')p.pivot=[0,-.12,-.66];
    if(p.id==='cauda_ponta')p.pivot=[0,-.18,-.70];
    if(p.id.startsWith('escapula_')||p.id.startsWith('quadril_'))p.pivot[0]*=1.38;
    b.joints[p.id].position.fromArray(p.pivot);
   }
  }else{
   // Híbrida: o corpo humanoide mais imponente de todos!
   b.root.scale.setScalar(1.34);
   for(const p of b.parts){
    if(p.id.startsWith('ombro_'))p.pivot[0]*=1.24;
    if(p.id.startsWith('coxa_'))p.pivot[0]*=1.14;
    b.joints[p.id].position.fromArray(p.pivot);
   }
  }
  const base=quad?'peitoral':'tronco';
  for(const [side,a] of sides){
   const rel=quad?[a*.48,.52,-.26]:[a*.58,.92,-.34];
   addPart(T,b,'asa_'+side,base,rel);
   const scale=quad?1.52:1.02;
   addPart(T,b,'vela_'+side,'asa_'+side,[a*1.00*scale,.46*scale,.16*scale]);
   for(const [name,point] of [['ponta_asa_'+side,[a*2.18*scale,-.20*scale,-.88*scale]],['talao_'+side,[0,-.16,.40]]]){
    const parent=name.startsWith('talao')?(quad?'pata_dianteira_'+side:'mao_'+side):'vela_'+side;
    const sock=new T.Object3D();sock.name=name;sock.position.fromArray(point);b.joints[parent].add(sock);b.points[name]=[parent,point];b.sockets[name]=sock;
   }
  }
  addPart(T,b,'cauda_lamina','cauda_ponta',[0,-.06,quad?-.68:-.54]);
  b.points.boca=['cabeca',[0,quad?.16:.38,quad?.90:.54]];b.sockets.boca.position.fromArray(b.points.boca[1]);
  if(!materials.has(T))materials.set(T,new T.MeshStandardMaterial({vertexColors:true,roughness:.44,metalness:.28}));
  b.setLOD=lod=>{for(const {id} of b.parts){const m=b.meshes[id];m.material=materials.get(T);m.geometry=surface(T,models,id,form,lod);}};
  b.setLOD(level);return b;
 }
 const flightClips=[{id:'flight',label:'Batida das asas',duration:1.18,loop:true},{id:'glide',label:'Planeio de obsidiana',duration:2.36,loop:true},
  {id:'takeoff',label:'Salto e abertura das asas',duration:1.06},{id:'forwardFlight',label:'Voo em avanço',duration:1.18,loop:true}];
 function clips(form,motion){
  const names={lobo0:'Rajada de Chamas e Bolas de Fogo',lobo3:'Golpes de Garras e Asas',lobo4:'Chuva de Meteoros',despertar_lobo:'Despertar de obsidiana',lobo_j1:'Garra da coroa',lobo_j2:'Rasgo de obsidiana',lobo_j3:'Presa imperial',lobo_dash:'Arranque alado',lobo1:'Forma híbrida',lobo2:'Forma completa'};
  return [...wolf.clips(form,motion).map(c=>({...c,label:names[c.id]||c.label})),...flightClips];
 }
 function animate(T,motion,data,b,state){
  const id=state.id||'idle',t=state.t||0,quad=b.form==='completa',j=b.joints,dead=id==='death',wet=id==='swim'||id==='tread';
  const preview=state.clock===undefined,flightId=flightClips.some(c=>c.id===id);
  const airborne=state.flying||flightId,landing=id==='land',glide=id==='glide'?1:unit(state.glideMix||0);
  const launch=id==='takeoff'?smooth(t/.58):1,land=landing?1-smooth(t/.60):1;
  const lift=(airborne||landing?1:0)*launch*land,fall=dead?smooth(t/1.05):0;
  const cycle=preview?(id==='idle'?2.45:id==='walk'?7.7:id==='run'?10.2:wet?tau/(id==='swim'?1.2:2.4):tau/1.18)*t:(state.clock||0)*tau/1.18;
  const flap=Math.sin(cycle),following=Math.sin(cycle-.36),quiet=dead?0:Math.sin(cycle)*.036;
  const swim=wet?1:0;
  for(const [side,a] of sides){
   const arm=j['asa_'+side],sail=j['vela_'+side];
   const unfold=lift*(1-.78*glide);
   arm.rotation.set(.08+swim*.15, a*((quad?.32:.40)+swim*.33-.28*lift+(quad?.52:1.40)*fall),
      a*((quad?.62:.74)+quiet+.15*swim-.44*lift+.08*glide+.54*flap*unfold+(quad?-.73:.27)*fall),'YXZ');
   sail.rotation.set(-.05-.10*lift, a*((quad?.36:.46)+.31*swim-.36*lift+(quad?.39:.93)*fall),
      a*((quad?-.48:-.56)+.12*swim+.26*lift+.38*following*unfold+(quad?.29:.27)*fall),'YXZ');
  }
  if(id==='lobo3'){
   const at=motion.clips[id].release;
   const open=smooth(t/(at*.76))*(1-smooth((t-at*.76)/(at*.52)));
   const drive=smooth((t-at*.78)/.12)*(1-smooth((t-at-.14)/.38));
   for(const [side,sign] of sides){
    j['asa_'+side].rotation.y-=sign*(.40*open+.36*drive);
    j['asa_'+side].rotation.z+=sign*(.64*open-.89*drive);
    j['vela_'+side].rotation.y-=sign*(.43*open+.42*drive);
    j['vela_'+side].rotation.z+=sign*(.69*open+.49*drive);
   }
  }
  j.cauda_lamina.rotation.set(-.18-.075*Math.cos(dead?2.4:cycle-.6),.24*Math.sin(dead?1.9:cycle-1.05),0);
  const pose=flightId?{...state,id:'idle',gait:0,drive:0,air:lift,clock:preview?0:state.clock,phase:state.phase??0}:state;
  wolf.animate(T,motion,data,b,pose);
  if(id==='lobo0'){
   const at=motion.clips[id].release,inhale=smooth(t/(at*.62))*(1-smooth((t-at*.62)/(at*.42)));
   const breath=smooth((t-at*.52)/(at*.48))*(1-smooth((t-at-.14)/.36));
   j.mandibula.rotation.x+=.58*breath;
   for(const [side,sign] of sides){
    j['asa_'+side].rotation.z+=sign*(.32*inhale+.18*breath);
    j['vela_'+side].rotation.z+=sign*(.24*inhale);
   }
   if(quad){
    j.peitoral.rotation.x+=-.18*inhale+.14*breath;
    j.pescoco.rotation.x+=-.26*inhale+.24*breath;
    j.pescoco.rotation.y+=.26*Math.sin((t-at)*10)*breath;
    j.cabeca.rotation.y+=.18*Math.sin((t-at)*10)*breath;
   }else{j.tronco.rotation.x+=-.18*inhale+.16*breath;j.cabeca.rotation.y+=.22*Math.sin((t-at)*10)*breath;}
  }else if(id==='lobo3'){
   const at=motion.clips[id].release,open=smooth(t/(at*.76))*(1-smooth((t-at*.76)/(at*.52)));
   const drive=smooth((t-at*.78)/.12)*(1-smooth((t-at-.14)/.38));
   j.mandibula.rotation.x+=.36*drive;
   if(quad){
    j.dorso.rotation.x+=-.16*open+.18*drive;j.peitoral.rotation.x+=-.14*open+.16*drive;
    for(const [side,sign] of sides){j['escapula_'+side].rotation.x-=.55*open-.62*drive;j['perna_dianteira_'+side].rotation.x-=.32*drive;}
   }else{
    for(const [side,sign] of sides){j['ombro_'+side].rotation.x-=.75*open-.85*drive;j['antebraco_'+side].rotation.x-=.40*drive;}
   }
  }else if(id==='lobo4'||id==='despertar_lobo'){
   const at=motion.clips[id]?.release??.38;
   const rise=smooth(t/(at*.68))*(1-smooth((t-at*.68)/(at*.46)));
   const slam=smooth((t-at*.72)/.14)*(1-smooth((t-at-.18)/.40));
   j.mandibula.rotation.x+=.52*rise+.24*slam;
   for(const [side,sign] of sides){
    j['asa_'+side].rotation.y-=sign*(.48*rise);
    j['asa_'+side].rotation.z+=sign*(.74*rise-.66*slam);
    j['vela_'+side].rotation.y-=sign*(.42*rise);
    j['vela_'+side].rotation.z+=sign*(.62*rise-.44*slam);
   }
   if(quad){
    j.dorso.rotation.x+=-.22*rise+.18*slam;
    j.pescoco.rotation.x+=-.30*rise+.22*slam;
    j.cabeca.rotation.x-=.24*rise;
   }else{j.tronco.rotation.x+=-.22*rise+.16*slam;j.cabeca.rotation.x-=.20*rise;}
  }
  if(lift&&!dead){
   if(quad){
    j.dorso.rotation.x+=.095*lift;j.pescoco.rotation.x-=.11*lift;
    for(const [side] of sides)for(const front of [true,false]){
     const limb=(front?'dianteira_':'traseira_')+side;
     j[(front?'escapula_':'quadril_')+side].rotation.x+=(front?.51:-.59)*lift;
     j['perna_'+limb].rotation.x+=(front?-.85:.93)*lift;
     j['pata_'+limb].rotation.x+=.29*lift;b.contacts['pata_'+limb]=0;
    }
   }else{j.tronco.rotation.x+=.22*lift;j.cabeca.rotation.x-=.18*lift;}
  }
  return preview&&flightId?(id==='takeoff'?.8*smooth((t-.22)/.81):.82+.042*Math.sin(cycle)*(!glide)):undefined;
 }
 return {fileNames,create,clips,animate,strideRate:wolf.strideRate};
})();

/* Continuous signals for an animal pose. Advance once per physics step; sampling
   the same attack several times for a swept hit must not advance its balance. */
export const FRUTOAnimalDynamics=(()=>{
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const smooth=(a,b,x)=>{const n=clamp((x-a)/(b-a));return n*n*(3-2*n);};
 const follow=(x,target,rate,dt)=>target+(x-target)*Math.exp(-rate*dt);
 const toeOff=.25, falconTouch=.42, wolfTouch=.15;
 function create(){
  const signals={drive:0,turn:0,brake:0,rise:0,compression:0,takeoff:0,flare:0,flightMix:0,glideMix:0,flapPhase:0,forwardAir:0,wingPower:0,liftDemand:0,collection:0,stepLead:0,touchdownMix:0};
  let springSpeed=0,takeoffAge=Infinity,landingAge=Infinity,lastYaw=null,lastSpeed=0,flightCycles=0,lead=1;
  function reset(){for(const key of Object.keys(signals))signals[key]=0;springSpeed=0;takeoffAge=landingAge=Infinity;lastYaw=null;lastSpeed=0;flightCycles=0;lead=1;}
  function chooseLead(phase=0){
   const step=((phase/(2*Math.PI))%1+1)%1;
   lead=step<.50?-1:1;
  }
  function launch(phase){takeoffAge=0;landingAge=Infinity;chooseLead(phase);flightCycles=-.22/.70;signals.flapPhase=2*Math.PI*flightCycles;}
  function approach(phase){chooseLead(phase);takeoffAge=Infinity;}
  function contactPhase(phase){
   const cycle=2*Math.PI,target=(lead===1?.20:.70)*cycle;
   return phase+Math.atan2(Math.sin(target-phase),Math.cos(target-phase));
  }
  function cancelLift(){takeoffAge=Infinity;}
  function touch(speed,mass){landingAge=0;takeoffAge=Infinity;springSpeed+=Math.min(34,Math.abs(speed)*Math.sqrt(mass/72)*3.55);}
  function advance(dt,c){
   const s=signals,animalBird=c.species==='falcao',quad=!animalBird&&c.form==='completa';
   const yawRate=lastYaw===null?0:Math.atan2(Math.sin(c.yaw-lastYaw),Math.cos(c.yaw-lastYaw))/dt;
   s.turn=follow(s.turn,clamp(yawRate/4.8,-1,1)*Math.min(1,c.speed/1.2),8.5,dt);
   const decel=Math.max(0,(lastSpeed-c.speed)/dt),breaking=clamp((decel-.8)/(quad?13:15));
   s.brake=follow(s.brake,breaking,breaking>s.brake?18:5.7,dt);
   s.drive=follow(s.drive,clamp(c.speed/c.maxSpeed),14,dt);
   s.rise=follow(s.rise,clamp(c.vy/6,-1,1),17,dt);
   takeoffAge+=dt;landingAge+=dt;
   const release=animalBird?toeOff:.09,recover=animalBird?.61:.26;
   s.takeoff=smooth(.005,release,takeoffAge)*(1-smooth(release,recover,takeoffAge));
   const inFlight=animalBird&&(c.flight==='flying'||c.flight==='landing'||c.diving);
   const airWeight=inFlight?Math.max(.28,smooth(.025,.48,c.height)):0;
   s.flightMix=follow(s.flightMix,airWeight,airWeight>s.flightMix?8.5:13,dt);
   const brakingAir=c.flight==='landing'?1-smooth(.05,1.9,c.height):0;
   s.flare=follow(s.flare,Math.max(brakingAir,c.diving&&c.vy<0?.65*(1-smooth(.10,1.35,c.height)):0),10,dt);
   if(animalBird){
    const large=c.form==='completa',forwardSpeed=Math.max(0,c.forwardSpeed??c.speed),maxAir=c.maxAirSpeed||c.maxSpeed;
    const airflow=inFlight?smooth(.025,.90,forwardSpeed/maxAir):0;
    s.forwardAir=follow(s.forwardAir,airflow,airflow>s.forwardAir?6.8:5.4,dt);
    const climb=smooth(.16,3.4,c.vy),thrust=clamp((c.speed-lastSpeed)/dt/17);
    s.liftDemand=follow(s.liftDemand,inFlight?Math.max(climb,.85*thrust,.63*Math.abs(s.turn)):0,8,dt);
    const glide=inFlight&&!c.diving&&c.flight!=='landing'?smooth(.22,.80,s.drive)*(1-climb):0;
    s.glideMix=follow(s.glideMix,glide,glide>s.glideMix?4.3:6.5,dt);
    // A burst of strokes carries a moving raptor into a short glide. The clock
    // follows wing angle, so starting a turn or a climb never restarts the beat.
    const beat=(flightCycles%4+4)%4;
    const quiet=smooth(1.78,2.37,beat)*(1-smooth(large?3.48:3.22,4,beat));
    const efficiency=s.forwardAir*s.glideMix*(1-s.liftDemand);
    const cruise=(large?.78:.87)-quiet*(large?.72:.68);
    let power=inFlight?1-efficiency*(1-cruise):0;
    if(c.flight==='landing')power=(.30+.38*(1-s.flare))*(1-.36*s.forwardAir);
    if(c.diving)power*=.28;
    s.wingPower=follow(s.wingPower,power,power>s.wingPower?10:7.8,dt);
    const launchBeat=takeoffAge<=.72&&c.flight!=='landing'&&!c.diving;
    const frequency=launchBeat?1/.70:(large?1.31:1.16)+.34*s.liftDemand-.38*efficiency*(1-s.wingPower);
    if(inFlight||c.flight==='takeoff')flightCycles=(flightCycles+dt*frequency)%4;
    s.flapPhase=2*Math.PI*flightCycles;
    const touchdown=c.flight==='landing'?1-smooth(.04,.66,c.height):1-smooth(.025,.24,landingAge);
    s.touchdownMix=touchdown;
    const transitioning=Math.max(s.takeoff,s.flare,touchdown);
    s.collection=follow(s.collection,smooth(.025,.36,s.drive)*transitioning,12,dt);
    s.stepLead=lead;
   }
   // Exact critically damped spring, driven by downward momentum on contact.
   const w=quad?10.6:animalBird?13.4:11.8,old=s.compression,term=springSpeed+w*old,decay=Math.exp(-w*dt);
   s.compression=Math.max(0,(old+term*dt)*decay);springSpeed=(springSpeed-w*term*dt)*decay;
   if(s.compression>1){s.compression=1;springSpeed=Math.min(0,springSpeed);}
   lastSpeed=c.speed;lastYaw=c.yaw;return s;
  }
  return {signals,reset,launch,approach,contactPhase,cancelLift,touch,advance,get takeoffAge(){return takeoffAge;},get landingAge(){return landingAge;}};
 }
 function clipHeight(species,form,id,t,gravity,profile){
  const bird=species==='falcao',reference=form==='completa'?1.12:.86;
  if(id==='jump'){
   const air=Math.max(0,t-(bird?.09:.082)),speed=profile.push/profile.mass;
   return Math.max(0,air*(speed-.5*gravity*air));
  }
  if(id==='takeoff'&&bird){const u=clamp((t-toeOff)/(.82-toeOff));return reference*u*(2-u);}
  if(id==='land'){
   const end=bird?falconTouch:wolfTouch,u=clamp(t/end);
   if(bird)return reference*(1-u)*(1-.50*u);
   const drop=.34,initial=(drop-.5*gravity*end*end)/end;return Math.max(0,drop-initial*(u*end)-.5*gravity*(u*end)**2);
  }
  if(bird&&['flight','glide','turn'].includes(id))return reference;
  if(!bird&&form==='completa'&&id==='lobo0'){
   const u=Math.max(0,t-.23);return Math.max(0,u*(3.35-.5*gravity*u));
  }
  return 0;
 }
 return {create,clipHeight,toeOff,falconTouch,wolfTouch};
})();
