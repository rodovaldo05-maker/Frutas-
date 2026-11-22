// Módulo do FRUTO Laboratório Voxel, Edição 18 (dados 3.1), trazido sem alterações de lógica.
// Fonte: FRUTO_Laboratorio_Voxel_Edicao_18.html. Recebe o THREE como parâmetro (T).
/* eslint-disable */
export const FRUTOMotion = (() => {
 const rad=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=t=>(t=clamp(t))*t*(3-2*t);
 const mix=(a,b,t)=>a+(b-a)*t;
 // Arms use elevation, opening, yaw, elbow bend and forearm roll; left/right
 // openings are anatomical, so poses remain readable viewed from the back.
 const guardL=[19,12,-7,59,-4],guardR=[15,15,9,71,6];
 function pose(shift,drop,lean,twist,tilt,left,right,stance=.09,forward=0,look=0){
  return {shift,drop,lean,twist,tilt,left,right,stance,forward,look};
 }
 const P={
  guard:pose(0,.095,4,5,0,guardL,guardR),
  jabLoad:pose(-.055,.13,2,19,-3,[8,18,-7,78,4],[29,10,6,71,2],.12),
  jab:pose(.08,.14,10,-23,4,[74,6,0,14,-4],[18,17,9,78,5],.18,.10),
  coil:pose(.11,.19,7,-30,6,[25,12,-6,76,5],[-12,28,19,83,-10],.19,-.04),
  cross:pose(-.105,.145,14,34,-5,[13,22,-5,83,4],[80,7,1,8,13],.15,.15),
  hookLoad:pose(-.13,.26,8,35,-9,[-12,48,-20,69,-17],[37,10,9,80,5],.20,-.08),
  hook:pose(.13,.17,12,-44,8,[69,45,-48,66,-31],[15,15,8,87,4],.21,.11),
  shoulder:pose(-.13,.29,23,27,-9,[37,10,-9,98,0],[-13,23,20,82,8],.22,.01),
  ram:pose(-.09,.23,29,31,-5,[-5,24,-24,72,8],[36,7,4,107,18],.27,.14),
  brace:pose(.06,.22,-6,-10,5,[38,27,-12,59,2],[33,27,13,70,-2],.25,-.10),
  press:pose(-.06,.22,4,17,-6,[38,33,-22,49,-18],[36,13,22,87,17],.24,-.04),
  stamp:pose(.06,.23,17,-14,5,[68,30,-18,14,-9],[57,15,15,24,22],.24,.09),
  pistonRack:pose(.13,.27,9,-38,7,[36,18,-6,78,-6],[-20,32,21,101,12],.29,-.095,4),
  pistonDriver:pose(-.10,.23,23,37,-6,[23,23,-12,92,-2],[81,6,3,8,16],.27,.17,3),
  pistonPlant:pose(.085,.34,17,-24,6,[38,25,-12,88,-6],[35,39,21,97,9],.34,-.06,11),
  pistonRaised:pose(.13,.23,-9,-36,8,[45,17,-8,84,-10],[138,32,15,79,18],.36,-.105,-5),
  pistonGround:pose(-.13,.46,54,33,-9,[12,56,-37,48,-23],[-27,12,9,13,12],.38,.18,18),
  pistonSettle:pose(-.08,.36,32,24,-5,[15,45,-20,62,-15],[-13,18,12,38,9],.34,.09,11),
  cup:pose(.07,.19,8,-23,4,[39,5,27,72,-34],[18,17,-20,86,38],.17,-.04,7),
  compress:pose(-.04,.20,11,10,-4,[48,4,24,57,-52],[46,5,-18,55,48],.14,.01,6),
  throw:pose(-.10,.16,17,35,-6,[17,28,-22,57,-23],[86,11,-8,13,21],.23,.16,-4),
  recoil:pose(-.05,.17,3,24,-2,[13,21,-11,71,-8],[53,22,7,40,20],.17,.05),
  sprinter:pose(.05,.29,26,-14,3,[-23,19,-14,79,0],[57,10,10,72,6],.32,-.07),
  flameRun:pose(-.04,.20,33,18,-2,[67,8,-7,52,1],[-35,25,18,97,12],.34,.10),
  earth:pose(0,.35,39,2,0,[32,27,-21,19,-15],[25,29,22,29,20],.27,.04,16),
  scoop:pose(-.045,.31,29,13,-3,[25,22,8,44,-15],[38,18,-7,33,12],.25,-.01),
  lift:pose(.025,.12,-12,-4,0,[137,36,-13,17,-16],[145,23,12,12,28],.24,.08,-13),
  iceMark:pose(.12,.25,13,-24,6,[57,9,-22,40,-22],[4,38,28,79,8],.24,-.06,9),
  carve:pose(-.12,.24,20,28,-8,[22,34,-30,62,15],[56,10,0,20,17],.26,.13,6),
  shieldFold:pose(0,.22,8,0,0,[38,6,35,81,-45],[47,7,-29,68,49],.18,-.06),
  wall:pose(0,.23,11,0,0,[84,20,-6,11,-28],[80,23,6,14,31],.27,.045),
  gather:pose(0,.24,3,0,0,[54,10,24,84,-33],[46,10,-24,86,30],.24,-.08),
  open:pose(0,.14,-8,0,1,[58,76,-15,12,-42],[52,77,15,15,42],.29,.02,-7),
  spark:pose(.045,.13,1,-17,5,[13,25,-27,69,7],[42,14,-4,95,21],.12,-.045),
  point:pose(-.08,.13,12,22,-6,[-5,37,-30,49,21],[88,5,-3,7,-4],.18,.12,-5),
  slideLoad:pose(-.095,.27,22,25,-7,[66,10,-10,44,0],[-23,26,19,74,-8],.32,-.08),
  slide:pose(.09,.16,31,-24,6,[-31,24,-21,55,-5],[65,8,4,33,7],.36,.12),
  sky:pose(.08,.15,-12,-19,5,[19,38,-16,46,-13],[158,12,8,12,19],.20,-.045,-15),
  conduct:pose(-.07,.25,16,20,-5,[50,37,-18,36,-7],[47,8,-6,12,10],.21,.095,11),
  claw:pose(.075,.29,30,-18,9,[30,19,20,89,21],[59,22,-12,66,-29],.26,.03,7),
  inhale:pose(0,.14,-6,0,0,[25,14,34,101,-35],[27,15,-32,97,41],.10,-.03,-5),
  wolfCoil:pose(-.08,.24,18,-32,-6,[24,36,-20,54,13],[4,46,-18,94,-28],.19,-.10,3),
  wolfRake:pose(.11,.22,25,32,9,[6,51,-25,64,16],[72,15,29,13,27],.24,.18,8),
  wolfLeft:pose(.05,.21,15,23,4,[12,49,16,87,-25],[59,26,14,58,30],.19,.05,6),
  wolfCross:pose(-.11,.23,26,-29,-8,[79,12,-31,15,-25],[3,32,24,65,24],.24,.15,7),
  wolfRise:pose(0,.06,-14,2,0,[77,51,-13,34,-29],[73,54,15,37,29],.22,.00,-19),
  wolfCrouch:pose(0,.40,41,0,0,[46,36,-15,65,-21],[54,28,20,62,25],.30,.12,12),
  // The wave travels from the back hip through the right shoulder. The return
  // current reverses that silhouette and draws both elbows down alongside the ribs.
  tideLow:pose(-.095,.27,17,-30,-6,[49,24,5,42,-24],[-19,53,-26,46,28],.24,-.075,7),
  tideSweep:pose(.115,.18,12,31,9,[27,43,-19,58,-16],[71,26,15,13,35],.27,.135,0),
  tideFollow:pose(.065,.16,6,39,5,[16,28,-20,69,-8],[80,39,34,23,38],.23,.08,-4),
  tideReach:pose(.015,.23,22,4,0,[64,19,16,19,-26],[57,26,-14,25,31],.23,.095,5),
  tideDraw:pose(-.055,.28,-10,-14,-4,[17,56,-28,91,-39],[30,51,31,83,37],.28,-.135,-7),
  tideCatch:pose(.045,.21,1,8,2,[42,20,7,76,-39],[40,25,-5,71,39],.22,-.04,3),
  tideCircle:pose(.085,.22,8,-27,7,[88,42,-29,39,-31],[42,17,-24,82,45],.26,-.055,-7),
  tideEye:pose(-.095,.26,18,28,-9,[78,24,17,24,-42],[29,47,-19,70,22],.28,.12,6),
  tideSpiral:pose(-.04,.15,-7,17,-3,[110,40,-13,27,-25],[53,42,20,51,33],.23,.025,-12),
  // Crystal forms lock along hard diagonals: a straight wrist on the spear,
  // a low stamping hip on the crown, and a forward, open hand to set the geode.
  quartzSight:pose(.095,.17,-3,-28,5,[54,10,4,49,-8],[8,20,-17,116,16],.20,-.075,-5),
  quartzPoint:pose(-.10,.16,13,32,-3,[13,28,-17,78,-8],[87,5,0,6,8],.23,.15,-4),
  quartzHold:pose(-.075,.17,10,29,-3,[18,24,-12,74,-7],[82,7,0,13,10],.22,.115,-4),
  crownGather:pose(-.10,.17,-9,-9,-6,[91,26,28,89,-36],[97,26,-23,86,34],.22,-.065,-14),
  crownStamp:pose(.09,.39,32,12,7,[14,59,-27,21,-36],[18,59,23,20,33],.36,.07,18),
  crownRise:pose(.055,.17,-13,2,4,[75,68,-13,18,-30],[79,64,13,20,28],.31,.02,-13),
  geodeCradle:pose(.075,.26,10,-23,4,[39,4,23,65,-34],[19,18,-29,88,45],.21,-.045,13),
  geodeOffer:pose(-.105,.32,31,30,-9,[21,29,-19,62,-15],[38,10,10,24,-38],.30,.15,19),
  geodeSeal:pose(-.075,.27,24,26,-7,[56,18,25,60,-19],[63,14,7,15,-14],.26,.10,9),
  // A single open palm pushes air. Contratempo listens on the right while
  // the left hand and shoulders mark the primary beat and its two returns.
  echoSpring:pose(-.06,.15,-4,18,-3,[26,17,-20,85,-23],[38,12,12,59,23],.15,-.065,-6),
  echoPalm:pose(.09,.16,11,-27,5,[83,10,7,15,-17],[12,25,15,83,16],.18,.105,-3),
  echoRebound:pose(.045,.15,2,-14,3,[58,20,0,43,-27],[18,20,11,70,16],.16,.03,-4),
  echoListen:pose(-.065,.17,-4,-5,-9,[30,28,-16,74,-29],[72,29,1,113,42],.20,-.05,-4),
  echoBeat:pose(.075,.18,11,-21,4,[77,15,9,22,-29],[61,28,2,95,32],.22,.09,0),
  echoAnswer:pose(-.055,.18,-3,10,-4,[41,29,-9,66,-36],[69,38,4,105,33],.21,-.035,-3),
  echoSecond:pose(.09,.21,15,-25,6,[86,19,17,11,-11],[52,41,10,85,23],.23,.105,2),
  echoLast:pose(.065,.17,8,-17,4,[69,24,12,29,-23],[30,40,17,67,19],.20,.055,0),
  chimeOpen:pose(0,.21,-8,1,0,[74,74,-16,25,-44],[77,71,16,28,44],.26,-.06,-8),
  chimeClose:pose(0,.24,13,0,0,[68,8,36,50,-36],[68,8,-36,50,36],.28,.095,5),
  chimeRing:pose(0,.14,-9,-1,0,[64,63,-10,18,-30],[68,61,10,19,30],.24,.005,-8),
  // The feather sweep starts behind the right shoulder and fans out.
  // Both changing silhouettes fold inward before their outward lift.
  featherWind:pose(-.105,.22,10,-28,-8,[26,42,-28,52,-17],[35,66,-31,60,41],.22,-.075,2),
  featherCast:pose(.10,.16,16,29,8,[19,64,-26,35,-23],[89,15,31,12,39],.26,.12,-6),
  featherDrift:pose(.055,.12,-7,22,5,[38,63,-25,30,-16],[82,45,28,32,37],.23,.05,-10),
  falconFold:pose(0,.23,14,0,0,[47,4,37,82,-41],[51,7,-32,81,45],.19,-.055,3),
  falconMantle:pose(.03,.11,-9,-3,2,[91,66,-19,25,-31],[86,71,18,23,35],.25,.035,-13),
  falconPerch:pose(.035,.35,29,-7,3,[15,51,-25,69,-30],[23,44,19,64,31],.31,.055,-3),
  falconLift:pose(-.025,.055,-13,5,-2,[128,46,-19,16,-20],[135,43,19,19,24],.22,.065,-19),
  // Sand: collect the grains low, flick a narrow shot, then slip sideways
  // behind the shielding forearm. The storm follows an ascending spiral.
  sandPinch:pose(.065,.22,15,-21,4,[64,27,-17,59,-30],[8,15,-14,115,45],.20,-.075,5),
  sandFlick:pose(-.09,.17,16,32,-5,[71,38,-18,57,-29],[76,11,7,14,-29],.23,.14,1),
  sandFan:pose(-.055,.19,5,23,-3,[48,33,-17,64,-22],[68,24,16,43,25],.22,.06,-2),
  duneEdge:pose(-.13,.33,27,34,-10,[64,10,29,57,-31],[-24,42,19,80,13],.34,-.105,3),
  duneSlip:pose(.11,.30,33,-30,10,[36,12,-19,84,-25],[-16,52,42,34,30],.38,.17,-7),
  duneTurn:pose(.07,.23,21,-21,6,[53,13,19,52,-27],[13,37,24,58,19],.31,.13,0),
  sandScoop:pose(-.105,.36,32,-29,-7,[23,54,-18,39,-25],[21,15,15,24,35],.30,-.06,19),
  sandCrest:pose(.10,.16,-7,34,8,[59,66,-30,27,-36],[111,44,29,23,31],.31,.10,-15),
  sandWhirl:pose(-.055,.16,7,-27,-4,[104,40,-25,20,-32],[40,65,31,45,31],.29,.05,-7),
  sandSettle:pose(.035,.20,11,13,1,[68,54,-21,39,-26],[71,40,23,35,31],.26,.025,5),
  // A pull contracts toward the ribs; repulsion opens both palms from
  // the sternum. Metal orbit is conducted with alternating high and low arms.
  poleReach:pose(.10,.20,13,-27,7,[86,13,9,14,-32],[25,22,5,90,34],.24,.12,1),
  poleDraw:pose(-.09,.26,-11,18,-8,[27,29,-16,115,35],[9,36,20,80,31],.28,-.13,-6),
  poleLock:pose(-.06,.22,-5,12,-3,[40,24,-9,96,30],[37,23,6,70,24],.24,-.05,-4),
  fieldFold:pose(0,.26,10,0,0,[52,6,37,81,-44],[58,7,-31,74,45],.23,-.11,5),
  fieldBreak:pose(0,.28,-8,2,0,[83,64,-15,15,-57],[80,67,17,18,53],.34,.085,-3),
  fieldSettle:pose(.035,.20,-3,8,2,[64,52,-19,40,-33],[68,43,15,43,30],.27,.025,-7),
  ironPoise:pose(-.085,.20,-5,26,-6,[29,28,9,92,-43],[83,43,-27,67,35],.24,-.07,-8),
  ironSet:pose(.09,.20,12,-25,6,[50,35,-29,44,-34],[84,21,32,24,47],.27,.105,4),
  ironTurn:pose(.035,.17,6,13,3,[84,56,-26,30,-40],[41,23,16,79,36],.26,.025,-6),
  ironSweep:pose(-.085,.21,15,31,-5,[94,18,-15,21,-48],[44,48,26,58,26],.29,.10,1),
  ironLift:pose(-.045,.16,-6,-14,-3,[56,45,-16,70,-39],[105,39,23,34,39],.25,.025,-12),
  ironClose:pose(.09,.27,19,-24,6,[62,17,24,41,-38],[74,20,-22,35,41],.32,.12,6),
  orbit:pose(.09,.19,-4,-29,6,[61,13,25,58,-40],[18,26,-33,92,42],.17,-.06),
  castVoid:pose(-.08,.19,11,24,-5,[75,5,17,19,-47],[80,8,-15,21,49],.22,.11),
  veil:pose(.12,.21,-3,-34,9,[53,16,24,75,-24],[-14,39,22,65,15],.17,-.05),
  exit:pose(-.11,.22,13,33,-8,[-18,37,-20,48,-28],[69,13,-4,33,27],.26,.08),
  eclipse:pose(0,.20,-12,0,0,[92,62,-8,35,-45],[95,64,9,33,46],.28,-.03,-12),
  crush:pose(0,.30,18,0,0,[69,13,28,45,-53],[66,13,-30,49,54],.27,.07,6)
 };
 const clips={};
 function clip(id,label,release,duration,socket,load,contact,follow,options={}){
  const keys=[[0,'guard'],[release*(options.prep||.65),load],[release,contact]];
  for(const k of options.extra||[])keys.push(k);
  keys.push([options.settle||release+(duration-release)*.42,follow],[duration,'guard']);
  clips[id]={id,label,release,duration,socket,keys:keys.sort((a,b)=>a[0]-b[0]),...options};return clips[id];
 }
 clip('jab','Jab',.10,.35,'punho_E','jabLoad','jab','jabLoad',{active:.07,hand:'E'});
 clip('direto','Direto',.14,.43,'punho_D','coil','cross','recoil',{active:.07,hand:'D'});
 clip('gancho','Gancho',.21,.56,'punho_E','hookLoad','hook','brace',{active:.08,hand:'E'});
 clip('impacto0','Punho de Recuo',.19,.59,'punho_D','pistonRack','pistonDriver','brace',{prep:.72,settle:.39,extra:[[.215,'pistonDriver']]});
 clip('impacto1','Ombro de Aríete',.15,.70,'apoio_D','shoulder','ram','brace',{settle:.52,extra:[[.43,'ram']]});
 clip('impacto2','Ruptura de Pistão',.51,1.12,'punho_D','pistonRaised','pistonGround','pistonSettle',{prep:.71,settle:.76,extra:[[.15,'pistonPlant'],[.44,'pistonRaised'],[.57,'pistonGround']]});
 clip('brasa0','Brasa Comprimida',.26,.73,'palma_D','compress','throw','recoil',{prep:.63,extra:[[.07,'cup']]});
 clip('brasa1','Rastro Ardente',.10,.69,'apoio_E','sprinter','flameRun','brace',{settle:.53,extra:[[.35,'flameRun']]});
 clip('brasa2','Forno Ascendente',.35,.99,'apoio_D','scoop','lift','open',{extra:[[.09,'earth']]});
 clip('geada0','Estacas de Gelo',.20,.69,'apoio_E','iceMark','carve','recoil');
 clip('geada1','Muralha Fria',.22,.77,'palmas','shieldFold','wall','brace');
 clip('geada2','Inverno Repentino',.40,1.07,'peito','gather','open','wall');
 clip('tormenta0','Arco em Cadeia',.14,.57,'palma_D','spark','point','recoil');
 clip('tormenta1','Passo Relâmpago',.08,.49,'apoio_D','slideLoad','slide','brace',{settle:.36,extra:[[.28,'slide']]});
 clip('tormenta2','Céu Partido',.35,1.30,'palma_D','sky','conduct','brace',{settle:1.13,extra:[[.60,'sky'],[.70,'conduct'],[.96,'sky'],[1.05,'conduct']]});
 clip('lobo0','Rasgo da Presa',.23,.79,'palma_D','wolfCoil','wolfRake','wolfLeft',{settle:.44,extra:[[.53,'wolfCross']]});
 clip('lobo1','Forma Híbrida',.33,.80,'peito','inhale','wolfRise','wolfCoil');
 clip('lobo2','Forma Completa',.34,.80,'peito','wolfCoil','wolfCrouch','claw');
 clip('eclipse0','Núcleo Sombrio',.28,.77,'palmas','orbit','castVoid','shieldFold');
 clip('eclipse1','Passagem Oculta',.18,.64,'peito','veil','exit','brace');
 clip('eclipse2','Horizonte Vazio',.50,1.24,'palmas','eclipse','crush','orbit');
 for(const [id,load,contact,follow] of [['impacto','press','stamp','brace'],['brasa','earth','lift','open'],['geada','gather','open','wall'],['tormenta','spark','sky','conduct'],['lobo','wolfCrouch','wolfRise','wolfCoil'],['eclipse','orbit','eclipse','crush']])
  clip('despertar_'+id,'Despertar · '+id,.32,.92,'peito',load,contact,follow);
 clip('mare0','Onda de Arrebentação',.27,.78,'palma_D','tideLow','tideSweep','tideFollow',{prep:.62,settle:.39});
 clip('mare1','Ressaca',.34,.91,'palmas','tideReach','tideDraw','tideCatch',{prep:.56,settle:.59});
 clip('mare2','Olho da Maré',.43,1.12,'palma_E','tideCircle','tideEye','tideSpiral',{prep:.58,settle:.72,extra:[[.12,'tideLow'],[.54,'tideFollow']]});
 clip('cristal0','Lança de Quartzo',.22,.64,'palma_D','quartzSight','quartzPoint','quartzHold',{prep:.70,settle:.33});
 clip('cristal1','Coroa de Espinhos',.36,.94,'apoio_E','crownGather','crownStamp','crownRise',{prep:.66,settle:.62,extra:[[.43,'crownStamp']]});
 clip('cristal2','Geodo de Ruptura',.41,1.12,'palma_D','geodeCradle','geodeOffer','geodeSeal',{prep:.66,settle:.70,extra:[[.50,'geodeOffer'],[.81,'quartzSight']]});
 clip('eco0','Nota de Chamada',.18,.57,'palma_E','echoListen','echoPalm','echoRebound',{prep:.68,settle:.30});
 clip('eco1','Contratempo',.24,1.08,'palma_E','echoListen','echoBeat','echoLast',{prep:.57,settle:.88,extra:[[.37,'echoAnswer'],[.52,'echoSecond'],[.66,'echoAnswer'],[.80,'echoBeat']]});
 clip('eco2','Câmara Harmônica',.42,1.04,'palmas','chimeOpen','chimeClose','chimeRing',{prep:.65,settle:.69,extra:[[.46,'chimeClose']]});
 clip('falcao0','Rajada de Penas',.21,.69,'palma_D','featherWind','featherCast','featherDrift',{prep:.66,settle:.40});
 clip('falcao1','Forma Híbrida · Falcão',.33,.80,'peito','falconFold','falconMantle','featherDrift');
 clip('falcao2','Forma Completa · Falcão',.34,.80,'peito','falconPerch','falconLift','falconMantle');
 clip('despertar_mare','Despertar · Maré',.32,.92,'peito','tideLow','tideSpiral','tideCatch');
 clip('despertar_cristal','Despertar · Cristal',.32,.92,'peito','geodeCradle','crownRise','quartzSight');
 clip('despertar_eco','Despertar · Eco',.32,.92,'peito','echoListen','chimeOpen','echoAnswer');
 clip('despertar_falcao','Despertar · Falcão',.32,.92,'peito','falconPerch','falconLift','falconMantle');
 clip('duna0','Agulha de Areia',.19,.62,'palma_D','sandPinch','sandFlick','sandFan',{prep:.68,settle:.32});
 clip('duna1','Passo de Duna',.13,.66,'apoio_D','duneEdge','duneSlip','duneTurn',{prep:.64,settle:.43,extra:[[.29,'duneSlip']]});
 clip('duna2','Tempestade de Areia',.39,1.15,'palmas','sandScoop','sandCrest','sandSettle',{prep:.57,settle:.88,extra:[[.57,'sandWhirl'],[.72,'sandCrest']]});
 clip('ima0','Tração Polar',.24,.75,'palma_E','poleReach','poleDraw','poleLock',{prep:.65,settle:.41});
 clip('ima1','Pulso Repulsor',.28,.82,'palmas','fieldFold','fieldBreak','fieldSettle',{prep:.68,settle:.48,extra:[[.35,'fieldBreak']]});
 clip('ima2','Órbita de Ferro',.32,1.18,'palma_D','ironPoise','ironSet','ironClose',{prep:.58,settle:.88,extra:[[.46,'ironTurn'],[.60,'ironSweep'],[.74,'ironLift']]});
 clip('despertar_duna','Despertar · Duna',.32,.92,'peito','sandScoop','sandCrest','sandWhirl',{settle:.53});
 clip('despertar_ima','Despertar · Ímã',.32,.92,'peito','fieldFold','ironLift','fieldBreak',{settle:.57});
 clip('dash','Esquiva',.055,.40,'apoio_D','slideLoad','slide','brace',{settle:.27});
 // The active wrist has a drawn trajectory in root space. The off arm, pelvis
 // and spine keep the individually keyed weight transfer under the contact.
 function signatureContact(side,shift,drop,lean,turn,tilt,arm,cover,stance,advance,look=0){
  const sign=side==='E'?1:-1;
  const mirrored=a=>[a[0],a[1],-a[2],a[3],-a[4]];
  return pose(sign*shift,drop,lean,sign*turn,sign*tilt,
   side==='E'?arm:mirrored(cover),side==='E'?cover:mirrored(arm),stance,advance,look);
 }
 function signaturePunch(fruit,stage,label,release,duration,active,load,strike,carry,rest,path){
  const id=fruit+'_j'+stage,side=stage===2?'D':'E';
  P[id]=signatureContact(side,...strike);
  const after=release+active*.74;
  clip(id,label,release,duration,'punho_'+side,load,id,rest,{
   hand:side,active,prep:stage===3?.62:.57,settle:after+(duration-after)*.40,
   extra:[[after,carry]],fistPath:path
  });
 }
 // Path columns are X/Y/Z of the wrist at contact, lateral sweep, rise into
 // the blow, then the height of the elbow pole. Positive X is the lead side.
 signaturePunch('impacto',1,'Pistão curto',.12,.40,.072,'jabLoad',
  [.085,.20,14,-27,3,[66,8,1,22,-5],[18,15,7,86,6],.21,.13,1],'jab','press',[.16,2.13,1.38,.07,-.04,2.55]);
 signaturePunch('impacto',2,'Pistão cruzado',.165,.49,.09,'coil',
  [.12,.225,19,-38,6,[74,7,7,15,-11],[13,21,8,86,16],.23,.17,3],'cross','brace',[.04,2.21,1.57,.24,.07,2.68]);
 signaturePunch('impacto',3,'Martelo de pistão',.235,.66,.12,'shoulder',
  [.13,.34,30,-22,11,[57,28,12,49,-24],[63,12,-14,93,27],.30,.20,9],'stamp','brace',[.07,1.95,1.48,.28,-.48,2.98]);

 signaturePunch('brasa',1,'Fagulha ascendente',.125,.41,.08,'scoop',
  [.07,.17,10,-19,-4,[61,12,8,51,-34],[23,27,17,77,14],.19,.09,-4],'echoRebound','cup',[.12,2.36,1.31,.14,.48,1.85]);
 signaturePunch('brasa',2,'Cruzado de brasa',.17,.50,.09,'compress',
  [.12,.21,18,-36,7,[79,21,10,21,-34],[19,27,8,86,21],.24,.17,-4],'throw','flameRun',[.01,2.26,1.52,.55,.13,2.70]);
 signaturePunch('brasa',3,'Punho de erupção',.22,.64,.13,'earth',
  [.12,.105,-5,-30,7,[109,21,9,39,-28],[13,49,11,66,38],.26,.15,-11],'lift','tideCatch',[.13,2.52,1.34,.19,.60,1.91]);

 signaturePunch('geada',1,'Corte de sincelo',.115,.38,.075,'iceMark',
  [.08,.23,16,-21,-4,[62,7,6,23,-37],[37,14,16,96,28],.21,.11,4],'carve','quartzSight',[.14,2.06,1.42,.17,-.28,2.69]);
 signaturePunch('geada',2,'Estoque de gelo',.15,.45,.083,'quartzSight',
  [.10,.15,6,-31,2,[79,4,0,12,-7],[16,22,6,92,6],.24,.14,-4],'quartzHold','shieldFold',[.10,2.35,1.57,.02,.02,2.51]);
 signaturePunch('geada',3,'Quebra-gelo',.24,.65,.12,'crownGather',
  [.09,.30,27,-18,9,[58,22,19,37,-32],[41,21,-6,88,38],.30,.14,8],'crownStamp','wall',[.01,1.99,1.42,.34,-.53,2.93]);

 signaturePunch('tormenta',1,'Estalo elétrico',.09,.36,.06,'spark',
  [.065,.13,9,-27,3,[79,7,4,21,-1],[34,11,11,78,15],.15,.12,-4],'jab','spark',[.13,2.32,1.46,.14,-.03,2.65]);
 signaturePunch('tormenta',2,'Arco cortante',.125,.41,.07,'slideLoad',
  [.11,.18,20,-41,8,[74,19,16,27,-35],[45,23,12,71,26],.25,.125,2],'conduct','slide',[.00,2.16,1.50,.48,-.20,2.88]);
 signaturePunch('tormenta',3,'Descarga de retorno',.185,.53,.095,'sky',
  [.09,.245,24,-31,5,[65,16,10,30,-12],[46,34,11,104,25],.24,.15,9],'stamp','spark',[.04,2.04,1.50,.28,-.43,2.94]);

 signaturePunch('lobo',1,'Garra oblíqua',.14,.41,.10,'wolfLeft',
  [.12,.27,27,-29,8,[63,29,-12,48,-33],[55,23,-12,73,29],.26,.12,8],'wolfCross','claw',[.01,2.12,1.38,.63,-.29,2.82]);
 signaturePunch('lobo',2,'Rasgo de retorno',.175,.48,.11,'wolfCoil',
  [.12,.23,26,-35,7,[71,31,25,37,-40],[25,34,21,71,33],.26,.15,7],'wolfRake','wolfLeft',[-.04,2.17,1.46,.72,.12,2.60]);
 signaturePunch('lobo',3,'Garra da garganta',.225,.60,.12,'wolfCrouch',
  [.12,.14,15,-21,-5,[93,21,-7,35,-38],[43,45,-23,66,39],.30,.18,-8],'wolfRise','wolfCoil',[.08,2.46,1.36,.38,.50,1.85]);

 signaturePunch('eclipse',1,'Toque de penumbra',.13,.43,.077,'veil',
  [.085,.16,-4,-38,8,[67,12,21,39,-43],[47,9,-23,82,37],.18,.09,-8],'poleReach','orbit',[-.08,2.33,1.38,.17,.09,2.48]);
 signaturePunch('eclipse',2,'Cruzado oculto',.17,.48,.087,'orbit',
  [.12,.20,12,-43,9,[78,21,15,27,-41],[35,47,-16,58,34],.23,.15,2],'exit','veil',[.00,2.20,1.50,-.39,-.22,2.86]);
 signaturePunch('eclipse',3,'Colapso umbral',.225,.62,.13,'eclipse',
  [.06,.33,20,-14,-8,[59,11,28,39,-53],[68,11,-27,50,44],.29,.13,7],'crush','orbit',[.06,2.10,1.38,.36,-.34,2.79]);

 signaturePunch('mare',1,'Palma de vazante',.145,.45,.10,'tideDraw',
  [.095,.23,15,-28,7,[70,25,21,28,-34],[29,38,-17,68,33],.24,.11,2],'tideEye','tideCatch',[.10,2.14,1.42,.49,-.08,2.43]);
 signaturePunch('mare',2,'Cruzado de corrente',.17,.51,.11,'tideLow',
  [.13,.19,16,-36,11,[73,30,14,34,-41],[44,32,13,64,31],.27,.15,-2],'tideFollow','tideReach',[-.03,2.25,1.48,.67,.17,2.52]);
 signaturePunch('mare',3,'Quebra da crista',.235,.67,.13,'tideSpiral',
  [.125,.33,27,-25,9,[64,31,23,47,-37],[61,52,19,62,37],.34,.15,9],'crownStamp','tideCatch',[.05,2.00,1.41,.47,-.57,2.93]);

 signaturePunch('cristal',1,'Talhe de quartzo',.125,.405,.071,'geodeCradle',
  [.06,.18,8,-20,3,[77,9,4,26,-15],[23,11,13,93,9],.20,.10,0],'quartzHold','quartzSight',[.16,2.24,1.42,.10,-.12,2.68]);
 signaturePunch('cristal',2,'Aresta perfurante',.185,.525,.085,'quartzSight',
  [.11,.22,15,-34,3,[82,4,2,9,-5],[14,22,0,94,8],.27,.17,-2],'quartzPoint','geodeSeal',[.10,2.21,1.58,.02,.10,2.40]);
 signaturePunch('cristal',3,'Malho prismático',.25,.68,.12,'crownGather',
  [.11,.345,29,-29,7,[62,19,13,45,-20],[61,15,-22,80,27],.35,.18,10],'crownStamp','geodeCradle',[.02,1.97,1.50,.26,-.54,2.96]);

 signaturePunch('eco',1,'Batida de chamada',.105,.395,.066,'echoListen',
  [.07,.17,7,-23,2,[74,13,7,28,-24],[63,31,-6,103,35],.19,.10,-4],'echoBeat','echoListen',[.14,2.25,1.40,.14,.04,2.49]);
 signaturePunch('eco',2,'Síncope',.16,.465,.078,'echoAnswer',
  [.09,.22,13,-30,5,[70,22,21,48,-32],[54,34,9,88,30],.23,.11,4],'echoSecond','echoAnswer',[.02,2.16,1.39,.46,-.21,2.78]);
 signaturePunch('eco',3,'Acorde final',.21,.59,.11,'chimeOpen',
  [.055,.24,17,-17,2,[69,12,10,28,-28],[61,15,-25,51,40],.29,.16,4],'chimeClose','chimeRing',[.11,2.25,1.51,.34,.22,2.28]);

 signaturePunch('falcao',1,'Talão rasante',.12,.37,.075,'falconPerch',
  [.08,.205,20,-23,8,[66,21,6,27,-35],[44,62,27,35,33],.23,.12,-2],'featherDrift','falconFold',[.10,2.12,1.40,.37,-.18,2.72]);
 signaturePunch('falcao',2,'Corte de asa',.155,.45,.09,'featherWind',
  [.12,.155,16,-38,10,[74,36,23,34,-42],[42,65,18,30,37],.25,.14,-6],'featherCast','featherDrift',[-.05,2.28,1.43,.72,-.20,2.82]);
 signaturePunch('falcao',3,'Garra das alturas',.205,.56,.105,'falconMantle',
  [.10,.30,26,-25,6,[62,16,14,27,-39],[86,63,29,40,39],.27,.20,8],'crownStamp','falconPerch',[.07,2.02,1.48,.30,-.55,2.97]);

 signaturePunch('duna',1,'Punho rasteiro',.135,.435,.095,'duneEdge',
  [.12,.33,27,-26,10,[53,25,13,38,-31],[52,16,-23,85,31],.29,.12,8],'duneTurn','sandPinch',[.15,1.92,1.38,.43,-.11,2.12]);
 signaturePunch('duna',2,'Meia-lua de areia',.185,.525,.11,'sandScoop',
  [.13,.235,15,-38,10,[68,37,15,47,-41],[55,29,-15,71,33],.28,.14,0],'sandFan','duneTurn',[-.04,2.16,1.40,.77,.25,2.25]);
 signaturePunch('duna',3,'Cume de arenito',.235,.655,.13,'sandScoop',
  [.12,.14,2,-28,-5,[95,24,7,47,-36],[66,55,25,48,27],.31,.16,-12],'sandCrest','sandSettle',[.08,2.51,1.35,.36,.61,1.89]);

 signaturePunch('ima',1,'Contato norte',.13,.43,.078,'poleDraw',
  [.09,.18,8,-20,3,[74,9,5,30,-45],[32,18,-22,98,40],.22,.11,-3],'poleReach','poleLock',[.15,2.27,1.41,.12,.10,2.41]);
 signaturePunch('ima',2,'Inversão de polo',.175,.51,.095,'ironPoise',
  [.12,.235,13,-35,8,[73,27,22,43,-52],[44,25,-24,84,47],.27,.14,5],'ironSweep','ironTurn',[-.04,2.13,1.45,.57,-.31,2.74]);
 signaturePunch('ima',3,'Estouro bipolar',.225,.63,.122,'fieldFold',
  [.07,.255,19,-22,-2,[73,15,10,23,-51],[65,24,-26,54,45],.32,.17,5],'ironClose','fieldSettle',[.08,2.26,1.54,.31,.24,2.27]);

 function signatureFist(T,body,c,t){
  const through=(t-c.release)/c.active;
  const weight=smooth((t/c.release-.30)/.70)*(1-smooth((through-.38)/1.20));
  if(weight<=0)return;
  const [x,y,z,arc,rise,poleHeight]=c.fistPath,sign=c.hand==='E'?1:-1;
  const approach=smooth(-through),carry=smooth(through);
  const drift=approach-carry*.42;
  const target=new T.Vector3(sign*(x+arc*drift),y-rise*drift,z-.23*approach+.03*carry);
  const pole=new T.Vector3(sign*(1.42+.26*Math.abs(arc)),poleHeight,.38+arc*.15);
  const j=body.joints,u=j['braco_'+c.hand],l=j['antebraco_'+c.hand],w=j['mao_'+c.hand];
  const vector=()=>new T.Vector3(),quaternion=()=>new T.Quaternion();
  const u0=u.getWorldPosition(vector()),l0=l.getWorldPosition(vector()),w0=w.getWorldPosition(vector());
  const uq=u.getWorldQuaternion(quaternion()),localLower=l.quaternion.clone();
  const l1=u0.distanceTo(l0),l2=l0.distanceTo(w0);
  const axis=w0.clone().lerp(body.root.localToWorld(target),weight).sub(u0);
  // Preserve a small natural bend through extension. Transport each authored
  // bone's roll with the solved segment rather than reorienting from an arbitrary axis.
  const distance=clamp(axis.length(),Math.abs(l1-l2)+.001,l1+l2-.028*body.root.scale.y);
  axis.normalize();
  const bend=l0.clone().lerp(body.root.localToWorld(pole),weight*.81).sub(u0);
  bend.addScaledVector(axis,-bend.dot(axis)).normalize();
  const projection=(l1*l1-l2*l2+distance*distance)/(2*distance);
  const elbow=u0.clone().addScaledVector(axis,projection).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-projection*projection)));
  const tip=u0.clone().addScaledVector(axis,distance);
  const upperAxis=elbow.clone().sub(u0).normalize(),lowerAxis=tip.sub(elbow).normalize();
  const hinge=lowerAxis.clone().cross(upperAxis).normalize(),up=upperAxis.clone().negate(),normal=hinge.clone().cross(up);
  const plane=quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(hinge,up,normal));
  setWorld(T,u,uq.slerp(plane,weight));
  const flex=Math.acos(clamp(upperAxis.dot(lowerAxis),-1,1));
  l.quaternion.copy(localLower).slerp(quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-flex),weight);
  w.rotateX((-.10-rise*.10)*weight);
 }

 // Each dash has a compressed push-off, a distinct travel pose, a separate
 // braking posture, and a foot track timed to its period of root movement.
 function signatureDash(id,label,release,travel,duration,foot,load,drive,catchPose,rest,track){
  const name=id+'_dash';
  P[name+'_drive']=drive;P[name+'_catch']=catchPose;
  clip(name,label,release,duration,'apoio_'+foot,load,name+'_drive',rest,{
   prep:.57,settle:release+travel+(duration-release-travel)*.43,
   extra:[[release+travel*.38,name+'_drive'],[release+travel,name+'_catch']],
   active:travel,hand:foot,dashTravel:travel,dashFoot:track
  });
 }
 // Sole track = leading side, lift of the two feet, stride, side step, overlap.
 signatureDash('impacto','Passo de Aríete',.105,.27,.53,'D','shoulder',
  pose(-.11,.32,35,27,-9,[26,12,2,100,-16],[-8,23,17,66,9],.38,.17,6),
  pose(.075,.30,19,-9,4,[40,29,-13,84,-18],[48,16,14,61,21],.32,.025,3),'brace',['D',.19,.10,.26,.02,.48]);
 signatureDash('brasa','Rastro de Fagulhas',.08,.30,.53,'E','sprinter',
  pose(.08,.25,32,-25,8,[-26,34,-25,88,-11],[77,13,14,74,28],.33,.18,-3),
  pose(-.06,.20,17,24,-4,[62,15,-11,51,-19],[-17,37,27,101,31],.28,.10,0),'flameRun',['E',.32,.20,.34,.08,.40]);
 signatureDash('geada','Patinada Glacial',.115,.42,.62,'D','iceMark',
  pose(-.15,.31,15,33,-15,[72,29,-30,29,-39],[-17,58,13,35,35],.32,.08,-3),
  pose(.095,.245,11,-19,9,[38,50,-18,34,-32],[68,45,15,26,31],.29,.03,-3),'shieldFold',['D',.035,.10,.28,.19,.60]);
 signatureDash('tormenta','Passo Relâmpago',.055,.21,.41,'E','slideLoad',
  pose(.13,.245,34,-39,10,[-32,23,-18,72,-6],[74,9,9,59,21],.36,.17,-6),
  pose(-.11,.25,24,34,-8,[64,9,-9,70,-21],[-20,33,23,53,9],.31,.10,1),'spark',['E',.21,.17,.29,.23,.34]);
 signatureDash('lobo','Passada Feral',.09,.29,.52,'D','wolfCrouch',
  pose(-.06,.34,38,13,-6,[33,36,-22,65,-32],[54,23,16,80,36],.38,.20,-3),
  pose(.095,.33,30,-19,7,[57,25,-12,60,-25],[28,44,25,69,30],.31,.12,2),'claw',['D',.32,.27,.34,.05,.39]);
 signatureDash('eclipse','Passagem Umbral',.125,.23,.52,'E','veil',
  pose(.15,.25,-5,-43,14,[57,7,31,79,-51],[-8,45,30,56,42],.21,-.05,-7),
  pose(-.12,.24,19,36,-10,[-16,45,-22,48,-36],[72,11,-7,29,39],.33,.14,5),'orbit',['E',.15,.09,.21,.28,.57]);
 signatureDash('mare','Curva de Espuma',.105,.39,.60,'E','tideLow',
  pose(.14,.26,18,-33,13,[78,40,-32,27,-40],[14,56,23,58,34],.35,.15,-1),
  pose(-.10,.25,9,29,-10,[46,43,-22,53,-37],[78,26,16,38,32],.28,.05,-5),'tideCatch',['E',.17,.10,.30,.28,.53]);
 signatureDash('cristal','Passo Prismático',.12,.25,.54,'D','crownGather',
  pose(-.10,.24,15,28,-4,[82,11,-3,20,-18],[35,11,-17,91,18],.28,.13,-4),
  pose(.08,.32,17,-21,6,[37,27,-17,65,-18],[65,15,16,32,21],.34,.04,3),'quartzSight',['D',.17,.12,.22,.20,.47]);
 signatureDash('eco','Passo Sincopado',.085,.31,.545,'E','echoListen',
  pose(.085,.16,13,-15,9,[77,22,9,38,-36],[65,29,7,103,46],.23,.12,-3),
  pose(-.10,.25,18,24,-10,[47,40,-12,41,-32],[63,33,-5,86,35],.29,.08,2),'echoAnswer',['E',.31,.24,.27,.10,.30]);
 signatureDash('falcao','Rasante de Asas',.085,.34,.54,'D','falconPerch',
  pose(-.035,.23,32,-8,1,[-12,70,-21,31,-36],[-16,71,23,29,37],.22,.15,-11),
  pose(.07,.265,19,16,5,[72,56,-19,32,-29],[66,61,17,39,33],.31,.08,-3),'falconFold',['D',.25,.23,.27,.12,.36]);
 signatureDash('duna','Mergulho na Areia',.115,.34,.59,'D','duneEdge',
  pose(-.14,.40,40,33,-13,[59,11,19,72,-28],[-24,52,27,46,40],.34,.16,2),
  pose(.115,.32,25,-27,10,[50,37,-28,53,-30],[25,55,25,62,36],.30,.11,0),'duneTurn',['D',.12,.095,.20,.23,.55]);
 signatureDash('ima','Arranque Polar',.105,.29,.54,'E','poleDraw',
  pose(.09,.215,17,-24,5,[83,10,7,17,-50],[22,29,-10,99,44],.31,.16,-1),
  pose(-.085,.27,-7,22,-8,[34,33,-9,102,-39],[62,44,17,42,37],.28,-.07,-6),'poleLock',['E',.19,.14,.23,.16,.45]);

 function signatureDashSole(c,t,side,ankle){
  const [lead,frontLift,rearLift,stride,lateral,delay]=c.dashFoot;
  const leading=side===lead,sign=side==='E'?1:-1;
  const start=leading?c.release*.24:c.release+c.dashTravel*delay;
  const end=leading?c.release+c.dashTravel*.77:c.release+c.dashTravel+(c.duration-c.release-c.dashTravel)*.46;
  const u=clamp((t-start)/(end-start));
  if(u<=0||u>=1)return 0;
  const lift=Math.sin(Math.PI*u),envelope=lift*lift;
  ankle.y+=(leading?frontLift:rearLift)*envelope;
  ankle.z+=stride*envelope*(leading?1:-.80);
  ankle.x+=sign*lateral*envelope*(leading?1:-.48);
  return (leading?-.12:.14)*Math.sin(2*Math.PI*u)*envelope;
 }

 // Additional close- and long-range techniques. The horizontal shift leads the
 // turn of the shoulders. Holds and smaller follow-throughs give a delayed
 // eruption, echo or second strike its own readable beat.
 Object.assign(P,{
  hammerApex:pose(-.075,.10,-17,15,-4,[145,15,13,38,-26],[153,16,-12,31,27],.26,-.10,-12),
  hammerBlow:pose(.095,.385,43,-19,6,[29,12,19,20,-21],[34,8,-11,15,25],.335,.165,19),
  hammerAfter:pose(.07,.33,35,-14,5,[41,20,14,37,-22],[42,15,-10,30,25],.31,.115,12),
  counterSide:pose(-.08,.29,13,30,-7,[71,7,28,79,-52],[40,14,-25,88,35],.275,-.095,1),
  counterStop:pose(-.115,.325,4,37,-9,[79,10,33,76,-48],[55,12,-27,83,39],.30,-.115,-3),
  counterReturn:pose(.075,.225,12,-23,6,[65,23,-24,28,-18],[47,31,-8,59,24],.275,.065,-2),
  cinderTuck:pose(-.095,.22,4,-35,-5,[40,25,-16,81,-17],[67,24,-35,94,-38],.22,-.04,-4),
  cinderFan:pose(.10,.19,14,33,8,[21,34,-23,62,-12],[87,35,36,18,50],.255,.115,-3),
  cinderSpill:pose(.065,.16,-2,42,7,[41,29,-16,73,-13],[89,64,37,31,36],.235,.065,-7),
  furnaceSet:pose(-.095,.33,25,-24,-7,[35,43,-28,46,-24],[22,13,14,42,41],.30,-.06,14),
  furnaceIgnite:pose(.085,.39,38,24,6,[32,53,-23,49,-20],[12,16,11,18,-26],.33,.105,21),
  furnaceLift:pose(.02,.115,-14,-4,2,[97,51,-20,21,-32],[120,43,21,15,36],.275,.035,-16),
  iceTraceStart:pose(.08,.29,26,-26,6,[31,22,13,40,-33],[19,34,-20,79,32],.26,-.065,13),
  iceTraceLine:pose(-.095,.32,31,21,-7,[34,43,-17,41,-22],[51,9,-6,15,-36],.285,.155,12),
  iceTraceFar:pose(-.07,.25,18,25,-5,[28,38,-18,60,-16],[72,8,-3,22,-29],.26,.12,2),
  frostWrap:pose(.015,.31,18,6,1,[72,7,28,96,-37],[60,9,-30,103,41],.25,-.065,12),
  frostShelter:pose(-.018,.355,22,-4,-1,[80,9,34,89,-36],[66,7,-38,101,42],.285,-.075,13),
  frostUnseal:pose(.035,.21,-4,6,2,[60,53,-12,42,-22],[51,46,12,51,25],.235,-.02,-5),
  forkPrime:pose(.105,.20,-3,-27,7,[44,21,17,77,-31],[60,18,-27,79,42],.215,-.09,-7),
  forkSplit:pose(-.09,.195,16,8,-5,[83,34,8,14,-43],[92,31,-6,10,39],.27,.105,-3),
  forkDie:pose(-.065,.16,-2,17,-4,[62,39,5,43,-33],[77,33,-3,27,31],.22,.035,-8),
  rodPlant:pose(-.08,.315,23,14,-5,[21,19,12,24,-27],[73,27,-18,85,26],.305,.06,12),
  rodUpright:pose(.045,.20,-10,-8,4,[21,21,-18,34,-26],[155,7,-4,13,11],.285,.02,-15),
  rodPulse:pose(.02,.235,-4,-1,2,[32,24,-14,38,-31],[131,13,1,32,20],.28,-.015,-10),
  huntingBreath:pose(.01,.27,23,2,0,[37,38,12,72,-18],[40,35,-15,75,24],.26,-.10,8),
  huntingCall:pose(-.015,.16,-13,-2,0,[30,68,-17,30,-27],[25,66,19,34,33],.30,.115,-24),
  huntingLower:pose(.02,.20,-5,5,3,[39,54,-18,43,-24],[35,50,16,51,25],.27,.055,-13),
  huntPounce:pose(-.10,.305,35,34,-9,[19,47,-29,50,-22],[72,18,26,14,33],.325,.165,7),
  huntCoil:pose(-.13,.355,29,42,-10,[21,54,24,82,-39],[46,48,35,55,22],.34,.035,7),
  huntReturn:pose(.115,.29,33,-39,9,[81,19,-32,17,-35],[6,56,38,54,25],.33,.175,6),
  gateSpan:pose(-.045,.20,-5,7,-3,[82,71,-20,19,-42],[86,74,17,17,44],.265,-.085,-7),
  gateDraw:pose(.05,.24,17,-6,3,[73,22,32,39,-49],[70,18,-35,45,50],.275,.105,3),
  gateSeal:pose(.015,.255,22,6,1,[65,11,41,62,-43],[70,11,-38,51,45],.28,.085,7),
  voidEnvelope:pose(.05,.17,-11,-17,3,[108,54,2,25,-54],[57,51,-3,44,47],.27,-.08,-12),
  voidInfall:pose(-.04,.335,21,9,-3,[59,12,30,90,-53],[52,15,-31,96,56],.29,-.075,11),
  voidRelease:pose(.01,.22,-8,0,0,[78,62,-27,17,-48],[84,65,24,14,46],.30,.09,-10),
  whipWind:pose(.12,.255,9,-40,9,[48,37,-21,73,-28],[57,64,-42,79,59],.25,-.095,-3),
  whipCrack:pose(-.125,.225,20,45,-11,[23,46,-24,66,-25],[82,24,44,11,54],.31,.15,-2),
  whipTail:pose(-.09,.18,8,50,-7,[36,39,-19,59,-23],[79,48,46,32,61],.28,.07,-5),
  surgeScoop:pose(-.075,.355,30,-17,-6,[17,30,14,23,-31],[27,29,-14,21,34],.295,-.075,16),
  surgeUp:pose(.055,.15,-9,11,4,[89,19,12,31,-39],[116,28,-9,19,40],.26,.12,-17),
  surgeCrown:pose(.03,.09,-17,8,2,[128,38,-11,21,-32],[149,31,10,16,35],.235,.06,-21),
  rosettePin:pose(-.09,.21,3,30,-6,[53,14,21,107,-45],[34,20,-16,79,28],.215,-.065,1),
  rosetteBloom:pose(.085,.19,15,-25,5,[91,18,-19,14,-61],[35,41,19,62,39],.26,.115,-3),
  rosetteEdge:pose(.06,.17,6,-35,5,[85,36,-28,24,-49],[45,36,15,51,34],.235,.06,-5),
  facetArch:pose(.01,.18,-8,1,0,[129,30,15,43,-39],[136,27,-13,39,40],.25,-.07,-10),
  facetLock:pose(-.025,.255,4,-3,-2,[108,46,7,44,-47],[115,42,-6,48,50],.30,-.025,-7),
  facetDown:pose(.025,.245,9,5,2,[71,55,-12,35,-39],[77,52,15,41,42],.28,.03,0),
  tuningRest:pose(.015,.21,6,3,0,[53,18,22,71,-34],[54,18,-20,68,33],.21,-.09,5),
  tuningFork:pose(-.02,.19,14,-2,-1,[83,7,2,9,-30],[84,7,-2,9,26],.25,.145,-3),
  tuningRebound:pose(.015,.15,-2,4,1,[75,9,5,33,-21],[74,9,-7,34,22],.23,.07,-5),
  echoMark:pose(-.085,.225,17,26,-5,[64,26,-14,61,-34],[83,9,-7,14,28],.24,.13,2),
  echoMemory:pose(-.055,.18,-4,12,-8,[66,31,7,104,-41],[65,17,-3,39,26],.215,-.02,-6),
  echoSnap:pose(.095,.20,12,-23,5,[79,14,18,23,-40],[33,27,11,83,29],.25,.10,-1),
  windWing:pose(-.115,.205,12,-36,-9,[18,63,-22,43,-33],[49,78,-28,43,37],.255,-.095,-3),
  windScythe:pose(.125,.18,20,39,10,[32,70,-33,31,-28],[91,33,41,11,52],.29,.14,-4),
  windFeather:pose(.065,.13,-4,44,6,[42,66,-22,25,-22],[85,58,36,21,42],.245,.07,-8),
  airFold:pose(-.03,.34,26,-5,-2,[42,10,29,82,-46],[46,13,-28,80,43],.27,-.055,11),
  airClimb:pose(.03,.11,-12,5,3,[117,47,-29,13,-35],[126,45,27,16,36],.23,.105,-21),
  airHang:pose(.015,.09,-8,-3,0,[82,76,-20,17,-29],[88,75,24,19,31],.225,.05,-17),
  duneLeftMark:pose(.13,.33,27,-32,10,[35,31,18,30,-33],[15,43,-25,78,23],.305,.095,16),
  duneRightMark:pose(-.13,.34,31,34,-9,[21,48,-23,71,-21],[36,26,-16,24,37],.315,.12,14),
  duneCusp:pose(.015,.235,9,6,1,[52,40,-10,37,-26],[55,43,13,42,29],.285,.045,5),
  sinkSpread:pose(.01,.25,9,-1,0,[62,69,-20,25,-34],[59,67,22,31,31],.31,-.055,5),
  sinkPress:pose(-.02,.39,37,3,-2,[19,41,11,21,-51],[24,40,-13,18,54],.34,.105,20),
  sinkTurn:pose(.04,.36,29,-11,3,[30,34,24,36,-56],[27,37,-18,31,52],.325,.08,14),
  railSight:pose(.095,.235,8,-32,6,[81,8,1,22,-14],[40,10,-18,101,47],.25,-.10,-3),
  railFire:pose(-.08,.20,13,25,-4,[76,13,9,25,-26],[94,4,-1,7,28],.28,.16,-4),
  railKick:pose(-.11,.27,-5,31,-6,[63,16,7,50,-28],[73,7,-3,32,34],.29,-.06,-7),
  polesGather:pose(-.075,.275,-8,15,-5,[34,19,17,104,-54],[26,22,-20,106,52],.29,-.12,-5),
  polesHinge:pose(.015,.305,7,3,1,[57,15,32,82,40],[60,17,-31,78,-39],.30,-.055,4),
  polesBurst:pose(.075,.235,-5,-11,5,[85,54,-19,13,47],[88,57,18,15,-46],.315,.13,-7)
 });
 clip('impacto3','Martelo Sísmico',.39,.98,'palmas','hammerApex','hammerBlow','hammerAfter',{prep:.70,settle:.54,extra:[[.11,'gather'],[.305,'hammerApex'],[.74,'brace']]});
 clip('impacto4','Contrachoque',.17,.78,'peito','counterSide','counterStop','counterReturn',{prep:.65,settle:.52,extra:[[.36,'counterStop']]});
 clip('brasa3','Leque de Cinzas',.23,.68,'palma_D','cinderTuck','cinderFan','cinderSpill',{prep:.66,settle:.36});
 clip('brasa4','Caldeira',.34,1.12,'palma_D','furnaceSet','furnaceIgnite','furnaceLift',{prep:.67,settle:.82,extra:[[.53,'furnaceIgnite'],[.68,'scoop']]});
 clip('geada3','Trilha de Estilhaços',.23,.81,'palma_D','iceTraceStart','iceTraceLine','iceTraceFar',{prep:.61,settle:.52,extra:[[.34,'iceTraceLine']]});
 clip('geada4','Casulo de Gelo',.19,.85,'peito','shieldFold','frostWrap','frostUnseal',{prep:.57,settle:.65,extra:[[.34,'frostShelter'],[.48,'frostShelter']]});
 clip('tormenta3','Forquilha Voltaica',.16,.56,'palmas','forkPrime','forkSplit','forkDie',{prep:.55,settle:.31});
 clip('tormenta4','Para-raios',.30,1.16,'palma_D','rodPlant','rodUpright','rodPulse',{prep:.61,settle:.99,extra:[[.48,'rodPulse'],[.60,'rodUpright'],[.77,'rodPulse'],[.90,'rodUpright']]});
 clip('lobo3','Uivo de Caça',.30,.87,'boca','huntingBreath','huntingCall','huntingLower',{prep:.67,settle:.60,extra:[[.43,'huntingCall']]});
 clip('lobo4','Caçada Lunar',.22,.86,'palma_D','wolfCoil','huntPounce','wolfLeft',{prep:.66,settle:.68,extra:[[.38,'huntCoil'],[.51,'huntReturn']]});
 clip('eclipse3','Fenda Gêmea',.33,.89,'palmas','gateSpan','gateDraw','gateSeal',{prep:.65,settle:.48,extra:[[.57,'gateSeal']]});
 clip('eclipse4','Colapso Orbital',.36,1.15,'palmas','voidEnvelope','voidInfall','voidRelease',{prep:.57,settle:.88,extra:[[.54,'voidInfall'],[.72,'compress']]});
 clip('mare3','Chicote de Espuma',.255,.73,'palma_D','whipWind','whipCrack','whipTail',{prep:.69,settle:.39,extra:[[.095,'tideLow']]});
 clip('mare4','Coluna de Maré',.34,.98,'palmas','surgeScoop','surgeUp','surgeCrown',{prep:.68,settle:.53,extra:[[.265,'surgeScoop'],[.69,'tideSpiral']]});
 clip('cristal3','Roseta de Quartzo',.235,.65,'palma_E','rosettePin','rosetteBloom','rosetteEdge',{prep:.64,settle:.34});
 clip('cristal4','Cúpula de Facetas',.26,.94,'peito','facetArch','facetLock','facetDown',{prep:.67,settle:.67,extra:[[.49,'facetLock']]});
 clip('eco3','Diapasão',.22,.69,'palmas','tuningRest','tuningFork','tuningRebound',{prep:.69,settle:.34,extra:[[.42,'tuningFork']]});
 clip('eco4','Última Ressonância',.23,1.02,'palma_D','echoSpring','echoMark','echoSnap',{prep:.64,settle:.75,extra:[[.43,'echoMemory'],[.63,'echoMemory'],[.84,'echoRebound']]});
 clip('falcao3','Foice de Vento',.225,.70,'palma_D','windWing','windScythe','windFeather',{prep:.60,settle:.38});
 clip('falcao4','Corrente Ascendente',.28,.87,'peito','airFold','airClimb','airHang',{prep:.70,settle:.47,extra:[[.60,'airHang']]});
 clip('duna3','Dunas Errantes',.27,.94,'palma_E','sandScoop','duneLeftMark','duneCusp',{prep:.65,settle:.71,extra:[[.40,'duneCusp'],[.55,'duneRightMark']]});
 clip('duna4','Areia Movediça',.36,1.04,'palmas','sinkSpread','sinkPress','sinkTurn',{prep:.65,settle:.65,extra:[[.49,'sinkPress'],[.77,'sinkTurn']]});
 clip('ima3','Trilho Magnético',.28,.77,'palma_D','railSight','railFire','railKick',{prep:.65,settle:.37,extra:[[.201,'railSight'],[.55,'quartzHold']]});
 clip('ima4','Inversão de Polos',.235,.99,'palmas','poleReach','polesGather','polesBurst',{prep:.65,settle:.695,extra:[[.40,'polesGather'],[.57,'polesHinge'],[.78,'fieldSettle']]});

 const baseMoveNames={idle:'Guarda em repouso',walk:'Andar',run:'Correr',tread:'Boiar',swim:'Nadar · crawl',death:'Morte · queda',jump:'Salto',comer:'Comer a fruta'};
 const baseDurations={idle:4,walk:2*Math.PI/7.9,run:2*Math.PI/10.7,swim:1.20,tread:2.40,death:1.55,jump:.95,comer:3.12};
 const directions=[
  ['dashFront','Frente',0,1],['dashBack','Trás',0,-1],['dashLeft','Esquerda',1,0],['dashRight','Direita',-1,0],
  ['dashFrontLeft','Frente e esquerda',1,1],['dashFrontRight','Frente e direita',-1,1],
  ['dashBackLeft','Trás e esquerda',1,-1],['dashBackRight','Trás e direita',-1,-1],['dashSlide','Deslize horizontal',0,1]
 ];
 for(const [id,label,x,z] of directions){
  const length=Math.hypot(x,z);
  clips[id]={...clips.dash,id,label:'Esquiva · '+label,previewDirection:{x:x/length,z:z/length,slide:id==='dashSlide'}};
 }
 function sample(clip,t){
  const keys=clip.keys;let index=1;
  while(index<keys.length-1&&t>keys[index][0])index++;
  const [a,from]=keys[index-1],[b,to]=keys[index],blend=smooth((t-a)/(b-a));
  const x=P[from],y=P[to],p={};
  for(const k of ['shift','drop','lean','twist','tilt','stance','forward','look'])p[k]=mix(x[k],y[k],blend);
  for(const k of ['left','right'])p[k]=x[k].map((v,i)=>mix(v,y[k][i],blend));
  return p;
 }
 function reset(body,specs){for(const s of specs){const j=body.joints[s.id];j.position.fromArray(s.pivot);j.rotation.set(...s.rotation);}}
 function setWorld(T,j,q){j.quaternion.copy(j.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));j.updateWorldMatrix(false,false);}
 function twoBone(T,body,upper,lower,tip,target,pole,l1,l2,footPitch=0){
  const vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  body.root.updateWorldMatrix(true,true);
  const start=upper.getWorldPosition(vec()),goal=body.root.localToWorld(target.clone()),axis=goal.sub(start);
  // Measure actual articulated lengths in world space, including mythical body scales.
  const lowerPoint=lower.getWorldPosition(vec()),tipPoint=tip.getWorldPosition(vec());
  const A=Math.max(.001,start.distanceTo(lowerPoint)),B=Math.max(.001,lowerPoint.distanceTo(tipPoint));
  const leg=/^coxa_/.test(upper.name),maxReach=(A+B)*(leg?.985:.9999);
  const dist=clamp(axis.length(),Math.abs(A-B)+.001,maxReach);
  if(axis.lengthSq()<1e-10)axis.set(0,-1,0);else axis.normalize();
  const bend=body.root.localToWorld(pole.clone()).sub(start);bend.addScaledVector(axis,-bend.dot(axis));
  if(bend.lengthSq()<1e-8){bend.set(0,0,1).applyQuaternion(body.root.getWorldQuaternion(new T.Quaternion()));bend.addScaledVector(axis,-bend.dot(axis));if(bend.lengthSq()<1e-8){bend.set(1,0,0);bend.addScaledVector(axis,-bend.dot(axis));}}
  bend.normalize();
  const along=(A*A-B*B+dist*dist)/(2*dist);
  const elbow=start.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,A*A-along*along)));
  const end=start.clone().addScaledVector(axis,dist),rootQ=body.root.getWorldQuaternion(new T.Quaternion());
  const orient=(joint,child,dir)=>{const local=child.position.clone().normalize();setWorld(T,joint,new T.Quaternion().setFromUnitVectors(local,dir.normalize().applyQuaternion(rootQ.clone().invert())).premultiply(rootQ));};
  orient(upper,lower,elbow.clone().sub(start));orient(lower,tip,end.sub(elbow));
  setWorld(T,tip,rootQ.multiply(new T.Quaternion().setFromAxisAngle(vec(1,0,0),footPitch)));

 }
 function arms(j,p){for(const [side,angles,sign] of [['E',p.left,1],['D',p.right,-1]]){
  const [raise,open,yaw,bend,roll]=angles,shoulder=j['ombro_'+side];
  shoulder.rotation.set(-raise*.15*rad,yaw*.22*rad,sign*(5+open*.25)*rad);
  j['braco_'+side].rotation.set(-raise*.85*rad,yaw*.78*rad,sign*open*.75*rad,'YXZ');
  j['antebraco_'+side].rotation.set(-bend*rad,roll*.35*rad,0);
  j['mao_'+side].rotation.set(-.035,roll*.65*rad,sign*.035);
 }}
 // One envelope carries the body through the push, travel and recovery of its fruit's clip.
 function dashWeights(clip,t,direction){
  const x=direction.x||0,z=direction.z||0,travel=clip.dashTravel??.22;
  const drive=smooth(t/clip.release)*(1-smooth((t-clip.release-travel*.48)/(clip.duration-clip.release-travel*.48)));
  const push=Math.sin(Math.PI*clamp(t/clip.release));
  const plant=Math.sin(Math.PI*clamp((t-clip.release-travel*.65)/(clip.duration-clip.release-travel*.65)));
  return {x,z,back:Math.max(0,-z),front:Math.max(0,z),slide:direction.slide?1:0,drive,push,plant};
 }
 function dashUpper(j,d){
  const {x,front,back,slide,drive,push,plant}=d,p=j.cintura;
  p.position.x+=x*(.17*drive-.075*push);p.position.z+=(front*.07-back*.17)*drive;
  p.position.y-=(.06+.48*slide)*drive+.07*push+.04*plant;
  p.rotation.z-=x*(.18*drive-.09*plant);j.tronco.rotation.z-=x*(.21*drive-.12*plant);
  j.tronco.rotation.x+=(.16*front-.83*back-.55*slide)*drive;
  j.cabeca.rotation.x-=(.11*front-.34*back-.19*slide)*drive;
  j.cabeca.rotation.z+=x*.22*drive;
  for(const [side,sign] of [['E',1],['D',-1]]){
   const lead=Math.max(0,sign*x),trailing=Math.max(0,-sign*x);
   j['braco_'+side].rotation.z+=sign*(.38*trailing+.20*back+.20*slide-.09*lead)*drive;
   j['braco_'+side].rotation.x+=(.44*lead-.24*trailing-.35*back+.18*sign*front)*drive;
   j['antebraco_'+side].rotation.x-=(.26*lead+.16*back+.15*sign*front)*drive;
  }
 }
 function dashStep(ankle,sign,d){
  const lead=d.x*sign>0?1:0;
  ankle.x+=d.x*((lead?.33:-.06)*d.drive+.055*d.plant);
  ankle.y+=(.13*Math.abs(d.x)*(1-lead)+.13*d.back*(sign<0?1:0)) *d.drive;
  ankle.z+=((d.front*.14-d.back*.32)*sign+d.slide*(sign>0?.48:-.31))*d.drive;
 }
 function swimPose(j,phase,drive){
  const p=j.cintura,roll=Math.sin(phase),wave=Math.cos(phase),inhale=(1+wave)*.5;
  p.position.y+=mix(.045*roll,-.02+.028*Math.sin(2*phase),drive);
  p.rotation.set(mix(.16,1.21,drive),.04*wave*drive,.035*roll);
  j.tronco.rotation.set(mix(.045,.09,drive),.17*roll*drive,.12*roll*drive);
  j.cabeca.rotation.set(mix(-.13,-.75+.045*wave,drive),.37*drive*inhale*inhale,-.17*roll*drive);
  for(const [side,sign] of [['E',1],['D',-1]]){
   const a=phase+(sign<0?Math.PI:0),reach=Math.cos(a),recovery=(1+Math.sin(a))*.5;
   j['ombro_'+side].rotation.set(mix(-.07,-.23*reach,drive),sign*(.06+.17*drive*reach),sign*.12*recovery);
   j['braco_'+side].rotation.set(mix(-.30-.17*reach,-1.29-1.48*reach,drive),
      sign*mix(.30*reach,.19*reach,drive),sign*mix(.73+.29*recovery,.16+.86*recovery,drive),'YXZ');
   j['antebraco_'+side].rotation.set(mix(-.94-.20*recovery,-.21-.99*recovery,drive),sign*(.10-.18*reach),0);
   j['mao_'+side].rotation.set(-.12-.18*recovery,.14*sign*reach,sign*.12*Math.sin(a));
   const flutter=Math.sin(3*phase+(sign<0?Math.PI:0));
   j['coxa_'+side].rotation.set(mix(-.40-.19*reach,.08+.26*flutter,drive),0,sign*mix(.16,.055,drive));
   j['canela_'+side].rotation.x=mix(.69+.27*recovery,.18+.26*(1+Math.cos(3*a-.35))*.5,drive);
   j['pe_'+side].rotation.x=mix(.02+.16*reach,.48+.13*flutter,drive);
  }
 }
 function fallPose(T,body,t,data){
  const j=body.joints,fold=smooth(t/.36),fall=smooth((t-.19)/.59),settle=smooth((t-.75)/.40);
  const recoil=Math.sin(Math.PI*clamp((t-.72)/.22)),pelvis=j.cintura;
  pelvis.position.x+=.12*fold+.32*fall;pelvis.position.z-=.12*fold+.19*fall;
  pelvis.rotation.set(-.14*fold-1.31*fall+.075*recoil-.05*settle,.18*fall,.12*fold+.41*fall-.15*settle);
  j.tronco.rotation.set(.18*fold-.25*fall+.12*recoil,-.18*fall,.32*fall-.10*settle);
  j.cabeca.rotation.set(.20*fold+.06*fall+.12*recoil-.15*settle,.32*fall,-.12*fall);
  for(const [side,sign] of [['E',1],['D',-1]]){
   const near=sign<0?1:0;
   j['ombro_'+side].rotation.z=sign*(.13+.18*fall);
   j['braco_'+side].rotation.set(-.30-.48*fold+.92*settle-.19*near*fall,.15*sign*fall,sign*(.16+(.54+.15*near)*fall));
   j['antebraco_'+side].rotation.x=-1.01+.49*fall+.29*settle-.23*near;
   j['mao_'+side].rotation.set(-.09-.15*fall,sign*.17*fall,.06*sign*settle);
   j['coxa_'+side].rotation.set(-.11-(.57+.25*near)*fold+.47*settle,sign*.12*fall,sign*(.06+.14*fall));
   j['canela_'+side].rotation.x=.18+(.88+.13*near)*fold-.53*settle;
   j['pe_'+side].rotation.x=-.15-.36*fold+.46*settle;
  }
  // Support changes from the soles to hip, shoulder and back. Project the actual
  // segment extents onto local up so scale and facing don't change the contact.
  body.root.updateWorldMatrix(true,true);
  const inverse=new T.Matrix4().copy(body.root.matrixWorld).invert(),relative=new T.Matrix4();
  let lowest=Infinity;
  for(const s of data.segments){
   const m=relative.multiplyMatrices(inverse,j[s.id].matrixWorld).elements,c=s.center,b=s.size;
   const centerY=m[1]*c[0]+m[5]*c[1]+m[9]*c[2]+m[13];
   lowest=Math.min(lowest,centerY-.5*(Math.abs(m[1])*b[0]+Math.abs(m[5])*b[1]+Math.abs(m[9])*b[2]));
  }
  pelvis.position.y+=.015-lowest;
 }
 function gaitFrame(phase,side,amount){
  const u=((phase/(Math.PI*2)+(side==='E'?0:.5))%1+1)%1,onGround=u<.5;
  const f=onGround?u*2:(u-.5)*2,reach=.542*Math.min(1.3,amount);
  const wave=onGround?1-2*f:2*smooth(f)-1,lift=onGround?0:Math.sin(f*Math.PI);
  const roll=onGround?.12*(1-smooth(f/.17))-.13*smooth((f-.82)/.18):-.12*Math.cos(f*Math.PI);
  return {onGround,z:reach*wave,lift:lift*.24*amount,roll:roll*amount,wave};
 }
 // Golpes de perna do M1 (atualização 20): a perna do chute segue chaves próprias
 // [t, lateral, altura, frente, ponta do pé], somadas ao alvo do tornozelo do passo.
 function kickAt(kick,t){
  const k=kick.keys;let i=1;
  while(i<k.length-1&&t>k[i][0])i++;
  const a=k[i-1],b=k[i],u=smooth((t-a[0])/Math.max(1e-4,b[0]-a[0]));
  return [mix(a[1],b[1],u),mix(a[2],b[2],u),mix(a[3],b[3],u),mix(a[4]??0,b[4]??0,u)];
 }
 function kickLeg(kick,t,ankle,sign){const o=kickAt(kick,t);ankle.x+=sign*o[0];ankle.y+=o[1];ankle.z+=o[2];}
 function kickRoll(kick,t){return kickAt(kick,t)[3];}
 // Registra poses e clipes vindos de fora (fichas do M1 em combat/m1Catalog.js).
 function define(def){
  for(const [name,a] of Object.entries(def.poses||{}))P[name]=pose(...a);
  const {poses,...rest}=def;
  clips[def.id]={...rest,keys:[...def.keys].sort((a,b)=>a[0]-b[0])};
  return clips[def.id];
 }
 function apply(T,body,data,state){
  const j=body.joints,vec=(x,y,z)=>new T.Vector3(x,y,z),id=state.id||'idle',clip=clips[id],t=state.t||0;
  reset(body,data.segments);if(id==='rest')return;
  if(id==='death'){fallPose(T,body,t,data);return;}
  if(id==='swim'||id==='tread'){
   const blend=clamp(state.swimBlend??1);
   let entry=null;
   if(blend<1){
    apply(T,body,data,{...state,id:'idle',runBlend:0,swimBlend:0});
    if(blend<=0)return;
    entry=data.segments.map(s=>[j[s.id],j[s.id].position.clone(),j[s.id].quaternion.clone()]);
    reset(body,data.segments);
   }
   const drive=id==='tread'?0:clamp(state.gait??1);
   swimPose(j,state.phase??t*2*Math.PI/baseDurations[id],drive);
   if(entry)for(const [joint,pos,rot] of entry){joint.position.lerp(pos,1-blend);joint.quaternion.slerp(rot,1-blend);}
   return;
  }
  const p=clip?sample(clip,t):P.guard,phase=state.phase??t*(id==='run'?10.7:7.9);
  const gait=state.gait??(id==='walk'?1:id==='run'?1:0),air=state.air||0,landing=state.landing||0;
  const locomotion=id==='idle'||id==='walk'||id==='run',clock=state.clock??t;
  const atRest=locomotion&&!body.form?(1-smooth(gait))* (1-clamp(air)):0;
  const running=locomotion?clamp(state.runBlend??(id==='run'?1:0))*clamp(gait)*(1-clamp(air)):0;
  const restPhase=state.clock===undefined&&(id==='walk'||id==='run')?phase:clock*2*Math.PI/baseDurations.idle;
  const breath=Math.sin(locomotion&&!body.form?restPhase:clock*2.4),pelvis=j.cintura,walk=clip?0:gait;
  const dash=state.dashDirection||clip?.previewDirection;
  const dodge=clip&&dash?dashWeights(clip,t,dash):null;
  const jump=id==='jump'&&state.air===undefined?Math.max(0,Math.sin(Math.PI*clamp(t/.78))):air;
  pelvis.position.x+=p.shift+Math.cos(phase)*.023*walk;pelvis.position.y+=-p.drop+breath*.012+(Math.abs(Math.cos(phase))-.5)*.065*walk-.095*landing-.045*walk;
  pelvis.position.z+=p.forward;pelvis.rotation.set(p.lean*.24*rad,p.twist*.38*rad+Math.sin(phase)*.08*walk,-p.tilt*.38*rad);
  j.tronco.rotation.set((p.lean*.76+breath*.5+walk*3)*rad,p.twist*.62*rad-Math.sin(phase)*.13*walk,-p.tilt*.62*rad);
  j.cabeca.rotation.set((p.look-p.lean*.44)*rad,-p.twist*.60*rad,p.tilt*.48*rad);
  arms(j,p);
  if(atRest){
   // The weight settles over the rear hip while the front hand stays available.
   const transfer=Math.sin(restPhase-.6),inhale=.5+.5*breath;
   pelvis.position.x+=(-.069+.036*transfer)*atRest;pelvis.position.y+=(.015*breath-.016)*atRest;
   pelvis.rotation.z+=(.031-.018*transfer)*atRest;
   j.tronco.rotation.x+=(.021-.032*inhale)*atRest;j.tronco.rotation.y+=(.083+.023*transfer)*atRest;
   j.cabeca.rotation.y-=(.075+.035*Math.sin(restPhase+.35))*atRest;j.cabeca.rotation.z-=(.023-.014*transfer)*atRest;
   j.ombro_E.rotation.x-=(.06+.03*inhale)*atRest;j.braco_E.rotation.x-=(.16+.045*inhale)*atRest;
   j.antebraco_E.rotation.x-=(.13+.04*inhale)*atRest;j.antebraco_D.rotation.x-=(.21-.035*inhale)*atRest;
   j.braco_D.rotation.z+=.055*atRest;
  }
  if(running){
   const bounce=-Math.cos(2*(phase-.88));
   pelvis.position.y+=(.034+.085*bounce)*running;pelvis.rotation.x+=.085*running;
   j.tronco.rotation.x+=.146*running;j.tronco.rotation.y-=.07*Math.sin(phase)*running;
   j.cabeca.rotation.x-=.183*running;j.cabeca.rotation.z-=.025*Math.sin(phase)*running;
  }
  if(dodge)dashUpper(j,dodge);
  for(const [side,sign] of [['E',1],['D',-1]]){
   const foot=gaitFrame(phase,side,walk);
   if(running){
    // A ground contact lasts 36% of a stride, leaving two short flight phases.
    const u=((phase/(Math.PI*2)+(side==='E'?0:.5))%1+1)%1;
    const swing=u>.36,part=swing?(u-.36)/.64:u/.36;
    const wave=swing?2*smooth(part)-1:1-2*part;
    const heel=swing?Math.sin(Math.PI*part):0;
    foot.z=mix(foot.z,.70*wave,running);foot.wave=mix(foot.wave,wave,running);
    foot.lift=mix(foot.lift,.53*heel*(1.32-.64*part),running);
    foot.roll=mix(foot.roll,swing?-.42*Math.cos(Math.PI*part):.20-.51*smooth(part),running);
   }
   const wave=foot.wave;
   if(!state.externalLegs){
    const ankle=vec(sign*(.29+(clip?p.drop*.11:.01)),.25+foot.lift+(.06+(sign===1?.30:.16))*jump,sign*p.stance+foot.z+(sign===1?.10:-.12)*jump);
    if(clip?.kick&&clip.kick.side===side)kickLeg(clip.kick,t,ankle,sign);
    const roll=foot.roll-.13*jump+(clip?.dashFoot?signatureDashSole(clip,t,side,ankle):0)+(clip?.kick&&clip.kick.side===side?kickRoll(clip.kick,t):0);
    if(dodge)dashStep(ankle,sign,dodge);
    twoBone(T,body,j['coxa_'+side],j['canela_'+side],j['pe_'+side],ankle,vec(sign*.35,.95,1.75),.73,.72,roll);
   }
   if(walk||jump){j['braco_'+side].rotation.x+=wave*.55*walk-.14*jump;j['antebraco_'+side].rotation.x+=(.33-.18*wave)*walk;j['braco_'+side].rotation.z+=sign*.28*jump;}
   if(running){
    j['braco_'+side].rotation.x+=wave*.49*running;
    j['antebraco_'+side].rotation.x-=(.49+.23*wave)*running;
    j['ombro_'+side].rotation.y+=sign*.06*running;
   }
  }
  if(clip?.fistPath)signatureFist(T,body,clip,t);
  if(id==='eco1'||id==='eco2')acousticContact(T,body,id,t);
  if(id==='comer')eating(T,body,t);
 }
 // Align the wrist to a precise contact, then leave it free on the recovery.
 // Both targets are in root space, so orbit, facing and movement leave the
 // audible event attached to the gesturing hand.
 function alignWrist(T,body,side,target,pole,pitch,blend){
  if(blend<=0)return;
  const j=body.joints,upper=j['braco_'+side],lower=j['antebraco_'+side],wrist=j['mao_'+side];
  const before=blend<1?[upper.quaternion.clone(),lower.quaternion.clone(),wrist.quaternion.clone()]:null;
  twoBone(T,body,upper,lower,wrist,target,pole,.62,.635,pitch);
  if(before){[upper,lower,wrist].forEach((joint,i)=>joint.quaternion.slerp(before[i],1-blend));}
 }
 function acousticContact(T,body,id,t){
  const j=body.joints,vec=(x,y,z)=>new T.Vector3(x,y,z);
  if(id==='eco2'){
   const k=smooth((t-.295)/.113)*(1-smooth((t-.46)/.17));
   if(!k)return;
   // A .39-wide hand meets the other across a .014 gap between inner faces.
   for(const [side,sign] of [['E',1],['D',-1]]){
    alignWrist(T,body,side,vec(sign*.202,2.70,1.00),vec(sign*1.47,2.65,.56),-1.25,k);
   }
  }else{
   const k=smooth((t-.025)/.095)*(1-smooth((t-.57)/.18));
   if(!k)return;
   j.cabeca.rotation.z-=.09*k;j.cabeca.rotation.y-=.085*k;
   const ear=j.cabeca.localToWorld(vec(-.58,.20,.11));
   const target=body.root.worldToLocal(ear);
   alignWrist(T,body,'D',target,vec(-1.69,2.90,.36),-2.78,k);
  }
 }
 function eating(T,body,t){
  const j=body.joints,v=(x,y,z)=>new T.Vector3(x,y,z),lift=smooth((t-.26)/.51)*(1-smooth((t-1.90)/.54));
  const chew=[.98,1.4,1.82].reduce((s,at)=>s+Math.exp(-(((t-at)/.084)**2)),0),swallow=Math.sin(Math.PI*clamp((t-2.1)/.4));
  j.tronco.rotation.x+=.044*chew-.059*swallow;j.cabeca.rotation.x+=.09*lift+.07*chew-.10*swallow;j.cabeca.rotation.y-=.13*lift;
  j.braco_E.rotation.x-=.20*lift;j.antebraco_E.rotation.x-=.24*lift;
  const wrist=v(-.63,2.31,.64).lerp(v(-.11,3.49,.40),lift);wrist.z+=lift*(1-chew)*.075;
  twoBone(T,body,j.braco_D,j.antebraco_D,j.mao_D,wrist,v(-1.70,2.20,.45),.62,.635);
 }
 function socket(T,body,key){
  if(key==='palmas')return socket(T,body,'palma_E').lerp(socket(T,body,'palma_D'),.5);
  return body.sockets[key].getWorldPosition(new T.Vector3());
 }
 // Humanoid poses share timing with the underlying animal skeleton.
 const mythicalFamilies={besta:'lobo',fenix:'falcao',oriental:'lobo',ocidental:'lobo'};
 for(const [species,family] of Object.entries(mythicalFamilies)){
  for(const suffix of ['0','1','2','3','4','_j1','_j2','_j3','_dash','awake']){
   const key=suffix==='awake'?'despertar_'+species:species+suffix;
   const base=suffix==='awake'?'despertar_'+family:family+suffix;
   Object.defineProperty(clips,key,{value:{...clips[base],id:key,sourceId:base}});
  }
 }
 return {clips,poses:P,define,baseMoveNames,baseDurations,gaitFrame,apply,eating,twoBone,socket,reset};
})();
