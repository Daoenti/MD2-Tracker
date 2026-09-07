// Autocomplete-only reference lists, ported verbatim from the original client. No persistence.

export const MOB_NAMES = [
  'Demons', 'Fallen Angels', 'Fire Entities', 'Gargoyles', 'Infernal Imps', 'Satyrs', 'Skeletons', 'Undead',
  'Abomination and Runners', 'Corrupted Angels', 'Cultists', 'Cupids', 'Dark Pixies', 'Deadeye Walkers',
  'Dwarf Defenders', 'Dwarf Warriors', 'Fatty and Walkers', 'Goblin Archers', 'Goblin Warriors', 'Harpies',
  'Living Statues', 'Nagas', 'Nymphs', 'Orc Abomination and Runners', 'Orc Enforcers', 'Orc Fatty and Walkers',
  'Orc Flayers', 'Punycorns', 'Rattling Crossbowmen', 'Rattling Warriors', 'Reptisaurian Blowgunners',
  'Reptisaurian Warriors', 'Shadow Demons', 'Spectral Walkers', 'Storm Elementals', 'Swarm of Ratz',
  'Tainted Abomination and Walkers', 'Troglodyte Brutes', 'Troglodyte Warriors', 'Wolfbomination and Wolfz',
  'Wraiths',
];

export const ROAMING_NAMES = [
  'Andra', 'Lydian - Incubus Lord', 'The Ghoul', 'Ytheria - Undead Queen',
  'Ablobination', 'Abominatroll', 'Abominotaur', 'Abyssal Demon', 'Amon', 'Archangel Raphael', 'Azmozeus',
  'Banshee', 'Beelzebub', 'Buer', 'Cerberus', 'Chromatis', 'Cliffbreaker Cyclops', 'Cockatrix', 'Cun-Ha',
  'Death', 'Earth Elemental', 'Famine', 'Fire Elemental', 'Flesh Golem', 'Fomorian', 'Giant Spider',
  'Graz & Prug', 'Gryphon', 'Hellephant', 'Hellhound', 'Hellsbane', 'High Troll', 'Iron Golem', 'Liliarch',
  'Living Construct', 'Lord Tusk', 'Low Troll', 'Metal Angel', 'Minotaur', 'Nightmare Thing', 'Ogre Brute',
  'Ogre Mage', 'Ogre Rockbreaker', 'Oni', 'Overseer', 'Paragon', 'Plague', 'Queen Caenedra', 'Rattling Agent',
  'Rattling Bully', 'Reptisaurus Rex', 'Spearmaiden Cyclops', 'Troglodyte Agent', 'Uriel', 'Valkyrie',
  'Vindicator', 'War', 'Water Elemental', 'Werebear', 'Weretiger', 'Werewolf',
];

export const BOSS_NAMES = [
  'Michael', 'The Reaper',
  'Baalberith', 'Charon', 'Cyclopes Duo', 'Death/Famine/Plague/War', 'Grundarkjell', 'Hades', 'Hellephant',
  'Hug Bear', 'Necromatic Dragon', 'Scorpion King', 'The Dark Emissary',
];

export function namesForKind(kind) {
  if (kind === 'mob') return MOB_NAMES;
  if (kind === 'roaming') return ROAMING_NAMES;
  return BOSS_NAMES;
}
