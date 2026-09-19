// 2D Battle Camera with Mouse Wheel Zoom & Fighter Tracking

class BattleCamera {
  constructor(viewportWidth, viewportHeight, arenaWidth = 1400, arenaHeight = 700) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    this.x = arenaWidth / 2;
    this.y = arenaHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    // Zoom properties
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.minZoom = 0.55;
    this.maxZoom = 1.75;
    this.autoZoom = true;

    // Pan offset for manual mouse drag
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  attachEvents(canvas) {
    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom + zoomDelta));
      this.autoZoom = false; // User manually adjusted zoom
    }, { passive: false });

    // Right-click or middle-click drag to pan
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = (e.clientX - this.lastMouseX) / this.zoom;
        const dy = (e.clientY - this.lastMouseY) / this.zoom;
        this.panOffsetX -= dx;
        this.panOffsetY -= dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.isDragging = false;
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Double click to reset zoom & pan
    canvas.addEventListener('dblclick', () => {
      this.resetView();
    });
  }

  zoomIn() {
    this.targetZoom = Math.min(this.maxZoom, this.targetZoom + 0.15);
    this.autoZoom = false;
  }

  zoomOut() {
    this.targetZoom = Math.max(this.minZoom, this.targetZoom - 0.15);
    this.autoZoom = false;
  }

  resetView() {
    this.targetZoom = 1.0;
    this.panOffsetX = 0;
    this.panOffsetY = 0;
    this.autoZoom = true;
  }

  update(f1, f2) {
    // Smooth zoom interpolation
    this.zoom += (this.targetZoom - this.zoom) * 0.12;

    // Track fighters midpoint
    const midX = (f1.x + f1.width / 2 + f2.x + f2.width / 2) / 2;
    const midY = (f1.y + f1.height / 2 + f2.y + f2.height / 2) / 2;

    this.targetX = midX + this.panOffsetX;
    this.targetY = midY + this.panOffsetY;

    // Smooth camera tracking
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;
  }

  apply(ctx, screenShake = 0) {
    ctx.save();

    // Center viewport
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2);

    // Apply Screen Shake if active
    if (screenShake > 0) {
      const shakeX = (Math.random() * 2 - 1) * screenShake;
      const shakeY = (Math.random() * 2 - 1) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Apply Zoom
    ctx.scale(this.zoom, this.zoom);

    // Translate to camera focus
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }
}

window.BattleCamera = BattleCamera;
