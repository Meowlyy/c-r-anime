// Local player state — hand of 4 cards, elixir bar, deck cycling, deployment.
class Player extends GameObject {
  constructor(team) {
    super(0, 0, 0, 0);
    this.name = 'Player';
    this.team = team;
    this.elixir = 5;
    this.maxElixir = 10;
    this.elixirRate = 1 / 2.8; // 1 elixir per 2.8s
    this.deck = ['swordmaiden', 'archer', 'mage', 'tank', 'ninja', 'healer', 'dragon', 'swordmaiden'];
    this.shuffle(this.deck);
    this.hand = this.deck.splice(0, 4);
    this.next = this.deck.shift();
    this.wispcoins = 250;
    this.selectedHandIndex = -1;
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

  canPlay(handIndex) {
    const cardId = this.hand[handIndex];
    if (!cardId) return false;
    const card = Card.get(cardId);
    return this.elixir >= card.cost;
  }

  playCard(handIndex) {
    const cardId = this.hand[handIndex];
    if (!cardId) return null;
    const card = Card.get(cardId);
    if (this.elixir < card.cost) return null;
    this.elixir -= card.cost;
    // Cycle: next -> hand slot, deck end gets old card
    this.hand[handIndex] = this.next;
    this.deck.push(cardId);
    this.next = this.deck.shift();
    this.selectedHandIndex = -1;
    return cardId;
  }

  addCardToDeck(cardId) {
    this.deck.push(cardId);
  }

  draw(ctx) { /* rendered via UI */ }
}
