// Módulo do FRUTO Laboratório Voxel, Edição 18 (dados 3.1), trazido sem alterações de lógica.
// Fonte: FRUTO_Laboratorio_Voxel_Edicao_18.html. Recebe o THREE como parâmetro (T).
/* eslint-disable */
export const FRUTOModels = (() => {
 const profiles = ['alto', 'celular', 'compatível'];
 const sockets = {
  palma_D:['mao_D',[0,-.16,.21]], palma_E:['mao_E',[0,-.16,.21]],
  punho_D:['mao_D',[0,-.32,.03]], punho_E:['mao_E',[0,-.32,.03]],
  apoio_D:['pe_D',[0,-.24,.13]], apoio_E:['pe_E',[0,-.24,.13]],
  peito:['tronco',[0,.62,.32]], boca:['cabeca',[0,.30,.49]],
  pegada:['mao_D',[0,-.10,.22]]
 };
 // Flat-shaded colored faces retain their original quads for the software renderer.
 class Surface {
  constructor(T){this.T=T;this.positions=[];this.normals=[];this.colors=[];this.indices=[];this.quads=[];}
  polygon(points, rgb){
   const start=this.positions.length/3;
   const a=points[0],b=points[1],c=points[2],u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
   const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n);
   if(len<1e-8)return;
   for(const p of points){this.positions.push(...p);this.normals.push(...n.map(x=>x/len));this.colors.push(...rgb);}
   const face=points.map((_,i)=>start+i);this.quads.push(face);
   for(let i=1;i+1<face.length;i++)this.indices.push(start,start+i,start+i+1);
  }
  geometry(){
   const T=this.T,g=new T.BufferGeometry();
   for(const [name,values] of [['position',this.positions],['normal',this.normals],['color',this.colors]])g.setAttribute(name,new T.Float32BufferAttribute(values,3));
   g.setIndex(this.indices);g.computeBoundingSphere();g.userData.polygons=this.quads;return g;
  }
 }
 const axes=[[1,2],[2,0],[0,1]];
 function oriented(points,normal){
  const [a,b,c]=points,u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
  const dot=(u[1]*v[2]-u[2]*v[1])*normal[0]+(u[2]*v[0]-u[0]*v[2])*normal[1]+(u[0]*v[1]-u[1]*v[0])*normal[2];
  return dot<0?points.reverse():points;
 }
 function bevel(surface,center,size,r,shade){
  const half=size.map(x=>x/2),inner=half.map(x=>x-r);
  const emit=(points,n)=>surface.polygon(oriented(points,n).map(p=>p.map((x,i)=>x+center[i])),Array.isArray(shade)?shade:[shade,shade,shade]);
  for(let k=0;k<3;k++)for(const sign of [-1,1]){
   const [u,v]=axes[k],n=[0,0,0];n[k]=sign;
   emit([[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const p=[0,0,0];p[k]=sign*half[k];p[u]=x*inner[u];p[v]=y*inner[v];return p;}),n);
  }
  if(!r)return;
  for(let k=0;k<3;k++){const [u,v]=axes[k];for(const x of [-1,1])for(const y of [-1,1]){
   const n=[0,0,0];n[u]=x;n[v]=y;
   emit([[-1,0],[-1,1],[1,1],[1,0]].map(([end,edge])=>{const p=[0,0,0];p[k]=end*inner[k];p[u]=x*(edge?inner[u]:half[u]);p[v]=y*(edge?half[v]:inner[v]);return p;}),n);
  }}
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
   const n=[x,y,z];emit([0,1,2].map(k=>n.map((s,j)=>s*(j===k?half[j]:inner[j]))),n);
  }
 }
 function bodyGeometry(T,s,profile){
  const mesh=new Surface(T),kind=s.id.split('_')[0],size=s.size,offset=s.center,mir=s.id.endsWith('_E')?1:-1;
  const chamfer=profile===0?Math.min(...size)*.075:profile===1&&['cabeca','tronco','cintura','mao','pe'].includes(kind)?.026:0;
  bevel(mesh,offset,size,chamfer,1);
  const detail=(p,b,tone,cut=.012)=>bevel(mesh,p,b,profile===0?cut:0,tone);
  if(['cabeca','tronco','braco','antebraco','mao','canela','pe'].includes(kind)){
   const joint=kind==='cabeca'?[.43,.20,.42]:kind==='tronco'?[.80,.19,.48]:[size[0]*.76,.17,Math.min(size[2]*.78,.4)];
   detail([0,0,0],joint,.65);
  }else if(kind==='ombro')detail([-mir*.13,0,0],[.3,.28,.43],.76);
  if(kind==='pe')detail([0,-.218,.14],[.50,.067,.79],.68);
  if(kind==='mao'&&profile!==2)detail([-mir*.175,-.125,.12],[.105,.19,.23],.91);
  if(kind==='tronco'&&profile!==2)detail([0,.17,.005],[1.13,.28,.68],.94);
  if(kind==='cintura'&&profile!==2)detail([0,.34,0],[1.018,.066,.602],.88);
  return mesh.geometry();
 }
 const bodyCache=new Map(),fruitCache=new Map(),fruitSolids=new Map();
 function body(T,sceneData,tint,scale=1,profile=0){
  const root=new T.Group(),joints={},meshes={},anchors={};
  root.name='Corpo_Base_Voxel';root.scale.setScalar(scale);
  for(const s of sceneData.segments){
   const j=new T.Group();j.name=s.id;j.position.set(...s.pivot);j.rotation.set(...s.rotation);j.userData.spec=s;(s.parent?joints[s.parent]:root).add(j);joints[s.id]=j;
   const cacheKey=profile+'/'+s.id;if(!bodyCache.has(cacheKey))bodyCache.set(cacheKey,bodyGeometry(T,s,profile));
   const material=new T.MeshStandardMaterial({color:tint,vertexColors:true,roughness:s.id.startsWith('mao')?.73:.82,metalness:.045});
   const m=new T.Mesh(bodyCache.get(cacheKey),material);m.name=s.id+'_bloco';m.castShadow=m.receiveShadow=true;m.userData.segment=s.id;j.add(m);meshes[s.id]=m;
  }
  for(const [id,[parent,position]] of Object.entries(sockets)){const a=new T.Object3D();a.name=id;a.position.fromArray(position);joints[parent].add(a);anchors[id]=a;}
  const result={root,joints,meshes,sockets:anchors,setLOD(level){
   for(const s of sceneData.segments){const key=level+'/'+s.id;if(!bodyCache.has(key))bodyCache.set(key,bodyGeometry(T,s,level));meshes[s.id].geometry=bodyCache.get(key);}
   result.profile=level;
  }};result.setLOD(profile);return result;
 }
 // Rind shadow, rind, rind light, crest accent, pulp, seed, stalk, leaf,
 // face ink, glint, cheek, crest light, crest shadow, leaf vein.
 const palettes = [
  ['#294a92','#5b87f5','#96b5ff','#4867aa','#ffecb4','#816238','#536348','#669066','#172845','#fff9e4','#dfa650','#e8bd73','#283a65','#b2cb85','#a5bbdb'],
  ['#ad3937','#e75b3f','#ff9660','#ff8635','#ffdc7c','#a74f33','#78503c','#809351','#412935','#fff5d2','#ffac70','#ffca47','#b84538','#bfd05c'],
  ['#5a99b2','#92ceda','#c1eaf0','#58a9c2','#f0ffef','#686e98','#526f64','#87bdae','#273c57','#fffde8','#e8a9ae','#a9ebf1','#377f9b','#c0e1bd'],
  ['#b57739','#ebb449','#ffda82','#e5a637','#fff1af','#9a6e54','#80603c','#8e9b62','#48303d','#fffcde','#ee987b','#ffe66a','#98643b','#bdd16e'],
  ['#515774','#80879e','#b9c4cb','#ca8a78','#ffe3ac','#a66c4e','#68554a','#91a475','#333443','#fff4ce','#d9a579','#ffbd82','#69738c','#bed38a'],
  ['#604373','#8d66a2','#b08bc2','#ddd0f3','#e9cdea','#825579','#685443','#899166','#362a48','#ffefd0','#d796aa','#ffe49a','#916f9e','#bcba7e'],
  ['#247979','#39a5a0','#75cabe','#50c6b2','#d5fadc','#a06e5a','#715443','#81ad72','#213f43','#fff9d8','#f6aa89','#8fe7c9','#307f82','#b6d68a'],
  ['#a84f78','#dc80a4','#f4a8bf','#a6598b','#ffe5df','#a2667d','#705448','#7ca981','#492f49','#fff9e8','#ffbaa0','#ffd0df','#924877','#b5ce86'],
  ['#599553','#a9ef6f','#d0f89c','#4eaf86','#f2fbc6','#627947','#527a4b','#67b879','#194a3b','#f4fff1','#78cfa1','#b4fbe0','#28765d','#c7f899'],
  ['#b47a3f','#edba5c','#ffda83','#536d80','#ffecb1','#ac7146','#705743','#8e9a61','#40343c','#fff9d4','#ed9671','#e2ba78','#3f566c','#b9c47b'],
  ['#ad713e','#dca45f','#f1c885','#dca25e','#ffeab2','#996944','#74533b','#929753','#513b3c','#fff5d8','#e89673','#ffda8a','#ad6f43','#c6bb59'],
  ['#af4a48','#e57363','#ffa08a','#a6c0c5','#ffe2b7','#997783','#625749','#8ca47c','#3c303b','#fff8e2','#f4a690','#ff9e76','#4b8999','#c4cd88','#50909c','#8abac0','#366374'],
  ['#9695ac','#d7d6df','#f5efe8','#b52135','#ffbfa1','#96535c','#4a3946','#78875e','#271d31','#fff9e7','#e05e67','#f75a51','#681630','#adbd7b','#aebdc9','#fa967f'],
  ['#263486','#355dcc','#58d9fa','#f6a42e','#fff3bd','#a86438','#615048','#417f91','#202249','#fffcdf','#ee7762','#ffe576','#3840aa','#81c6ae','#d74b98','#8261e8'],
  ['#551a36','#a82c46','#d75360','#d99733','#ffe4b8','#9b553d','#694532','#827348','#291923','#fffae3','#edb48b','#ffd975','#8a4528','#acaa60','#ee8591','#8b3448'],
  ['#242333','#424254','#69677c','#e7a239','#fbcd81','#875638','#584736','#878956','#131424','#fff3cd','#c2875b','#ffe08b','#9e602c','#bcc07d','#9296aa','#bd7830']
 ];
 const fruitNames=['Impacto','Brasa','Geada','Tormenta','Lobo','Eclipse','Maré','Cristal','Eco','Falcão','Duna','Ímã','Besta','Fênix','Dragão Oriental','Dragão Ocidental'];
 const fruitDesigns=[
  {width:12,face:'impact',mark:'plates'}, {width:10,face:'impish',mark:'flame'},
  {width:11,face:'gentle',mark:'frost'}, {width:10,face:'alert',mark:'bands'},
  {width:11,face:'wolf',mark:'fur'}, {width:10,face:'wink',mark:'moon'},
  {width:11,face:'smile',mark:'wave'}, {width:10,face:'gentle',mark:'seam'},
  {width:11,face:'echo',mark:'chime'}, {width:10,face:'falcon',mark:'fur'},
  {width:11,face:'sleepy',mark:'dune'}, {width:11,face:'curious',mark:'poles'}
 ];

const classicChibiCrowns = [
 // Impacto. Cabeça do pistão, junta recuada e sapatas que abraçam os flancos.
 [
  [-8,8,5,6,-3,5,13], [-7,7,6,6,-2,4,4],
  [-4,4,7,8,-1,3,4], [-4,4,7,7,3,3,12],
  [-8,8,9,10,-2,4,4], [-7,7,11,11,-2,4,2],
  [-7,7,10,10,4,4,2], [-6,4,11,11,2,4,3],
  [-12,-10,-4,3,-5,5,13], [10,12,-4,3,-5,5,13],
  [-13,-12,-3,2,-4,4,4], [12,13,-3,2,-4,4,4],
  [-14,-13,-2,1,-3,3,2], [13,14,-2,1,-3,3,2],
  [-14,-14,-1,0,-1,0,12], [14,14,-1,0,-1,0,12]
 ],
 // Brasa. The wider lower flame folds around a second, smaller golden tongue.
 [
  [-6,5,8,10,-1,4,13], [-6,4,9,11,0,4,4],
  [-7,-4,10,13,0,3,4], [-8,-6,13,14,0,2,12],
  [-4,3,11,13,-1,4,4], [-4,1,14,15,-1,3,4],
  [-2,1,16,17,0,3,12], [0,2,17,18,0,2,12],
  [3,7,10,11,0,3,4], [5,7,12,13,0,3,12], [6,7,14,15,0,2,12],
  [-4,3,9,11,4,5,12], [-2,1,12,13,4,4,12], [-2,-1,14,14,3,4,12],
  [-1,1,9,10,5,5,5]
 ],
 // Geada. A low shelf of frost carries two block-cut peaks and drips over the shoulder.
 [
  [-8,6,7,9,2,6,4], [-7,5,9,10,3,6,12],
  [-6,-1,10,13,1,4,4], [-6,-3,14,15,1,4,12], [-6,-4,16,16,2,3,10],
  [-5,-4,10,13,4,4,12], [-3,-2,10,11,4,4,10],
  [2,6,10,11,1,4,4], [3,6,12,13,1,4,12], [4,6,14,14,2,3,10],
  [5,8,7,8,5,7,12], [7,9,6,7,6,8,4], [8,9,3,6,7,8,12], [8,8,2,3,8,8,10],
  [-7,-5,7,8,6,8,12], [-7,-6,5,7,8,8,10]
 ],
 // Tormenta. A single continuous crooked bolt, with open notches on both sides.
 [
  [-7,-4,8,9,0,3,13], [-6,-2,10,10,0,3,13], [-5,0,11,11,0,3,13],
  [-3,2,12,12,0,3,13], [-6,4,13,14,0,3,13], [-5,0,15,15,0,3,13],
  [-3,2,16,16,0,3,13], [-2,4,17,17,0,3,13], [0,5,18,18,0,3,13],
  [-7,-4,8,9,3,4,12], [-6,-2,10,10,3,4,12], [-5,0,11,11,3,4,12],
  [-3,2,12,12,3,4,12], [-6,4,13,14,3,4,12], [-5,0,15,15,3,4,12],
  [-3,2,16,16,3,4,12], [-2,4,17,17,3,4,12], [0,5,18,18,3,4,12],
  [-6,-3,13,13,4,4,10], [0,3,18,18,4,4,10]
 ],
 // Lobo. Two folded sepal ears lean out, with the warm inner faces pointing forward.
 [
  [-10,-3,7,9,-1,4,1], [-10,-4,10,11,-1,4,2], [-10,-5,12,13,0,4,2],
  [-10,-7,14,15,0,3,2], [-10,-8,16,16,0,2,3],
  [-8,-5,9,10,4,4,4], [-9,-6,11,12,4,4,4], [-9,-8,13,14,3,4,12],
  [3,10,7,9,-1,4,1], [4,10,10,11,-1,4,2], [5,10,12,13,0,4,2],
  [7,10,14,15,0,3,2], [8,10,16,16,0,2,3],
  [5,8,9,10,4,4,4], [6,9,11,12,4,4,4], [8,9,13,14,3,4,12]
 ],
 // Eclipse. A real open crescent; the hollow extends from front to back.
 [
  [-5,2,8,9,1,4,13], [-7,-2,10,10,1,4,13], [-2,3,10,10,1,4,13], [2,4,11,11,1,4,13],
  [-8,-4,11,11,1,4,13], [-9,-6,12,15,1,4,13], [-8,-4,16,16,1,4,13],
  [-7,0,17,17,1,4,13], [-5,3,18,18,1,4,13],
  [-5,2,8,9,4,5,4], [-7,3,10,10,4,5,4], [2,4,11,11,4,5,12],
  [-8,-4,11,11,4,5,4], [-9,-6,12,15,4,5,12], [-8,-4,16,16,4,5,12],
  [-7,0,17,17,4,5,12], [-5,3,18,18,4,5,12], [-5,-2,18,18,5,5,10]
 ]
];

// Peças em ordem de pintura; os intervalos incluem os dois extremos.
const expansionChibiCrowns = [
  // Maré. A crista prende à casca pela esquerda; o lábio vira sobre um vão real.
  [
    [-8, -3, 7, 10, -3, 4, 13],
    [-8, -5, 10, 13, -3, 3, 13],
    [-7, -4, 12, 15, -2, 3, 12],
    [-6, -3, 14, 16, -2, 3, 12],
    [-4, 2, 15, 17, -2, 3, 12],
    [1, 5, 14, 16, -1, 4, 12],
    [4, 7, 12, 15, 0, 4, 4],
    [5, 7, 11, 13, 1, 4, 10],
    [3, 5, 11, 12, 1, 4, 10],
    [-4, -1, 17, 17, -1, 3, 4],
    [0, 3, 16, 17, 0, 3, 4],
    [-6, -4, 9, 12, 4, 5, 3],
    [-5, -2, 7, 9, 4, 6, 3],
    [-2, 1, 7, 8, 5, 6, 3]
  ],
  // Cristal. Três botões de quartzo de alturas diferentes; uma faceta clara em cada.
  [
    [-4, 5, 7, 9, -3, 4, 13],
    [-2, 2, 9, 15, -3, 1, 12],
    [-1, 3, 10, 15, -2, 2, 12],
    [-1, 2, 16, 17, -2, 1, 12],
    [0, 1, 18, 18, -1, 0, 10],
    [1, 2, 10, 15, 2, 2, 4],
    [1, 2, 16, 17, 1, 1, 4],
    [-7, -3, 7, 10, 0, 4, 13],
    [-8, -5, 10, 12, 0, 4, 12],
    [-9, -6, 12, 14, 0, 3, 12],
    [-9, -8, 15, 15, 1, 2, 4],
    [-8, -7, 12, 14, 3, 3, 4],
    [3, 6, 8, 10, 1, 5, 13],
    [5, 8, 9, 11, 1, 4, 12],
    [7, 9, 11, 12, 1, 3, 4],
    [8, 9, 13, 13, 2, 2, 10]
  ],
  // Eco. Uma haste se divide em duas lâminas de diapasão acima da boca da sineta.
  [
    [-2,2,8,10,0,3,13], [-3,3,10,11,0,3,4],
    [-5,-2,11,12,0,3,4], [2,5,11,12,0,3,4],
    [-6,-4,12,16,0,3,4], [4,6,12,16,0,3,4],
    [-6,-5,16,18,0,2,12], [5,6,16,18,0,2,12],
    [-5,-4,13,16,3,3,12], [4,5,13,16,3,3,12],
    [-6,-5,18,18,1,2,10], [5,6,18,18,1,2,10],
    [-2,2,-9,-8,0,4,13], [-2,2,-10,-9,1,3,12]
  ],
  // Falcão. Três pontas por lado. As penas externas abrem para os lados da fruta.
  [
    [-9, -6, 6, 9, -3, 4, 13],
    [6, 9, 6, 9, -3, 4, 13],
    [-11, -8, 8, 10, -3, 3, 12],
    [8, 11, 8, 10, -3, 3, 12],
    [-12, -10, 10, 11, -3, 2, 12],
    [10, 12, 10, 11, -3, 2, 12],
    [-14, -11, 11, 12, -3, 0, 13],
    [11, 14, 11, 12, -3, 0, 13],
    [-15, -13, 13, 14, -3, -1, 3],
    [13, 15, 13, 14, -3, -1, 3],
    [-14, -11, 9, 10, 1, 3, 4],
    [11, 14, 9, 10, 1, 3, 4],
    [-15, -14, 10, 11, 2, 3, 12],
    [14, 15, 10, 11, 2, 3, 12],
    [-12, -9, 7, 8, 3, 5, 13],
    [9, 12, 7, 8, 3, 5, 13],
    [-14, -12, 7, 8, 4, 5, 3],
    [12, 14, 7, 8, 4, 5, 3]
  ],
  // Duna. Cristas deslocadas: rampa longa a barlavento e queda curta a sotavento.
  [
    [-9, 6, 7, 9, -3, 2, 4],
    [-9, 4, 9, 10, -3, 2, 12],
    [-8, 2, 10, 11, -2, 2, 12],
    [-7, 0, 11, 12, -2, 1, 12],
    [-6, -2, 12, 13, -1, 1, 12],
    [-5, -3, 14, 14, -1, 0, 4],
    [0, 9, 7, 9, -5, -2, 13],
    [2, 9, 9, 10, -5, -2, 4],
    [4, 8, 10, 11, -5, -3, 12],
    [6, 8, 11, 12, -4, -3, 4],
    [-7, 8, 7, 8, 3, 5, 13],
    [-4, 7, 8, 9, 3, 5, 4],
    [-1, 6, 9, 10, 3, 4, 12],
    [2, 5, 10, 11, 3, 4, 4]
  ],
  // Ímã. Uma única alça aberta, com base bicolor e dois polos retangulares livres.
  [
    [-4, -1, 8, 10, 0, 4, 1],
    [0, 4, 8, 10, 0, 4, 13],
    [-6, -1, 10, 12, 0, 4, 2],
    [0, 6, 10, 12, 0, 4, 13],
    [-7, -5, 11, 13, 0, 4, 2],
    [5, 7, 11, 13, 0, 4, 13],
    [-8, -5, 13, 16, 0, 4, 2],
    [5, 8, 13, 16, 0, 4, 13],
    [-8, -5, 16, 18, 0, 4, 4],
    [5, 8, 16, 18, 0, 4, 8],
    [-8, -7, 18, 18, 1, 4, 10],
    [5, 6, 18, 18, 1, 4, 10],
    [-5, -2, 10, 10, 4, 4, 12],
    [2, 5, 10, 10, 4, 4, 8]
  ]
];


 const crowns=classicChibiCrowns.concat(expansionChibiCrowns);
 const fruitStep=1/32, fruitHalfGrid=20, fruitGrid=fruitHalfGrid*2+1;
 // Raio de cada camada da campânula, da borda ao encontro do diapasão.
 const chimeWidths=[12,12,13,13,13,12,12,11,11,11,10,10,9,8,7,6,6];
 const chimeDepths=[8,8,10,10,9,9,9,9,9,9,9,9,9,8,7,6,6];
 // A compact lattice lets a one-voxel expression survive all three detail profiles.
 // Detail is removed by feature, never by re-sampling the face at a different phase.
 // Mythical fruit anatomy is carved into the edible lattice. Horns, wing ribs
 // and leaf vanes are real solids, so a bite can remove them as well as peel.
 function mythicalSolid(fruit,profile){
  const n=fruitGrid,mid=fruitHalfGrid,cells=new Uint8Array(n*n*n);
  const beast=fruit===12,phoenix=fruit===13,east=fruit===14,west=fruit===15;
  const put=(x,y,z,c)=>{
   if(Math.abs(x)<mid&&Math.abs(y)<mid&&Math.abs(z)<mid)cells[x+mid+n*(y+mid+n*(z+mid))]=c;
  };
  // Each section specifies half-width, half-depth and its octagonal corner cut.
  const cores=beast?[[7,6,3],[9,7,3],[10,8,3],[11,9,3],[11,9,3],[10,9,3],[9,8,3],[7,7,3],[4,4,2]]:
              phoenix?[[4,4,2],[6,6,3],[8,7,3],[9,8,3],[10,9,3],[10,9,3],[9,8,3],[7,7,3],[4,4,2]]:
              east?[[5,6,3],[7,7,3],[9,8,3],[10,9,3],[10,9,3],[9,9,3],[9,8,3],[7,7,3],[4,4,2]]:
                   [[6,6,3],[8,7,3],[10,8,3],[11,9,3],[11,9,4],[10,9,4],[9,8,3],[7,7,3],[4,4,2]];
  const front=new Map();
  for(let y=-9;y<=7;y++){
   const [w,d,k]=cores[Math.floor((y+9)*.5)];
   for(let x=-w;x<=w;x++){
    const end=d-Math.max(0,Math.abs(x)-w+k);
    front.set(x+41*y,end);
    for(let z=-end;z<=end;z++){
     let tone=y< -5?1:y>4?3:2;
     // Chevrons spiral along the flanks; the central panel carries the face.
     if(Math.abs(x)>6||z<1){
      const q=(Math.abs(x)+Math.abs(z+2))%6;
      if((y+24+Math.floor(q/2))%6===0)tone=1;
      if(profile===0&&(y+25+Math.floor(q/2))%6===0)tone=3;
     }
     put(x,y,z,tone);
    }
   }
  }
  // A faceted swept brush. Knots can change taper and colour independently.
  function seal(cx,cy,cz,rx,ry,rz,colour){
   const radius=(v,r)=>Math.abs(v)/Math.max(.5,r+.36);
   for(let y=Math.ceil(cy-ry-.35);y<=Math.floor(cy+ry+.35);y++){
    for(let z=Math.ceil(cz-rz-.35);z<=Math.floor(cz+rz+.35);z++)for(let x=Math.ceil(cx-rx-.35);x<=Math.floor(cx+rx+.35);x++){
     const a=radius(x-cx,rx),b=radius(y-cy,ry),c=radius(z-cz,rz);
     if(Math.max(a,b,c)<=1.01&&a+b+c<=1.94)put(x,y,z,colour);
    }
   }
  }
  function brush(knots,palette,aspect=[1,1,1]){
   for(let i=1;i<knots.length;i++){
    const a=knots[i-1],b=knots[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])*2);
    for(let s=0;s<=steps;s++){
     const f=steps?s/steps:0,[x,y,z,r]=a.map((v,k)=>v+(b[k]-v)*f);
     seal(x,y,z,Math.max(.47,r*aspect[0]),Math.max(.47,r*aspect[1]),Math.max(.47,r*aspect[2]),Array.isArray(palette)?palette[i-1]:palette);
    }
   }
  }
  const mirror=(side,path)=>path.map(([x,y,z,r])=>[side*x,y,z,r]);
  // Layer peel markings against its actual surface, even on the tapered chin.
  function browPatch(x,y,c,relief=0){
   const z=front.get(x+41*y);if(z===undefined)return;
   for(let i=0;i<=relief;i++)put(x,y,z+i,c);
  }
  function plume(side,a,b,c,width,pigment,tip,shaft){
   // A folded, pointed leaf following a quadratic curve across the shell.
   for(let i=0;i<=26;i++){
    const t=i/26,u=1-t;
    const x=side*(u*u*a[0]+2*u*t*b[0]+t*t*c[0]),y=u*u*a[1]+2*u*t*b[1]+t*t*c[1],z=u*u*a[2]+2*u*t*b[2]+t*t*c[2];
    const vane=.53+width*Math.sin(Math.PI*Math.pow(t,.76));
    seal(x,y,z,vane,Math.min(1.22,vane),vane*.69,t>.74?tip:pigment);
    if(profile<2&&t<.77&&t>.12)seal(x-side*.48,y+.22,z+vane*.57,.53,.52,.59,shaft);
   }
  }
  if(beast){
   for(const side of [-1,1]){
    // Layers of white mane emerge under lacquered ox horns.
    for(const [x,y,z,dx,dy,dz] of [[7,5,5,13,-2,5],[8,3,2,14,-4,1],[8,2,-2,13,-4,-4],[7,3,-5,11,-3,-8],[6,4,-6,8,-1,-10]]){
     plume(side,[x,y,z],[x+4,y+2,z+1],[dx,dy,dz],2.15,3,10,15);
    }
    brush(mirror(side,[[7,5,4,2.7],[11,7,4,2.5],[14,9,3,2.1],[15,13,2,1.45],[14,16,1,.56]]),[13,4,4,12]);
    if(profile<2)brush(mirror(side,[[10,8,6,1],[13,10,5,.7],[14,13,4,.53]]),12);
    plume(side,[3,5,8],[6,6,9],[9,2,8],1.65,4,13,12);
    plume(side,[1,6,5],[3,12,2],[5,15,-1],1.9,3,10,15);
   }
   plume(1,[0,6,5],[-2,13,3],[0,18,1],2.2,3,10,4);
   for(let y=1;y<=7;y++)for(let x=-1;x<=1;x++)if(y>3||x===0)browPatch(x,y,x===0?4:13,1);
  }else if(phoenix){
   for(const side of [-1,1]){
    // Long primaries rise behind short warm coverts, exposing the folded tips.
    plume(side,[6,3,-2],[12,11,-5],[16,15,-6],2.15,13,3,12);
    plume(side,[7,2,-1],[13,8,-2],[17,10,-3],2.15,2,3,12);
    plume(side,[7,1,1],[12,6,2],[17,6,1],1.85,16,3,2);
    plume(side,[8,-1,2],[13,3,3],[16,2,3],1.60,15,16,12);
    plume(side,[7,-2,3],[10,0,4],[14,-2,4],1.25,4,15,12);
    plume(side,[3,6,1],[5,12,0],[7,16,-3],1.1,4,12,12);
    plume(side,[2,-5,-5],[8,-7,-10],[10,-12,-9],1.7,16,3,12);
    plume(side,[0,-6,-4],[4,-8,-11],[5,-15,-9],2.05,15,3,16);
   }
   plume(1,[0,-6,-3],[-1,-11,-10],[-1,-16,-9],1.8,4,16,12);
   plume(1,[0,5,5],[-2,12,3],[0,17,2],1.75,3,12,4);
   for(let y=-8;y<=-4;y++)for(let x=-5;x<=5;x++){
    const edge=Math.abs(x);if(edge<=y+9)browPatch(x,y,edge===y+9?12:4,0);
   }
  }else if(east){
   // A raised scale-covered vine circles the fruit and ends over its back.
   const coil=[];
   for(let i=0;i<=30;i++){
    const u=i/30,a=-.2+u*4.85;
    coil.push([Math.cos(a)*(9.6+1.3*u),-7+u*13.7,Math.sin(a)*(7.5+1.5*u),2.15-.35*u]);
   }
   brush(coil,13);
   if(profile<2)for(let i=1;i<coil.length-1;i++){
    const [x,y,z]=coil[i];seal(x,y+.8,z,1.5,.6,1.5,i%4===0?12:4);
   }
   for(const side of [-1,1]){
    brush(mirror(side,[[5,6,2,1.8],[6,10,1,1.65],[10,12,0,1.4],[11,15,-1,1.15],[13,17,-2,.53]]),[13,4,4,12]);
    brush(mirror(side,[[6,10,1,1.25],[5,13,2,1],[6,16,3,.53]]),[4,12]);
    brush(mirror(side,[[10,13,0,1.12],[14,13,0,.9],[16,15,0,.5]]),[4,12]);
    plume(side,[6,4,-3],[11,8,-5],[13,8,-9],1.8,1,3,4);
    plume(side,[5,6,-3],[8,12,-6],[10,13,-9],1.65,2,3,4);
    brush(mirror(side,[[3,-2,9,.9],[7,-3,10,.85],[11,-2,10,.7],[13,0,9,.60],[12,2,8,.5]]),12);
   }
   for(let y=-8;y<=-4;y++)for(let x=-4;x<=4;x++)if(Math.abs(x)<y+10)browPatch(x,y,y%3===0?11:5);
  }else{
   // Ribbed membrane between the leading edge and a scalloped trailing edge.
   for(const side of [-1,1]){
    for(let x=6;x<=17;x++){
     const t=(x-6)/11,top=Math.round(5+13*Math.sin(t*Math.PI*.86));
     const bottom=Math.round(-2+4*Math.sin(Math.PI*((x-6)%5)/5)+2*t);
     const z=Math.round(-1-4*Math.sin(t*1.65));
     for(let y=bottom;y<=top;y++){
      const rib=y>=top-1||x===17||y<=bottom||Math.abs((y-top*.58)+.52*(x-11))<.7&&x>10;
      const c=rib?1: y>top*.8?13:y<bottom+2?12:4;
      put(side*x,y,z,c);put(side*x,y,z-1,rib?1:13);
     }
    }
    brush(mirror(side,[[6,4,-1,1.6],[9,10,-3,1.4],[12,16,-5,1.45],[14,18,-5,.9],[16,19,-6,.48]]),[1,1,4,12]);
    brush(mirror(side,[[4,6,4,1.8],[6,10,3,1.5],[6,13,1,1.0],[7,16,0,.53]]),[1,4,12]);
    plume(side,[3,4,8],[6,7,8],[9,5,7],1.5,1,4,12);
   }
   for(let y=-8;y<=-3;y++)for(let x=-4;x<=4;x++){
    const w=Math.min(4,y+10);if(Math.abs(x)<=w)browPatch(x,y,(y+Math.abs(x))%3===0?13:4);
   }
   brush([[0,-5,-6,2],[3,-6,-10,1.7],[7,-4,-13,1.38],[9,-1,-13,1],[8,1,-12,.56]],[1,2,4,12]);
  }
  // A crooked peduncle and a serrated leaf distinguish the edible bulb at every angle.
  brush([[0,6,-1,1.70],[-2,9,-2,1.45],[-2,12,-3,1.45],[0,14,-4,1.15],[3,14,-4,.94],[4,12,-3,.65]],7);
  plume(-1,[1,9,-2],[5,12,-4],[8,11,-6],1.3,8,14,14);
  for(const side of [-1,1]){
   const center=beast?5:4;
   for(let dx=-2;dx<=1;dx++)for(let y=-2;y<=1;y++){
    if(dx===-2&&y===-2||dx===1&&y===1)continue;
    browPatch(side*(center+dx),y,9,1);
   }
   browPatch(side*(center-1),0,10,2);browPatch(side*center,-1,west||east?4:12,1);
   for(let dx=-2;dx<=2;dx++)browPatch(side*(center+dx),2+Math.floor((dx+1)/3),beast?4:phoenix?3:4,1);
  }
  if(phoenix){
   seal(0,-1.6,10,1.7,1.25,2.1,4);seal(0,-2.7,11.3,1,1,1.5,12);
  }else{
   const nose=beast?3:east?2:1;seal(0,-2.3,9.5,3.25,1.65,2,nose);
   if(beast)seal(0,-1.7,11.15,1.6,.8,.7,9);
   else for(const side of [-1,1])seal(side*1.6,-1.8,11,.56,.52,.56,9);
   for(const side of [-1,1]){
    browPatch(2*side,-4,9,1);
    if(beast||west)seal(side*2.8,-4.6,9.4,.65,1.05,.65,10);
   }
  }
  return cells;
 }

 function buildFruitSolid(fruit,profile){
  if(fruit>=12)return mythicalSolid(fruit,profile);
  const n=fruitGrid,mid=fruitHalfGrid,solid=new Uint8Array(n*n*n);
  const {width,face,mark}=fruitDesigns[fruit];
  const at=(x,y,z)=>(x+mid)+n*((y+mid)+n*(z+mid));
  function paint(x0,x1,y0,y1,z0,z1,colour){
   for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)solid.fill(colour,at(x0,y,z),at(x1,y,z)+1);
  }
  const top=mark==='plates'?5:8;
  for(let y=-8;y<=top;y++){
   const corner=Math.max(0,-6-y,y-(top-2));
   const w=mark==='chime'?chimeWidths[y+8]:width-corner;
   const d=mark==='chime'?chimeDepths[y+8]:9-corner;
   for(let z=-d;z<=d;z++)for(let x=-w;x<=w;x++){
    if(Math.abs(x)+Math.abs(z)>w+d-2)continue;
    const blue=mark==='poles'&&x>=1, shade=blue?17:1, midtone=blue?15:2,light=blue?16:3;
    let tone=midtone;
    if(y===top||y===top-1&&(x<0||z<1))tone=light;
    const bottom=-6+(x>width-3||z<-5?1:0);
    if(y<=bottom)tone=shade;
    if(mark==='chime'&&y===-6)tone=4;
    if(mark==='chime'&&y===-5)tone=12;
    if(mark==='plates'&&y===-6)tone=13;
    if(profile<2&&y>=-4&&y<=4&&(Math.abs(x)>=width-1||z<-6)){
     const distance=Math.abs(z+1),side=width-Math.abs(x),line=profile===0?1:0;
     switch(mark){
      case 'bands': if((y===2||y===0)&&z>=-3&&z<=3+line&&side<2)tone=light;break;
      case 'flame': if(y<=-1+Math.max(0,3-distance)&&y>=-2&&side===0)tone=shade;break;
      case 'frost': if(y>1&&distance<2||distance===3&&y===4)tone=light;break;
      case 'fur': if((z===-3||z===1||z===2)&&y>=1&&y<=4-Math.abs(z%3))tone=shade;break;
      case 'moon': if(distance>=2&&distance<=3&&y===1||z===-1&&y===3)tone=light;break;
      case 'wave': if(Math.abs(y-(z<-1?0:z<2?1:2))<=line&&Math.abs(z)<=4)tone=light;break;
      case 'seam': if(Math.abs(z)<=4&&y===Math.floor((z+4)/3))tone=light;break;
      case 'chime': if((distance===1&&Math.abs(y)<=2||profile===0&&distance===3&&Math.abs(y)<=1)&&Math.abs(x)===w)tone=4;break;
      case 'plates': if(Math.abs(z)<=4&&y===-3)tone=13;break;
      case 'dune': if((y===-1||y===2)&&z>=-4&&z<=4&&side<2)tone=light;break;
      case 'poles': if(Math.abs(z)<=2&&y===2&&side===0)tone=light;break;
     }
    }
    solid[at(x,y,z)]=tone;
   }
  }
  if(mark==='chime'){
   // A sépala pende para o lado, deixando céu livre entre os dois ramos.
   paint(3,5,6,8,-4,-2,7);paint(5,7,7,8,-5,-2,8);
   paint(7,9,6,7,-5,-2,8);paint(9,10,5,6,-4,-2,8);
   if(profile<2)paint(6,8,7,7,-2,-2,14);
  }else if(mark==='plates'){
   paint(-4,-2,5,7,-6,-3,7);paint(-6,-3,7,8,-7,-5,7);
   paint(-8,-6,8,9,-7,-6,8);paint(-10,-8,9,9,-7,-6,8);
   if(profile<2)paint(-8,-7,9,9,-6,-6,14);
  }else{
   paint(1,3,8,11,-5,-3,7);paint(2,5,11,12,-5,-3,7);paint(4,6,12,14,-5,-3,7);
   paint(4,6,10,11,-7,-4,8);paint(6,9,10,12,-8,-5,8);paint(9,10,12,13,-7,-5,8);
   if(profile<2){paint(6,8,12,12,-7,-6,14);paint(5,6,14,14,-4,-3,6);}
  }
  for(const box of crowns[fruit])paint(...box);
  // Small patches of bloom on the shoulder make the front read as waxy peel.
  if(profile<2&&mark!=='plates'){
   const shoulder=mark==='chime'?8:9;
   paint(-7,-5,4,4,9,9,3);paint(-7,-6,5,5,shoulder,shoulder,3);
  }
  function eye(sign,wink,raised){
   const a=sign<0?-6:4,b=sign<0?-4:6,y=raised?1:0;
   if(wink){paint(a,b,y,y,9,10,9);paint(sign<0?a:b,sign<0?a:b,y-1,y-1,9,10,9);return;}
   paint(a,b,y-2,y+1,9,10,9);
   paint(a+1,b,y+2,y+2,9,10,9);
   if(profile===0)paint(a,b-1,y-2,y-2,11,11,9);
   paint(a,a+1,y+1,y+1,10,11,10);paint(a+1,a+1,y+2,y+2,10,11,10);
  }
  if(face==='echo'){
   // Pálpebras curvadas e boca em O dão a expressão de quem sustenta uma nota.
   for(const x of [-5,5]){
    paint(x-1,x+1,1,1,9,10,9);
    paint(x-2,x-1,0,0,9,10,9);paint(x+1,x+2,0,0,9,10,9);
    if(profile===0)paint(x,x,0,0,10,10,12);
   }
  }else{
   eye(-1,face==='sleepy',false);eye(1,face==='sleepy'||face==='wink',face==='curious');
  }
  if(profile<2){
   const cheek=(l,r)=>{paint(l,r,-3,-3,9,9,11);if(profile===0)paint(l,r-1,-2,-2,9,9,11);};
   if(face!=='impact'){cheek(-9,-7);cheek(7,9);}
  }
  if(face==='wolf'){
   paint(-3,3,-4,-2,9,10,3);paint(-2,2,-4,-1,9,10,3);
   paint(-1,1,-2,-1,10,11,9);paint(0,0,-3,-3,10,11,9);
   paint(-2,2,-4,-4,10,10,9);paint(-3,-3,-3,-3,10,10,9);paint(3,3,-3,-3,10,10,9);
  }else if(face==='falcon'){
   paint(-2,2,-2,-1,9,10,4);paint(-1,1,-3,-1,10,11,12);paint(0,1,-3,-2,11,12,13);
  }else if(face==='echo'){
   paint(-1,1,-4,-2,9,10,9);paint(0,0,-4,-4,10,10,12);
  }else if(face==='impact'){
   paint(-2,1,-3,-3,9,10,9);paint(1,2,-2,-2,9,10,9);
   for(const x of [-8,8]){
    paint(x-1,x+1,-3,-1,9,10,4);paint(x,x,-2,-2,10,11,12);
    if(profile===0)paint(x-1,x-1,-1,-1,10,10,15);
   }
  }else if(face==='sleepy'||face==='curious'){
   paint(-1,1,-3,-3,9,10,9);if(face==='curious')paint(1,2,-2,-2,9,10,9);
  }else{
   paint(-1,1,-4,-4,9,10,9);paint(-2,-2,-3,-3,9,10,9);paint(2,2,-3,-3,9,10,9);
   if(face==='impish'){paint(0,1,-4,-3,10,10,9);paint(0,0,-4,-4,10,10,11);}
  }
  if(['impact','wolf','falcon','impish','alert'].includes(face)){
   const brow=face==='wolf'||face==='falcon'||face==='impact'?13:1;
   paint(-7,-5,4,4,9,10,brow);paint(-4,-3,3,3,9,10,brow);
   if(face!=='impish'){paint(5,7,4,4,9,10,brow);paint(3,4,3,3,9,10,brow);}
  }
  return solid;
 }
 // A crest held only by the portion that the character bit off goes with the bite.
 function fruitComponents(cells){
  const n=fruitGrid, stride=n*n,seen=new Uint8Array(cells.length),groups=[];
  for(let start=0;start<cells.length;start++){
   if(!cells[start]||seen[start])continue;
   const q=[start];seen[start]=1;
   for(let h=0;h<q.length;h++){
    const i=q[h],x=i%n,y=Math.floor(i/n)%n,z=Math.floor(i/stride);
    for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,y>0?i-n:-1,y<n-1?i+n:-1,z>0?i-stride:-1,z<n-1?i+stride:-1])if(j>=0&&cells[j]&&!seen[j]){seen[j]=1;q.push(j);}
   }groups.push(q);
  }return groups.sort((a,b)=>b.length-a.length);
 }
 function keepConnected(cells){for(const group of fruitComponents(cells).slice(1))for(const i of group)cells[i]=0;}
 // Reconnect detached decorative voxels through the shortest grid path.
 function repairFruitSolid(cells){
  const n=fruitGrid, stride=n*n, groups=fruitComponents(cells);if(groups.length<2)return cells;
  const owner=new Uint8Array(cells.length),dist=new Int16Array(cells.length).fill(-1),prev=new Int32Array(cells.length).fill(-1),q=groups[0].slice();
  for(const i of q){owner[i]=1;dist[i]=0;}
  for(let h=0;h<q.length;h++){
   const i=q[h],x=i%n,y=Math.floor(i/n)%n,z=Math.floor(i/stride);
   for(const j of [x>0?i-1:-1,x<n-1?i+1:-1,y>0?i-n:-1,y<n-1?i+n:-1,z>0?i-stride:-1,z<n-1?i+stride:-1])if(j>=0&&dist[j]<0){dist[j]=dist[i]+1;prev[j]=i;q.push(j);}
  }
  for(const group of groups.slice(1)){
   let i=group.reduce((a,b)=>dist[a]<=dist[b]?a:b),colour=cells[i];
   for(i=prev[i];i>=0&&!cells[i];i=prev[i])cells[i]=colour;
  }
  return cells;
 }

 // Pip positions stay fixed in the solid. A bite exposes whichever seeds and
 // pith lines its actual cut crosses, independently of the selected LOD.
 const seedBeds=[
  [[.10,.08,.08],[-.066,-.142,-.04]], [[.092,.07,.069],[.022,-.132,.01],[-.105,.04,-.162]],
  [[.058,.06,.132],[-.085,-.159,-.074]], [[.109,.061,.087],[-.042,-.152,-.05]],
  [[.097,.072,.087],[-.121,-.121,-.053]], [[.097,.076,.066],[-.018,-.171,-.065]],
  [[-.145,.057,.025],[.002,-.144,-.012]], [[.077,.078,.081],[-.063,-.135,-.110]],
  [[-.181,-.159,.004],[.16,-.061,-.066]], [[.078,.083,.099],[-.021,-.163,-.065]],
  [[.108,.045,.087],[-.087,-.163,-.089],[-.163,.035,-.075]], [[.134,.038,.092],[-.152,-.144,-.064]],
  [[.092,.064,.08],[-.11,-.12,-.055]],[[.081,.072,.09],[-.092,-.136,-.04]],
  [[.095,.063,.073],[-.113,-.13,-.053]],[[.083,.075,.091],[-.104,-.12,-.069]]
 ];
 function pulpCell(f,x,y,z,tint){
  const u=.876*x-.482*z,d=.482*x+.876*z;
  for(const [sx,sy,sz] of seedBeds[f]){
   const a=(x-sx-.25*(y-sy))/.047,b=(y-sy)/.077,c=(z-sz)/.054;
   if(a*a+b*b+c*c<1)return 6;
  }
  const curve=Math.hypot(u+.027,.84*d)+.078*y;
  return Math.abs(curve-.168)<.023||Math.abs(u-.38*y)<.018?tint:5;
 }
 // Greedy meshing emits only exposed rectangles. Cut faces use the original solid
 // and a fixed seed pattern, so the remaining skin never moves between bites.
 function fruitGeometry(T,fruit,profile,bite){
  const key=fruit+'/'+profile+'/'+bite;if(fruitCache.has(key))return fruitCache.get(key);
  const surf=new Surface(T),step=fruitStep,n=fruitGrid,mid=fruitHalfGrid,cells=new Uint8Array(n*n*n);
  const at=(x,y,z)=>x+n*(y+n*z),palette=palettes[fruit].map(hex=>new T.Color(hex).toArray());
  const fleshTint=palette.push(new T.Color(palettes[fruit][4]).lerp(new T.Color(palettes[fruit][1]),.21).toArray());
  const masterKey=fruit+'/'+profile;
  let solid=fruitSolids.get(masterKey);
  if(!solid){
   solid=repairFruitSolid(buildFruitSolid(fruit,profile));
   fruitSolids.set(masterKey,solid);
  }
  for(let k=0;k<n;k++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const id=at(i,j,k),v=solid[id];if(!v)continue;
   const x=(i-mid)*step,y=(j-mid)*step,z=(k-mid)*step;
   const first=((x-.22)/.28)**2+((y-.20)/.24)**2+((z-.26)/.32)**2<1.12;
   const second=((x+.12)/.42)**2+((y-.16)/.36)**2+((z-.18)/.39)**2<1.14;
   cells[id]=(bite>0&&first||bite>1&&second||bite>=3)?0:v;
  }
  if(bite===1||bite===2)keepConnected(cells);
  const mask=new Uint8Array(n*n),coords=[0,0,0];
  for(let d=0;d<3;d++){
   const [u,v]=axes[d];
   for(let k=0;k<n;k++)for(const sign of [-1,1]){
    coords[d]=k;mask.fill(0);
    for(let j=0;j<n;j++){coords[v]=j;for(let i=0;i<n;i++){coords[u]=i;const id=at(...coords),value=cells[id],next=k+sign<0||k+sign>=n?-1:id+sign*n**d;if(!value||cells[next])continue;const sliced=bite&&solid[next];mask[j*n+i]=sliced?pulpCell(fruit,(coords[0]-mid)*step,(coords[1]-mid)*step,(coords[2]-mid)*step,fleshTint):value;}}
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
     const c=mask[i+n*j];if(!c)continue;let w=1,h=1;
     while(i+w<n&&mask[i+w+n*j]===c)w++;
     rows:while(j+h<n){for(let q=0;q<w;q++)if(mask[i+q+n*(j+h)]!==c)break rows;h++;}
     for(let y=0;y<h;y++)mask.fill(0,i+n*(j+y),i+w+n*(j+y));
     const points=[[i,j],[i+w,j],[i+w,j+h],[i,j+h]].map(([x,y])=>{const p=[0,0,0];p[d]=(k-mid+sign*.5)*step;p[u]=(x-mid-.5)*step;p[v]=(y-mid-.5)*step;return p;});
     surf.polygon(sign<0?points.reverse():points,palette[c-1]);
    }
   }
  }
  const geometry=surf.geometry();fruitCache.set(key,geometry);return geometry;
 }
 const fruitMats=new Map();
 function fruit(T,index,profile=0){
  const root=new T.Group();root.name=fruitNames[index];
  if(!fruitMats.has(index))fruitMats.set(index,new T.MeshStandardMaterial({vertexColors:true,roughness:[.49,.54,.47,.58,.70,.54,.48,.42,.54,.56,.73,.50,.55,.43,.40,.39][index],metalness:[.14,.025,.05,.045,.015,.045,.025,.065,.02,.03,.01,.09,.065,.05,.11,.15][index]}));
  const mesh=new T.Mesh(fruitGeometry(T,index,profile,0),fruitMats.get(index));mesh.name='Casca_e_polpa';mesh.castShadow=true;root.add(mesh);
  root.userData.bites=0;root.userData.fruitIndex=index;
  root.userData.setState=(state,level=profile)=>{profile=level;root.userData.bites=state;mesh.visible=state<3;if(state<3)mesh.geometry=fruitGeometry(T,index,level,state);};
  return root;
 }
 return {Surface,oriented,bevel,profiles,sockets,palettes,body,bodyGeometry,fruit,fruitGeometry};
})();
