const UI = {
  startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    Game.startNewMatch();
  },

  showSettings() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('settings-menu').classList.remove('hidden');
    InputManager.updateGamepadAssignments();
    InputManager.refreshDeviceStatus();
  },

  hideSettings() {
    document.getElementById('settings-menu').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
  },

  updateBalance(p1Val, p2Val) {
    document.getElementById('p1-balance').style.width = `${p1Val}%`;
    document.getElementById('p2-balance').style.width = `${p2Val}%`;
  },

  updateScore(p1, p2, round) {
    document.getElementById('score-text').innerText = `${p1} - ${p2}`;
    document.getElementById('round-info').innerText = `RAUND ${round}`;
  },

  showCountdown(seconds, callback) {
    const announcer = document.getElementById('announcer');
    announcer.style.display = 'block';
    let current = seconds;
    announcer.innerText = current;

    const interval = setInterval(() => {
      current--;
      if (current > 0) {
        announcer.innerText = current;
      } else if (current === 0) {
        announcer.innerText = "BAŞLA!";
      } else {
        clearInterval(interval);
        announcer.style.display = 'none';
        if (callback) callback();
      }
    }, 1000);
  },

  showMatchEnd(winnerName) {
    const announcer = document.getElementById('announcer');
    announcer.style.display = 'block';
    announcer.innerText = `${winnerName} KAZANDI!`;
    setTimeout(() => {
      announcer.style.display = 'none';
      document.getElementById('main-menu').classList.remove('hidden');
    }, 4000);
  },

  exitGame() {
    window.close();
  }
};
