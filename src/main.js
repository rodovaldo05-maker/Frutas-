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
import { maxStamina, maxHealth } from './progression/status.js';
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
      case 'damage': hud.damageFlash(); hud.toast(`−${Math.round(data.amount)} vida (${data.reason})`, 'bad'); break;
      case 'faint': hud.toast('Você desmaiou…', 'bad'); audio.play('base', 'death', 0.8); break;
      case 'respawn': cam.snap(ctl.pos, ctl.yaw); break;
      default:
    }
  }

  // vida e fôlego máximos vêm dos status (cada ponto de Força soma 1 de fôlego)
  const applyStatus = () => {
    ctl.stamina.setMax(maxStamina(save.status));
    const ratio = ctl.maxHealth > 0 ? ctl.health / ctl.maxHealth : 1;
    ctl.maxHealth = maxHealth(save.status);
    ctl.health = Math.max(1, Math.min(ctl.maxHealth, ratio * ctl.maxHealth));
  };
  applyStatus();

  // experiência: objetivos, recompensa de missão e áreas descobertas
  function grantXp(amount) {
    const levels = addXp(save, amount);
    if (levels > 0) {
      hud.toast(`Nível ${save.level}! +${levels * 3} pontos de status`, 'gold');
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

  const refreshProfile = () => hud.setProfile({ ...save, xpRatio: xpProgress(save), xpNeed: xpToNext(save.level) });
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
  };
  for (const [k, v] of Object.entries(settings)) applySetting(k, v);

  // ===== Entrada =====
  const input = new Input({
    canvas: $('game'),
    touchRoot: $('touch'),
    stick: { base: $('stick'), knob: $('stick').firstElementChild },
    buttons: { jump: $('btn-jump'), dash: $('btn-dash'), crouch: $('btn-crouch'), sprint: $('btn-sprint'), menu: $('btn-menu') },
  });
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
    if (id === 'pause' && mode === 'game') saveNow(true);
    setGameActive();
  }
  function closeModal(id = modals[modals.length - 1]) {
    if (!id) return;
    const i = modals.indexOf(id);
    if (i >= 0) modals.splice(i, 1);
    if (id === 'pause') menu.setOpen(false);
    else $(id).classList.add('hidden');
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
      ctl.step(dt, input.consume(cam.yaw));
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
      if (mode === 'title') titleCamera(clock);
      else cam.update(Math.max(animDt, 1e-4), ctl, view, ocean);
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
    ctl, cam, renderer, input, island, ocean, quality, loop, saves, save, mission, applyStatus,
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
