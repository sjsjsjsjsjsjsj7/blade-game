// Sword Skin Customizer & Renderer

class SkinManager {
  constructor() {
    this.defaultSkins = {
      p1: {
        name: '사이버 카타나',
        bladeType: 'katana',
        bladeColor: '#00e5ff',
        edgeColor: '#ffffff',
        hiltColor: '#1a1a2e',
        glowColor: '#00b0ff',
        trailEffect: 'neon'
      },
      p2: {
        name: '진홍의 혈검',
        bladeType: 'katana',
        bladeColor: '#ff1744',
        edgeColor: '#ff8a80',
        hiltColor: '#212121',
        glowColor: '#d50000',
        trailEffect: 'fire'
      }
    };

    this.presets = [
      {
        name: '사이버 네온 카타나',
        bladeType: 'katana',
        bladeColor: '#00e5ff',
        edgeColor: '#ffffff',
        hiltColor: '#111827',
        glowColor: '#00e5ff',
        trailEffect: 'neon'
      },
      {
        name: '지옥불 대검',
        bladeType: 'greatsword',
        bladeColor: '#ff3d00',
        edgeColor: '#ffea00',
        hiltColor: '#3e2723',
        glowColor: '#ff6d00',
        trailEffect: 'fire'
      },
      {
        name: '전격 레이피어',
        bladeType: 'rapier',
        bladeColor: '#ffd600',
        edgeColor: '#ffffff',
        hiltColor: '#263238',
        glowColor: '#ffea00',
        trailEffect: 'lightning'
      },
      {
        name: '공허의 흑도',
        bladeType: 'void',
        bladeColor: '#9c27b0',
        edgeColor: '#e040fb',
        hiltColor: '#000000',
        glowColor: '#7b1fa2',
        trailEffect: 'shadow'
      },
      {
        name: '황혼의 벚꽃검',
        bladeType: 'katana',
        bladeColor: '#ff4081',
        edgeColor: '#ffffff',
        hiltColor: '#4a148c',
        glowColor: '#f50057',
        trailEffect: 'sakura'
      },
      {
        name: '태양의 황금검',
        bladeType: 'greatsword',
        bladeColor: '#ffd700',
        edgeColor: '#ffffff',
        hiltColor: '#37474f',
        glowColor: '#ffab00',
        trailEffect: 'gold'
      }
    ];

    this.currentEditingPlayer = 'p1';
    this.skins = this.loadSkins();
    this.previewAngle = 0;
    this.previewSwingTime = 0;
  }

  loadSkins() {
    try {
      const saved = localStorage.getItem('blade_clash_skins');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load skins from storage', e);
    }
    return JSON.parse(JSON.stringify(this.defaultSkins));
  }

  saveSkins() {
    try {
      localStorage.setItem('blade_clash_skins', JSON.stringify(this.skins));
    } catch (e) {
      console.warn('Failed to save skins to storage', e);
    }
  }

  getSkin(playerKey) {
    return this.skins[playerKey] || this.defaultSkins[playerKey];
  }

  setSkinProperty(playerKey, prop, value) {
    if (!this.skins[playerKey]) {
      this.skins[playerKey] = JSON.parse(JSON.stringify(this.defaultSkins[playerKey]));
    }
    this.skins[playerKey][prop] = value;
    this.saveSkins();
  }

  applyPreset(playerKey, presetIndex) {
    if (this.presets[presetIndex]) {
      this.skins[playerKey] = JSON.parse(JSON.stringify(this.presets[presetIndex]));
      this.saveSkins();
    }
  }

  // Draw sword geometry on any 2D canvas context
  drawSword(ctx, skin, length = 55, width = 6) {
    ctx.save();

    const type = skin.bladeType || 'katana';
    const bladeColor = skin.bladeColor || '#ffffff';
    const edgeColor = skin.edgeColor || '#00e5ff';
    const hiltColor = skin.hiltColor || '#111827';
    const glowColor = skin.glowColor || '#00e5ff';

    // Glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;

    if (type === 'katana') {
      // Curved Katana
      // Hilt
      ctx.fillStyle = hiltColor;
      ctx.fillRect(-4, -14, 8, 16);
      // Tsuba (Guard)
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-9, 2, 18, 4);

      // Curved Blade
      ctx.beginPath();
      ctx.moveTo(-3, 6);
      ctx.quadraticCurveTo(0, length * 0.5, 6, length);
      ctx.lineTo(2, length + 4);
      ctx.quadraticCurveTo(-4, length * 0.5, -4, 6);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 6, 4, length);
      grad.addColorStop(0, bladeColor);
      grad.addColorStop(0.7, edgeColor);
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.fill();

      // Blade ridge line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-1, 6);
      ctx.quadraticCurveTo(1, length * 0.5, 4, length);
      ctx.stroke();

    } else if (type === 'greatsword') {
      // Heavy Greatsword
      const w = width * 1.6;
      const l = length * 1.25;

      // Hilt (2-handed long grip)
      ctx.fillStyle = hiltColor;
      ctx.fillRect(-w * 0.25, -20, w * 0.5, 22);

      // Pommel
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, -22, w * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Broad crossguard
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(-w * 1.5, 2, w * 3, 6);

      // Wide blade
      ctx.beginPath();
      ctx.moveTo(-w * 0.8, 8);
      ctx.lineTo(-w * 0.7, l - 12);
      ctx.lineTo(0, l);
      ctx.lineTo(w * 0.7, l - 12);
      ctx.lineTo(w * 0.8, 8);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-w, 0, w, 0);
      grad.addColorStop(0, edgeColor);
      grad.addColorStop(0.5, bladeColor);
      grad.addColorStop(1, edgeColor);
      ctx.fillStyle = grad;
      ctx.fill();

      // Fuller (center groove)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-w * 0.18, 12, w * 0.36, l - 24);

    } else if (type === 'saber') {
      // Laser Saber
      // Tech Hilt
      ctx.fillStyle = hiltColor;
      ctx.fillRect(-5, -16, 10, 18);
      ctx.fillStyle = '#78909c';
      ctx.fillRect(-6, -8, 12, 4);

      // Laser blade
      ctx.beginPath();
      ctx.arc(0, length, 5, 0, Math.PI, true);
      ctx.lineTo(-5, 2);
      ctx.lineTo(5, 2);
      ctx.closePath();

      ctx.fillStyle = bladeColor;
      ctx.shadowBlur = 24;
      ctx.shadowColor = glowColor;
      ctx.fill();

      // Core white heat
      ctx.beginPath();
      ctx.arc(0, length - 2, 2.5, 0, Math.PI, true);
      ctx.lineTo(-2.5, 2);
      ctx.lineTo(2.5, 2);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();

    } else if (type === 'rapier') {
      // Thin Rapier
      const l = length * 1.2;

      // Basket Hilt
      ctx.fillStyle = hiltColor;
      ctx.fillRect(-3, -12, 6, 14);

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI, false);
      ctx.stroke();

      // Needle Blade
      ctx.beginPath();
      ctx.moveTo(-2.5, 2);
      ctx.lineTo(0, l);
      ctx.lineTo(2.5, 2);
      ctx.closePath();

      ctx.fillStyle = bladeColor;
      ctx.shadowBlur = 10;
      ctx.fill();

    } else { // 'void' - Jagged demonic blade
      const l = length * 1.15;

      // Hilt
      ctx.fillStyle = '#12001e';
      ctx.fillRect(-4, -15, 8, 17);

      // Jagged Crossguard
      ctx.fillStyle = '#311b92';
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(14, 0);
      ctx.lineTo(0, -3);
      ctx.closePath();
      ctx.fill();

      // Serrated blade
      ctx.beginPath();
      ctx.moveTo(-5, 4);
      ctx.lineTo(-8, l * 0.35);
      ctx.lineTo(-3, l * 0.45);
      ctx.lineTo(-7, l * 0.75);
      ctx.lineTo(0, l);
      ctx.lineTo(7, l * 0.75);
      ctx.lineTo(3, l * 0.45);
      ctx.lineTo(8, l * 0.35);
      ctx.lineTo(5, 4);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, l);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.6, bladeColor);
      grad.addColorStop(1, edgeColor);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }

  // Animate preview canvas inside the modal
  renderPreview(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const skin = this.getSkin(this.currentEditingPlayer);

    ctx.save();
    ctx.translate(w / 2, h / 2 + 30);

    // Swing motion simulation
    this.previewSwingTime += 0.03;
    const swing = Math.sin(this.previewSwingTime) * 0.8 - Math.PI / 2;
    ctx.rotate(swing);

    this.drawSword(ctx, skin, 85, 9);
    ctx.restore();
  }
}

window.skins = new SkinManager();
