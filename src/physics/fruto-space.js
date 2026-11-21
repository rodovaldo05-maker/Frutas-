// Módulo do FRUTO Laboratório Voxel, Edição 18 (dados 3.1), trazido sem alterações de lógica.
// Fonte: FRUTO_Laboratorio_Voxel_Edicao_18.html. Recebe o THREE como parâmetro (T).
/* eslint-disable */
export const FRUTOSpace = (() => {
 function sphere(a,d,c,r){
  const x=a.x-c.x,y=a.y-c.y,z=a.z-c.z;
  const b=x*d.x+y*d.y+z*d.z,k=x*x+y*y+z*z-r*r,len=d.lengthSq();
  if(k<=0)return 0;
  if(!len||b>=0)return Infinity;
  const det=b*b-len*k;if(det<0)return Infinity;
  const t=(-b-Math.sqrt(det))/len;return t<=1?t:Infinity;
 }
 function capsule(a,b,base,r,low,high){
  const d=b.clone().sub(a),x=a.x-base.x,z=a.z-base.z,lo=base.y+low,hi=base.y+high;
  let first=Math.min(sphere(a,d,{x:base.x,y:lo,z:base.z},r),sphere(a,d,{x:base.x,y:hi,z:base.z},r));
  const k=x*x+z*z-r*r,ux=d.x,uz=d.z,len=ux*ux+uz*uz,q=x*ux+z*uz;
  if(k<=0&&a.y>=lo&&a.y<=hi)return 0;
  const disc=q*q-len*k;
  if(len>1e-10&&disc>=0){
   for(const t of [(-q-Math.sqrt(disc))/len,(-q+Math.sqrt(disc))/len]){
    const y=a.y+t*d.y;if(t>=0&&t<=1&&y>=lo&&y<=hi)first=Math.min(first,t);
   }
  }
  return first;
 }
 function wall(a,b,object){
  const start=object.worldToLocal(a.clone()),end=object.worldToLocal(b.clone());
  let near=0,far=1;
  for(const [axis,min,max] of [['x',-1.12,1.12],['y',-.07,2.87],['z',-.22,.22]]){
   const d=end[axis]-start[axis];
   if(Math.abs(d)<1e-8){if(start[axis]<min||start[axis]>max)return Infinity;continue;}
   const i=(min-start[axis])/d,j=(max-start[axis])/d;near=Math.max(near,Math.min(i,j));far=Math.min(far,Math.max(i,j));
   if(near>far)return Infinity;
  }
  return near;
 }
 function horizontal(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
 // Dash paths are sampled by elapsed time, so turning the frame rate down does
 // not shorten a dash or change the position of a corner in its trajectory.
 function dashPoint(profile,t){
  t=Math.max(0,Math.min(1,t));
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  let travel=t,side=Math.sin(Math.PI*t);
  switch(profile.path){
   case 'ram':travel=smooth(t);break;
   case 'flare':travel=1-(1-t)**2.35;break;
   case 'glide':travel=t*(1.42-.42*t);break;
   case 'double':travel=.58*smooth(t/.36)+.42*smooth((t-.43)/.57);side=Math.sin(2*Math.PI*t);break;
   case 'bound':travel=.28*t+.72*smooth(t);break;
   case 'phase':travel=smooth((t-.16)/.58);break;
   case 'swell':travel=t-Math.sin(2*Math.PI*t)*.07;break;
   case 'facet':travel=.45*smooth(t/.45)+.55*smooth((t-.45)/.55);side=t<.45?smooth(t/.45):1-smooth((t-.45)/.55);break;
   case 'syncopate':travel=.43*smooth(t/.29)+.57*smooth((t-.52)/.48);break;
   case 'swoop':travel=.4*t+.6*(1-(1-t)**2.1);break;
   case 'weave':travel=smooth(t);side=Math.sin(t*2*Math.PI);break;
   case 'magnet':travel=t<.54?.6*(t/.54)**1.55:.6+.4*(1-(1-(t-.54)/.46)**2);break;
  }
  return {ahead:travel*profile.distance,side:side*profile.bend,up:Math.sin(Math.PI*t)*profile.lift};
 }
 const gravity=19.6;
 // All bodies share gravity. Shape changes the impulse delivered at take-off and
 // the time needed to redirect horizontal momentum or absorb a landing.
 const bodies={
  humano:{mass:72,push:515,drive:12,brake:16,turn:15,traction:.68},
  besta_hibrida:{mass:107,push:758,drive:10.6,brake:13,turn:12.4,traction:.87},
  besta_completa:{mass:166,push:1090,drive:10.9,brake:10.65,turn:10.2,traction:.96},
  fenix_hibrida:{mass:61,push:470,drive:14,brake:15,turn:17.5,traction:.72},
  fenix_completa:{mass:39,push:286,drive:15.8,brake:14.4,turn:18.6,traction:.73},
  oriental_hibrida:{mass:87,push:658,drive:13,brake:13.4,turn:14.6,traction:.81},
  oriental_completa:{mass:116,push:842,drive:12.2,brake:12.6,turn:13.4,traction:.82},
  ocidental_hibrida:{mass:99,push:708,drive:10.4,brake:13,turn:12.8,traction:.86},
  ocidental_completa:{mass:153,push:1048,drive:10.1,brake:10.4,turn:10.5,traction:.92},
  lobo_hibrida:{mass:91,push:680,drive:10.8,brake:13.2,turn:13.8,traction:.79},
  lobo_completa:{mass:82,push:665,drive:15,brake:12.4,turn:14.2,traction:.89},
  falcao_hibrida:{mass:65,push:485,drive:13.8,brake:15,turn:17.2,traction:.69},
  falcao_completa:{mass:32,push:236,drive:16.5,brake:14,turn:19,traction:.73}
 };
 function bodyProfile(species,stance){return bodies[species+'_'+stance]||bodies.humano;}
 function integrateTarget(body,dt,height=()=>0){
  const p=body.root.position,v=body.impulse,floor0=height(p.x,p.z),clearance=Math.max(0,p.y-floor0);
  const airborne=clearance>.003||v.y>0,drag=airborne?3.7:8,decay=Math.exp(-drag*dt),distance=(1-decay)/drag;
  const x0=p.x,z0=p.z;p.x+=v.x*distance;p.z+=v.z*distance;v.x*=decay;v.z*=decay;
  for(const key of ['x','z'])if(Math.abs(p[key])>8){p[key]=Math.sign(p[key])*8;v[key]*=-.18;}
  const floor=height(p.x,p.z),drop=floor0-floor,travel=Math.hypot(p.x-x0,p.z-z0);
  if(airborne||drop>travel*.83+.002){p.y=floor0+clearance+v.y*dt-.5*gravity*dt*dt;v.y-=gravity*dt;
   if(p.y<=floor){p.y=floor;v.y=0;}}
  else{p.y=floor;v.y=0;}
  if(Math.abs(v.x)+Math.abs(v.z)<.006)v.x=v.z=0;
 }
 return {capsule,wall,horizontal,dashPoint,integrateTarget,gravity,bodyProfile};
})();
