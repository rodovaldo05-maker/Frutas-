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
import { RANK, fruitName, validate as validateFruits } from './fruits/catalog.js';
import { CatalogScreen } from './ui/catalogScreen.js';
import { maxStamina, maxHealth, maxEnergy, POINTS_PER_LEVEL, damageMultipliers } from './progression/status.js';
import { FruitPowers } from './combat/powers.js';
import { powersOf } from './fruits/powers.js';
import { fruitStyle } from './combat/rules.js';
import { domainOf, addDomainXp, domainBonus } from './progression/domain.js';
import { PowerFx } from './vfx/powerFx.js';
import { SkillBar } from './ui/skillBar.js';
import { buildArena } from './combat/enemies.js';
import { PlayerCombat } from './combat/playerCombat.js';
import { FloatText } from './combat/floatText.js';
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
  const market = buildMarket({ scene: renderer.scene, physics, field: island.field, data: DATA });
  island.signs.push(...market.signs);
  const arena = buildArena({ scene: renderer.scene, physics, field: island.field, data: DATA });
  physics.world.updateSceneQueries?.();
  physics.step();

  await setLoading('Enchendo o mar…', 62);
  const sunDir = renderer.sunOffset.clone().normalize();
  const ocean = new Ocean({ scene: renderer.scene, field: island.field, level: ISLAND.waterLevel, sun: sunDir, sky: { top: new THREE.Color('#5aa7d6'), horizon: new THREE.Color('#cfe7e4') } });
  ocean.setDetail(renderer.quality.oceanDetail);

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
      case 'jump': audio.play('base', 'jump', data.climb ? 0.6 : 0.8); break;
      case 'doubleJump': audio.play('base', 'wing', 0.8); break;
      case 'wallJump': audio.play('base', 'jump', 1); break;
      case 'dash': audio.play('base', 'dash', 0.8); break;
      case 'land': if (data.strength > 0.15) audio.play('base', 'land', Math.min(1, 0.3 + data.strength)); if (data.hard) hud.toast('Queda forte! Agache antes de tocar o chão para rolar.'); break;
      case 'roll': audio.play('base', 'dash', 0.5); hud.toast('Rolamento: sem dano de queda', 'good'); break;
      case 'splash': audio.play('base', 'splash', data.strength); break;
      case 'grab': audio.play('base', 'step', 0.5); break;
      case 'mantle': audio.play('base', 'step', 0.6); break;
      case 'glideStart': audio.play('base', 'wing', 0.6); break;
      case 'damage':
        hud.damageFlash();
        if (data.reason !== 'golpe') hud.toast(`−${Math.round(data.amount)} vida (${data.reason})`, 'bad');
        break;
      case 'faint': hud.toast('Você desmaiou…', 'bad'); audio.play('base', 'death', 0.8); break;
      case 'respawn': cam.snap(ctl.pos, ctl.yaw); break;
      default:
    }
  }

  // vida, fôlego e bônus de movimento: pontos distribuídos + treino pela prática
  // (cada ponto de Força e cada nível de treino de Força: +1 de fôlego)
  const applyStatus = () => {
    const b = bonuses(save.training);
    ctl.stamina.setMax(maxStamina(save.status, save.training));
    ctl.stamina.regenMult = b.staminaRegen;
    ctl.mods = { response: b.response, airControl: b.airControl, swimSpeed: b.swimSpeed, breath: b.breath, dodgeTime: b.dodgeTime };
    const ratio = ctl.maxHealth > 0 ? ctl.health / ctl.maxHealth : 1;
    ctl.maxHealth = maxHealth(save.status);
    ctl.health = Math.max(1, Math.min(ctl.maxHealth, ratio * ctl.maxHealth));
    powers?.setEnergyMax(maxEnergy(save.status));
  };
  let powers = null;
  applyStatus();

  // ===== Combate (atualização 2): golpes, defesa, inimigos da arena e treino =====
  const floats = new FloatText($('float-layer'));
  let shake = 0;
  const combat = new PlayerCombat({
    ctl,
    stats: () => {
      const b = bonuses(save.training);
      const m = damageMultipliers(save.status);
      return { melee: m.melee, defense: m.defense, mitigation: b.mitigation, perfectWindow: b.perfectWindow, blockReduce: b.blockReduce, postureMult: b.postureMult };
    },
    onEvent: (name, d) => {
      const p = ctl.pos;
      const head = { x: p.x, y: p.y + 2.4, z: p.z };
      switch (name) {
        case 'swing': audio.play('base', 'swing', 0.55 + d.step * 0.2); break;
        case 'hit': {
          const t = d.target;
          const at = { x: t.pos.x, y: t.pos.y + 3.2, z: t.pos.z };
          if (d.result === 'block') {
            floats.add(at, 'Defendeu', 'bloqueio');
            audio.play('base', 'land', 0.4);
            break;
          }
          floats.add(at, String(d.damage), d.attack.heavy ? 'forte' : 'dano');
          audio.play('impacto', 'acerto', d.attack.heavy ? 1 : 0.7);
          shake = Math.max(shake, d.attack.heavy ? 0.22 : 0.12);
          tracker.combat('acerto', { target: t.id, life: t.life, hostile: t.hostile, attack: d.attack.id, heavy: d.attack.heavy }, p);
          if (d.attack.fruit) grantDomain(d.attack.fruit, t.hostile ? 1 : 0.5, `${t.id}:${d.attack.id}`, t.hostile, t);
          if (d.result === 'break') floats.add({ ...at, y: at.y + 0.8 }, 'Guarda quebrada!', 'perfeita');
          break;
        }
        case 'dodge':
          floats.add(head, 'Esquiva!', 'esquiva');
          tracker.combat('esquiva', { source: d.source, life: d.life, hostile: true }, p);
          break;
        case 'perfect':
          floats.add(head, 'Defesa perfeita!', 'perfeita');
          audio.play('base', 'wing', 1);
          shake = Math.max(shake, 0.15);
          tracker.combat('defesa', { source: d.source, life: d.life, hostile: true, perfect: true }, p);
          break;
        case 'block':
          floats.add(head, d.damage > 0 ? `Defendeu −${d.damage}` : 'Defendeu', 'bloqueio');
          audio.play('base', 'land', 0.5);
          tracker.combat('defesa', { source: d.source, life: d.life, hostile: true, perfect: false }, p);
          break;
        case 'wall': floats.add(head, 'Muralha!', 'esquiva'); audio.play('base', 'land', 0.5); break;
        case 'guardBreak': hud.toast('Guarda quebrada! Afaste-se e recupere a postura.', 'bad'); break;
        case 'hurt':
          floats.add(head, `−${d.damage}`, 'jogador');
          audio.play('impacto', 'acerto', 0.5);
          shake = Math.max(shake, 0.18);
          tracker.combat('apanhar', { source: d.source, life: d.life, hostile: true, amount: d.damage }, p);
          break;
        default:
      }
    },
  });
  arena.hitPlayer = (enemy, attack, damage) => combat.receive({
    attacker: { x: enemy.pos.x, y: enemy.pos.y, z: enemy.pos.z, yaw: enemy.yaw }, attack, damage, source: enemy.id, life: enemy.life,
  });
  for (const r of arena.recrutas) {
    r.onDefeated = (foe) => {
      save.coins += foe.def.coins;
      floats.add({ x: foe.pos.x, y: foe.pos.y + 4, z: foe.pos.z }, `+${foe.def.xp} exp · +${foe.def.coins} moedas`, 'info');
      hud.toast(`${foe.def.nome} derrotado! +${foe.def.xp} exp · +${foe.def.coins} moedas`, 'good');
      audio.play('base', 'death', 0.6);
      grantXp(foe.def.xp);
      saveNow(true);
    };
  }
  const playerProxy = { pos: ctl.pos, get yaw() { return ctl.yaw; }, alive: true };

  // ===== Poderes das frutas (atualização 3): energia, habilidades 1–3 e domínio =====
  const fx = new PowerFx(renderer.scene, { ground: (x, z) => island.field.sample(x, z), light: renderer.qualityId === 'leve' || renderer.qualityId === 'baixa' });
  const skillBar = new SkillBar();
  const eatenFruit = () => (save.eaten ? DATA.fruits[DATA.fruits.findIndex((f) => f.id === save.eaten.fruit)] ?? null : null);
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
    skillBar.setFruit(eatenFruit(), powers.powers, d.level);
    if (modals.includes('status')) statusScreen.render();
    saveNow(true);
  }
  powers = new FruitPowers({
    ctl,
    fx,
    stats: () => ({ fruit: damageMultipliers(save.status).fruit, domain: domainBonus(powers.domainLevel) }),
    onEvent: (name, d) => {
      const p = ctl.pos;
      switch (name) {
        case 'cast': audio.play(d.power.fruit, 'preparar', 0.7); break;
        case 'release': audio.play(d.power.fruit, 'liberar', d.power.slot === 2 ? 1.1 : 0.9); break;
        case 'impact': shake = Math.max(shake, 0.12); break;
        case 'denied':
          if (time - deniedAt > 1.5) {
            deniedAt = time;
            hud.toast(d.message);
          }
          break;
        case 'heal': floats.add({ x: p.x, y: p.y + 2.4, z: p.z }, `+${d.amount}`, 'info'); break;
        case 'teleport': ctl.spawn(d.x, island.field.sample(d.x, d.z) + 0.4, d.z, d.yaw); break;
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
          grantDomain(d.power.fruit, t.hostile ? (d.power.slot === 2 ? 4 : 3) : 1, `${t.id}:${d.power.slot}`, t.hostile, t);
          break;
        }
        default:
      }
    },
  });
  combat.powers = powers;
  applyStatus();
  for (const r of arena.recrutas) r.onBurn = (foe, n) => floats.add({ x: foe.pos.x, y: foe.pos.y + 3, z: foe.pos.z }, String(n), 'forte');
  // fruta comida: habilidades, combo próprio e domínio
  const setupPowers = () => {
    const f = eatenFruit();
    const level = f ? domainOf(save, f.id).level : 1;
    powers.setFruit(f, f ? powersOf(f) : [], level);
    combat.runner.setStyle(fruitStyle(f));
    skillBar.setFruit(f, powers.powers, level);
  };

  // evolução pela prática: deslocamento real e eventos do controlador viram experiência
  let diminishedAt = -99;
  const tracker = new TrainingTracker(save.training, {
    onGain: (attr, xp, p) => hud.xpGain(ATTRS[attr].nome, xp, p),
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
  function grantXp(amount) {
    const levels = addXp(save, amount);
    if (levels > 0) {
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
  if (save.player && Number.isFinite(save.player.x) && island.field.inside(save.player.x, save.player.z)) {
    ctl.spawn(save.player.x, save.player.y + 0.4, save.player.z, save.player.yaw ?? 0);
    if (save.player.safe) ctl.safe.set(save.player.safe.x, save.player.safe.y, save.player.safe.z);
    ctl.health = Math.max(30, save.player.health ?? 100);
  } else spawn();

  const cam = new FollowCamera(renderer.camera, physics);
  cam.snap(ctl.pos, ctl.yaw);

  await setLoading('Pintando o mapa…', 86);
  const minimap = new Minimap($('minimap-canvas'), island.field, island.signs);
  const mapScreen = new MapScreen({ canvas: $('map-canvas'), field: island.field, signs: island.signs, zoomIn: $('map-in'), zoomOut: $('map-out') });
  const thumb = renderIslandImage(island.field, 256, 'parchment').toDataURL('image/png');
  hud.setPortrait(renderPortrait(renderer.renderer, DATA));
  const statusScreen = new StatusScreen({
    save,
    onChange: () => {
      applyStatus();
      refreshProfile();
      saveNow(true);
    },
  });
  statusScreen.setFigure(renderPortrait(renderer.renderer, DATA, 256, { full: true }));
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
    hud.setTracker({
      visible: st.tracked && !st.claimed,
      title: `${TRAINING.title} (${mission.count}/${mission.total})`,
      step: mission.complete ? 'Concluída! Receba a recompensa em Missões.' : `Próximo: ${next.text}`,
      reward: `${ICONS.coin} ${fmt(TRAINING.reward.coins)} moedas · ${fmt(TRAINING.reward.xp)} exp`,
      done: mission.complete,
    });
    renderMissionList();
  }

  // ===== Configurações =====
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
    buttons: { jump: $('btn-jump'), dash: $('btn-dash'), crouch: $('btn-crouch'), sprint: $('btn-sprint'), menu: $('btn-menu'), glider: $('btn-glider'), attack: $('btn-attack'), block: $('btn-block'), skills: [$('slot-1'), $('slot-2'), $('slot-3')] },
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
    else $(id).classList.remove('hidden');
    if (id === 'worldmap') mapScreen.open({ x: ctl.pos.x, z: ctl.pos.z, yaw: ctl.yaw });
    if (id === 'missions') renderMissionList();
    if (id === 'status') statusScreen.render();
    if (id === 'roulette') shop.renderRoulette();
    if (id === 'bag') shop.renderBag();
    if (id === 'trader') shop.renderTrader();
    if (id === 'catalog') catalog.render();
    if (id === 'pause' && mode === 'game') saveNow(true);
    setGameActive();
  }
  function closeModal(id = modals[modals.length - 1]) {
    if (!id) return;
    const i = modals.indexOf(id);
    if (i >= 0) modals.splice(i, 1);
    if (id === 'pause') menu.setOpen(false);
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
  $('btn-status').addEventListener('click', () => openModal('status'));
  $('btn-bag').addEventListener('click', () => openModal('bag'));
  // falar com o NPC perto
  let nearNpc = null;
  const talk = () => {
    if (!nearNpc || modals.length || mode !== 'game') return;
    openModal(nearNpc.id === 'mercador' ? 'roulette' : 'trader');
  };
  $('btn-interact').addEventListener('click', talk);
  $('btn-map').addEventListener('click', () => openModal('worldmap'));
  $('btn-untrack').addEventListener('click', () => {
    save.missions.treino.tracked = false;
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
      if (save.visited.includes(sign.title)) continue;
      if (Math.abs(ctl.pos.y - sign.y) > 7 || Math.hypot(sign.x - ctl.pos.x, sign.z - ctl.pos.z) > 7.5) continue;
      save.visited.push(sign.title);
      hud.toast(`Área descoberta: ${sign.title} · +${AREA_XP} exp`, 'good');
      grantXp(AREA_XP);
    }
  }

  // ===== Laço =====
  const prev = new THREE.Vector3().copy(ctl.pos);
  const view = new THREE.Vector3();
  let time = 0;
  let clock = 0;
  let autosave = 0;
  let minimapTimer = 0;
  const fogDay = { color: renderer.scene.fog.color.clone() };
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

  const loop = new Loop({
    update(dt) {
      if (mode !== 'game') return;
      prev.copy(ctl.pos);
      const inp = input.consume(cam.yaw);
      combat.update(dt, inp, arena.targets);
      const canCast = combat.canFight() && !combat.runner.busy && !ctl.guarding;
      if (inp.skill >= 0) powers.cast(inp.skill, arena.targets, canCast);
      powers.update(dt, arena.targets, combat.canFight());
      ctl.step(dt, inp);
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
        if (frame.zoom) cam.zoomBy(frame.zoom);
      }
      // posição interpolada entre os dois últimos passos da física
      const teleport = prev.distanceToSquared(ctl.pos) > 9;
      view.copy(teleport ? ctl.pos : prev).lerp(ctl.pos, teleport ? 1 : alpha);
      feetY = view.y;
      const animDt = mode === 'title' ? dt : loop.paused ? 0 : dt;
      if (mode === 'title') ctl.input = titleIdle;
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
      if (mode === 'game') skillBar.update(powers);
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
      // botão Falar perto do Mercador e do Trocador
      const npc = ctl.state === 'ground' && !modals.length && !animator.eat ? market.nearest(ctl.pos) : null;
      if (npc !== nearNpc) {
        nearNpc = npc;
        $('btn-interact').classList.toggle('hidden', !npc);
        if (npc) $('interact-text').textContent = `Falar com o ${npc.name}`;
      }
      minimapTimer -= dt;
      if (minimapTimer <= 0) {
        minimapTimer = 0.1;
        minimap.draw(view, ctl.yaw);
      }
    },
  });

  // ===== Menu inicial =====
  function enterTitle() {
    mode = 'title';
    $('btn-start').lastChild.textContent = save.savedAt ? 'Continuar' : 'Jogar';
    document.body.classList.add('in-title');
    setGameActive();
    loop.paused = false;
  }
  async function startGame() {
    if (mode === 'game') return;
    mode = 'game';
    document.body.classList.remove('in-title');
    audio.enable(true);
    cam.snap(ctl.pos, ctl.yaw);
    prev.copy(ctl.pos);
    setGameActive();
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
    ctl, cam, renderer, input, island, ocean, quality, loop, saves, save, mission, applyStatus, shop, market, startEating, applyFruit, tracker, combat, arena, powers, fx,
    start: startGame,
    saveNow,
    openModal,
    closeModal,
    teleport(x, z, y) {
      const h = y ?? island.field.sample(x, z) + 0.5;
      ctl.spawn(x, h, z, ctl.yaw);
      cam.snap(ctl.pos, ctl.yaw);
    },
  };
}

boot().catch((err) => {
  console.error(err);
  $('loading-text').textContent = 'Erro ao iniciar: ' + (err?.message || err);
});
