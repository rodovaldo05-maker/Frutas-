// FRUTO Legacy — Fase 1 (base e movimento). Liga motor, ilha, personagem, controles,
// câmera, HUD, menu e salvamento.

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
import { SaveSystem } from './saves/saveSystem.js';
import { createFruitAudio } from './audio/fruto-audio.js';

const $ = (id) => document.getElementById(id);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const setLoading = async (text) => {
  $('loading-text').textContent = text;
  await nextFrame();
};
const isTouch = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const native = () => !!window.Capacitor?.isNativePlatform?.();

async function boot() {
  if (isTouch()) document.body.classList.add('touch');
  const saves = new SaveSystem();
  const [settings, save] = await Promise.all([saves.loadSettings(), saves.loadGame()]);

  await setLoading('Preparando o motor…');
  const renderer = new Renderer($('game'));
  const quality = new AutoQuality(renderer, settings.quality);

  await setLoading('Carregando a física…');
  const physics = await Physics.create();

  await setLoading('Erguendo a Ilha de Treino…');
  const island = buildTrainingIsland({ scene: renderer.scene, physics });
  physics.world.updateSceneQueries?.();
  physics.step();

  const sunDir = renderer.sunOffset.clone().normalize();
  const ocean = new Ocean({ scene: renderer.scene, field: island.field, level: ISLAND.waterLevel, sun: sunDir, sky: { top: new THREE.Color('#5aa7d6'), horizon: new THREE.Color('#cfe7e4') } });
  ocean.setDetail(renderer.quality.oceanDetail);

  await setLoading('Montando o personagem…');
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
  const animator = new PlayerAnimator({ player, data: DATA, groundAt, audio });
  const ctl = new CharacterController({
    physics,
    water: ocean,
    unlocks: save.unlocks,
    onEvent: (name, data) => {
      animator.onEvent(name, data);
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

  // ===== Configurações =====
  const applySetting = (key, value) => {
    if (key === 'quality') {
      quality.apply(value);
      ocean.setDetail(renderer.quality.oceanDetail);
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
  const saveNow = async (quiet = false) => {
    save.player = ctl.snapshot();
    save.playTime = Math.round(playTime);
    const ok = await saves.saveGame(save);
    if (!quiet) hud.toast(ok ? 'Jogo salvo' : 'Não foi possível salvar', ok ? 'good' : 'bad');
    menu.setInfo(ok ? `Salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Falha ao salvar');
    return ok;
  };

  // ===== Pausa =====
  const setPaused = (on) => {
    loop.paused = on;
    input.enabled = !on;
    input.releaseAll();
    menu.setOpen(on);
    if (on) saveNow(true);
  };
  const menu = new PauseMenu({
    settings,
    onChange: (key, value) => {
      applySetting(key, value);
      saves.saveSettings(settings);
    },
    onResume: () => setPaused(false),
    onSave: () => saveNow(false),
    onRestart: () => {
      spawn();
      cam.snap(ctl.pos, ctl.yaw);
      setPaused(false);
    },
  });
  input.onPause = () => {
    if (!started) return;
    setPaused(!loop.paused);
  };

  // ===== Laço =====
  const prev = new THREE.Vector3().copy(ctl.pos);
  const view = new THREE.Vector3();
  let time = 0;
  let autosave = 0;
  const fogDay = { color: renderer.scene.fog.color.clone(), near: renderer.scene.fog.near, far: renderer.scene.fog.far };
  const fogWater = new THREE.Color('#1d5866');

  const loop = new Loop({
    update(dt) {
      prev.copy(ctl.pos);
      ctl.step(dt, input.consume(cam.yaw));
      time += dt;
      playTime += dt;
      autosave += dt;
      if (autosave > 120) {
        autosave = 0;
        saveNow(true);
      }
    },
    render(alpha, dt) {
      const frame = input.frame(dt);
      if (!loop.paused) {
        cam.look(frame.look.x, frame.look.y);
        if (frame.zoom) cam.zoomBy(frame.zoom);
      }
      // posição interpolada entre os dois últimos passos da física
      const teleport = prev.distanceToSquared(ctl.pos) > 9;
      view.copy(teleport ? ctl.pos : prev).lerp(ctl.pos, teleport ? 1 : alpha);
      feetY = view.y;
      const animDt = loop.paused ? 0 : dt;
      animator.update(animDt, ctl, view);
      cam.update(Math.max(animDt, 1e-4), ctl, view, ocean);
      const dv = window.__game?.debugView; // vista livre para testes e capturas
      if (dv) {
        renderer.camera.position.fromArray(dv.pos);
        renderer.camera.lookAt(...dv.look);
      }
      ocean.update(animDt, renderer.camera);
      renderer.follow(view);

      // embaixo d'água: neblina azul e perto
      const fog = renderer.scene.fog;
      if (cam.underwater) {
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
      if (ocean.detail !== renderer.quality.oceanDetail) ocean.setDetail(renderer.quality.oceanDetail);
      const info = renderer.renderer.info.render;
      hud.update(dt, {
        ctl, signs: island.signs, underwater: cam.underwater,
        stats: { fps: quality.fps, frameMs: quality.frameMs, quality: renderer.qualityId, scale: renderer.resolutionScale, calls: info.calls, triangles: info.triangles },
      });
    },
  });

  // ===== Começar =====
  let started = false;
  await setLoading('Pronto!');
  const startButton = $('btn-start');
  startButton.classList.remove('hidden');
  $('loading-text').textContent = save.savedAt ? 'Continuando de onde você parou.' : 'Explore as placas para testar cada movimento.';
  const start = async () => {
    if (started) return;
    started = true;
    audio.enable(true);
    $('loading').classList.add('hidden');
    if (!native() && isTouch()) {
      try {
        await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
        await screen.orientation?.lock?.('landscape');
      } catch { /* o navegador pode recusar: segue normal */ }
    }
    loop.start();
  };
  startButton.addEventListener('click', start);
  window.addEventListener('keydown', (e) => {
    if (!started && (e.code === 'Enter' || e.code === 'Space')) start();
  });
  // primeira imagem já aparece atrás da tela de início
  loop.render(0, 0);

  // ===== Ciclo de vida (Android e navegador) =====
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && started) {
      saveNow(true);
      if (!loop.paused) setPaused(true);
      audio.enable(false);
    } else if (!document.hidden && started) audio.enable(true);
  });
  if (native()) {
    try {
      const { App } = await import('@capacitor/app');
      App.addListener('pause', () => {
        saveNow(true);
        if (started && !loop.paused) setPaused(true);
      });
      App.addListener('backButton', () => {
        if (started) setPaused(!loop.paused);
      });
    } catch { /* plugin ausente */ }
  }

  // ganchos para os testes automáticos
  window.__game = {
    get time() { return time; },
    get started() { return started; },
    ctl, cam, renderer, input, island, ocean, quality, loop, saves,
    start,
    saveNow,
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
