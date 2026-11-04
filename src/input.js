(function () {
  const blank = () => ({ x: 0, y: 0, moveX: 0, moveY: 0, isDefending: false, isMoving: false, attack: false });
  const InputManager = {
    states: { 1: blank(), 2: blank() },
    keys: new Set(),
    keyboardAttackPulse: { 1: false, 2: false },
    gamepadAttackHeld: { 1: false, 2: false },
    gamepadDefending: { 1: false, 2: false },
    rawAvailable: false,
    player1Device: null,
    player2Device: null,
    assigningForPlayer: null,
    socket: null,
    phoneRoomCode: null,
    phoneConnected: 0,
    gamepadIndexes: { 1: null, 2: null },
    lastMouseAt: 0,

    init() {
      window.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
        if (!this.keys.has(key)) {
          if (key === 'w') this.keyboardAttackPulse[1] = true;
          if (key === 'arrowup') this.keyboardAttackPulse[2] = true;
        }
        this.keys.add(key);
      });
      window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.keys.clear());

      // Browser fallback: the single system pointer controls P1 only. Two independent mice require Electron Raw Input.
      let ipc = null;
      if (typeof require === 'function') {
        try {
          const electron = require('electron');
          ipc = electron && electron.ipcRenderer;
        } catch (_) { /* normal browser */ }
      }
      if (ipc) {
        ipc.on('raw-mouse-input', (_event, data) => this.handleRawInput(data));
        ipc.on('raw-input-status', (_event, enabled) => {
          this.rawAvailable = !!enabled;
          if (!this.rawAvailable) this.attachBrowserMouse();
          this.refreshDeviceStatus();
        });
      } else {
        this.attachBrowserMouse();
      }

      window.addEventListener('gamepadconnected', e => this.updateGamepadAssignments());
      window.addEventListener('gamepaddisconnected', e => this.updateGamepadAssignments());
      const serverUrl = window.SWORD_DUEL_CONFIG?.SOCKET_SERVER_URL;
      if (serverUrl && !serverUrl.includes('YOUR-RENDER-SERVICE')) this.connectSocket(serverUrl);
      this.updateGamepadAssignments();
      this.refreshDeviceStatus();
    },

    attachBrowserMouse() {
      if (this.browserMouseAttached) return;
      this.browserMouseAttached = true;
      window.addEventListener('mousemove', e => {
        this.states[1].x += e.movementX || 0;
        this.states[1].y += e.movementY || 0;
        this.lastMouseAt = performance.now();
      });
      window.addEventListener('mousedown', e => {
        if (e.button === 0) this.states[1].isDefending = true;
        if (e.button === 1) this.states[1].isMoving = true;
      });
      window.addEventListener('mouseup', e => {
        if (e.button === 0) this.states[1].isDefending = false;
        if (e.button === 1) this.states[1].isMoving = false;
      });
    },

    connectSocket(url) {
      if (typeof io !== 'function') return;
      this.socket = io(url, { transports: ['websocket', 'polling'] });
      this.socket.on('controller:input', data => {
        const p = Number(data.playerNum);
        if (p !== 1 && p !== 2) return;
        const s = this.states[p];
        s.x += Number(data.x) || 0;
        s.y += Number(data.y) || 0;
        s.isDefending = !!data.isDefending;
        s.moveX = Number(data.moveX) || 0;
        s.isMoving = !!data.isMoving;
        s.attack = s.attack || !!data.attack;
      });
      this.socket.on('controller:status', data => {
        this.phoneConnected = data.count || 0;
        this.refreshDeviceStatus();
      });
    },

    createPhoneRoom() {
      if (!this.socket) {
        alert('Telefon bağlantısı için önce config.js dosyasına Render sunucu adresini yazıp projeyi yayınlayın.');
        return;
      }
      if (!this.socket.connected) {
        const codeEl = document.getElementById('phone-room-code');
        if (codeEl) codeEl.textContent = 'Sunucuya bağlanılıyor...';
        this.socket.once('connect', () => this._createPhoneRoom());
        return;
      }
      this._createPhoneRoom();
    },

    _createPhoneRoom() {
      this.socket.emit('host:create-room', result => {
        if (!result?.ok) return alert('Telefon odası oluşturulamadı.');
        this.phoneRoomCode = result.code;
        const codeEl = document.getElementById('phone-room-code');
        if (codeEl) codeEl.textContent = result.code;
        const url = new URL('controller.html', window.location.href);
        url.searchParams.set('server', window.SWORD_DUEL_CONFIG.SOCKET_SERVER_URL);
        const link = document.getElementById('phone-controller-link');
        if (link) { link.href = url.href; link.textContent = url.href; }
        const qr = document.getElementById('phone-qr');
        if (qr && window.QRCode) { qr.innerHTML = ''; new QRCode(qr, { text: url.href, width: 160, height: 160 }); }
      });
    },

    assignNextMouse(playerNum) {
      this.assigningForPlayer = playerNum;
      const el = document.getElementById(`p${playerNum}-device-status`);
      if (el) el.textContent = 'Şimdi bu mouse\'u hareket ettirin...';
    },

    handleRawInput(data) {
      const id = String(data.deviceId);
      if (this.assigningForPlayer) {
        const other = this.assigningForPlayer === 1 ? this.player2Device : this.player1Device;
        if (id === other) { alert('Bu mouse diğer oyuncuya atanmış.'); return; }
        if (this.assigningForPlayer === 1) this.player1Device = id; else this.player2Device = id;
        this.assigningForPlayer = null;
        this.refreshDeviceStatus();
        return;
      }
      if (!this.player1Device) this.player1Device = id;
      else if (!this.player2Device && id !== this.player1Device) this.player2Device = id;
      const p = id === this.player1Device ? 1 : id === this.player2Device ? 2 : 0;
      if (!p) return;
      const s = this.states[p];
      s.x += data.deltaX || 0; s.y += data.deltaY || 0;
      if (data.leftState === 1) s.isDefending = true;
      if (data.leftState === 0) s.isDefending = false;
      if (data.middleState === 1) s.isMoving = true;
      if (data.middleState === 0) s.isMoving = false;
    },

    refreshDeviceStatus() {
      const p1 = document.getElementById('p1-device-status');
      const p2 = document.getElementById('p2-device-status');
      if (p1) p1.textContent = this.player1Device ? 'Mouse 1 tanımlandı' : (this.rawAvailable ? 'Mouse bekleniyor' : 'Tarayıcı mouse: P1');
      if (p2) p2.textContent = this.player2Device ? 'Mouse 2 tanımlandı' : (this.rawAvailable ? 'Mouse bekleniyor' : 'İkinci mouse için Electron gerekir');
      const phone = document.getElementById('phone-status');
      if (phone) phone.textContent = `${this.phoneConnected} telefon bağlı`;
    },

    updateGamepadAssignments() {
      const pads = Array.from(navigator.getGamepads?.() || []).filter(Boolean);
      this.gamepadIndexes[1] = pads[0]?.index ?? null;
      this.gamepadIndexes[2] = pads[1]?.index ?? null;
      const el = document.getElementById('gamepad-status');
      if (el) el.textContent = `${pads.length} gamepad bulundu`;
    },

    pollGamepads() {
      const pads = navigator.getGamepads?.() || [];
      for (const p of [1, 2]) {
        const index = this.gamepadIndexes[p];
        if (index == null || !pads[index]) continue;
        const pad = pads[index], s = this.states[p];
        const dead = v => Math.abs(v) < 0.16 ? 0 : v;
        s.moveX = dead(pad.axes[0] || 0);
        s.x += dead(pad.axes[2] || 0) * 9;
        s.y += dead(pad.axes[3] || 0) * 9;
        this.gamepadDefending[p] = !!pad.buttons[6]?.pressed;
        const attackHeld = !!pad.buttons[7]?.pressed || !!pad.buttons[0]?.pressed;
        if (attackHeld && !this.gamepadAttackHeld[p]) s.attack = true;
        this.gamepadAttackHeld[p] = attackHeld;
      }
    },

    consumeInput(playerNum) {
      this.pollGamepads();
      const s = this.states[playerNum];
      const keys = this.keys;
      let moveX = s.moveX;
      let attack = s.attack;
      let defending = s.isDefending || this.gamepadDefending[playerNum];
      if (playerNum === 1) {
        if (keys.has('a')) moveX -= 1;
        if (keys.has('d')) moveX += 1;
        if (this.keyboardAttackPulse[1]) attack = true;
        if (keys.has('s')) defending = true;
      } else {
        if (keys.has('arrowleft')) moveX -= 1;
        if (keys.has('arrowright')) moveX += 1;
        if (this.keyboardAttackPulse[2]) attack = true;
        if (keys.has('arrowdown')) defending = true;
      }
      const result = { x: s.x, y: s.y, moveX: Math.max(-1, Math.min(1, moveX)), isDefending: defending, isMoving: s.isMoving, attack };
      s.x = 0; s.y = 0; s.moveX = 0; s.attack = false;
      this.keyboardAttackPulse[playerNum] = false;
      return result;
    }
  };
  window.InputManager = InputManager;
  InputManager.init();
})();
