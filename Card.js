// Card catalog — defines every anime character card the player can deploy.
class Card {
  constructor(id, config) {
    this.id = id;
    this.name = config.name;
    this.cost = config.cost;
    this.spriteId = config.spriteId;
    this.enemySpriteId = config.enemySpriteId;
    this.hp = config.hp;
    this.damage = config.damage;
    this.speed = config.speed;
    this.range = config.range;
    this.attackSpeed = config.attackSpeed;
    this.count = config.count || 1;
    this.size = config.size || 30;
    this.description = config.description || '';
    this.targetsAir = config.targetsAir !== false;
    this.projectileSprite = config.projectileSprite || null;
    this.isHealer = config.isHealer || false;
    this.splashRadius = config.splashRadius || 0;
  }

  static getCatalog() {
    if (!Card._catalog) {
      Card._catalog = {
        swordmaiden: new Card('swordmaiden', {
          name: 'Sword Maiden',
          cost: 3,
          spriteId: 'unit_swordmaiden',
          enemySpriteId: 'enemy_swordmaiden',
          hp: 340, damage: 65, speed: 55, range: 30, attackSpeed: 1.1,
          description: 'Balanced melee fighter with a keen blade.',
        }),
        archer: new Card('archer', {
          name: 'Twin Archers',
          cost: 3,
          spriteId: 'unit_archer',
          enemySpriteId: 'enemy_archer',
          hp: 140, damage: 50, speed: 60, range: 180, attackSpeed: 1.0,
          count: 2,
          projectileSprite: 'arrow',
          description: 'Two nimble archers with long range.',
        }),
        mage: new Card('mage', {
          name: 'Spell Weaver',
          cost: 4,
          spriteId: 'unit_mage',
          enemySpriteId: 'enemy_mage',
          hp: 220, damage: 110, speed: 55, range: 160, attackSpeed: 1.5,
          projectileSprite: 'magicOrb',
          splashRadius: 40,
          description: 'Powerful splash-damage caster.',
        }),
        tank: new Card('tank', {
          name: 'Iron Guardian',
          cost: 5,
          spriteId: 'unit_tank',
          enemySpriteId: 'enemy_tank',
          hp: 900, damage: 80, speed: 40, range: 30, attackSpeed: 1.5,
          size: 34,
          description: 'High HP frontline tank.',
        }),
        ninja: new Card('ninja', {
          name: 'Shadow Ninja',
          cost: 3,
          spriteId: 'unit_ninja',
          enemySpriteId: 'enemy_ninja',
          hp: 260, damage: 90, speed: 90, range: 30, attackSpeed: 0.8,
          description: 'Fast striker that hits hard.',
        }),
        healer: new Card('healer', {
          name: 'Shrine Maiden',
          cost: 4,
          spriteId: 'unit_healer',
          enemySpriteId: 'enemy_healer',
          hp: 200, damage: 25, speed: 55, range: 140, attackSpeed: 1.2,
          projectileSprite: 'magicOrb',
          isHealer: true,
          description: 'Heals nearby allies. Weak attacks.',
        }),
        dragon: new Card('dragon', {
          name: 'Sky Dragon',
          cost: 6,
          spriteId: 'unit_dragon',
          enemySpriteId: 'enemy_dragon',
          hp: 600, damage: 130, speed: 65, range: 150, attackSpeed: 1.4,
          size: 40,
          projectileSprite: 'fireball',
          splashRadius: 25,
          description: 'Legendary dragon with fiery breath.',
        }),
      };
    }
    return Card._catalog;
  }

  static get(id) { return Card.getCatalog()[id]; }

  static list() { return Object.values(Card.getCatalog()); }
}
