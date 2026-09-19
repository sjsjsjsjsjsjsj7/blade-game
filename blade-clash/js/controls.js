// Keyboard Controls & Rebinding System

class ControlsManager {
  constructor() {
    this.defaultBindings = {
      p1: {
        left: 'KeyA',
        right: 'KeyD',
        jump: 'KeyW',
        block: 'KeyS',
        attack: 'KeyJ',
        heavy: 'KeyK',
        dash: 'KeyL'
      },
      p2: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp',
        block: 'ArrowDown',
        attack: 'Numpad1',
        heavy: 'Numpad2',
        dash: 'Numpad3'
      }
    };

    this.bindings = this.loadBindings();
    this.keysDown = new Set();
    this.rebindTarget = null; // { player: 'p1', action: 'left', btn: element }

    this.initListeners();
  }

  loadBindings() {
    try {
      const saved = localStorage.getItem('blade_clash_keybinds');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load keybinds', e);
    }
    return JSON.parse(JSON.stringify(this.defaultBindings));
  }

  saveBindings() {
    try {
      localStorage.setItem('blade_clash_keybinds', JSON.stringify(this.bindings));
    } catch (e) {
      console.warn('Failed to save keybinds', e);
    }
  }

  resetToDefaults(playerKey) {
    if (playerKey) {
      this.bindings[playerKey] = JSON.parse(JSON.stringify(this.defaultBindings[playerKey]));
    } else {
      this.bindings = JSON.parse(JSON.stringify(this.defaultBindings));
    }
    this.saveBindings();
  }

  formatKeyName(code) {
    if (!code) return '---';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code === 'Space') return 'Space';
    if (code === 'ShiftLeft') return 'L-Shift';
    if (code === 'ShiftRight') return 'R-Shift';
    if (code === 'ControlLeft') return 'L-Ctrl';
    if (code === 'ControlRight') return 'R-Ctrl';
    return code;
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      // Rebinding intercept
      if (this.rebindTarget) {
        e.preventDefault();
        const { player, action, btn } = this.rebindTarget;
        this.bindings[player][action] = e.code;
        this.saveBindings();
        if (btn) {
          btn.textContent = this.formatKeyName(e.code);
          btn.classList.remove('rebinding');
        }
        this.rebindTarget = null;
        return;
      }

      // Normal keys
      this.keysDown.add(e.code);

      // Prevent scrolling on arrow keys or space during game
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    // Clear stuck keys on window blur
    window.addEventListener('blur', () => {
      this.keysDown.clear();
    });
  }

  isActionActive(playerKey, action) {
    const bind = this.bindings[playerKey]?.[action];
    if (!bind) return false;
    return this.keysDown.has(bind);
  }

  startRebind(playerKey, action, buttonEl) {
    // Cancel any previous rebind
    if (this.rebindTarget && this.rebindTarget.btn) {
      this.rebindTarget.btn.classList.remove('rebinding');
      const prev = this.bindings[this.rebindTarget.player][this.rebindTarget.action];
      this.rebindTarget.btn.textContent = this.formatKeyName(prev);
    }

    this.rebindTarget = { player: playerKey, action, btn: buttonEl };
    buttonEl.textContent = '누를 키 입력...';
    buttonEl.classList.add('rebinding');
  }
}

window.controls = new ControlsManager();
