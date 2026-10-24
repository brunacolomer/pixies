const dots: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
}

export default function Dice({ value, rolling, disabled, onRoll }: {
  value: number | null; rolling: boolean; disabled: boolean; onRoll: () => void
}) {
  return <button className={`dice${rolling ? ' rolling' : ''}`} disabled={disabled || rolling}
    onClick={onRoll} aria-busy={rolling}
    aria-label={rolling ? 'Rolling die' : value ? `Die: ${value}. Tap to roll` : 'Tap to roll the die'}>
    {value === null ? <span className="dice-ready" aria-hidden="true">?</span> :
      Array.from({ length: 9 }, (_, index) => <span key={index} aria-hidden="true"
        className={dots[value].includes(index) ? 'pip' : ''} />)}
  </button>
}
