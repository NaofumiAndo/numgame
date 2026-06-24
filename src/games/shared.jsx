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
        <circle cx="50" cy="50" r={R} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={isRed ? '#ef4444' : '#facc15'}
          strokeWidth="8"
          strokeDasharray={`${dash} ${CIRC}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.25s linear, stroke 0.3s' }}
        />
        <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="bold"
          fill={isRed ? '#ef4444' : '#facc15'} fontFamily="system-ui">
          {timeLeft}
        </text>
      </svg>
    </div>
  )
}

// ── Confetti：合格・クリア時の紙吹雪 ────────────────────────────────────────────
export function Confetti({ active }) {
  const colors = ['#facc15', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']
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
export function NumPad({ onDigit, onDelete, onClear, clearLabel = 'C' }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {['1','2','3','4','5','6','7','8','9'].map(d => (
        <button key={d} onClick={() => onDigit(d)}
          className="bg-slate-700 active:bg-slate-500 rounded-xl py-3 text-2xl font-black text-white transition-transform active:scale-95 cursor-pointer">
          {d}
        </button>
      ))}
      <button onClick={onClear}
        className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-sm font-bold text-slate-300 transition-transform active:scale-95 cursor-pointer">
        {clearLabel}
      </button>
      <button onClick={() => onDigit('0')}
        className="bg-slate-700 active:bg-slate-500 rounded-xl py-3 text-2xl font-black text-white transition-transform active:scale-95 cursor-pointer">
        0
      </button>
      <button onClick={onDelete}
        className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-xl font-bold text-slate-300 transition-transform active:scale-95 cursor-pointer">
        ←
      </button>
    </div>
  )
}
