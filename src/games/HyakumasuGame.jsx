import { useState, useEffect, useRef, Fragment } from 'react'
import { shuffle, fmtTime } from './utils.js'
import { NumPad, Confetti } from './shared.jsx'

// ── 演算定義 ────────────────────────────────────────────────────────────────────
// 見出し（行＝左端 / 列＝上端）をそれぞれ 10 個ずつ用意して 10×10 = 百マスを作る。
// ひき算は「行（被減数）9〜18」「列（減数）0〜9」とし、どのマスでもマイナスにならない。
function range(a, b) {
  const r = []
  for (let i = a; i <= b; i++) r.push(i)
  return r
}
const OPS = {
  add: { sym: '＋', label: { ja: 'たし算', en: 'Add' }, rows: () => range(0, 9),  cols: () => range(0, 9),  calc: (a, b) => a + b },
  sub: { sym: '－', label: { ja: 'ひき算', en: 'Sub' }, rows: () => range(9, 18), cols: () => range(0, 9),  calc: (a, b) => a - b },
  mul: { sym: '×', label: { ja: 'かけ算', en: 'Mul' }, rows: () => range(1, 10), cols: () => range(1, 10), calc: (a, b) => a * b },
}
const OP_ORDER = ['add', 'sub', 'mul']
const SIZE = 10
const CELLS = SIZE * SIZE

// ── ベストタイム（localStorage） ────────────────────────────────────────────────
const BEST_KEY = 'hyakumasu_best'
function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} }
}
function saveBest(b) {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(b)) } catch { /* 無視 */ }
}

export default function HyakumasuGame({ lang, setLang, onExit }) {
  const t = (ja, en) => (lang === 'ja' ? ja : en)

  const [screen, setScreen] = useState('config') // config | play | switch | result
  const [op, setOp] = useState('add')
  const [versus, setVersus] = useState(false)

  // グリッドの見出し（行・列）。1ゲーム内では固定（対戦時は両者同じ盤面）。
  const [rowH, setRowH] = useState([])
  const [colH, setColH] = useState([])

  // プレイ状態
  const [player, setPlayer] = useState(1)
  const [index, setIndex] = useState(0)            // 現在のマス（読み順 0..99）
  const [answers, setAnswers] = useState([])       // length 100、解けたマスに答えを格納
  const [input, setInput] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState([])       // [{ player, timeMs, mistakes }]
  const [best, setBest] = useState(() => loadBest())
  const [isRecord, setIsRecord] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const startTsRef = useRef(0)
  const tickRef = useRef(null)

  const stopTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null } }
  useEffect(() => () => stopTick(), [])

  const startTick = () => {
    stopTick()
    startTsRef.current = Date.now()
    setElapsed(0)
    tickRef.current = setInterval(() => setElapsed(Date.now() - startTsRef.current), 100)
  }

  // ── 1プレイヤー分の開始（盤面は据え置き） ──────────────────────────────────────
  const startPlayer = (p) => {
    setPlayer(p)
    setIndex(0)
    setAnswers(Array(CELLS).fill(null))
    setInput('')
    setMistakes(0)
    setWrongFlash(false)
    setScreen('play')
    startTick()
  }

  // ── ゲーム開始（盤面を新規生成） ───────────────────────────────────────────────
  const startGame = () => {
    const cfg = OPS[op]
    setRowH(shuffle(cfg.rows()))
    setColH(shuffle(cfg.cols()))
    setResults([])
    setIsRecord(false)
    setConfetti(false)
    startPlayer(1)
  }

  const fireConfetti = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 3500)
  }

  // ── プレイヤー完了時の処理 ─────────────────────────────────────────────────────
  const finishPlayer = (res) => {
    stopTick()
    if (versus && res.player === 1) {
      setResults([res])
      setScreen('switch')
      return
    }
    const all = [...results, res]
    setResults(all)
    if (!versus) {
      const prev = best[op]
      if (prev == null || res.timeMs < prev) {
        const nb = { ...best, [op]: res.timeMs }
        setBest(nb); saveBest(nb); setIsRecord(true)
      }
      fireConfetti()
    } else {
      fireConfetti()
    }
    setScreen('result')
  }

  // ── 数字入力（答えの桁数に達したら自動判定） ──────────────────────────────────
  const handleDigit = (d) => {
    if (screen !== 'play') return
    const r = Math.floor(index / SIZE)
    const c = index % SIZE
    const answer = OPS[op].calc(rowH[r], colH[c])
    const exp = String(answer).length
    const next = (input + d).slice(0, exp)
    if (next.length < exp) { setInput(next); return }

    if (parseInt(next, 10) === answer) {
      setAnswers(prev => { const a = [...prev]; a[index] = answer; return a })
      setInput('')
      const ni = index + 1
      if (ni >= CELLS) {
        finishPlayer({ player, timeMs: Date.now() - startTsRef.current, mistakes })
      } else {
        setIndex(ni)
      }
    } else {
      setMistakes(m => m + 1)
      setInput('')
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 350)
    }
  }

  const onBack = () => {
    stopTick()
    if (screen === 'config') onExit()
    else { setScreen('config'); setConfetti(false) }
  }

  const curR = Math.floor(index / SIZE)
  const curC = index % SIZE
  const ready = rowH.length === SIZE && colH.length === SIZE
  const curA = ready ? rowH[curR] : null
  const curB = ready ? colH[curC] : null
  const sym = OPS[op].sym

  return (
    <div className={`min-h-screen text-slate-700 flex flex-col items-center select-none transition-colors ${wrongFlash ? 'bg-rose-100' : 'bg-orange-50'}`}>
      <Confetti active={confetti} />

      <header className="w-full max-w-[430px] flex items-center justify-between px-4 py-3 border-b border-orange-100 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-xl leading-none px-1">←</button>
          <span className="text-orange-500 font-black text-base">{t('百マス計算', 'Hundred Squares')}</span>
        </div>
        <button onClick={() => setLang(l => (l === 'ja' ? 'en' : 'ja'))}
          className="text-xs border border-slate-300 rounded px-2 py-1 text-slate-500 hover:border-orange-400 hover:text-orange-500 transition">
          {lang === 'ja' ? 'EN' : 'JP'}
        </button>
      </header>

      <main className="w-full max-w-[430px] flex-1 min-h-0 flex flex-col px-4 py-3 overflow-y-auto">
        {screen === 'config' && (
          <ConfigScreen t={t} op={op} setOp={setOp} versus={versus} setVersus={setVersus}
            best={best} onStart={startGame} />
        )}

        {screen === 'play' && ready && (
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {/* ステータスバー */}
            <div className="flex items-center justify-between text-sm shrink-0">
              <div className="flex items-center gap-2">
                {versus && (
                  <span className={`px-2 py-1 rounded-lg font-black text-white ${player === 1 ? 'bg-sky-400' : 'bg-pink-400'}`}>
                    {t('プレイヤー', 'Player')}{player}
                  </span>
                )}
                <span className="text-slate-400">{t('ミス', 'Miss')} <b className="text-rose-400">{mistakes}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-orange-500 tabular-nums">⏱ {fmtTime(elapsed)}</span>
              </div>
            </div>

            {/* 進捗バー */}
            <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-orange-400 transition-all" style={{ width: `${(index / CELLS) * 100}%` }} />
            </div>

            {/* 大きな出題カード */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl py-2.5 text-center shadow-sm shrink-0">
              <div className="text-4xl font-black text-slate-700 tracking-wide">
                {curA} <span className="text-orange-400">{sym}</span> {curB}
                <span className="text-slate-300"> = </span>
                <span className="text-amber-500">{input || '?'}</span>
              </div>
              <div className="text-[11px] text-slate-400">{index + 1} / {CELLS} マス目</div>
            </div>

            {/* 百マス盤面（残りの縦スペースに収まるよう自動で縮小） */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <HyakumasuGrid rowH={rowH} colH={colH} answers={answers} index={index} sym={sym} />
            </div>

            {/* テンキー */}
            <div className="shrink-0">
              <NumPad onDigit={handleDigit} onDelete={() => setInput(s => s.slice(0, -1))} onClear={() => setInput('')} />
            </div>
          </div>
        )}

        {screen === 'switch' && (
          <SwitchScreen t={t} result={results[0]} onNext={() => startPlayer(2)} />
        )}

        {screen === 'result' && (
          <ResultScreen t={t} op={op} versus={versus} results={results}
            isRecord={isRecord} best={best}
            onRetry={startGame} onConfig={() => { setScreen('config'); setConfetti(false) }} />
        )}
      </main>
    </div>
  )
}

// ── 百マス盤面 ──────────────────────────────────────────────────────────────────
function HyakumasuGrid({ rowH, colH, answers, index, sym }) {
  const curR = Math.floor(index / SIZE)
  const curC = index % SIZE
  return (
    <div className="grid gap-[2px] mx-auto aspect-square h-full max-h-full max-w-full" style={{ gridTemplateColumns: `repeat(${SIZE + 1}, minmax(0, 1fr))` }}>
      {/* 左上の角（演算記号） */}
      <div className="aspect-square flex items-center justify-center rounded-[3px] bg-orange-200 text-orange-700 font-black text-xs">{sym}</div>
      {/* 上端の列見出し */}
      {colH.map((c, ci) => (
        <div key={`c${ci}`}
          className={`aspect-square flex items-center justify-center rounded-[3px] font-black text-[11px] transition-colors
            ${ci === curC ? 'bg-amber-300 text-amber-900' : 'bg-orange-100 text-orange-600'}`}>
          {c}
        </div>
      ))}
      {/* 各行 */}
      {rowH.map((rv, ri) => (
        <Fragment key={`r${ri}`}>
          {/* 左端の行見出し */}
          <div className={`aspect-square flex items-center justify-center rounded-[3px] font-black text-[11px] transition-colors
            ${ri === curR ? 'bg-amber-300 text-amber-900' : 'bg-orange-100 text-orange-600'}`}>
            {rv}
          </div>
          {/* マス */}
          {colH.map((_, ci) => {
            const idx = ri * SIZE + ci
            const solved = answers[idx] != null
            const isCur = idx === index
            return (
              <div key={idx}
                className={`aspect-square flex items-center justify-center rounded-[3px] text-[10px] font-bold transition-colors
                  ${isCur
                    ? 'bg-orange-400 text-white ring-2 ring-amber-200 animate-pulse'
                    : solved
                      ? 'bg-emerald-200 text-emerald-700'
                      : 'bg-white border border-slate-100 text-slate-300'}`}>
                {solved ? answers[idx] : ''}
              </div>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

// ── 設定画面 ────────────────────────────────────────────────────────────────────
function ConfigScreen({ t, op, setOp, versus, setVersus, best, onStart }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="text-3xl font-black text-orange-500 mb-1">{t('百マス計算', 'Hundred Squares')}</div>
        <div className="text-slate-400 text-sm">{t('100マスをタイムアタック！親子・きょうだいで競おう', 'Race through 100 squares!')}</div>
      </div>

      {/* 演算選択 */}
      <div>
        <div className="text-xs text-slate-400 mb-2 font-bold">{t('けいさん', 'Operation')}</div>
        <div className="grid grid-cols-3 gap-2">
          {OP_ORDER.map(o => (
            <button key={o} onClick={() => setOp(o)}
              className={`py-4 rounded-2xl font-black text-lg border-2 transition active:scale-95 cursor-pointer
                ${op === o ? 'bg-orange-400 border-orange-300 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-orange-300'}`}>
              <div className="text-2xl">{OPS[o].sym}</div>
              <div className="text-xs mt-1">{OPS[o].label[t('ja', 'en')] || OPS[o].label.ja}</div>
            </button>
          ))}
        </div>
        {op === 'sub' && (
          <div className="text-[11px] text-slate-400 mt-2">{t('※ ひき算は答えがマイナスにならないように出題します', '* Subtraction never goes below zero')}</div>
        )}
      </div>

      {/* モード選択 */}
      <div>
        <div className="text-xs text-slate-400 mb-2 font-bold">{t('モード', 'Mode')}</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setVersus(false)}
            className={`py-4 rounded-2xl font-black border-2 transition active:scale-95 cursor-pointer
              ${!versus ? 'bg-sky-400 border-sky-300 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
            <div className="text-2xl">🧒</div>
            <div className="text-sm mt-1">{t('ひとりで', 'Solo')}</div>
          </button>
          <button onClick={() => setVersus(true)}
            className={`py-4 rounded-2xl font-black border-2 transition active:scale-95 cursor-pointer
              ${versus ? 'bg-pink-400 border-pink-300 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
            <div className="text-2xl">👨‍👧</div>
            <div className="text-sm mt-1">{t('ふたりで交互に', 'Versus')}</div>
          </button>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          {versus
            ? t('2人が同じ盤面を順番に解いてタイムで勝負！', 'Two players race the same board in turns!')
            : t('別の端末どうしで同時にスタートすれば対戦にも！', 'Start together on two devices to race!')}
        </div>
      </div>

      {/* ベストタイム（ひとりで） */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="text-xs text-slate-400 mb-2 font-bold">🏆 {t('ベストタイム', 'Best Time')}</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {OP_ORDER.map(o => (
            <div key={o}>
              <div className="text-lg">{OPS[o].sym}</div>
              <div className={`text-sm font-black tabular-nums ${best[o] != null ? 'text-orange-500' : 'text-slate-300'}`}>
                {best[o] != null ? fmtTime(best[o]) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onStart}
        className="w-full bg-orange-400 text-white font-black text-xl py-4 rounded-2xl hover:bg-orange-300 active:scale-95 transition cursor-pointer shadow-sm">
        {t('スタート', 'Start')} ▶
      </button>
    </div>
  )
}

// ── プレイヤー交代画面 ──────────────────────────────────────────────────────────
function SwitchScreen({ t, result, onNext }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="text-2xl font-black text-sky-500">{t('プレイヤー1 おわり！', 'Player 1 done!')}</div>
      <div className="bg-white rounded-2xl px-8 py-5 border border-slate-200 shadow-sm">
        <div className="text-4xl font-black text-orange-500 tabular-nums">⏱ {fmtTime(result.timeMs)}</div>
        <div className="text-slate-400 mt-1">{t('ミス', 'Miss')} {result.mistakes}</div>
      </div>
      <div className="text-lg font-bold text-pink-500">👉 {t('プレイヤー2 にこうたい！', 'Player 2\'s turn!')}</div>
      <button onClick={onNext}
        className="w-full bg-pink-400 text-white font-black text-xl py-4 rounded-2xl hover:bg-pink-300 active:scale-95 transition cursor-pointer shadow-sm">
        {t('プレイヤー2 スタート', 'Player 2 Start')} ▶
      </button>
    </div>
  )
}

// ── 結果画面 ────────────────────────────────────────────────────────────────────
function ResultScreen({ t, op, versus, results, isRecord, best, onRetry, onConfig }) {
  // 対戦時は勝者を判定（タイムが短い方。同タイムならミスが少ない方）
  let winner = null
  if (versus && results.length === 2) {
    const [p1, p2] = results
    if (p1.timeMs !== p2.timeMs) winner = p1.timeMs < p2.timeMs ? 1 : 2
    else if (p1.mistakes !== p2.mistakes) winner = p1.mistakes < p2.mistakes ? 1 : 2
    else winner = 0 // 引き分け
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-2xl font-black text-orange-500">{OPS[op].label[t('ja', 'en')] || OPS[op].label.ja} {t('かんりょう！', 'Complete!')}</div>

      {!versus && results[0] && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl font-black text-orange-500 tabular-nums">{fmtTime(results[0].timeMs)}</div>
          <div className="text-slate-400">{t('ミス', 'Miss')} {results[0].mistakes}</div>
          {isRecord && <div className="text-amber-500 font-black text-lg animate-bounce">🎉 {t('ベスト記録こうしん！', 'New Best!')}</div>}
          {!isRecord && best[op] != null && (
            <div className="text-xs text-slate-400">{t('ベスト', 'Best')}: {fmtTime(best[op])}</div>
          )}
        </div>
      )}

      {versus && results.length === 2 && (
        <div className="w-full flex flex-col gap-3">
          {results.map((r, i) => {
            const isWin = winner === r.player
            return (
              <div key={i}
                className={`flex items-center justify-between rounded-2xl px-5 py-4 border-2
                  ${isWin ? 'bg-amber-100 border-amber-300' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg font-black text-sm text-white ${r.player === 1 ? 'bg-sky-400' : 'bg-pink-400'}`}>
                    {t('プレイヤー', 'P')}{r.player}
                  </span>
                  {isWin && <span className="text-xl">👑</span>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-500 tabular-nums">{fmtTime(r.timeMs)}</div>
                  <div className="text-xs text-slate-400">{t('ミス', 'Miss')} {r.mistakes}</div>
                </div>
              </div>
            )
          })}
          <div className="text-center text-xl font-black text-amber-500 mt-1">
            {winner === 0 ? t('🤝 ひきわけ！', '🤝 Draw!') : `🏆 ${t('プレイヤー', 'Player')}${winner} ${t('のかち！', 'wins!')}`}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full mt-2">
        <button onClick={onRetry}
          className="w-full bg-orange-400 text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-300 active:scale-95 transition cursor-pointer shadow-sm">
          {t('もう一回', 'Again')}
        </button>
        <button onClick={onConfig}
          className="w-full bg-slate-100 text-slate-500 font-bold py-3 rounded-2xl hover:bg-slate-200 active:scale-95 transition cursor-pointer">
          {t('せってい', 'Settings')}
        </button>
      </div>
    </div>
  )
}
