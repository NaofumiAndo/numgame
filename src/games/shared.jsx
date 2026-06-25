// ── 共有コンポーネント ──────────────────────────────────────────────────────────
// 純粋なユーティリティ関数は utils.js にある。
import { randInt } from './utils.js'

// ── CircleTimer：残り時間を円グラフで表示 ────────────────────────────────────────
export function CircleTimer({ timeLeft, totalTime }) {
  const R = 40
  const CIRC = 2 * Math.PI * R
  const ratio = Math.max(0, timeLeft / totalTime)
  const dash = ratio * CIRC
  const isRed = ratio < 0.3

  return (
    <div className="flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f1e7de" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={isRed ? '#fb7185' : '#fbbf24'}
          strokeWidth="8"
          strokeDasharray={`${dash} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.25s linear, stroke 0.3s' }}
        />
        <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="bold"
          fill={isRed ? '#fb7185' : '#f59e0b'} fontFamily="system-ui">
          {timeLeft}
        </text>
      </svg>
    </div>
  )
}

// ── Confetti：合格・クリア時の紙吹雪 ────────────────────────────────────────────
export function Confetti({ active }) {
  const colors = ['#fcd34d', '#fdba74', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4']
  if (!active) return null
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 60 }, (_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            background: colors[i % colors.length],
            left: `${randInt(0, 100)}%`,
            top: '-20px',
            animation: `confetti-fall ${(randInt(15, 30) / 10).toFixed(1)}s linear ${(randInt(0, 20) / 10).toFixed(1)}s forwards`,
            transform: `rotate(${randInt(0, 360)}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── NumPad：0-9 とクリア・削除のテンキー（共通） ────────────────────────────────
// compact=true で縦に薄いスリム表示（画面に収めたい百マス計算などで使用）
export function NumPad({ onDigit, onDelete, onClear, clearLabel = 'C', compact = false }) {
  const gap = compact ? 'gap-1' : 'gap-2'
  const numCls = compact
    ? 'bg-white border border-slate-200 shadow-sm active:bg-slate-100 rounded-xl py-1.5 text-xl font-black text-slate-700 transition-transform active:scale-95 cursor-pointer'
    : 'bg-white border border-slate-200 shadow-sm active:bg-slate-100 rounded-xl py-3 text-2xl font-black text-slate-700 transition-transform active:scale-95 cursor-pointer'
  const clearCls = compact
    ? 'bg-slate-100 active:bg-slate-200 rounded-xl py-1.5 text-sm font-bold text-slate-500 transition-transform active:scale-95 cursor-pointer'
    : 'bg-slate-100 active:bg-slate-200 rounded-xl py-3 text-sm font-bold text-slate-500 transition-transform active:scale-95 cursor-pointer'
  const delCls = compact
    ? 'bg-slate-100 active:bg-slate-200 rounded-xl py-1.5 text-lg font-bold text-slate-500 transition-transform active:scale-95 cursor-pointer'
    : 'bg-slate-100 active:bg-slate-200 rounded-xl py-3 text-xl font-bold text-slate-500 transition-transform active:scale-95 cursor-pointer'
  return (
    <div className={`grid grid-cols-3 ${gap}`}>
      {['1','2','3','4','5','6','7','8','9'].map(d => (
        <button key={d} onClick={() => onDigit(d)} className={numCls}>
          {d}
        </button>
      ))}
      <button onClick={onClear} className={clearCls}>
        {clearLabel}
      </button>
      <button onClick={() => onDigit('0')} className={numCls}>
        0
      </button>
      <button onClick={onDelete} className={delCls}>
        ←
      </button>
    </div>
  )
}
