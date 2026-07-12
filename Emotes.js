// In-battle emote wheel — Clash-Royale-style: a small round button that
// opens a fan of emote images; tapping one pops a big bubble version of it
// near the player's side of the arena for a couple seconds.
// Self-contained: builds its own DOM inside #ui-layer, independent of the
// UI.js helper (which only does text/box widgets, no images). Hidden by
// default; index.html calls .show() once a battle actually starts, mirroring
// how #menu-back-btn / #gameCanvas are toggled there.
const EMOTES = [
  { id: 'goblin_red', name: 'Frecher Goblin', src: 'assets/gameemojis/emotes_goblin_refereered_dl.png' },
  { id: 'goblin_yellow', name: 'Goblin-Schiri', src: 'assets/gameemojis/emotes_goblin_refereeyellow_dl.png' },
  { id: 'princess_heart', name: 'Herzchen', src: 'assets/gameemojis/emotes_princessevo_fingerheart_dl.png' },
  { id: 'wizard_fire', name: 'Feuer-Magier', src: 'assets/gameemojis/emotes_wizardhero_fire_dl.png' },
];

class EmoteWheel {
  constructor() {
    this.layer = document.getElementById('ui-layer');
    this.open = false;
    this.build();
  }

  build() {
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'emote-toggle-btn';
    this.toggleBtn.title = 'Emotes';
    this.toggleBtn.textContent = '😀';
    this.toggleBtn.style.display = 'none';
    this.toggleBtn.onclick = (e) => { e.stopPropagation(); this.togglePanel(); };
    this.layer.appendChild(this.toggleBtn);

    this.panel = document.createElement('div');
    this.panel.id = 'emote-panel';
    this.panel.style.display = 'none';
    EMOTES.forEach((emote) => {
      const opt = document.createElement('button');
      opt.className = 'emote-option';
      opt.title = emote.name;
      opt.innerHTML = `<img src="${emote.src}" alt="${emote.name}">`;
      opt.onclick = (e) => { e.stopPropagation(); this.fire(emote); };
      this.panel.appendChild(opt);
    });
    this.layer.appendChild(this.panel);

    // Tapping anywhere else closes the panel.
    document.addEventListener('click', () => { if (this.open) this.togglePanel(); });
  }

  togglePanel() {
    this.open = !this.open;
    this.panel.style.display = this.open ? 'flex' : 'none';
    this.toggleBtn.classList.toggle('active', this.open);
  }

  fire(emote) {
    this.togglePanel();

    const bubble = document.createElement('div');
    bubble.className = 'emote-bubble';
    bubble.innerHTML = `<img src="${emote.src}" alt="${emote.name}">`;
    this.layer.appendChild(bubble);

    // Force reflow so the pop-in animation always plays, then remove after it fades.
    void bubble.offsetWidth;
    bubble.classList.add('emote-bubble--show');
    setTimeout(() => bubble.remove(), 2200);
  }

  show() { this.toggleBtn.style.display = 'flex'; }
  hide() {
    this.toggleBtn.style.display = 'none';
    if (this.open) this.togglePanel();
  }
}

window.EmoteWheel = EmoteWheel;
