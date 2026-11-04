const Game = {
  scene: null,
  camera: null,
  renderer: null,
  player1: null,
  player2: null,
  isRunning: false,
  round: 1,
  p1Score: 0,
  p2Score: 0,
  sparks: [],

  init() {
    const container = document.getElementById('canvas-container');

    // 1. Sahne & Kamera Setup (2.5D Sabit Perspektif)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 3, 16);
    this.camera.lookAt(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // 2. Işıklandırma
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // 3. Arenanın Kurulumu
    this.createArena();

    // 4. Karakter Yüklemeleri
    this.resetRoundState();

    window.addEventListener('resize', () => this.onWindowResize());
    
    // Main Loop
    let lastTime = performance.now();
    const animate = (currentTime) => {
      requestAnimationFrame(animate);
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (this.isRunning) {
        this.update(delta);
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate(performance.now());
  },

  createArena() {
    // Ahşap/Taş Dövüş Platformu
    const platGeo = new THREE.BoxGeometry(15, 1, 4);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(0, -0.5, 0);
    platform.receiveShadow = true;
    this.scene.add(platform);

    // Kenar Görsel Çizgileri
    const edgeGeo = new THREE.BoxGeometry(15.2, 0.1, 4.2);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, -0.05, 0);
    this.scene.add(edge);
  },

  resetRoundState() {
    if (this.player1) this.scene.remove(this.player1.mesh);
    if (this.player2) this.scene.remove(this.player2.mesh);

    this.player1 = new Player(1, 0x3b82f6, -3);
    this.player2 = new Player(2, 0xef4444, 3);

    this.scene.add(this.player1.mesh);
    this.scene.add(this.player2.mesh);
  },

  startNewMatch() {
    this.p1Score = 0;
    this.p2Score = 0;
    this.round = 1;
    UI.updateScore(0, 0, 1);
    this.startRoundCountdown();
  },

  startRoundCountdown() {
    this.isRunning = false;
    this.resetRoundState();
    UI.showCountdown(3, () => {
      this.isRunning = true;
    });
  },

  update(delta) {
    // Input Alma ve Kılıç Kontrolü
    const inputP1 = InputManager.consumeInput(1);
    const inputP2 = InputManager.consumeInput(2);

    CombatEngine.updatePlayerInput(this.player1, inputP1, delta);
    CombatEngine.updatePlayerInput(this.player2, inputP2, delta);

    // Fizik ve Kenar Düşüşü
    PhysicsEngine.update(this.player1, this.player2, delta);

    this.player1.mesh.position.x = THREE.MathUtils.clamp(this.player1.mesh.position.x, -7.3, 7.3);
    this.player2.mesh.position.x = THREE.MathUtils.clamp(this.player2.mesh.position.x, -7.3, 7.3);

    // Kılıç Temas & Çarpışma Tespiti
    CollisionEngine.checkCollisions(this.player1, this.player2);

    // Takipçi Kamera (Dövüşün Merkezine Odaklanma)
    const midX = (this.player1.mesh.position.x + this.player2.mesh.position.x) / 2;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, midX * 0.5, 0.05);

    // UI Güncelleme
    UI.updateBalance(this.player1.balance, this.player2.balance);

    // Efekt Güncellemeleri
    this.updateSparks(delta);
  },

  createSparkEffect(pos) {
    const pGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(pos);
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 6,
        (Math.random() - 0.5) * 6
      );
      p.userData.life = 0.25;
      this.scene.add(p);
      this.sparks.push(p);
    }
  },

  updateSparks(delta) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.position.addScaledVector(s.userData.vel, delta);
      s.userData.life -= delta;
      if (s.userData.life <= 0) {
        this.scene.remove(s);
        this.sparks.splice(i, 1);
      }
    }
  },

  onPlayerFall(fallenPlayer) {
    this.isRunning = false;
    if (fallenPlayer.id === 1) this.p2Score++;
    else this.p1Score++;

    UI.updateScore(this.p1Score, this.p2Score, this.round);

    if (this.p1Score >= 2 || this.p2Score >= 2) {
      const winnerName = this.p1Score >= 2 ? "MAVİ OYUN CU" : "KIRMIZI OYUN CU";
      UI.showMatchEnd(winnerName);
    } else {
      this.round++;
      setTimeout(() => this.startRoundCountdown(), 2000);
    }
  },

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

window.onload = () => Game.init();
