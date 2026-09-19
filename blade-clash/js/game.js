// Blade Clash - Main Game Loop & Battle Orchestrator

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('battle-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.arenaWidth = 1400;
    this.arenaHeight = 700;

    // Camera
    this.camera = new window.BattleCamera(this.canvas.width, this.canvas.height, this.arenaWidth, this.arenaHeight);
    this.camera.attachEvents(this.canvas);

    // Modes & States
    this.mode = '1p'; // '1p' or '2p'
    this.difficulty = 'normal';
    this.state = 'menu'; // 'menu', 'countdown', 'fighting', 'roundOver', 'matchOver'
    this.round = 1;
    this.maxRoundsToWin = 2;
    this.roundTimer = 90;
    this.roundTimerInterval = null;
    this.countdownTimer = 0;
    this.slowMoTimer = 0;

    // Fighters & AI
    this.p1 = new window.Fighter('p1', 450, 480, 1, false);
    this.p2 = new window.Fighter('p2', 950, 480, -1, true);
    this.ai = new window.AIController('normal');

    // Announcements
    this.announcement = '';
    this.announcementSub = '';
    this.announcementLife = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize UI listeners
    this.setupUI();

    // Start Chatbot
    if (window.chatbot) window.chatbot.init();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const container = document.getElementById('canvas-wrapper');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.camera.resize(rect.width, rect.height);
  }

  setupUI() {
    // Mode Buttons
    const btn1P = document.getElementById('btn-mode-1p');
    const btn2P = document.getElementById('btn-mode-2p');
    const diffSelect = document.getElementById('ai-difficulty');

    btn1P?.addEventListener('click', () => this.setMode('1p'));
    btn2P?.addEventListener('click', () => this.setMode('2p'));

    diffSelect?.addEventListener('change', (e) => {
      this.difficulty = e.target.value;
      this.ai.setDifficulty(this.difficulty);
    });

    // Start / Restart Battle Button
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      this.startMatch();
    });

    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      this.startMatch();
    });

    // Zoom Buttons
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.camera.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.camera.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.camera.resetView());

    // Audio Toggle
    const muteBtn = document.getElementById('btn-toggle-sound');
    muteBtn?.addEventListener('click', () => {
      const isMuted = !window.sounds.muted;
      window.sounds.setMuted(isMuted);
      muteBtn.textContent = isMuted ? '🔇 음소거' : '🔊 사운드 ON';
      muteBtn.classList.toggle('active', !isMuted);
    });

    // Setup Modals (Skin Customizer, Controls, Chatbot)
    this.setupSkinModal();
    this.setupControlsModal();
    this.setupChatbotUI();
  }

  setMode(mode) {
    this.mode = mode;
    this.p2.isAI = (mode === '1p');
    this.p2.name = mode === '1p' ? '전투 AI' : '플레이어 2';

    document.getElementById('btn-mode-1p')?.classList.toggle('active', mode === '1p');
    document.getElementById('btn-mode-2p')?.classList.toggle('active', mode === '2p');
    document.getElementById('p2-header-name').textContent = this.p2.name;

    const diffContainer = document.getElementById('difficulty-container');
    if (diffContainer) {
      diffContainer.style.display = (mode === '1p') ? 'flex' : 'none';
    }

    this.startMatch();
  }

  startMatch() {
    this.p1.wins = 0;
    this.p2.wins = 0;
    this.round = 1;
    this.updateWinMarkers();
    this.startRound();
  }

  startRound() {
    this.state = 'countdown';
    this.countdownTimer = 110;
    this.roundTimer = 90;
    document.getElementById('match-timer').textContent = this.roundTimer;

    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);

    this.p1.reset(460, 1);
    this.p2.reset(940, -1);

    this.showAnnouncement(`ROUND ${this.round}`, 'READY...', 110);
    if (window.sounds) window.sounds.playRoundStart();
  }

  startRoundTimer() {
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
    this.roundTimerInterval = setInterval(() => {
      if (this.state === 'fighting') {
        this.roundTimer--;
        document.getElementById('match-timer').textContent = this.roundTimer;
        if (this.roundTimer <= 0) {
          this.handleTimeOut();
        }
      }
    }, 1000);
  }

  showAnnouncement(main, sub, duration = 90) {
    this.announcement = main;
    this.announcementSub = sub;
    this.announcementLife = duration;
  }

  handleTimeOut() {
    clearInterval(this.roundTimerInterval);
    if (this.p1.hp > this.p2.hp) {
      this.finishRound(this.p1, '시간 초과!');
    } else if (this.p2.hp > this.p1.hp) {
      this.finishRound(this.p2, '시간 초과!');
    } else {
      this.finishRound(null, '무승부!');
    }
  }

  finishRound(winner, reason = 'K.O.!') {
    this.state = 'roundOver';
    if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);

    this.slowMoTimer = 35; // Dramatic slow-mo finish

    if (winner) {
      winner.wins++;
      this.updateWinMarkers();
      this.showAnnouncement(reason, `${winner.name} 승리!`, 120);
    } else {
      this.showAnnouncement(reason, 'DRAW', 120);
    }

    setTimeout(() => {
      if (this.p1.wins >= this.maxRoundsToWin || this.p2.wins >= this.maxRoundsToWin) {
        // Match Over!
        this.state = 'matchOver';
        const matchWinner = this.p1.wins >= this.maxRoundsToWin ? this.p1 : this.p2;
        this.showAnnouncement('VICTORY!', `최종 승자: ${matchWinner.name}`, 200);
      } else {
        // Next Round
        this.round++;
        this.startRound();
      }
    }, 2500);
  }

  updateWinMarkers() {
    const p1Marks = document.querySelectorAll('.p1-win-mark');
    const p2Marks = document.querySelectorAll('.p2-win-mark');

    p1Marks.forEach((el, idx) => el.classList.toggle('active', idx < this.p1.wins));
    p2Marks.forEach((el, idx) => el.classList.toggle('active', idx < this.p2.wins));
  }

  // Check collision between rectangles
  checkAABB(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  updateCombat() {
    if (this.state !== 'fighting') return;

    const hit1 = this.p1.getAttackHitbox();
    const hit2 = this.p2.getAttackHitbox();
    const hurt1 = this.p1.getHurtbox();
    const hurt2 = this.p2.getHurtbox();

    // 1. Blade Clash Check: If both attack hitboxes collide with each other
    if (hit1 && hit2 && this.checkAABB(hit1, hit2)) {
      const clashX = (hit1.x + hit2.x) / 2;
      const clashY = (hit1.y + hit2.y) / 2;
      window.particles.emitClash(clashX, clashY);
      window.sounds.playClash();

      this.p1.hitRegistered = true;
      this.p2.hitRegistered = true;
      this.p1.vx = -this.p1.facing * 5;
      this.p2.vx = -this.p2.facing * 5;
      return;
    }

    // 2. P1 attacks P2
    if (hit1 && this.checkAABB(hit1, hurt2)) {
      const hitSuccess = this.p2.takeHit(this.p1, hit1);
      this.p1.hitRegistered = true;
      if (this.p2.state === 'ko') {
        this.finishRound(this.p1, 'K.O.!');
      }
    }

    // 3. P2 attacks P1
    if (hit2 && this.checkAABB(hit2, hurt1)) {
      const hitSuccess = this.p1.takeHit(this.p2, hit2);
      this.p2.hitRegistered = true;
      if (this.p1.state === 'ko') {
        this.finishRound(this.p2, 'K.O.!');
      }
    }
  }

  update() {
    // Announcements timer
    if (this.announcementLife > 0) {
      this.announcementLife--;
      if (this.state === 'countdown' && this.countdownTimer > 0) {
        this.countdownTimer--;
        if (this.countdownTimer === 30) {
          this.showAnnouncement('FIGHT!', '', 45);
        } else if (this.countdownTimer <= 0) {
          this.state = 'fighting';
          this.startRoundTimer();
        }
      }
    }

    // Slow-mo handling
    let updateFighters = true;
    if (this.slowMoTimer > 0) {
      this.slowMoTimer--;
      if (this.slowMoTimer % 3 !== 0) {
        updateFighters = false;
      }
    }

    if (updateFighters) {
      // Gather inputs
      // P1 Inputs
      const p1Input = {
        left: window.controls.isActionActive('p1', 'left'),
        right: window.controls.isActionActive('p1', 'right'),
        jump: window.controls.isActionActive('p1', 'jump'),
        block: window.controls.isActionActive('p1', 'block'),
        attack: window.controls.isActionActive('p1', 'attack'),
        heavy: window.controls.isActionActive('p1', 'heavy'),
        dash: window.controls.isActionActive('p1', 'dash')
      };

      // P2 Inputs (AI or Human)
      let p2Input;
      if (this.mode === '1p') {
        p2Input = this.ai.update(this.p2, this.p1);
      } else {
        p2Input = {
          left: window.controls.isActionActive('p2', 'left'),
          right: window.controls.isActionActive('p2', 'right'),
          jump: window.controls.isActionActive('p2', 'jump'),
          block: window.controls.isActionActive('p2', 'block'),
          attack: window.controls.isActionActive('p2', 'attack'),
          heavy: window.controls.isActionActive('p2', 'heavy'),
          dash: window.controls.isActionActive('p2', 'dash')
        };
      }

      if (this.state === 'fighting') {
        this.p1.handleInput(p1Input);
        this.p2.handleInput(p2Input);
      }

      this.p1.update(this.arenaWidth);
      this.p2.update(this.arenaWidth);

      this.updateCombat();
    }

    // Update Particles & Camera
    window.particles.update();
    this.camera.update(this.p1, this.p2);

    // Sync HUD
    this.syncHUD();
  }

  syncHUD() {
    const p1HpBar = document.getElementById('p1-hp-fill');
    const p2HpBar = document.getElementById('p2-hp-fill');
    const p1GuardBar = document.getElementById('p1-guard-fill');
    const p2GuardBar = document.getElementById('p2-guard-fill');

    if (p1HpBar) p1HpBar.style.width = `${Math.max(0, this.p1.hp)}%`;
    if (p2HpBar) p2HpBar.style.width = `${Math.max(0, this.p2.hp)}%`;
    if (p1GuardBar) p1GuardBar.style.width = `${Math.max(0, this.p1.guard)}%`;
    if (p2GuardBar) p2GuardBar.style.width = `${Math.max(0, this.p2.guard)}%`;
  }

  drawArena(ctx) {
    // 1. Sky & Moonlight
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.arenaHeight);
    skyGrad.addColorStop(0, '#060913');
    skyGrad.addColorStop(0.7, '#0f172a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.arenaWidth, this.arenaHeight);

    // Gigantic Cyber Moon
    ctx.save();
    ctx.shadowColor = 'rgba(0, 229, 255, 0.4)';
    ctx.shadowBlur = 60;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(this.arenaWidth / 2, 180, 110, 0, Math.PI * 2);
    ctx.fill();

    // Moon crater details
    ctx.fillStyle = 'rgba(203, 213, 225, 0.25)';
    ctx.beginPath();
    ctx.arc(this.arenaWidth / 2 - 35, 150, 28, 0, Math.PI * 2);
    ctx.arc(this.arenaWidth / 2 + 45, 205, 38, 0, Math.PI * 2);
    ctx.arc(this.arenaWidth / 2 - 20, 220, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Distant Cyber Dojo Skyline
    ctx.fillStyle = '#090d16';
    for (let x = 60; x < this.arenaWidth; x += 120) {
      const h = 180 + Math.sin(x) * 60;
      ctx.fillRect(x, 560 - h, 90, h);
    }

    // Traditional Pagoda Roof Silhouette
    ctx.fillStyle = '#0d131f';
    ctx.beginPath();
    ctx.moveTo(this.arenaWidth / 2 - 350, 560 - 240);
    ctx.lineTo(this.arenaWidth / 2, 560 - 320);
    ctx.lineTo(this.arenaWidth / 2 + 350, 560 - 240);
    ctx.lineTo(this.arenaWidth / 2 + 280, 560 - 220);
    ctx.lineTo(this.arenaWidth / 2 - 280, 560 - 220);
    ctx.closePath();
    ctx.fill();

    // 3. Neon Cyber Torii Gate Pillars
    const toriiPillars = [180, this.arenaWidth - 220];
    for (const px of toriiPillars) {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px, 260, 36, 300);

      // Glowing Neon runes
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      for (let y = 290; y < 530; y += 45) {
        ctx.fillRect(px + 10, y, 16, 8);
      }
      ctx.shadowBlur = 0;
    }

    // 4. Dojo Wooden Floor Platform
    const floorGrad = ctx.createLinearGradient(0, 560, 0, this.arenaHeight);
    floorGrad.addColorStop(0, '#3e2723');
    floorGrad.addColorStop(0.3, '#271914');
    floorGrad.addColorStop(1, '#110b08');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 560, this.arenaWidth, this.arenaHeight - 560);

    // Tatami / Wood Planks lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x < this.arenaWidth; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 560);
      ctx.lineTo(x, this.arenaHeight);
      ctx.stroke();
    }

    // Glowing stage boundary line
    ctx.strokeStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 560);
    ctx.lineTo(this.arenaWidth, 560);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawAnnouncements(ctx) {
    if (this.announcementLife <= 0) return;

    const alpha = Math.min(1, this.announcementLife / 20);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2 - 30;

    // Dark backdrop banner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, cy - 70, this.canvas.width, 130);

    // Main Text
    ctx.font = '900 52px "Rajdhani", "Pretendard", sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.fillText(this.announcement, cx, cy);

    // Subtitle
    if (this.announcementSub) {
      ctx.font = '700 24px "Rajdhani", "Pretendard", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillText(this.announcementSub, cx, cy + 42);
    }

    ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Camera transformed World
    this.camera.apply(this.ctx, window.particles.screenShake);

    // Arena background & ground
    this.drawArena(this.ctx);

    // Fighters
    this.p1.render(this.ctx);
    this.p2.render(this.ctx);

    // Particles & combat text
    window.particles.render(this.ctx);

    this.camera.restore(this.ctx);

    // 2. Screen-Space UI Overlays (Announcements)
    this.drawAnnouncements(this.ctx);
  }

  loop(t) {
    this.update();
    this.render();

    // Render Skin Modal preview if open
    const skinModal = document.getElementById('modal-skin-editor');
    if (skinModal && skinModal.classList.contains('active')) {
      const previewCanvas = document.getElementById('skin-preview-canvas');
      window.skins.renderPreview(previewCanvas);
    }

    requestAnimationFrame((ts) => this.loop(ts));
  }

  // ---------------- UI & MODAL MANAGEMENT ----------------

  setupSkinModal() {
    const modal = document.getElementById('modal-skin-editor');
    const openBtn = document.getElementById('btn-open-skin-editor');
    const closeBtn = document.getElementById('btn-close-skin-modal');
    const p1Tab = document.getElementById('skin-tab-p1');
    const p2Tab = document.getElementById('skin-tab-p2');

    openBtn?.addEventListener('click', () => {
      modal.classList.add('active');
      this.populateSkinForm();
    });

    closeBtn?.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    p1Tab?.addEventListener('click', () => {
      window.skins.currentEditingPlayer = 'p1';
      p1Tab.classList.add('active');
      p2Tab.classList.remove('active');
      this.populateSkinForm();
    });

    p2Tab?.addEventListener('click', () => {
      window.skins.currentEditingPlayer = 'p2';
      p2Tab.classList.add('active');
      p1Tab.classList.remove('active');
      this.populateSkinForm();
    });

    // Form inputs
    const bladeTypeSelect = document.getElementById('skin-blade-type');
    const bladeColorInput = document.getElementById('skin-blade-color');
    const edgeColorInput = document.getElementById('skin-edge-color');
    const hiltColorInput = document.getElementById('skin-hilt-color');
    const glowColorInput = document.getElementById('skin-glow-color');
    const trailSelect = document.getElementById('skin-trail-effect');

    bladeTypeSelect?.addEventListener('change', (e) => {
      window.skins.setSkinProperty(window.skins.currentEditingPlayer, 'bladeType', e.target.value);
    });
    bladeColorInput?.addEventListener('input', (e) => {
      window.skins.setSkinProperty(window.skins.currentEditingPlayer, 'bladeColor', e.target.value);
    });
    edgeColorInput?.addEventListener('input', (e) => {
      window.skins.setSkinProperty(window.skins.currentEditingPlayer, 'edgeColor', e.target.value);
    });
    hiltColorInput?.addEventListener('input', (e) => {
      window.skins.setSkinProperty(window.skins.currentEditingPlayer, 'hiltColor', e.target.value);
    });
    glowColorInput?.addEventListener('input', (e) => {
      window.skins.setSkinProperty(window.skins.currentEditingPlayer, 'glowColor', e.target.value);
    });
    trailSelect?.addEventListener('change', (e) => {
      window.skins.setSkinProperty(window.skins.currentEditingPlayer, 'trailEffect', e.target.value);
    });

    // Presets list
    const presetsList = document.getElementById('skin-presets-list');
    if (presetsList) {
      presetsList.innerHTML = window.skins.presets.map((preset, idx) => `
        <button class="preset-card" data-index="${idx}">
          <span class="preset-name">${preset.name}</span>
          <span class="preset-tags">${preset.bladeType} / ${preset.trailEffect}</span>
        </button>
      `).join('');

      presetsList.querySelectorAll('.preset-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          window.skins.applyPreset(window.skins.currentEditingPlayer, idx);
          this.populateSkinForm();
        });
      });
    }
  }

  populateSkinForm() {
    const skin = window.skins.getSkin(window.skins.currentEditingPlayer);
    document.getElementById('skin-blade-type').value = skin.bladeType || 'katana';
    document.getElementById('skin-blade-color').value = skin.bladeColor || '#00e5ff';
    document.getElementById('skin-edge-color').value = skin.edgeColor || '#ffffff';
    document.getElementById('skin-hilt-color').value = skin.hiltColor || '#111827';
    document.getElementById('skin-glow-color').value = skin.glowColor || '#00e5ff';
    document.getElementById('skin-trail-effect').value = skin.trailEffect || 'neon';
  }

  setupControlsModal() {
    const modal = document.getElementById('modal-controls');
    const openBtn = document.getElementById('btn-open-controls');
    const closeBtn = document.getElementById('btn-close-controls-modal');
    const resetP1Btn = document.getElementById('btn-reset-p1-keys');
    const resetP2Btn = document.getElementById('btn-reset-p2-keys');

    openBtn?.addEventListener('click', () => {
      modal.classList.add('active');
      this.refreshControlButtons();
    });

    closeBtn?.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    resetP1Btn?.addEventListener('click', () => {
      window.controls.resetToDefaults('p1');
      this.refreshControlButtons();
    });

    resetP2Btn?.addEventListener('click', () => {
      window.controls.resetToDefaults('p2');
      this.refreshControlButtons();
    });

    // Wire rebind buttons
    document.querySelectorAll('.key-bind-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const player = btn.getAttribute('data-player');
        const action = btn.getAttribute('data-action');
        window.controls.startRebind(player, action, btn);
      });
    });
  }

  refreshControlButtons() {
    document.querySelectorAll('.key-bind-btn').forEach(btn => {
      const player = btn.getAttribute('data-player');
      const action = btn.getAttribute('data-action');
      const code = window.controls.bindings[player]?.[action];
      btn.textContent = window.controls.formatKeyName(code);
    });
  }

  setupChatbotUI() {
    const drawer = document.getElementById('chatbot-drawer');
    const toggleBtn = document.getElementById('btn-toggle-chatbot');
    const closeBtn = document.getElementById('btn-close-chat');
    const inputEl = document.getElementById('chat-input-text');
    const sendBtn = document.getElementById('btn-send-chat');
    const badge = document.getElementById('chat-badge');
    const apiKeyInput = document.getElementById('gemini-api-key');

    if (apiKeyInput) {
      apiKeyInput.value = window.chatbot.apiKey;
      apiKeyInput.addEventListener('change', (e) => {
        window.chatbot.setApiKey(e.target.value);
      });
    }

    const openChat = () => {
      drawer.classList.add('open');
      window.chatbot.isOpen = true;
      if (badge) badge.classList.remove('active');
    };

    const closeChat = () => {
      drawer.classList.remove('open');
      window.chatbot.isOpen = false;
    };

    toggleBtn?.addEventListener('click', () => {
      if (drawer.classList.contains('open')) closeChat();
      else openChat();
    });

    closeBtn?.addEventListener('click', closeChat);

    const submitQuery = () => {
      const query = inputEl.value;
      if (query.trim()) {
        inputEl.value = '';
        window.chatbot.handleUserQuery(query);
      }
    };

    sendBtn?.addEventListener('click', submitQuery);
    inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitQuery();
    });

    // Quick suggestion prompt chips
    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          window.chatbot.handleUserQuery(prompt);
        }
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
