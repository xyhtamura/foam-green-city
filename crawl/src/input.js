// Input handling for foam-green-crawl.
// Listens to keyboard (WASD / arrows / RF), on-screen D-pad and level buttons,
// and grid cell clicks for travel or inspection.
// Adheres strictly to the stillness rule: zero timers or rAF loops.

export function setupInput({ onNavigate, onCellClick }) {
  // Keyboard movement: WASD / Arrows, RF for vertical stairs
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        onNavigate('north');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        onNavigate('south');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        onNavigate('west');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        onNavigate('east');
        break;
      case 'PageUp':
      case 'r':
      case 'R':
      case 'u':
      case 'U':
        e.preventDefault();
        onNavigate('up');
        break;
      case 'PageDown':
      case 'f':
      case 'F':
        e.preventDefault();
        onNavigate('down');
        break;
    }
  });

  // On-screen direction pad and stair buttons
  const padUp = document.getElementById('pad-up');
  const padDown = document.getElementById('pad-down');
  const padLeft = document.getElementById('pad-left');
  const padRight = document.getElementById('pad-right');
  const padUpStair = document.getElementById('pad-up-stair');
  const padDownStair = document.getElementById('pad-down-stair');

  if (padUp) padUp.addEventListener('click', (e) => { e.preventDefault(); onNavigate('north'); });
  if (padDown) padDown.addEventListener('click', (e) => { e.preventDefault(); onNavigate('south'); });
  if (padLeft) padLeft.addEventListener('click', (e) => { e.preventDefault(); onNavigate('west'); });
  if (padRight) padRight.addEventListener('click', (e) => { e.preventDefault(); onNavigate('east'); });
  if (padUpStair) padUpStair.addEventListener('click', (e) => { e.preventDefault(); onNavigate('up'); });
  if (padDownStair) padDownStair.addEventListener('click', (e) => { e.preventDefault(); onNavigate('down'); });

  // Grid cell clicks
  const gridEl = document.getElementById('grid');
  if (gridEl) {
    gridEl.addEventListener('click', (e) => {
      const target = e.target.closest('[data-x]');
      if (!target) return;
      const x = parseInt(target.getAttribute('data-x'), 10);
      const y = parseInt(target.getAttribute('data-y'), 10);
      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        onCellClick(x, y);
      }
    });
  }
}
