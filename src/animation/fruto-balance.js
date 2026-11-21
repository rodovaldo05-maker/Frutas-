// Módulo do FRUTO Laboratório Voxel, Edição 18 (dados 3.1), trazido sem alterações de lógica.
// Fonte: FRUTO_Laboratorio_Voxel_Edicao_18.html. Recebe o THREE como parâmetro (T).
/* eslint-disable */
export const FRUTOBalance=(()=>{
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 // Relative segment masses for the digitigrade trunk, winged chest and limbs.
 // Fixed proportions keep the mass distribution identical across visual LODs.
 const massParts={
  biped:{cintura:17,tronco:32,cabeca:8.6,ombro:2.1,braco:3.0,antebraco:1.8,mao:.8,coxa:9,canela:4.7,pe:1.5},
  lobo:{dorso:25,peitoral:20,garupa:16,cabeca:9,pescoco:5.8,escapula:3.6,quadril:5.7,perna:2.4,jarrete:1.0,pata:.8,mandibula:1.0,orelha:.13,cauda:1.15},
  falcao:{dorso:40,pescoco:5,cabeca:8,bico:.9,coxa:5.5,tarso:1.6,pe:1.2,asa:6.1,carpo:2.8,primarias:1.5,leque:.4,cauda:1.7,garras:.15,halux:.10}
 };
 function partMass(id,quad,bird,hybrid){
  const kind=id.split('_')[0],appendage=bird?massParts.falcao:massParts.lobo;
  let mass=(!quad&&!bird||hybrid?massParts.biped[kind]:undefined)??appendage[kind]??.4;
  if(hybrid&&bird&&kind==='tronco')mass*=1.16;
  if(hybrid&&!bird&&['coxa','braco','cabeca'].includes(kind))mass*=1.13;
  if(id==='cauda_ponta')mass*=.35;return mass;
 }
 function segmentCenter(T,geometry){
  if(!geometry.boundingBox)geometry.computeBoundingBox();const bb=geometry.boundingBox,center=bb.getCenter(new T.Vector3());
  const p=geometry.getAttribute('position'),idx=geometry.index;if(!idx)return center;
  let v=0,x=0,y=0,z=0;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),cross=new T.Vector3();
  for(let i=0;i<idx.count;i+=3){a.fromBufferAttribute(p,idx.getX(i));b.fromBufferAttribute(p,idx.getX(i+1));c.fromBufferAttribute(p,idx.getX(i+2));
   const d=a.dot(cross.crossVectors(b,c));v+=d;x+=d*(a.x+b.x+c.x);y+=d*(a.y+b.y+c.y);z+=d*(a.z+b.z+c.z);}
  if(Math.abs(v)>1e-6){a.set(x,y,z).multiplyScalar(.25/v);if(bb.containsPoint(a))center.copy(a);}
  return center;
 }
 // Project the effective load onto the part of the support polygon which is on
 // the ground. Two diagonal paws form a segment; one paw still has a sole area.
 function closestSupport(legs,x,z,out){
  const loaded=legs.filter(l=>l.weight>.31);if(!loaded.length)return false;
  const point=l=>l.lock||l.stepPos;let best=Infinity;
  const cross=(a,b)=>((b.x-a.x)*(z-a.z)-(b.z-a.z)*(x-a.x));
  for(let i=0;i<loaded.length;i++)for(let j=i;j<loaded.length;j++){
   const a=point(loaded[i]),b=point(loaded[j]),dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
   const t=den?clamp(((x-a.x)*dx+(z-a.z)*dz)/den,0,1):0,px=a.x+t*dx,pz=a.z+t*dz,dist=(px-x)**2+(pz-z)**2;
   if(dist<best){best=dist;out.set(px,0,pz);}
   if(i===j)continue;
   for(let k=j+1;k<loaded.length;k++){
    const c=point(loaded[k]),ab=cross(a,b),bc=cross(b,c),ca=cross(c,a);
    if(Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))>1e-6&&((ab>=0&&bc>=0&&ca>=0)||(ab<=0&&bc<=0&&ca<=0))){out.set(x,0,z);return true;}
   }
  }
  return true;
 }
 function create(T){
  const V=()=>new T.Vector3(),Q=()=>new T.Quaternion(),rigs=new WeakMap();
  const work=V(),direction=V(),nextDirection=V(),parentQ=Q(),deltaQ=Q(),worldQ=Q(),axis=V(),normal=V(),goal=V(),scale=V();
  const mass=V(),supportPoint=V(),center=V(),sole=V(),offset=V();
  let last=null,shift=V(),tilt=V();
  function mapRig(rig){
   const j=rig.joints,quad=!!j.pata_traseira_E,bird=!!j.tarso_E,base=j.cintura||j.dorso,legs=[],massPoints=[];
   for(const side of ['E','D'])for(const near of quad?[true,false]:[true]){
    const stem=(near?'dianteira_':'traseira_')+side;
    const ids=quad?[(near?'escapula_':'quadril_')+side,'perna_'+stem,'jarrete_'+stem,'pata_'+stem]:['coxa_'+side,(bird?'tarso_':'canela_')+side,'pe_'+side];
    const bones=ids.map(id=>j[id]),ankle=bones.at(-1),contact=quad?new T.Vector3(0,-.235,.08):rig.sockets['apoio_'+side].position.clone();
    legs.push({bones,ankle,contact,side,near,lock:null,phase:quad?((side==='E')===near?0:.5):side==='E'?0:.5,points:bones.map(V),original:bones.map(V),lengths:[],stepPos:V(),stepQ:Q(),lift:0,planted:false,weight:0});
   }
   // Box centres of individual rigid meshes locate the tissue within each joint's
   // frame. Quills, tail and wing tips contribute less than chest and pelvis.
   for(const [id,mesh] of Object.entries(rig.meshes)){
    const g=mesh.geometry;if(!g.boundingBox)g.computeBoundingBox();const bounds=g.boundingBox,extent=bounds.getSize(V());
    const density=/orelha|leque|primarias|bico|mandibula|cauda/.test(id)?.31:/asa|carpo|pata|pe_|mao/.test(id)?.55:1;
    massPoints.push({joint:j[id],c:rig.form?segmentCenter(T,g):bounds.getCenter(V()),w:rig.form?partMass(id,quad,!!j.bico,rig.form==='hibrida'):Math.max(.001,extent.x*extent.y*extent.z)*density});
   }
   const neck=rig.form?(j.pescoco||j.cabeca):null;
   const changed=[...new Set([base,neck,...legs.flatMap(l=>l.bones)].filter(Boolean))].map(joint=>({joint,p:V(),q:Q()}));
   return {rig,base,neck,quad,bird,legs,massPoints,changed,saved:false,report:{massCenter:V(),supports:[],centerOfPressure:V(),load:{},pitch:0,roll:0}};
  }
  function restore(rig){const m=rig&&rigs.get(rig);if(!m?.saved)return;for(const a of m.changed){a.joint.position.copy(a.p);a.joint.quaternion.copy(a.q);}m.saved=false;}
  function reset(){if(last){restore(last.rig);for(const l of last.legs)l.lock=null;}last=null;shift.set(0,0,0);tilt.set(0,0,0);}
  function bonePoint(j,out){return out.setFromMatrixPosition(j.matrixWorld);}
  function solveLeg(l,target,footQ,normalWorld,weight){
   const {bones,points,original,lengths}=l,n=bones.length-1;
   for(let i=0;i<=n;i++){bonePoint(bones[i],points[i]);original[i].copy(points[i]);if(i)lengths[i-1]=points[i].distanceTo(points[i-1]);}
   if(points[n].distanceToSquared(target)>.000006){
    const total=lengths.reduce((a,b)=>a+b,0),span=target.distanceTo(points[0]);
    if(span>total*.985)target.sub(points[0]).setLength(total*.985).add(points[0]);
    // Preserving the input chain as the initial guess retains the authored bend
    // direction, including the rear-facing hock of the quadruped.
    for(let iter=0;iter<12;iter++){
     points[n].copy(target);for(let i=n-1;i>=0;i--)points[i].sub(points[i+1]).setLength(lengths[i]).add(points[i+1]);
     points[0].copy(original[0]);for(let i=1;i<=n;i++)points[i].sub(points[i-1]).setLength(lengths[i-1]).add(points[i-1]);
     if(points[n].distanceToSquared(target)<.000006)break;
    }
    for(let i=0;i<n;i++){
     const joint=bones[i],child=bones[i+1];joint.updateWorldMatrix(true,false);child.updateWorldMatrix(false,false);
     direction.setFromMatrixPosition(child.matrixWorld).sub(bonePoint(joint,work)).normalize();nextDirection.copy(points[i+1]).sub(points[i]).normalize();
     deltaQ.setFromUnitVectors(direction,nextDirection);joint.getWorldQuaternion(worldQ).premultiply(deltaQ);joint.parent.getWorldQuaternion(parentQ).invert();joint.quaternion.copy(parentQ.multiply(worldQ));
    }
   }
   // Keep the foot's authored toe-off roll and blend the ground normal at support.
   const ankle=bones[n];deltaQ.setFromUnitVectors(axis.set(0,1,0),normalWorld);parentQ.identity().slerp(deltaQ,weight);worldQ.copy(footQ).premultiply(parentQ);
   ankle.parent.getWorldQuaternion(parentQ).invert();ankle.quaternion.copy(parentQ.multiply(worldQ));
  }
  function apply(rig,c){
   let m=rigs.get(rig);if(!m){m=mapRig(rig);rigs.set(rig,m);}if(last!==m){reset();last=m;}
   const {base,legs,quad,bird,report}=m,dt=Math.max(0,c.dt||0),ground=c.ground,r=c.root,air=!c.grounded||c.flying;
   const blend=1-Math.exp(-dt*(quad?14:17));
   if(air){
    for(const l of legs){l.lock=null;l.planted=false;l.weight=0;report.load[l.ankle.name]=0;}
    shift.multiplyScalar(1-blend);tilt.multiplyScalar(1-blend);report.supports.length=0;
    if(rig.form){for(const s of m.changed){s.p.copy(s.joint.position);s.q.copy(s.joint.quaternion);}m.saved=true;base.position.add(shift);base.rotation.x+=tilt.x;base.rotation.z+=tilt.z;}
    return report;
   }
   for(const s of m.changed){s.p.copy(s.joint.position);s.q.copy(s.joint.quaternion);}m.saved=true;
   rig.root.updateWorldMatrix(true,true);r.getWorldScale(scale);const unit=scale.y, yaw=r.rotation.y,sy=Math.sin(yaw),cy=Math.cos(yaw);
   const f=c.gait||0,stationary=f<.13,attacking=!!c.attacking,origin=r.position,h0=ground(origin.x,origin.z),d=.26*unit;
   const sx=(ground(origin.x+d,origin.z)-ground(origin.x-d,origin.z))/(2*d),sz=(ground(origin.x,origin.z+d)-ground(origin.x,origin.z-d))/(2*d);
   const along=sx*sy+sz*cy,across=sx*cy-sz*sy;
   mass.set(0,0,0);let total=0;for(const point of m.massPoints){mass.addScaledVector(work.copy(point.c).applyMatrix4(point.joint.matrixWorld),point.w);total+=point.w;}mass.multiplyScalar(1/total);report.massCenter.copy(mass);
   center.set(0,0,0);let supports=0;report.supports.length=0;
   for(const l of legs){
    sole.copy(l.contact).applyMatrix4(l.ankle.matrixWorld);l.stepPos.copy(sole);l.ankle.getWorldQuaternion(l.stepQ);
    l.lift=clamp(sole.y-origin.y,0,.58*unit);const phase=((c.phase/(2*Math.PI)+l.phase)%1+1)%1;
    const claimed=rig.contacts?.[l.ankle.name];
    if(Number.isFinite(claimed)){
     l.weight=clamp(claimed,0,1);if(attacking&&l.lift>.18*unit)l.weight*=clamp(1-(l.lift/unit-.18)*5,0,1);
     l.planted=l.weight>(l.planted?.23:.48);
    }else{l.planted=attacking?l.lift<.095*unit:stationary||phase<(quad?.53:.5);l.weight=l.planted?1:0;}
    if(l.planted){report.supports.push(l.ankle.name);}
    const pin=l.planted&&(!attacking||Number.isFinite(claimed));
    if(!pin||stationary&&!attacking)l.lock=null;
    else if(!l.lock)l.lock=sole.clone();
    else{
     const e=Math.hypot(l.lock.x-sole.x,l.lock.z-sole.z),limit=(quad?.42:bird?.30:.34)*unit;
     if(e>limit){const k=Math.min(1,(e-limit)/e);l.lock.lerp(sole,k);}
    }
    center.addScaledVector(l.lock||l.stepPos,l.weight);supports+=l.weight;
   }
   if(supports<.001)center.copy(origin);else center.multiplyScalar(1/supports);
   const comHeight=clamp((mass.y-h0)/unit,.65,2.8),g=c.gravity||19.6;
   let mx=(center.x-mass.x)/unit,mz=(center.z-mass.z)/unit;
   if(rig.form){
    const effectiveX=mass.x-clamp(c.acceleration.x*comHeight/g,-.48,.48)*unit;
    const effectiveZ=mass.z-clamp(c.acceleration.z*comHeight/g,-.55,.55)*unit;
    if(closestSupport(legs,effectiveX,effectiveZ,supportPoint)){
     mx=clamp((supportPoint.x-effectiveX)/unit,-.55,.55)*.90+.12*mx;
     mz=clamp((supportPoint.z-effectiveZ)/unit,-.65,.65)*.90+.12*mz;
     let sum=0;for(const l of legs){const p=l.lock||l.stepPos,dist=((p.x-supportPoint.x)**2+(p.z-supportPoint.z)**2)/(unit*unit);
      const pressure=l.weight/(.24+dist);report.load[l.ankle.name]=pressure;sum+=pressure;}
     center.set(0,0,0);for(const l of legs){const key=l.ankle.name,pressure=report.load[key]/(sum||1);report.load[key]=pressure;center.addScaledVector(l.lock||l.stepPos,pressure);}
    }else{mx=0;mz=0;for(const l of legs)report.load[l.ankle.name]=0;}
   }
   report.centerOfPressure.copy(center);report.centerOfPressure.y=ground(center.x,center.z);
   const ax=c.acceleration.x*cy-c.acceleration.z*sy,az=c.acceleration.x*sy+c.acceleration.z*cy;
   const gain=attacking?.42:1,reach=quad?.18:bird?.09:.14;
   work.set(clamp((mx*cy-mz*sy)*.25,-reach,reach),-clamp((Math.abs(across)*.095+Math.abs(along)*.065)+c.landing*.035,0,.13),clamp((mx*sy+mz*cy)*.24,-reach,reach));shift.lerp(work.multiplyScalar(gain),blend);
   work.set(clamp(-Math.atan(along)*(quad?.80:bird?.54:.27)+az/g*.14/comHeight,-.37,.37),0,clamp(Math.atan(across)*(quad?.72:bird?.48:.35)-ax/g*.14/comHeight,-.30,.30));tilt.lerp(work.multiplyScalar(gain),blend);
   base.position.add(shift);base.rotation.x+=tilt.x;base.rotation.z+=tilt.z;if(m.neck){m.neck.rotation.x-=tilt.x*.35;m.neck.rotation.z-=tilt.z*.44;}report.pitch=tilt.x;report.roll=tilt.z;base.updateWorldMatrix(true,true);
   for(const l of legs){
    const weight=l.weight,plantMix=weight*weight*(3-2*weight);
    const x=l.stepPos.x+((l.lock?.x??l.stepPos.x)-l.stepPos.x)*plantMix,z=l.stepPos.z+((l.lock?.z??l.stepPos.z)-l.stepPos.z)*plantMix;
    const h=ground(x,z),lift=l.lift*(1-(attacking?.67:1)*plantMix);goal.set(x,h+.012*unit+lift,z);
    const footNormalStrength=.16+(attacking?.25:.63)*plantMix;
    normal.set((ground(x-d,z)-ground(x+d,z))/(2*d),1,(ground(x,z-d)-ground(x,z+d))/(2*d)).normalize();
    deltaQ.setFromUnitVectors(axis.set(0,1,0),normal);worldQ.identity().slerp(deltaQ,footNormalStrength).multiply(l.stepQ);
    offset.copy(l.contact).multiplyScalar(unit).applyQuaternion(worldQ);goal.sub(offset);
    solveLeg(l,goal,l.stepQ,normal,footNormalStrength);
   }
   return report;
  }
  return {apply,restore,reset};
 }
 return {create};
})();
