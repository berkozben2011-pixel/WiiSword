const CollisionEngine = {
  checkCollisions(p1, p2) {
    const p1Base = p1.getSwordBaseWorldPosition();
    const p1Tip = p1.getSwordTipWorldPosition();
    
    const p2Base = p2.getSwordBaseWorldPosition();
    const p2Tip = p2.getSwordTipWorldPosition();

    // 1. Kılıç - Kılıç Çarpışması
    const swordDist = this.distanceSegmentToSegment(p1Base, p1Tip, p2Base, p2Tip);
    if (swordDist < 0.35) {
      this.handleSwordClash(p1, p2, p1Tip);
      return;
    }

    // 2. Kılıç - Karakter Gövdesi Çarpışması
    this.checkBodyHit(p1, p2);
    this.checkBodyHit(p2, p1);
  },

  handleSwordClash(p1, p2, sparkPos) {
    AudioManager.playClash();
    Game.createSparkEffect(sparkPos);

    // Karşılıklı geri tepme fiziği
    const dir = p1.mesh.position.x < p2.mesh.position.x ? -1 : 1;
    PhysicsEngine.applyKnockback(p1, dir, 2.5);
    PhysicsEngine.applyKnockback(p2, -dir, 2.5);
  },

  checkBodyHit(attacker, victim) {
    const attTip = attacker.getSwordTipWorldPosition();
    const victimBodyPos = victim.mesh.position.clone().add(new THREE.Vector3(0, 1.75, 0));

    if (attTip.distanceTo(victimBodyPos) < 0.75) {
      if (victim.isDefending) {
        // Başarılı Savunma
        AudioManager.playClash();
        const repulseDir = attacker.mesh.position.x < victim.mesh.position.x ? -1 : 1;
        PhysicsEngine.applyKnockback(attacker, repulseDir, 4.0);
      } else {
        // Darbe Alma
        AudioManager.playHit();
        const hitDir = attacker.mesh.position.x < victim.mesh.position.x ? 1 : -1;
        PhysicsEngine.applyKnockback(victim, hitDir, 7.5);
      }
    }
  },

  // 3D Doğru Parçası En Kısa Mesafe Algoritması
  distanceSegmentToSegment(p1, p2, p3, p4) {
    const u = p2.clone().sub(p1);
    const v = p4.clone().sub(p3);
    const w = p1.clone().sub(p3);
    const a = u.dot(u), b = u.dot(v), c = v.dot(v), d = u.dot(w), e = v.dot(w);
    const D = a * c - b * b;
    let sc, sN, sD = D, tc, tN, tD = D;

    if (D < 0.0001) { sN = 0.0; sD = 1.0; tN = e; tD = c; }
    else {
      sN = (b * e - c * d); tN = (a * e - b * d);
      if (sN < 0.0) { sN = 0.0; tN = e; tD = c; }
      else if (sN > sD) { sN = sD; tN = e + b; tD = c; }
    }
    if (tN < 0.0) {
      tN = 0.0;
      if (-d < 0.0) sN = 0.0;
      else if (-d > a) sN = sD;
      else { sN = -d; sD = a; }
    } else if (tN > tD) {
      tN = tD;
      if ((-d + b) < 0.0) sN = 0.0;
      else if ((-d + b) > a) sN = sD;
      else { sN = (-d + b); sD = a; }
    }
    sc = (Math.abs(sN) < 0.0001 ? 0.0 : sN / sD);
    tc = (Math.abs(tN) < 0.0001 ? 0.0 : tN / tD);
    const dP = w.add(u.multiplyScalar(sc)).sub(v.multiplyScalar(tc));
    return dP.length();
  }
};
