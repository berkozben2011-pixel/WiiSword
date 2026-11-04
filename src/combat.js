const CombatEngine = {
  updatePlayerInput(player, input, delta) {
    if (player.isStunned) {
      player.stunTimer -= delta;
      if (player.stunTimer <= 0) player.isStunned = false;
      return;
    }

    const move = Math.max(-1, Math.min(1, input.moveX || 0));
    if (move) player.mesh.position.x += move * 4.2 * delta;

    if (input.isMoving) player.mesh.position.x += (input.y || 0) * 0.008;

    player.isDefending = !!input.isDefending;
    if (player.isDefending) {
      player.armPivot.rotation.z = THREE.MathUtils.lerp(player.armPivot.rotation.z, Math.PI / 2, 0.22);
      player.armPivot.rotation.x = THREE.MathUtils.lerp(player.armPivot.rotation.x, 0, 0.22);
      return;
    }

    const sensitivity = 0.006;
    if (Math.abs(input.x) > 0 || Math.abs(input.y) > 0) {
      player.armPivot.rotation.z -= input.x * sensitivity;
      player.armPivot.rotation.x += input.y * sensitivity;
      if (Math.abs(input.x) > 5 || Math.abs(input.y) > 5) AudioManager.playSwing();
    }

    if (input.attack) {
      player.swingTimer = 0.22;
      player.swingSign = player.id === 1 ? -1 : 1;
      AudioManager.playSwing();
    }
    if (player.swingTimer > 0) {
      player.swingTimer -= delta;
      const t = Math.max(0, player.swingTimer / 0.22);
      player.armPivot.rotation.z = THREE.MathUtils.lerp(player.armPivot.rotation.z, player.swingSign * (0.9 + (1 - t) * 0.45), 0.55);
    }
    player.armPivot.rotation.z = THREE.MathUtils.clamp(player.armPivot.rotation.z, -Math.PI / 1.5, Math.PI / 1.5);
    player.armPivot.rotation.x = THREE.MathUtils.clamp(player.armPivot.rotation.x, -Math.PI / 2, Math.PI / 2);
  }
};
