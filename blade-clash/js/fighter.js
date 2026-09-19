// Fighter Class - Physics, Combat State Machine, Animation & Rendering

class Fighter {
  constructor(id, x, y, facing, isAI = false) {
    this.id = id; // 'p1' or 'p2'
    this.name = id === 'p1' ? '플레이어 1' : (isAI ? '전투 AI' : '플레이어 2');
    this.isAI = isAI;

    // Spatial & Physics
    this.x = x;
    this.y = y;
    this.width = 44;
    this.height = 84;
    this.vx = 0;
    this.vy = 0;
    this.speed = 5.2;
    this.jumpForce = -15.5;
    this.gravity = 0.75;
    this.groundY = 560;
    this.isGrounded = false;
    this.facing = facing; // 1: right, -1: left

    // Combat Stats
    this.maxHp = 100;
    this.hp = 100;
    this.maxGuard = 100;
    this.guard = 100;
    this.guardRegenTimer = 0;
    this.stamina = 100;

    // State Machine
    this.state = 'idle'; // idle, run, jump, fall, dash, attack1, attack2, heavy, block, guardBreak, hurt, ko
    this.stateTimer = 0;
    this.comboStep = 0;
    this.comboBuffer = false;
    this.hitRegistered = false;

    // Defense & Parry
    this.isBlocking = false;
    this.blockStartTime = 0;
    this.parryWindow = 140; // ms for perfect parry
    this.stunTimer = 0;
    this.invulnerableTimer = 0;

    // Dash
    this.dashTimer = 0;
    this.dashCooldown = 0;

    // Animation & Visuals
    this.animFrame = 0;
    this.swordAngle = 0;
    this.swingProgress = 0;
    this.color = id === 'p1' ? '#00e5ff' : '#ff1744';
    this.trailHistory = [];

    // Score
    this.wins = 0;
  }

  reset(x, facing) {
    this.x = x;
    this.y = this.groundY - this.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.maxHp;
    this.guard = this.maxGuard;
    this.state = 'idle';
    this.stateTimer = 0;
    this.comboStep = 0;
    this.isBlocking = false;
    this.stunTimer = 0;
    this.invulnerableTimer = 0;
    this.trailHistory = [];
  }

  // Handle inputs (human or AI driver)
  handleInput(input) {
    if (this.state === 'guardBreak' || this.state === 'hurt' || this.state === 'ko') {
      return; // cannot act while stunned/hurt
    }

    const now = performance.now();

    // Guard / Block
    if (input.block && this.isGrounded && this.guard > 0) {
      if (!this.isBlocking) {
        this.isBlocking = true;
        this.blockStartTime = now;
        this.state = 'block';
        this.vx = 0;
      }
      return; // holding block prevents other actions
    } else {
      if (this.isBlocking) {
        this.isBlocking = false;
        if (this.state === 'block') this.state = 'idle';
      }
    }

    // Attacks (Only if not already attacking or buffering combo)
    if (input.heavy && this.state !== 'heavy') {
      this.startHeavyAttack();
      return;
    }

    if (input.attack) {
      if (this.state === 'attack1' && this.stateTimer > 8 && this.comboStep === 1) {
        this.comboBuffer = true;
      } else if (this.state === 'idle' || this.state === 'run' || this.state === 'jump' || this.state === 'fall') {
        this.startAttack(1);
      }
      return;
    }

    // Dash
    if (input.dash && this.dashCooldown <= 0 && this.stamina >= 30) {
      this.startDash();
      return;
    }

    // Jump
    if (input.jump && this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.state = 'jump';
      if (window.sounds) window.sounds.playJump();
      if (window.particles) window.particles.emitDust(this.x + this.width / 2, this.groundY, 0);
    }

    // Horizontal Movement
    if (this.state !== 'dash' && !this.state.startsWith('attack') && this.state !== 'heavy') {
      if (input.left) {
        this.vx = -this.speed;
        this.facing = -1;
        if (this.isGrounded) this.state = 'run';
      } else if (input.right) {
        this.vx = this.speed;
        this.facing = 1;
        if (this.isGrounded) this.state = 'run';
      } else {
        this.vx *= 0.7;
        if (Math.abs(this.vx) < 0.2) this.vx = 0;
        if (this.isGrounded && this.state === 'run') this.state = 'idle';
      }
    }
  }

  startAttack(step = 1) {
    this.state = 'attack' + step;
    this.comboStep = step;
    this.stateTimer = 0;
    this.hitRegistered = false;
    this.comboBuffer = false;
    // Slight forward step during slash
    this.vx = this.facing * 3;
    if (window.sounds) window.sounds.playSwing(false);
  }

  startHeavyAttack() {
    this.state = 'heavy';
    this.stateTimer = 0;
    this.hitRegistered = false;
    this.vx = this.facing * 1.5;
    if (window.sounds) window.sounds.playSwing(true);
  }

  startDash() {
    this.state = 'dash';
    this.dashTimer = 14;
    this.dashCooldown = 45;
    this.stamina -= 30;
    this.vx = this.facing * 14;
    this.invulnerableTimer = 10;
    if (window.sounds) window.sounds.playDash();
    if (window.particles) window.particles.emitDust(this.x + this.width / 2, this.y + this.height, this.facing);
  }

  update(arenaWidth = 1200) {
    this.animFrame++;

    // Stamina & Guard recovery
    if (this.stamina < 100) this.stamina += 0.4;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    if (this.state !== 'block' && this.state !== 'guardBreak') {
      this.guardRegenTimer++;
      if (this.guardRegenTimer > 90 && this.guard < this.maxGuard) {
        this.guard = Math.min(this.maxGuard, this.guard + 0.35);
      }
    } else {
      this.guardRegenTimer = 0;
    }

    // Stun / Guard break timer
    if (this.stunTimer > 0) {
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        if (this.state === 'guardBreak') {
          this.guard = this.maxGuard * 0.5; // restore half
        }
        this.state = 'idle';
      }
    }

    // Physics
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    if (this.y + this.height >= this.groundY) {
      this.y = this.groundY - this.height;
      this.vy = 0;
      if (!this.isGrounded) {
        if (window.particles && Math.abs(this.vy) > 3) {
          window.particles.emitDust(this.x + this.width / 2, this.groundY, 0);
        }
      }
      this.isGrounded = true;
      if (this.state === 'jump' || this.state === 'fall') {
        this.state = 'idle';
      }
    } else {
      this.isGrounded = false;
      if (this.vy > 0 && this.state === 'jump') {
        this.state = 'fall';
      }
    }

    // Arena walls
    if (this.x < 30) {
      this.x = 30;
      this.vx = 0;
    } else if (this.x + this.width > arenaWidth - 30) {
      this.x = arenaWidth - 30 - this.width;
      this.vx = 0;
    }

    // State Timer updates & attack progression
    this.stateTimer++;

    if (this.state === 'dash') {
      this.dashTimer--;
      this.vx *= 0.92;
      if (this.dashTimer <= 0) {
        this.state = 'idle';
        this.vx = 0;
      }
    } else if (this.state === 'attack1') {
      if (this.stateTimer >= 18) {
        if (this.comboBuffer) {
          this.startAttack(2);
        } else {
          this.state = 'idle';
        }
      }
    } else if (this.state === 'attack2') {
      if (this.stateTimer >= 22) {
        this.state = 'idle';
      }
    } else if (this.state === 'heavy') {
      if (this.stateTimer >= 36) {
        this.state = 'idle';
      }
    } else if (this.state === 'hurt') {
      this.vx *= 0.85;
      if (this.stateTimer >= 16) {
        this.state = 'idle';
      }
    }

    // Record trail for weapon tip
    const skin = window.skins.getSkin(this.id);
    const swordTip = this.getSwordTipPosition();
    if (this.isAttacking()) {
      this.trailHistory.push(swordTip);
      if (this.trailHistory.length > 8) this.trailHistory.shift();
      if (window.particles && Math.random() > 0.3) {
        window.particles.emitTrailParticle(swordTip.x, swordTip.y, skin.trailEffect);
      }
    } else {
      this.trailHistory.shift();
    }
  }

  isAttacking() {
    return this.state.startsWith('attack') || this.state === 'heavy';
  }

  // Calculate sword hitbox active frames
  getAttackHitbox() {
    if (!this.isAttacking() || this.hitRegistered) return null;

    let active = false;
    let damage = 0;
    let guardDamage = 0;
    let reach = 60;
    let height = 40;
    let knockback = 4;
    let isHeavy = false;

    if (this.state === 'attack1') {
      if (this.stateTimer >= 5 && this.stateTimer <= 12) {
        active = true;
        damage = 10;
        guardDamage = 12;
        reach = 65;
        knockback = 4;
      }
    } else if (this.state === 'attack2') {
      if (this.stateTimer >= 6 && this.stateTimer <= 15) {
        active = true;
        damage = 16;
        guardDamage = 18;
        reach = 75;
        knockback = 7;
      }
    } else if (this.state === 'heavy') {
      if (this.stateTimer >= 14 && this.stateTimer <= 24) {
        active = true;
        damage = 30;
        guardDamage = 45;
        reach = 90;
        height = 55;
        knockback = 12;
        isHeavy = true;
      }
    }

    if (!active) return null;

    const hx = this.facing === 1 ? this.x + this.width : this.x - reach;
    const hy = this.y + (this.height - height) / 2;

    return {
      x: hx,
      y: hy,
      width: reach,
      height: height,
      damage: damage,
      guardDamage: guardDamage,
      knockback: knockback,
      isHeavy: isHeavy
    };
  }

  getHurtbox() {
    return {
      x: this.x + 6,
      y: this.y,
      width: this.width - 12,
      height: this.height
    };
  }

  // Receive attack
  takeHit(attacker, hitbox) {
    if (this.invulnerableTimer > 0 || this.state === 'ko') return false;

    const hitCenterX = hitbox.x + hitbox.width / 2;
    const hitCenterY = hitbox.y + hitbox.height / 2;
    const now = performance.now();

    // Check Perfect Parry
    if (this.isBlocking && (now - this.blockStartTime <= this.parryWindow)) {
      // Perfect Parry!
      if (window.sounds) window.sounds.playParry();
      if (window.particles) window.particles.emitParry(hitCenterX, hitCenterY);

      // Stun attacker
      attacker.stunTimer = 55;
      attacker.state = 'hurt';
      attacker.vx = -attacker.facing * 7;
      attacker.hitRegistered = true;

      // Event hook for Chatbot reaction
      if (window.chatbot) window.chatbot.onParry(this);
      return false;
    }

    // Check Normal Block
    if (this.isBlocking && this.guard > 0) {
      // Blocked!
      this.guard = Math.max(0, this.guard - hitbox.guardDamage);
      const reducedDmg = hitbox.damage * 0.15;
      this.hp = Math.max(0, this.hp - reducedDmg);
      this.vx = attacker.facing * 3;

      if (window.sounds) window.sounds.playBlock();
      if (window.particles) window.particles.emitBlock(hitCenterX, hitCenterY);

      // Guard Break Check
      if (this.guard <= 0) {
        this.state = 'guardBreak';
        this.stunTimer = 110; // ~2 seconds stunned
        this.isBlocking = false;
        if (window.sounds) window.sounds.playGuardBreak();
        if (window.particles) window.particles.emitGuardBreak(this.x + this.width / 2, this.y + 20);
        if (window.chatbot) window.chatbot.onGuardBreak(this);
      }
      return true;
    }

    // Full Hit taken
    this.hp = Math.max(0, this.hp - hitbox.damage);
    this.state = 'hurt';
    this.stateTimer = 0;
    this.stunTimer = hitbox.isHeavy ? 30 : 18;
    this.vx = attacker.facing * hitbox.knockback;
    this.vy = -3;

    if (window.sounds) window.sounds.playHit(hitbox.isHeavy);
    if (window.particles) {
      window.particles.emitSparks(hitCenterX, hitCenterY, hitbox.isHeavy ? '#ff1744' : '#ffd700', hitbox.isHeavy ? 20 : 12, 7);
      window.particles.shake(hitbox.isHeavy ? 10 : 5);
      if (hitbox.isHeavy) {
        window.particles.addFloatingText('CRITICAL!', hitCenterX, hitCenterY - 30, '#ff1744', 24);
      }
    }

    // KO Check
    if (this.hp <= 0) {
      this.state = 'ko';
      this.vx = attacker.facing * 8;
      this.vy = -6;
      if (window.sounds) window.sounds.playKO();
      if (window.chatbot) window.chatbot.onKO(this, attacker);
    }

    return true;
  }

  getSwordTipPosition() {
    const cx = this.x + this.width / 2;
    const cy = this.y + 40;
    const skin = window.skins.getSkin(this.id);
    const len = skin.bladeType === 'greatsword' ? 70 : 55;
    return {
      x: cx + Math.cos(this.swordAngle) * len * this.facing,
      y: cy + Math.sin(this.swordAngle) * len
    };
  }

  // Render fighter & sword on main canvas
  render(ctx) {
    ctx.save();

    const skin = window.skins.getSkin(this.id);
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // Draw Weapon Trails
    if (this.trailHistory.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.trailHistory[0].x, this.trailHistory[0].y);
      for (let i = 1; i < this.trailHistory.length; i++) {
        ctx.lineTo(this.trailHistory[i].x, this.trailHistory[i].y);
      }
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.strokeStyle = skin.glowColor || '#00e5ff';
      ctx.shadowColor = skin.glowColor || '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.restore();
    }

    // Invulnerability flashing
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, this.groundY, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Determine posture & sword angle
    let bodyTilt = 0;
    let armX = cx + (this.facing * 8);
    let armY = cy - 6;
    let sAngle = 0;

    if (this.state === 'run') {
      bodyTilt = this.facing * 0.15;
      sAngle = -0.3;
    } else if (this.state === 'jump' || this.state === 'fall') {
      bodyTilt = this.facing * 0.1;
      sAngle = -0.8;
    } else if (this.state === 'block') {
      sAngle = -1.5; // sword held vertical in front
      armX = cx + (this.facing * 12);
    } else if (this.state === 'attack1') {
      // Fast horizontal slice
      const prog = Math.min(1, this.stateTimer / 16);
      sAngle = -1.8 + prog * 3.2;
    } else if (this.state === 'attack2') {
      // Rising upward slash
      const prog = Math.min(1, this.stateTimer / 18);
      sAngle = 1.2 - prog * 2.8;
    } else if (this.state === 'heavy') {
      // Overhead crushing cleave
      if (this.stateTimer < 12) {
        // Windup back
        sAngle = -2.2;
      } else {
        const prog = Math.min(1, (this.stateTimer - 12) / 12);
        sAngle = -2.2 + prog * 3.6;
      }
    } else if (this.state === 'guardBreak') {
      bodyTilt = -this.facing * 0.25;
      sAngle = 0.6;
    } else if (this.state === 'hurt') {
      bodyTilt = -this.facing * 0.35;
      sAngle = -0.5;
    } else if (this.state === 'ko') {
      bodyTilt = -this.facing * 1.5; // fallen flat
      sAngle = 1.2;
    } else {
      // Idle breathing
      const breath = Math.sin(this.animFrame * 0.08) * 0.08;
      sAngle = -0.4 + breath;
    }

    this.swordAngle = sAngle;

    // --- Draw Fighter Body ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(bodyTilt);
    ctx.scale(this.facing, 1);

    // Legs
    ctx.fillStyle = '#1e293b';
    const legSwing = (this.state === 'run') ? Math.sin(this.animFrame * 0.3) * 12 : 0;
    // Back leg
    ctx.fillRect(-12, 10, 8, 32 + legSwing);
    // Front leg
    ctx.fillRect(4, 10, 8, 32 - legSwing);

    // Torso (Martial Gi)
    ctx.fillStyle = this.id === 'p1' ? '#0f172a' : '#27080b';
    ctx.fillRect(-14, -20, 28, 32);

    // Belt / Sash
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(-15, 6, 30, 6);
    ctx.shadowBlur = 0;

    // Head
    ctx.fillStyle = '#fbc02d'; // skin tone
    ctx.beginPath();
    ctx.arc(0, -32, 13, 0, Math.PI * 2);
    ctx.fill();

    // Ninja Mask
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -32, 13, 0, Math.PI, false);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(4, -36, 4, 3);
    ctx.shadowBlur = 0;

    // Headband fluttering ribbon
    const ribbonWave = Math.sin(this.animFrame * 0.2) * 5;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -35);
    ctx.quadraticCurveTo(-22, -35 + ribbonWave, -32 - Math.abs(this.vx) * 3, -32 + ribbonWave * 1.5);
    ctx.stroke();

    ctx.restore();

    // --- Draw Sword with Active Skin ---
    ctx.save();
    ctx.translate(armX, armY);
    ctx.scale(this.facing, 1);
    ctx.rotate(sAngle);

    window.skins.drawSword(ctx, skin, 55, 6);
    ctx.restore();

    // --- Draw Guard Block Shield Barrier ---
    if (this.isBlocking && this.state === 'block') {
      ctx.save();
      const shieldX = cx + this.facing * 28;
      const shieldY = cy - 5;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.75 + Math.sin(this.animFrame * 0.25) * 0.25;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = shieldX + Math.cos(angle) * 36;
        const hy = shieldY + Math.sin(angle) * 36;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // --- Draw Guard Break Dizzy Stars ---
    if (this.state === 'guardBreak') {
      ctx.save();
      const starCount = 3;
      for (let i = 0; i < starCount; i++) {
        const rot = (this.animFrame * 0.1) + (i * ((Math.PI * 2) / starCount));
        const sx = cx + Math.cos(rot) * 22;
        const sy = (this.y - 12) + Math.sin(rot) * 7;
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Floating Overhead Mini HP/Guard Gauge
    const barW = 50;
    const barH = 5;
    const barX = cx - barW / 2;
    const barY = this.y - 22;

    // HP background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    // HP Fill
    ctx.fillStyle = this.color;
    ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);

    // Guard Fill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY + barH + 2, barW, 3);
    ctx.fillStyle = this.guard <= 25 ? '#ff1744' : '#00e5ff';
    ctx.fillRect(barX, barY + barH + 2, barW * (this.guard / this.maxGuard), 3);

    ctx.restore();
  }
}

window.Fighter = Fighter;
