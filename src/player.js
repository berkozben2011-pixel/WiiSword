class Player {
  constructor(id, colorHex, startX) {
    this.id = id;
    this.colorHex = colorHex;
    this.mesh = new THREE.Group();
    this.mesh.position.set(startX, 0, 0);

    this.balance = 100.0;
    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isStunned = false;
    this.stunTimer = 0;
    this.isDefending = false;
    this.swingTimer = 0;
    this.swingSign = 1;

    this.createModel();
  }

  createModel() {
    const armorMaterial = new THREE.MeshStandardMaterial({ color: this.colorHex, roughness: 0.3, metalness: 0.8 });
    const jointMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

    // Gövde (Torso)
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.5, 12);
    this.torso = new THREE.Mesh(bodyGeo, armorMaterial);
    this.torso.position.y = 1.75;
    this.mesh.add(this.torso);

    // Baş (Head)
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    this.head = new THREE.Mesh(headGeo, armorMaterial);
    this.head.position.y = 1.1;
    this.torso.add(this.head);

    // Sağ Kol & Kılıç Pivotu (Right Arm & Sword Attachment)
    this.armPivot = new THREE.Group();
    this.armPivot.position.set(this.id === 1 ? 0.6 : -0.6, 0.5, 0);
    this.torso.add(this.armPivot);

    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8);
    const armMesh = new THREE.Mesh(armGeo, jointMaterial);
    armMesh.position.y = -0.4;
    this.armPivot.add(armMesh);

    // Kılıç (Sword Model)
    this.sword = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.08, 1.4, 0.03);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.7;

    const guardGeo = new THREE.BoxGeometry(0.3, 0.05, 0.1);
    const guard = new THREE.Mesh(guardGeo, armorMaterial);
    guard.position.y = 0.0;

    this.sword.add(blade);
    this.sword.add(guard);
    this.sword.position.set(0, -0.8, 0.2);
    this.armPivot.add(this.sword);

    // Bacaklar
    const legGeo = new THREE.CylinderGeometry(0.15, 0.12, 1.0);
    this.leftLeg = new THREE.Mesh(legGeo, jointMaterial);
    this.leftLeg.position.set(-0.25, -1.0, 0);
    this.rightLeg = new THREE.Mesh(legGeo, jointMaterial);
    this.rightLeg.position.set(0.25, -1.0, 0);
    this.torso.add(this.leftLeg);
    this.torso.add(this.rightLeg);
  }

  getSwordTipWorldPosition() {
    const tip = new THREE.Vector3(0, 1.4, 0);
    this.sword.localToWorld(tip);
    return tip;
  }

  getSwordBaseWorldPosition() {
    const base = new THREE.Vector3(0, 0, 0);
    this.sword.localToWorld(base);
    return base;
  }
}
