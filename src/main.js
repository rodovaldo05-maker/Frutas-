// FRUTO Legacy — Fase 1 (base e movimento). Liga motor, ilha, personagem, controles,
// câmera, HUD, menus e salvamento.

import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './ui/style.css';
import * as THREE from 'three';
import DATA from '../data/fruto-catalog.json';
import { Loop } from './core/loop.js';
import { Renderer } from './renderer/renderer.js';
import { FollowCamera } from './renderer/camera.js';
import { AutoQuality } from './optimization/quality.js';
import { Physics } from './physics/physics.js';
import { buildTrainingIsland, ISLAND } from './islands/trainingIsland.js';
import { buildVillageIsland, buildTrainingDock, BOATMEN, DOCKS, VILLAGE } from './islands/villageIsland.js';
import { WorldField } from './terrain/offsetField.js';
import { Boat } from './ships/boat.js';
import { Villagers } from './world/villagers.js';
import { VillageUi } from './ui/villageUi.js';
import { buildGathering, Gathering } from './crafting/gathering.js';
import { NODE_TYPES } from './crafting/professions.js';
import { MATERIALS, TOOLS, addMaterial, materialDrop } from './crafting/materials.js';
import { ForgeUi } from './ui/forgeUi.js';
import { AWAKEN, awakenState, trialHit, trialProgress } from './fruits/awakening.js';
import { FORMS, FORM_TIME, formMods, formBlock, hasForm, addFormParts, removeFormParts, animateForm } from './transformations/forms.js';
import { SPECS, SPEC_LEVEL, SPEC_CHANGE_COST } from './races/races.js';
import { hourOf, daylight, fmtClock, GAME_MINUTES_PER_SECOND } from './world/clock.js';
import { Ocean } from './ocean/ocean.js';
import { createPlayer } from './characters/player.js';
import { PlayerAnimator } from './animation/playerAnimator.js';
import { CharacterController } from './movement/characterController.js';
import { Input } from './controls/input.js';
import { Hud } from './ui/hud.js';
import { PauseMenu } from './ui/menu.js';
import { Minimap, renderIslandImage } from './ui/islandMap.js';
import { MapScreen } from './ui/mapScreen.js';
import { renderPortrait } from './ui/portrait.js';
import { applyIcons, ICONS, EMBLEM } from './ui/icons.js';
import { TRAINING, TrainingMission } from './quests/training.js';
import { SaveSystem } from './saves/saveSystem.js';
import { Dust } from './vfx/dust.js';
import { buildMarket } from './world/npcs.js';
import { fruitThumbs } from './fruits/fruitArt.js';
import { FruitShop } from './ui/fruitShop.js';
import { eat, findItem, isWaterCursed, ensureBag, rarityOf } from './fruits/roulette.js';
import { RANK, FRUIT, fruitName, draw as drawFruit, validate as validateFruits } from './fruits/catalog.js';
import { CatalogScreen } from './ui/catalogScreen.js';
import { maxStamina, maxHealth, maxEnergy, POINTS_PER_LEVEL, damageMultipliers } from './progression/status.js';
import { computeDamage } from './combat/rules.js';
import { FruitPowers } from './combat/powers.js';
import { powersOf } from './fruits/powers.js';
import { fruitStyle } from './combat/rules.js';
import { FRUTOMotion } from './animation/fruto-motion.js';
import { domainOf, addDomainXp, domainBonus } from './progression/domain.js';
import { PowerFx } from './vfx/powerFx.js';
import { SkillBar } from './ui/skillBar.js';
import { WEAPONS, weaponPowers, weaponStyle } from './weapons/weapons.js';
import { makeSword } from './weapons/swordModel.js';
import { Fleet } from './ships/fleet.js';
import { LabFx } from './vfx/labFx.js';
import { SellItemsUi } from './ui/sellItemsUi.js';
import { shipLoot, repairCost, NAVAL } from './ships/naval.js';
import { profOf, addProfXp, profBonus } from './progression/proficiency.js';
import { Armory } from './ui/armory.js';
import { STYLES, styleCombo, stylePowers } from './styles/styles.js';
import { Vontade } from './styles/vontade.js';
import { Dojo } from './ui/dojo.js';
import { ITEMS, gearTotals, wearArmor, addItem, dropFor, equipItem } from './items/items.js';
import { applyGearVisual, gearSlots } from './items/gearParts.js';
import { OUTFITS, buildOutfit, removeOutfit, outfitPalette, buyOutfit } from './characters/outfits.js';
import { remergeBody, tintSegment } from './characters/mergeBody.js';
import { SEGMENT_PART, PLAYER_MERGE, BASE_LOOK } from './characters/player.js';
import { RACES } from './races/races.js';
import { RaceSystem } from './races/raceSystem.js';
import { addRaceParts, removeRaceParts, flapWings } from './races/raceParts.js';
import { SEA, PORTO_CAMP, buildSeaIsland, levelsFor, seaSpots } from './islands/firstSea.js';
import { SEA2, GATES, ARRIVALS, CROSSING, seaOf, crossingUnlocked } from './islands/secondSea.js';
import { Storm } from './world/storm.js';
import { WEATHER, STRIKE, stepWeather, weatherDamage } from './world/weather.js';
import { BeastManager } from './ships/beasts.js';
import { ENCOUNTER, canSpawn, pickBeast, beastLoot, minPlayerLevel } from './ships/beastRules.js';
import { buildArena, Recruta, scaledDef, bossDef } from './combat/enemies.js';
import { PlayerCombat } from './combat/playerCombat.js';
import { FloatText } from './combat/floatText.js';
import { Conditions, CONDITIONS } from './combat/conditions.js';
import { TrainingTracker, bonuses, ATTRS } from './progression/training.js';
import { addXp, xpProgress, xpToNext } from './progression/level.js';
import { StatusScreen } from './ui/statusScreen.js';
import { createFruitAudio } from './audio/fruto-audio.js';

const $ = (id) => document.getElementById(id);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const setLoading = async (text, pct) => {
  $('loading-text').textContent = text;
  if (pct !== undefined) $('loading-bar').style.width = `${pct}%`;
  await nextFrame();
};
const isTouch = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const native = () => !!window.Capacitor?.isNativePlatform?.();
const fmt = (n) => n.toLocaleString('pt-BR');

async function boot() {
  applyIcons();
  $('emblem').innerHTML = EMBLEM;
  if (isTouch()) document.body.classList.add('touch');
  const saves = new SaveSystem();
  const [settings, save] = await Promise.all([saves.loadSettings(), saves.loadGame()]);

  await setLoading('Preparando o motor…', 10);
  const renderer = new Renderer($('game'));
  const quality = new AutoQuality(renderer, settings.quality);

  await setLoading('Carregando a física…', 22);
  const physics = await Physics.create();

  // as placas desenham texto com a fonte do jogo: espera ela carregar
  await Promise.race([document.fonts?.load('700 64px Cinzel'), new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
  await setLoading('Erguendo a Ilha de Treino…', 35);
  const island = buildTrainingIsland({ scene: renderer.scene, physics });
  island.signs.push(...buildTrainingDock({ scene: renderer.scene, physics, field: island.field }).signs);
  await setLoading('Erguendo o Porto das Origens…', 48);
  const village = buildVillageIsland({ scene: renderer.scene, physics });
  island.signs.push(...village.signs);
  // Primeiro Mar (atualização 14): as ilhas 2 a 10
  await setLoading('Erguendo o Primeiro Mar…', 52);
  const ALL_SEA = [...SEA, ...SEA2];
  const sea = ALL_SEA.map((def) => buildSeaIsland({ scene: renderer.scene, physics, def }));
  // Barqueiro do Cais das Correntes (Segundo Mar): leva de volta ao Porto das Origens
  const correntes = SEA2[0];
  const cLand = seaSpots(correntes).landing;
  const SEA_DOCKS = {
    correntes: {
      island: correntes.nome, x: correntes.x + cLand.x * 0.92, z: correntes.z + cLand.z * 0.92, yaw: cLand.yaw + Math.PI, ground: true,
      mooring: { x: correntes.x + cLand.x * 1.28, z: correntes.z + cLand.z * 1.28, yaw: cLand.yaw },
    },
  };
  const ALL_DOCKS = { ...DOCKS, ...SEA_DOCKS };
  const SEA_BOATMEN = [{
    id: 'barqueiro-correntes', role: 'barqueiro', to: 'porto', name: 'Barqueiro das Correntes', x: SEA_DOCKS.correntes.x + 2, z: SEA_DOCKS.correntes.z + 2, yaw: cLand.yaw + Math.PI, stall: false, here: 'correntes',
    look: { skin: '#8a5a3c', hair: '#e8e8e8', shirt: '#1f4f6a', shorts: '#e8dcc0', shoes: '#2a2018' },
    hint: 'Viagem rápida ao Porto das Origens (Primeiro Mar) ou trazer o seu bote até este cais.',
  }];
  for (const s of sea) island.signs.push(...s.signs);
  // chão do mundo todo: cada ilha responde pela sua área; fora delas, fundo do mar
  const world = new WorldField([island.field, village.field, ...sea.map((s) => s.field)]);
  const market = buildMarket({ scene: renderer.scene, physics, field: world, data: DATA, extra: [...BOATMEN, ...SEA_BOATMEN] });
  // moradores do Porto das Origens (rotina pela hora do jogo)
  const villagers = new Villagers({ scene: renderer.scene, data: DATA, village: village.village, offset: VILLAGE.offset, physics, baseY: VILLAGE.plateau });
  // veios de minério e pontos de pesca (atualização 12)
  const gatherWorld = buildGathering({ scene: renderer.scene, physics, ground: (x, z) => world.sample(x, z) });
  island.signs.push(...gatherWorld.signs);
  island.signs.push(...market.signs);
  const arena = buildArena({ scene: renderer.scene, physics, field: island.field, data: DATA });
  // inimigos por nível e chefes de cada ilha, e o acampamento do Capitão Ferrugem no Porto
  {
    const add = (id, x, z, def) => arena.add(new Recruta({ id, x, z, field: world, scene: renderer.scene, data: DATA, def }));
    for (const s of sea) {
      const lv = levelsFor(s.def);
      s.enemies.forEach((p, k) => add(`${s.def.id}-${k + 1}`, p.x, p.z, scaledDef(s.def.enemy, lv[k])));
      add(`${s.def.id}-chefe`, s.boss.x, s.boss.z, bossDef(s.def.boss, s.def.faixa[1]));
    }
    const o = VILLAGE.offset;
    const [cx, cz] = PORTO_CAMP.local.camp;
    PORTO_CAMP.niveis.forEach((lv, k) => add(`porto-saqueador-${k + 1}`, o.x + cx + Math.cos(k * 2.1) * 4, o.z + cz + Math.sin(k * 2.1) * 4, scaledDef(PORTO_CAMP.enemy, lv)));
    const [bx, bz] = PORTO_CAMP.local.boss;
    add('porto-chefe', o.x + bx, o.z + bz, bossDef(PORTO_CAMP.boss, PORTO_CAMP.boss.nivel));
  }
  physics.world.updateSceneQueries?.();
  physics.step();

  await setLoading('Enchendo o mar…', 62);
  const sunDir = renderer.sunOffset.clone().normalize();
  const ocean = new Ocean({ scene: renderer.scene, field: island.field, level: ISLAND.waterLevel, sun: sunDir, sky: { top: new THREE.Color('#5aa7d6'), horizon: new THREE.Color('#cfe7e4') } });
  ocean.setDetail(renderer.quality.oceanDetail);
  let boat = null; // bote do jogador (criado depois do personagem)
  let fleet = null; // navios inimigos e canhões (atualização 16)

  await setLoading('Montando o personagem…', 74);
  const audio = createFruitAudio();
  audio.setVolume(settings.volume);
  const player = createPlayer(renderer.scene, DATA, { profile: renderer.quality.pixelRatio < 1 ? 1 : 0 });

  // chão para os pés (equilíbrio) e para a sombra: raio para baixo no mundo
  let feetY = 0;
  const groundAt = (x, z, fromY) => {
    const top = (fromY ?? feetY) + 1.6;
    const reach = fromY === undefined ? 3.6 : 80;
    const hit = physics.raycast({ x, y: top, z }, { x: 0, y: -1, z: 0 }, reach);
    if (hit) return hit.point.y;
    return fromY === undefined ? feetY : -80;
  };

  const hud = new Hud();
  const dust = new Dust(renderer.scene);
  const animator = new PlayerAnimator({ player, data: DATA, groundAt, audio, dust });

  // ===== Missão de treino =====
  save.missions.treino ??= {};
  const towerTopY = island.field.sample(30, -12) + 15.6;
  const mission = new TrainingMission(save.missions.treino, {
    onObjective: (obj, n, total) => {
      hud.toast(`Objetivo concluído: ${obj.text} (${n}/${total}) · +${TRAINING.objectiveXp} exp`, 'good');
      audio.play('base', 'wing', 0.5);
      grantXp(TRAINING.objectiveXp);
      tracker.challenge(obj.id, ctl);
      refreshMission();
      saveNow(true);
    },
    onComplete: () => hud.toast('Treino de movimento concluído! Receba a recompensa em Missões.', 'good'),
  });

  const ctl = new CharacterController({
    physics,
    water: ocean,
    unlocks: save.unlocks,
    onEvent: (name, data) => {
      animator.onEvent(name, data);
      mission.event(name);
      tracker.event(name, data, ctl);
      onMoveEvent(name, data);
    },
  });

  function onMoveEvent(name, data) {
    switch (name) {
      case 'jump': audio.play('base', 'jump', data.climb ? 0.6 : 0.8); raceSys.onJumpStart(); break;
      case 'doubleJump':
        audio.play('base', 'wing', 0.8);
        raceSys.onExtraJump(data.n);
        if (save.race === 'ceu' || form?.info?.wings?.length) wingBurst = 1;
        break;
      case 'wallJump': audio.play('base', 'jump', 1); break;
      case 'dash': audio.play('base', 'dash', 0.8); break;
      case 'land': raceSys.onLand(); if (data.strength > 0.15) audio.play('base', 'land', Math.min(1, 0.3 + data.strength)); if (data.hard) hud.toast('Queda forte! Agache antes de tocar o chão para rolar.'); break;
      case 'roll': audio.play('base', 'dash', 0.5); hud.toast('Rolamento: sem dano de queda', 'good'); conditions?.onRoll(); break;
      case 'splash': audio.play('base', 'splash', data.strength); break;
      case 'grab': audio.play('base', 'step', 0.5); break;
      case 'mantle': audio.play('base', 'step', 0.6); break;
      case 'glideStart': audio.play('base', 'wing', 0.6); break;
      case 'damage':
        hud.damageFlash();
        if (data.reason !== 'golpe' && data.reason !== 'queimadura') hud.toast(`−${Math.round(data.amount)} vida (${data.reason})`, 'bad');
        break;
      case 'faint': hud.toast('Você desmaiou…', 'bad'); audio.play('base', 'death', 0.8); conditions?.reset(); raceSys.onFaint(); break;
      case 'respawn': cam.snap(ctl.pos, ctl.yaw); conditions?.reset(); break;
      default:
    }
  }

  // raça (tipo corporal): passivas, ativa e maestria (atualização 5)
  let raceDenyAt = -9;
  let condTimer = 0;
  let playerTint = '#000000';
  let wingBurst = 0;
  let form = null; // forma híbrida ativa { id, info } (atualização 13)
  let raceParts = save.race ? addRaceParts(player.body, save.race) : null;
  const raceSys = new RaceSystem({ ctl, save, onEvent: (name, d) => onRaceEvent(name, d) });
  let baseRegen = 1;

  // vida, fôlego e bônus de movimento: pontos distribuídos + treino pela prática
  // (cada ponto de Força e cada nível de treino de Força: +1 de fôlego)
  // + equipamento (atualização 8): defesa, vida, fôlego, energia, elemental, peso e sinergias
  const applyStatus = () => {
    const b = bonuses(save.training);
    const g = gearTotals(save);
    ctl.stamina.setMax(maxStamina(save.status, save.training) + g.folego);
    baseRegen = b.staminaRegen * (1 - g.pesoPenalty);
    ctl.stamina.regenMult = baseRegen;
    const rm = raceSys.mods;
    const fm = formMods(form?.id);
    ctl.mods = { response: b.response, airControl: b.airControl * rm.airControl, swimSpeed: b.swimSpeed * rm.swimSpeed * (1 + g.nado), breath: b.breath, dodgeTime: b.dodgeTime, glideSpeed: b.glideSpeed * rm.glideSpeed * fm.glide, glideFall: b.glideFall * rm.glideFall };
    ctl.race = { extraJumps: rm.extraJumps + fm.extraJumps, jumpMult: rm.jumpMult, fallMult: rm.fallMult * (1 - g.queda) * fm.fall, noWaterDamage: rm.noWaterDamage, breathesWater: rm.breathesWater };
    ctl.speedMult = fm.speed;
    raceSys.cdMult = 1 - g.adaptCd;
    const ratio = ctl.maxHealth > 0 ? ctl.health / ctl.maxHealth : 1;
    ctl.maxHealth = maxHealth(save.status) + g.vida;
    ctl.health = Math.max(1, Math.min(ctl.maxHealth, ratio * ctl.maxHealth));
    powers?.setEnergyMax(maxEnergy(save.status) + g.energia);
    if (powers) {
      powers.regenMult = raceSys.mods.energyRegen * (1 + g.energiaRegen);
      powers.dmgMult = fm.fruit;
      powers.cdMult = rm.fruitCd;
    }
  };
  let gearParts = [];
  let outfitParts = [];
  // Visual do personagem: roupa (cores dos segmentos + peças) e armadura; tudo entra na
  // malha única do corpo de novo (as peças da roupa no encaixe de uma armadura somem)
  function refreshLook() {
    const pal = outfitPalette(save.outfit?.id, save.outfit?.cor);
    for (const [id, mesh] of Object.entries(player.body.meshes)) {
      const part = SEGMENT_PART[id] || 'skin';
      tintSegment(player.body, mesh, part === 'skin' ? BASE_LOOK.skin : pal[part] ?? BASE_LOOK[part]);
    }
    removeOutfit(outfitParts);
    outfitParts = buildOutfit(player.body, save.outfit?.id, pal, { hide: gearSlots(save) });
    gearParts = applyGearVisual(player.body, save, gearParts);
    remergeBody(player.body, PLAYER_MERGE);
  }
  const applyGear = () => {
    refreshLook();
    applyStatus();
  };
  // Guarda-roupa (aba Roupas em Personagem)
  function outfitHtml() {
    const cards = Object.entries(OUTFITS).map(([id, o]) => {
      const owned = save.outfits.includes(id);
      const on = save.outfit.id === id;
      const sw = o.palettes.map((p, k) => `<button style="--a:${p.shirt};--b:${p.a}" class="${on && save.outfit.cor === k ? 'on' : ''}" data-outfit="${id}" data-cor="${k}" ${owned ? '' : 'disabled'} aria-label="Cor ${k + 1}"></button>`).join('');
      const action = on ? '<span class="tag-eq">Vestindo</span>' : owned ? `<button class="btn gold" data-outfit="${id}" data-cor="0">Vestir</button>` : `<button class="btn ${save.coins >= o.preco ? 'gold' : ''}" data-buy-outfit="${id}">Comprar · ${fmt(o.preco)}</button>`;
      return `<div class="outfit-card ${on ? 'on' : ''}"><b>${o.nome}</b><small>${o.desc}</small><div class="outfit-sw">${sw}</div>${action}</div>`;
    }).join('');
    return `<p class="muted">Roupas mudam só a aparência. Armaduras ficam por cima e escondem a peça de roupa do mesmo lugar (o elmo esconde o chapéu).</p><div class="outfit-grid">${cards}</div>`;
  }
  $('pane-outfit').addEventListener('click', (e) => {
    const buy = e.target.closest('button[data-buy-outfit]');
    if (buy) {
      const r = buyOutfit(save, buy.dataset.buyOutfit);
      if (!r.ok) hud.toast(r.why, 'bad');
      else {
        save.outfit = { id: buy.dataset.buyOutfit, cor: 0 };
        hud.toast(`${OUTFITS[save.outfit.id].nome} comprada e vestida!`, 'gold');
        refreshProfile();
      }
    } else {
      const b = e.target.closest('button[data-outfit]');
      if (!b || !save.outfits.includes(b.dataset.outfit)) return;
      save.outfit = { id: b.dataset.outfit, cor: Number(b.dataset.cor) || 0 };
    }
    refreshLook();
    statusScreen.render();
    saveNow(true);
  });
  let powers = null;
  applyStatus();

  // ===== Combate (atualização 2): golpes, defesa, inimigos da arena e treino =====
  const floats = new FloatText($('float-layer'));
  let shake = 0;
  // Vontade (atualização 7): Armadura e Percepção
  let willDenyAt = -9;
  const vontade = new Vontade({
    save,
    onEvent: (name, d) => {
      if (name === 'denied' && time - willDenyAt > 1.5) {
        willDenyAt = time;
        hud.toast(d.message);
      }
      if (name === 'toggle') {
        audio.play('base', d.on ? 'wing' : 'step', 0.6);
        hud.toast(`${d.kind === 'armor' ? 'Vontade de Armadura' : 'Vontade de Percepção'} ${d.on ? 'ligada' : 'desligada'}`, d.on ? 'good' : '');
      }
      if (name === 'empty') hud.toast('Vontade esgotada: espere recuperar.', 'bad');
    },
  });
  const combat = new PlayerCombat({
    ctl,
    stats: () => {
      const b = bonuses(save.training);
      const m = damageMultipliers(save.status);
      const rm = raceSys.mods;
      const g = gearTotals(save);
      const fm = formMods(form?.id);
      const wake = powers?.awakened && save.equipped === 'fruta' ? AWAKEN.damage : 1; // combo da fruta desperta
      return { melee: m.melee * rm.meleeMult * fm.melee * wake, weapon: m.weapon * rm.meleeMult, prof: profBonus(profOf(save, 'espada').level), defense: m.defense + g.defesa, mitigation: b.mitigation + rm.physicalMitigation + vontade.mitigation + fm.mitigation, elementalMit: b.elementalMit + g.elemental + rm.elementalMit, stunMult: rm.stunMult, armor: vontade.damageMult, perfectWindow: b.perfectWindow, blockReduce: b.blockReduce, postureMult: b.postureMult };
    },
    onEvent: (name, d) => {
      const p = ctl.pos;
      const head = { x: p.x, y: p.y + 2.4, z: p.z };
      switch (name) {
        case 'swing':
          audio.play('base', 'swing', 0.55 + d.step * 0.2);
          showM1Step(d.step, d.total, d.m1);
          break;
        case 'impact': {
          // evento de impacto da animação (M1): efeito da fruta e som saem uma vez por golpe
          const a = d.attack;
          if (!a.m1) break;
          const f = eatenFruit();
          const dir = { x: Math.sin(ctl.yaw), y: 0, z: Math.cos(ctl.yaw) };
          const at = m1Point(a, d.target);
          if (f && save.equipped === 'fruta') lab.m1(f.id, a, at, dir);
          audio.play(d.landed ? 'impacto' : 'base', d.landed ? 'acerto' : 'swing', a.heavy ? 1 : 0.55 + a.m1 * 0.08);
          if (d.landed) shake = Math.max(shake, [0.08, 0.1, 0.14, 0.22][a.m1 - 1]);
          if (d.landed && a.heavy) vibrate(30);
          break;
        }
        case 'slash': {
          // rastro do corte de espada: arco de cubos na cor da lâmina
          const w = WEAPONS[d.attack.weapon];
          if (!w) break;
          const flip = d.attack.id.endsWith('2') ? -1 : 1;
          for (let k = 0; k <= 12; k++) {
            const a = ctl.yaw + flip * (-1.1 + (k / 12) * 2.2);
            const r = d.attack.range * 0.8;
            fx.burst({ x: p.x + Math.sin(a) * r, y: p.y + 2.1 + (k / 12 - 0.5) * flip * 1.2, z: p.z + Math.cos(a) * r }, w.cores.fio, { count: 1, speed: 0.3, up: 0.2, size: 0.22, life: 0.22, gravity: 0, spread: 0.1 });
          }
          break;
        }
        case 'hit': {
          const t = d.target;
          const at = { x: t.pos.x, y: t.pos.y + 3.2, z: t.pos.z };
          if (d.result === 'block') {
            floats.add(at, 'Defendeu', 'bloqueio');
            audio.play('base', 'land', 0.4);
            break;
          }
          floats.add(at, String(d.damage), d.attack.heavy ? 'forte' : 'dano');
          // soco com a fruta equipada: contato do laboratório na cor da fruta
          if (save.equipped === 'fruta' && eatenFruit() && !d.attack.id?.startsWith('espada') && !d.attack.m1) lab.punch(eatenFruit().id, at, { x: Math.sin(ctl.yaw), y: 0, z: Math.cos(ctl.yaw) }, d.attack.heavy ? 2 : 0);
          // faíscas do golpe (espada na cor do fio, soco em tom claro)
          {
            const c = d.attack.id?.startsWith('espada') ? WEAPONS[save.weapon]?.cores?.fio ?? '#ffffff' : '#fff0c8';
            fx.spark(at, c, { count: d.attack.heavy ? 7 : 4, speed: 4.5, size: 0.45, up: 2.5, life: 0.3 });
            if (d.attack.heavy) fx.flash(at, c, 1.8, 0.18);
          }
          if (!d.attack.m1) {
            audio.play('impacto', 'acerto', d.attack.heavy ? 1 : 0.7);
            shake = Math.max(shake, d.attack.heavy ? 0.22 : 0.12);
          }
          if (t.hostile) raceSys.onHostileHit(d.attack.weapon ? 'espada' : d.attack.fruit ? 'fruta' : 'soco');
          if (d.attack.style) grantStyle(d.attack.style, t.hostile ? 1.5 : 0.5, `${t.id}:${d.attack.id}`, t.hostile, t);
          if (vontade.armor && t.hostile) grantMastery('vontade:armadura', 'Vontade de Armadura', 1, 'arm', true, t);
          if (d.attack.chain && t.hostile) {
            // Corpo Voltaico: o 3º golpe salta um raio para outro inimigo
            const other = arena.targets.find((o) => o !== t && o.alive && o.hostile && Math.hypot(o.pos.x - t.pos.x, o.pos.z - t.pos.z) < 8);
            if (other) {
              fx.bolt({ x: t.pos.x, y: t.pos.y + 2.2, z: t.pos.z }, { x: other.pos.x, y: other.pos.y + 2.2, z: other.pos.z }, '#ffe45a', 0.3);
              const r2 = other.receiveHit({ attacker: { x: t.pos.x, y: t.pos.y, z: t.pos.z, yaw: 0 }, attack: { id: 'raio-voltaico', posture: 6, knock: 1, reaction: 'leve' }, damage: 8 });
              if (r2) floats.add({ x: other.pos.x, y: other.pos.y + 3.2, z: other.pos.z }, String(r2.damage), 'dano');
            }
          }
          if (d.attack.weapon) grantProf(t.hostile ? 1.5 : 0.5, `${t.id}:${d.attack.id}`, t.hostile, t);
          else tracker.combat('acerto', { target: t.id, life: t.life, hostile: t.hostile, attack: d.attack.id, heavy: d.attack.heavy }, p);
          if (d.attack.fruit) grantDomain(d.attack.fruit, t.hostile ? 1 : 0.5, `${t.id}:${d.attack.id}`, t.hostile, t);
          if (d.result === 'break') floats.add({ ...at, y: at.y + 0.8 }, 'Guarda quebrada!', 'perfeita');
          break;
        }
        case 'dodge':
          floats.add(head, 'Esquiva!', 'esquiva');
          tracker.combat('esquiva', { source: d.source, life: d.life, hostile: true }, p);
          break;
        case 'perfect':
          raceSys.onDefend();
          floats.add(head, 'Defesa perfeita!', 'perfeita');
          audio.play('base', 'wing', 1);
          shake = Math.max(shake, 0.15);
          tracker.combat('defesa', { source: d.source, life: d.life, hostile: true, perfect: true }, p);
          break;
        case 'block':
          raceSys.onDefend();
          floats.add(head, d.damage > 0 ? `Defendeu −${d.damage}` : 'Defendeu', 'bloqueio');
          audio.play('base', 'land', 0.5);
          tracker.combat('defesa', { source: d.source, life: d.life, hostile: true, perfect: false }, p);
          break;
        case 'wall': floats.add(head, 'Muralha!', 'esquiva'); audio.play('base', 'land', 0.5); break;
        case 'senseDodge':
          floats.add(head, `Percepção! (${d.left})`, 'esquiva');
          audio.play('base', 'dash', 0.6);
          grantMastery('vontade:percepcao', 'Vontade de Percepção', 2, 'sense', true, { id: d.source, life: d.life });
          break;
        case 'guardBreak': hud.toast('Guarda quebrada! Afaste-se e recupere a postura.', 'bad'); break;
        case 'hurt':
          floats.add(head, `−${d.damage}`, 'jogador');
          vibrate(d.damage >= 20 ? 60 : 25);
          audio.play('impacto', 'acerto', 0.5);
          shake = Math.max(shake, 0.18);
          tracker.combat('apanhar', { source: d.source, life: d.life, hostile: true, amount: d.damage }, p);
          {
            // golpe gasta a armadura; peça quebrada para de dar bônus até consertar
            const broke = wearArmor(save);
            if (broke) {
              hud.toast(`${ITEMS[broke.id].nome} quebrou! Conserte com o Mestre de Armas.`, 'bad');
              applyStatus();
            }
          }
          break;
        default:
      }
    },
  });
  // forma híbrida ativa: o M1 usa a variante híbrida dos golpes (mesmo quadro de impacto)
  combat.hybrid = () => !!form;
  // Ponto do impacto do M1: o encaixe do golpe (punho, palma, pé, boca) no corpo animado;
  // com alvo atingido, entre o encaixe e o peito do alvo
  const m1Tmp = new THREE.Vector3();
  const m1Tmp2 = new THREE.Vector3();
  function m1Point(a, target) {
    const sk = player.body.sockets;
    let p;
    if (a.socket === 'palmas' && sk.palma_E && sk.palma_D) p = sk.palma_E.getWorldPosition(m1Tmp).add(sk.palma_D.getWorldPosition(m1Tmp2)).multiplyScalar(0.5);
    else if (sk[a.socket]) p = sk[a.socket].getWorldPosition(m1Tmp);
    else p = m1Tmp.set(ctl.pos.x + Math.sin(ctl.yaw) * 2, ctl.pos.y + 2.2, ctl.pos.z + Math.cos(ctl.yaw) * 2);
    if (target?.pos) {
      p.x = (p.x + target.pos.x) / 2;
      p.z = (p.z + target.pos.z) / 2;
      p.y = (p.y + target.pos.y + (a.low ? 0.6 : 2.2)) / 2;
    }
    return { x: p.x, y: p.y, z: p.z };
  }
  // Indicador discreto da sequência (1/4 a 4/4); some ao fim da janela de continuação
  const m1El = $('m1-step');
  let m1Hide = 0;
  function showM1Step(step, total, m1) {
    if (!m1El || !m1 || save.settings?.m1Indicator === false) return;
    const dots = m1El.querySelectorAll('i');
    dots.forEach((el, i) => el.classList.toggle('lit', i <= step));
    m1El.querySelector('b').textContent = `${step + 1}/${total}`;
    m1El.style.setProperty('--m1c', eatenFruit()?.color ?? '#ffe7a3');
    m1El.classList.add('on');
    clearTimeout(m1Hide);
    m1Hide = setTimeout(() => m1El.classList.remove('on'), 1300);
  }
  // Cauda e asas da forma híbrida acompanham o golpe (chicote de cauda, corte de asa)
  function m1Appendage() {
    const cur = combat.runner.current;
    if (!cur || !form) return null;
    const a = combat.runner.attacks[cur.id];
    if (!a?.appendage || (a.appendage !== 'cauda' && a.appendage !== 'asas')) return null;
    const tm = cur.tm;
    const k = Math.max(0, Math.min(1, (cur.t - tm.release * 0.45) / (tm.duration - tm.release * 0.45)));
    return { part: a.appendage, k, side: a.kind === 'tail' && cur.step % 2 ? -1 : 1 };
  }

  // ===== Condições (atualização 6): queimando, congelado, lento, choque, molhado =====
  const COND_FLOAT = { queimando: 'forte', congelado: 'esquiva', lento: 'esquiva', choque: 'perfeita' };
  const conditions = new Conditions({
    resist: () => ({ duration: bonuses(save.training).condDuration * raceSys.mods.stunMult }),
    onEvent: (name, d) => {
      const head = { x: ctl.pos.x, y: ctl.pos.y + 2.4, z: ctl.pos.z };
      if (name === 'burn') floats.add(head, `−${d.damage}`, 'jogador');
      if (name === 'apply' && COND_FLOAT[d.name]) floats.add(head, `${CONDITIONS[d.name].nome}!`, COND_FLOAT[d.name]);
      if (name === 'stun') hud.toast('Atordoado pelo choque! (3 cargas)', 'bad');
    },
  });
  // golpe de inimigo: dano, condições do elemento e treino de Resistência Elemental
  function enemyHit(enemy, attack, damage, from = enemy.pos) {
    const r = combat.receive({ attacker: { x: from.x, y: from.y, z: from.z, yaw: enemy.yaw }, attack, damage, source: enemy.id, life: enemy.life });
    if (attack.element && (r.result === 'hit' || r.result === 'break')) {
      for (const [name, opts] of Object.entries(attack.effects || {})) conditions.apply(name, opts);
      if (r.damage > 0) tracker.combat('elemental', { source: enemy.id, life: enemy.life, hostile: true, element: attack.element, amount: r.damage }, ctl.pos);
    }
    return r;
  }
  arena.hitPlayer = (enemy, attack, damage) => enemyHit(enemy, attack, damage);
  combat.vontade = vontade;
  // Percepção: aviso vermelho quando um inimigo vai atacar
  arena.onWindup = (enemy) => {
    if (vontade.sense) fx.ring(enemy.pos, '#ff3a3a', 2.4, 0.5);
  };
  // ataque marcado dos Recrutas elementais: aviso no chão e resolução depois de 0,9 s
  arena.onSpecial = (enemy, at, sp) => {
    fx.mark(at, enemy.def.cor, sp.radius, sp.telegraph);
    audio.play('base', 'wing', 0.4);
  };
  arena.resolveSpecial = (enemy, at, sp) => {
    const color = enemy.def.cor;
    if (enemy.def.element === 'raio') fx.bolt({ x: at.x, y: at.y + 14, z: at.z }, { x: at.x, y: at.y + 0.2, z: at.z }, color, 0.35);
    else fx.pillar(at, color, sp.radius * 0.9, enemy.def.element === 'gelo' ? 4 : 7, 0.6);
    fx.ring(at, color, sp.radius, 0.4);
    fx.burst(at, color, { count: 22, speed: 5, up: 5 });
    audio.play(enemy.def.element === 'fogo' ? 'brasa' : enemy.def.element === 'gelo' ? 'geada' : 'tormenta', 'acerto', 0.9);
    const p = ctl.pos;
    const inside = Math.hypot(p.x - at.x, p.z - at.z) <= sp.radius + 0.6 && Math.abs(p.y - at.y) < 3.5;
    if (!playerProxy.alive) return;
    if (!inside) {
      // saiu do círculo que estava sob seus pés: esquiva real
      floats.add({ x: p.x, y: p.y + 2.4, z: p.z }, 'Desviou!', 'esquiva');
      tracker.combat('esquiva', { source: enemy.id, life: enemy.life, hostile: true }, p);
      return;
    }
    const attack = { id: 'especial', posture: 14, knock: 1.6 * 2.2, reaction: 'media', element: enemy.def.element, effects: sp.effects };
    enemyHit(enemy, attack, computeDamage(sp.damage * enemy.def.damageMult), { x: enemy.pos.x, y: enemy.pos.y, z: enemy.pos.z });
  };
  const onEnemyDefeated = (foe) => {
      save.coins += foe.def.coins;
      if (foe.boss) bossReward(foe);
      const drop = dropFor(foe.def.level);
      if (drop) {
        const it = addItem(save, drop);
        const d = ITEMS[drop];
        if (!save.gear[d.slot]) {
          equipItem(save, it.uid);
          applyGear();
        }
        hud.toast(`Item encontrado: ${d.nome} (${d.qualidade})${save.gear[d.slot] === it.uid ? ' · equipado' : ''}`, 'gold');
      }
      floats.add({ x: foe.pos.x, y: foe.pos.y + 4, z: foe.pos.z }, `+${foe.def.xp} exp · +${foe.def.coins} moedas`, 'info');
      hud.toast(`${foe.def.nome} derrotado! +${foe.def.xp} exp · +${foe.def.coins} moedas`, 'good');
      villageUi.defeat(foe.def);
      raceSys.onTrialKill(foe.def);
      for (const [id, n] of materialDrop(foe.def)) {
        addMaterial(save, id, n);
        hud.toast(`+${n} ${MATERIALS[id].nome}`, 'good');
      }
      audio.play('base', 'death', 0.6);
      grantXp(foe.def.xp);
      saveNow(true);
  };
  for (const r of arena.recrutas) r.onDefeated = onEnemyDefeated;
  // Chefe derrotado: registro, chave (25%), material raro, item garantido e chance de fruta
  function bossReward(foe) {
    save.bosses ??= {};
    const first = !save.bosses[foe.id];
    save.bosses[foe.id] = (save.bosses[foe.id] ?? 0) + 1;
    hud.toast(`Chefe derrotado: ${foe.def.nome}!${first ? ' (primeira vez)' : ''}`, 'gold');
    if (Math.random() < 0.25 || first) {
      save.keys = (save.keys ?? 0) + 1;
      hud.toast('+1 chave da roleta', 'gold');
    }
    const rare = ['cristal', 'ferro', 'perola', 'nucleo-brasa', 'nucleo-geada', 'nucleo-tormenta'][Math.floor(Math.random() * 6)];
    addMaterial(save, rare, 2 + Math.floor(Math.random() * 3));
    const pool = Object.keys(ITEMS).filter((id) => ITEMS[id].nivel >= 5);
    const it = addItem(save, pool[Math.floor(Math.random() * pool.length)]);
    hud.toast(`Item do chefe: ${ITEMS[it.id].nome} (${ITEMS[it.id].qualidade}) · +${MATERIALS[rare].nome}`, 'gold');
    if (Math.random() < 0.15 && save.bag.length < 60) {
      const r = drawFruit('npc');
      if (r) {
        save.bag.push({ uid: save.nextUid++, fruit: r.fruit, fav: false, at: Date.now(), origem: 'chefe' });
        hud.toast(`O chefe deixou uma fruta: ${fruitName(r.fruit)}!`, 'gold');
      }
    }
  }
  const playerProxy = { pos: ctl.pos, get yaw() { return ctl.yaw; }, alive: true };

  // ===== Poderes das frutas (atualização 3): energia, habilidades 1–3 e domínio =====
  const fx = new PowerFx(renderer.scene, { ground: (x, z) => world.sample(x, z), light: renderer.qualityId === 'leve' || renderer.qualityId === 'baixa' });
  fx.viewH = () => renderer.renderer.domElement.height;
  // efeitos das frutas do Laboratório Voxel (atualização 18): coreografia por fruta e golpe
  const lab = new LabFx({
    scene: renderer.scene,
    ground: (x, z) => world.sample(x, z),
    fruits: DATA.fruits,
    emit: (pos, c, count, speed, o) => fx.labEmit(pos, c, count, speed, o),
    glow: fx,
    mobile: window.matchMedia('(pointer: coarse)').matches,
    level: () => ({ alta: 0, media: 1, leve: 2 })[renderer.qualityId] ?? 1,
    calm: () => !!settings.reduceFx,
    shake: (amount) => {
      if (!settings.reduceMotion) shake = Math.max(shake, amount * 3);
    },
  });
  const skillBar = new SkillBar();
  const eatenFruit = () => (save.eaten ? DATA.fruits[DATA.fruits.findIndex((f) => f.id === save.eaten.fruit)] ?? null : null);
  // Forma híbrida (frutas de fera; atualização 13): partes no corpo e números próprios
  function toggleForm(off = false) {
    const f = eatenFruit();
    combat.runner.reset(); // transformar é ação incompatível: a sequência do M1 recomeça
    if (form) {
      removeFormParts(form.info);
      form = null;
      applyStatus();
      $('btn-form').classList.remove('on');
      if (!off) {
        hud.toast('Forma humana');
        fx.burst({ x: ctl.pos.x, y: ctl.pos.y + 1.5, z: ctl.pos.z }, f?.color ?? '#ffffff', { count: 14, speed: 3, up: 2 });
      }
      return;
    }
    if (off) return;
    const why = formBlock(f?.id, f ? domainOf(save, f.id).level : 1);
    if (why) return hud.toast(why);
    if (!['ground', 'air', 'glide'].includes(ctl.state)) return hud.toast('Transforme-se em terra ou no ar.');
    form = { id: f.id, info: addFormParts(player.body, f.id, f.color) };
    ctl.invulnerable = Math.max(ctl.invulnerable, FORM_TIME); // invulnerável durante a troca
    fx.burst({ x: ctl.pos.x, y: ctl.pos.y + 1.5, z: ctl.pos.z }, f.color, { count: 32, speed: 6, up: 4 });
    fx.ring(ctl.pos, f.color, 3.5, FORM_TIME);
    audio.play('base', 'wing', 0.9);
    hud.toast(`${FORMS[f.id].nome}: ${FORMS[f.id].desc}`, 'gold');
    $('btn-form').classList.add('on');
    applyStatus();
  }
  const domainBudget = new Map();
  let deniedAt = -9;
  function grantDomain(fruitId, xp, key, hostile, foe) {
    let amount = xp;
    if (hostile) {
      const k = `${foe.id}:${foe.life}`;
      const used = domainBudget.get(k) || 0;
      amount = Math.max(0, Math.min(xp, 20 - used));
      domainBudget.set(k, used + amount);
    } else amount *= tracker.farm.repetition(`dominio:${key}`, ctl.pos, tracker.now);
    if (amount <= 0) return;
    const before = domainOf(save, fruitId).level;
    const levels = addDomainXp(save, fruitId, amount);
    if (!levels) return;
    const d = domainOf(save, fruitId);
    const f = DATA.fruits.find((x) => x.id === fruitId);
    const opened = powers.powers.filter((p) => p.unlock > before && p.unlock <= d.level).map((p) => p.nome);
    hud.toast(`Domínio de ${f?.name ?? fruitId} nível ${d.level}${opened.length ? ` · ${opened.join(', ')} liberada!` : ''}`, opened.length ? 'gold' : 'good');
    audio.play('base', 'wing', 0.9);
    powers.domainLevel = d.level;
    refreshEquip();
    if (modals.includes('status')) statusScreen.render();
    saveNow(true);
  }
  powers = new FruitPowers({
    ctl,
    fx,
    lab,
    stats: () => ({ fruit: damageMultipliers(save.status).fruit * raceSys.mods.fruitDamage, domain: domainBonus(powers.domainLevel) }),
    onEvent: (name, d) => {
      const p = ctl.pos;
      switch (name) {
        case 'cast': audio.play(d.power.weapon ? 'base' : d.power.fruit, d.power.weapon ? 'swing' : 'preparar', 0.7); break;
        case 'release': audio.play(d.power.weapon ? 'base' : d.power.fruit, d.power.weapon ? 'dash' : 'liberar', d.power.slot === 2 ? 1.1 : 0.9); break;
        case 'impact': shake = Math.max(shake, 0.12); break;
        case 'denied':
          if (time - deniedAt > 1.5) {
            deniedAt = time;
            hud.toast(d.message);
          }
          break;
        case 'heal': floats.add({ x: p.x, y: p.y + 2.4, z: p.z }, `+${d.amount}`, 'info'); break;
        case 'awaken': {
          const f = eatenFruit();
          const nome = FRUIT[f?.id]?.despertar?.nome ?? 'Despertar';
          if (d.on) {
            hud.toast(`Despertar: ${nome}! +30% de dano e recargas mais rápidas (gasta energia)`, 'gold');
            fx.burst({ x: p.x, y: p.y + 1.5, z: p.z }, f?.color ?? '#ffd36b', { count: 30, speed: 6, up: 4 });
            fx.ring(p, f?.color ?? '#ffd36b', 4, 0.6);
            audio.play('base', 'wing', 1);
          } else hud.toast(d.empty ? 'Despertar terminou: sem energia.' : 'Despertar desligado.');
          playerTint = null;
          break;
        }
        case 'teleport': ctl.spawn(d.x, world.sample(d.x, d.z) + 0.4, d.z, d.yaw); break;
        case 'hit': {
          const t = d.target;
          const at = { x: t.pos.x, y: t.pos.y + 3.2, z: t.pos.z };
          if (d.result === 'block') {
            floats.add(at, 'Defendeu', 'bloqueio');
            break;
          }
          if (d.damage > 0) floats.add(at, String(d.damage), d.power.slot === 2 ? 'forte' : 'dano');
          audio.play(d.power.fruit, 'acerto', 0.8);
          shake = Math.max(shake, d.power.slot === 2 ? 0.2 : 0.1);
          if (t.hostile) {
            raceSys.onHostileHit(d.power.weapon ? 'espada' : d.power.style ? 'soco' : 'fruta');
            if (!d.power.weapon && !d.power.style) raceSys.onFruitHit(d.power.slot);
          }
          if (d.power.style) grantStyle(d.power.fruit, t.hostile ? (d.power.slot >= 2 ? 4 : 3) : 1, `${t.id}:t${d.power.slot}`, t.hostile, t);
          else if (d.power.weapon) grantProf(t.hostile ? (d.power.slot === 2 ? 4 : 3) : 1, `${t.id}:h${d.power.slot}`, t.hostile, t);
          else {
            grantDomain(d.power.fruit, t.hostile ? (d.power.slot === 2 ? 4 : 3) : 1, `${t.id}:${d.power.slot}`, t.hostile, t);
            // Prova do Despertar: habilidades da fruta acertando inimigos
            if (t.hostile && d.power.fruit === eatenFruit()?.id) {
              const lv = domainOf(save, d.power.fruit).level;
              if (trialHit(save, d.power.fruit, lv)) {
                hud.toast(`Despertar liberado: ${FRUIT[d.power.fruit]?.despertar?.nome ?? 'Despertar'}! Use no slot 4 (V).`, 'gold');
                audio.play('base', 'wing', 1);
                refreshEquip();
                saveNow(true);
              } else if (save.awakenTrial && save.awakenTrial.hits % 5 === 0) {
                hud.toast(`Prova do Despertar: ${save.awakenTrial.hits}/${AWAKEN.trialHits}`);
                refreshEquip();
              }
            }
          }
          break;
        }
        default:
      }
    },
  });
  // habilidades da espada: mesmo sistema dos poderes, sem energia, liberadas pela proficiência
  const blade = new FruitPowers({
    ctl,
    fx,
    stats: () => ({ fruit: damageMultipliers(save.status).weapon, domain: profBonus(profOf(save, 'espada').level) }),
    onEvent: (name, d) => powers.onEvent(name, d),
  });
  combat.powers = {
    get busy() {
      return powers.busy || blade.busy || art?.busy;
    },
    wallBlocks: (a) => powers.wallBlocks(a),
  };
  const profBudget = new Map();
  function grantProf(xp, key, hostile, foe) {
    let amount = xp;
    if (hostile) {
      const k = `${foe.id}:${foe.life}`;
      const used = profBudget.get(k) || 0;
      amount = Math.max(0, Math.min(xp, 20 - used));
      profBudget.set(k, used + amount);
    } else amount *= tracker.farm.repetition(`prof:${key}`, ctl.pos, tracker.now);
    if (amount <= 0) return;
    const before = profOf(save, 'espada').level;
    if (!addProfXp(save, 'espada', amount)) return;
    const lv = profOf(save, 'espada').level;
    const w = WEAPONS[save.weapon];
    const opened = w ? w.habilidades.filter((h) => h.unlock > before && h.unlock <= lv).map((h) => h.nome) : [];
    hud.toast(`Proficiência com espadas nível ${lv}${opened.length ? ` · ${opened.join(', ')} liberada!` : ''}`, opened.length ? 'gold' : 'good');
    audio.play('base', 'wing', 0.9);
    refreshEquip();
    saveNow(true);
  }
  // maestria genérica (estilos e Vontade): teto por oponente, bonecos rendem pouco
  const masteryBudget = new Map();
  function grantMastery(type, label, xp, key, hostile, foe, unlocks = () => []) {
    let amount = xp;
    if (hostile) {
      const k = `${type}:${foe.id}:${foe.life}`;
      const used = masteryBudget.get(k) || 0;
      amount = Math.max(0, Math.min(xp, 20 - used));
      masteryBudget.set(k, used + amount);
      if (masteryBudget.size > 300) masteryBudget.delete(masteryBudget.keys().next().value);
    } else amount *= tracker.farm.repetition(`m:${type}:${key}`, ctl.pos, tracker.now);
    if (amount <= 0) return;
    const before = profOf(save, type).level;
    if (!addProfXp(save, type, amount)) return;
    const lv = profOf(save, type).level;
    const opened = unlocks(before, lv);
    hud.toast(`Maestria em ${label} nível ${lv}${opened.length ? ` · ${opened.join(', ')} liberada!` : ''}`, opened.length ? 'gold' : 'good');
    audio.play('base', 'wing', 0.9);
    refreshEquip();
    saveNow(true);
  }
  function grantStyle(id, xp, key, hostile, foe) {
    const st = STYLES[id];
    if (!st) return;
    grantMastery(`estilo:${id}`, st.nome, xp, key, hostile, foe, (b, lv) => stylePowers(st).filter((p) => p.unlock > b && p.unlock <= lv).map((p) => p.nome));
  }
  // técnicas do estilo equipado (mesmo sistema dos poderes, sem energia)
  const art = new FruitPowers({
    ctl,
    fx,
    stats: () => ({ fruit: damageMultipliers(save.status).melee * vontade.damageMult * (STYLES[save.style]?.meleeMult ?? 1), domain: profBonus(profOf(save, `estilo:${save.style}`).level) }),
    onEvent: (name, d) => powers.onEvent(name, d),
  });
  const swords = new Map();
  const swordOf = (id) => {
    if (!swords.has(id)) swords.set(id, makeSword(WEAPONS[id]));
    return swords.get(id);
  };
  applyStatus();
  for (const r of arena.recrutas) r.onBurn = (foe, n) => floats.add({ x: foe.pos.x, y: foe.pos.y + 3, z: foe.pos.z }, String(n), 'forte');
  // fruta comida: habilidades, combo próprio e domínio
  // Equipar (1 Fruta · 2 Arma · 3 Estilo): o item equipado define o combo do Atacar e a
  // lista de habilidades da direita. Comer uma fruta já equipa a fruta.
  const EQUIP_SLOTS = ['fruta', 'arma', 'estilo', 'livre'];
  if (!EQUIP_SLOTS.includes(save.equipped)) save.equipped = save.eaten ? 'fruta' : 'estilo';
  let lastEaten = save.eaten?.fruit ?? null;
  function refreshEquip() {
    const f = eatenFruit();
    if (!f && save.equipped === 'fruta') save.equipped = 'estilo';
    const level = f ? domainOf(save, f.id).level : 1;
    powers.domainLevel = level;
    const w = WEAPONS[save.weapon] ?? null;
    if (!w && save.equipped === 'arma') save.equipped = 'estilo';
    const fruitOn = save.equipped === 'fruta' && !!f;
    const swordOn = save.equipped === 'arma' && !!w;
    const prof = profOf(save, 'espada').level;
    const cdMult = raceSys.mods.swordCooldown;
    blade.setFruit(w, w ? weaponPowers(w).map((p) => ({ ...p, recarga: Math.round(p.recarga * cdMult * 10) / 10 })) : [], prof);
    const st = STYLES[save.style] ?? STYLES.basico;
    const stLv = profOf(save, `estilo:${st.id}`).level;
    art.setFruit(st, stylePowers(st), stLv);
    combat.runner.setStyle(swordOn ? weaponStyle(w) : fruitOn ? fruitStyle(f) : styleCombo(st));
    player.setWeapon(swordOn ? swordOf(w.id) : null);
    skillBar.setSlots({ fruit: f, fruitThumb: f ? thumbs()[fruitIndex(f.id)] : '', fruitColor: f ? RANK[rarityOf(save.eaten)].cor : '', styleName: st.curto, weapon: w });
    skillBar.setEquipped(save.equipped);
    skillBar.setEnergyVisible(!!f);
    const awk = f ? { state: awakenState(save, f.id, level), name: FRUIT[f.id]?.despertar?.nome ?? 'Despertar', hits: trialProgress(save, f.id), total: AWAKEN.trialHits } : null;
    // lista de habilidades do slot equipado (fruta, arma ou estilo)
    if (fruitOn) skillBar.setSkills({ title: f.name, color: f.color, powers: powers.powers, domainLevel: level, awaken: awk });
    else if (swordOn) skillBar.setSkills({ title: w.nome, color: w.cor, powers: blade.powers, domainLevel: prof, lockLabel: 'Prof.', awaken: false });
    else skillBar.setSkills({ title: st.nome, color: st.cor, powers: art.powers, domainLevel: stLv, lockLabel: 'Maest.', awaken: false });
    // botão da forma híbrida: só com fruta de fera
    $('btn-form').classList.toggle('hidden', !hasForm(f?.id));
    if (f) $('btn-form').style.setProperty('--fc', f.color);
  }
  const setupPowers = () => {
    const f = eatenFruit();
    const level = f ? domainOf(save, f.id).level : 1;
    powers.setFruit(f, f ? powersOf(f) : [], level);
    if ((f?.id ?? null) !== lastEaten) {
      lastEaten = f?.id ?? null;
      if (f) save.equipped = 'fruta';
    }
    refreshEquip();
  };
  function equip(index) {
    const order = EQUIP_SLOTS.filter((k) => k !== 'livre' && (k !== 'fruta' || eatenFruit()) && (k !== 'arma' || WEAPONS[save.weapon]));
    let name = index === 9 ? order[(order.indexOf(save.equipped) + 1) % order.length] : EQUIP_SLOTS[index];
    if (name === 'fruta' && !eatenFruit()) return hud.toast('Coma uma fruta para equipar os poderes (fale com o Mercador).');
    if (name === 'arma' && !WEAPONS[save.weapon]) return hud.toast('Sem arma: compre uma espada com o Mestre de Armas (barraca ao lado do Trocador).');
    if (name === 'livre') return;
    if (name === save.equipped) return;
    if (powers.busy || blade.busy || art.busy) return; // não troca no meio de uma técnica
    if (combat.runner.busy) {
      if (raceSys.adapt <= 0) return;
      combat.runner.cancel(); // Adaptação Tática: troca instantânea
      ctl.action = null;
    }
    save.equipped = name;
    refreshEquip();
    audio.play('base', 'step', 0.5);
  }

  // evolução pela prática: deslocamento real e eventos do controlador viram experiência
  let diminishedAt = -99;
  const tracker = new TrainingTracker(save.training, {
    onGain: (attr, xp, p) => {
      hud.xpGain(ATTRS[attr].nome, xp, p);
      if (attr === 'natacao') raceSys.onSwimXp(xp);
    },
    onLevel: (attr, level, marcos) => {
      const m = marcos.length ? ` · ${marcos[marcos.length - 1].nome}` : '';
      hud.toast(`${ATTRS[attr].nome} nível ${level}${m}`, marcos.length ? 'gold' : 'good');
      audio.play('base', 'wing', marcos.length ? 1 : 0.6);
      applyStatus();
      if (modals.includes('status')) statusScreen.render();
      saveNow(true);
    },
    onDiminished: () => {
      if (time - diminishedAt < 45) return;
      diminishedAt = time;
      hud.toast('Treino repetido rende menos: varie as atividades e os lugares.');
    },
  });

  // experiência: objetivos, recompensa de missão e áreas descobertas
  let fleetLevelHook = () => {};
  function grantXp(amount) {
    const levels = addXp(save, amount);
    if (levels > 0) {
      fleetLevelHook(save.level);
      hud.toast(`Nível de aventureiro ${save.level}! +${levels * POINTS_PER_LEVEL} pontos de status para distribuir`, 'gold');
      hud.levelUp();
      audio.play('base', 'wing', 1);
      statusScreen.render();
    }
    refreshProfile();
  }

  // posição salva ou início da ilha
  const spawn = () => {
    const h = island.field.sample(ISLAND.spawn.x, ISLAND.spawn.z);
    ctl.spawn(ISLAND.spawn.x, h + 0.5, ISLAND.spawn.z, ISLAND.spawn.yaw);
  };
  if (save.player && Number.isFinite(save.player.x) && world.inside(save.player.x, save.player.z)) {
    ctl.spawn(save.player.x, save.player.y + 0.4, save.player.z, save.player.yaw ?? 0);
    if (save.player.safe) ctl.safe.set(save.player.safe.x, save.player.safe.y, save.player.safe.z);
    ctl.health = Math.max(30, save.player.health ?? 100);
  } else spawn();

  const cam = new FollowCamera(renderer.camera, physics);
  cam.snap(ctl.pos, ctl.yaw);

  // ===== Bote do jogador (atualização 10) =====
  boat = new Boat({ scene: renderer.scene, physics, ocean, ground: (x, z) => world.sample(x, z) });
  {
    const m = save.boat ?? DOCKS.treino.mooring;
    boat.place(m.x, m.z, m.yaw);
  }

  // ===== Combate naval (atualização 16): navios corsários, canhão da proa e casco =====
  fleet = new Fleet({ scene: renderer.scene, physics, ocean, ground: (x, z) => world.sample(x, z), fx, audio, sea: ALL_SEA, onEvent: (n, d) => navalEvent(n, d) });
  fleet.setLevel(save.level, Number.isFinite(save.boatHull) ? save.boatHull : null);
  fleetLevelHook = (lv) => fleet.setLevel(lv);
  if (fleet.hull <= 0) fleet.hull = Math.round(fleet.maxHull * NAVAL.boatRespawnHull); // salvo no meio de um naufrágio
  // ===== Travessia entre os mares (atualização 17): portões, tempestade e raios =====
  const storm = new Storm(renderer.scene);
  {
    // boias altas com luz dourada marcam cada portão (uma de cada lado)
    const buoyMat = new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.7 });
    const lightMat = new THREE.MeshStandardMaterial({ color: '#ffd36b', emissive: '#ffb040', emissiveIntensity: 1.6 });
    for (const g of Object.values(GATES)) {
      for (const side of [-1, 1]) {
        const b = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 9, 8), buoyMat);
        pole.position.y = 3;
        const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), lightMat);
        lamp.position.y = 8;
        b.add(pole, lamp);
        b.position.set(g.x + side * (g.r + 2), 0, g.z);
        b.name = 'boia_' + g.id;
        renderer.scene.add(b);
      }
    }
  }
  let crossing = null; // { gate, t, dur, strikeT, marks: [] }
  let gateBlockT = 0;
  function startCrossing(gate) {
    const back = gate.id === 'sul';
    crossing = { gate, t: 0, dur: back ? CROSSING.back : CROSSING.time, strikeT: 2, marks: [] };
    storm.set(true);
    hud.notice(`${gate.nome}: tempestade! Desvie dos raios marcados na água`, 'bad', 'zone');
    audio.play('tormenta', 'acerto', 0.8);
  }
  function crossingInput(inp, camYaw) {
    // a corrente leva o bote; o analógico só desvia para os lados
    const g = crossing.gate;
    const fx = Math.sin(camYaw);
    const fz = Math.cos(camYaw);
    const sx = fx * inp.moveY - fz * inp.moveX;
    const sz = fz * inp.moveY + fx * inp.moveX;
    const dx = Math.sin(g.dir);
    const dz = Math.cos(g.dir);
    const side = sx * dz - sz * dx; // componente lateral do pedido
    return { wx: dx + dz * side * 0.6, wz: dz - dx * side * 0.6, mag: 1, fast: true };
  }
  function endCrossing() {
    const g = crossing.gate;
    crossing = null;
    storm.set(false);
    const a = ARRIVALS[g.to];
    $('travel-text').textContent = 'Saindo da tempestade…';
    openModal('travel');
    setTimeout(() => {
      boat.place(a.x, a.z, a.yaw);
      const st = boat.seat();
      ctl.ride(st.x, st.y, st.z, st.yaw);
      cam.snap(ctl.pos, ctl.yaw);
      prev.copy(ctl.pos);
      gateBlockT = 3;
      if (a.mar === 2) {
        save.seas ??= {};
        if (!save.seas.segundo) {
          save.seas.segundo = true;
          hud.toast(`Você atravessou a tempestade! Bem-vindo ao Segundo Mar (Nv. 700+) · +${CROSSING.xp} exp`, 'gold');
          hud.toast('A Barqueira do Porto das Origens agora leva você até o Cais das Correntes.', 'good');
          grantXp(CROSSING.xp);
        }
        hud.notice('Segundo Mar', 'zone', 'zone');
      } else hud.notice('Primeiro Mar', 'zone', 'zone');
      saveNow(true);
      setTimeout(() => closeModal('travel'), 600);
    }, 700);
  }
  function crossingStep(dt) {
    gateBlockT = Math.max(0, gateBlockT - dt);
    if (!crossing) {
      if (!boat.aboard || gateBlockT > 0 || fleet.sunk > 0) return;
      for (const g of Object.values(GATES)) {
        if (Math.hypot(boat.s.x - g.x, boat.s.z - g.z) > g.r) continue;
        if (g.id === 'norte' && !crossingUnlocked(save)) {
          hud.notice('Uma corrente furiosa empurra o bote de volta. Derrote a Guardiã da Fenda Celeste para atravessar.', 'bad', 'gate');
          boat.s.yaw += Math.PI;
          boat.s.speed = 4;
          gateBlockT = 2;
          return;
        }
        startCrossing(g);
        return;
      }
      return;
    }
    if (!boat.aboard || fleet.sunk > 0) {
      crossing = null;
      storm.set(false);
      return;
    }
    crossing.t += dt;
    // raios: marca amarela na água onde o bote vai estar; cai depois de 1 s
    crossing.strikeT -= dt;
    if (crossing.strikeT <= 0 && crossing.t < crossing.dur - 1.5) {
      const [a, b] = CROSSING.strikeEvery;
      crossing.strikeT = a + Math.random() * (b - a);
      const v = boat.velocity;
      const at = { x: boat.s.x + v.x * CROSSING.telegraph + (Math.random() - 0.5) * 6, z: boat.s.z + v.z * CROSSING.telegraph + (Math.random() - 0.5) * 6 };
      at.y = ocean.heightAt(at.x, at.z);
      crossing.marks.push({ ...at, t: CROSSING.telegraph });
      fx.mark(at, '#ffe45a', CROSSING.strikeRadius, CROSSING.telegraph);
    }
    for (let i = crossing.marks.length - 1; i >= 0; i--) {
      const m = crossing.marks[i];
      m.t -= dt;
      if (m.t > 0) continue;
      crossing.marks.splice(i, 1);
      fx.bolt({ x: m.x, y: m.y + 26, z: m.z }, { x: m.x, y: m.y, z: m.z }, '#fff4b0', 0.3);
      fx.burst(m, '#fff4b0', { count: 16, speed: 6, up: 5 });
      storm.flash(settings.reduceFx ? 0.25 : 1);
      audio.play('tormenta', 'acerto', 0.9);
      if (Math.hypot(boat.s.x - m.x, boat.s.z - m.z) < CROSSING.strikeRadius + 1) {
        fleet.damageHull(Math.round(fleet.maxHull * CROSSING.strikeDamage), m);
        conditions.apply('choque', { stacks: 1 });
      } else if (Math.random() < 0.5) {
        floats.add({ x: m.x, y: m.y + 2, z: m.z }, 'Desviou!', 'esquiva');
      }
    }
    if (crossing.t >= crossing.dur) endCrossing();
  }

  // ===== Clima (atualização 19): sol, chuva e tempestade por mar; raios na tempestade =====
  powers.weatherMult = (fruitId) => weatherDamage(save.weather?.state ?? 'sol', fruitId);
  let weatherTick = 0;
  let weatherStrikeT = 6;
  const weatherMarks = [];
  const WEATHER_TEXT = {
    sol: '☀ O tempo abriu',
    chuva: '🌧 Começou a chover: frutas de fogo enfraquecem (−15%)',
    tempestade: '⛈ Tempestade! Raios caem perto de você — saia dos círculos amarelos',
  };
  function weatherStep(dt) {
    weatherTick -= dt;
    if (weatherTick <= 0) {
      weatherTick = 1;
      save.weather ??= { state: 'sol', until: 0, sea: 1 };
      const prev = save.weather.state;
      if (stepWeather(save.weather, save.clock, seaOf(ctl.pos.z))) {
        hud.notice(WEATHER_TEXT[save.weather.state], save.weather.state === 'sol' ? 'zone' : 'bad', 'clima');
        // tempestade passou no mar: destroços à deriva por perto
        if (prev === 'tempestade' && boat.aboard) spawnWreck();
      }
    }
    storm.set(crossing ? 1 : WEATHER[save.weather?.state ?? 'sol'].storm);
    // raios da tempestade (marcados 1,1 s antes, como na travessia)
    if (save.weather?.state === 'tempestade' && !crossing && mode === 'game') {
      weatherStrikeT -= dt;
      if (weatherStrikeT <= 0) {
        const [a, b] = STRIKE.every;
        weatherStrikeT = a + Math.random() * (b - a);
        const v = boat.aboard ? boat.velocity : { x: 0, z: 0 };
        const p = boat.aboard ? { x: boat.s.x, z: boat.s.z } : { x: ctl.pos.x, z: ctl.pos.z };
        const at = { x: p.x + v.x * STRIKE.telegraph + (Math.random() - 0.5) * 8, z: p.z + v.z * STRIKE.telegraph + (Math.random() - 0.5) * 8 };
        at.y = Math.max(world.sample(at.x, at.z), ocean.heightAt(at.x, at.z));
        weatherMarks.push({ ...at, t: STRIKE.telegraph });
        fx.mark(at, '#ffe45a', STRIKE.radius, STRIKE.telegraph);
      }
    }
    for (let i = weatherMarks.length - 1; i >= 0; i--) {
      const m = weatherMarks[i];
      m.t -= dt;
      if (m.t > 0) continue;
      weatherMarks.splice(i, 1);
      lab.fx.lightning(new THREE.Vector3(m.x, m.y + 24, m.z), new THREE.Vector3(m.x, m.y, m.z), '#fff4b0', 0.3);
      fx.bolt({ x: m.x, y: m.y + 24, z: m.z }, { x: m.x, y: m.y + 0.2, z: m.z }, '#fff4b0', 0.25);
      storm.flash(settings.reduceFx ? 0.25 : 1);
      audio.play('tormenta', 'acerto', 0.8);
      if (boat.aboard && Math.hypot(boat.s.x - m.x, boat.s.z - m.z) < STRIKE.radius + 1) fleet.damageHull(Math.round(fleet.maxHull * STRIKE.hull), m);
      else if (!boat.aboard && Math.hypot(ctl.pos.x - m.x, ctl.pos.z - m.z) < STRIKE.radius && Math.abs(ctl.pos.y - m.y) < 4) {
        enemyHit({ id: 'raio', pos: m, yaw: 0, life: 1 }, { id: 'raio-tempestade', posture: 10, knock: 1.5, reaction: 'media', element: 'raio', effects: { choque: { stacks: 2 } } }, Math.round(ctl.maxHealth * STRIKE.damage), m);
      }
    }
  }

  // ===== Bestas marinhas (atualização 19): encontros no mar aberto =====
  const beasts = new BeastManager({ scene: renderer.scene, ocean, fx, lab, onEvent: (n, d) => beastEvent(n, d) });
  fleet.extraTargets = () => beasts.targets();
  fleet.encounter = () => beasts.active;
  const LAND = [{ x: 0, z: 0, r: ISLAND.half * 0.75 }, { x: VILLAGE.offset.x, z: VILLAGE.offset.z, r: VILLAGE.half * 0.75 }, ...ALL_SEA.map((d) => ({ x: d.x, z: d.z, r: d.R }))];
  const distToLand = (p) => Math.min(...LAND.map((l) => Math.hypot(p.x - l.x, p.z - l.z) - l.r));
  function beastEvent(name, d) {
    const b = d.beast;
    switch (name) {
      case 'warning':
        hud.notice('A água borbulha… uma silhueta enorme se aproxima!', 'bad', 'besta');
        vibrate(80);
        break;
      case 'emerge':
        hud.toast(`${b.def.nome} (Nv. ${b.level}) surgiu! Use o canhão da proa quando ela estiver fora d'água.`, 'bad');
        audio.play('impacto', 'acerto', 1);
        shake = Math.max(shake, 0.3);
        break;
      case 'phase':
        hud.notice(d.phase === 2 ? `${b.def.nome}: ondas e mergulhos!` : `${b.def.nome} em fúria! Ponto fraco exposto (+25% de dano)`, 'bad', 'besta');
        break;
      case 'hit':
        floats.add({ x: d.at.x, y: d.at.y + 2, z: d.at.z }, String(d.damage), 'forte');
        break;
      case 'dodged':
        floats.add({ x: ctl.pos.x, y: ctl.pos.y + 3, z: ctl.pos.z }, 'Desviou!', 'esquiva');
        break;
      case 'down': {
        const loot = beastLoot(b.level);
        save.coins += loot.coins;
        save.fragments = (save.fragments ?? 0) + loot.fragments;
        hud.toast(`${b.def.nome} derrotada! +${fmt(loot.xp)} exp · +${fmt(loot.coins)} moedas · +${loot.fragments} fragmentos`, 'gold');
        for (const [id, n] of loot.mats) {
          addMaterial(save, id, n);
          hud.toast(`+${n} ${MATERIALS[id].nome}`, 'good');
        }
        if (loot.item) {
          const drop = dropFor(Math.min(b.level, 20));
          if (drop) {
            addItem(save, drop);
            hud.toast(`Item da besta: ${ITEMS[drop].nome} (${ITEMS[drop].qualidade})`, 'gold');
          }
        }
        save.beasts = save.beasts ?? {};
        save.beasts[b.kind] = (save.beasts[b.kind] ?? 0) + 1;
        audio.play('base', 'death', 1);
        grantXp(loot.xp);
        saveNow(true);
        break;
      }
      case 'left':
        hud.toast(d.reason === 'sumiu' ? `${b.def.nome} mergulhou e sumiu.` : `${b.def.nome} ficou para trás e mergulhou.`);
        break;
      default:
    }
  }
  function beastStep(dt) {
    const swimming = ctl.state === 'swim' || ctl.state === 'dive';
    if (!beasts.beast) {
      const night = daylight(hourOf(save.clock)).k < 0.3;
      const sea = seaOf(ctl.pos.z);
      const here = boat.aboard ? { x: boat.s.x, z: boat.s.z } : ctl.pos;
      const ok = canSpawn({ aboard: boat.aboard, swimming, crossing: !!crossing, sunk: fleet.sunk > 0, distToLand: distToLand(here), sinceLast: beasts.since, hunterOnly: true });
      if (ok && mode === 'game' && Math.random() < ENCOUNTER.chancePerSecond * dt) {
        const shark = { id: 'tubarao', level: sea === 2 ? 900 : 600 };
        const pick = boat.aboard ? pickBeast(sea, night, Math.random, save.level) : save.level >= minPlayerLevel(shark.level) ? shark : null;
        if (pick) beasts.spawn(pick.id, pick.level, here);
        else beasts.since = 0; // ninguém do nível do jogador por aqui: tenta de novo depois
      }
      beasts.since += dt;
      return;
    }
    const b = beasts.beast;
    let target = null;
    if (boat.aboard && fleet.sunk <= 0) target = { x: boat.s.x, z: boat.s.z, vx: boat.velocity.x, vz: boat.velocity.z };
    else if (swimming && b.def.hunter) target = { x: ctl.pos.x, z: ctl.pos.z, vx: 0, vz: 0 };
    beasts.update(dt, {
      target,
      aboard: boat.aboard,
      onHull: (dmg, at) => fleet.damageHull(dmg, at),
      onPlayer: (dmg, at) => enemyHit({ id: b.id, pos: at, yaw: 0, life: 1 }, { id: 'mordida', posture: 16, knock: 2, reaction: 'media' }, Math.round(dmg), at),
      push: (dx, dz) => {
        if (!boat.aboard) return;
        boat.s.x += dx;
        boat.s.z += dz;
        boat.s.speed *= 0.4;
        shake = Math.max(shake, 0.25);
      },
    });
  }

  // ===== Destroços à deriva (evento): depois da tempestade ou ao acaso no mar aberto =====
  let wreck = null;
  let wreckChanceT = 0;
  function spawnWreck() {
    if (wreck) return;
    const a = Math.random() * Math.PI * 2;
    const d = 45 + Math.random() * 40;
    const x = boat.s.x + Math.cos(a) * d;
    const z = boat.s.z + Math.sin(a) * d;
    if (distToLand({ x, z }) < 20) return;
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.85 });
    const dark = new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 0.85 });
    const gold = new THREE.MeshStandardMaterial({ color: '#e0b040', roughness: 0.4, metalness: 0.6 });
    const add = (size, pos, m, rot = 0) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(...size), m);
      b.position.set(...pos);
      b.rotation.y = rot;
      g.add(b);
    };
    add([3.4, 0.3, 0.6], [0, 0, 0], wood, 0.3);
    add([2.6, 0.3, 0.5], [0.4, 0.05, 1], dark, -0.4);
    add([1.1, 0.8, 0.8], [-0.6, 0.45, 0.3], wood, 0.2); // baú
    add([1.15, 0.12, 0.85], [-0.6, 0.9, 0.3], gold, 0.2);
    add([0.2, 2.6, 0.2], [1.2, 1.1, -0.2], dark); // mastro quebrado
    g.position.set(x, 0, z);
    renderer.scene.add(g);
    wreck = { g, x, z, t: 300 };
    hud.notice('Destroços à deriva avistados! Encoste o bote para pegar o baú.', 'zone', 'destrocos');
  }
  function wreckStep(dt) {
    wreckChanceT -= dt;
    if (!wreck && wreckChanceT <= 0) {
      wreckChanceT = 1;
      if (boat.aboard && !crossing && distToLand(boat.s) > ENCOUNTER.openSea && Math.random() < 1 / 300) spawnWreck();
    }
    if (!wreck) return;
    wreck.t -= dt;
    wreck.g.position.y = ocean.heightAt(wreck.x, wreck.z) - 0.1;
    wreck.g.rotation.z = Math.sin(clock * 1.3) * 0.08;
    if (Math.random() < dt * 2) fx.spark({ x: wreck.x - 0.6, y: wreck.g.position.y + 1.2, z: wreck.z + 0.3 }, '#ffd36b', { count: 1, speed: 0.4, up: 1, size: 0.5, life: 0.6, gravity: 0 });
    const near = boat.aboard && Math.hypot(boat.s.x - wreck.x, boat.s.z - wreck.z) < 7;
    if (near || wreck.t <= 0) {
      if (near) {
        const lv = Math.max(1, save.level);
        const coins = Math.round(40 + 2 * Math.min(lv, 700));
        save.coins += coins;
        addMaterial(save, 'tabua', 3 + Math.floor(Math.random() * 3));
        if (Math.random() < 0.5) addMaterial(save, 'polvora', 1 + Math.floor(Math.random() * 2));
        let extra = '';
        if (Math.random() < 0.15) {
          save.keys = (save.keys ?? 0) + 1;
          extra = ' · +1 chave da roleta';
        }
        if (Math.random() < 0.3) {
          const drop = dropFor(Math.min(lv, 20));
          if (drop) {
            addItem(save, drop);
            extra += ` · ${ITEMS[drop].nome}`;
          }
        }
        hud.toast(`Baú dos destroços: +${fmt(coins)} moedas · Tábuas de Navio${extra}`, 'gold');
        audio.play('base', 'wing', 0.8);
        saveNow(true);
      }
      wreck.g.removeFromParent();
      wreck.g.traverse((o) => o.geometry?.dispose?.());
      wreck = null;
    }
  }

  function updateHullBar() {
    const show = boat.aboard;
    $('hull-bar').classList.toggle('hidden', !show);
    if (!show) return;
    const k = fleet.hull / fleet.maxHull;
    $('hull-fill').style.transform = `scaleX(${k})`;
    $('hull-fill').classList.toggle('low', k < 0.3);
    $('hull-txt').textContent = `Casco ${fmt(Math.ceil(fleet.hull))} / ${fmt(fleet.maxHull)}`;
  }
  function navalEvent(name, d) {
    switch (name) {
      case 'shipHit':
        floats.add({ x: d.at.x, y: d.at.y + 2, z: d.at.z }, String(d.damage), 'forte');
        break;
      case 'shipSunk': {
        const s = d.ship;
        const loot = shipLoot(s.level);
        save.coins += loot.coins;
        hud.toast(`${s.def.nome} afundou! +${fmt(loot.xp)} exp · +${fmt(loot.coins)} moedas`, 'gold');
        for (const [id, n] of loot.mats) {
          addMaterial(save, id, n);
          hud.toast(`+${n} ${MATERIALS[id].nome}`, 'good');
        }
        if (loot.item) {
          const drop = dropFor(s.level);
          if (drop) {
            addItem(save, drop);
            hud.toast(`Item no naufrágio: ${ITEMS[drop].nome} (${ITEMS[drop].qualidade})`, 'gold');
          }
        }
        save.ships = save.ships ?? {};
        save.ships[s.id] = (save.ships[s.id] ?? 0) + 1;
        audio.play('base', 'death', 0.8);
        grantXp(loot.xp);
        saveNow(true);
        break;
      }
      case 'hullHit':
        shake = Math.max(shake, 0.25);
        vibrate(40);
        floats.add({ x: d.at.x, y: (d.at.y ?? boat.y) + 2, z: d.at.z }, `−${d.damage}`, 'jogador');
        if (d.hull > 0 && d.hull / d.max < 0.3 && !fleet.warned) {
          fleet.warned = true;
          hud.toast('Casco quase rompendo! Fuja para a costa e conserte com um Barqueiro.', 'bad');
        }
        break;
      case 'ram':
        hud.toast('Abalroou!', 'bad');
        break;
      case 'boatSunk':
        if (boat.aboard) {
          // o jogador cai na água ao lado do bote que afunda
          boat.aboard = false;
          boat.s.speed = 0;
          ctl.leaveRide(boat.s.x + Math.cos(boat.s.yaw) * 3, boat.y + 0.2, boat.s.z - Math.sin(boat.s.yaw) * 3, boat.s.yaw);
          prev.copy(ctl.pos);
        }
        fleet.warned = false;
        hud.toast('O bote afundou! Um Barqueiro leva outro, meio consertado, até o cais da Ilha de Treino.', 'bad');
        break;
      case 'boatRestored': {
        const second = seaOf(boat.s.z) === 2 && save.seas?.segundo;
        const dock = second ? ALL_DOCKS.correntes : DOCKS.treino;
        const m = dock.mooring;
        boat.place(m.x, m.z, m.yaw);
        // nadando longe de qualquer ilha: o Barqueiro resgata e leva até o cais
        const nearLand = Math.min(...[{ x: 0, z: 0 }, VILLAGE.offset, ...ALL_SEA].map((i) => Math.hypot(ctl.pos.x - i.x, ctl.pos.z - i.z)));
        if (!boat.aboard && nearLand > 260) {
          const y = dock.ground ? world.sample(dock.x, dock.z) : VILLAGE.deck;
          ctl.spawn(dock.x, y + 0.4, dock.z, dock.yaw);
          cam.snap(ctl.pos, ctl.yaw);
          prev.copy(ctl.pos);
          hud.toast('Um Barqueiro resgatou você do mar.', 'good');
        }
        fleet.hull = Math.round(fleet.maxHull * NAVAL.boatRespawnHull);
        saveNow(true);
        break;
      }
      case 'playerBlast':
        enemyHit({ id: d.ship?.id ?? 'canhao', pos: d.at, yaw: 0, life: 1 }, { id: 'canhao', posture: 12, knock: 3, reaction: 'media' }, d.damage, d.at);
        break;
      default:
    }
  }
  const CROSS_XP = 60;
  let boardedFrom = null; // ilha onde embarcou (a primeira travessia até a outra dá experiência)
  const islandAt = (p) => (village.field.inside(p.x, p.z) ? 'porto' : island.field.inside(p.x, p.z) ? 'treino' : null);
  function board() {
    if (boat.aboard) return;
    if (fleet.sunk > 0) return;
    boardedFrom = islandAt(ctl.pos) ?? boardedFrom;
    boat.aboard = true;
    const st = boat.seat();
    ctl.ride(st.x, st.y, st.z, st.yaw);
    cam.snap(ctl.pos, ctl.yaw);
    prev.copy(ctl.pos);
    audio.play('base', 'land', 0.5);
    if (!save.visited.includes('dica:bote')) {
      save.visited.push('dica:bote');
      hud.toast('No bote: o analógico aponta o rumo · Correr acelera · Pular ou Desembarcar desce');
    }
    if (!save.visited.includes('dica:canhao')) {
      save.visited.push('dica:canhao');
      hud.toast('Canhão da proa: Atacar atira para onde a câmera aponta (mira sozinho no navio mais perto do centro). Cuidado com os corsários!', 'gold');
    }
  }
  function disembark() {
    if (!boat.aboard) return;
    const spot = boat.landing();
    if (!spot.land && ctl.waterCursed) {
      hud.toast('Sem chão por perto: usuário de fruta afunda. Encoste no cais ou na praia.', 'bad');
      return;
    }
    boat.aboard = false;
    boat.s.speed = 0;
    ctl.leaveRide(spot.x, spot.y + 0.05, spot.z, boat.s.yaw);
    prev.copy(ctl.pos);
    const dest = spot.land ? islandAt(spot) : null;
    if (dest && boardedFrom && dest !== boardedFrom && !save.visited.includes(`travessia:${dest}`)) {
      save.visited.push(`travessia:${dest}`);
      hud.toast(`Primeira travessia de bote até ${dest === 'porto' ? 'o' : 'a'} ${DOCKS[dest].island} · +${CROSS_XP} exp`, 'gold');
      grantXp(CROSS_XP);
    }
    if (dest) boardedFrom = dest;
    saveNow(true);
  }

  await setLoading('Pintando o mapa…', 86);
  const minimap = new Minimap($('minimap-canvas'), island.field, island.signs);
  minimap.addIsland(village.localField, VILLAGE.offset, village.village);
  for (const s of sea) minimap.addIsland(s.localField, { x: s.def.x, z: s.def.z });
  const mapScreen = new MapScreen({
    canvas: $('map-canvas'), signs: island.signs, zoomIn: $('map-in'), zoomOut: $('map-out'), title: $('worldmap').querySelector('.frame-title'), seaButton: $('map-sea'),
    islands: [
      { name: ISLAND.name, field: island.field, origin: { x: 0, z: 0 }, faixa: 'Nv. 1–10', mar: 1 },
      { name: VILLAGE.name, field: village.localField, origin: VILLAGE.offset, plan: village.village, faixa: 'Nv. 1–25', mar: 1 },
      ...sea.map((s) => ({ name: s.def.nome, field: s.localField, origin: { x: s.def.x, z: s.def.z }, faixa: `Nv. ${s.def.faixa[0]}–${s.def.faixa[1]}`, mar: s.def.mar ?? 1 })),
    ],
  });
  const thumb = renderIslandImage(island.field, 256, 'parchment').toDataURL('image/png');
  hud.setPortrait(renderPortrait(renderer.renderer, DATA));
  const armory = new Armory({
    save,
    onGear: () => {
      applyGear();
      refreshProfile();
      saveNow(true);
    },
    toast: (text, kind) => hud.toast(text, kind),
    onBuy: (id) => {
      save.weapon = id;
      save.equipped = 'arma';
      refreshEquip();
      refreshProfile();
      audio.play('base', 'wing', 1);
      saveNow(true);
    },
    onEquip: (id) => {
      save.weapon = id;
      save.equipped = 'arma';
      refreshEquip();
      saveNow(true);
    },
  });
  const dojo = new Dojo({
    save,
    toast: (text, kind) => hud.toast(text, kind),
    onStyle: (id, bought) => {
      save.style = id;
      save.equipped = 'estilo';
      refreshEquip();
      refreshProfile();
      if (bought) audio.play('base', 'wing', 1);
      saveNow(true);
    },
    onLearn: () => {
      refreshProfile();
      audio.play('base', 'wing', 1);
      saveNow(true);
    },
  });
  const statusScreen = new StatusScreen({
    save,
    profHtml: () => forgeUi.profHtml(),
    outfitHtml: () => outfitHtml(),
    raceActions: {
      // especialização racial: escolher é grátis; trocar custa moedas
      choose: (id) => {
        if (!SPECS[save.race]?.[id] || (save.raceMastery?.level ?? 1) < SPEC_LEVEL) return;
        if (save.raceSpec) {
          if (save.coins < SPEC_CHANGE_COST) return hud.toast(`Trocar de especialização custa ${fmt(SPEC_CHANGE_COST)} moedas.`, 'bad');
          save.coins -= SPEC_CHANGE_COST;
        }
        save.raceSpec = id;
        hud.toast(`Especialização: ${SPECS[save.race][id].nome}`, 'gold');
        applyStatus();
        refreshProfile();
        saveNow(true);
      },
      trial: () => raceSys.startTrial(),
    },
    onChange: () => {
      applyGear();
      refreshProfile();
      saveNow(true);
    },
  });
  statusScreen.setFigure(renderPortrait(renderer.renderer, DATA, 256, { full: true, race: save.race }));
  let thumbList = null;
  const thumbs = () => (thumbList ??= fruitThumbs(renderer.renderer, DATA.fruits));
  thumbs();
  ensureBag(save);
  const fruitIndex = (id) => DATA.fruits.findIndex((f) => f.id === id);
  const fruitLabel = (it) => (it ? `${fruitName(it.fruit)} (${RANK[rarityOf(it)].nome})` : '');
  const fruitProblems = validateFruits();
  if (fruitProblems.length) console.warn('Dados de frutas com problemas:', fruitProblems);
  const applyHeld = () => {
    const it = save.held !== null ? findItem(save, save.held) : null;
    player.setHeldFruit(it ? fruitIndex(it.fruit) : null);
  };
  const applyFruit = () => {
    if (form && form.id !== eatenFruit()?.id) toggleForm(true); // trocou de fruta: volta à forma humana
    ctl.waterCursed = isWaterCursed(save.eaten);
    hud.setFruit(save.eaten ? { thumb: thumbs()[fruitIndex(save.eaten.fruit)], color: RANK[rarityOf(save.eaten)].cor, label: fruitLabel(save.eaten) } : null);
    if (ctl.waterCursed && (ctl.state === 'swim' || ctl.state === 'dive')) ctl.enterWater(0);
    setupPowers?.();
  };
  const reducedFx = () => !!settings.reduceFx;
  const catalog = new CatalogScreen({ save, thumbs, openModal: (id) => openModal(id), reducedFx });
  const shop = new FruitShop({
    save,
    thumbs,
    reducedFx,
    onDetail: (fruitId) => catalog.openDetail(fruitId),
    audio,
    toast: (text, kind) => hud.toast(text, kind),
    openModal: (id) => openModal(id),
    closeModal: (id) => closeModal(id),
    onChange: () => {
      refreshProfile();
      saveNow(true);
    },
    onHold: () => applyHeld(),
    onEat: (item) => startEating(item),
  });
  const villageUi = new VillageUi({
    save,
    villagers,
    seed: VILLAGE.seed,
    getClock: () => save.clock,
    thumbOf: (id) => thumbs()[fruitIndex(id)],
    openModal: (id) => openModal(id),
    closeModal: (id) => closeModal(id),
    toast: (text, kind) => hud.toast(text, kind),
    onQuestDone: (q) => {
      save.coins += q.coins;
      grantXp(q.xp);
      hud.toast(`Missão concluída: ${q.titulo} · +${fmt(q.coins)} moedas · +${fmt(q.xp)} exp`, 'gold');
      audio.play('base', 'wing', 0.8);
      refreshProfile();
      saveNow(true);
    },
    onQuestChange: () => refreshMission(),
    onStatus: () => {
      applyStatus();
      statusScreen.render();
      refreshProfile();
      saveNow(true);
    },
    onBag: () => {
      refreshProfile();
      saveNow(true);
    },
    heal: () => {
      ctl.health = ctl.maxHealth;
      ctl.stamina.value = ctl.stamina.max;
    },
  });
  const forgeUi = new ForgeUi({
    save,
    toast: (text, kind) => hud.toast(text, kind),
    onChange: () => {
      applyGear();
      refreshEquip();
      refreshProfile();
      saveNow(true);
    },
  });
  // Comprador de Itens (banca na Ilha de Treino e na Mercadora do Porto)
  const sellItemsUi = new SellItemsUi({
    save,
    onSold: (text, coins, bad) => {
      hud.toast(text, bad ? 'bad' : 'gold');
      if (coins > 0) {
        audio.play('base', 'wing', 0.5);
        refreshProfile();
        saveNow(true);
      }
    },
  });
  const buyTool = (id) => {
    const t = TOOLS[id];
    if (save.tools.includes(id)) return;
    if (save.coins < t.preco) return hud.toast(`${t.nome} custa ${fmt(t.preco)} moedas.`, 'bad');
    save.coins -= t.preco;
    save.tools.push(id);
    hud.toast(`${t.nome} comprada! ${t.desc}`, 'gold');
    refreshProfile();
    saveNow(true);
    closeModal('npc-dialog');
  };
  villageUi.serviceActions = (m) => {
    const out = [];
    if (m.papel === 'ferreiro') {
      out.push({ label: 'Forja', icon: 'sword', run: () => villageUi.swap('forge') });
      if (!save.tools.includes('picareta')) out.push({ label: `Picareta · ${fmt(TOOLS.picareta.preco)}`, icon: 'coin', run: () => buyTool('picareta') });
    }
    if (m.papel === 'mercado') {
      out.push({ label: 'Vender materiais', icon: 'coin', run: () => villageUi.swap('sellmats') });
      out.push({ label: 'Vender itens', icon: 'coin', run: () => villageUi.swap('sellitems') });
      if (!save.tools.includes('vara')) out.push({ label: `Vara de pesca · ${fmt(TOOLS.vara.preco)}`, icon: 'coin', run: () => buyTool('vara') });
    }
    return out;
  };
  const gathering = new Gathering({
    save, ctl, player, world: gatherWorld, ocean, fx, scene: renderer.scene,
    onEvent: (name, d) => {
      if (name === 'denied' || name === 'info') hud.toast(d.message, name === 'denied' ? 'bad' : '');
      if (name === 'bite') {
        hud.notice('🎣 Fisgou! Puxe agora!', 'good', 'bite');
        audio.play('base', 'splash', 0.5);
      }
      if (name === 'hitRock') audio.play('impacto', 'acerto', 0.35);
      if (name === 'mined') {
        const parts = Object.entries(d.got).map(([id, n]) => `+${n} ${MATERIALS[id].nome}`);
        hud.toast(`${parts.join(' · ')} · Mineração +${d.xp}`, 'good');
        if (d.levels) hud.toast(`Mineração Nv. ${d.level}!`, 'gold');
        const ores = Object.entries(d.got).filter(([id]) => id !== 'pedra').reduce((sum, [, n]) => sum + n, 0) || 1;
        villageUi.gather('minerio', ores);
        saveNow(true);
      }
      if (name === 'caught') {
        hud.toast(`Pescou: ${d.nome} · Pesca +${d.xp}`, 'good');
        if (d.levels) hud.toast(`Pesca Nv. ${d.level}!`, 'gold');
        if (d.peixe) villageUi.gather('peixe', 1);
        saveNow(true);
      }
    },
  });
  function startEating(item) {
    if (ctl.state !== 'ground' || animator.eat) {
      hud.toast('Para comer, fique com os pés no chão.');
      return;
    }
    save.held = item.uid;
    applyHeld();
    ctl.busyT = 3.2;
    ctl.vel.set(0, 0, 0);
    animator.startEat({
      fruit: player.heldFruit,
      onDone: () => {
        const r = eat(save, item.uid);
        player.setHeldFruit(null);
        applyFruit();
        refreshProfile();
        if (r) {
          const cursed = isWaterCursed(r.eaten);
          hud.toast(`Você comeu a fruta ${fruitLabel(r.eaten)}!`, RANK[rarityOf(r.eaten)].ordem >= 4 ? 'gold' : 'good');
          if (cursed) setTimeout(() => hud.toast('Cuidado: agora a água funda faz você afundar.', 'bad'), 1200);
          audio.play('base', 'wing', 0.9);
        }
        saveNow(true);
      },
    });
  }
  applyHeld();
  applyFruit();

  const refreshProfile = () => {
    hud.setProfile({ ...save, xpRatio: xpProgress(save), xpNeed: xpToNext(save.level), fruitLabel: fruitLabel(save.eaten), fruitColor: save.eaten ? RANK[rarityOf(save.eaten)].cor : '' });
    if (modals.includes('roulette')) shop.renderRoulette();
    if (modals.includes('bag')) shop.renderBag();
    if (modals.includes('trader')) shop.renderTrader();
    if (modals.includes('catalog')) catalog.render();
  };
  function refreshMission() {
    const st = save.missions.treino;
    const next = mission.next();
    const vq = villageUi.tracked();
    if (vq) {
      hud.setTracker({ visible: true, title: vq.title, step: vq.step, reward: `${ICONS.coin} ${vq.reward}`, done: false });
      hud.setQuestBadge(mission.complete && !st.claimed);
      renderMissionList();
      return;
    }
    hud.setTracker({
      visible: st.tracked && !st.claimed,
      title: `${TRAINING.title} (${mission.count}/${mission.total})`,
      step: mission.complete ? 'Concluída! Receba a recompensa em Missões.' : `Próximo: ${next.text}`,
      reward: `${ICONS.coin} ${fmt(TRAINING.reward.coins)} moedas · ${fmt(TRAINING.reward.xp)} exp`,
      done: mission.complete,
    });
    hud.setQuestBadge(mission.complete && !st.claimed);
    renderMissionList();
  }

  // ===== Configurações =====
  let fpsCapHook = () => {};
  let zoomSaveT = 0;
  const applySetting = (key, value) => {
    if (key === 'quality') {
      quality.apply(value);
      ocean.setDetail(renderer.quality.oceanDetail);
    }
    if (key === 'quality' || key === 'qualityChanged') {
      // capim e flores só fora do perfil Leve
      for (const name of ['capim', 'flor']) {
        const mesh = island.nature.group.getObjectByName(name);
        if (mesh) mesh.visible = renderer.qualityId !== 'leve';
      }
    }
    if (key === 'sensitivity') cam.sensitivity = value;
    if (key === 'invertY') cam.invertY = value;
    if (key === 'reduceMotion') cam.reduceMotion = value;
    if (key === 'showStats') hud.setStatsVisible(value);
    if (key === 'volume') audio.setVolume(value);
    if (key === 'layout') document.body.classList.toggle('lefty', value === 'canhoto');
    if (key === 'buttonScale') document.documentElement.style.setProperty('--btn', value);
    if (key === 'reduceFx') document.body.classList.toggle('reduce-fx', !!value);
    // atualização 15: gráficos e acessibilidade
    if (key === 'fpsCap') {
      quality.setTarget(value);
      fpsCapHook(value); // o laço é criado depois; até lá só guarda
    }
    if (key === 'resolution') quality.setFixedScale(value === 'auto' ? null : Number(value));
    if (key === 'textScale') document.documentElement.style.setProperty('--text', value);
    if (key === 'colorblind') {
      for (const c of ['protan', 'deutan', 'tritan']) document.body.classList.toggle('cb-' + c, value === c);
    }
    if (key === 'damageNumbers') floats.numbers = !!value;
    if (key === 'camZoom' && typeof cam !== 'undefined') cam.zoom = Number(value) || 1;
    if (key === 'gliderOn') {
      ctl.unlocks.glide = !!value && save.unlocks.glide !== false;
      if (!value && ctl.state === 'glide') ctl.setState('air');
      $('btn-glider').classList.toggle('on', !!value);
    }
  };
  for (const [k, v] of Object.entries(settings)) applySetting(k, v);

  // ===== Entrada =====
  const input = new Input({
    canvas: $('game'),
    touchRoot: $('touch'),
    stick: { base: $('stick'), knob: $('stick').firstElementChild },
    buttons: { form: $('btn-form'), jump: $('btn-jump'), dash: $('btn-dash'), crouch: $('btn-crouch'), sprint: $('btn-sprint'), menu: $('btn-menu'), glider: $('btn-glider'), attack: $('btn-attack'), block: $('btn-block'), race: $('btn-race'), armor: $('btn-armor'), sense: $('btn-sense'), equip: [$('eq-1'), $('eq-2'), $('eq-3'), $('eq-4')], skillRows: $('skill-rows') },
  });
  input.onToggleGlider = () => {
    settings.gliderOn = !settings.gliderOn;
    applySetting('gliderOn', settings.gliderOn);
    menu.sync();
    saves.saveSettings(settings);
    hud.toast(settings.gliderOn ? 'Asa-delta ligada: segure Pular caindo para planar' : 'Asa-delta desligada');
  };
  input.onSprintChange = (on) => hud.setSprint(on);
  input.onToggleDebug = () => {
    settings.showStats = !settings.showStats;
    applySetting('showStats', settings.showStats);
    menu.sync();
    saves.saveSettings(settings);
  };
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') document.body.classList.add('touch');
  }, { passive: true });

  // ===== Salvamento =====
  let playTime = save.playTime || 0;
  async function saveNow(quiet = false) {
    save.player = ctl.snapshot();
    if (boat) save.boat = boat.snapshot();
    if (fleet) save.boatHull = Math.round(fleet.hull);
    save.playTime = Math.round(playTime);
    const ok = await saves.saveGame(save);
    if (!quiet) hud.toast(ok ? 'Jogo salvo' : 'Não foi possível salvar', ok ? 'good' : 'bad');
    menu.setInfo(ok ? `Salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Falha ao salvar');
    return ok;
  }

  // ===== Modo (menu inicial ou jogo) e janelas =====
  let mode = 'title';
  const modals = [];
  const setGameActive = () => {
    const active = mode === 'game' && modals.length === 0;
    loop.paused = mode === 'game' && !active;
    input.enabled = active;
    if (!active) input.releaseAll();
  };
  function openModal(id, opts = {}) {
    if (modals.includes(id)) return;
    modals.push(id);
    if (id === 'pause') menu.setOpen(true, opts);
    else if (id === 'travel') $(id).classList.add('on');
    else $(id).classList.remove('hidden');
    if (id === 'worldmap') {
      mapScreen.markers = boat.aboard ? [] : [{ x: boat.s.x, z: boat.s.z, label: 'Seu bote' }];
      for (const g of Object.values(GATES)) mapScreen.markers.push({ x: g.x, z: g.z, label: g.nome, color: '#ffb040', chart: true });
      mapScreen.open({ x: ctl.pos.x, z: ctl.pos.z, yaw: ctl.yaw });
    }
    if (id === 'missions') renderMissionList();
    if (id === 'status') statusScreen.render();
    if (id === 'roulette') shop.renderRoulette();
    if (id === 'bag') shop.renderBag();
    if (id === 'trader') shop.renderTrader();
    if (id === 'forge') forgeUi.render();
    if (id === 'sellmats') forgeUi.renderSell();
    if (id === 'sellitems') {
      sellItemsUi.confirm = null;
      sellItemsUi.render();
    }
    if (id === 'armory') armory.render();
    if (id === 'dojo') dojo.render();
    if (id === 'catalog') catalog.render();
    if (id === 'pause' && mode === 'game') saveNow(true);
    setGameActive();
  }
  function closeModal(id = modals[modals.length - 1]) {
    if (!id) return;
    if (id === 'travel' && traveling) return; // a travessia termina sozinha
    if (id === 'race-select' && !save.race) return; // a escolha da raça é obrigatória
    const i = modals.indexOf(id);
    if (i >= 0) modals.splice(i, 1);
    if (id === 'pause') menu.setOpen(false);
    else if (id === 'travel') $(id).classList.remove('on');
    else $(id).classList.add('hidden');
    shop.onModalClosed(id);
    if (id === 'fruit-detail') catalog.stopViewer();
    setGameActive();
  }
  for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => closeModal(b.dataset.close));

  const menu = new PauseMenu({
    settings,
    onChange: (key, value) => {
      applySetting(key, value);
      saves.saveSettings(settings);
    },
    onResume: () => closeModal('pause'),
    onSave: () => saveNow(false),
    onRestart: () => {
      spawn();
      cam.snap(ctl.pos, ctl.yaw);
      closeModal('pause');
    },
    onTitle: () => {
      saveNow(true);
      closeModal('pause');
      enterTitle();
    },
  });
  input.onPause = () => {
    if (modals.length) closeModal();
    else if (mode === 'game') openModal('pause');
  };
  $('btn-missions').addEventListener('click', () => openModal('missions'));
  $('btn-quest').addEventListener('click', () => openModal('missions'));
  $('eq-bag').addEventListener('click', () => openModal('bag'));
  // voltar ao início da ilha (fora de combate)
  $('btn-home').addEventListener('click', () => {
    if (mode !== 'game' || modals.length) return;
    if (ctl.lastDamage < 4 || ctl.faint > 0) return hud.toast('Saia do combate para voltar ao início.');
    spawn();
    cam.snap(ctl.pos, ctl.yaw);
    hud.toast('De volta ao início da Ilha de Treino.');
  });
  $('btn-status').addEventListener('click', () => openModal('status'));
  $('btn-bag').addEventListener('click', () => openModal('bag'));
  // ===== Viagem rápida com o Barqueiro (o bote navega de verdade; isto é o atalho) =====
  let traveling = false;
  function travel(to) {
    const d = ALL_DOCKS[to];
    if (!d || traveling) return;
    traveling = true;
    const art = to === 'porto' || to === 'correntes' ? 'o' : 'a';
    $('travel-text').textContent = `Atravessando para ${art} ${d.island}…`;
    openModal('travel');
    audio.play('base', 'wing', 0.4);
    setTimeout(() => {
      const y = d.ground ? world.sample(d.x, d.z) : VILLAGE.deck;
      ctl.spawn(d.x, y + 0.4, d.z, d.yaw);
      ctl.safe.set(d.x, y + 0.1, d.z);
      cam.snap(ctl.pos, ctl.yaw);
      prev.copy(ctl.pos);
      conditions?.reset();
      saveNow(true);
      setTimeout(() => {
        traveling = false;
        closeModal('travel');
      }, 700);
    }, 900);
  }
  // nome da ilha ao chegar (aviso pequeno no topo quando o jogador passa para outra ilha)
  let zoneName = null;
  function updateZone() {
    const seaIsland = sea.find((s) => s.field.inside(ctl.pos.x, ctl.pos.z));
    const name = seaIsland ? `${seaIsland.def.nome} (Nv. ${seaIsland.def.faixa[0]}–${seaIsland.def.faixa[1]})` : village.field.inside(ctl.pos.x, ctl.pos.z) ? VILLAGE.name : island.field.inside(ctl.pos.x, ctl.pos.z) ? ISLAND.name : null;
    if (name && name !== zoneName) {
      const first = zoneName === null;
      zoneName = name;
      hud.notice(`${first ? 'Você está em' : 'Você chegou a'} ${name}`, 'zone', 'zone');
    }
  }

  // Barqueiro: viagem rápida ou trazer o bote do jogador para este cais
  let boatmanNpc = null;
  function openBoatman(npc) {
    boatmanNpc = npc;
    const here = npc.here ?? (npc.to === 'porto' ? 'treino' : 'porto');
    boatmanNpc.dock = here;
    const m = ALL_DOCKS[here].mooring;
    const moored = Math.hypot(boat.s.x - m.x, boat.s.z - m.z) < 14;
    $('boatman-title').lastChild.textContent = npc.name;
    $('boatman-text').textContent = `Levo você ${npc.to === 'porto' ? 'ao' : 'à'} ${ALL_DOCKS[npc.to].island} num instante, ou trago o seu bote até este cais para você navegar.`;
    $('btn-ferry').lastChild.textContent = `Viagem rápida: ${ALL_DOCKS[npc.to].island}`;
    // a Barqueira do Porto leva ao Segundo Mar depois da primeira travessia pela tempestade
    const second = here === 'porto' && save.seas?.segundo;
    $('btn-ferry2').classList.toggle('hidden', !second);
    refreshRepair();
    $('btn-callboat').disabled = moored;
    $('btn-callboat').lastChild.textContent = moored ? 'Seu bote já está aqui' : 'Trazer meu bote';
    openModal('boatman');
  }
  $('btn-ferry').addEventListener('click', () => {
    closeModal('boatman');
    if (boatmanNpc) travel(boatmanNpc.to);
  });
  $('btn-ferry2').addEventListener('click', () => {
    closeModal('boatman');
    travel('correntes');
  });
  // conserto do casco (atualização 16): moedas por ponto que falta
  function refreshRepair() {
    const cost = repairCost(fleet.hull, fleet.maxHull);
    const b = $('btn-repair');
    b.disabled = cost <= 0 || fleet.sunk > 0;
    b.lastChild.textContent = cost <= 0 ? `Casco inteiro (${fmt(fleet.maxHull)})` : `Consertar o bote: ${fmt(cost)} moedas (casco ${fmt(Math.ceil(fleet.hull))}/${fmt(fleet.maxHull)})`;
  }
  $('btn-repair').addEventListener('click', () => {
    const cost = repairCost(fleet.hull, fleet.maxHull);
    if (cost <= 0) return;
    if (save.coins < cost) {
      hud.toast(`Faltam ${fmt(cost - save.coins)} moedas para consertar o casco.`, 'bad');
      return;
    }
    save.coins -= cost;
    fleet.repair();
    fleet.warned = false;
    refreshProfile();
    refreshRepair();
    hud.toast('Casco consertado!', 'good');
    saveNow(true);
  });
  $('btn-callboat').addEventListener('click', () => {
    if (!boatmanNpc) return;
    const m = ALL_DOCKS[boatmanNpc.dock].mooring;
    boat.place(m.x, m.z, m.yaw);
    closeModal('boatman');
    hud.toast('Seu bote está amarrado ao lado do cais.', 'good');
    saveNow(true);
  });

  // ação perto do jogador: falar com NPC, embarcar no bote ou desembarcar
  let nearAction = null;
  const talk = () => {
    if (!nearAction || modals.length || mode !== 'game') return;
    if (nearAction.kind === 'board') return board();
    if (nearAction.kind === 'leave') return disembark();
    if (nearAction.kind === 'villager') return villageUi.talk(nearAction.m);
    if (nearAction.kind === 'mine') return gathering.startMine(nearAction.node);
    if (nearAction.kind === 'fish') return gathering.startFish(nearAction.spot);
    if (nearAction.kind === 'pull') return gathering.pull();
    const npc = nearAction.npc;
    if (npc.role === 'barqueiro') {
      for (const n of villageUi.questTalk(npc.id, false)) hud.toast(n, 'good');
      return openBoatman(npc);
    }
    openModal({ mercador: 'roulette', trocador: 'trader', armeiro: 'armory', mestre: 'dojo', comprador: 'sellitems' }[npc.id] || 'trader');
  };
  $('btn-interact').addEventListener('click', talk);
  $('btn-map').addEventListener('click', () => openModal('worldmap'));
  $('btn-untrack').addEventListener('click', () => {
    if (villageUi.tracked()) save.quests.tracked = null;
    else save.missions.treino.tracked = false;
    refreshMission();
  });
  window.addEventListener('keydown', (e) => {
    if (mode !== 'game' || e.repeat) return;
    if (e.code === 'KeyM') modals.includes('worldmap') ? closeModal('worldmap') : !modals.length && openModal('worldmap');
    if (e.code === 'KeyL') modals.includes('missions') ? closeModal('missions') : !modals.length && openModal('missions');
    if (e.code === 'KeyP') modals.includes('status') ? closeModal('status') : !modals.length && openModal('status');
    if (e.code === 'KeyB') modals.includes('bag') ? closeModal('bag') : !modals.length && openModal('bag');
    if (e.code === 'KeyE') talk();
  });

  // janela de missões
  let missionTab = 'principais';
  for (const b of document.querySelectorAll('[data-mtab]')) {
    b.addEventListener('click', () => {
      missionTab = b.dataset.mtab;
      for (const o of document.querySelectorAll('[data-mtab]')) o.classList.toggle('active', o === b);
      renderMissionList();
    });
  }
  function renderMissionList() {
    const list = $('mission-list');
    if (missionTab === 'secundarias') {
      list.innerHTML = villageUi.activeHtml();
      villageUi.bindActive(list);
      return;
    }
    if (missionTab !== 'principais') {
      list.innerHTML = '<div class="empty">Nenhuma missão aqui ainda. Novas missões chegam com as próximas ilhas.</div>';
      return;
    }
    const st = save.missions.treino;
    const items = TRAINING.objectives.map((o) => `<li class="${mission.has(o.id) ? 'done' : ''}"><span class="box">${mission.has(o.id) ? ICONS.check : ''}</span>${o.text}</li>`).join('');
    const action = st.claimed
      ? `<button class="btn" disabled>${ICONS.check} Recompensa recebida</button>`
      : mission.complete
        ? `<button class="btn green" id="btn-claim">${ICONS.coin} Receber</button>`
        : `<button class="btn gold" id="btn-track">${ICONS.flag} ${st.tracked ? 'Rastreando' : 'Rastrear'}</button>`;
    list.innerHTML = `
      <div class="mission">
        <div>
          <h3>${ICONS.flag} ${TRAINING.title}</h3>
          <p class="sub">${TRAINING.sub}</p>
          <h4>Objetivos (${mission.count}/${mission.total})</h4>
          <ul class="objectives">${items}</ul>
        </div>
        <div class="side">
          <img class="thumb" src="${thumb}" alt="Ilha de Treino" />
          <h4>Recompensas</h4>
          <div class="rewards"><span>${ICONS.coin} ${fmt(TRAINING.reward.coins)} moedas</span><span>${fmt(TRAINING.reward.xp)} exp</span></div>
          ${action}
        </div>
      </div>`;
    $('btn-track')?.addEventListener('click', () => {
      st.tracked = !st.tracked;
      refreshMission();
    });
    $('btn-claim')?.addEventListener('click', () => {
      const reward = mission.claim();
      if (!reward) return;
      save.coins += reward.coins;
      grantXp(reward.xp || 0);
      refreshProfile();
      refreshMission();
      hud.toast(`+${fmt(reward.coins)} moedas · +${fmt(reward.xp || 0)} exp`, 'good');
      audio.play('base', 'wing', 1);
      saveNow(true);
    });
  }

  // ===== Áreas descobertas (perto de cada placa pela primeira vez) =====
  let discoverTimer = 0;
  const AREA_XP = 25;
  function discoverAreas() {
    for (const sign of island.signs) {
      if (sign.mine || sign.fish || save.visited.includes(sign.title)) continue;
      if (Math.abs(ctl.pos.y - sign.y) > 7 || Math.hypot(sign.x - ctl.pos.x, sign.z - ctl.pos.z) > 7.5) continue;
      save.visited.push(sign.title);
      raceSys.onDiscover();
      hud.notice(`📍 ${sign.title} · descoberta +${AREA_XP} exp`, 'good', sign.title);
      grantXp(AREA_XP);
    }
  }

  // ===== Laço =====
  const prev = new THREE.Vector3().copy(ctl.pos);
  if (save.boat?.aboard) board(); // salvou navegando: volta para o bote
  const view = new THREE.Vector3();
  let time = 0;
  let clock = 0;
  let autosave = 0;
  let minimapTimer = 0;
  const fogDay = { color: renderer.scene.fog.color.clone() };
  let dayTimer = 0;
  let lavaT = 0;
  let bossShown = null;
  let auraT = 0;
  const fogWater = new THREE.Color('#1d5866');
  const titleIdle = { moveX: 0, moveY: 0, camYaw: 0, jump: false, crouch: false, jumpPressed: false, crouchPressed: false, dashPressed: false, sprint: false };

  // câmera do menu inicial: personagem à direita, a ilha ao fundo
  function titleCamera(t) {
    const yaw = ctl.yaw;
    const f = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const r = { x: -f.z, z: f.x }; // direita de quem olha na direção f
    const side = 3.1 + Math.sin(t * 0.22) * 0.35; // câmera à esquerda: personagem à direita da tela
    const back = 6.8;
    const cam3 = renderer.camera;
    cam3.position.set(view.x - f.x * back - r.x * side, view.y + 3.4, view.z - f.z * back - r.z * side);
    cam3.lookAt(cam3.position.x + f.x * 10, view.y + 2.7, cam3.position.z + f.z * 10);
  }

  // vibração curta (ajuste "Vibração"; no Android precisa da permissão VIBRATE)
  function vibrate(ms) {
    if (!settings.vibration) return;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* sem vibração neste aparelho */
    }
  }
  const loop = new Loop({
    update(dt) {
      if (mode !== 'game') return;
      prev.copy(ctl.pos);
      const inp = input.consume(cam.yaw);
      if (gathering.busy) {
        // minerando ou pescando: mexer o analógico, pular ou esquivar cancela; sem luta
        gathering.update(dt, Math.hypot(inp.moveX, inp.moveY) > 0.3 || inp.jumpPressed || inp.dashPressed);
        inp.attackPressed = false;
        inp.skill = -1;
        inp.jumpPressed = inp.dashPressed = false;
      }
      gatherWorld.update(dt, ocean);
      if (boat.aboard) {
        // no bote: sem luta, habilidades nem esquiva; Pular desce; Atacar atira com o canhão
        if (inp.attackPressed) fleet.playerFire(boat, inp.camYaw);
        inp.attackPressed = false;
        inp.skill = -1;
        inp.racePressed = false;
        inp.dashPressed = false;
        inp.block = false;
      }
      combat.update(dt, inp, arena.targets);
      if (inp.equip >= 0) equip(inp.equip);
      if (inp.racePressed) raceSys.activate({ targets: arena.targets, powers, fx });
      if (inp.formPressed) toggleForm();
      // vida por segundo: Fênix híbrida e Maré Viva (na água)
      {
        const regen = formMods(form?.id).regen + ((ctl.state === 'swim' || ctl.state === 'dive') ? raceSys.mods.waterRegen : 0);
        if (regen > 0 && ctl.faint <= 0 && ctl.health < ctl.maxHealth) ctl.health = Math.min(ctl.maxHealth, ctl.health + regen * dt);
      }
      raceSys.update(dt);
      ctl.stamina.regenMult = baseRegen * (ctl.lastDamage > 5 ? raceSys.mods.staminaRegenCalm : 1) * (raceSys.adapt > 0 ? 1.5 : 1);
      const canCast = combat.canFight() && !combat.runner.busy && !ctl.guarding;
      if (inp.skill >= 0) {
        if (save.equipped === 'fruta') {
          if (inp.skill === 3) {
            const f = eatenFruit();
            const lv = f ? domainOf(save, f.id).level : 1;
            const st = awakenState(save, f?.id, lv);
            if (st === 'liberado') powers.toggleAwaken();
            else if (st === 'prova') hud.toast(`Prova do Despertar: acerte ${AWAKEN.trialHits} habilidades da fruta em inimigos (${trialProgress(save, f.id)}/${AWAKEN.trialHits}).`);
            else hud.toast(`Despertar: domínio ${AWAKEN.level} da fruta.`);
          } else powers.cast(inp.skill, arena.targets, canCast);
        } else if (save.equipped === 'arma') {
          if (inp.skill < 3) blade.cast(inp.skill, arena.targets, canCast);
        } else art.cast(inp.skill, arena.targets, canCast);
      }
      powers.update(dt, arena.targets, combat.canFight());
      blade.update(dt, arena.targets, combat.canFight());
      art.update(dt, arena.targets, combat.canFight());
      if (inp.armorPressed) vontade.toggle('armor');
      if (inp.sensePressed) vontade.toggle('sense');
      vontade.update(dt);
      arena.tagRange = vontade.sense ? 70 : 26;
      if (boat.aboard && ctl.faint > 0) {
        // desmaiou no bote (ex.: queimando): desce no lugar mais perto e o desmaio segue normal
        const spot = boat.landing();
        boat.aboard = false;
        boat.s.speed = 0;
        ctl.pos.set(spot.x, spot.y + 0.05, spot.z);
        ctl.syncCollider();
        ctl.setState('faint');
      }
      if (boat.aboard) {
        // o analógico aponta o rumo em relação à câmera (igual a andar); Correr acelera
        const fx = Math.sin(inp.camYaw);
        const fz = Math.cos(inp.camYaw);
        const r = boat.step(dt, crossing ? crossingInput(inp, inp.camYaw) : { wx: fx * inp.moveY - fz * inp.moveX, wz: fz * inp.moveY + fx * inp.moveX, mag: Math.min(1, Math.hypot(inp.moveX, inp.moveY)), fast: inp.sprint });
        if (r.bump) {
          shake = Math.max(shake, 0.2);
          audio.play('base', 'land', 0.7);
        }
        const st = boat.seat();
        const v = boat.velocity;
        ctl.ride(st.x, st.y, st.z, st.yaw, v.x, v.z);
        if (inp.jumpPressed) {
          if (crossing) hud.notice('Não dá para descer no meio da tempestade!', 'bad', 'gate');
          else disembark();
        }
      } else {
        boat.step(dt, null);
        ctl.step(dt, inp);
      }
      fleet.step(dt, { boat, aboard: boat.aboard, player: ctl.pos });
      weatherStep(dt);
      beastStep(dt);
      wreckStep(dt);
      crossingStep(dt);
      conditions.update(dt, ctl);
      // lava da Caldeira Rubra: queima quem pisa na cratera
      lavaT -= dt;
      if (lavaT <= 0) {
        lavaT = 0.5;
        for (const s of sea) {
          const lv = s.lava;
          if (lv && Math.hypot(ctl.pos.x - lv.x, ctl.pos.z - lv.z) < lv.r && ctl.pos.y < lv.y + 1.2) conditions.apply('queimando', { duration: 3, stacks: 2 });
        }
      }
      // hora do jogo, rotina dos moradores e portas da vila
      save.clock += dt * GAME_MINUTES_PER_SECOND;
      villagers.update(dt, hourOf(save.clock), ctl.pos);
      if (village.field.inside(ctl.pos.x, ctl.pos.z)) village.updateDoors(dt, [ctl.pos, ...villagers.people()]);
      playerProxy.alive = ctl.faint <= 0;
      arena.update(dt, playerProxy);
      tracker.step(dt, ctl);
      mission.check(ctl, { towerTopY });
      discoverTimer -= dt;
      if (discoverTimer <= 0) {
        discoverTimer = 0.25;
        discoverAreas();
      }
      time += dt;
      playTime += dt;
      autosave += dt;
      if (autosave > 120) {
        autosave = 0;
        saveNow(true);
      }
    },
    render(alpha, dt) {
      clock += dt;
      const frame = input.frame(dt);
      const playing = mode === 'game' && !loop.paused;
      if (playing) {
        cam.look(frame.look.x, frame.look.y);
        if (frame.zoom) {
          cam.zoomBy(frame.zoom);
          // lembra o zoom (salva um pouco depois de parar de mexer)
          settings.camZoom = Math.round(cam.zoom * 100) / 100;
          clearTimeout(zoomSaveT);
          zoomSaveT = setTimeout(() => saves.saveSettings(settings), 800);
        }
      }
      // posição interpolada entre os dois últimos passos da física
      const teleport = prev.distanceToSquared(ctl.pos) > 9;
      view.copy(teleport ? ctl.pos : prev).lerp(ctl.pos, teleport ? 1 : alpha);
      feetY = view.y;
      const animDt = mode === 'title' ? dt : loop.paused ? 0 : dt;
      if (mode === 'title') ctl.input = titleIdle;
      boat.render(alpha, animDt);
      if (fleet.sunk > 0) {
        // o bote afundando: desce e aderna
        const k = 1 - fleet.sunk / 4;
        boat.model.group.position.y -= k * 5;
        boat.model.group.rotation.z += k * 0.7;
      }
      fleet.render(alpha, animDt, { aboard: boat.aboard, boat, camYaw: cam.yaw, playerPos: ctl.pos });
      villagers.render(animDt, view);
      // luz do dia (a cada meio segundo): céu, sol, neblina, mar e lampiões; relógio na tela
      storm.update(dt, renderer.camera);
      ocean.setStorm(storm.k);
      dayTimer -= dt;
      if (storm.k > 0.01) dayTimer = 0; // na tempestade o céu muda a cada quadro (escuro e relâmpagos)
      if (dayTimer <= 0) {
        dayTimer = 0.5;
        const dl0 = daylight(hourOf(save.clock));
        const dl = { ...dl0, k: dl0.k * (1 - 0.7 * storm.k) };
        const sky = renderer.setDaylight(dl);
        fogDay.color.copy(sky.horizon);
        ocean.material.uniforms.uSkyTop.value.copy(sky.top);
        ocean.material.uniforms.uSkyHorizon.value.copy(sky.horizon);
        ocean.material.uniforms.uSunColor.value.copy(renderer.sun.color).multiplyScalar(0.4 + 0.6 * dl.k);
        village.setNight(1 - dl.k);
        if (storm.flashLight > 0) {
          renderer.hemi.intensity += storm.flashLight * 2.2;
          renderer.sun.intensity += storm.flashLight * 1.5;
        }
        const ws = save.weather?.state ?? 'sol';
        $('clock').textContent = `${ws !== 'sol' ? WEATHER[ws].icone : dl.k > 0.4 ? '☀' : '☾'} ${fmtClock(save.clock)}`;
      }
      animator.update(animDt, ctl, view);
      dust.update(animDt);
      market.update(mode === 'title' ? dt : animDt, view);
      arena.render(animDt, view);
      if (mode === 'title') titleCamera(clock);
      else cam.update(Math.max(animDt, 1e-4), ctl, view, ocean);
      // tremor da câmera nos golpes (some rápido; desligado com movimento reduzido)
      if (shake > 0 && animDt > 0) {
        shake = Math.max(0, shake - animDt * 1.6);
        if (!settings.reduceMotion) renderer.camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake));
      }
      floats.update(animDt, renderer.camera, window.innerWidth, window.innerHeight);
      fx.update(animDt);
      lab.update(animDt);
      // aura da fruta do laboratório: com o slot da fruta equipado; mais forte no despertar
      lab.aura(mode === 'game' && save.equipped === 'fruta' && eatenFruit() ? eatenFruit().id : null, player.body, powers.awakened, animDt);
      if (mode === 'game') {
        skillBar.update(powers, true, save.equipped === 'arma' ? blade : save.equipped === 'estilo' ? art : powers);
        const learned = save.vontade.armadura || save.vontade.percepcao;
        $('box-will').classList.toggle('hidden', !learned);
        if (learned) {
          $('bar-will').style.transform = `scaleX(${vontade.value / 100})`;
          $('txt-will').textContent = `Vontade ${Math.floor(vontade.value)}${vontade.sense ? ` · 👁 ${vontade.dodgesLeft}` : ''}`;
        }
        $('btn-armor').classList.toggle('hidden', !save.vontade.armadura);
        $('btn-sense').classList.toggle('hidden', !save.vontade.percepcao);
        $('btn-armor').classList.toggle('on', vontade.armor);
        $('btn-sense').classList.toggle('on', vontade.sense);
        document.body.classList.toggle('sense', vontade.sense);
      }
      if (player.weapon) player.weapon.visible = !player.heldFruit;
      if (mode === 'game') {
        condTimer -= animDt;
        if (condTimer <= 0) {
          condTimer = 0.15;
          const v = conditions.view();
          $('cond-list').innerHTML = v.map((c) => `<span class="cond" style="--cc:${c.cor}" title="${c.dica ?? ''}">${c.icone} ${c.nome}${c.stacks > 1 ? ` ×${c.stacks}` : ''} <i>${Math.ceil(c.t)}s</i></span>`).join('');
          const tint = conditions.has('congelado') ? '#2f8fff' : conditions.has('queimando') ? (Math.sin(clock * 12) > 0 ? '#ff5a14' : '#7a2a08') : conditions.has('choque') ? (Math.sin(clock * 20) > 0.5 ? '#ffe45a' : '#000000') : '#000000';
          const key = tint + (vontade.armor ? '|armadura' : '');
          if (key !== playerTint) {
            playerTint = key;
            for (const [part, m] of Object.entries(player.body.meshes)) if (m.material.emissive) {
              // Armadura: braços escuros com brilho metálico arroxeado
              const arm = vontade.armor && tint === '#000000' && /^(braco|antebraco|mao)_/.test(part);
              m.material.emissive.set(arm ? '#3a1a5a' : tint);
              m.material.emissiveIntensity = arm ? 0.9 : tint === '#000000' ? 1 : 0.45;
              m.material.color.offsetHSL(0, 0, 0);
            }
          }
        }
      }
      wingBurst = Math.max(0, wingBurst - animDt * 2.2);
      if (raceParts?.wings) flapWings(raceParts, clock, wingBurst);
      if (form) animateForm(form.info, clock, wingBurst, ctl.speed, m1Appendage());
      // aura do despertar: brilho pulsando na cor da fruta e faíscas em volta (o corpo não muda)
      if (powers.awakened && mode === 'game') {
        const c = eatenFruit()?.color ?? '#ffd36b';
        const k = 0.3 + 0.18 * Math.sin(clock * 6);
        for (const m of Object.values(player.body.meshes)) if (m.material.emissive) {
          m.material.emissive.set(c);
          m.material.emissiveIntensity = k;
        }
        playerTint = 'desperto'; // as faíscas em volta agora vêm da aura do laboratório (lab.aura)
      }
      if (save.race && mode === 'game') {
        const rb = $('btn-race');
        rb.style.setProperty('--cd', String(raceSys.cooldown / RACES[save.race].ativa.recarga));
      }
      const dv = window.__game?.debugView; // vista livre para testes e capturas
      if (dv) {
        renderer.camera.position.fromArray(dv.pos);
        renderer.camera.lookAt(...dv.look);
      }
      ocean.update(mode === 'title' ? dt : animDt, renderer.camera);
      renderer.follow(view);

      // embaixo d'água: neblina azul e perto
      const fog = renderer.scene.fog;
      if (mode === 'game' && cam.underwater) {
        fog.color.copy(fogWater);
        fog.near = 2;
        fog.far = 38;
      } else {
        fog.color.copy(fogDay.color);
        fog.near = renderer.quality.viewDistance * 0.35;
        fog.far = renderer.quality.viewDistance;
      }
      renderer.scene.background = fog.color;

      renderer.render();
      quality.sample(dt);
      if (ocean.detail !== renderer.quality.oceanDetail) {
        ocean.setDetail(renderer.quality.oceanDetail);
        applySetting('qualityChanged');
      }
      if (mode !== 'game') return;
      const info = renderer.renderer.info.render;
      hud.update(dt, {
        ctl, signs: island.signs, underwater: cam.underwater,
        stats: { fps: quality.fps, frameMs: quality.frameMs, quality: renderer.qualityId, scale: renderer.resolutionScale, calls: info.calls, triangles: info.triangles },
      });
      // botão de ação: Falar (NPC perto), Embarcar (bote perto) ou Desembarcar (no bote)
      let act = null;
      if (!modals.length && !animator.eat) {
        if (boat.aboard) act = { kind: 'leave', key: 'leave', text: 'Desembarcar' };
        else if (gathering.busy) {
          const j = gathering.job;
          act = j.kind === 'fish' ? { kind: 'pull', key: `pull-${j.phase === 'bite'}`, text: j.phase === 'bite' ? 'Puxar!' : 'Recolher linha' } : null;
        } else {
          // o mais perto entre NPC, morador e bote
          const opts = [];
          const p = ctl.pos;
          const npc = ctl.state === 'ground' ? market.nearest(p) : null;
          if (npc) opts.push({ d: Math.hypot(p.x - npc.x, p.z - npc.z), kind: 'npc', npc, key: npc.id, text: `Falar com ${npc.art ?? 'o'} ${npc.name}` });
          const vm = ctl.state === 'ground' ? villagers.nearest(p) : null;
          if (vm) {
            const w = villagers.world(vm);
            opts.push({ d: Math.hypot(p.x - w.x, p.z - w.z), kind: 'villager', m: vm, key: vm.id, text: `Falar com ${vm.nome}` });
          }
          if (ctl.state === 'ground') {
            const n = gatherWorld.nearestNode(p);
            if (n) opts.push({ d: Math.hypot(p.x - n.x, p.z - n.z), kind: 'mine', node: n, key: `mine-${n.id}-${n.empty > 0}`, text: n.empty > 0 ? `Veio vazio (${Math.ceil(n.empty)} s)` : `Minerar · ${NODE_TYPES[n.type].nome}` });
            const sp = gatherWorld.nearestSpot(p);
            if (sp) opts.push({ d: Math.hypot(p.x - sp.x, p.z - sp.z) - 5, kind: 'fish', spot: sp, key: `fish-${sp.id}`, text: 'Pescar' });
          }
          if ((ctl.state === 'ground' || ctl.state === 'swim') && boat.near(p)) opts.push({ d: Math.hypot(p.x - boat.s.x, p.z - boat.s.z) - 1.5, kind: 'board', key: 'board', text: 'Embarcar no bote' });
          act = opts.sort((a, b) => a.d - b.d)[0] ?? null;
        }
      }
      if ((act?.key ?? null) !== (nearAction?.key ?? null)) {
        $('btn-interact').classList.toggle('hidden', !act);
        if (act) $('interact-text').textContent = act.text;
      }
      nearAction = act;
      document.body.classList.toggle('aboard', boat.aboard);
      updateZone();
      // barra do chefe: aparece com um chefe vivo perto (até 40)
      let boss = null;
      for (const r of arena.recrutas) {
        if (r.boss && r.alive && Math.hypot(r.pos.x - ctl.pos.x, r.pos.z - ctl.pos.z) < 40) boss = r;
      }
      // no bote: o navio inimigo em combate mais perto usa a mesma barra
      const ship = !boss && boat.aboard ? fleet.engaged(ctl.pos) : null;
      const shown = boss ?? ship;
      if (shown !== bossShown) {
        bossShown = shown;
        $('boss-bar').classList.toggle('hidden', !shown);
        if (boss) $('boss-name').textContent = `${boss.def.nome} · Nv. ${boss.def.level}`;
        else if (ship) $('boss-name').textContent = `${ship.isBeast ? '🌊' : '⚓'} ${ship.def.nome} · Nv. ${ship.level}`;
      }
      if (boss) {
        $('boss-fill').style.transform = `scaleX(${boss.health / boss.maxHealth})`;
        $('boss-hp').textContent = `${fmt(Math.ceil(boss.health))} / ${fmt(boss.maxHealth)}`;
      } else if (ship) {
        $('boss-fill').style.transform = `scaleX(${ship.hull / ship.maxHull})`;
        $('boss-hp').textContent = `${fmt(Math.ceil(ship.hull))} / ${fmt(ship.maxHull)}`;
      }
      updateHullBar();
      minimapTimer -= dt;
      if (minimapTimer <= 0) {
        minimapTimer = 0.1;
        minimap.markers = boat.aboard || fleet.sunk > 0 ? [] : [{ x: boat.s.x, z: boat.s.z, label: 'Seu bote' }];
        for (const s of fleet.ships) {
          if (s.alive && Math.hypot(s.s.x - ctl.pos.x, s.s.z - ctl.pos.z) < 180) minimap.markers.push({ x: s.s.x, z: s.s.z, label: s.def.nome, color: '#c0392b' });
        }
        for (const g of Object.values(GATES)) {
          if (Math.hypot(g.x - ctl.pos.x, g.z - ctl.pos.z) < 260) minimap.markers.push({ x: g.x, z: g.z, label: g.nome, color: '#ffb040' });
        }
        if (beasts.beast) minimap.markers.push({ x: beasts.beast.s.x, z: beasts.beast.s.z, label: beasts.beast.def.nome, color: '#4a0a14' });
        if (wreck) minimap.markers.push({ x: wreck.x, z: wreck.z, label: 'Destroços', color: '#ffd36b' });
        minimap.draw(view, ctl.yaw);
      }
    },
  });
  loop.setFpsCap(settings.fpsCap);
  fpsCapHook = (fps) => loop.setFpsCap(fps);


  // ===== Menu inicial =====
  function enterTitle() {
    mode = 'title';
    $('btn-start').lastChild.textContent = save.savedAt ? 'Continuar' : 'Jogar';
    document.body.classList.add('in-title');
    setGameActive();
    loop.paused = false;
  }
  // ===== Raça: escolha, aplicação e eventos =====
  function applyRace() {
    tracker.raceMult = raceSys.mods.xpPhysical;
    powers.regenMult = raceSys.mods.energyRegen * (1 + gearTotals(save).energiaRegen);
    applyStatus();
    refreshEquip();
    const r = RACES[save.race];
    const rb = $('btn-race');
    rb.classList.toggle('hidden', !r);
    if (r) {
      rb.style.setProperty('--rc', r.cor);
      rb.innerHTML = `${ICONS[r.icone] || ICONS.person}<span class="cdr"></span>`;
      rb.setAttribute('aria-label', `${r.ativa.nome} (habilidade da raça)`);
    }
  }
  function onRaceEvent(name, d) {
    const p = ctl.pos;
    switch (name) {
      case 'denied':
        if (time - raceDenyAt > 1.5) {
          raceDenyAt = time;
          hud.toast(d.message);
        }
        break;
      case 'active': {
        const r = RACES[d.race];
        fx.burst({ x: p.x, y: p.y + 1.5, z: p.z }, r.cor, { count: 18, speed: 4, up: 3 });
        fx.ring(p, r.cor, 3, 0.4);
        audio.play('base', d.race === 'aquatico' ? 'splash' : d.race === 'ceu' ? 'wing' : 'dash', 0.9);
        if (d.race === 'ceu') wingBurst = 1;
        if (d.race === 'humano') hud.toast(`Adaptação Tática: troca de item instantânea por ${raceSys.mods.adaptTime} s`, 'good');
        break;
      }
      case 'trial':
        if (d.started) hud.toast(`Prova racial: ${d.texto}`, 'gold');
        else if (d.failed) hud.toast(`Prova racial falhou: ${d.message}`, 'bad');
        else if (d.done) {
          hud.toast(`Despertar racial! ${RACES[save.race].marcos[100]} · ativa com recarga pela metade e efeito 50% mais forte`, 'gold');
          applyStatus();
          saveNow(true);
        } else hud.toast(`Prova racial: ${d.progress}/${d.total} Recrutas elementais`);
        break;
      case 'siphon':
        if (d.hit) floats.add({ x: d.hit.target.pos.x, y: d.hit.target.pos.y + 3.2, z: d.hit.target.pos.z }, String(d.hit.damage), 'dano');
        floats.add({ x: p.x, y: p.y + 2.4, z: p.z }, d.gained ? `+${d.gained} energia` : 'Sifão sem alvo', d.gained ? 'info' : 'bloqueio');
        break;
      case 'mastery':
        hud.xpGain(`Maestria ${RACES[save.race].nome}`, d.xp, d.progress);
        for (const m of d.reached) {
          hud.toast(`Maestria racial nível ${m.level}${m.nome ? ` · ${m.nome}` : ''}`, m.nome ? 'gold' : 'good');
          applyRace();
        }
        if (d.reached.length) saveNow(true);
        if (modals.includes('status')) statusScreen.render();
        break;
      default:
    }
  }
  function chooseRace(id) {
    if (!RACES[id]) return;
    save.race = id;
    save.raceMastery = { level: 1, xp: 0 };
    removeRaceParts(raceParts);
    raceParts = addRaceParts(player.body, id);
    applyRace();
    statusScreen.setFigure(renderPortrait(renderer.renderer, DATA, 256, { full: true, race: id }));
    closeModal('race-select');
    hud.toast(`Você é ${RACES[id].nome}: ${RACES[id].titulo}! Habilidade: ${RACES[id].ativa.nome} (F ou botão da raça).`, 'gold');
    audio.play('base', 'wing', 1);
    saveNow(true);
  }
  let raceCards = null;
  function openRaceSelect() {
    if (!raceCards) {
      raceCards = Object.values(RACES).map((r) => {
        const img = renderPortrait(renderer.renderer, DATA, 220, { full: true, race: r.id });
        return `<div class="race-card" style="--rc:${r.cor}"><img src="${img}" alt="" /><b>${r.nome}</b><small>${r.titulo}</small>
          <ul>${r.passivas.map((x) => `<li>${x}</li>`).join('')}</ul>
          <p><b style="font-size:12px">${r.ativa.nome}:</b> ${r.ativa.desc}</p><p>${r.limitacao}</p>
          <button class="btn gold" data-race="${r.id}">Escolher ${r.nome}</button></div>`;
      }).join('');
      $('race-grid').innerHTML = raceCards;
    }
    openModal('race-select');
  }
  $('race-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-race]');
    if (b) chooseRace(b.dataset.race);
  });
  applyRace();
  applyGear();

  async function startGame() {
    if (mode === 'game') return;
    mode = 'game';
    document.body.classList.remove('in-title');
    audio.enable(true);
    cam.snap(ctl.pos, ctl.yaw);
    prev.copy(ctl.pos);
    setGameActive();
    if (!save.race) openRaceSelect();
    if (!native() && isTouch()) {
      try {
        await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
        await screen.orientation?.lock?.('landscape');
      } catch { /* o navegador pode recusar: segue normal */ }
    }
  }
  $('btn-start').addEventListener('click', startGame);
  $('btn-title-config').addEventListener('click', () => openModal('pause', { fromTitle: true }));
  $('btn-title-credits').addEventListener('click', () => openModal('credits'));
  window.addEventListener('keydown', (e) => {
    if (mode === 'title' && !modals.length && (e.code === 'Enter' || e.code === 'Space')) startGame();
  });

  refreshProfile();
  refreshMission();
  await setLoading('Pronto!', 100);
  $('title').classList.remove('loading');
  enterTitle();
  loop.start();

  // ===== Ciclo de vida (Android e navegador) =====
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (mode === 'game') {
        saveNow(true);
        if (!modals.length) openModal('pause');
      }
      audio.enable(false);
    } else if (mode === 'game') audio.enable(true);
  });
  if (native()) {
    try {
      const { App } = await import('@capacitor/app');
      App.addListener('pause', () => {
        if (mode !== 'game') return;
        saveNow(true);
        if (!modals.length) openModal('pause');
      });
      App.addListener('backButton', () => {
        if (modals.length) closeModal();
        else if (mode === 'game') openModal('pause');
      });
    } catch { /* plugin ausente */ }
  }

  // ganchos para os testes automáticos
  window.__game = {
    get time() { return time; },
    get mode() { return mode; },
    get started() { return mode === 'game'; },
    ctl, cam, renderer, input, island, ocean, quality, loop, saves, save, mission, applyStatus, shop, market, startEating, applyFruit, tracker, combat, arena, powers, fx, raceSys, chooseRace, blade, conditions, vontade, art,
    start: startGame,
    saveNow,
    applyGear,
    refreshLook,
    equip,
    refreshEquip,
    openModal,
    closeModal,
    village,
    world,
    travel,
    boat,
    board,
    disembark,
    villagers,
    villageUi,
    gathering,
    gatherWorld,
    sea,
    fleet,
    beasts,
    motion: FRUTOMotion,
    toggleForm: (off) => toggleForm(off),
    spawnWreck: () => spawnWreck(),
    forgeUi,
    toggleForm: () => toggleForm(),
    get form() {
      return form;
    },
    setHour(h) {
      save.clock = Math.floor(save.clock / 1440) * 1440 + h * 60;
      dayTimer = 0;
    },
    teleport(x, z, y) {
      const h = y ?? world.sample(x, z) + 0.5;
      ctl.spawn(x, h, z, ctl.yaw);
      cam.snap(ctl.pos, ctl.yaw);
    },
  };
}

boot().catch((err) => {
  console.error(err);
  $('loading-text').textContent = 'Erro ao iniciar: ' + (err?.message || err);
});
