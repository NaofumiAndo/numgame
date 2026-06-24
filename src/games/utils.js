// ── 共有ユーティリティ（純粋関数のみ） ──────────────────────────────────────────
// コンポーネントは shared.jsx 側に置く（Fast Refresh のため分離）。

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function fmt(n) {
  return n.toLocaleString('ja-JP')
}

// Fisher–Yates シャッフル（元配列は破壊しない）
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ミリ秒を m:ss.d 形式に整形（タイム表示用）
export function fmtTime(ms) {
  if (ms == null) return '—'
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  const d = Math.floor((totalSec * 10) % 10)
  return `${m}:${String(s).padStart(2, '0')}.${d}`
}
