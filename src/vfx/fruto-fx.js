// Efeitos das frutas do Laboratório Voxel (FRUTO_Laboratorio_Voxel_Edicao_18.html), trazidos
// sem mudanças de desenho para o jogo (atualização 18): projéteis por fruta (cometa de fogo,
// lasca de cristal, pena, areia, orbe sombrio, pistão), impactos (fogo, prisma, penas, areia,
// vórtice, explosão cinética), zonas (fogueira, muralha de gelo, vórtice), onda e olho da
// maré, furacão de areia, nuvem e raios da tempestade, ímã, ressonância do eco, garras,
// rastros de soco e investida, técnicas, ativação, carga na mão e aura.
// A ponte com o jogo (quem chama o quê em cada habilidade) fica em labFx.js.
/* eslint-disable */
import * as THREE_LIB from 'three';
const FRUTOElements=(()=>{
 const moves={
  mare:[
   {range:9.6,width:6.4,height:3.65,life:1.16},
   {range:8.2,width:5.6,height:2.55,life:1.06},
   {radius:4.2,height:1.10,life:2.5,pulses:[.20,.40,.60,.80]}
  ],
  duna:{radius:4.45,height:6.3,life:3.05,pulses:[.18,.35,.52,.69,.86]},
  tormenta:{radius:3.65,height:6.1,life:1.50}
 };
 const unit=x=>Math.max(0,Math.min(1,x));
 function smooth(x){x=unit(x);return x*x*(3-2*x);}
 function forMove(id,slot,scale=1){
  const base=id==='mare'?moves.mare[slot]:slot===2?moves[id]:null;
  if(!base)return null;
  const result={...base,height:base.height*(1+.72*(scale-1))};
  for(const key of ['range','width','radius'])if(base[key]!==undefined)result[key]=base[key]*scale;
  return result;
 }
 function frontAt(spec,t,lateral){
  const u=unit(t),side=unit(Math.abs(lateral)/(spec.width*.5));
  // A bowed crest reaches the middle of the lane a little before the tips.
  return spec.range*(.86*u+.14*u*u)-spec.width*.15*side*side*Math.sin(Math.PI*u);
 }
 function waveHeight(spec,t,lateral){
  const u=unit(t),side=unit(Math.abs(lateral)/(spec.width*.5));
  const swell=.18+.82*smooth(u/.22),breaking=1-.69*smooth((u-.71)/.29);
  return spec.height*swell*breaking*(1-.53*side*side);
 }
 function eyeRadius(spec,t){
  return spec.radius*(.17+.83*smooth(t/.18))*(1-.74*smooth((t-.83)/.17));
 }
 function cycloneRadius(spec,t){
  return spec.radius*(.30+.70*smooth(t/.28))*(1-.77*smooth((t-.86)/.14));
 }
 function cycloneHeight(spec,t){
  return spec.height*(.09+.91*smooth(t/.26))*(1-.84*smooth((t-.86)/.14));
 }
 return {forMove,frontAt,waveHeight,eyeRadius,cycloneRadius,cycloneHeight};
})();


function createTidalFX({T,V,TAU,geo,soft,level,calm,carved,sculpt,material,horizontalDir,surfaceHeight,smooth,floorAt,add}) {
 // Flat-painted, deformable water surfaces. The same logical vertex can belong
 // to two different colour patches, so a crest has a hard, illustrated edge.
 function tidalSurface(pointCount, faces, bounds, opacity) {
  const lookup = [], colours = [], indices = [], polygons = [];
  const paint = new T.Color();
  for (const [points, colour] of faces) {
   const first = lookup.length;
   paint.set(colour);
   for (const point of points) {
    lookup.push(point);
    colours.push(paint.r, paint.g, paint.b);
   }
   const polygon = points.map((_, i) => first + i);
   polygons.push(polygon);
   for (let i = 1; i < points.length - 1; i++) indices.push(first, first + i, first + i + 1);
  }
  const shape = new T.BufferGeometry();
  const buffer = new T.BufferAttribute(new Float32Array(lookup.length * 3), 3);
  buffer.setUsage(T.DynamicDrawUsage);
  shape.setAttribute('position', buffer);
  shape.setAttribute('color', new T.Float32BufferAttribute(colours, 3));
  shape.setIndex(indices);
  shape.boundingSphere = new T.Sphere(V(), bounds);
  shape.userData.polygons = polygons;
  shape.userData.ephemeralFX = true;
  shape.userData.dynamicFXRadius = bounds;
  const points = new Float32Array(pointCount * 3), object = carved(shape, opacity);
  object.frustumCulled = false;
  function point(i, x, y, z) {
   const n = 3 * i;
   points[n] = x;
   points[n + 1] = y;
   points[n + 2] = z;
  }
  function commit() {
   const output = buffer.array;
   for (let i = 0; i < lookup.length; i++) {
    const from = 3 * lookup[i], to = 3 * i;
    output[to] = points[from];
    output[to + 1] = points[from + 1];
    output[to + 2] = points[from + 2];
   }
   buffer.needsUpdate = true;
  }
  return {object, point, commit};
 }

 // Bevelled flecks use one shared asset and one instanced draw per effect.
 function tidalFoam(count) {
  if (!geo.tidalFoam) {
   const edges = [[-.48,-.21],[-.27,-.5],[.27,-.5],[.5,-.22],[.47,.26],[.24,.5],[-.29,.45],[-.5,.20]];
   const upper = edges.map(([x,z]) => [x*.78,.45,z*.78]);
   const lower = edges.map(([x,z]) => [x,-.36,z]);
   const facets = [[upper,'#fffef7'],[lower,'#c0e6e1']];
   for (let i=0; i<edges.length; i++) {
    const j=(i+1)%edges.length;
    facets.push([[lower[i],lower[j],upper[j],upper[i]],i%3===0?'#e7fbf2':'#cceee9']);
   }
   geo.tidalFoam = sculpt(facets);
  }
  const mat = material('#ffffff',.88);
  mat.vertexColors = true;
  const object = new T.InstancedMesh(geo.tidalFoam,mat,count);
  object.frustumCulled = false;
  object.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const pose = new T.Object3D();
  return {object, pose, place(i) { pose.updateMatrix(); object.setMatrixAt(i,pose.matrix); }};
 }

 function grandWave(start, dir, spec, returning=false) {
  const heading = horizontalDir(dir), root = new T.Group();
  root.name = returning ? 'Ressaca_de_espuma' : 'Onda_de_arrebentacao';
  root.rotation.y = Math.atan2(heading.x,heading.z);
  const detail = soft ? 2 : level(), spans = [18,13,9][detail];
  // Rear sheet, crest, overhanging white lip, underside and hollow front face.
  // The foremost point is exactly at frontAt, and the highest at waveHeight.
  const profile = [[-1.10,.00],[-.78,.09],[-.52,.33],[-.44,.60],[-.37,.83],
   [-.26,.94],[-.14,1],[-.045,.96],[0,.84],[-.035,.69],[-.10,.67],[-.18,.76],
   [-.25,.67],[-.29,.43],[-.19,.18],[-.025,.008]];
  const blue = returning
   ? ['#136681','#16859d','#26a4b4','#43b7bc','#7ed8d1','#c6eeeb','#f1fff3','#d5faf2',
      '#a0e2db','#74c7d1','#358fa5','#1c7194','#268ca5','#43b4be','#7bccc6']
   : ['#167987','#1c929c','#27a5a9','#4abeba','#80d7c9','#b4e9da','#eefff2','#f7fff2',
      '#ccefe3','#86d5ce','#399ca7','#176f91','#16849b','#2ca6ac','#67c6be'];
  const rows = profile.length, span = spec.width/spans, wallFaces = [];
  for (let s=0; s<spans; s++) {
   for (let j=0; j<rows-1; j++) {
    const i = s*rows+j;
    const stagger = (s*5+j*2)%11;
    const colour = j===5 && stagger<3 ? '#e2f7e9' :
     j===9 && stagger<4 ? '#c4ebdb' : j===3 && stagger===2 ? '#68cac0' : blue[j];
    wallFaces.push([[i,i+rows,i+rows+1,i+1],colour]);
   }
  }
  for (const s of [0,spans]) {
   const startRow=s*rows;
   for (let j=0; j<7; j++) {
    const top=startRow+j, front=startRow+rows-j-1;
    wallFaces.push([[top,top+1,front-1,front],blue[j+1]]);
   }
  }
  const wall = tidalSurface((spans+1)*rows,wallFaces,spec.width+spec.height*2,.9);
  wall.object.material.depthWrite=true;
  root.add(wall.object);

  // Two thin wash lines curve away from the back, joined by short diagonal
  // streaks on the sloping sheet. All of them ride the actual terrain.
  const streaks = detail===2 ? 4 : detail===1 ? 6 : 8, washLines = returning ? 3 : 2;
  const washCols = detail===2 ? 8 : 12, washFaces = [];
  const wakeCount = washLines*(washCols+1)*2;
  const bedFaces=[];
  for (let i=0; i<washCols; i++) {
   const k=4*i;
   bedFaces.push([[k,k+1,k+5,k+4],returning?'#228896':'#2b9a9c'],
    [[k+1,k+2,k+6,k+5],i%4?'#32898f':'#499d9c'],
    [[k+2,k+3,k+7,k+6],returning?'#67bdb4':'#56ada8']);
  }
  const bed=tidalSurface((washCols+1)*4,bedFaces,spec.width+spec.height*3,.62);
  root.add(bed.object);
  for (let j=0; j<washLines; j++) {
   for (let i=0; i<washCols; i++) {
    const k = 2*(j*(washCols+1)+i);
    if ((j*5+i)%7 !== 4)
     washFaces.push([[k,k+1,k+3,k+2],(i+2*j)%5===1?'#e4fff0':returning?'#87ded0':'#8bdad2']);
   }
  }
  for (let i=0; i<streaks; i++) {
   const k=wakeCount+i*12;
   washFaces.push([[k,k+1,k+3,k+2],'#83cfc8'],[[k+2,k+3,k+5,k+4],i%3?'#98e6d6':'#d3f5df']);
   washFaces.push([[k+6,k+7,k+9,k+8],'#48a9ad'],[[k+8,k+9,k+11,k+10],i%3?'#66c6c5':'#9be2d5']);
  }
  const wash = tidalSurface(wakeCount+streaks*12,washFaces,spec.width+spec.height*3,.78);
  root.add(wash.object);

  const clumps = detail===2 ? 4 : detail===1 ? 6 : 8, drops = detail===2 ? 5 : detail===1 ? 9 : 15;
  const foam = tidalFoam(clumps+drops);
  root.add(foam.object);
  let axis=0, floor=0;
  function levelAt(x,z) {
   return surfaceHeight(start.x + heading.z*x + heading.x*z, start.z - heading.x*x + heading.z*z)-floor;
  }
  function placePoint(skin,i,x,travel,y) {
   skin.point(i,x,levelAt(x,travel)+.044+y,travel-axis);
  }
  function frame(o,t,tail=1) {
   axis = FRUTOElements.frontAt(spec,t,0);
   o.position.set(start.x+heading.x*axis,0,start.z+heading.z*axis);
   floor = surfaceHeight(o.position.x,o.position.z);
   o.position.y = floor;
   const half = .5*spec.width, clock=t*spec.life;
   const depth = returning ? .66 : .84;
   for (let s=0; s<=spans; s++) {
    const x=span*s-half, z=FRUTOElements.frontAt(spec,t,x), h=FRUTOElements.waveHeight(spec,t,x);
    const grain=.5+.5*Math.sin(1.42*s+.45*Math.sin(4*clock+s*.4));
    for (let j=0; j<rows; j++) {
     const [aft,up]=profile[j];
     // The broken cap divides into scallops as it curls down over the dark face.
     const lip = j===9||j===10 ? .14*grain : j===8||j===11 ? .034*grain : 0;
     const sway = j>2&&j<6 ? .036*Math.sin(s*.94+clock*3)*(1-up) : 0;
     placePoint(wall,s*rows+j,x,z+h*(aft+sway)*depth,h*(up-lip));
    }
   }
   wall.commit();
   for (let s=0;s<=washCols;s++) {
    const across=2*s/washCols-1, lateral=half*across;
    const front=FRUTOElements.frontAt(spec,t,lateral), h=FRUTOElements.waveHeight(spec,t,lateral);
    const trail=Math.min(Math.max(0,front-FRUTOElements.frontAt(spec,0,lateral))*.90,
     h*(returning?2.55:2.02))*(1-.48*across*across);
    const reach=Math.max(h*depth*1.06,trail);
    for (let j=0;j<4;j++) {
     const u=j/3, x=lateral*(1-(returning?.30:.17)*u);
     const ripple=.03*h*Math.sin(7*across+j+clock*3)*u;
     const from=front-h*depth*.68;
     placePoint(bed,4*s+j,x,from-reach*u+ripple,.014+h*.02*(1-u));
    }
   }
   bed.commit();
   for (let j=0; j<washLines; j++) {
    for (let s=0; s<=washCols; s++) {
     const u=s/washCols, across=2*u-1, x=half*across*(.96-j*.09);
     const z=FRUTOElements.frontAt(spec,t,x), h=FRUTOElements.waveHeight(spec,t,x);
     const travelled=Math.max(0,z-FRUTOElements.frontAt(spec,0,x));
     const reach=Math.min(travelled+.30,spec.height*(1.28+.49*j));
     const billow=.12*Math.cos(across*7+clock*3+j)+.19*across*across;
     const tail=z-Math.max(.055,h*.65*depth+reach*(.44+.17*j+billow));
     const w=(.028+.065*(1-across*across))*spec.height*(j? .78:1);
     const i=2*(j*(washCols+1)+s);
     placePoint(wash,i,x,tail-w*.5,.032);
     placePoint(wash,i+1,x,tail+w*.5,.040);
    }
   }
   for (let s=0; s<streaks; s++) {
    const nominal=((s+.56)/streaks-.5)*spec.width*.91;
    for (let j=0; j<3; j++) {
     const row=2+j, drift=(j-1)*span*.28*(returning?-1:1);
     const x=nominal+drift+.06*Math.sin(clock*2+s);
     const halfWidth=(j===1?.13:.024)*span;
     for (let edge=0; edge<2; edge++) {
      const side=x+(edge?halfWidth:-halfWidth), z=FRUTOElements.frontAt(spec,t,side);
      const h=FRUTOElements.waveHeight(spec,t,side), [aft,up]=profile[row];
      placePoint(wash,wakeCount+12*s+2*j+edge,side,z+h*(aft-.033)*depth,h*(up+.025));
      const frontRow=14-j, [over,faceUp]=profile[frontRow];
      const opposite=nominal*.94-drift*1.45+(j===0?.22*span:0)+(edge?halfWidth:-halfWidth);
      const zFront=FRUTOElements.frontAt(spec,t,opposite),faceH=FRUTOElements.waveHeight(spec,t,opposite);
      placePoint(wash,wakeCount+12*s+6+2*j+edge,opposite,zFront+faceH*(over+.019)*depth,
       faceH*(faceUp+.012));
     }
    }
   }
   wash.commit();
   const p=foam.pose;
   for (let i=0; i<clumps+drops; i++) {
    const airborne=i>=clumps, seed=airborne ? i-clumps : i;
    const q=(clock*(returning?1.27:1.50)+seed*.61803)%1;
    const x = (airborne ? (((seed*.61803+.15)%1)-.5)*.97 : ((i+.55)/clumps-.5)*.92)*spec.width;
    const z=FRUTOElements.frontAt(spec,t,x), h=FRUTOElements.waveHeight(spec,t,x);
    const tip = airborne ? -.18+.26*q : -.14-.054*Math.sin(clock*2.1+i);
    const crestY = airborne ? .89+.38*Math.sin(Math.PI*q)-.13*q : .978+.018*Math.cos(i+clock*2);
    const at=z+tip*h*depth, envelope=airborne ? Math.sin(Math.PI*q) : 1;
    const size=(airborne ? .045+.025*((i*3)%5)/4 : .104+.028*Math.sin(i*3.1))*h*envelope;
    p.position.set(x,levelAt(x,at)+.055+h*crestY,at-axis);
    p.rotation.set(airborne?.75*q:.08, .35*Math.sin(i*2), airborne ? i+q*2 : .1*Math.sin(i));
    p.scale.set(size*(airborne?.69:1.85),size*(airborne?1.18:.55),size*(airborne?.70:1.04));
    foam.place(i);
   }
   foam.object.instanceMatrix.needsUpdate=true;
   const edgeFade=(.65+.35*smooth(t/.10))*(1-.28*smooth((t-.87)/.13))*tail;
   wall.object.material.opacity=(calm()?.80:.91)*edgeFade;
   wall.object.visible=wall.object.material.opacity>.035;
   bed.object.material.opacity=(calm()?.50:.65)*edgeFade;
   wash.object.material.opacity=(calm()?.59:.77)*edgeFade;
   foam.object.material.opacity=(calm()?.72:.92)*edgeFade;
  }
  frame(root,0);
  const runout=.17,life=spec.life+runout;
  return add(root,life,(o,t)=>{
   const elapsed=t*life;
   frame(o,Math.min(1,elapsed/spec.life),1-smooth((elapsed-spec.life)/runout));
  });
 }

 function tidalEye(center,spec) {
  const root=new T.Group(), detail=soft ? 2 : level();
  root.name='Olho_da_mare';
  root.position.copy(floorAt(center,.044));
  const spans=[28,22,15][detail], rings=[.12,.26,.47,.72,.91,1];
  const basinFaces=[], cols=['#154c68','#176782','#168394','#289da5','#50b8b6'];
  for (let i=0; i<spans; i++) {
   const next=(i+1)%spans;
   basinFaces.push([[0,1+i,1+next],i%4===0?'#17495c':'#194e65']);
   for (let j=0; j<rings.length-1; j++) {
    const k=1+j*spans;
    basinFaces.push([[k+i,k+next,k+spans+next,k+spans+i],j===3&&i%6===0?'#3dabb1':cols[j]]);
   }
  }
  const basin=tidalSurface(1+spans*rings.length,basinFaces,spec.radius*1.4,.74);
  root.add(basin.object);
  const arms=detail===2?2:3, steps=detail===2?14:detail===1?18:24, spirals=[];
  for (let arm=0; arm<arms; arm++) {
   for (let j=0; j<steps; j++) {
    const k=3*(arm*(steps+1)+j);
    spirals.push([[k,k+1,k+4,k+3],(j+arm)%4===1?'#81d7c8':'#48b3b4']);
    spirals.push([[k+1,k+2,k+5,k+4],(j+arm)%5>1?'#c4f3df':'#8bdad2']);
   }
  }
  const streams=tidalSurface(3*arms*(steps+1),spirals,spec.radius*1.4,.86);
  root.add(streams.object);
  const n=detail===2 ? 5 : detail===1 ? 8 : 12, foam=tidalFoam(n);
  root.add(foam.object);
  function surface(x,z) {
   return surfaceHeight(center.x+x,center.z+z)-root.position.y+.048;
  }
  function writeAt(skin,i,angle,rad,y) {
   const x=Math.cos(angle)*rad, z=Math.sin(angle)*rad;
   skin.point(i,x,surface(x,z)+y,z);
  }
  function frame(o,t) {
   const active=FRUTOElements.eyeRadius(spec,t), clock=spec.life*t;
   let pulseBand=-2;
   if (spec.pulses) {
    for (const pulseTime of spec.pulses) {
     const age=clock-pulseTime*spec.life;
     if (age>=0 && age<.44) pulseBand=1-age/.44;
    }
   }
   // Higher water at the rim creates the impression of a hollow whirlpool,
   // including on sloping terrain, where an actual depression would be hidden.
   function lift(q,a) {
    const ridge=Math.sin(a*arms+q*6-clock*3);
    const swell=.041+.078*Math.sin(q*Math.PI*.83)+.027*ridge*q;
    const ring=Math.max(0,1-Math.abs(q-pulseBand)/.22);
    return active*(swell+ring*ring*.041);
   }
   basin.point(0,0,surface(0,0)+.012,0);
   for (let j=0; j<rings.length; j++) {
    const q=rings[j];
    for (let i=0; i<spans; i++) {
     const a=i*TAU/spans+clock*.68+q*.96;
     writeAt(basin,1+j*spans+i,a,active*q,lift(q,a)*(j===0?.42:j===rings.length-1?.64:1));
    }
   }
   basin.commit();
   for (let arm=0; arm<arms; arm++) {
    for (let i=0; i<=steps; i++) {
     const u=i/steps;
     const q=.96-.797*u, a=arm*TAU/arms+clock*1.34+u*4.47;
     const width=(.012+.075*Math.pow(Math.sin(Math.PI*u),.76))*(1-.29*u);
     const k=3*(arm*(steps+1)+i), crest=active*(.018+.071*Math.sin(Math.PI*u));
     for (let edge=0; edge<3; edge++) {
      const rad=q+(edge-1)*width;
      const h=lift(rad,a)+.031+crest*(edge===1?1:edge===2?.43:0);
      writeAt(streams,k+edge,a,active*rad,h);
     }
    }
   }
   streams.commit();
   for (let i=0; i<n; i++) {
    const q=(clock*.48+i*.61803)%1, rad=active*(.95-.66*q);
    const a=i*2.4+clock*1.41+q*1.7, x=Math.cos(a)*rad, z=Math.sin(a)*rad;
    const size=active*(.018+.013*(i%3))*Math.sin(Math.PI*q);
    const p=foam.pose;
    p.position.set(x,surface(x,z)+lift(rad/Math.max(.001,active),a)+active*(.05+.094*Math.sin(q*Math.PI)),z);
    p.rotation.set(.3*Math.sin(i),-a, .45*Math.sin(i+clock*2));
    p.scale.set(size*.72,size*.72,size*2.1);
    foam.place(i);
   }
   foam.object.instanceMatrix.needsUpdate=true;
   const fadeOut=1-smooth((t-.84)/.16);
   basin.object.material.opacity=(calm()?.60:.76)*fadeOut;
   streams.object.material.opacity=(calm()?.72:.91)*fadeOut;
   foam.object.material.opacity=.88*fadeOut;
  }
  frame(root,0);
  return add(root,spec.life,frame);
 }
 return {grandWave,tidalEye};
}

function createCycloneFX({T,TAU,geo,soft,level,calm,carved,sculpt,material,clamp,smooth,surfaceHeight,floorAt,add}) {
 // Wind-carved sheets share geometry between casts. The open mouth and the tapered
 // throat stay legible from above and at the arena camera's shallow viewing angle.
 const cycloneShapes = new Map();
 function cycloneShape(detail) {
  if (cycloneShapes.has(detail)) return cycloneShapes.get(detail);
  const low = detail === 2, sides = low ? 10 : detail === 1 ? 14 : 19;
  const steps = low ? 19 : detail === 1 ? 25 : 34;
  const rim = u => .055 + .625 * Math.pow(u, 1.38);
  function polar(u, angle, radius, height) {
   return [Math.sin(4.6*u-.48)*.104*u + Math.cos(angle)*radius, height,
           Math.sin(5.3*u+.36)*.081*u + Math.sin(angle)*radius];
  }
  // A thin, hollow body catches the shadows behind the spiral folds. Its top is open.
  const veilFaces = [], levels = [.015,.20,.43,.65,.80,.945];
  const veilTones = ['#a66e55','#b77950','#cb8a54','#d39b65','#dbad78'];
  function veilPoint(i,j) {
   const u=levels[j], a=TAU*i/sides+.62*u;
   return polar(u,a,rim(u)*(.77+.026*Math.sin(3*a+u*6)),u+.015*u*Math.sin(2*a));
  }
  for(let j=0;j<levels.length-1;j++) for(let i=0;i<sides;i++) {
   veilFaces.push([[veilPoint(i,j),veilPoint(i+1,j),veilPoint(i+1,j+1),veilPoint(i,j+1)],veilTones[j]]);
  }
  // Adjacent bands show an umber underside, broad sunlit face and a thin lifted lip.
  // The curves climb the entire funnel. The pieces are not stacked horizontal hoops.
  const folds = [], fracture = [[-1,-.09],[-.82,.005],[.09,.085],[.73,.057],[1,-.015]];
  const colors = [['#925a42','#c8814d','#dda261','#f7c982'],['#ab7150','#df9f60','#efba78','#ffe3a4']];
  for(let band=0;band<2;band++) {
   function edge(u,j) {
    const roll=Math.pow(Math.max(0,Math.sin(Math.PI*u)),.46);
    const sweep=TAU*(1.12*u+.090*u*u)+band*3.16+.08*Math.sin(3.1*u+band);
    const width=(.061+.092*u)*(.23+.77*roll);
    const h=.015+.905*u+width*fracture[j][0];
    const r=rim(clamp(h,0,1))*(1.02+.044*Math.sin(2*sweep)+fracture[j][1]);
    return polar(u,sweep,r,h);
   }
   for(let i=0;i<steps;i++) for(let j=0;j<fracture.length-1;j++) {
    const u=i/steps,v=(i+1)/steps;
    const warmth=.90+.10*Math.sin(8.5*u+band)+.08*u;
    const tone=new T.Color(colors[band][j]).multiplyScalar(warmth);
    folds.push([[edge(u,j),edge(v,j),edge(v,j+1),edge(u,j+1)],tone]);
   }
  }
  // Two broad, broken curls roll into the eye. The inner wall stays darker and
  // tapers away at each end, like sand thrown over a dune crest.
  const lipFaces = [], lipColors = ['#c38a59','#efba78','#ffdfa1','#d5a26b','#ad7654'];
  const lipProfile = [[.49,-.068],[.64,-.015],[.655,.035],[.57,.057],[.405,-.005],[.365,-.065]];
  for(const [start,length] of [[-.35,4.15],[4.03,1.58]]) {
   const n=Math.ceil(sides*length/TAU);
   function lipPoint(i,j) {
    const u=i/n, a=start+u*length, taper=.12+.88*Math.pow(Math.sin(Math.PI*u),.42);
    const [r,y]=lipProfile[j];
    return polar(1,a,.505+(r-.505)*taper+.03*Math.sin(3*a+.35),
     .916+.048*Math.sin(a+.8)+.026*Math.sin(3*a)+taper*y);
   }
   for(let i=0;i<n;i++) for(let j=0;j<lipProfile.length-1;j++) {
    lipFaces.push([[lipPoint(i,j),lipPoint(i+1,j),lipPoint(i+1,j+1),lipPoint(i,j+1)],lipColors[j]]);
   }
  }
  // Narrow discontinuous wisps have their own motion and occasionally detach
  // from the dense sand. Leave open space beyond them for the flying grains.
  const wisps=[];
  for(const [start,end,phase,gap] of [[.10,.63,1.0,.084],[.53,.98,3.4,.102],[.29,.81,5.3,.04]]) {
   const n=low?8:13;
   function wispPoint(i,side) {
    const u=i/n,h=start+(end-start)*u,w=Math.pow(Math.sin(Math.PI*u),.8);
    const a=TAU*(1.04*h+.1*h*h)+phase;
    return polar(h,a,rim(h)+gap+.035*w+side*.006*w,h+side*(.004+.017*w));
   }
   for(let i=0;i<n;i++) wisps.push([[wispPoint(i,-1),wispPoint(i+1,-1),wispPoint(i+1,1),wispPoint(i,1)],phase>4?'#ca8e58':'#f6d69b']);
  }
  // Rounded blocks of dust collect in pockets, then break apart above the lip.
  const cloudFaces=[],flanks=['#e7c193','#efc99a','#d8a574','#d4a474','#e2b781','#eac28e'];
  function cloudPoint(i,ring) {
   const a=i*TAU/6+.13*ring, size=[.71,1,.64][ring]*(.98+.08*Math.sin(i*4.2+ring));
   return [Math.cos(a)*size,[-.48,.05,.50][ring]+.09*Math.sin(a*2+.6),Math.sin(a)*size];
  }
  for(let i=0;i<6;i++) {
   for(let j=0;j<2;j++) cloudFaces.push([[cloudPoint(i,j),cloudPoint(i+1,j),cloudPoint(i+1,j+1),cloudPoint(i,j+1)],flanks[(i+j)%6]]);
  }
  cloudFaces.push([Array.from({length:6},(_,i)=>cloudPoint(i,2)),'#f0d5ad']);
  cloudFaces.push([Array.from({length:6},(_,i)=>cloudPoint(5-i,0)),'#c39875']);
  const brush=sculpt([[[[-.5,0,-.38],[-.49,.01,.28],[.48,.018,.46],[.5,0,-.36]],'#fff1d5']]);
  const shapes={veil:sculpt(veilFaces),folds:sculpt(folds),lip:sculpt(lipFaces),wisps:sculpt(wisps),cloud:sculpt(cloudFaces),brush};
  cycloneShapes.set(detail,shapes);
  return shapes;
 }
 function sandCyclone(center,spec) {
  const detail=soft?2:level(), shapes=cycloneShape(detail), low=detail===2;
  const root=new T.Group();root.name='Furacao_de_areia';root.position.copy(floorAt(center,.035));
  const veil=carved(shapes.veil),folds=carved(shapes.folds),lip=carved(shapes.lip),wisps=carved(shapes.wisps);
  const wind=new T.Group();wind.add(veil,folds,lip,wisps);root.add(wind);
  const lanes=low?3:detail===1?4:5, segments=low?6:detail===1?8:10, outside=low?14:22;
  const marks=new T.InstancedMesh(shapes.brush,material('#ffffff',.76),lanes*segments+outside);
  const pieces=low?12:detail===1?21:32,dirt=new T.InstancedMesh(geo.cube,material('#ffffff',.95,true),pieces);
  // Use painted colours for the stones; the standard material's default white
  // emissive would bleach the darker rocks.
  dirt.material.emissive.set('#6c422b');dirt.material.emissiveIntensity=.07;
  const pockets=low?8:detail===1?11:15;
  const dust=new T.InstancedMesh(shapes.cloud,material('#ffffff',.38),pockets);dust.material.vertexColors=true;
  marks.frustumCulled=dirt.frustumCulled=dust.frustumCulled=false;root.add(marks,dirt,dust);
  const scratch=new T.Object3D(),ink=new T.Color();scratch.rotation.order='YXZ';
  const strokeColors=['#d09b5b','#e7bc79','#a97551','#ecc989','#c69569'];
  for(let i=0;i<marks.count;i++) marks.setColorAt(i,ink.set(strokeColors[i<lanes*segments?Math.floor(i/segments)%5:i%3]));
  const stoneColors=['#d79352','#c38f63','#f4c77e','#9a6c52','#ecd19a','#bc865a'];
  for(let i=0;i<pieces;i++) dirt.setColorAt(i,ink.set(stoneColors[i%stoneColors.length]));
  for(let i=0;i<pockets;i++) dust.setColorAt(i,ink.set(i%4===1?'#dcb690':i%4===2?'#f7d9a3':'#fff0d9'));
  const p0={x:0,y:0,z:0},p1={x:0,y:0,z:0};
  function groundPoint(p,angle,r) {
   p.x=Math.cos(angle)*r;p.z=Math.sin(angle)*r;
   p.y=surfaceHeight(center.x+p.x,center.z+p.z)-root.position.y+.081;
  }
  function stroke(index,a,b,width) {
   const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,flat=Math.hypot(dx,dz);
   scratch.position.set((a.x+b.x)*.5,(a.y+b.y)*.5,(a.z+b.z)*.5);
   scratch.rotation.set(0,-Math.atan2(dz,dx),Math.atan2(dy,flat),'YXZ');
   scratch.scale.set(Math.max(.002,Math.hypot(flat,dy)*1.02),.07,Math.max(.001,width));
   scratch.updateMatrix();marks.setMatrixAt(index,scratch.matrix);
  }
  function frame(o,t) {
   const r=FRUTOElements.cycloneRadius(spec,t),h=FRUTOElements.cycloneHeight(spec,t);
   const age=t*spec.life,opacity=smooth(t/.085)*smooth((1-t)/.15);
   let gust=0;
   for(const arrival of spec.pulses) gust=Math.max(gust,1-smooth(Math.abs(t-arrival)/.080));
   const turn=age*2.15+.12*gust;
   wind.scale.set(r,h,r);wind.rotation.y=-turn;
   folds.rotation.y=.07*Math.sin(age*2.4);lip.rotation.y=.07*Math.sin(age*3.7+.5);
   veil.rotation.y=-.38*age;wisps.rotation.y=.20*Math.sin(age*3.4)+.19*gust;
   // The high streamers separate slightly during the last gust before they fade.
   wisps.position.y=.017*gust+.075*smooth((t-.84)/.16);
   veil.material.opacity=.34*opacity;folds.material.opacity=(calm()?.79:.89)*opacity;
   lip.material.opacity=.94*opacity;wisps.material.opacity=(.46+.15*gust)*opacity;
   marks.material.opacity=(.57+.16*gust)*opacity;dirt.material.opacity=.91*opacity;
   let index=0;
   for(let lane=0;lane<lanes;lane++) {
    const start=lane*TAU/lanes+.18*Math.sin(lane*2.5)-age*.71;
    groundPoint(p0,start,r*(.94-.024*(lane%3)));
    for(let k=1;k<=segments;k++) {
     const u=k/segments,arc=start+u*(2.1+.10*(lane%2));
     groundPoint(p1,arc,r*(.94-.024*(lane%3)-.80*u));
     stroke(index++,p0,p1,r*(.012+.056*Math.sin(Math.PI*(k-.5)/segments)));
     p0.x=p1.x;p0.y=p1.y;p0.z=p1.z;
    }
   }
   // A wind-torn edge touches the exact damage radius on sloped ground.
   for(let i=0;i<outside;i++) {
    const angle=TAU*i/outside-age*.46,arc=TAU/outside;
    groundPoint(p0,angle,r*(.988+.012*Math.sin(2*angle)));
    groundPoint(p1,angle+arc*(i%4?.91:.45),r*(.978+.018*Math.sin(2*(angle+arc))));
    stroke(index++,p0,p1,r*(i%4?.022:.013));
   }
   marks.instanceMatrix.needsUpdate=true;
   dust.material.opacity=(calm()?.31:.41+.09*gust)*opacity;
   for(let i=0;i<pockets;i++) {
    const aloft=i%3===2;
    const life=(age*(aloft?.53:.67)+i*.371)%1;
    const envelope=Math.pow(Math.sin(Math.PI*life),.66), drift=aloft?life:1-life;
    const angle=TAU*(i*.382+(aloft?.125:.26)*life)-age*(aloft?.71:1.19);
    const radius=aloft?(.36+.44*life)*r:(.15+.60*drift*drift)*r;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    const size=r*(aloft?.13+.065*life:.17+.084*(1-drift))*(.78+.11*(i%4))*(1+.28*gust)*envelope;
    const y=aloft?h*(.78+.17*life)+.10*Math.sin(5*life+i):surfaceHeight(center.x+x,center.z+z)-root.position.y+.045+size*.25+life*life*.38;
    scratch.position.set(x,y,z);scratch.rotation.set(aloft?.14:.04,-angle+.72,.11*Math.sin(i+age),'YXZ');
    scratch.scale.set(size*1.46,size*(aloft?.68:1.05),size*.79);
    scratch.updateMatrix();dust.setMatrixAt(i,scratch.matrix);
   }
   dust.instanceMatrix.needsUpdate=true;
   for(let i=0;i<pieces;i++) {
    const u=(age*(.43+.077*(i%4))+(i+.5)/pieces)%1;
    const z=clamp((u-.22)/.78),a=i*2.39996+age*(1.80+(i%3)*.13)+z*3.6;
    const spiral=.10+.69*Math.pow(z,1.17)+.07*Math.sin(i*2+z*7);
    const rr=r*(u<.22?.92-.75*smooth(u/.22):spiral);
    const x=Math.cos(a)*rr+.07*r*z*Math.sin(4.6*z-.48),y=z*h;
    const dz=Math.sin(a)*rr+.06*r*z*Math.sin(5.3*z+.36);
    const summit=smooth((u-.81)/.19),lift=y+.038+.11*Math.sin(Math.PI*clamp(u/.22));
    const floor=surfaceHeight(center.x+x,center.z+dz)-root.position.y;
    scratch.position.set(x,Math.max(floor+.045,lift+floor*(1-z)),dz);
    scratch.rotation.set(a*.72+i,a+z*2.1,.35+i*.76+age*2.9,'YXZ');
    const seed=.044+r*(i%6===0?.050:.016+.006*(i%3));
    const size=seed*smooth(u/.065)*(1-summit)*opacity;
    scratch.scale.set(size*(1.16+.32*(i%3)),size*.77,size*.91);
    scratch.updateMatrix();dirt.setMatrixAt(i,scratch.matrix);
   }
   dirt.instanceMatrix.needsUpdate=true;
  }
  frame(root,0);return add(root,spec.life,frame);
 }
 return {sandCyclone};
}

function createStormFX({T,V,TAU,geo,soft,level,calm,carved,sculpt,mesh,clamp,smooth,surfaceHeight,floorAt,add,sparks}) {
 // The low, scalloped shelf keeps the charge visible from below. Its bevels
 // carry painted light so the software renderer reads the same cloud.
 function stormCloudStone() {
  if (geo.stormCloudStone) return geo.stormCloudStone;
  const cells = [], sides = 8;
  const tiers = [[-.70,.46],[-.43,.87],[-.09,1],[.35,.89],[.60,.55]];
  const palette = [
   ['#373e5b','#474861','#6b596a'], ['#404b6a','#586079','#9a7a83'],
   ['#4d607c','#667792','#a295a0'], ['#6c8198','#8194a5','#a7a1ac']
  ];
  function rim(i, tier) {
   const a = i * TAU / sides + .18, [y, size] = tiers[tier];
   const x = Math.cos(a), z = Math.sin(a);
   const bevel = size * (1 + .055 * Math.sin(3*a+.33*tier));
   return [Math.sign(x) * Math.pow(Math.abs(x),.76) * bevel,
    y + .048 * Math.cos(2*a+.23*tier),
    Math.sign(z) * Math.pow(Math.abs(z),.76) * bevel];
  }
  for (let i=0; i<sides; i++) {
   const a=(i+.5)*TAU/sides+.18, light=Math.cos(a-.65);
   const side=light>.66?2:light>-.23?1:0;
   for (let k=0;k<tiers.length-1;k++) {
    cells.push([[rim(i,k),rim(i+1,k),rim(i+1,k+1),rim(i,k+1)],palette[k][side]]);
   }
   cells.push([[rim(i,0),rim(i+1,0),[.06,-.75,-.02]],side===2?'#64556a':'#353d57']);
   cells.push([[rim(i,4),rim(i+1,4),[-.07,.69,.04]],side===2?'#a6a5a8':'#7e8e9e']);
  }
  geo.stormCloudStone=sculpt(cells);
  return geo.stormCloudStone;
 }

 // A tapered four-sided filament has a solid silhouette even when viewed
 // edge-on. Points are local [x, height, z, thickness].
 function stormConductor(cells, path, colors) {
  const section=(p,k)=>[p[0]+Math.cos(k*Math.PI/2+.28)*p[3],p[1],
   p[2]+Math.sin(k*Math.PI/2+.28)*p[3]];
  for (let i=1;i<path.length;i++) for(let k=0;k<4;k++) {
   cells.push([[section(path[i-1],k),section(path[i-1],k+1),
    section(path[i],k+1),section(path[i],k)],colors[k]]);
  }
 }
 function stormChannels(ordinal, low) {
  const key='stormChannels'+ordinal+(low?'Low':'High');
  if (geo[key]) return geo[key];
  const cells=[], hot=['#fffadc','#ffda80','#ffb146','#fff4b4'],
   far=['#e8dbff','#b9b6ed','#dac7ea','#ffdfa7'];
  const width=[.048,.062,.080][ordinal], skew=[-.09,.03,.12][ordinal];
  const spine=[
   [-.20,1.00,-.10,.53],[-.17,.83,-.025,1],[-.33+skew,.72,.06,.75],
   [-.045,.75,.12,1.13],[-.12,.56,.04,.76],[.095+skew,.59,-.07,1.03],
   [-.065,.34,-.02,.76],[.085,.37,.08,.89],[.010,.17,.025,.67],[0,0,0,.17]
  ].map(([x,y,z,w])=>[x,y,z,w*width]);
  stormConductor(cells,spine,hot);
  const forks=[
   [1,[.08,.76,-.12],[.05,.68,-.17],[.25,.59,-.25],[.33,.47,-.31]],
   [4,[-.27,.52,.24],[-.24,.44,.26],[-.42,.35,.34],[-.46,.23,.40]],
   [6,[.16,.28,-.16],[.14,.22,-.22],[.28,.14,-.28],[.31,.055,-.37]]
  ];
  forks.slice(0,low?2:3).forEach(([join,...knots],k)=>{
   const start=spine[join];
   const path=[[start[0],start[1],start[2],width*.49],
    ...knots.map(([x,y,z],i)=>[x,y,z,width*(.40-i*.12)])];
   stormConductor(cells,path,k===1?hot:far);
   if (!low && k!==2) {
    const p=path[2],side=k===0?-1:1;
    stormConductor(cells,[[p[0],p[1],p[2],width*.18],
     [p[0]+.09*side,p[1]-.035,p[2]-.075,width*.13],
     [p[0]+.14*side,p[1]-.105,p[2]-.10,.0008]],far);
   }
  });
  geo[key]=sculpt(cells);
  return geo[key];
 }

 // Lay a ribbon directly over every bend of the terrain. Scars branch outward
 // and the interrupted rim sits on the damage radius.
 function stormGroundTrace(center,radius,ordinal) {
  const low=soft||level()===2, cells=[], count=low?7:11;
  function point(a,r) {
   const x=radius*r*Math.cos(a), z=radius*r*Math.sin(a);
   return [x,surfaceHeight(center.x+x,center.z+z)-center.y+.070,z];
  }
  function ribbon(path,tint) {
   for(let i=1;i<path.length;i++){
    const [a,r,w]=path[i-1],[b,s,v]=path[i];
    cells.push([[point(a-w,r),point(a+w,r),point(b+v,s),point(b-v,s)],tint]);
   }
  }
  for(let j=0;j<count;j++){
   const a=(j+.19*Math.sin(j*7.2)+ordinal*.43)*TAU/count, sign=j%2?1:-1;
   const reach=j%3===1?.80:.97, knee=a+.10*sign;
   ribbon([[a,.04,.13],[knee,.29,.047],[a-.055*sign,.50,.021],
    [a+.057*sign,.61,.017],[a-.034*sign,reach,.003]],j%3?'#e7bb76':'#fff0b0');
   if (!low || j%2===0) ribbon([[knee,.29,.035],[a+sign*.32,.44,.016],
    [a+sign*.34,.67,.002]],'#be95ba');
   for(let k=0;k<2;k++){
    const b=a+.095*k;
    cells.push([[point(b,.968),point(b,1),point(b+.095,1),point(b+.095,.968)],
     k?'#a9a0bb':'#f0ca86']);
   }
  }
  const g=sculpt(cells);g.userData.ephemeralFX=true;
  return g;
 }

 function stormCanopy(center,spec) {
  const root=new T.Group();root.position.copy(floorAt(center));
  const low=soft||level()===2, tier=low?2:level(), shelf=new T.Group();
  root.add(shelf);
  // Crosswise offsets and uneven shoulders give the upper shelf a windward
  // tower and the downwind side a long, thin anvil.
  const layout=[
   [-.44,.00,-.12,.53,.28,.49],[-.12,-.13,.23,.53,.34,.52],
   [.28,.02,.10,.54,.28,.51],[.61,.065,-.08,.47,.18,.47],
   [-.23,.27,-.12,.45,.38,.42],[.04,.23,-.15,.49,.28,.43],
   [-.63,.12,.16,.28,.25,.30],[.34,-.07,.32,.29,.23,.30],
   [.79,.10,-.12,.27,.11,.28]
  ];
  const cloud=stormCloudStone(), stones=[];
  layout.slice(0,tier===2?6:tier===1?8:9).forEach(([x,y,z,w,h,d],i)=>{
   const n=carved(cloud);n.rotation.y=i*.69;shelf.add(n);
   stones.push({n,x,y,z,w,h,d});
  });
  const radius=spec.radius, height=spec.height, life=spec.life, strikes=spec.strikes||[];
  const charges=strikes.map(({point,at})=>{
   const cell=new T.Group(),rel=point.clone().sub(root.position);
   cell.position.set(rel.x,0,rel.z);root.add(cell);
   const bead=mesh(geo.orb,'#ffe2a0',.73);cell.add(bead);
   const channel=carved(stormChannels(0,true),.76);
   cell.add(channel);
   return {cell,bead,channel,at};
  });
  function frame(o,t) {
   const elapsed=t*life, assemble=smooth(elapsed/.19), depart=smooth((t-.74)/.26);
   const opacity=assemble*(1-depart);
   shelf.position.set(radius*.10*depart,height+.32*depart,radius*.06*depart);
   shelf.rotation.y=-.18+.19*t;
   stones.forEach(({n,x,y,z,w,h,d},i)=>{
    const drift=.019*Math.sin(t*5+i*1.7);
    n.position.set(radius*(x*(.75+.25*assemble)+drift),radius*(y+.025*Math.sin(t*7+i)),radius*z);
    n.scale.set(radius*w*(.66+.34*assemble),radius*h*(1+.10*Math.sin(t*6+i)),radius*d);
    n.material.opacity=.93*opacity;
   });
   charges.forEach(({cell,bead,channel,at},i)=>{
    const rise=smooth((elapsed-at+.265)/.25), settle=1-smooth((elapsed-at)/.17);
    const amount=rise*settle*opacity, luminous=calm()?.56:.91;
    cell.visible=amount>.008;
    cell.position.y=height-radius*(.12+.05*Math.cos(i));
    cell.rotation.y=.72 + i*2.10;
    bead.position.y=-.07*radius;
    bead.scale.set(radius*(.065+.10*amount),radius*(.036+.035*amount),radius*(.09+.08*amount));
    bead.material.opacity=luminous*amount;
    channel.position.y=-radius*(.035+.13*amount);
    channel.scale.set(radius*(.64+.38*rise),radius*(.16+.18*rise),radius*(.66+.32*rise));
    channel.material.opacity=luminous*amount;
   });
  }
  frame(root,0);return add(root,life,frame);
 }

 function stormStrike(center,radius,height,ordinal) {
  const index=clamp(ordinal|0,0,2), root=new T.Group();
  root.position.copy(floorAt(center));
  const low=soft||level()===2, path=stormChannels(index,low);
  const main=carved(path), echo=mesh(path,'#d3b4ee',.35);
  root.add(echo,main);
  const rotation=[.52,2.59,4.67][index];
  main.rotation.y=rotation;
  main.scale.set(radius,height,radius);
  const scar=carved(stormGroundTrace(root.position,radius,index));
  root.add(scar);
  const foot=mesh(geo.orb,'#ffe7a2');root.add(foot);
  foot.position.y=.15;
  if(!calm())sparks(root.position.clone().add(V(0,.16,0)),'#ffda80',low?4:8,
   2.8+index*.40,{gravity:7.4,life:.36,size:.042,stretch:2.0});
  function frame(o,t){
   const quiet=calm(), hot=1-smooth((t-.10)/.57);
   main.visible=hot>.005;
   main.material.opacity=hot*(quiet?.67:1);
   const field=smooth(t/.20)*(1-smooth((t-.22)/.67));
   echo.scale.set(radius*(1+.20*t),height,radius*(1+.20*t));
   echo.rotation.y=rotation+.05+.29*t;
   echo.material.opacity=(quiet?.16:.38)*field;
   scar.material.opacity=(quiet?.61:.95)*(1-smooth((t-.22)/.73));
   const charge=1-smooth(t/.50), size=radius*(.050+.10*charge);
   foot.scale.set(size,size*(.65+charge*.36),size);foot.material.opacity=charge*(quiet?.44:.91);
  }
  frame(root,0);return add(root,.40+.045*index,frame);
 }
 return {stormCanopy,stormStrike};
}

/* FRUTO — authored elemental effects. Shared geometry, bounded lifetimes, no network assets. */
function createFruitFX({T,scene,V,mobile,soft,emit,now,shake,calm=()=>false,ground:surfaceHeight=()=>0,level=()=>soft?2:mobile?1:0}) {
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=t=>1-Math.pow(1-clamp(t),3),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 const TAU=Math.PI*2,items=[],cap=soft?44:mobile?64:100;
 const geo={cube:new T.BoxGeometry(1,1,1),ice:new T.ConeGeometry(1,1,4),flame:new T.ConeGeometry(1,1,5),orb:new T.IcosahedronGeometry(1,soft?0:1),band:new T.RingGeometry(.94,1,soft?14:mobile?24:36),disk:new T.CircleGeometry(1,soft?12:24)};
 geo.arc=new T.RingGeometry(.90,1,soft?10:20,1,.18,Math.PI*1.50);
 // One tapered ribbon has a continuous silhouette at any view angle.
 function filament(turns,inward){
  const xyz=[],rgb=[],ix=[],segments=soft?23:36;
  for(let i=0;i<=segments;i++){const t=i/segments,a=t*TAU*turns,r=inward?1-t*.87:.67*(1-t*.65),y=inward?.04+t*t*.77:t;
   const width=(.012+.095*Math.sin(Math.PI*t))*(inward?1:.8);
   for(const side of [-1,1]){xyz.push(Math.cos(a)*(r+width*side),y+width*side*.42,Math.sin(a)*(r+width*side));const v=.47+.53*(1-t);rgb.push(v,v,v);}
   if(i<segments){const n=i*2;ix.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 geo.inflow=filament(1.12,true);geo.flare=filament(.84,false);
 const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=64;const tc=texCanvas.getContext('2d'),gradient=tc.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#ffffffff');gradient.addColorStop(.18,'#ffffffbf');gradient.addColorStop(.5,'#ffffff32');gradient.addColorStop(1,'#ffffff00');tc.fillStyle=gradient;tc.fillRect(0,0,64,64);const glowTexture=new T.CanvasTexture(texCanvas);
 const pools={flat:[],lit:[],glow:[]};let activeOwner=null;
 function material(c,a=1,lit=false){const key=lit?'lit':'flat',m=pools[key].pop()||(lit?new T.MeshStandardMaterial({roughness:.48,metalness:.12}):new T.MeshBasicMaterial());
  m.userData.fxPool=key;m.vertexColors=false;m.color.set(c);m.transparent=true;m.opacity=a;m.depthWrite=false;m.side=T.DoubleSide;
  if(lit){m.emissive.set(c);m.emissiveIntensity=.18;}return m;
 }
 function withOwner(token,fn){const before=activeOwner;activeOwner=token;try{return fn();}finally{activeOwner=before;}}
 function cancelOwner(token){for(let i=items.length-1;i>=0;i--)if(items[i].owner===token){dispose(items[i].root);items.splice(i,1);}}
 function mesh(g,c,a=1,lit=false){return new T.Mesh(g,material(c,a,lit));}
 function block(parent,pos,scale,c,a=1){const m=mesh(geo.cube,c,a);m.position.copy(pos);m.scale.set(...scale);parent.add(m);return m;}
 function sprite(c,size=1,a=.6){const mat=pools.glow.pop()||new T.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:T.AdditiveBlending});mat.userData.fxPool='glow';mat.color.set(c);mat.opacity=a;const m=new T.Sprite(mat);m.scale.setScalar(size);return m;}
 function dispose(root){
  root.removeFromParent();const seen=new Set();
  root.traverse(o=>{
   if(o.isInstancedMesh)o.dispose();
   if(o.geometry?.userData.ephemeralFX&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}
   const mat=o.material;if(!mat||seen.has(mat))return;seen.add(mat);
   const pool=pools[mat.userData.fxPool];if(pool&&pool.length<(soft?40:80))pool.push(mat);else mat.dispose();
  });
 }
 function add(root,life,update){while(items.length>=cap){dispose(items[0].root);items.shift();}scene.add(root);items.push({root,life,age:0,update,owner:activeOwner});return root;}
 function fade(root,a){root.traverse(o=>{if(o.material){o.userData.baseAlpha??=o.material.opacity;o.material.opacity=o.userData.baseAlpha*a;}});}
 function beam(parent,a,b,c,width=.05,opacity=.9){const d=b.clone().sub(a),m=mesh(geo.cube,c,opacity);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(width,d.length(),width);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());parent.add(m);return m;}
 function flash(pos,c,size=2,life=.4){const alpha=calm()?.18:.53;const m=sprite(c,size,alpha);m.position.copy(pos);return add(m,life,(o,t)=>{o.scale.setScalar(size*(.65+.7*ease(t)));o.material.opacity=alpha*Math.pow(1-t,2);});}
 function floorAt(p,offset=.042){return p.clone().setY(surfaceHeight(p.x,p.z)+offset);}
 function normalAt(p){const d=.12;return V((surfaceHeight(p.x-d,p.z)-surfaceHeight(p.x+d,p.z))/(2*d),1,(surfaceHeight(p.x,p.z-d)-surfaceHeight(p.x,p.z+d))/(2*d)).normalize();}
 function pulse(pos,c,r=2,life=.65,vertical=false){const root=new T.Group();root.position.copy(pos);if(!vertical&&pos.y<surfaceHeight(pos.x,pos.z)+.24){root.position.copy(floorAt(pos,.066));root.quaternion.setFromUnitVectors(V(0,1,0),normalAt(pos));}for(let i=0;i<2;i++){const m=mesh(geo.band,i===0?'#fff3da':c,i===0?.7:.5);if(!vertical)m.rotation.x=-Math.PI/2;root.add(m);}return add(root,life,(o,t)=>{o.children.forEach((m,i)=>{const x=clamp(t-i*.11),s=.12+ease(x)*r;m.scale.set(s,s,s);m.material.opacity=(i?.48:.7)*Math.pow(1-x,1.5);});});}
 function sparks(pos,c,count=15,speed=3,options={}){emit(pos,c,level()===2?Math.min(count,9):level()===1?Math.min(count,17):count,speed,{life:.7,size:.045,gravity:2,...options});}
 function cracks(pos,c,r=2,life=1){const root=new T.Group();root.position.copy(floorAt(pos,.055));for(let i=0;i<7;i++){const a=i*TAU/7+.17,p0=V(),p1=V(Math.cos(a)*r*.4,.002,Math.sin(a)*r*.4),p2=V(Math.cos(a+.15)*r,.002,Math.sin(a+.15)*r);for(const point of [p1,p2])point.y=surfaceHeight(pos.x+point.x,pos.z+point.z)-surfaceHeight(pos.x,pos.z);beam(root,p0,p1,c,.022,.7);beam(root,p1,p2,c,.015,.65);}return add(root,life,(o,t)=>{o.scale.setScalar(.25+.75*ease(t));fade(o,1-t);});}
 function impact(pos,c,r=2,life=.6){
  const root=new T.Group();root.position.copy(pos);const n=level()===2?2:3;
  for(let i=0;i<n;i++){const arc=mesh(geo.arc,i%2?'#ffb87f':'#fff2dc',calm()?.38:.62);root.add(arc);}
  add(root,life*.72,(o,t)=>o.children.forEach((m,i)=>{m.rotation.set(-Math.PI/2+i*.31,0,i*2.4+.27*t);m.position.y=.12+.11*Math.sin(t*Math.PI);m.scale.setScalar(r*(.18+.80*ease(t))*(.84+i*.07));m.material.opacity=(calm()?.32:.54)*(1-t);}));
  flash(pos.clone().add(V(0,.5,0)),c,r*1.25,.35);pulse(pos,c,r,life);cracks(pos,c,r*.8,life+ .4);sparks(pos.clone().add(V(0,.3,0)),'#fff2d5',18,4,{stretch:2});shake(.07,.18);}
 function lightning(a,b,c='#ffe49c',life=.32){
  const root=new T.Group(),line=b.clone().sub(a),axis=line.clone().normalize(),reference=Math.abs(axis.y)>.8?V(1,0,0):V(0,1,0);
  const side=V().crossVectors(axis,reference).normalize(),other=V().crossVectors(axis,side).normalize(),length=line.length(),n=soft?7:10,points=[a.clone()];
  const span=clamp(length*.14,.15,.70);
  for(let i=1;i<n;i++){const t=i/n,p=a.clone().lerp(b,t),amp=span*Math.sin(t*Math.PI);
   p.addScaledVector(side,(Math.random()-.5)*amp*1.7).addScaledVector(other,(Math.random()-.5)*amp*1.4);points.push(p);}
  points.push(b.clone());
  for(let i=1;i<points.length;i++){
   const w=.032+.018*(1-i/n);beam(root,points[i-1],points[i],c,w*2.9,.38);beam(root,points[i-1],points[i],'#fff9ce',w,.98);
   if(i%3===1&&length>.55){const mid=points[i].clone().addScaledVector(side,(i%2?1:-1)*span*.85).addScaledVector(axis,span*.31);
    const tip=mid.clone().addScaledVector(other,span*.58).addScaledVector(axis,span*.65);beam(root,points[i],mid,c,.042,.78);beam(root,mid,tip,'#fff3ba',.020,.76);
    if(i===4&&level()!==2){const twig=mid.clone().addScaledVector(other,-span*.66).addScaledVector(axis,span*.43);beam(root,mid,twig,'#f7c662',.029,.62);}}
  }
  flash(b,c,1.65,.26);sparks(b,c,10,2.5,{gravity:0,stretch:3});
  return add(root,life,(o,t)=>fade(o,(1-t)*(calm()?.54:.82+.18*Math.cos(t*9))));
 }
 function buildFire(r=1,height=1.6,c='#ff8b37'){
  const root=new T.Group(),nodes=[];const base=mesh(geo.disk,'#eb5629',.18);base.rotation.x=-Math.PI/2;base.position.y=.085;base.scale.setScalar(r);root.add(base);
  const glow=sprite('#ffae50',r*2.5,.45);glow.position.y=.4;root.add(glow);
  for(let i=0;i<(soft?5:8);i++){const a=i*2.39996,rad=Math.sqrt((i+.2)/8)*r*.8;const outer=mesh(geo.flame,c,.72),inner=mesh(geo.flame,'#fff0b0',.85);const g=new T.Group();g.position.set(Math.cos(a)*rad,0,Math.sin(a)*rad);g.rotation.y=a;g.add(outer,inner);root.add(g);nodes.push({g,outer,inner,i});}
  const curls=[];for(let i=0;i<(height>2?3:1);i++){const m=mesh(geo.flare,i%2?'#ffdc71':'#ff8a3d',.70);m.material.vertexColors=true;root.add(m);curls.push(m);}
  let emission=0;root.userData.animate=(t,dt)=>{const growth=smooth(t/.1),end=clamp((1-t)/.25),age=now();for(const n of nodes){const h=height*(.6+.4*Math.sin(age*(5+n.i*.2)+n.i))*growth*end,w=r*(.20+.07*Math.sin(n.i));n.outer.scale.set(w,Math.max(.01,h),w);n.outer.position.y=h/2;n.outer.rotation.z=Math.sin(age*6+n.i)*.12;n.inner.scale.set(w*.48,h*.62,w*.48);n.inner.position.y=h*.31;n.g.position.y=.04;}curls.forEach((m,i)=>{const k=growth*end;m.rotation.y=i*2.1+age*(1.7+i*.23);m.scale.set(r*.97*k,height*(.85+.09*Math.sin(age*3+i))*k,r*.97*k);m.material.opacity=.65*k;});
  glow.material.opacity=.35*growth*end;base.material.opacity=.2*growth*end;emission+=dt;if(emission>.11){emission=0;const p=root.getWorldPosition(V()).add(V((Math.random()-.5)*r,.35,(Math.random()-.5)*r));sparks(p,'#ffc25f',2,1.5,{gravity:-.6,life:.9,size:.035});
   if(height>2&&level()!==2)sparks(p,'#f87644',2,2.2,{gravity:-.9,life:.59,size:.043,stretch:2.3});}};
  return root;
 }
 function fire(pos,r=1,height=1.8,life=1.2,c='#ff8b37'){const g=buildFire(r,height,c);g.position.copy(pos);return add(g,life,(o,t,dt)=>o.userData.animate(t,dt));}
 function ice(pos,h=2,life=1.4,spread=.7,count=3){const root=new T.Group();root.position.copy(pos);const nodes=[];for(let i=0;i<count;i++){const g=new T.Group(),a=i*2.3999,rad=i===0?0:spread*.55;g.position.set(Math.cos(a)*rad,0,Math.sin(a)*rad);g.rotation.z=(i-(count-1)/2)*.15;g.rotation.y=a;const m=mesh(geo.ice,i%2?'#b9f3ff':'#73bedf',.74,true),core=mesh(geo.ice,'#edffff',.6);const ridge=mesh(geo.ice,'#f0ffff',calm()?.42:.79);g.add(m,core,ridge);root.add(g);nodes.push({g,m,core,ridge,height:h*(i===0?1:.6+Math.random()*.35)});}pulse(pos,'#b6efff',spread+ .45,.55);return add(root,life,(o,t)=>{const k=ease(t/.17)*clamp((1-t)/.18);for(const n of nodes){n.m.scale.set(.28,n.height*k,.28);n.m.position.y=n.height*k/2;n.core.scale.set(.10,n.height*k*.8,.10);n.core.position.y=n.height*k*.4;const h=n.height*k;n.ridge.position.set(.075*k,h*.66,.055*k);n.ridge.scale.set(.025,h*.45,.03);n.ridge.rotation.z=-.10;}fade(o,clamp((1-t)/.2));});}
 function snow(pos,r=3,count=22){sparks(pos.clone().add(V(0,2,0)),'#d7fbff',count,2.5,{gravity:-.25,life:1.3,size:.04,spread:r});}
 // Three tapered ribbons curve through the same volume as the claw contact.
 function clawRibbon(){
  const xyz=[],ix=[],steps=soft?7:13;
  for(let i=0;i<=steps;i++){
   const t=i/steps,width=.009+.067*Math.sin(Math.PI*t),x=.42*Math.sin(t*Math.PI)-.17*t,y=.48*Math.sin(t*Math.PI)-.31*t;
   xyz.push(x-width,y-width*.40,t,x+width,y+width*.40,t);
   if(i<steps){const n=i*2;ix.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 const talonGeo=clawRibbon();
 function talons(from,to,side=1,fang=false){
  const delta=to.clone().sub(from),len=Math.max(.15,delta.length()),root=new T.Group();root.position.copy(from);
  root.quaternion.setFromUnitVectors(V(0,0,1),delta.normalize());
  const count=fang?2:3;
  for(let i=0;i<count;i++){const blade=mesh(talonGeo,i===1?'#ffc47c':'#d8edff',calm()?.53:.89);
   blade.position.set((i-(count-1)/2)*.14,(i-(count-1)/2)*.085,0);
   blade.scale.set(side*(fang?.52:1),fang?(i===0?-.9:.9):1,len);root.add(blade);}
  if(!fang&&len>.64){const edge=from.clone().lerp(to,.82);sparks(edge,'#eed6a7',level()===2?2:4,1.27,{gravity:1.1,size:.025,life:.23,stretch:2});}
  return add(root,fang?.23:.31,(o,t)=>{const k=smooth(t/.38);o.scale.z=.13+.87*k;fade(o,clamp((1-t)/.57));});
 }
 function wolfChange(pos,height=3){
  const root=new T.Group();root.position.copy(pos);
  for(let i=0;i<3;i++){const strand=mesh(geo.flare,i===1?'#f6bc72':'#c7dcec',calm()?.4:.7);strand.rotation.y=i*TAU/3;root.add(strand);}
  pulse(pos,'#b6d4e6',1.65,.50);sparks(pos.clone().add(V(0,height*.40,0)),'#dfc69b',soft?6:13,2.1,{gravity:-.6,life:.50});
  return add(root,.56,(o,t)=>{const k=ease(t);o.scale.set(1.43-.39*k,.15+height*k,1.43-.39*k);o.rotation.y=k*1.7;o.position.y=pos.y+t*.31;fade(o,clamp((1-t)/.57));});
 }
 function buildVortex(r=2,c='#bba2ed'){
  const root=new T.Group(),floor=mesh(geo.disk,'#100f26',.55);floor.rotation.x=-Math.PI/2;floor.position.y=.095;floor.scale.setScalar(r);root.add(floor);
  const core=mesh(geo.orb,'#100d21',.92),halo=sprite(c,2.6,.5);core.position.y=.9;core.scale.setScalar(.43);halo.position.y=.9;root.add(core,halo);const bands=[];
  for(let i=0;i<3;i++){const m=mesh(geo.band,i===0?'#e5d9ff':c,.55);m.position.y=.7+i*.19;m.rotation.x=-Math.PI/2+(i-1)*.3;root.add(m);bands.push(m);}
  const streams=[];for(let i=0;i<(soft?2:3);i++){const m=mesh(geo.inflow,i%2?'#9870ce':'#ddadff',.72);m.material.vertexColors=true;root.add(m);streams.push(m);}
  const crown=mesh(geo.arc,'#e6c7ff',.82);crown.position.y=.95;root.add(crown);
  const lens=mesh(geo.arc,'#7566a2',.57);root.add(lens);
  const motes=[];for(let i=0;i<(soft?7:13);i++){const m=block(root,V(),[.09,.13,.08],i%3===0?'#eee5ff':c,.8);motes.push(m);}
  root.userData.animate=(t,dt)=>{const age=now(),growth=ease(t/.12)*clamp((1-t)/.15);floor.scale.setScalar(r*growth);floor.material.opacity=.44*growth;
  streams.forEach((m,i)=>{m.scale.set(r*growth,Math.max(1.1,r*.73)*growth,r*growth);m.rotation.y=age*.90+i*TAU/streams.length;m.material.opacity=(i?.50:.73)*growth;});
  lens.rotation.set(-.57,age*.9,.32-age*.85);lens.position.y=.88;lens.scale.set(r*.56*growth,r*.17*growth,1);lens.material.opacity=.49*growth;
  crown.scale.setScalar((.63+.05*Math.sin(age*3))*growth);crown.rotation.set(.32,age*.73,-.4+age*.71);core.scale.setScalar((.39+.06*Math.sin(age*4))*growth);core.rotation.y=age*.8;halo.material.opacity=.4*growth;bands.forEach((m,i)=>{m.scale.setScalar((.75+i*.23)*growth);m.rotation.z=age*(i%2?1:-1)*1.1;m.material.opacity=.55*growth;});motes.forEach((m,i)=>{const q=(age*.45+i/motes.length)%1,a=age*1.7+i*2.4,rad=(.3+r*(1-q))*growth;m.position.set(Math.cos(a)*rad,.15+q*1.8,Math.sin(a)*rad);m.rotation.set(a,0,a*.4);});};return root;
 }
 function vortex(pos,r=2,life=2,c='#bba2ed'){const root=buildVortex(r,c);root.position.copy(pos);return add(root,life,(o,t,dt)=>o.userData.animate(t,dt));}
 function portal(pos,c,r=1.1,life=.65,yaw=0){const root=new T.Group();root.position.copy(pos).add(V(0,1.2,0));root.rotation.y=yaw;const disk=mesh(geo.disk,'#171025',.55),band=mesh(geo.band,c,.9);root.add(disk,band);for(let i=0;i<8;i++){const a=i*TAU/8;const m=block(root,V(Math.cos(a),Math.sin(a),.02),[.09,.15,.06],'#e9d7ff',.8);m.rotation.z=a;}flash(root.position,c,r*2,.5);return add(root,life,(o,t)=>{const s=Math.sin(Math.PI*t)*r;o.scale.setScalar(Math.max(.01,s));o.rotation.z=t*.6;fade(o,clamp((1-t)/.2));});}
 function ghost(body,c,life=.45){const root=new T.Group(),shared=material(c,.22);body.root.updateMatrixWorld(true);for(const obj of Object.values(body.meshes)){const m=new T.Mesh(obj.geometry,shared);obj.updateWorldMatrix(true,false);obj.matrixWorld.decompose(m.position,m.quaternion,m.scale);root.add(m);}return add(root,life,(o,t)=>shared.opacity=.22*Math.pow(1-t,2));}
 // Shared faceted surfaces supply the same silhouettes in WebGL and the Canvas renderer.
 function sculpt(cells){
  const pos=[],rgb=[],ix=[],quads=[];
  for(const [points,tint] of cells){
   const col=new T.Color(tint),start=pos.length/3;
   for(const p of points){pos.push(...p);rgb.push(col.r,col.g,col.b);}
   const face=points.map((_,i)=>start+i);quads.push(face);for(let i=1;i<face.length-1;i++)ix.push(face[0],face[i],face[i+1]);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();g.userData.polygons=quads;return g;
 }
 function strip(steps,edge,palette){
  const cells=[];for(let i=0;i<steps;i++){const a=i/steps,b=(i+1)/steps;cells.push([[edge(a,-1),edge(a,1),edge(b,1),edge(b,-1)],palette(i,a)]);}return sculpt(cells);
 }
 function carved(g,a=1){const m=mesh(g,'#ffffff',a);m.material.vertexColors=true;return m;}
 function horizontalDir(dir){
  const v=dir.clone().setY(0);return v.lengthSq()>1e-9?v.normalize():V(0,0,1);
 }
 function oriented(g,dir){const n=dir.lengthSq()>1e-9?dir.clone().normalize():V(0,0,1);g.quaternion.setFromUnitVectors(V(0,0,1),n);}
 const curlProfile=[[0,-.38],[.24,-.24],[.75,-.10],[1.04,.08],[1.09,.25],[.93,.38],[.72,.35]];
 function waveHull(){
  const cells=[],steps=soft?12:20,colors=['#186d86','#14899a','#23a6b2','#59c8c2','#acebe0','#f2fff3'];
  const point=(i,j)=>{const f=i/steps,s=2*f-1,p=curlProfile[j],peak=.72+.28*Math.cos(s*Math.PI*.5);return [s*.5,p[0]*peak*(1+.07*Math.sin(f*Math.PI*3)),p[1]-.32*s*s];};
  for(let i=0;i<steps;i++)for(let j=0;j<colors.length;j++)cells.push([[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],colors[j]]);
  return sculpt(cells);
 }
 geo.breaker=waveHull();
 geo.foam=strip(soft?20:30,(t,e)=>{const a=t*TAU*1.25,r=.98-.72*t+e*.026*Math.sin(Math.PI*t);return [Math.cos(a)*r,.065+.08*t+e*.007,Math.sin(a)*r];},i=>i%4?'#a5efe3':'#e9fff1');
 function shardShape(){
  const cells=[],col=['#9764a6','#eaa1c7','#f9d4e8','#b074ba','#d68fbd','#ffdcbc'],n=6;
  const ring=(i,r,y)=>[Math.sin(i/n*TAU)*r,y,Math.cos(i/n*TAU)*r];
  for(let i=0;i<n;i++){const j=i+1;cells.push([[ring(i,.18,0),ring(j,.18,0),ring(j,.27,.61),ring(i,.27,.61)],col[i]]);
   cells.push([[ring(i,.27,.61),ring(j,.27,.61),[.075,1.0,.045]],col[(i+2)%n]]);
   if(i===2||i===4)cells.push([[ring(i,.273,.62),[.067,.976,.04],ring(i+.10,.271,.62)],'#fff4e4']);}
  return sculpt(cells);
 }
 geo.quartz=shardShape();
 function plume(){
  const cells=[],colors=['#62768c','#bd895f','#d7ad71','#f1dba3','#3b4a62'];
  const point=(i,side)=>{const t=i/6,b=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.67);
   return [(-.075*t*t)+side*b*(side<0?.16:.105),side===0?.024*b:.002*b,t-.44];};
  for(let i=0;i<6;i++){for(const s of [-1,1])cells.push([[point(i,0),point(i,s),point(i+1,s),point(i+1,0)],(i===0||i===4)?colors[0]:s===1?colors[i===3?3:2]:colors[i===2?4:1]]);}
  cells.push([[[0,.032,-.53],[.022,.031,-.53],[-.067,.018,.50],[-.079,.018,.50]],'#f7e5b7']);return sculpt(cells);
 }
 geo.plume=plume();
 geo.dustCurl=strip(soft?16:24,(t,e)=>{const a=t*TAU*1.1,r=.51+.45*t,w=(.007+.07*Math.sin(Math.PI*t))*e;return [Math.cos(a)*(r+w*.3),.08+.78*t+w,Math.sin(a)*(r+w*.3)];},i=>['#dfae69','#e8bd7c','#efcf97','#c49057'][Math.floor(i/3)%4]);
 geo.flux=strip(soft?11:19,(t,e)=>{const lift=Math.sin(Math.PI*t);return [.62*lift,.105*Math.sin(TAU*t)+e*(.012+.031*lift),t];},(i,t)=>t<.43?'#f28b76':t<.62?'#eee9d0':'#86ccdc');
 const soundInk={lime:'#a9ef6f',mint:'#d1ffcc',jade:'#4ac58d',shadow:'#246e60'};
 const steelInk={blue:'#5b87f5',edge:'#afccff',shade:'#304d86',dark:'#192e57',brass:'#f5bb64'};
 // A beamed pair of eighth notes, with thickness so it reads from the side.
 function noteGeometry(){
  const cells=[];
  function plate(loop,front,side){
   const face=depth=>loop.map(([x,y])=>[x,y,depth]);
   const a=face(-.085),b=face(.085);cells.push([a.slice().reverse(),side],[b,front]);
   for(let i=0;i<loop.length;i++){const j=(i+1)%loop.length;cells.push([[a[i],a[j],b[j],b[i]],side]);}
  }
  for(const [x,y] of [[-.37,-.29],[.30,-.16]]){
   plate([[x-.20,y-.09],[x-.12,y-.20],[x+.08,y-.17],[x+.17,y-.05],[x+.13,y+.07],[x-.08,y+.07]],soundInk.lime,soundInk.shadow);
   plate([[x+.075,y-.04],[x+.17,y-.04],[x+.17,y+.67],[x+.075,y+.67]],soundInk.mint,soundInk.jade);
  }
  plate([[-.295,.23],[.47,.38],[.47,.52],[-.295,.37]],soundInk.lime,soundInk.shadow);
  return sculpt(cells);
 }
 geo.echoNote=noteGeometry();
 geo.echoLine=strip(soft?18:32,(t,e)=>{
  const envelope=Math.sin(Math.PI*t),wave=Math.sin(t*TAU*2)*envelope;
  return [t*2-1,.51*wave+( .021+.022*envelope)*e,.13*envelope];
 },(i,t)=>t<.14||t>.86?soundInk.jade:i%3?soundInk.lime:soundInk.mint);
 // Closed piston head, wider than it is long, with a bevel and a transverse brass key.
 function pistonGeometry(){
  const corners=[[-.54,-.20],[-.42,-.33],[.42,-.33],[.54,-.20],[.54,.20],[.42,.33],[-.42,.33],[-.54,.20]];
  const sections=[[-.48,.71],[-.35,.92],[.13,1],[.29,.83]],cells=[];
  const point=(ring,i)=>[corners[i][0]*ring[1],corners[i][1]*ring[1],ring[0]];
  const sideColors=[steelInk.dark,steelInk.shade,steelInk.blue,steelInk.shade,steelInk.blue,steelInk.edge,steelInk.blue,steelInk.shade];
  for(let j=1;j<sections.length;j++)for(let i=0;i<8;i++){
   const k=(i+1)%8,a=sections[j-1],b=sections[j];
   cells.push([[point(a,i),point(a,k),point(b,k),point(b,i)],j===3?(i===5?steelInk.edge:steelInk.blue):sideColors[i]]);
  }
  cells.push([corners.map((_,i)=>point(sections[0],i)).reverse(),steelInk.dark],[corners.map((_,i)=>point(sections[3],i)),steelInk.shade]);
  for(const x of [-.26,.26])cells.push([[[x-.042,-.19,.297],[x+.042,-.19,.297],[x+.042,.19,.297],[x-.042,.19,.297]],steelInk.brass]);
  return sculpt(cells);
 }
 geo.piston=pistonGeometry();
 const accents={mare:'#a8f1dd',cristal:'#ffcbdf',eco:soundInk.mint,falcao:'#efd7a4',duna:'#e9cb86',ima:'#83d2df'};
 const shapes={mare:geo.inflow,cristal:geo.quartz,eco:geo.echoNote,falcao:geo.plume,duna:geo.dustCurl,ima:geo.arc};
 function wave(pos,dir,length=5,width=2.7,life=.52){
  const heading=horizontalDir(dir),base=pos.clone(),root=new T.Group();root.position.copy(base);root.rotation.y=Math.atan2(heading.x,heading.z);
  const body=carved(geo.breaker,calm()?.74:.90);root.add(body);
  const crest=[],n=level()===2?4:8;for(let i=0;i<n;i++){const m=mesh(geo.orb,i%2?'#a1e5db':'#edfff1',.78);root.add(m);crest.push(m);}
  const height=clamp(width*.46,.76,2.25);
  function frame(o,t){const up=.26+.74*smooth(t/.20),end=1-.55*smooth((t-.77)/.23);
   o.position.copy(base).addScaledVector(heading,length*t);o.position.y=surfaceHeight(o.position.x,o.position.z)+.04;body.scale.set(width,height*up*end,.82+height*.19);
   crest.forEach((m,i)=>{const x=(i+.5)/n-.5,phase=(t*2+i*.381)%1,drift=Math.sin(Math.PI*phase);m.position.set(width*x,height*up*end*(.89+.10*Math.cos(2*x*Math.PI))+.42*drift,.23-.8*x*x+.39*phase);m.scale.set(.10+.11*drift,.077+.059*drift,.09);});
   fade(o,clamp((1-t)/.15));
  }
  frame(root,0);return add(root,life,frame);
 }
 function whirlpool(pos,r=2.7,life=1.9){
  const root=new T.Group();root.position.copy(pos);const bed=mesh(geo.disk,'#1c7785',.27);bed.rotation.x=-Math.PI/2;bed.position.y=.06;root.add(bed);
  const curls=[];for(let i=0;i<(soft?2:3);i++){const m=carved(geo.foam,.84);root.add(m);curls.push(m);}
  const center=mesh(geo.band,'#8bd7cf',.68);center.rotation.x=-Math.PI/2;center.position.y=.115;root.add(center);
  function frame(o,t){const grow=.15+.85*smooth(t/.13),out=1-.85*smooth((t-.84)/.16);bed.scale.setScalar(r*grow*out);
   curls.forEach((m,i)=>{m.rotation.y=t*life*2.5+i*TAU/curls.length;m.scale.set(r*grow*out,1+.8*Math.sin(Math.PI*t),r*grow*out);});center.scale.setScalar(r*(.17+.04*Math.sin(t*life*6))*grow);fade(o,clamp((1-t)/.15));}
  frame(root,0);return add(root,life,frame);
 }
 function prism(pos,height=1.65,life=.85){
  const root=new T.Group();root.position.copy(pos);const n=level()===2?3:5,shards=[];
  for(let i=0;i<n;i++){const m=carved(geo.quartz,.93);root.add(m);shards.push(m);}
  function frame(o,t){const growth=.035+.965*ease(t/.32),burst=smooth((t-.72)/.28);
   shards.forEach((m,i)=>{const a=i*2.4,h=i===0?height:height*(.43+.08*(i%4)),s=i===0?0:.17;
    m.position.set(Math.cos(a)*(s+.36*burst)*height,burst*(.14+.23*Math.sin(Math.PI*burst))*height,Math.sin(a)*(s+.36*burst)*height);
    m.rotation.set(Math.cos(a)*(i===0?.06:.25+burst*.47),a+burst*.57,-Math.sin(a)*(i===0?.06:.26+burst*.41));
    m.scale.set(h*.69*growth,h*growth*(1-.49*burst),h*.69*growth);});
   fade(o,clamp((1-t)/.17));}
  frame(root,0);return add(root,life,frame);
 }
 function soundRingOnTerrain(pos,r,ink){
  const steps=level()===2?24:mobile?32:44,g=new T.BufferGeometry(),vertices=new Float32Array((steps+1)*6);
  const bearings=[],indices=[],polygons=[];
  for(let i=0;i<=steps;i++){
   const angle=i*TAU/steps;bearings.push([Math.cos(angle),Math.sin(angle)]);
   if(i===steps)break;
   const a=i*2;indices.push(a,a+1,a+3,a,a+3,a+2);polygons.push([a,a+1,a+3,a+2]);
  }
  const positions=new T.BufferAttribute(vertices,3);positions.setUsage(T.DynamicDrawUsage);
  g.setAttribute('position',positions);g.setIndex(indices);
  g.userData.polygons=polygons;g.userData.ephemeralFX=true;g.userData.dynamicFXRadius=r+4;
  g.boundingSphere=new T.Sphere(V(),r+4);
  const m=mesh(g,ink,.8);
  m.userData.fit=(distance,thickness)=>{
   for(let i=0;i<=steps;i++){
    const [x,z]=bearings[i],y=surfaceHeight(pos.x+x*distance,pos.z+z*distance)-pos.y+.08;
    positions.setXYZ(2*i,x*distance,y,z*distance);
    const inner=Math.max(.015,distance-thickness);positions.setXYZ(2*i+1,x*inner,y+.006,z*inner);
   }
   positions.needsUpdate=true;
  };
  return m;
 }
 function resonance(pos,r=4,life=.56,dir=null,width=.40){
  const root=new T.Group(),heading=dir?horizontalDir(dir):null,base=pos.clone();
  root.position.copy(base);if(heading)root.rotation.y=Math.atan2(heading.x,heading.z);
  const grounded=base.y-surfaceHeight(base.x,base.z)<.25,rings=[];
  const count=level()===2?2:3,alpha=calm()?.60:.86;
  for(let i=0;i<count;i++){
   const ink=[soundInk.lime,soundInk.jade,soundInk.mint][i];
   const m=!heading&&grounded?soundRingOnTerrain(base,r,ink):mesh(geo.band,ink,alpha);
   if(!heading&&!grounded)m.rotation.x=-Math.PI/2;root.add(m);rings.push(m);
  }
  const trace=heading?carved(geo.echoLine,alpha):null;if(trace)root.add(trace);
  return techAnimate(root,life,(o,t)=>{
   rings.forEach((m,i)=>{
    const lead=clamp((t-i*.14)/(1-i*.14)),distance=r*lead;
    if(heading){
     const cross=.36+distance*width;
     const floor=grounded?surfaceHeight(base.x+heading.x*distance,base.z+heading.z*distance)-base.y:0;
     const mid=floor+(grounded?.46+.15*Math.min(4,distance):0);
     m.position.set(0,mid,distance);m.scale.set(cross,.25+.35*cross,1);
     if(i===0){trace.position.set(0,mid,distance+.014);trace.scale.set(cross*.97,.35+.1*cross,1);trace.material.opacity=alpha*clamp((1-lead)/.20);}
    }else if(grounded){m.userData.fit(.07+distance,.025+.009*distance);}
    else{m.scale.setScalar(.12+distance);m.position.y=.035*i;}
    m.material.opacity=alpha*(1-.16*i)*clamp(lead/.055)*clamp((1-lead)/.22);
   });
  });
 }
 function echoMark(point,life=3){
  const root=new T.Group(),note=carved(geo.echoNote,calm()?.72:.96);
  root.position.copy(point);root.add(note);
  const arcs=[];
  for(const side of [-1,1]){
   const reed=mesh(geo.arc,side<0?soundInk.jade:soundInk.lime,calm()?.48:.69);
   root.add(reed);arcs.push(reed);
  }
  return techAnimate(root,life,(o,t)=>{
   const age=t*life,beat=.5+.5*Math.cos(age*TAU*2.4),height=.075*Math.sin(age*3.7);
   note.position.y=height;note.scale.setScalar(.48+.065*beat);note.rotation.y=.48+age*1.95;
   arcs.forEach((m,i)=>{const sign=i?1:-1;
    m.position.set(sign*(.20+.04*beat),height-.13,.016);
    m.rotation.set(.35,.42+age*1.95,sign*1.4);m.scale.set(.18+.04*beat,.19,1);
   });
   fade(o,(.85+.15*beat)*clamp(t*life/.075)*clamp((1-t)*life/.11));
  });
 }
 function echoAnswer(point,dir,size=1){
  const root=techRoot(point,dir),alpha=calm()?.62:.90,lines=[],note=carved(geo.echoNote,alpha);
  root.add(note);
  for(let i=0;i<2;i++){const m=carved(geo.echoLine,alpha);root.add(m);lines.push(m);}
  return techAnimate(root,.46,(o,t)=>{
   const spread=.18+ease(t)*size;
   lines.forEach((m,i)=>{const sign=i?1:-1;m.position.set(0,sign*.15*spread,.24*t);m.scale.set(spread,.52*spread,1);m.rotation.z=sign*.18;});
   note.position.set(.20*size*t,.56*size*ease(t),.04);note.scale.setScalar(size*(.44-.14*t));note.rotation.y=t*1.8;
   fade(o,clamp((1-t)/.58));
  });
 }
 // Author ground marks in lane space; sample each corner in world space so a
 // seam climbs a ramp and remains attached on either side of a step.
 function terrainStrokes(origin,heading,paths){
  const cells=[];
  function vertex(x,z){
   const wx=origin.x+heading.z*x+heading.x*z,wz=origin.z-heading.x*x+heading.z*z;
   return [x,surfaceHeight(wx,wz)-origin.y+.067,z];
  }
  for(const [points,width,ink] of paths){
   for(let i=1;i<points.length;i++){
    const [ax,az]=points[i-1],[bx,bz]=points[i],dx=bx-ax,dz=bz-az;
    const length=Math.hypot(dx,dz);if(length<.001)continue;
    const nx=-dz/length*width*.5,nz=dx/length*width*.5,steps=Math.max(1,Math.ceil(length/.45));
    for(let j=0;j<steps;j++){
     const u=j/steps,v=(j+1)/steps,x=ax+dx*u,z=az+dz*u,x1=ax+dx*v,z1=az+dz*v;
     cells.push([[vertex(x+nx,z+nz),vertex(x1+nx,z1+nz),vertex(x1-nx,z1-nz),vertex(x-nx,z-nz)],ink]);
    }
   }
  }
  const geo=sculpt(cells);geo.userData.ephemeralFX=true;return carved(geo,calm()?.72:.94);
 }
 function kineticLane(start,dir,length,halfWidth,life,priming){
  const origin=floorAt(start,0),heading=horizontalDir(dir),root=techRoot(origin,heading);
  const width=Math.max(.08,halfWidth),distance=Math.max(.12,length),paths=[],w=.040;
  if(priming){
   // Corner brackets and dashed sides bound the exact damaging rectangle.
   for(const sign of [-1,1]){
    const side=sign*width;
    paths.push([[[side*.64,0],[side,0],[side,distance*.21]],w*1.42,steelInk.brass],
               [[[side,distance*.77],[side,distance],[side*.64,distance]],w*1.42,steelInk.brass]);
    for(let i=0;i<3;i++){
     const u=.26+i*.15;paths.push([[[side,u*distance],[side,(u+.09)*distance]],w,steelInk.blue]);
    }
   }
   for(let i=0;i<2;i++){
    const z=distance*(.34+i*.37);
    paths.push([[[-width*.26,z],[0,z+distance*.05],[width*.26,z]],w*.9,steelInk.edge]);
   }
  }else{
   const centers=[[0,0],[-width*.18,distance*.23],[width*.17,distance*.40],[-width*.12,distance*.55],[width*.20,distance*.77],[0,distance]];
   paths.push([centers,.16*width,steelInk.dark],[centers.map(([x,z])=>[x+.065*width,z]),.033*width,steelInk.edge]);
   for(let i=1;i<centers.length-1;i++){
    const [x,z]=centers[i],sign=i%2?-1:1,tip=[sign*width*.95,z+.11*distance];
    paths.push([[[x,z],[sign*width*.45,z-.035*distance],[sign*width*.60,z+.081*distance],tip],.079*width,steelInk.blue],
               [[[tip[0]*.82,tip[1]-.045*distance],tip],.051*width,steelInk.brass]);
   }
  }
  const mark=terrainStrokes(origin,heading,paths);root.add(mark);
  const slag=[];
  if(!priming){
   const count=level()===2?4:7;
   for(let i=0;i<count;i++){
    const z=distance*(i+.65)/(count+.5),s=i%2?-1:1,x=s*width*(.35+.10*(i%3));
    const base=surfaceHeight(origin.x+heading.z*x+heading.x*z,origin.z-heading.x*x+heading.z*z)-origin.y;
    const chip=carved(geo.piston,.91);root.add(chip);slag.push({x,z,s,base,chip});
   }
  }
  return techAnimate(root,life,(o,t)=>{
   const exit=clamp((1-t)/(priming?.15:.47));
   const alpha=priming?.56+.35*smooth(t):clamp(t/.04);
   mark.material.opacity=(calm()?.72:.96)*alpha*exit;
   slag.forEach(({x,z,s,base,chip},i)=>{
    const up=Math.sin(Math.PI*t),rise=(.30+.09*(i%3))*width*up;
    chip.position.set(x+s*.18*width*t,base+.042+rise,z+.18*t);
    chip.rotation.set(.35+i*.53+t*2.7,i*1.7,.42*s+t*1.9*s);
    chip.scale.set((.18+.06*(i%3))*width,.10*width,(.21+.07*(i%2))*width);
    chip.material.opacity=(calm()?.72:.92)*exit;
   });
  });
 }
 function kineticBurst(point,dir,radius=1,life=.5,grounded=true){
  const r=Math.max(.12,radius),heading=horizontalDir(dir),origin=grounded?floorAt(point,0):point.clone();
  const root=techRoot(origin,heading),bits=[],n=level()===2?5:8,alpha=calm()?.74:.96;
  if(grounded){
   const paths=[];
   for(let i=0;i<(level()===2?4:6);i++){
    const angle=.31+i*2.40,sx=Math.sin(angle),sz=Math.cos(angle),reach=r*(.57+.12*(i%4));
    const joint=[sx*.38*r,sz*.38*r],elbow=[joint[0]+.15*r*sz,joint[1]-.15*r*sx],end=[sx*reach,sz*reach];
    paths.push([[[0,0],joint,elbow,end],.044+.023*r,i%3?steelInk.shade:steelInk.blue],
               [[[elbow[0]+.015,elbow[1]],end],.018+.007*r,i%3?steelInk.edge:steelInk.brass]);
   }
   root.add(terrainStrokes(origin,heading,paths));
  }
  for(let i=0;i<n;i++){
   const m=carved(geo.piston,alpha),angle=(i+.2)*2.40;
   root.add(m);bits.push({m,dx:Math.cos(angle),dz:Math.sin(angle),reach:r*(.38+.13*(i%4)),lift:r*(.23+.095*(i%4))});
  }
  if(r>.7)sparks(point,steelInk.brass,level()===2?3:5,1.65,{gravity:4.8,life:.30,size:.035,stretch:1.55});
  return techAnimate(root,life,(o,t)=>{
   const blast=ease(t/.86),arc=Math.sin(Math.PI*t),opacity=clamp((1-t)/.39);
   bits.forEach(({m,dx,dz,reach,lift},i)=>{
    const x=dx*reach*blast,z=(grounded?dz:Math.abs(dz)+.18)*reach*blast;
    const wx=origin.x+heading.z*x+heading.x*z,wz=origin.z-heading.x*x+heading.z*z;
    const floor=surfaceHeight(wx,wz)-origin.y+.045,y=(grounded?.06:.03)+lift*arc-(grounded?0:.41*r*t*t);
    m.position.set(x,Math.max(floor,y),z);m.rotation.set(i*.9+t*(1.2+i*.23),i*1.5+t*.7,(i%2?-1:1)*t*2.4);
    const s=Math.min(2.6,r)*(.12+.035*(i%4))*(1-.38*t);
    m.scale.set(1.44*s,.62*s,1.05*s);m.material.opacity=alpha*opacity;
   });
   if(grounded)o.children[0].material.opacity=alpha*opacity;
  });
 }
 function feathers(pos,dir,size=1){
  const root=new T.Group();root.position.copy(pos);oriented(root,dir);const birds=[],n=level()===2?4:7;
  for(let i=0;i<n;i++){const m=carved(geo.plume,.86);root.add(m);birds.push(m);}
  function frame(o,t){const k=ease(t);birds.forEach((m,i)=>{const u=(i+.5)/n-.5,sign=i%2?1:-1;
    m.position.set(u*(.25+2.0*k)*size,(Math.sin(i*1.72)*.33*k+.36*Math.sin(Math.PI*t)-.31*t*t)*size,k*(.42+.65*(1-Math.abs(u)))*size);
    m.rotation.set(.31+u*.44+sign*t*1.1,u*.79,sign*(.47+t*1.9));m.scale.setScalar(size*(.66+.18*(i%3)));});fade(o,clamp((1-t)/.50));}
  frame(root,0);return add(root,.52,frame);
 }
 function sand(pos,r=1.5,life=.88){
  const root=new T.Group();root.position.copy(pos);const trails=[],grains=[];for(let i=0;i<2;i++){const m=carved(geo.dustCurl,.76);root.add(m);trails.push(m);}
  for(let i=0;i<(soft?5:10);i++)grains.push(block(root,V(),[.09,.08,.15],i%3?'#dba65f':'#ffe0a5',.86));
  function frame(o,t){const grow=.15+.85*ease(t/.31),out=1-.29*smooth((t-.75)/.25);
   trails.forEach((m,i)=>{m.rotation.y=i*Math.PI+t*(2.7+life)*1.37;m.scale.set(r*grow*out,r*(.68+.38*i)*grow,r*grow*out);});
   grains.forEach((m,i)=>{const u=(t*1.37+i/grains.length)%1,a=4.2*t+i*2.40,rad=r*(.34+.61*u)*grow;m.position.set(Math.cos(a)*rad,.09+r*.91*u,Math.sin(a)*rad);m.rotation.set(a,a*.3,0);});
   fade(o,clamp((1-t)/.28));}
  frame(root,0);return add(root,life,frame);
 }
 function magnet(from,to,life=.35,repel=false){
  const root=new T.Group(),delta=to.clone().sub(from),len=Math.max(.15,delta.length());root.position.copy(from);oriented(root,delta);
  const lines=[],filings=[],n=level()===2?2:4,span=clamp(len*.29,.23,1.5);
  for(let i=0;i<n;i++){const m=carved(geo.flux,.80);root.add(m);lines.push(m);}
  for(let i=0;i<n*2;i++)filings.push(block(root,V(),[.048,.050,.16],i%2?'#edab91':'#a1d4de',.86));
  function frame(o,t){const spread=(repel?.6+.68*t:1.24-.67*t)*span;
   lines.forEach((m,i)=>{m.rotation.z=i*TAU/n+.25;m.scale.set(spread,spread,len);});
   filings.forEach((m,i)=>{const k=(t*1.5+(i+.5)/filings.length)%1,u=repel?k:1-k,a=(i%n)*TAU/n+.25,off=.62*Math.sin(Math.PI*u)*spread;m.position.set(Math.cos(a)*off,Math.sin(a)*off,len*u);m.rotation.y=Math.cos(Math.PI*u)*.5;});
   fade(o,clamp((1-t)/.29));}
  frame(root,0);return add(root,life,frame);
 }
 function manifest(pos,f){
  const p=pos.clone().add(V(0,1.3,0));
  if(f.id==='mare')whirlpool(pos,1.9,1.05);
  if(f.id==='cristal'){for(let i=0;i<3;i++){const a=(.25+i/3)*TAU;prism(pos.clone().add(V(Math.cos(a)*.96,.04,Math.sin(a)*.96)),i===1?1.6:1.2,.91);}}
  if(f.id==='eco'){resonance(pos,2.9,.9);echoAnswer(p,V(0,0,1),1.17);}
  if(f.id==='falcao'){feathers(p,V(1,.57,.1),1.28);feathers(p,V(-1,.57,.1),1.28);}
  if(f.id==='duna')sand(pos,1.6,1.19);
  if(f.id==='ima'){magnet(pos.clone().add(V(-.8,.34,-.25)),p.clone().add(V(.44,1.65,.21)),.83);magnet(pos.clone().add(V(.8,.34,.2)),p.clone().add(V(-.44,1.65,-.21)),.83,true);}
 }
 function activation(pos,f){if(accents[f.id])manifest(pos,f);flash(pos.clone().add(V(0,2,0)),f.color,4.2,1);if(f.id==='impacto')kineticBurst(pos,V(0,0,1),2.8,.66);if(f.id==='brasa')fire(pos,1.2,2.7,1.3);if(f.id==='geada'){for(let i=0;i<6;i++){const a=i*TAU/6;ice(pos.clone().add(V(Math.cos(a)*1.1,0,Math.sin(a)*1.1)),.8,1.2,.25,1);}snow(pos,1,18);}if(f.id==='tormenta'){for(let i=0;i<3;i++){const a=i*TAU/3;lightning(pos.clone().add(V(Math.cos(a),3.5,Math.sin(a))),pos.clone().add(V(Math.cos(a),.1,Math.sin(a))),f.color,.6);}}if(f.id==='lobo')wolfChange(pos,2.8);if(f.id==='eclipse')vortex(pos,1.5,1.3,f.color);shake(.04,.3);}
 function charge(pos,f,index){flash(pos,f.color,index===2?2.1:1,.32);if(f.id==='tormenta')sparks(pos,'#fff6be',9,2,{gravity:0,stretch:3});else if(f.id==='geada')snow(pos,.2,8);else if(f.id==='brasa')sparks(pos,'#ffdd7b',9,2,{gravity:-.5});else sparks(pos,f.color,7,1.4,{gravity:0});}
 // The windup follows the animated socket. Its owner explicitly releases it
 // at the combat event, or removes it on interruption.
 function focus(f,index,position){
  if(f.id==='eco'||f.id==='impacto'){
   const sound=f.id==='eco',root=new T.Group(),count=sound?2:3,parts=[];
   const base=carved(sound?geo.echoNote:geo.piston,calm()?.72:.92);root.add(base);
   for(let i=0;i<count;i++){
    const m=sound?carved(geo.echoLine,calm()?.50:.76):mesh(geo.cube,i===1?steelInk.brass:steelInk.blue,calm()?.71:.89);
    root.add(m);parts.push(m);
   }
   scene.add(root);
   function seek(p,t){
    const growth=.13+.87*smooth(t),r=(index===2?.46:.33)*growth;root.position.copy(p);
    if(sound){
     base.scale.setScalar(r*1.03);base.rotation.y=.35+1.8*t;
     parts.forEach((m,i)=>{const sign=i?1:-1;m.position.set(sign*.36*r,sign*.22*r+.025*Math.sin(TAU*t),0);m.rotation.y=base.rotation.y;m.scale.set(r*1.05,r*.56,r);});
    }else{
     base.scale.set(1.53*r,1.32*r,r);base.rotation.y=.4;
     parts.forEach((m,i)=>{const x=(i-1),gap=(.78-.58*smooth(t))*r+.06;
      m.position.set(x*gap,.46*r-x*x*r*.36,-.13*r);m.scale.set(.35*r,(i===1?.21:.74)*r,.83*r);m.rotation.y=.4;
     });
    }
   }
   seek(position,0);return {seek,remove:()=>dispose(root)};
  }
  const root=new T.Group(),g=shapes[f.id]||(f.id==='geada'?geo.ice:f.id==='brasa'?geo.flame:geo.orb);
  const core=mesh(g,f.id==='eclipse'?'#231634':f.color,.82),halo=sprite(f.color,1,.33);
  const arc=mesh(geo.band,f.color,.65),marks=[];
  root.add(halo,arc,core);scene.add(root);
  const n=level()===2?3:6;
  for(let i=0;i<n;i++){const m=mesh(shapes[f.id]||(f.id==='lobo'?geo.flame:geo.cube),i%2?f.color:accents[f.id]||'#fff2d5',.7);root.add(m);marks.push(m);}
  function seek(p,t){root.position.copy(p);const k=.12+.88*smooth(t),r=(index===2?.35:.23)*k;
   core.scale.set(r*(f.id==='brasa'?.67:1),r*(f.id==='geada'||f.id==='brasa'?1.8:1),r);
   core.rotation.set(t*.9,t*4,0);
   if(f.id==='cristal'){core.scale.set(r*2,r*2.45,r*2);core.position.y=-r*.72;}
   if(f.id==='mare'||f.id==='duna'){core.scale.set(r*1.8,r*1.7,r*1.8);core.rotation.set(.22,t*5,.06);}
   if(f.id==='ima')core.scale.setScalar(r*1.55);
   if(f.id==='falcao'){core.scale.setScalar(r*3);core.rotation.set(-.50,t*3.4,.82);}
   halo.scale.setScalar(r*4.6);halo.material.opacity=(calm()?.13:.3)*k;
   arc.rotation.set(1.1,t*.8,t*3);arc.scale.setScalar(r*(1.9-.65*t));
   marks.forEach((m,i)=>{const a=i*TAU/n+t*(f.id==='tormenta'?4.2:2.2),rr=(.14+.48*(1-t));m.position.set(Math.cos(a)*rr,Math.sin(a*2)*.12,Math.sin(a)*rr);m.scale.set(.034,.04+.09*(f.id==='lobo'||f.id==='tormenta'),.045);m.rotation.set(a,0,a);
    if(accents[f.id]){const unit=f.id==='falcao'?.28:f.id==='cristal'?.16:.083;m.scale.setScalar(unit*(.5+k));m.rotation.set(a,-a*.63,.5);}});
  }
  seek(position,0);return {seek,remove:()=>dispose(root)};
 }
 function groundMark(p,c,r,life){
  const m=mesh(geo.band,c,.46);m.quaternion.setFromUnitVectors(V(0,0,1),normalAt(p));m.position.copy(floorAt(p,.066));m.scale.setScalar(r);
  return add(m,life,(o,t)=>{o.material.opacity=.20+Math.sin(t*Math.PI)*.44;o.scale.setScalar(r*(.94+.06*t));});
 }
 function slash(a,b,c,width=.08){
  if(a.distanceToSquared(b)<.00008)return;
  const root=new T.Group();beam(root,a,b,c,width,.67);return add(root,.14,(o,t)=>fade(o,(1-t)*(1-t)));
 }
 function fracture(point,yaw){
  const g=new T.Group();g.position.copy(point);g.rotation.y=yaw;
  for(let i=0;i<6;i++){const a=i*TAU/6+.18,r=.23+.06*(i%3),joint=V(Math.cos(a)*r*.56,Math.sin(a)*r*.56,0),tip=V(Math.cos(a+.21)*r,Math.sin(a+.21)*r,.012);beam(g,V(),joint,'#f3ffff',.021,.89);beam(g,joint,tip,'#a4e8ff',.014,.71);}
  sparks(point,'#c1f2ff',9,1.8,{gravity:5,life:.38,size:.04});flash(point,'#b4efff',.72,.20);return add(g,.45,(o,t)=>fade(o,1-t));
 }
 function closeZone(pos,r,kind,c){
  if(kind==='wall'){sparks(pos.clone().add(V(0,1.1,0)),'#c5f1ff',11,2,{gravity:5});return;}
  if(kind==='fire'){sparks(pos,'#ffa959',5,1.1,{gravity:-.5});return;}

  if(kind==='shadow'){const core=mesh(geo.orb,'#c9a6ff',.64);core.position.copy(pos).add(V(0,.9,0));add(core,.27,(o,t)=>{o.scale.setScalar((1-t)*r*.21);o.material.opacity=1-t;});}
 }
 function projectile(pos,dir,c,kind){const root=new T.Group();root.position.copy(pos);root.userData.color=c;root.userData.kind=kind;
  if(kind==='impact'){
   oriented(root,dir);const piston=carved(geo.piston,calm()?.82:1);piston.scale.set(.82,.86,1);root.add(piston);
   for(const sign of [-1,1]){const rail=block(root,V(sign*.21,.02,-.48),[.10,.11,.59],steelInk.edge,.85);rail.rotation.y=sign*.095;}
  }
  else if(kind==='crystal'){
   oriented(root,dir);const shaft=carved(geo.quartz,1);shaft.position.z=-.41;shaft.rotation.x=Math.PI/2;shaft.scale.set(.81,1.27,.81);shaft.userData.axial=true;root.add(shaft);
   const crest=mesh(geo.band,'#ffdced',.68);crest.position.z=-.22;crest.scale.setScalar(.25);crest.userData.axial=true;root.add(crest);
  }else if(kind==='feather'){
   oriented(root,dir);const quill=carved(geo.plume,1);quill.userData.axial=true;quill.scale.set(1.6,1,1.25);quill.rotation.z=.58;root.add(quill);
   const foil=carved(geo.plume,.86);foil.userData.axial=true;foil.scale.set(1.2,1,1.14);foil.rotation.z=2.07;root.add(foil);
  }else if(kind==='sand'){
   oriented(root,dir);const stone=mesh(geo.orb,'#c99353',.93,true);stone.scale.set(.22,.23,.33);root.add(stone);
   for(let i=0;i<2;i++){const strand=carved(geo.dustCurl,.8);strand.userData.axial=true;strand.rotation.set(-Math.PI/2,i*Math.PI,0);strand.scale.set(.35,.76,.35);root.add(strand);}
  }
  else if(kind==='shadow'){const core=mesh(geo.orb,'#151026',1),band=mesh(geo.band,c,.85);core.scale.setScalar(.27);band.scale.setScalar(.39);root.add(core,band);const glow=sprite(c,1.2,.6);root.add(glow);}
  else if(kind==='fire'||kind==='cinder'){
   root.quaternion.setFromUnitVectors(V(0,0,1),dir);
   const shell=mesh(geo.orb,'#fa792b',.61),core=mesh(geo.orb,'#ffefae',1),glow=sprite('#ffae4f',1.5,.53);shell.scale.set(.26,.26,.34);core.scale.set(.19,.19,.27);root.add(shell,core,glow);
   for(let i=0;i<3;i++){const tail=mesh(geo.flame,i===1?'#ffdf74':'#fb6d28',.74);tail.userData.axial=true;tail.rotation.x=-Math.PI/2;tail.position.set(Math.sin(i*2.1)*.11,Math.cos(i*2.1)*.11,-.29-i*.07);tail.scale.set(.105,.52+i*.09,.11);root.add(tail);}
   const arc=mesh(geo.arc,'#ffc76b',.84);arc.scale.setScalar(.32);arc.rotation.x=.45;root.add(arc);
  }
  else block(root,V(),[.24,.24,.24],c,.95);return root;
 }
 function travel(p,dt){p.visualTimer=(p.visualTimer||0)+dt;if(p.kind!=='impact'){p.mesh.children.forEach((m,i)=>{if(!m.isSprite&&!m.userData.axial){m.rotation.y+=dt*(i+1)*4;m.rotation.z+=dt;}});}if(p.visualTimer<(soft?.1:.055))return;p.visualTimer=0;const pos=p.mesh.position;
  if(['crystal','feather','sand'].includes(p.kind)){
   const ink=p.kind==='crystal'?'#efb7df':p.kind==='feather'?'#eac68c':'#dab173';
   if(p.lastTrail)slash(p.lastTrail,pos,ink,p.kind==='crystal'?.034:.049);
   if(p.kind==='sand')sparks(pos,ink,2,.65,{gravity:.9,life:.32,size:.045});
   if(p.kind==='crystal'&&level()===0)sparks(pos,'#ffddeb',1,.58,{gravity:0,life:.29,size:.034});
   p.lastTrail=pos.clone();return;
  }
  if(p.kind==='fire'||p.kind==='cinder'||p.kind==='shadow'){
   if(p.lastTrail)slash(p.lastTrail,pos,p.kind!=='shadow'?'#ffb65c':'#b398e0',p.kind!=='shadow'?.070:.044);
   p.lastTrail=pos.clone();
  }
  if(p.kind==='fire'||p.kind==='cinder'){sparks(pos,'#ffb44c',2,1,{gravity:-.4,life:.5,size:.045});if(level()===0)flash(pos,'#ff9a3e',.8,.17);}
  else if(p.kind==='shadow')sparks(pos,'#bba2ed',2,.5,{gravity:0,life:.45});
  else if(p.kind==='impact'){
   if(p.lastTrail)slash(p.lastTrail,pos,steelInk.blue,.097);
   p.lastTrail=pos.clone();
  }
 }
 function hit(pos,c,kind='impact',dir=null){
  if(kind==='impact')return kineticBurst(pos,dir||V(0,0,1),.94,.39,false);
  if(kind==='cinder'){fire(pos,.32,.8,.36);sparks(pos,'#ffbf72',5,1.7,{gravity:1.1});return;}
  if(kind==='crystal'){prism(pos,.83,.39);sparks(pos,'#ffe1ef',12,2.8,{gravity:3,life:.48,size:.048,stretch:2});return;}
  if(kind==='feather'){feathers(pos,V(.16,.63,.30),.62);sparks(pos,'#f4d6a1',5,1.2,{gravity:2,life:.30});return;}
  if(kind==='sand'){sand(pos,.74,.47);sparks(pos,'#e4bb84',10,2,{gravity:2,life:.43,spread:.12});return;}
  if(kind==='fire'){fire(pos,.9,1.8,.8);flash(pos.clone().add(V(0,.5,0)),'#ffe19d',2.7,.4);sparks(pos,'#ffac51',22,4,{gravity:1});shake(.07,.2);}else if(kind==='shadow'){vortex(pos,1.1,.85,c);sparks(pos,c,14,2,{gravity:0});}else if(kind==='ice'){ice(pos,.6,.65,.4,3);snow(pos,1,12);}else {impact(pos,c,1,.4);}}
 function createZone(pos,r,kind,c){let root;if(kind==='fire')root=buildFire(r,1.6);else if(kind==='shadow')root=buildVortex(r,c);else {
   root=new T.Group();const wall=[];for(let row=0;row<3;row++)for(let col=0;col<5;col++){const m=mesh(geo.cube,(row+col)%2?'#9ed9ed':'#d4f8ff',.58,true);m.position.set((col-2)*.42,.42+row*.77,0);root.add(m);wall.push({m,row,col});}const ridge=mesh(geo.ice,'#d4f8ff',.8);ridge.scale.set(.24,.55,.25);ridge.position.y=2.8;root.add(ridge);root.userData.animate=(t,dt)=>{const k=ease(t/.13)*clamp((1-t)/.15);wall.forEach(({m,row,col})=>{m.scale.set(.40,.73*k,.26);m.position.y=(.42+row*.77)*k;m.material.opacity=.55*clamp((1-t)/.13);});ridge.scale.y=.55*k;ridge.position.y=2.65*k;};
  }if(['fire','shadow'].includes(kind)){const rim=mesh(geo.band,c,.26);rim.rotation.x=-Math.PI/2;rim.position.y=.10;rim.scale.setScalar(r);root.add(rim);}root.position.copy(pos);scene.add(root);return root;
 }
 const auraRoot=new T.Group();scene.add(auraRoot);let auraKey='',auraNodes=[];
 function aura(f,body,awakened,dt,form){if(!f){auraRoot.visible=false;return;}auraRoot.visible=true;auraRoot.position.copy(body.root.position);const key=f.id+(awakened?'1':'0');if(key!==auraKey){for(const child of [...auraRoot.children])dispose(child);auraKey=key;auraNodes=[];const amount=(f.id==='eco'||f.id==='impacto')?(awakened?6:3):(awakened?9:5);for(let i=0;i<amount;i++){const g=shapes[f.id]||(f.id==='geada'?geo.ice:f.id==='brasa'?geo.flame:geo.cube);let m;if(f.id==='eco')m=carved(geo.echoNote,.70);else if(f.id==='impacto')m=carved(geo.piston,.70);else m=mesh(g,accents[f.id]&&i%3===0?accents[f.id]:f.color,f.id==='eclipse'?.65:.52);auraRoot.add(m);auraNodes.push(m);}if(awakened&&f.id!=='impacto'){const floor=mesh(geo.band,f.color,.25);floor.rotation.x=-Math.PI/2;floor.scale.setScalar(1.2);floor.position.y=.08;auraRoot.add(floor);}}
  const t=now();auraNodes.forEach((m,i)=>{const a=t*(f.id==='tormenta'?2.8:.7)+i*TAU/auraNodes.length,r=awakened?1:.78;m.position.set(Math.cos(a)*r,.35+(i%5)*.62+Math.sin(t*2+i)*.1,Math.sin(a)*r);const s=awakened?.10:.055;m.scale.set(s,s*(f.id==='brasa'?3:f.id==='geada'?2:1),s);m.rotation.set(a*.3,a,f.id==='lobo'?.7:a*.2);
   if(f.id==='lobo'&&form==='completa'){m.position.y*=.55;m.position.z*=1.45;}
   if(accents[f.id]){
    const cycle=(t*.43+i/auraNodes.length)%1,boost=awakened?1.45:1;
    if(f.id==='mare'){m.position.y=.13+cycle*.92;m.scale.set(.22*boost,.20*boost,.22*boost);m.rotation.set(0,a*2,0);}
    if(f.id==='cristal'){m.position.y=.28+(i%3)*.70+.12*Math.sin(a);m.scale.set(.24*boost,.39*boost,.24*boost);m.rotation.set(.1*Math.cos(a),a,.18*Math.sin(a));}
    if(f.id==='eco'){m.position.set(Math.cos(a)*r,.74+cycle*2.35,Math.sin(a)*r);m.rotation.set(.06,a+t*.62,.16*Math.sin(a));m.scale.setScalar((.15+.045*Math.sin(t*5+i))*boost);}
    if(f.id==='falcao'){m.position.y=(form==='completa'?.55:1.15)+Math.sin(a)*.31;m.position.z-=cycle*.45;m.scale.setScalar(.25*boost);m.rotation.set(.45+a,.2,.6+a*.3);}
    if(f.id==='duna'){m.position.y=.06+cycle*.88;m.scale.set(.22*boost,.29*boost,.22*boost);m.rotation.set(.05,a*2.3,0);}
    if(f.id==='ima'){m.position.set(Math.cos(a)*r,1.25+.65*Math.sin(a),Math.sin(a)*r*.56);m.rotation.set(a*.9,.6,a);m.scale.setScalar(.12*boost);}
   }
   if(f.id==='impacto'){const side=i%2?1:-1,cycle=(t*.60+i/auraNodes.length)%1;
    m.position.set(side*(.58+.25*cycle),.15+.27*Math.sin(Math.PI*cycle),Math.cos(i*2.4)*.47);
    m.scale.set(.25,.13,awakened?.24:.16);m.rotation.set(.22*side,a*.42,side*.39);}
   if(awakened){
    const cycle=(t*.55+i/auraNodes.length)%1;
    if(f.id==='brasa'){m.position.y=cycle*3.4;m.scale.set(.075,.38*(1-cycle)+.07,.075);}
    if(f.id==='geada'){m.position.y=.35+(i%3)*.87;m.rotation.z=Math.cos(a)*.35;m.scale.set(.09,.29,.09);}
    if(f.id==='tormenta'){m.rotation.z=a+.7;m.scale.set(.045,.32,.045);}
    if(f.id==='lobo'){m.position.y=.18+cycle*(form==='completa'?1.7:3.45);m.scale.set(.045,.17,.05);m.rotation.z=a+.5;}
    if(f.id==='eclipse'){m.position.set(Math.cos(a)*1.13,1.7+Math.sin(a)*.63,Math.sin(a)*.84);m.scale.set(.10,.10,.10);}
   }m.material.opacity=f.id==='tormenta'&&!calm()?.37+.25*Math.abs(Math.sin(t*4+i)):.5;});
 }
 function update(dt){for(let i=items.length-1;i>=0;i--){const e=items[i];e.age+=dt;if(e.age>=e.life){dispose(e.root);items.splice(i,1);continue;}e.update?.(e.root,e.age/e.life,dt);}auraRoot.visible=auraRoot.visible&&items.length<cap;}
 function clear(){for(const e of items)dispose(e.root);items.length=0;auraRoot.visible=false;}
 // Local +Z follows the measured wrist or foot travel. Marks are faceted solid
 // ribbons so their silhouette survives a side view and the compatibility renderer.
 const signatureCache=new Map();
 const signaturePalette={
  impacto:[steelInk.edge,steelInk.blue,steelInk.dark],brasa:['#fff1a4','#ff9b41','#ce492e'],
  geada:['#edfff9','#98dbe8','#5396bf'],tormenta:['#fff4b7','#f6cd65','#a395cf'],
  lobo:['#f3e8c5','#b1cedc','#657898'],eclipse:['#e9d8ff','#9778c4','#35304f'],
  mare:['#f0fff0','#6ccbc6','#278ba2'],cristal:['#ffe2eb','#e0a3cd','#9a69aa'],
  eco:[soundInk.mint,soundInk.lime,soundInk.jade],falcao:['#fae6ad','#ba9169','#71869e'],
  duna:['#ffdf9d','#d6a366','#a47a58'],ima:['#f4dac0','#f39482','#88cbdc']
 };
 // Radius of a punch mark, lifetime of its contact, trail lifetime, wake width,
 // and height of the wake above the moving root.
 const signatureSizes={
  impacto:[.68,.25,.18,.76,.23],brasa:[.56,.36,.34,.65,.14],
  geada:[.47,.45,.58,.54,.095],tormenta:[.54,.22,.24,.72,.45],
  lobo:[.57,.29,.43,.59,.09],eclipse:[.57,.44,.34,.77,.95],
  mare:[.54,.38,.38,.77,.13],cristal:[.56,.40,.47,.59,.11],
  eco:[.58,.52,.43,.85,.88],falcao:[.66,.41,.36,.89,.83],
  duna:[.54,.46,.46,.77,.10],ima:[.55,.36,.36,.76,.41]
 };
 function signatureGeometry(id,kind){
  const low=soft||level()===2,key=id+'/'+kind+'/'+(low?'low':'high');
  if(signatureCache.has(key))return signatureCache.get(key);
  const colors=signaturePalette[id],cells=[],trace=kind==='trace',seal=kind==='seal',steps=low?6:10;
  const light=[colors[0],colors[1],colors[1],colors[0]],dark=[colors[1],colors[2],colors[2],colors[1]];
  const north=[0,1,0],face=[0,0,1];
  // A diamond-section stroke; each polyline is authored in model space. Four
  // independently shaded sides read as a ridge even under flat lighting.
  function stroke(points,ink=light,normal=north,thickness=.33){
   const rings=[];const preferred=V(...normal);
   for(let i=0;i<points.length;i++){
    const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(i+1,points.length-1)];
    const tangent=V(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
    const side=V().crossVectors(preferred,tangent);
    if(side.lengthSq()<.001)side.crossVectors(Math.abs(tangent.z)<.85?V(0,0,1):V(1,0,0),tangent);
    side.normalize();const crest=V().crossVectors(tangent,side).normalize(),r=p[3];
    const at=(s,h)=>[p[0]+r*(side.x*s+crest.x*h),p[1]+r*(side.y*s+crest.y*h),p[2]+r*(side.z*s+crest.z*h)];
    rings.push([at(1,0),at(0,thickness),at(-1,0),at(0,-thickness)]);
   }
   for(let i=1;i<rings.length;i++)for(let j=0;j<4;j++){
    const k=(j+1)%4;
    cells.push([[rings[i-1][j],rings[i][j],rings[i][k],rings[i-1][k]],ink[j%ink.length]]);
   }
  }
  function path(n,point,ink,normal,thick){stroke(Array.from({length:n+1},(_,i)=>point(i/n,i)),ink,normal,thick);}
  function arc(rx,ry,z,start,span,width,ink=light,centerX=0,centerY=0){
   const n=Math.max(3,Math.ceil(steps*2.0*Math.abs(span)/TAU));
   path(n,t=>{const a=start+t*span;return [centerX+rx*Math.cos(a),centerY+ry*Math.sin(a),z,width*(.32+.68*Math.sin(Math.PI*t))];},ink,face,.52);
  }
  function splinter(a,b,r,ink=light){
   const p=t=>a.map((v,i)=>v+(b[i]-v)*t);
   stroke([[...a,.004],[...p(.35),r],[...p(.69),r*.69],[...b,.002]],ink,Math.abs(b[2]-a[2])>Math.abs(b[1]-a[1])?north:face,.78);
  }
  const paired=[-1,1];
  switch(id){
   case 'impacto':
    if(seal){
     const brass=[steelInk.brass,steelInk.shade,steelInk.shade,steelInk.brass];
     for(let i=0;i<5;i++){
      const a=.19+i*2.4,c=Math.cos(a),s=Math.sin(a),reach=.68+.12*(i%3);
      stroke([[.05*c,.05*s,0,.12],[.35*c,.35*s,.08,.165],[.50*c-.11*s,.50*s+.11*c,.12,.080],[reach*c,reach*s,.25,.009]],i%2?dark:light,face,.63);
     }
     stroke([[-.68,.18,.11,.055],[-.52,.40,.08,.054],[-.45,.64,.15,.015]],brass,face);
    }else{
     for(const s of paired){
      stroke([[s*.47,-.04,0,.017],[s*.42,.09,.33,.088],[s*.27,.04,.78,.12],[s*.10,.02,1,.025]],s<0?dark:light,north,.66);
      if(trace)stroke([[s*.60,-.10,.07,.025],[s*.58,-.10,.40,.055],[s*.44,-.04,.62,.008]],dark);
     }
     if(!trace)stroke([[0,0,.08,.040],[0,0,.59,.16],[0,0,.92,.14]],light,north,.97);
    }break;
   case 'brasa':
    if(seal){
     for(let i=0;i<(low?5:8);i++){const a=i*TAU/(low?5:8),c=Math.cos(a),s=Math.sin(a),l=.74+.32*(i%2);
      stroke([[c*.16,s*.16,0,.035],[c*.45-.13*s,s*.45+.13*c,.14,.17],[c*.73-.17*s,s*.73+.17*c,.18,.10],[c*l,s*l,.27,.004]],i%2?light:dark,face,.56);}
    }else{
     for(let i=-1;i<=1;i++){const x=i*.24,h=i===0?.82:.46;
      path(steps,t=>[x*(1-t)+i*.18*Math.sin(t*Math.PI*1.65),h*(1-t)*(.55+.29*Math.cos(t*2.4+i))+(trace?.02:.08),t,(.008+.13*Math.sin(Math.PI*t)**.8)*(i===0?1:.63)],i===0?light:dark);}
    }break;
   case 'geada':
    if(seal){
     for(let i=0;i<6;i++){const a=i*TAU/6,c=Math.cos(a),s=Math.sin(a);
      splinter([c*.07,s*.07,0],[c*.91,s*.91,.12],.073);
      for(const side of paired)splinter([c*.53,s*.53,.055],[c*.68-side*s*.16,s*.68+side*c*.16,.07],.036,dark);}
    }else{
     for(const side of paired){path(steps,t=>[side*((trace?.32:.17)+.19*Math.sin(Math.PI*t)),.03+.09*Math.sin(Math.PI*t),t,.020+.052*Math.sin(Math.PI*t)],light);
      for(let i=0;i<(low?1:2);i++){const z=.29+i*.41;splinter([side*.30,.025,z],[side*(trace?.53:.41),trace?.32:.44,z-.16],.071,dark);}}
    }break;
   case 'tormenta':
    if(seal){
     for(let i=0;i<(low?4:6);i++){const a=i*TAU/(low?4:6),c=Math.cos(a),s=Math.sin(a);
      const joint=(r,v,z,w)=>[c*r-s*v,s*r+c*v,z,w];
      stroke([joint(.04,0,0,.034),joint(.39,.065,.04,.065),joint(.48,-.14,.09,.035),joint(.70,-.02,.12,.045),joint(1.02,-.11,.21,.006)],i%2?light:dark,face,.65);}
    }else{
     stroke([[-.11,.01,0,.024],[.14,.12,.23,.09],[-.16,.04,.31,.06],[.21,.19,.56,.08],[-.13,.12,.64,.05],[.10,.05,.86,.065],[0,.07,1,.008]],light);
     stroke([[.21,.19,.56,.038],[.35,.23,.51,.053],[.42,.39,.65,.009]],dark);
     if(trace)stroke([[-.11,.01,0,.018],[-.24,.09,.19,.044],[-.20,.14,.23,.012],[-.42,.17,.38,.003]],dark);
    }break;
   case 'lobo':
    if(trace){
     // Pads and the two forward claws leave alternating paw prints.
     for(const side of paired){const z=side<0?.23:.73,x=side*.28;
      splinter([x,.035,z-.11],[x,.043,z+.12],.11,dark);
      for(const claw of paired)splinter([x+claw*.071,.045,z+.09],[x+claw*.103,.062,z+.25],.041,light);}
    }else{
     for(let j=0;j<(seal?3:2);j++){const shift=(j-(seal?1:.5))*.28;
      path(steps,t=>{const bump=Math.sin(Math.PI*t);return seal?[shift- .71+1.40*t,.89-1.59*t+.18*bump,.05+.10*bump,.008+.075*bump]:[shift+.41*bump,.29*bump+shift*.37,t,.008+.079*bump];},j===1?dark:light,seal?face:north,.42);}
    }break;
   case 'eclipse':
    if(seal){
     arc(.83,.83,0,.2,5.48,.195,dark,.07,-.01);arc(.89,.89,.04,.27,3.38,.039,light,-.04,.012);
     arc(.53,.50,.09,3.54,2.14,.07,light,.16,-.06);
    }else{
     for(const side of paired)path(steps,t=>{const b=Math.sin(Math.PI*t),w=(trace?.26:.19)*b;
      return [side*(.07+.56*b),.16+.20*Math.sin(TAU*t+side*.63),t,.012+w];},side<0?dark:light,north,.16);
    }break;
   case 'mare':
    if(seal){
     for(let i=0;i<3;i++){const start=i*TAU/3;path(steps,t=>{const a=start+t*2.31,r=.22+.76*t;return [Math.cos(a)*r,Math.sin(a)*r,.09+.23*Math.sin(Math.PI*t),.012+.124*Math.sin(Math.PI*t)];},i%2?dark:light,face,.44);}
     arc(.80,.75,-.05,1.0,2.28,.047,light);
    }else{
     for(const side of paired){path(steps,t=>{const r=(trace?.84:.54)*(1-t)**.75;
       return [side*(.02+r)+.10*Math.sin(t*TAU),.08+.23*Math.sin(t*Math.PI+.24*side),t,.012+.112*Math.sin(t*Math.PI)];},side<0?dark:light,north,.42);}
     path(steps,t=>[.16*Math.sin(TAU*t+.6),.12+.085*Math.sin(Math.PI*t),t,.012+.032*Math.sin(Math.PI*t)],light);
    }break;
   case 'cristal':
    if(seal){
     for(let i=0;i<(low?5:7);i++){const n=low?5:7,a=i*TAU/n+.25,r=.70+.23*(i%2),c=Math.cos(a),s=Math.sin(a);
      splinter([c*.13,s*.13,-.02],[c*r,s*r,.31+.17*(i%3)],i===0?.23:.15,i%2?dark:light);}
    }else{
     for(let i=0;i<3;i++){const x=(i-1)*.29,z=.27+i*.19;
      splinter([x*.28,.03,z-.22],[x*1.35,trace?.40+i*.17:.20+i*.12,z+.35],.14,i===1?light:dark);}
     if(!trace)splinter([0,-.06,.05],[.015,.12,.96],.14,light);
    }break;
   case 'eco':
    if(seal){
     for(const s of paired){
      const start=s>0?-1.06:Math.PI-1.06;
      arc(.68,.57,.02,start,2.12,.057,light);arc(.94,.76,-.06,start+.14,1.84,.041,dark);
     }
     path(steps*2,t=>{const x=2*t-1;return [x*.83,.48*Math.sin(t*TAU*1.65)*Math.sin(t*Math.PI),.1,.035+.015*Math.sin(t*Math.PI)];},light,face);
    }else{
     for(const side of paired)path(steps*2,t=>[side*.18,.05+side*.26*Math.sin(TAU*t*1.75),t,.028+.031*Math.sin(Math.PI*t)],side<0?light:dark);
     for(const s of paired)arc(.42,.36,.64,s<0?2.28:-.86,1.72,.045,light);
    }break;
   case 'falcao':
    if(seal){
     for(const side of paired)for(let j=0;j<3;j++){const x=side*(.43+.26*j),y=.65-.20*j;
      stroke([[side*.04,-.38,0,.019],[x*.45,y*.19-.16,.12,.09],[x*.82,y*.66,.18,.125],[x,y,.25,.007]],j===1?dark:light,face,.39);}
    }else{
     for(const side of paired){const span=trace?.85:.43;
      path(steps,t=>[side*(.06+span*(1-t)**.74),.07+.23*Math.sin(Math.PI*t),t,.009+.063*Math.sin(Math.PI*t)],side<0?dark:light);
      for(let j=0;j<3;j++){const z=.18+.23*j,r=span*(1-z)**.74;
       splinter([side*(r+.05),.13,z],[side*(r+.25),.28+.06*j,z-.18],.073,j===1?dark:light);}}
    }break;
   case 'duna':
    if(seal){
     for(let j=0;j<3;j++){path(steps*2,t=>{const a=j*TAU/3+t*2.89,r=.20+.65*t;return [Math.cos(a)*r,Math.sin(a)*r,.25*t+.042*Math.sin(a*3),.018+.105*Math.sin(Math.PI*t)];},j===1?light:dark,face);}
     for(let i=0;i<5;i++){const a=i*2.4,x=Math.cos(a)*.92,y=Math.sin(a)*.89;splinter([x,y,0],[x+.07,y+.05,.11],.058,light);}
    }else{
     for(let i=0;i<2;i++){const side=i?1:-1;path(steps,t=>[side*.23+.21*Math.sin(t*TAU+side*.62),.06+.34*(1-t)*Math.sin(Math.PI*t),t,.014+(i?.075:.14)*Math.sin(t*Math.PI)],i?light:dark);}
     for(let i=0;i<(low?4:7);i++){const z=(i+.4)/(low?4:7),x=Math.sin(i*3.87)*.55,y=.12+.21*Math.sin(i*2.94)**2;splinter([x,y,z],[x+.035,y+.07,z+.065],.042,light);}
    }break;
   case 'ima':{
    const warm=['#f2a08f','#e38379','#ae6672','#f5bb99'],cool=['#a1e0df','#75bdce','#648ba3','#b4e4db'];
    if(seal){
     for(const side of paired){const ink=side<0?warm:cool;
      arc(.47,.73,.02,side<0?.88:4.03,3.97,.093,ink,side*.34);
      stroke([[side*.87,-.46,0,.041],[side*.87,-.73,.05,.081]],ink,face,.52);}
     for(const side of paired)splinter([side*.17,-.10,.12],[side*.40,.44,.19],.052,side<0?warm:cool);
    }else{
     for(const side of paired){const ink=side<0?warm:cool;path(steps,t=>{const bend=Math.sin(Math.PI*t);return [side*(.12+.51*bend),.12+.10*Math.sin(t*TAU)*side,t,.024+.048*bend];},ink);
      const s=side*.49;splinter([s,.13,.26],[s+side*.05,.16,.40],.055,ink);splinter([s,.08,.70],[s-side*.05,.075,.83],.048,ink);}
    }break;}
  }
  const geometry=sculpt(cells);signatureCache.set(key,geometry);return geometry;
 }
 function fistTrail(f,from,to,stage=0){
  if(!f||!signatureSizes[f.id])return;
  const direction=to.clone().sub(from),length=direction.length();if(length<.006)return;
  direction.multiplyScalar(1/length);
  const [thickness]=signatureSizes[f.id],tier=clamp(stage,0,2),size=thickness*(.57+tier*.15);
  const mark=carved(signatureGeometry(f.id,'stroke'),1),origin=from.clone();mark.position.copy(origin);oriented(mark,direction);mark.rotateZ(tier===1?.25:-.12);
  const alpha=calm()?.64:.90,life=f.id==='tormenta'?.135:.19+.028*tier;
  function draw(o,t){const tail=.26*ease(t);o.position.copy(origin).addScaledVector(direction,length*tail);o.scale.set(size*(1+.22*t),size*(1+.22*t),length*(1-tail));o.material.opacity=alpha*(1-smooth(t));}
  draw(mark,0);return add(mark,life,draw);
 }
 function fistImpact(f,pos,dir,stage=0){
  if(!f||!signatureSizes[f.id])return;
  const tier=clamp(stage,0,2),[radius,life]=signatureSizes[f.id],mark=carved(signatureGeometry(f.id,'seal'),1);
  const axis=dir.lengthSq()>1e-8?dir.clone().normalize():V(0,0,1),origin=pos.clone(),size=radius*(.95+tier*.27);
  const closes=f.id==='eclipse',sings=f.id==='eco',roll=f.id==='duna'?.79:closes?-.49:f.id==='mare'?.52:.06;
  mark.position.copy(pos);oriented(mark,axis);const orientation=mark.quaternion.clone(),alpha=calm()?.68:.94;
  function draw(o,t){const bloom=closes?1-.62*smooth(t):.31+.87*ease(t/.72)+(sings?.11*Math.sin(3*Math.PI*t):0);
   o.position.copy(origin).addScaledVector(axis,.20*size*t);o.quaternion.copy(orientation);o.rotateZ(roll*t);
   o.scale.set(size*bloom,size*bloom,size*(.6+.34*bloom));o.material.opacity=alpha*clamp((1-t)/.67);}
  if(tier===2){const accent=signaturePalette[f.id][0];sparks(pos,accent,(level()===2?3:6),f.id==='duna'?1.0:1.7,{gravity:f.id==='brasa'?-.40:1.7,life:.28,size:.035,stretch:f.id==='tormenta'?2.3:1});}
  draw(mark,0);return add(mark,life+(tier===2?.06:0),draw);
 }
 function dashFX(f,from,to,dir,phase,form='humana'){
  if(!f||!signatureSizes[f.id])return;
  const id=f.id,profile=signatureSizes[id],axis=to.clone().sub(from),length=axis.length(),trail=phase==='trail';
  if(trail&&length<.024)return;
  const heading=trail?axis.multiplyScalar(1/length):horizontalDir(dir);
  const bird=id==='falcao',wolf=id==='lobo',quadruped=wolf&&form==='completa',winged=bird&&form!=='humana';
  const width=profile[3]*(winged?1.42:quadruped?1.14:1);
  const groundMark=['geada','lobo','mare','duna','cristal','brasa'].includes(id);
  const rise=winged?(form==='completa'?.76:1.48):quadruped?.10:profile[4];
  const alpha=calm()?.61:trail?.76:.86;
  const mark=carved(signatureGeometry(id,trail?'trace':'seal'),alpha);
  const origin=(phase==='end'?to:from).clone();
  origin.y+=trail?rise:groundMark?.11:rise;mark.position.copy(origin);oriented(mark,heading);
  if(!trail&&groundMark)mark.rotateX(-Math.PI/2);
  const life=trail?profile[2]:phase==='start'?.25:profile[1];
  function draw(o,t){
   if(trail){const drift=id==='brasa'||id==='duna'?.16*t*t:bird?-.06*t:0;
    o.position.copy(origin);o.position.y+=drift;
    o.scale.set(width*(1+.12*t),width*(1-.22*t),length);o.material.opacity=alpha*(1-smooth(t));}
   else{const grow=id==='eclipse'&&phase==='end'?1-.73*ease(t):.29+.79*ease(t);
    o.scale.set(width*grow,width*grow*(bird?1.14:1),width*grow);o.material.opacity=alpha*clamp((1-t)/.68);}
  }
  draw(mark,0);return add(mark,life,draw);
 }

 // The effect follows the event's world coordinates. Release shows the path or field;
 // contact marks are produced only when the simulation reports a hit.
 const techniqueInks={
  impacto:[steelInk.blue,steelInk.brass],brasa:['#fa703f','#ffd786'],geada:['#7ccede','#e1ffff'],
  tormenta:['#edbd57','#fff1a1'],lobo:['#a3c4d6','#f6d19c'],eclipse:['#9675c0','#edc9ff'],
  mare:['#379fae','#c3f8e4'],cristal:['#d785b4','#ffe5df'],eco:[soundInk.lime,soundInk.mint],
  falcao:['#bda176','#e1e9dc'],duna:['#bb8248','#f1ce8b'],ima:['#ea8b7a','#99d8e6']
 };
 function techAnimate(root,life,pose){
  pose(root,0);return add(root,life,pose);
 }
 function techRoot(point,dir){
  const node=new T.Group();node.position.copy(point);
  if(dir)node.rotation.y=Math.atan2(dir.x,dir.z);
  return node;
 }
 function techPart(root,shape,c,opacity,lit=false){
  const m=mesh(shape,c,opacity*(calm()?.66:1),lit);root.add(m);return m;
 }
 function techRibbon(t,e){
  const a=-1.02+t*1.98,w=(.015+.13*Math.sin(Math.PI*t))*e,r=1+w;
  return [Math.sin(a)*r,.05+.20*Math.sin(Math.PI*t)+w*.36,Math.cos(a)*r];
 }
 const whipSurface=strip(soft?11:19,techRibbon,(i,t)=>t>.80?'#e4fff0':i%4?'#72d6d0':'#36a6b2');
 const windSurface=strip(soft?9:17,(t,e)=>{
  const x=t*2-1,w=(.012+.17*(1-Math.abs(x)))*e;
  return [x,.22*Math.abs(x)+w*.28,.24-.69*Math.pow(Math.abs(x),1.54)+w];
 },(i,t)=>t<.16||t>.84?'#d2b780':i%4?'#d2e9e4':'#8fb9b6');
 const duneSurface=(()=>{
  const cells=[],palette=['#e1b16c','#cea05d','#c18a50','#e8bf80','#edd29e','#ba8248'];
  const ridge=[[-1,0,0],[-.59,.40,.10],[-.15,.77,.03],[.31,.60,-.11],[.67,.27,-.13],[1,0,0]];
  for(let i=0;i<ridge.length-1;i++){
   const a=ridge[i],b=ridge[i+1];
   for(const sign of [-1,1]){
    const base=p=>[p[0],.015,sign*(.10+.70*Math.sin(Math.PI*(p[0]+1)*.5))+p[2]];
    cells.push([[base(a),base(b),b,a],palette[(i+(sign>0?3:0))%palette.length]]);
   }
  }return sculpt(cells);
 })();
 function techShellSurface(rose){
  const cells=[],n=rose?(soft?6:9):(soft?7:11);
  const lat=rose?[-.90,-.24,.44,1.16,1.57]:[-1.0,-.48,.18,.77,1.42];
  const colors=rose?['#b678ae','#f6c1d4','#ce8ab8','#fcdcca']:['#9adbe9','#7bbcd8','#cceefb','#b1dedf'];
  function point(i,j,d){const a=(i+(rose?j%2*.46:0))/n*TAU,phi=lat[j],r=Math.cos(phi)*d;return [Math.cos(a)*r,Math.sin(phi)*d,Math.sin(a)*r];}
  for(let j=0;j<lat.length-1;j++)for(let i=0;i<n;i++){
   const p=point(i,j,1),q=point(i+1,j,1),s=point(i,j+1,1),v=point(i+1,j+1,1);
   const panels=rose?[[p,q,s],[q,v,s]]:[[p,q,v,s]];
   for(let h=0;h<panels.length;h++){
    const face=panels[h],center=[0,1,2].map(k=>face.reduce((sum,x)=>sum+x[k],0)/face.length);
    const inset=rose?.875:.90;
    cells.push([face.map(pt=>pt.map((x,k)=>center[k]+(x-center[k])*inset)),colors[(i+(j+1)*2+h)%colors.length]]);
   }
  }return sculpt(cells);
 }
 const iceShell=techShellSurface(false),quartzShell=techShellSurface(true);
 function techCue(f,index,from,to,dir,r){
  const colors=techniqueInks[f.id],root=techRoot(from,dir);
  if(f.id==='impacto'){
   const heft=index===4?.71:.48;
   for(const s of [-1,1]){
    const shoe=carved(geo.piston,calm()?.65:.89);shoe.rotation.y=s*.30;root.add(shoe);
   }
   return techAnimate(root,.31,(o,t)=>{o.children.forEach((m,i)=>{
    m.position.set((i?1:-1)*(.16+.33*(1-smooth(t))),.02,.04+.10*t);
    m.scale.set(heft,.82*heft,.75*heft);});fade(o,clamp((1-t)/.23));});
  }
  if(f.id==='eco')return echoAnswer(from,dir,.52);
  const shapes=[geo.arc,geo.band],defense=index===4&&['impacto','geada','cristal'].includes(f.id);
  const size=defense?.46:.26;
  for(let i=0;i<2;i++){
   const m=techPart(root,shapes[i],colors[i],i?.33:.58);m.rotation.set(.32+i*1.05,.15*i,i*1.9);m.scale.setScalar(size*(i?.74:1));
  }
  if(index===4&&['brasa','tormenta','eclipse','mare','duna','ima'].includes(f.id))groundMark(to,colors[0],r,.47);
  return techAnimate(root,.32,(o,t)=>{
   const s=1.37-.76*smooth(t);o.scale.setScalar(s);o.children[0].rotation.z=2.8*t;
   fade(o,Math.sin(Math.PI*(.18+.82*t))*.76);
  });
 }
 function techGuard(id,origin,dir,r,life){
  const root=techRoot(origin,dir),ink=techniqueInks[id],size=clamp(r,1.05,1.64);
  if(id==='impacto'){
   for(const sign of [-1,1]){
    const shield=carved(geo.piston,calm()?.72:.92);root.add(shield);
    shield.position.set(sign*.34,.03,.29);shield.rotation.set(.04,sign*-.31,sign*-.21);shield.scale.set(.74,1.56,.48);
    const lug=block(root,V(sign*.47,-.43,.23),[.16,.27,.15],steelInk.brass,calm()?.64:.82);lug.rotation.z=sign*-.23;
   }
  }else{
   const rose=id==='cristal',node=carved(rose?quartzShell:iceShell,calm()?.25:.40);root.add(node);
   node.scale.set(size,1.64,size);node.position.y=-.15;
   const n=soft?4:6;for(let i=0;i<n;i++){
    const a=TAU*i/n,m=rose?carved(geo.quartz,.82):mesh(geo.ice,ink[i%2],.73,true);
    m.position.set(Math.cos(a)*size*.78,-.83+.16*(i%2),Math.sin(a)*size*.78);m.rotation.set(.19*Math.sin(a),a,-.19*Math.cos(a));
    m.scale.set(rose?.33:.10,rose?.81:.56,rose?.33:.10);root.add(m);
   }
   const belt=techPart(root,geo.band,ink[1],.46);belt.rotation.x=-Math.PI/2+.08;belt.scale.set(size,size,1);belt.position.y=-.19;
  }
  return techAnimate(root,life,(o,t)=>{
   const enter=.82+.18*ease(t/.14),exit=1-.12*smooth((t-.86)/.14);
   o.scale.setScalar(enter*exit);fade(o,clamp(t/.07)*clamp((1-t)/.15));
  });
 }
 function techAshFan(point,dir){
  const root=techRoot(point,dir),n=soft?5:7;
  for(let i=0;i<n;i++){
   const m=techPart(root,geo.flame,i%2?'#f89756':'#ffdaa0',.78);m.rotation.x=Math.PI/2;
  }
  return techAnimate(root,.37,(o,t)=>{
   const v=ease(t);o.children.forEach((m,i)=>{
    const angle=(i/(n-1)-.5)*1.03,k=(.72+.14*(i%3))*v;
    m.position.set(Math.sin(angle)*k,(i%2?.10:-.07)+Math.sin(t*Math.PI)*.09,Math.cos(angle)*k);
    m.rotation.z=-angle;m.scale.set(.060*(1-.5*t),.19+.38*v,.052);
   });fade(o,clamp((1-t)/.43));
  });
 }
 function techCraters(point,r,life){
  const root=techRoot(point),n=soft?7:10;
  for(let i=0;i<n;i++){
   const a=TAU*i/n,m=techPart(root,geo.arc,i%3?'#ed813f':'#ffdb81',.66);
   m.rotation.set(-Math.PI/2,0,-a);m.position.set(Math.sin(a)*r*.56,.07,Math.cos(a)*r*.56);m.scale.set(r*.22,r*.12,1);
  }
  return techAnimate(root,life,(o,t)=>{o.scale.setScalar(.85+.15*smooth(t/.25));fade(o,(.55+.37*Math.sin(t*Math.PI))*clamp((1-t)/.12));});
 }
 function techIcePath(a,b,dir){
  const start=floorAt(a,.065),root=techRoot(start,dir),n=soft?5:8;
  const length=clamp(Math.hypot(b.x-a.x,b.z-a.z),.85,10);
  for(let i=0;i<n;i++){
   const m=techPart(root,geo.ice,i%3?'#99d9eb':'#dcf7fc',.82,true);
   m.position.set((i%2?1:-1)*.26,0,length*(i+.5)/n);m.rotation.set(.33,i*1.79,(i%2?1:-1)*.20);
  }
  return techAnimate(root,.94,(o,t)=>{
   o.children.forEach((m,i)=>{const u=clamp((t-i/n*.59)/.29),h=(.8+.28*(i%3))*ease(u);
    m.scale.set(.20*u,h,.27*u);m.position.y=.08+h*.44;});fade(o,clamp((1-t)/.25));
  });
 }
 function techSweep(point,dir,r,wind){
  const root=techRoot(point,dir),cut=carved(wind?windSurface:whipSurface,calm()?.64:.89);
  const lip=carved(wind?windSurface:whipSurface,.48);root.add(cut,lip);
  const life=wind?.42:.38;
  return techAnimate(root,life,(o,t)=>{
   const k=ease(t),reach=wind?r:clamp(r,.9,5.5);
   if(wind){const w=.38+.77*k;for(const [i,m] of o.children.entries()){
     m.position.set(0,i*.12,(reach*(.13+.77*t))-.19*i);m.rotation.set(.09,0,(i?.10:-.07)+t*.05);m.scale.set(w*(.83+.12*i),1.2,w*1.12);}}
   else{for(const [i,m] of o.children.entries()){
     const q=clamp(t-i*.09);m.rotation.set(.09,(-.57+.99*ease(q)),.11-i*.17);m.position.y=.10*i;
     const s=reach*(.40+.54*ease(q));m.scale.set(s,1.8,s);}}
   fade(o,clamp(t/.08)*clamp((1-t)/.30));
  });
 }
 function techTwinEcho(from,to,dir){
  const root=techRoot(from,dir),length=clamp(Math.hypot(to.x-from.x,to.z-from.z),.85,9);
  const n=level()===2?4:6;
  for(let i=0;i<n;i++){const front=carved(i<2?geo.echoLine:geo.echoNote,calm()?.59:.84);root.add(front);}
  return techAnimate(root,.55,(o,t)=>{
   o.children.forEach((m,i)=>{const sign=i%2?1:-1,u=clamp((t-Math.floor(i/2)*.11)/.80);
    m.position.set(sign*.63,sign*.18*Math.sin(u*TAU),length*u);
    if(i<2){m.scale.set(.58+.15*u,.71,1);m.rotation.z=sign*.32;}
    else{m.scale.setScalar(.36+.09*Math.sin(u*Math.PI));m.rotation.set(0,u*2.4,sign*.18);}
   });
   fade(o,clamp(t/.08)*clamp((1-t)/.25));
  });
 }
 function techSpout(point,r,wind){
  const root=techRoot(point),n=soft?2:3,inks=wind?['#a9cec7','#e6dfa9']:['#42aebc','#c7f3e3'];
  for(let i=0;i<n;i++){const m=techPart(root,geo.flare,inks[i%2],i%2?.74:.61);m.material.vertexColors=true;}
  const h=wind?3.0:3.35;
  return techAnimate(root,wind?.85:.72,(o,t)=>{
   const k=ease(t/.29),out=clamp((1-t)/.31);o.children.forEach((m,i)=>{
    m.rotation.y=i*TAU/n+t*(wind?4.7:3.5);m.position.y=t*(wind?.83:.28);m.scale.set(r*k*(.76+.14*i),h*k*(.84+.12*i),r*k*(.76+.14*i));
   });fade(o,out);
  });
 }
 function techDunes(point,dir,r){
  const root=techRoot(point,dir),span=clamp(r*.45,.5,1.55);
  for(const sign of [-1,1]){
   const m=carved(duneSurface,.93);m.position.set(sign*span,.055,sign*.31);
   m.rotation.y=sign*.45;root.add(m);
  }
  return techAnimate(root,1.1,(o,t)=>{o.children.forEach((m,i)=>{
   const u=clamp((t-.21*i)/.64),grow=ease(u/.38),settle=1-.69*smooth((u-.61)/.39);
   m.scale.set(span*(.67+.63*grow),grow*settle*(1.19+.30*i),span*(.52+.39*grow));
  });fade(o,clamp((1-t)/.24));});
 }
 function techSink(point,r,life){
  const root=techRoot(point),base=techPart(root,geo.disk,'#835c3c',.52);
  base.rotation.x=-Math.PI/2;base.position.y=.065;base.scale.setScalar(r);
  const sandColors=['#cf9555','#e0b17a','#f1cb91'];
  for(let i=0;i<(soft?3:5);i++){const m=techPart(root,geo.arc,sandColors[i%3],.72);m.rotation.x=-Math.PI/2;}
  return techAnimate(root,life,(o,t)=>{const edge=.70+.30*ease(t/.19);
   for(let i=1;i<o.children.length;i++){
    const m=o.children[i],rad=r*(.23+.77*(1-(t*1.4+i/(o.children.length-1))%1))*edge;
    m.rotation.z=i*1.60+t*(2.4+.13*i);m.position.y=.07+.006*i;m.scale.set(rad,rad*.94,1);
   }fade(o,clamp(t/.05)*clamp((1-t)/.24));
  });
 }
 function techRails(a,b,dir){
  const root=techRoot(a,dir),length=clamp(Math.hypot(b.x-a.x,b.z-a.z),.8,12);
  for(const sign of [-1,1]){
   const x=sign*.12,col=sign<0?'#e88b78':'#9fdae8';beam(root,V(x,0,.10),V(x,0,length),col,.043,.70);
   const slug=techPart(root,geo.orb,col,.91);slug.scale.set(.085,.07,.27);slug.userData.slug=sign;
  }
  return techAnimate(root,.33,(o,t)=>{for(const m of o.children)if(m.userData.slug)m.position.set(m.userData.slug*.12,0,length*t);
   fade(o,clamp((1-t)/.58));});
 }
 function techPole(point,r){
  const root=techRoot(point);
  const spike=techPart(root,geo.ice,'#f3c867',.84,true);spike.position.y=.60;spike.scale.set(.11,1.17,.11);
  for(let i=0;i<2;i++){const c=techPart(root,geo.band,i?'#f1be57':'#fff1b9',.62);c.rotation.x=-Math.PI/2;}
  return techAnimate(root,1.26,(o,t)=>{o.children.slice(1).forEach((m,i)=>{const u=(t*1.6+i*.5)%1;m.position.y=.15+u*1.32;m.scale.setScalar(r*(.19+.26*(1-u)));});fade(o,clamp(t/.08)*clamp((1-t)/.22));});
 }
 function techEclipse(point,dir,r,twins){
  const root=techRoot(point,dir),n=twins?2:3;
  for(let i=0;i<n;i++){
   const m=techPart(root,twins?geo.band:geo.inflow,i%2?'#dbc4ee':'#9e7fc3',.66);
   m.material.vertexColors=!twins;
  }
  const core=techPart(root,geo.orb,'#29223c',.83);core.position.y=.76;
  return techAnimate(root,twins?.64:1.10,(o,t)=>{
   const k=ease(t),rad=clamp(r,.6,4);
   for(let i=0;i<n;i++){const m=o.children[i];
    if(twins){
     const side=i?1:-1;m.position.set(side*rad*.56*(1-k),.95+.16*Math.sin(Math.PI*t),side*.12);m.rotation.set(-.17,side*.47,side*(.38+t));m.scale.set(.19+.13*(1-k),(.66+.33*Math.sin(t*Math.PI))*Math.min(1.8,rad),1);
    }else{m.rotation.y=TAU*i/n+t*3.9;const width=rad*(1-.56*k);m.scale.set(width,.37+1.32*k,width);}}
   core.scale.setScalar(twins?.12+.28*k:.12+.40*k);fade(o,clamp(t/.08)*clamp((1-t)/.21));
  });
 }
 function techPolar(point,r){
  const root=techRoot(point),n=soft?4:6;
  for(let i=0;i<n;i++){const m=techPart(root,geo.arc,i%2?'#92d6e8':'#e58878',.71);m.rotation.x=-Math.PI/2+(i%2?.21:-.21);}
  return techAnimate(root,.90,(o,t)=>{
   const turn=t<.58?1-.75*smooth(t/.58):.25+.75*ease((t-.58)/.42);
   o.children.forEach((m,i)=>{const band=r*turn*(.41+.10*i);m.scale.set(band,band*.87,1);m.rotation.z=TAU*i/n+(i%2?1:-1)*t*2.4;m.position.y=.12+i*.12;});
   fade(o,clamp(t/.08)*clamp((1-t)/.27));
  });
 }
 function techContact(f,index,a,b,dir,r){
  const ink=techniqueInks[f.id],s=clamp(r*.30,.38,.95),ground=floorAt(b,.075);
  switch(f.id){
   case 'impacto':return kineticBurst(b,dir,s*1.12,.34,false);
   case 'brasa':sparks(b,ink[1],index===4?9:5,2.5,{gravity:index===4?-1.4:.9,stretch:2.3,size:.045,life:.41});break;
   case 'geada':if(index===4)fracture(b,Math.atan2(dir.x,dir.z));else sparks(b,ink[1],6,2.1,{gravity:5,size:.055,life:.40,stretch:1.8});break;
   case 'tormenta':{
    const start=index===3?a:b.clone().add(V(-.24,2.85,.13));lightning(start,b,ink[0],.23);break;}
   case 'lobo':if(index===3){const rim=pulse(b,ink[1],s*.72,.23,true);oriented(rim,dir);}else talons(b.clone().add(V(-.24,.33,0)),b.clone().addScaledVector(dir,.40).add(V(.23,-.18,0)),1);break;
   case 'eclipse':{
    const n=techRoot(b,dir),o=techPart(n,geo.arc,ink[1],.82);o.rotation.z=-.62;
    return techAnimate(n,.31,(root,t)=>{const k=ease(t);o.scale.set(.11+.61*(1-k),.21+.70*(1-k),1);o.rotation.z=-.62+k;fade(root,1-t);});}
   case 'mare':sparks(b,ink[1],7,2.22,{gravity:6.2,size:.063,life:.39,stretch:1.8});break;
   case 'cristal':sparks(b,ink[1],7,2.75,{gravity:5.3,size:.059,life:.42,stretch:2.1});break;
   case 'eco':return echoAnswer(b,dir,index===3?.48:.70);
   case 'falcao':return feathers(b,dir,.54);
   case 'duna':sparks(ground,ink[1],8,2.0,{gravity:4.5,spread:.35,size:.065,life:.53});break;
   case 'ima':{
    const stem=index===3?b.clone().addScaledVector(dir,-.86):a.clone().lerp(b,.55);return magnet(stem,b,.24,index===4);}
  }
 }
 function technique(f,index,phase,from,to,dir,radius=1,duration){
  if(!techniqueInks[f.id]||(index!==3&&index!==4))return;
  const heading=horizontalDir(dir),r=clamp(radius,.22,14),a=from.clone(),b=to.clone();
  if(phase==='cast')return techCue(f,index,a,b,heading,r);
  if(phase==='hit')return techContact(f,index,a,b,heading,r);
  const ground=floorAt(b,.07),originGround=floorAt(a,.07);
  if(phase==='strike'){
   if(f.id==='brasa'&&index===4){fire(ground,r*.62,2.9,.62);return pulse(ground,'#ffd282',r,.49);}
   if(f.id==='tormenta'&&index===4)return lightning(ground.clone().add(V(.12,3.9,-.20)),ground,f.color,.23);
   if(f.id==='eclipse'&&index===4)return pulse(ground,'#d9b5fa',r,.39);
   if(f.id==='duna'&&index===3)return sand(ground,Math.min(1.45,r),.46);
   return;
  }
  if(phase!=='release')return;
  const side=V(heading.z,0,-heading.x);
  if(index===4&&['impacto','geada','cristal'].includes(f.id))return techGuard(f.id,a,heading,r,duration||(f.id==='impacto'?.81:1.32));
  switch(f.id){
   case 'impacto':return kineticBurst(ground,heading,r,.66);
   case 'brasa':return index===3?techAshFan(a,heading):techCraters(ground,r,duration||.76);
   case 'geada':return techIcePath(a,b,heading);
   case 'tormenta':{
    if(index===4)return techPole(ground,r);
    const root=techRoot(a,heading),join=V(0,-.03,.68);beam(root,V(),join,'#fff1a1',.047,.78);
    for(const s of [-1,1]){const fork=V(s*.31,.20,1.16);beam(root,join,fork,'#f1c66c',.052,.76);beam(root,fork,V(s*.48,.12,1.57),'#ffeca4',.029,.80);}
    return techAnimate(root,.29,(o,t)=>{o.scale.z=.23+.77*ease(t/.37);fade(o,clamp((1-t)/.72));});}
   case 'lobo':{
    if(index===4){const path=a.clone().addScaledVector(heading,1.48);talons(a.clone().addScaledVector(side,-.20),path.clone().addScaledVector(side,.22),1);return talons(a.clone().addScaledVector(side,.20),path.clone().addScaledVector(side,-.22),-1);}
    const root=techRoot(a,heading);for(let i=0;i<3;i++){const m=techPart(root,geo.arc,i%2?'#f5cf95':'#b6d9e7',.70);m.rotation.z=i*2.05;}
    const length=clamp(Math.hypot(b.x-a.x,b.z-a.z),1,8);return techAnimate(root,.48,(o,t)=>{
     o.children.forEach((m,i)=>{const u=clamp((t-i*.085)/.83),s=.19+u*1.24;m.position.z=u*length;m.scale.set(s,s*.70,1);});fade(o,clamp(t/.08)*clamp((1-t)/.30));
    });}
   case 'eclipse':return techEclipse(ground,heading,r,index===3);
   case 'mare':return index===3?techSweep(a,heading,r,false):techSpout(ground,r,false);
   case 'cristal':{
    const root=techRoot(a,heading);for(const sign of [-1,0,1]){const m=carved(geo.quartz,.84);m.rotation.set(Math.PI/2,0,sign*.53);m.position.x=sign*.18;root.add(m);}
    return techAnimate(root,.35,(o,t)=>{o.children.forEach((m,i)=>{const sign=i-1,k=ease(t);m.position.set(sign*(.16+.40*k),.09*Math.sin(t*Math.PI),.24+.41*k);m.scale.set(.25,.51,.25);});fade(o,clamp((1-t)/.57));});}
   case 'eco':return index===3?techTwinEcho(a,b,heading):echoMark(b,duration||.95);
   case 'falcao':return index===3?techSweep(a,heading,clamp(Math.hypot(b.x-a.x,b.z-a.z),.8,10),true):techSpout(originGround,r,true);
   case 'duna':return index===3?techDunes(ground,heading,r):techSink(ground,r,duration||1.9);
   case 'ima':return index===3?techRails(a,b,heading):techPolar(ground,r);
  }
 }

 function retire(root){const i=items.findIndex(item=>item.root===root);if(i>=0){dispose(root);items.splice(i,1);}}
 // Local +Z spans the measured strike. Relief on both sides of each tapered line
 // keeps it visible when the player turns the camera edge-on to the movement.
 const basicStrokeCache = new Map();
 const plainInk = ['#f6e8cc', '#bccbc4', '#768a89'];
 function basicLimb(id, form, tier) {
  if (form === 'hibrida' && id === 'falcao') return ['talon', 'wing', 'talon'][tier];
  if (form === 'completa' && id === 'falcao') return ['beak', 'talon', 'wing'][tier];
  if (form === 'hibrida' && id === 'lobo') return 'claw';
  if (form === 'completa' && id === 'lobo') return 'bite';
  return 'fist';
 }
 function basicBasis(node, axis, facing) {
  const forward = horizontalDir(facing);
  const right = V(forward.z, 0, -forward.x);
  right.addScaledVector(axis, -right.dot(axis));
  if (right.lengthSq() < .004) right.crossVectors(V(0, 1, 0), axis);
  right.normalize();
  node.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right, V().crossVectors(axis, right), axis));
 }
 function basicStroke(limb, tier, contact) {
  const simple = soft || level() > 0;
  const key = [limb, tier, contact, simple].join('/');
  if (basicStrokeCache.has(key)) return basicStrokeCache.get(key);
  const cells = [], steps = simple ? 5 : 9, sense = tier === 1 ? -1 : 1;
  const faces = ['#fcfffc', '#d7e3df', '#89979c', '#bccacb'];
  // A section is a diamond. The end caps taper to a single tip.
  function line(samples) {
   let last;
   for (let i = 0; i < samples.length; i++) {
    const [x,y,z,width] = samples[i], p = V(x,y,z);
    const a = samples[Math.max(0,i-1)], b = samples[Math.min(samples.length-1,i+1)];
    const along = V(b[0]-a[0], b[1]-a[1], b[2]-a[2]).normalize();
    const normal = contact && Math.abs(along.z) < .88 ? V(0,0,1) : Math.abs(along.y) < .88 ? V(0,1,0) : V(1,0,0);
    const side = V().crossVectors(normal, along).normalize(), ridge = V().crossVectors(along, side).normalize();
    const section = [[side,width], [ridge,width*.55], [side,-width], [ridge,-width*.55]].map(([v,s])=>p.clone().addScaledVector(v,s).toArray());
    if (last) for (let k=0;k<4;k++) {
     const next=(k+1)%4;
     cells.push([[last[k],section[k],section[next],last[next]],faces[k]]);
    }
    last=section;
   }
  }
  function curve(fn) {
   line(Array.from({length:steps+1},(_,i)=>{const t=i/steps;return fn(t,Math.sin(Math.PI*t));}));
  }
  if (!contact) {
   if (limb==='claw' || limb==='talon') {
    const hook=limb==='talon', stripes=hook?2:3;
    for (let i=0;i<stripes;i++) {
     const n=i-(stripes-1)/2;
     curve((t,b)=>[n*.27+sense*(hook?.48:.54)*b, n*.12+(hook?.62:.26)*b, t, .006+(.075+.016*tier)*b]);
    }
   } else if (limb==='bite' || limb==='beak') {
    const fang=limb==='bite';
    for (const sign of [-1,1]) {
     curve((t,b)=>[sign*(fang?.14:.24)*(1-t)+sense*.09*b, sign*(fang?.58:.22)*(1-t)*(1+.29*b), t, .005+(fang?.12:.10)*b]);
    }
   } else if (limb==='wing') {
    for(let i=0;i<3;i++) curve((t,b)=>[sense*((i-1)*.30*(1-t)+(.43+i*.17)*b), (i-1)*.12*b, t*(1-i*.09), .009+(.14-i*.026)*b]);
   } else {
    const bend=[.035,-.23,.66][tier], lift=[.06,.11,.47][tier];
    curve((t,b)=>[bend*b,lift*b,t,.008+(.13+.045*tier)*b]);
    if(tier>0) curve((t,b)=>[bend*b-.23*(1-t),lift*b+.16*(1-t),.05+.84*t,.006+.056*b]);
   }
  } else if (limb==='claw' || limb==='talon') {
   const n=limb==='claw'?3:2;
   for(let i=0;i<n;i++) {
    const dx=(i-(n-1)/2)*.31;
    curve((t,b)=>[dx+sense*(-.49+.90*t+.14*b),.64-1.17*t+.12*b,.12+.22*b,.009+.086*b]);
   }
  } else if (limb==='bite') {
   for(const sign of [-1,1]) for(const side of [-1,1]) {
    line([[side*.48,sign*.62,0,.012],[side*.39,sign*.48,.15,.12],[side*.20,sign*.15,.26,.009]]);
   }
  } else if (limb==='beak') {
   line([[0,0,-.34,.015],[0,0,.02,.185],[0,0,.64,.010]]);
   for(const side of [-1,1]) line([[side*.13,.01,.09,.022],[side*.38,.19,.04,.083],[side*.72,.25,-.12,.006]]);
  } else if (limb==='wing') {
   for(let i=0;i<4;i++) {
    const a=-1.30+i*.70;
    curve((t,b)=>[sense*(-.47+Math.cos(a)*t*1.18),Math.sin(a)*t+.17*b,.08+.19*b,.008+(.105-i*.010)*b]);
   }
  } else {
   const rays=3+tier;
   for(let i=0;i<rays;i++) {
    const a=i*TAU/rays+.39+sense*.18, c=Math.cos(a),s=Math.sin(a),r=.7+.24*(i%2);
    line([[.09*c,.09*s,-.025,.014],[.36*c,.36*s,.10,.11],[r*c,r*s,.24,.007]]);
   }
  }
  const g=sculpt(cells);basicStrokeCache.set(key,g);return g;
 }
 function basicSwing({from,to,dir,fruit,form='humana',strike=0}) {
  const tier=clamp(strike,0,2), id=fruit?.id, limb=basicLimb(id,form,tier);
  const travel=to.clone().sub(from), length=travel.length();
  punchAccent({from,to,dir,fruit,strike,form});
  if(length<.012) return;
  const axis=travel.multiplyScalar(1/length), root=new T.Group(), origin=from.clone();
  basicBasis(root,axis,dir);
  const ink=signaturePalette[id]||plainInk, elemental=limb==='fist'&&Boolean(signatureSizes[id]);
  const alpha=calm()?.50:.72, width=Math.min(.48+.12*tier,.16+length*.48);
  const ribbon=carved(basicStroke(limb,tier,false),alpha);ribbon.material.color.set(ink[elemental?1:0]);root.add(ribbon);
  if(elemental) {
   const pattern=carved(signatureGeometry(id,'stroke'),alpha*.91);
   pattern.rotateZ([-.09,.28,-.36][tier]);pattern.scale.set(.87,.87,1);root.add(pattern);
  }
  function pose(o,t) {
   const trim=.41*ease(t),s=width*(1-.18*t);
   o.position.copy(origin).addScaledVector(axis,length*trim);
   o.scale.set(s,s,length*(1-trim));fade(o,1-smooth(t));
  }
  return techAnimate(root,[.145,.174,.216][tier],pose);
 }
 function basicContact({point,dir,fruit,form='humana',strike=0}) {
  const tier=clamp(strike,0,2), id=fruit?.id, limb=basicLimb(id,form,tier);
  punchAccent({from:point,to:point,dir,fruit,strike,form},true);
  if(id==='brasa'){
   const scale=.7+tier*.22;
   sparks(point,'#ffa02b',soft||level()>0?7:12,3.5*scale,{gravity:-.6,life:.38,size:.065,stretch:2.3});
   if(tier===2)fire(point,.52,1.04,.34);
  }else if(id==='lobo'){
   const side=V(dir.z,0,-dir.x),start=point.clone().addScaledVector(side,-.40).add(V(0,.38,0));
   const end=point.clone().addScaledVector(side,.55+tier*.13).add(V(0,-.35,0));
   talons(start,end,tier===1?-1:1,form==='completa');
  }else if(id==='falcao'){
   feathers(point,dir,.63+tier*.18);
  }
  const ink=signaturePalette[id]||plainInk, elemental=limb==='fist'&&Boolean(signatureSizes[id]);
  const axis=dir.lengthSq()>.0001?dir.clone().normalize():V(0,0,1);
  const root=new T.Group(), origin=point.clone(), alpha=calm()?.61:.92;
  basicBasis(root,axis,dir);root.rotateZ([-.15,.24,-.37][tier]);
  const singing=id==='eco',press=id==='impacto';
  const stamp=carved(singing?geo.echoNote:basicStroke(limb,tier,true),alpha);
  if(!singing)stamp.material.color.set(ink[0]);
  stamp.scale.setScalar(singing?.82:elemental?.43:1);root.add(stamp);
  if(elemental) root.add(carved(signatureGeometry(id,'seal'),alpha*.93));
  const size=[.38,.49,.65][tier]*(limb==='beak'?.87:1);
  if(tier===2&&!calm()) sparks(point,press?steelInk.brass:ink[1],soft||level()>0?3:5,1.35,{gravity:id==='brasa'?-.3:1.25,size:.032,life:.20,stretch:id==='tormenta'?2.3:1.45});
  function pose(o,t) {
   let spread=elemental&&id==='eclipse'?1-.60*smooth(t):.42+.65*ease(t/.57);
   if(singing){spread+=.12*Math.sin(3* t*Math.PI);stamp.position.y=.37*t;stamp.rotation.y=t*1.65;}
   if(press)spread=(.48+.84*ease(t/.30))*(1-.23*smooth((t-.33)/.67));
   o.position.copy(origin).addScaledVector(axis,size*.16*t);
   o.scale.set(size*spread,size*spread,size*(.58+.38*spread));
   fade(o,1-smooth((t-.18)/.82));
  }
  return techAnimate(root,(singing?.13:0)+[.17,.205,.265][tier],pose);
 }

 // Faceted flame tongues, hooked claws, and flight feathers share rigid assets.
 const mantleShapes=new Map();
 function mantleShape(kind){
  if(mantleShapes.has(kind))return mantleShapes.get(kind);
  const cells=[];
  // Each cross section specifies height, lateral bend, width and thickness.
  function blade(sections,palette){
   let last;
   for(const [y,x,w,d] of sections){
    const ring=[[x-w,y,0],[x,y,d],[x+w,y,0],[x,y,-d]];
    if(last)for(let i=0;i<4;i++){const j=(i+1)%4;cells.push([[last[i],ring[i],ring[j],last[j]],palette[i]]);}
    last=ring;
   }
  }
  if(kind==='fire'){
   blade([[0,0,.15,.13],[.18,.01,.25,.20],[.48,.09,.17,.13],[.71,.015,.12,.08],[1,.19,.006,.004]],['#ff7928','#ffcf45','#ff5a17','#d9341e']);
   blade([[.03,0,.12,.11],[.19,-.12,.14,.13],[.43,-.19,.08,.08],[.64,-.16,.003,.004]],['#ff9c21','#fff092','#ffb631','#ff7027']);
  }else if(kind==='feather'){
   blade([[0,0,.018,.02],[.23,.035,.16,.052],[.51,.12,.19,.082],[.79,.20,.095,.045],[1,.28,.004,.003]],['#ffd986','#ffedba','#ad6b32','#efab4c']);
   blade([[0,0,.012,.014],[.50,.12,.016,.096],[1,.28,.002,.006]],['#fff4c9','#fff7db','#dbb168','#fff4c9']);
  }else{
   blade([[0,0,.075,.064],[.20,.018,.105,.073],[.58,.10,.066,.052],[.83,.225,.032,.029],[1,.37,.002,.002]],['#def8ff','#fff9de','#83b6d6','#6096bf']);
  }
  const g=sculpt(cells);mantleShapes.set(kind,g);return g;
 }

 function punchMantle(fruit,strike,form,contact){
  const id=fruit?.id;
  if(!['brasa','lobo','falcao'].includes(id))return null;
  const fire=id==='brasa',bird=id==='falcao',bite=form==='completa'&&id==='lobo';
  const beak=bird&&form==='completa'&&contact==='boca';
  const wing=bird&&(String(contact).includes('asa')||form==='hibrida'&&strike===1);
  const tier=clamp(strike,0,2),low=soft||level()===2,root=new T.Group(),limb=new T.Group();
  root.add(limb);scene.add(root);root.visible=false;
  const shapes=[],count=fire?(low?4:7):bite?4:beak?2:wing?4:3;
  const shape=mantleShape(fire?'fire':bird&&!beak?'feather':'claw');
  for(let i=0;i<count;i++){const m=carved(shape,1);limb.add(m);shapes.push(m);}
  let spiral;
  if(fire){
   spiral=mesh(geo.flare,'#ffb539',.75);limb.add(spiral);
  }
  const tracks=fire?(low?2:3):bite?4:beak?2:3,steps=low?6:10;
  const points=new Float32Array(tracks*(steps+1)*9),inks=[],indices=[],polygons=[];
  const shades=fire?['#d63c29','#fff08b','#ff972c']:bird?['#b98342','#fff6cc','#ffbf5b']:['#4c80b0','#f0ffff','#a9deff'];
  const shadesLinear=shades.map(c=>new T.Color(c));
  for(let lane=0;lane<tracks;lane++){
   for(let i=0;i<=steps;i++){
    for(const c of shadesLinear)inks.push(c.r,c.g,c.b);
    if(i===steps)break;
    const a=(lane*(steps+1)+i)*3;
    for(let edge=0;edge<2;edge++){
     const n=a+edge;indices.push(n,n+1,n+4,n,n+4,n+3);polygons.push([n,n+1,n+4,n+3]);
    }
   }
  }
  // Ribbons have an actual ridge, so the same trail reads from a side view.
  const g=new T.BufferGeometry(),position=new T.BufferAttribute(points,3);
  position.setUsage(T.DynamicDrawUsage);g.setAttribute('position',position);g.setAttribute('color',new T.Float32BufferAttribute(inks,3));g.setIndex(indices);
  g.userData.ephemeralFX=true;g.userData.dynamicFXRadius=6;g.userData.polygons=polygons;
  g.boundingSphere=new T.Sphere(V(),6);
  const ribbon=carved(g,.86);root.add(ribbon);
  const samples=Array.from({length:steps+1},()=>({tip:V(),side:V(),up:V()}));
  const axis=V(),side=V(),up=V(),worldUp=V(0,1,0),align=V(0,-1,0);
  const previousTip=V(),previousSide=V(),previousUp=V(),center=V();
  let lastSample=0,lastProgress=0,initialized=false,removed=false;
  function seek(elbow,tip,progress){
   if(removed)return;
   const t=clamp(progress),strength=smooth(t/.115)*(1-smooth((t-.67)/.32));
   root.visible=strength>.002;if(!root.visible)return;
   root.position.copy(tip);
   axis.subVectors(tip,elbow);const length=clamp(axis.length(),.23,1.45);
   if(axis.lengthSq()<.00001)axis.set(0,0,1);else axis.normalize();
   side.crossVectors(worldUp,axis);
   if(side.lengthSq()<.01){
    if(initialized)side.copy(previousSide);
    else side.set(1,0,0);
    side.addScaledVector(axis,-side.dot(axis));
    if(side.lengthSq()<.001)side.set(0,0,1);
   }
   side.normalize();if(initialized&&side.dot(previousSide)<0)side.negate();
   up.crossVectors(axis,side).normalize();
   // Local +Y points back toward the elbow. Flames lick up the striking arm.
   limb.quaternion.setFromUnitVectors(align,axis);
   const charge=(.79+.21*strength)*(1+.16*tier),opacity=(calm()?.68:.94)*strength;
   shapes.forEach((m,i)=>{
    if(fire){
     const a=TAU*i/count+t*(calm()?1.6:3.5),v=.5+.5*Math.sin(t*10+i*2.4);
     const rad=(.235+.045*v)*charge;
     m.position.set(Math.cos(a)*rad,(-.18+.22*(i%3))*length,Math.sin(a)*rad);
     m.rotation.set(.19*Math.sin(a),-a,.18*Math.cos(a));
     m.scale.set(.72*charge,(.55+.35*v+.36*length)*charge,.71*charge);
    }else{
     const x=(i-(count-1)*.5);
     if(bite||beak){
      const sign=i%2?1:-1;
      m.position.set(bite?(i<2?-.18:.18):0,-.07,sign*(bite?.16:.105));
      m.rotation.set(Math.PI+sign*.67,0,(bite?(i<2?1:-1):sign)*.10);
      m.scale.setScalar((bite?.40:.32)*charge);
     }else{
      m.position.set(x*(wing?.16:.115),wing?.10*Math.abs(x):.025,x*.041);
      m.rotation.set(Math.PI-.16,Math.PI/2,x*(wing?.25:.16));
      m.scale.set(charge*(bird?.72:1),charge*(wing?.68:.49)*(1-.1*Math.abs(x)),charge*.83);
     }
    }
    m.material.opacity=opacity;
   });
   if(spiral){
    spiral.position.y=-.13;spiral.rotation.y=t*4.1;spiral.scale.set(.44*charge,length+.25,.44*charge);spiral.material.opacity=opacity*.76;
   }
   if(!initialized){
    for(const sample of samples){sample.tip.copy(tip);sample.side.copy(side);sample.up.copy(up);}
    initialized=true;lastSample=t;
   }else{
    // Sample a fixed fraction of the swing, including frames that span several samples.
    const spacing=.30/steps;
    while(lastSample+spacing<=t){
     lastSample+=spacing;
     const blend=clamp((lastSample-lastProgress)/(t-lastProgress));
     const saved=samples.pop();samples.splice(1,0,saved);
     saved.tip.lerpVectors(previousTip,tip,blend);
     saved.side.lerpVectors(previousSide,side,blend).normalize();
     saved.up.lerpVectors(previousUp,up,blend).normalize();
    }
   }
   samples[0].tip.copy(tip);samples[0].side.copy(side);samples[0].up.copy(up);
   lastProgress=t;previousTip.copy(tip);previousSide.copy(side);previousUp.copy(up);
   for(let lane=0;lane<tracks;lane++){
    const n=lane-(tracks-1)*.5;
    for(let i=0;i<=steps;i++){
     const s=samples[i],u=i/steps,envelope=Math.sin(Math.PI*(.08+.92*u));
     const spread=(bite?(lane<2?-.17:.17):n*(wing?.18:fire?.22:.15))*charge;
     const lift=bite?(lane%2?1:-1)*.18:beak?(lane===0?-.13:.13):n*.068;
     center.subVectors(s.tip,tip).addScaledVector(s.side,spread).addScaledVector(s.up,lift);
     const width=(fire?.118:wing?.115:.068)*charge*envelope;
     for(let edge=0;edge<3;edge++){
      const off=(edge-1)*width,relief=edge===1?width*.6:0;
      const v=(lane*(steps+1)+i)*3+edge;
      position.setXYZ(v,center.x+s.side.x*off+s.up.x*relief,center.y+s.side.y*off+s.up.y*relief,center.z+s.side.z*off+s.up.z*relief);
     }
    }
   }
   position.needsUpdate=true;ribbon.material.opacity=opacity*(fire?.67:.86);
  }
  return {seek,remove(){if(!removed){removed=true;dispose(root);}}};
 }

 // Accent geometry is shared across combos. Both renderers draw the same faceted faces.
 const punchLightning=(()=>{
  const cells=[];
  function branch(points,width,color){
   for(let j=1;j<points.length;j++){
    const a=points[j-1],b=points[j],w=width*(1-.65*(j-1)/(points.length-1));
    const w2=j===points.length-1?.004:w*.88;
    cells.push([[[a[0]-w,a[1],a[2]],[a[0]+w,a[1],a[2]],[b[0]+w2,b[1],b[2]],[b[0]-w2,b[1],b[2]]],color]);
    cells.push([[[a[0],a[1]-w,a[2]],[a[0],a[1]+w,a[2]],[b[0],b[1]+w2,b[2]],[b[0],b[1]-w2,b[2]]],'#fff4b4']);
   }
  }
  branch([[0,0,-.54],[.10,.08,-.14],[-.13,-.02,-.19],[.17,.17,.29],[-.04,.13,.24],[.17,.20,.77]],.073,'#f2b53a');
  branch([[.10,.08,-.14],[.31,.22,.06],[.24,.19,.03],[.55,.24,.29]],.047,'#f2c24a');
  branch([[.17,.17,.29],[-.22,.30,.35],[-.17,.28,.31],[-.39,.47,.48]],.034,'#f8d664');
  return sculpt(cells);
 })();
 const punchMoon=strip(soft?14:23,(t,e)=>{
  const a=-2.36+4.68*t,bow=Math.sin(Math.PI*t),r=.78+e*(.014+.18*bow*bow);
  return [Math.cos(a)*r,Math.sin(a)*r,(1-e)*.045+.12*bow];
 },(i,t)=>t<.13||t>.88?'#f5d6ff':i%4===0?'#c38ce7':'#7949ae');

 function punchAccent({from,to,dir,fruit,strike=0},contact=false){
  if(fruit?.edition===14)return;
  const id=fruit?.id;
  if(!id||id==='brasa'||id==='lobo'||id==='falcao')return;
  const tier=clamp(strike,0,2),compact=soft||mobile||level()>0,quiet=calm();
  const base=to.clone(),axis=dir.clone().normalize(),root=new T.Group(),shapes=[];
  if(axis.lengthSq()<.01)axis.set(0,0,1);
  basicBasis(root,axis,dir);
  const intensity=quiet?.63:.94,scale=[.76,.94,1.25][tier]*(contact?1.15:1);
  // Every entry starts in local fist space. Contact pieces spread around the hit
  // while swing pieces stay concentrated in the last portion of the hand's arc.
  function part(g,color,scaleXYZ,position,rotation,velocity=[0,0,0],spin=0){
   const obj=color?mesh(g,color,intensity):carved(g,intensity);
   root.add(obj);obj.scale.set(...scaleXYZ);obj.rotation.set(...rotation);
   shapes.push({obj,position,velocity,roll:rotation[2],spin});return obj;
  }
  const n=compact?3:5;
  switch(id){
   case 'impacto':
    if(!contact){
     part(geo.piston,null,[1.03,.88,.94],[0,0,-.12],[0,0,.12]);
     for(const sign of [-1,1])part(geo.cube,steelInk.brass,[.085,.13,.65],[sign*.31,0,-.37],[0,0,0]);
    }else for(let i=0;i<n;i++){
     const a=TAU*i/n+.20,x=Math.cos(a),y=Math.sin(a);
     part(geo.piston,null,[.46,.30,.39],[x*.24,y*.24,0],[.38,.30,a],[x*.91,y*.91,.16],(i%2-.5)*1.2);
    }
    break;
   case 'geada':
   case 'cristal':{
    const frost=id==='geada',count=compact?3:5;
    for(let i=0;i<count;i++){
     const a=TAU*i/count+.37,x=Math.cos(a),y=Math.sin(a);
     const lean=contact?.95:.47,length=.73+.20*(i%3),thick=frost?.23:.78;
     const m=part(frost?geo.ice:geo.quartz,frost?(i%2?'#6edbff':'#dbfbff'):null,
      [thick,length,thick],[x*.20,y*.20,-.18+.08*(i%2)],[0,0,0],
      [x*(contact?.57:.13),y*(contact?.57:.13),contact?.10:.27]);
     m.quaternion.setFromUnitVectors(V(0,1,0),V(x*lean,y*lean,.68).normalize());
     shapes[shapes.length-1].roll=m.rotation.z;
    }
    break;
   }
   case 'tormenta':
    for(let i=0;i<(compact?2:3);i++){
     const a=i*TAU/3,spread=contact?.51:.18;
     part(punchLightning,null,[.9,1,1.25],[0,0,-.12],[Math.sin(a)*spread,Math.cos(a)*spread,a],[Math.cos(a)*.19,Math.sin(a)*.19,.17]);
    }
    break;
   case 'eclipse':
    for(const sign of [-1,1]){
     part(punchMoon,null,[.78,.83,.78],[sign*.12,0,-.05],[.46*sign,.33*sign,sign<0?Math.PI:.08],[sign*(contact?.44:.12),0,0],sign*1.15);
    }
    if(contact)part(geo.orb,'#311c4c',[.56,.56,.56],[0,0,.05],[0,0,.35]);
    break;
   case 'mare':
    part(geo.breaker,null,[1.65,.89,.82],[0,-.47,-.30],[.06,.08,-.30],[0,.09,.27],.28);
    for(let i=0;i<(compact?3:5);i++){
     const x=(i/(compact?2:4)-.5)*1.3;
     part(geo.orb,i%2?'#8ce8eb':'#e3fff5',[.15,.23,.17],[x,.25+x*.10,-.04],[.4,0,.25],[x*.60,.29+.20*(i%2),.31]);
    }
    break;
   case 'eco':
    part(geo.echoNote,null,[.88,.88,.88],[.08,.03,.05],[.18,.28,-.20],[.12,.46,.09],.38);
    for(const sign of [-1,1]){
     part(geo.echoLine,null,[.86,.71,.78],[0,sign*.29,-.06],[.12,0,.08*sign],[0,sign*(contact?.45:.19),.16]);
    }
    break;
   case 'duna':
    for(let i=0;i<(compact?2:3);i++){
     const s=.66-.12*i;
     part(geo.dustCurl,null,[s,1.18,s],[0,.01,-.67+.34*i],[Math.PI/2,0,i*2.13],[0,0,.23],(i%2?-.65:.65));
    }
    if(contact)for(let i=0;i<n;i++){
     const a=i*TAU/n;
     part(geo.cube,i%2?'#e6a74e':'#ffdc97',[.15,.083,.13],[0,0,.05],[.4,a,a],[Math.cos(a)*.83,Math.sin(a)*.69,.28],1.5);
    }
    break;
   case 'ima':
    for(const sign of [-1,1]){
     part(geo.cube,sign<0?'#f77d72':'#72d8ef',[.21,.34,.38],[sign*.47,0,.07],[.18,0,-sign*.17],[sign*(contact?.36:-.10),0,.08],sign*.21);
     part(geo.flux,null,[.83,.80,1.02],[sign*.19,0,-.58],[0,0,sign<0?Math.PI:0],[sign*(contact?.35:0),0,.07],sign*.55);
    }
    break;
   default:return;
  }
  const handed=tier===1?-1:1,life=(contact?.29:.24)+tier*.055;
  return techAnimate(root,life,(o,t)=>{
   const open=ease(t/.70),grow=contact?.52+.48*open:.76+.24*open;
   o.position.copy(base);
   if(!contact)o.position.lerp(from,.30*(1-open));
   o.scale.setScalar(scale*grow);
   for(const {obj,position,velocity,roll,spin} of shapes){
    obj.position.set(position[0]+velocity[0]*open,position[1]+velocity[1]*open,position[2]+velocity[2]*open);
    obj.rotation.z=roll+spin*t*handed;
   }
   fade(o,1-smooth((t-.20)/.80));
  });
 }

 const art={T,V,TAU,geo,soft,level,calm,carved,sculpt,material,mesh,clamp,smooth,horizontalDir,surfaceHeight,floorAt,add,sparks};
 return {add,...createTidalFX(art),...createCycloneFX(art),...createStormFX(art),punchMantle,basicSwing,basicContact,fistTrail,fistImpact,dashFX,technique,retire,wave,whirlpool,prism,resonance,echoMark,echoAnswer,kineticBurst,kineticLane,feathers,sand,magnet,withOwner,cancelOwner,focus,groundMark,slash,fracture,closeZone,flash,pulse,impact,cracks,lightning,fire,ice,snow,talons,wolfChange,vortex,portal,ghost,activation,charge,projectile,travel,hit,createZone,dispose,update,clear,aura,sparks,beam,sprite,material,geo};
}

// Marcas das frutas míticas (Fênix, Besta, Dragões) do laboratório
const FRUTOMythFX=(()=>{
 const palettes={
  besta:{light:'#ffffff',shade:'#520919',mid:'#d91b34',edge:'#ff6b72',core:'#ffd4c4'},
  fenix:{light:'#fff8bd',shade:'#5b1fd6',mid:'#0a96ff',edge:'#6cf7ff',core:'#ff7b1c',pink:'#ff2e9b'},
  oriental:{light:'#fff5b3',shade:'#5a0b24',mid:'#d41d35',edge:'#ffbe33',core:'#ff6b4a'},
  ocidental:{light:'#fff3a8',shade:'#181926',mid:'#d67a16',edge:'#ffd04d',core:'#ff931e'}
 };
 const libraries=new WeakMap();
 const events={
  punch:{size:.92,life:.32},hit:{size:.78,life:.38},dash:{size:1.18,life:.54},
  transform:{size:1.78,life:.92},awake:{size:2.65,life:1.18},skill:{size:1.85,life:.76}
 };

 function makeGeometry(T,id,crest,skill){
  const p=palettes[id],positions=[],colors=[],indices=[],polygons=[],tint=new T.Color();
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  function face(points,color){
   const start=positions.length/3,ids=[];tint.set(color);
   for(const point of points){ids.push(start+ids.length);positions.push(point.x,point.y,point.z);colors.push(tint.r,tint.g,tint.b);}
   polygons.push(ids);for(let i=1;i+1<ids.length;i++)indices.push(start,start+i,start+i+1);
  }
  function ribbon(segments,path,width,left,right,side=v(0,1,0),ridge=v(0,0,1)){
   let prev;
   for(let i=0;i<=segments;i++){
    const t=i/segments,c=path(t),w=width(t);
    const cur=[c.clone().addScaledVector(side,-w),c.clone().addScaledVector(ridge,w*.56),c.clone().addScaledVector(side,w)];
    if(prev){face([prev[0],cur[0],cur[1],prev[1]],left);face([prev[1],cur[1],cur[2],prev[2]],right);}
    prev=cur;
   }
  }
  function ring(segments,radius,y,width,colA,colB,arc=Math.PI*2,start=0){
   ribbon(segments,t=>{const a=start+t*arc;return v(Math.sin(a)*radius,y,Math.cos(a)*radius);},
    t=>width*(arc<Math.PI*1.9?(.15+.85*Math.sin(Math.PI*t)):1),colA,colB,v(0,1,0),v(0,1,0));
  }
  function spike(base,tip,side,width,colA,colB,colC){
   const mid=base.clone().lerp(tip,.35).add(v(0,width*.5,0));
   const a=base.clone().addScaledVector(side,-width),b=base.clone().addScaledVector(side,width);
   const f=base.clone().add(v(side.z*width*.7,width*.2,-side.x*width*.7));
   face([a,tip,f],colA);face([f,tip,b],colB);face([a,b,tip],colC||colA);
   face([a,mid,f],colB);
  }
  function feather(base,tip,width,colA,colB,curve=.12){
   const d=tip.clone().sub(base),side=v(-d.y,d.x,0);
   if(side.lengthSq()<1e-5)side.set(1,0,0);else side.normalize();
   ribbon(6,t=>base.clone().addScaledVector(d,t).addScaledVector(side,Math.sin(Math.PI*t)*curve),
    t=>width*(.018+Math.sin(Math.pow(t,.65)*Math.PI)),colA,colB,side);
  }

  // ===== BESTA (Marfim & Carmesim) =====
  if(skill===4&&id==='besta'){
   // Pisão da Besta: 8 radial crimson-ivory seismic fissures + double concentric ring of jagged ruby/ivory spikes + shock ring
   for(let i=0;i<8;i++){
    const a=(i+.25)*Math.PI/4,dx=Math.sin(a),dz=Math.cos(a),side=v(-dz,0,dx);
    const at=t=>v(dx*(.22+1.25*t),.06+.12*Math.sin(t*Math.PI),dz*(.22+1.25*t)).addScaledVector(side,.08*Math.sin(10*t+i));
    ribbon(6,at,t=>.10*(1-t)+.014,p.mid,p.light,side,v(0,1,0));
    const base=at(.68),tip=at(.92).add(v(0,.62+.24*(i%2),0));
    spike(base,tip,side,.13+(i%2)*.03,p.shade,p.edge,p.light);
    if(i%2===0){
     const inner=at(.36),itip=at(.46).add(v(0,.34,0));
     spike(inner,itip,side,.09,p.mid,p.light,p.shade);
    }
   }
   ring(14,1.15,.10,.11,p.mid,p.light);
  }else if(skill===3&&id==='besta'){
   // Rugido Carmesim: triple expanding crimson-ivory sonic roar arcs + fierce fang-pressure streaks
   for(let i=0;i<4;i++){
    const r=.58+i*.32,y=.10+i*.20;
    ribbon(9,t=>{const a=(t-.5)*2.05;return v(Math.sin(a)*r,y+.14*Math.sin(t*Math.PI),Math.cos(a)*(r+.26));},
     t=>.018+.095*Math.sin(Math.PI*t),i%2?p.mid:p.shade,i%2?p.light:p.edge);
   }
   for(const s of [-1,1])ribbon(6,t=>v(s*(.22+.78*t),.22+.42*Math.sin(t*Math.PI),.15+1.35*t),t=>.065*(1-t)+.01,p.edge,p.light,v(0,1,0));
  }else if(skill===0&&id==='besta'){
   // Presa de Marfim: massive curved twin gore-horn slashes ripping upward + central scarlet fang wave
   for(const side of [-1,1]){
    ribbon(9,t=>v(side*(.20+.44*Math.sin(t*Math.PI*.86)),.02+1.18*t*t,-.22+1.38*t),
     t=>.016+.19*(1-t*.75),p.mid,p.light,v(1,0,0));
    ribbon(7,t=>v(side*(.34+.48*Math.sin(t*Math.PI*.8)),.12+.96*t*t,-.10+1.26*t),
     t=>.012+.10*(1-t),p.shade,p.edge,v(1,0,0));
   }
   ribbon(7,t=>v(0,.08+1.05*t*t,-.12+1.45*t),t=>.015+.14*Math.sin(Math.PI*t),p.edge,p.light,v(1,0,0));

  // ===== FÊNIX (Aurora Ciano, Violeta, Magenta & Ouro) =====
  }else if(skill===0&&id==='fenix'){
   // Pluma de Aurora: radiant multi-layered iridescent phoenix-feather lance + aurora side wisps
   feather(v(0,-.35,-.85),v(.08,.76,1.45),.28,p.mid,p.edge,.22);
   feather(v(.02,-.24,-.88),v(.01,.66,1.25),.13,p.pink,p.light,.10);
   for(const s of [-1,1])feather(v(s*.14,-.18,-.52),v(s*.36,.52,.98),.09,p.shade,p.core,s*.16);
  }else if(skill===3&&id==='fenix'){
   // Leque Solar: sweeping 8-feather aurora wing-fan bursting outward in cyan, magenta & gold
   for(let i=0;i<7;i++){
    const u=i/6,ang=(u-.5)*1.75,len=1.45+.35*Math.sin(u*Math.PI);
    const tip=v(Math.sin(ang)*len,.25+.55*Math.sin(u*Math.PI),Math.cos(ang)*len);
    feather(v(Math.sin(ang)*.18,.08,Math.cos(ang)*.18),tip,.16+.05*Math.sin(u*Math.PI),
     i%3===0?p.mid:i%3===1?p.pink:p.shade,i%2?p.light:p.edge,.14*(u-.5));
   }
   ring(12,1.15,.22,.09,p.core,p.light,Math.PI*1.15,-Math.PI*.575);
  }else if(skill===4&&id==='fenix'){
   // Pulso de Renascimento: swirling double-helix crown of 10 rising aurora & solar feathers + rebirth halo rings
   for(let i=0;i<10;i++){
    const a=i*Math.PI*2/10,r=.52+.26*(i%2);
    const base=v(Math.sin(a)*r,-.18,Math.cos(a)*r);
    const tip=v(Math.sin(a+.45)*(r+.58),1.95-.18*(i%3),Math.cos(a+.45)*(r+.58));
    feather(base,tip,.14+.03*(i%2),i%3===0?p.mid:i%3===1?p.pink:p.shade,i%2?p.light:p.edge,.16);
   }
   ring(14,1.22,.14,.09,p.mid,p.edge);
   ring(14,.86,.62,.07,p.core,p.light);

  // ===== DRAGÃO ORIENTAL (Carmesim Imperial, Ouro & Relâmpago) =====
  }else if((skill===4||skill===0)&&id==='oriental'){
   // Raio Imperial (0) / Trovão do Poente (4): blazing multi-forked golden-crimson lightning spear/pillar + impact crown
   const main=skill===4?
    [v(.04,3.10,-.10),v(.34,2.15,-.22),v(.10,2.24,.04),v(.48,1.32,.14),v(.14,1.44,-.02),v(.32,.62,.10),v(.02,.02,.04)]:
    [v(0,0,-.95),v(-.14,.16,-.42),v(.12,-.04,-.48),v(.04,.24,.18),v(-.14,.14,.12),v(.08,.22,.76),v(0,.18,1.48)];
   for(let i=1;i<main.length;i++){
    const a=main[i-1],b=main[i];
    ribbon(2,t=>a.clone().lerp(b,t),t=>.055+.042*(1-t),p.edge,p.light,skill===4?v(1,0,0):v(0,1,0));
    ribbon(2,t=>a.clone().lerp(b,t).add(v(.05,.04,0)),t=>.028*(1-t)+.014,p.mid,p.core,v(0,0,1));
    if(i%2===0){
     const fork=b.clone().add(skill===4?v(.55*(i%4===0?1:-1),-.42,.24):v(.32*(i%4===0?1:-1),.24,.34));
     ribbon(2,t=>b.clone().lerp(fork,t),t=>.032*(1-t)+.006,p.edge,p.light,v(0,1,0));
    }
   }
   if(skill===4)ring(14,1.18,.12,.11,p.mid,p.edge);
  }else if(skill===3&&id==='oriental'){
   // Espiral Imperial: towering double-coiling crimson-and-gold serpentine dragon vortex with golden dorsal spines
   for(const turn of [0,Math.PI]){
    const path=t=>{const a=turn+t*Math.PI*3.4,r=1.22-.52*t;return v(Math.cos(a)*r,.08+t*1.65,Math.sin(a)*r);};
    ribbon(16,path,t=>.035+.14*Math.sin(Math.PI*t),p.shade,p.mid,v(0,1,0));
    ribbon(16,t=>path(t).add(v(0,.09,0)),t=>.020+.042*Math.sin(Math.PI*t),p.edge,p.light,v(0,1,0));
   }
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3,r=.95;
    feather(v(Math.cos(a)*r,.35+.18*i,Math.sin(a)*r),v(Math.cos(a+.6)*(r+.45),.62+.18*i,Math.sin(a+.6)*(r+.45)),.10,p.edge,p.light,.08);
   }

  // ===== DRAGÃO OCIDENTAL (Obsidiana & Ouro Fundido) =====
  }else if(skill===0&&id==='ocidental'){
   // Sopro de Fornalha: 11 roaring spiraling streams of molten gold, honey & volcanic amber flames
   for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11,rad=.06+.76*(i%2?.95:.65);
    ribbon(7,t=>v(Math.cos(a+t*1.2)*rad*t,Math.sin(a+t*1.2)*rad*.82*t+.14*Math.sin(7*t+a),-.38+2.15*t),
     t=>.045+.11*Math.sin(Math.PI*t),i%3===0?p.shade:p.mid,i%2?p.light:p.edge);
   }
   ring(10,.42,.08,.07,p.core,p.light);
  }else if(skill===4&&id==='ocidental'){
   // Meteoro de Obsidiana: 8 towering jagged obsidian basalt spires rimmed in blazing molten gold + magma ring
   for(let i=0;i<8;i++){
    const a=(i+.35)*Math.PI/4,r=.58+.28*(i%2),base=v(Math.sin(a)*r,.04,Math.cos(a)*r),side=v(Math.cos(a),0,-Math.sin(a));
    const end=base.clone().multiplyScalar(1.52).add(v(0,.68+.58*(i%2),0));
    spike(base,end,side,.15+.06*(i%2),p.shade,i%2?p.core:p.edge,p.light);
   }
   ring(16,1.28,.12,.14,p.core,p.light);
   ring(12,.72,.26,.09,p.shade,p.edge);

  // ===== COMBO / HIT / DASH / TRANSFORM / AWAKE CRESTS & TRAILS =====
  }else if(id==='besta'){
   if(crest){
    ribbon(10,t=>v(.22+1.05*Math.sin(2.15*t),-.32+1.65*t-.22*Math.sin(t*3),.06+.28*Math.sin(t*4)),
     t=>.22*(1-Math.pow(t,1.65))+.006,p.shade,p.edge,v(1,0,.28),v(0,-.2,1));
    ring(12,.92,.08,.08,p.mid,p.light,Math.PI*1.3,-Math.PI*.65);
   }
   for(let i=0;i<4;i++){
    const o=i*.15;
    ribbon(8,t=>v(-.12+o+1.08*t+.22*Math.sin(t*Math.PI),-.58+o+1.06*t*t,.34-.96*t+.14*Math.sin(t*Math.PI)),
     t=>(.015+.085*Math.sin(Math.PI*t))*(1-.08*i),i%2?p.mid:p.shade,i===0?p.edge:p.light);
   }
  }else if(id==='fenix'){
   const feathers=crest?8:5;
   for(let i=0;i<feathers;i++){
    const t=i/(feathers-1),base=v(.02+.30*t,-.34+.42*t,-.06*t);
    const tip=v(1.88-.75*t+.10*Math.sin(t*4),-.30+1.78*t,-.42+.80*t);
    feather(base,tip,.14+.05*t,i%3===0?p.mid:i%3===1?p.pink:p.shade,i%2===0?p.light:p.edge,.22-.34*t);
   }
   feather(v(.04,-.32,.10),v(1.26,.82,.16),.07,p.core,p.light);
  }else if(id==='oriental'){
   const path=t=>{const a=-1.7+t*(crest?5.1:3.8),r=.72+.24*Math.sin(Math.PI*t);
    return v(.10+Math.cos(a)*r,-.54+t*1.76,Math.sin(a)*r);};
   ribbon(15,path,t=>.030+.14*Math.sin(Math.PI*t),p.shade,p.mid,v(.43,.58,.55));
   ribbon(15,t=>path(t).add(v(0,.09,0)),t=>.018+.036*Math.sin(Math.PI*t),p.edge,p.light,v(0,1,0));
   for(let i=1;i<=6;i++){
    const t=i/7.5,at=path(t),out=v(at.x-.1,0,at.z).normalize(),end=at.clone().addScaledVector(out,.22+.10*t).add(v(0,.25,.05));
    face([at.clone().add(v(0,-.06,.03)),end,at.clone().add(v(0,.14,-.01))],p.edge);
   }
   if(crest)ribbon(9,t=>v(.95*t+.24,.76+.66*t+.16*Math.sin(t*5),.16+.46*Math.sin(t*4)),
    t=>.050*(1-t)+.006,p.edge,p.light);
  }else{
   // Ocidental: monumental obsidian & molten-gold dragon wing shock-crest
   const shoulder=v(.02,-.34,.12),wrist=v(.76,.68,.12),tips=[
    v(1.02,1.32,.20),v(1.86,.86,-.12),v(1.98,.12,-.34),v(1.60,-.46,-.36)
   ];
   for(let i=0;i<tips.length-1;i++){
    const a=tips[i],b=tips[i+1],hollow=a.clone().lerp(b,.52).lerp(wrist,crest?.26:.40);
    face([wrist,a,hollow],i===1?p.core:p.mid);face([wrist,hollow,b],i===1?p.edge:p.core);
   }
   face([shoulder,wrist,tips[3]],p.shade);
   for(const tip of tips)feather(wrist,tip,.055,p.shade,p.edge,.028);
   feather(shoulder,wrist,.11,p.shade,p.light);
   if(crest)feather(wrist,v(.58,1.28,.36),.078,p.core,p.light,-.05);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.userData.polygons=polygons;g.computeBoundingSphere();return g;
 }

 function emit(fx,fruit,kind,point,dir,form='humana',index=0){
  const id=typeof fruit==='string'?fruit:fruit?.id,event=events[kind],palette=palettes[id];
  if(!event||!palette||!point||!fx)return;
  const T=THREE_LIB; // (no laboratório vinha do THREE global; no jogo, do módulo three)
  if(!T)return;
  const finisher=kind==='skill'&&index===4,field=kind==='skill'&&index===3;
  const crest=kind==='transform'||kind==='awake'||finisher||field,paired=crest||kind==='dash';
  const skill=kind==='skill'&&[0,3,4].includes(index)?index:-1;
  const key=id+(skill>=0?' skill '+skill:crest?' crest':' trail');let cache=libraries.get(T);
  if(!cache){cache=new Map();libraries.set(T,cache);}
  if(!cache.has(key))cache.set(key,makeGeometry(T,id,crest,skill));
  const root=new T.Group(),geometry=cache.get(key);
  root.name='FX '+id+' '+kind;root.position.copy(point);
  root.rotation.y=Math.atan2(dir?.x||0,dir?.z||0);
  const material=fx.material(0xffffff,.95);material.vertexColors=true;
  const sides=paired?[-1,1]:[(index&1)?-1:1];
  for(const side of sides){const mesh=new T.Mesh(geometry,material);mesh.scale.x=side;root.add(mesh);}
  const multiplier=form==='completa'?1.28:form==='hibrida'?1.12:1;
  const size=event.size*multiplier*(finisher?1.64:field?1.28:1);
  const life=event.life*(finisher?1.24:1),dash=kind==='dash',swing=kind==='punch';
  const restingY=crest&&kind==='transform'?.28:0;
  function animate(group,t){
   const ease=1-(1-t)*(1-t),wave=Math.sin(Math.PI*t);
   const scale=size*(.34+.68*ease+.12*wave);
   group.scale.set(scale,scale*(dash?.72:1),scale*(dash?1.48:1));
   material.opacity=.94*(1-Math.pow(t,1.65));
   for(let i=0;i<sides.length;i++){
    const mesh=group.children[i],side=sides[i];
    if(skill>=0){
     const shock=finisher&&id!=='fenix',rise=id==='fenix'?(finisher?.76*ease:.38*ease):shock?.16*wave:0;
     mesh.position.set(0,rise,field&&id==='besta'?.62*ease:0);
     mesh.rotation.y=id==='oriental'&&field?side*(.52+2.15*ease):id==='oriental'&&finisher?side*.64:id==='fenix'&&finisher?side*.85*ease:0;
     mesh.rotation.z=(id==='fenix'&&field||id==='ocidental'&&field)?side*(-.32+.84*wave):0;
     if(finisher&&id==='oriental')mesh.scale.y=.52+.52*ease;
     continue;
    }
    mesh.position.set(side*(paired?.15+.30*ease:0),restingY+(id==='fenix'?.68:id==='besta'?-.14:.28)*ease,dash?-.36-1.95*ease:swing?.68*ease:0);
    mesh.rotation.y=side*(id==='oriental'?(crest?2.05:1.25)*ease:dash?-.84-.36*ease:swing?-.76+.90*ease:.16*ease);
    mesh.rotation.z=side*(id==='fenix'?-.48+.86*wave:id==='ocidental'?.46-.82*ease:id==='besta'?-.52+.60*ease:.15*wave);
    mesh.rotation.x=dash?.32:swing?-.22+.34*ease:0;
   }
  }
  animate(root,0);fx.add(root,life,animate);
  // Dual-tone vibrant particle burst tailored to each mythical creature
  const sparkCount=finisher?14:crest?11:kind==='hit'?7:4;
  fx.sparks(point,palette.edge,sparkCount,crest?3.6:2.3,{life:crest?.56:.32,size:crest?.072:.046,gravity:id==='fenix'?-.85:id==='oriental'?-.35:1.7,stretch:id==='besta'?2.8:1.5});
  if(crest||finisher){
   fx.sparks(point,palette.core||palette.light,Math.ceil(sparkCount*.65),2.6,{life:.46,size:.055,gravity:id==='fenix'?-1.1:.9,stretch:1.8});
  }
  return root;
 }
 return {emit};
})();

export { FRUTOElements, createFruitFX, FRUTOMythFX };
