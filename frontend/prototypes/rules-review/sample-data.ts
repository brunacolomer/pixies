// Plain data is intentionally separate from the UI. No AI or server contract is assumed.
export type Field = { id: string; label: string; value: string }
export type ReviewItem = {
  id: string
  title: string
  kind: string // Open string: add new tile categories without changing a union type.
  fields: Field[] // Add, remove, or rename fields independently for every item.
  reviewed: boolean
}
export type GameDraft = { title: string; rules: ReviewItem[]; tiles: ReviewItem[] }

export function createSampleDraft(): GameDraft {
  return {
    title: 'The enchanted trail',
    rules: [
      { id: 'objective', title: 'Your quest', kind: 'Objective', reviewed: false, fields: [{ id: 'text', label: 'Rule', value: 'Collect 5 stardust and reach the Moon Gate to win.' }] },
      { id: 'setup', title: 'Gather your adventurers', kind: 'Setup', reviewed: false, fields: [{ id: 'text', label: 'Rule', value: 'Play with 2–4 players. Everyone begins at Camp with 2 stardust. Choose who goes first together.' }] },
      { id: 'turns', title: 'Take a little leap', kind: 'Turns', reviewed: false, fields: [{ id: 'text', label: 'Rule', value: 'On your turn, roll a six-sided die, move forward, and resolve the tile you land on. Play continues clockwise.' }] },
      { id: 'scoring', title: 'Stardust & setbacks', kind: 'Scoring', reviewed: false, fields: [{ id: 'text', label: 'Rule', value: 'Track stardust openly. Your total cannot fall below zero. Challenges are optional; use the listed penalty if you skip one.' }] },
      { id: 'winning', title: 'Through the Moon Gate', kind: 'Winning', reviewed: false, fields: [{ id: 'text', label: 'Rule', value: 'The first player to reach or pass the Moon Gate with at least 5 stardust wins. With less than 5, return to Camp and keep your stardust.' }] },
    ],
    tiles: [
      { id: 'camp', title: 'Camp', kind: 'Start', reviewed: false, fields: [{ id: 'action', label: 'Action', value: 'Begin here. No effect when returning to Camp.' }] },
      { id: 'grove', title: 'Glowing grove', kind: 'Reward', reviewed: false, fields: [{ id: 'action', label: 'Action', value: 'Collect 2 stardust.' }] },
      { id: 'riddle', title: 'Riddle bridge', kind: 'Challenge', reviewed: false, fields: [{ id: 'challenge', label: 'Challenge', value: 'Name three forest animals in 10 seconds. The next player keeps time.' }, { id: 'action', label: 'Success action', value: 'Collect 2 stardust.' }, { id: 'penalty', label: 'Skip or failure penalty', value: 'Lose 1 stardust.' }] },
      { id: 'marsh', title: 'Sleepy marsh', kind: 'Penalty', reviewed: false, fields: [{ id: 'penalty', label: 'Penalty', value: 'Lose 1 stardust.' }] },
      { id: 'spring', title: 'Wishing spring', kind: 'Reward', reviewed: false, fields: [{ id: 'action', label: 'Action', value: 'Collect 1 stardust.' }] },
      { id: 'gate', title: 'Moon Gate', kind: 'Finish', reviewed: false, fields: [{ id: 'action', label: 'Action', value: 'With at least 5 stardust, you win. Otherwise return to Camp and keep your stardust.' }] },
    ],
  }
}
