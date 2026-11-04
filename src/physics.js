const PhysicsEngine = {
  PLATFORM_MIN_X: -7.5,
  PLATFORM_MAX_X: 7.5,
  GRAVITY: -25.0,

  update(player1, player2, delta) {
    [player1, player2].forEach(p => {
      // Yerçekimi ve İtme Kuvveti Uygulama
      p.mesh.position.x += p.velocity.x * delta;
      p.mesh.position.y += p.velocity.y * delta;

      // Sürtünme Sönümlemesi
      p.velocity.x *= 0.85;

      // Platform Sınırı Kontrolü
      if (p.mesh.position.x < this.PLATFORM_MIN_X || p.mesh.position.x > this.PLATFORM_MAX_X) {
        p.isGrounded = false;
      }

      if (!p.isGrounded) {
        p.velocity.y += this.GRAVITY * delta;
        p.mesh.rotation.z += (p.id === 1 ? -1 : 1) * 3.0 * delta; // Düşüş taklası
        if (p.mesh.position.y < -10 && !p.hasFallen) {
          p.hasFallen = true;
          AudioManager.playFall();
          Game.onPlayerFall(p);
        }
      } else {
        p.mesh.position.y = 0;
      }
    });
  },

  applyKnockback(targetPlayer, forceDirection, magnitude) {
    targetPlayer.velocity.x += forceDirection * magnitude;
    targetPlayer.balance = Math.max(0, targetPlayer.balance - magnitude * 5);
    targetPlayer.isStunned = true;
    targetPlayer.stunTimer = 0.25; // 250ms darbe sersemlemesi
  }
};
