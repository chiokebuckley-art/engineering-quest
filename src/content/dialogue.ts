import type { QuestStatus } from '../engine/types';

export interface DialogueLine {
  speaker: string; // npc id or 'player' or 'narrator'
  text: string;
}

export interface DialogueView {
  playerName: string;
  quest: (id: string) => QuestStatus;
  mastery: (skillId: string) => number;
  level: number;
  hasItem: (id: string) => boolean;
}

/**
 * Context-sensitive NPC dialogue. Each NPC returns a short conversation based on
 * quest state and mastery — no walls of text.
 */
export function npcDialogue(npcId: string, v: DialogueView): DialogueLine[] {
  const n = v.playerName;
  switch (npcId) {
    case 'vector': {
      if (v.quest('q.awakening') !== 'completed') {
        return [
          { speaker: 'vector', text: `${n}! Hear that silence? The Engine is dead, and the first core is down in the mines.` },
          { speaker: 'vector', text: 'The mines are open. Every gallery you clear lights a lamp up here — go light them. Stuck? Ask me for a tip mid-fight.' },
        ];
      }
      if (v.quest('q.first-principles') === 'active' && v.quest('q.into-the-mines') !== 'completed') {
        return [{ speaker: 'vector', text: 'Down to the mines! When you want to know WHY 3 × 4 = 12, my five-minute lesson is in the Lecture Hall.' }];
      }
      if (v.quest('q.power-core-1') === 'completed') {
        return [
          { speaker: 'vector', text: `You did it, ${n}. The first core is glowing again. Feel the ground hum?` },
          { speaker: 'vector', text: 'Next: the Division Dungeon. Every fact you know, played backwards.' },
        ];
      }
      const m = v.mastery('mult');
      if (m >= 75) {
        return [
          { speaker: 'vector', text: `Multiplication at ${Math.round(m)}%. The Dragon asks 50 facts and forgives 5 misses.` },
          { speaker: 'vector', text: 'Check the Skills page. Any table below 85%? Drill it first.' },
        ];
      }
      if (m >= 40) {
        return [
          { speaker: 'vector', text: `You're at ${Math.round(m)}%. Nice. Stuck on 6×7 or 7×8? My lesson "The Hard Facts" has a trick for each.` },
        ];
      }
      return [
        { speaker: 'vector', text: 'Each gallery in the mines is one table. Clear them in order. Come back for a lesson when a table fights back.' },
        { speaker: 'vector', text: 'Missed a fact? Don\'t worry. It comes back later so you can beat it. That\'s how memory works.' },
      ];
    }
    case 'brick': {
      if (v.quest('q.into-the-mines') !== 'completed') {
        return [
          { speaker: 'brick', text: `Vector's apprentice, eh? Slimes and goblins took my upper galleries.` },
          { speaker: 'brick', text: 'Slimes double things — that\'s the ×2 table. Goblins do ×3 and ×4. Beat three of them for me.' },
        ];
      }
      if (v.quest('q.forge-key') === 'completed' && v.quest('q.power-core-1') !== 'completed') {
        return [{ speaker: 'brick', text: 'You\'ve got the Forge Key. The Dragon is below the Sentinel Vault. Take your time on the first ten.' }];
      }
      return [
        { speaker: 'brick', text: 'My standard: 30 mixed facts, 90% right. The Training Grounds run it.' },
        { speaker: 'brick', text: 'Clear Gallery 8 and reach 75% and the Forge Key is yours.' },
      ];
    }
    case 'ada': {
      if (v.quest('q.bridge') === 'active') {
        return [
          { speaker: 'ada', text: 'The bridge to the deep mines is down. I\'ve got the plans — but the plans are all numbers.' },
          { speaker: 'ada', text: 'You do the math, my crew does the lifting. Get one wrong? We just re-measure.' },
        ];
      }
      if (v.quest('q.pump') === 'active') {
        return [{ speaker: 'ada', text: 'Pump\'s dead! We have to share the water by hand — and sharing means division. My lesson first.' }];
      }
      if (v.quest('p.workshop') === 'active') {
        return [{ speaker: 'ada', text: 'Want your own workshop? 24 bolts, 4 beams, and a few building problems.' }];
      }
      return [
        { speaker: 'ada', text: 'Every machine is math that moves. Gears are ratios. Pumps are rates.' },
      ];
    }
    case 'volt':
      return [
        { speaker: 'volt', text: '8 batteries × 9 volts each = 72 volts. See? Circuits are multiplication first.' },
        { speaker: 'volt', text: 'Find me again in Algebra City. That\'s where the real wiring starts.' },
      ];
    case 'catalyst':
      return [
        { speaker: 'catalyst', text: '12 tanks × 9 litres = 108 litres for the batch. Chemistry runs on your times tables.' },
      ];
    case 'newton':
      return [
        { speaker: 'newton', text: 'Force is mass TIMES acceleration. Speed is distance DIVIDED by time. You\'re already doing physics.' },
      ];
    default:
      return [{ speaker: 'narrator', text: '...' }];
  }
}
