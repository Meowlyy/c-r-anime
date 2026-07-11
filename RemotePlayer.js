// Placeholder for future multiplayer opponent state (used by AI turn today).
class RemotePlayer extends GameObject {
  constructor(team) {
    super(0, 0, 0, 0);
    this.name = 'RemotePlayer';
    this.team = team;
    this.elixir = 5;
    this.maxElixir = 10;
    this.elixirRate = 1 / 2.8;
    this.deck = ['swordmaiden', 'archer', 'mage', 'tank', 'ninja', 'healer', 'dragon', 'archer'];
    this.shuffle(this.deck);
    this.hand = this.deck.splice(0, 4);
    this.next = this.deck.shift();
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  update(dt) {
    this.elixir = Math.min(this.maxElixir, this.elixir + this.elixirRate * dt);
  }

  playCardAt(handIndex) {
    const cardId = this.hand[handIndex];
    if (!cardId) return null;
    const card = Card.get(cardId);
    if (this.elixir < card.cost) return null;
    this.elixir -= card.cost;
    this.hand[handIndex] = this.next;
    this.deck.push(cardId);
    this.next = this.deck.shift();
    return cardId;
  }

  draw(ctx) { }
}
