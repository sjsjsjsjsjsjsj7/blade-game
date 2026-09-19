// Particle & Visual Effects System for Blade Clash

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.shakeDecay = 0.9;
  }

  // Trigger screen shake
  shake(intensity = 8) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  // Add hit/slash sparks
  emitSparks(x, y, color = '#ffcc00', count = 16, speed = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel - 1.5,
        color: color,
        size: Math.random() * 3 + 2,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.035,
        gravity: 0.15
      });
    }
  }

  // Clashing swords explosive sparks
  emitClash(x, y) {
    this.shake(6);
    this.emitSparks(x, y, '#ffffff', 12, 8);
    this.emitSparks(x, y, '#ffd700', 16, 6);
    this.emitSparks(x, y, '#ff5500', 10, 5);
    this.addShockwave(x, y, '#ffe066', 45, 0.2);
  }

  // Perfect parry golden/cyan celestial burst
  emitParry(x, y) {
    this.shake(12);
    this.emitSparks(x, y, '#ffffff', 20, 10);
    this.emitSparks(x, y, '#00e5ff', 24, 8);
    this.emitSparks(x, y, '#ffe600', 20, 7);
    this.addShockwave(x, y, '#00f0ff', 75, 0.12);
    this.addShockwave(x, y, '#ffd700', 95, 0.1);
    this.addFloatingText('PERFECT PARRY!', x, y - 40, '#00f0ff', 24);
  }

  // Guard Block barrier impact
  emitBlock(x, y) {
    this.shake(3);
    this.emitSparks(x, y, '#40c4ff', 8, 4);
    this.addShockwave(x, y, '#00b0ff', 30, 0.35);
  }

  // Guard Break shattered crystals
  emitGuardBreak(x, y) {
    this.shake(15);
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        type: 'shard',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: Math.random() > 0.5 ? '#ff1744' : '#ff9100',
        size: Math.random() * 5 + 3,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.4,
        life: 1.0,
        decay: 0.02,
        gravity: 0.25
      });
    }
    this.addFloatingText('GUARD BREAK!', x, y - 50, '#ff1744', 28);
  }

  // Dust puff on landing/dash
  emitDust(x, y, direction = 0) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() * 20 - 10),
        y: y,
        vx: (direction * -2) + (Math.random() * 2 - 1),
        vy: -Math.random() * 1.5 - 0.5,
        color: 'rgba(200, 200, 220, 0.4)',
        size: Math.random() * 6 + 4,
        life: 1.0,
        decay: 0.04,
        gravity: -0.02
      });
    }
  }

  // Elemental sword trail particles
  emitTrailParticle(x, y, effectType) {
    if (effectType === 'fire') {
      this.particles.push({
        type: 'glow',
        x: x + (Math.random() * 6 - 3),
        y: y + (Math.random() * 6 - 3),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 0.5,
        color: Math.random() > 0.4 ? '#ff5722' : '#ffc107',
        size: Math.random() * 5 + 3,
        life: 1.0,
        decay: 0.06,
        gravity: -0.05
      });
    } else if (effectType === 'lightning') {
      this.particles.push({
        type: 'spark',
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: Math.random() > 0.5 ? '#00e5ff' : '#ffffff',
        size: Math.random() * 3 + 1,
        life: 1.0,
        decay: 0.09,
        gravity: 0
      });
    } else if (effectType === 'sakura') {
      this.particles.push({
        type: 'petal',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 1.2 + 0.3,
        color: '#ff80ab',
        size: Math.random() * 4 + 3,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.15,
        life: 1.0,
        decay: 0.03,
        gravity: 0.02
      });
    } else if (effectType === 'shadow') {
      this.particles.push({
        type: 'glow',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 1.5,
        color: Math.random() > 0.4 ? '#9c27b0' : '#212121',
        size: Math.random() * 8 + 4,
        life: 1.0,
        decay: 0.04,
        gravity: -0.03
      });
    } else if (effectType === 'gold') {
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: '#ffd700',
        size: Math.random() * 3 + 2,
        life: 1.0,
        decay: 0.05,
        gravity: 0.05
      });
    } else { // default 'neon'
      this.particles.push({
        type: 'glow',
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        color: '#00e5ff',
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: 0.07,
        gravity: 0
      });
    }
  }

  addShockwave(x, y, color = '#ffffff', maxRadius = 60, speed = 0.2) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: maxRadius,
      color: color,
      life: 1.0,
      speed: speed
    });
  }

  addFloatingText(text, x, y, color = '#ffffff', size = 20) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.8,
      color: color,
      size: size,
      life: 1.0,
      decay: 0.02
    });
  }

  update() {
    // Decay shake
    if (this.screenShake > 0.1) {
      this.screenShake *= this.shakeDecay;
    } else {
      this.screenShake = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      if (p.rot !== undefined) p.rot += p.vrot;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * s.speed;
      s.life -= 0.04;
      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.vy *= 0.95;
      t.life -= t.decay;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Shockwaves
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.lineWidth = 3 * s.life;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.life;
      ctx.stroke();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'glow') {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.life * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, p.size);
        ctx.lineTo(-p.size * 0.6, p.size);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'petal') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Floating text
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.font = `900 ${t.size}px 'Rajdhani', 'Pretendard', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = t.color;
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.particles = new ParticleSystem();
