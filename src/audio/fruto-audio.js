// Módulo do FRUTO Laboratório Voxel, Edição 18 (dados 3.1), trazido sem alterações de lógica.
// Fonte: FRUTO_Laboratorio_Voxel_Edicao_18.html. Recebe o THREE como parâmetro (T).
/* eslint-disable */
export function createFruitAudio(){
 const voices=new Set();let audio,master,noise,on=false,volume=1;
 const sound={
  besta:[155,38,'sawtooth',.35,620],fenix:[1050,180,'triangle',.42,2100],oriental:[105,32,'sawtooth',.48,2800],ocidental:[82,25,'sawtooth',.55,950],
  impacto:[112,43,'triangle',.11,680],brasa:[225,63,'sawtooth',.22,1350],
  geada:[1390,735,'sine',.29,3550],tormenta:[810,109,'sawtooth',.15,2600],
  lobo:[188,51,'sawtooth',.23,760],eclipse:[143,46,'sine',.43,430],
  mare:[292,74,'sine',.30,1260],cristal:[1180,652,'sine',.36,3370],
  eco:[474,265,'triangle',.19,1340],falcao:[960,510,'sine',.21,2080],
  duna:[198,73,'triangle',.27,1820],ima:[310,106,'triangle',.24,540]
 };
 function enable(value){
  on=value;
  try{if(on){if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.65*volume;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=5;master.connect(limiter).connect(audio.destination);noise=audio.createBuffer(1,audio.sampleRate*.42,audio.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}audio.resume()?.catch(()=>{});}else{for(const node of voices){try{node.stop();}catch{}}}}catch{on=false;}
  return on;
 }
 function layer(type,start,end,life,volume,delay=0,filter=0,envelope={}){
  if(!on||!audio||voices.size>=32)return;
  const t=audio.currentTime+delay,node=type==='noise'?audio.createBufferSource():audio.createOscillator(),gain=audio.createGain();
  let tone;
  if(type==='noise'){node.buffer=noise;node.loop=life>noise.duration;tone=audio.createBiquadFilter();tone.type='bandpass';tone.frequency.setValueAtTime(filter||1000,t);if(envelope.endBand)tone.frequency.exponentialRampToValueAtTime(envelope.endBand,t+life);tone.Q.value=.8;node.connect(tone).connect(gain);}
  else{node.type=type;node.frequency.setValueAtTime(start,t);node.frequency.exponentialRampToValueAtTime(Math.max(19,end),t+life);node.connect(gain);}
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+(envelope.attack||.011));gain.gain.exponentialRampToValueAtTime(.0001,t+life);
  node.effectOwner=envelope.owner;
  gain.connect(master);voices.add(node);node.onended=()=>{voices.delete(node);node.disconnect();tone?.disconnect();gain.disconnect();};node.start(t);node.stop(t+life+.01);
 }
 function stopEffects(owner){
  for(const node of voices)if(node.effectOwner!=null&&(owner===undefined||node.effectOwner===owner)){try{node.stop();}catch{}}
 }
 function play(id,stage,strength=1,owner){
  if(!on)return;
  const wash=(band,endBand,life,volume,attack,delay=0)=>layer('noise',0,0,life,volume*strength,delay,band,{attack,endBand,owner});
  const rumble=(high,low,life,volume,delay=0)=>layer('sine',high,low,life,volume*strength,delay,0,{attack:.025,owner});
  switch(stage){
   case 'swing': wash(650,2400,.13,.13,.025);layer('triangle',210,70,.11,.055*strength);return;
   case 'step': wash(390,140,.085,.075,.004);rumble(82,42,.09,.055);return;
   case 'land': wash(780,180,.19,.14,.006);rumble(105,38,.22,.16);return;
   case 'jump': wash(520,1900,.16,.075,.025);return;
   case 'dash': wash(440,2800,.25,.16,.035);return;
   case 'splash': wash(2100,490,.28,.14,.015);wash(3900,1300,.15,.05,.01,.04);return;
   case 'wing': wash(350,1250,.24,.09,.07);return;
   case 'death': rumble(160,30,.55,.17);wash(650,110,.42,.09,.03);return;
   case 'absorb': layer('sine',260,780,.35,.12);layer('triangle',390,1170,.4,.065,.12);return;
   case 'transformar': if(['besta','fenix','oriental','ocidental'].includes(id)){wash(340,1850,.65,.16,.08);layer('sawtooth',id==='fenix'?420:95,id==='fenix'?920:32,.62,.085);rumble(105,35,.65,.13);return;}break;

   case 'arrebentar':
    wash(330,1860,.80,.15,.31);wash(2630,810,.62,.098,.055,.31);rumble(98,45,.55,.075,.20);return;
   case 'refluir':
    wash(1900,370,.84,.14,.13);wash(510,2020,.42,.082,.18,.37);return;
   case 'olho':
    wash(650,1620,.93,.11,.25);wash(1450,490,.89,.095,.34,.51);return;
   case 'furacao':
    wash(490,1740,1.08,.14,.30);wash(2260,870,.82,.072,.23,.2);rumble(88,52,.73,.059);return;
   case 'rajada':
    wash(860,2610,.64,.15,.16);wash(1980,520,.45,.10,.09,.17);return;
   case 'trovao':
    wash(3450,890,.18,.19,.008);wash(650,85,.66,.15,.05,.045);rumble(91,37,.65,.155,.055);return;
  }
  const [hi,low,type,tail,noiseBand]=sound[id]||sound.impacto;
  if(id==='eco'&&stage!=='morder'){
   const note=(hz,duration,level,delay=0)=>layer('sine',hz,hz*.998,duration,level*strength,delay,0,{attack:.008,owner});
   if(stage==='preparar'||stage==='recolher'){note(stage==='preparar'?392:330,.13,.043);return;}
   if(stage==='acerto'){note(784,.105,.044);return;}
   if(stage==='resposta'){note(784,.18,.11);note(1174.66,.22,.063,.068);return;}
   if(stage==='batida'||stage==='terca'){note(stage==='batida'?587.33:783.99,.19,.095);return;}
   note(392,.22,.091);note(587.33,.24,.054,.075);
   if(stage==='despertar'){note(783.99,.31,.056,.21);}
   return;
  }
  if(id==='impacto'&&stage!=='morder'){
   if(stage==='preparar'){wash(820,1470,.115,.065,.047);rumble(90,135,.12,.049);return;}
   if(stage==='recolher'){wash(670,190,.12,.045,.012);return;}
   const heavy=stage==='ruptura'||stage==='despertar',contact=stage==='acerto';
   // The short midrange snap keeps the blow audible on phone speakers.
   wash(heavy?1950:1570,470,.059,contact?.095:.12,.003);
   layer('triangle',heavy?227:187,heavy?58:75,heavy?.21:.105,.115*strength,.012,0,{attack:.007,owner});
   if(heavy){rumble(108,42,.31,.15,.018);wash(720,165,.22,.10,.012,.022);}
   return;
  }
  if(id==='lobo'&&(stage==='transformar'||stage==='despertar')){layer('triangle',230,452,.38,.085);layer('sine',450,290,.40,.052,.28);layer('noise',0,0,.32,.055,0,720);return;}
  if(stage==='preparar'){layer(type,low,hi*.78,tail,.044);return;}
  if(stage==='recolher'){layer('sine',hi*.7,low,tail,.035);return;}
  if(stage==='morder'){layer('noise',0,0,.083,.11,0,1200);layer('triangle',210,95,.07,.038);return;}
  const hit=stage==='acerto',awake=stage==='despertar',gain=(hit?.57:1)*strength;
  if(id==='mare'){layer('noise',0,0,hit?.18:.36,.098*gain,0,1190);layer('sine',awake?117:173,60,.25,.068*gain,.025);layer('noise',0,0,.17,.046*gain,.12,2400);return;}
  if(id==='cristal'){layer('sine',1180,1110,.28,.062*gain);layer('sine',1765,1678,.32,.046*gain,.035);if(!hit)layer('sine',awake?2360:1395,awake?2210:1310,.30,.031*gain,.10);return;}
  if(id==='falcao'){layer('sine',780,stage==='transformar'||awake?1530:1180,.12,.073*gain);layer('triangle',1230,560,.20,.049*gain,.09);layer('noise',0,0,.16,.047*gain,.035,1620);return;}
  if(id==='duna'){layer('noise',0,0,.25,.086*gain,0,1080);layer('noise',0,0,.16,.054*gain,.095,2270);layer('triangle',142,64,.21,.047*gain);return;}
  if(id==='ima'){layer('triangle',148,awake?484:335,.20,.068*gain);layer('sine',awake?680:480,167,.26,.053*gain,.046);layer('square',99,70,.08,.016*gain,.19);return;}
  const factor=stage==='acerto'?.76:stage==='despertar'?1.45:1;
  layer(type,hi*factor,low,tail*factor,.073*strength);
  layer('noise',0,0,Math.min(.40,tail*1.1),.073*strength,.013,noiseBand);
  if(stage==='despertar'||id==='geada'||id==='eclipse')layer('sine',hi*1.49,low*1.5,tail*1.32,.048,.033);
 }
 // Acréscimo do jogo: volume geral (configurações)
 function setVolume(v){volume=Math.max(0,Math.min(1,v));if(master)master.gain.value=.65*volume;}
 return {enable,play,stopEffects,setVolume,tone:(hz,duration,type='triangle')=>layer(type,hz,hz*.44,duration,.07)};
}
