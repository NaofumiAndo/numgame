import { useState, useEffect, useRef } from 'react'
import { randInt, fmtTime } from './utils.js'
import { NumPad, Confetti } from './shared.jsx'

const SESSION_Q = 20

const RANGES = {
  kuku:  { label: { ja: '九九 (1〜9)', en: '1–9' },   gen: () => [randInt(1, 9),  randInt(1, 9)] },
  teens: { label: { ja: '11〜19',      en: '11–19' },  gen: () => [randInt(11, 19), randInt(11, 19)] },
  all:   { label: { ja: '1〜19 ぜんぶ', en: '1–19 all' }, gen: () => [randInt(1, 19), randInt(1, 19)] },
}
const RANGE_ORDER = ['kuku', 'teens', 'all']

// ── インド式の計算のコツ（11〜19 × 11〜19 のとき） ──────────────────────────────
// 例: 13 × 14 →（13 + 4）× 10 + 3 × 4 = 170 + 12 = 182
function indianHint(a, b) {
  if (a >= 11 && a <= 19 && b >= 11 && b <= 19) {
    const ua = a - 10, ub = b - 10
    const sum = a + ub          // 13 + 4 = 17
    const tens = sum * 10       // 170
    const prod = ua * ub        // 12
    return { sum, tens, prod, total: tens + prod, ua, ub }
  }
  return null
}

function genQuestions(subMode, range, table) {
  const qs = []
  for (let i = 0; i < SESSION_Q; i++) {
    let a, b
    if (subMode === 'table') { a = table; b = randInt(1, 19) }
    else { [a, b] = RANGES[range].gen() }
    if (Math.random() < 0.5) [a, b] = [b, a]
    qs.push({ a, b, answer: a * b })
  }
  return qs
}

export default function IndianMultiplicationGame({ lang, setLang, onExit }) {
  const t = (ja, en) => (lang === 'ja' ? ja : en)

  const [screen, setScreen] = useState('config') // config | play | result
  const [subMode, setSubMode] = useState('range') // range | table
  const [range, setRange] = useState('teens')
  const [table, setTable] = useState(13)
  const [showHints, setShowHints] = useState(true)

  const [questions, setQuestions] = useState([])
  const [qi, setQi] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('q')        // q | reveal
  const [lastCorrect, setLastCorrect] = useState(false)
  const [scores, setScores] = useState([])       // boolean[]
  const [elapsed, setElapsed] = useState(0)
  const [confetti, setConfetti] = useState(false)

  const startTsRef = useRef(0)
  const tickRef = useRef(null)
  const advanceRef = useRef(null)

  const stopTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null } }
  const clearAdvance = () => { if (advanceRef.current) { clearTimeout(advanceRef.current); advanceRef.current = null } }
  useEffect(() => () => { stopTick(); clearAdvance() }, [])

  const startGame = () => {
    setQuestions(genQuestions(subMode, range, table))
    setQi(0)
    setInput('')
    setPhase('q')
    setScores([])
    setConfetti(false)
    setScreen('play')
    startTsRef.current = Date.now()
    setElapsed(0)
    stopTick()
    tickRef.current = setInterval(() => setElapsed(Date.now() - startTsRef.current), 100)
  }

  const goNext = (newScores) => {
    clearAdvance()
    const ni = qi + 1
    if (ni >= SESSION_Q) {
      stopTick()
      const correct = newScores.filter(Boolean).length
      if (correct === SESSION_Q) { setConfetti(true); setTimeout(() => setConfetti(false), 3500) }
      setScreen('result')
      return
    }
    setQi(ni)
    setInput('')
    setPhase('q')
  }

  const submit = (val) => {
    const q = questions[qi]
    const correct = val === q.answer
    const newScores = [...scores, correct]
    setScores(newScores)
    setLastCorrect(correct)
    setPhase('reveal')
    if (correct) {
      // 正解はテンポよく自動で次へ
      advanceRef.current = setTimeout(() => goNext(newScores), 650)
    }
    // 不正解は答え＆コツを見せて、タップで次へ
  }

  const handleDigit = (d) => {
    if (screen !== 'play' || phase !== 'q') return
    const exp = String(questions[qi].answer).length
    const next = (input + d).slice(0, exp)
    if (next.length < exp) { setInput(next); return }
    submit(parseInt(next, 10))
  }

  const onBack = () => {
    stopTick(); clearAdvance()
    if (screen === 'config') onExit()
    else { setScreen('config'); setConfetti(false) }
  }

  const q = questions[qi]
  const hint = q ? indianHint(q.a, q.b) : null

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center select-none">
      <Confetti active={confetti} />

      <header className="w-full max-w-[430px] flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-xl leading-none px-1">←</button>
          <span className="text-violet-400 font-black text-base">{t('インド式 九九', 'Indian Tables')}</span>
        </div>
        <button onClick={() => setLang(l => (l === 'ja' ? 'en' : 'ja'))}
          className="text-xs border border-slate-600 rounded px-2 py-1 text-slate-300 hover:border-violet-400 hover:text-violet-400 transition">
          {lang === 'ja' ? 'EN' : 'JP'}
        </button>
      </header>

      <main className="w-full max-w-[430px] flex-1 flex flex-col px-4 py-4 overflow-y-auto">
        {screen === 'config' && (
          <ConfigScreen t={t}
            subMode={subMode} setSubMode={setSubMode}
            range={range} setRange={setRange}
            table={table} setTable={setTable}
            showHints={showHints} setShowHints={setShowHints}
            onStart={startGame} />
        )}

        {screen === 'play' && q && (
          <div className="flex flex-col gap-3">
            {/* 進捗 */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: SESSION_Q }, (_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${
                    i < scores.length ? (scores[i] ? 'bg-green-400' : 'bg-red-400')
                      : i === qi ? 'bg-violet-400' : 'bg-slate-700'
                  }`} />
                ))}
              </div>
              <span className="text-slate-400 text-xs shrink-0 tabular-nums">{fmtTime(elapsed)}</span>
            </div>

            {/* 出題カード */}
            <div className={`rounded-2xl py-7 text-center border-2 transition-colors
              ${phase === 'reveal'
                ? (lastCorrect ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500')
                : 'bg-slate-800 border-violet-500/60'}`}>
              <div className="text-5xl font-black text-white tracking-wide">
                {q.a} <span className="text-violet-400">×</span> {q.b}
                <span className="text-slate-500"> = </span>
                {phase === 'reveal'
                  ? <span className={lastCorrect ? 'text-green-300' : 'text-yellow-300'}>{q.answer}</span>
                  : <span className="text-yellow-300">{input || '?'}</span>}
              </div>
              {phase === 'reveal' && (
                <div className={`mt-2 font-black text-lg ${lastCorrect ? 'text-green-300' : 'text-red-300'}`}>
                  {lastCorrect ? `⭕ ${t('せいかい！', 'Correct!')}` : `❌ ${t('おしい！', 'Try again!')}`}
                </div>
              )}
            </div>

            {/* インド式のコツ（11〜19×11〜19、リビール時のみ） */}
            {phase === 'reveal' && showHints && hint && (
              <div className="bg-violet-900/30 border border-violet-700 rounded-xl px-4 py-3 text-sm">
                <div className="text-violet-300 font-black mb-1">💡 {t('インド式のコツ', 'Indian trick')}</div>
                <div className="text-slate-200 leading-relaxed">
                  ① {q.a} + {hint.ub} = <b className="text-yellow-300">{hint.sum}</b> → ×10 = <b className="text-yellow-300">{hint.tens}</b><br />
                  ② {hint.ua} × {hint.ub} = <b className="text-yellow-300">{hint.prod}</b><br />
                  ③ {hint.tens} + {hint.prod} = <b className="text-green-300">{hint.total}</b>
                </div>
              </div>
            )}

            {phase === 'q' ? (
              <NumPad onDigit={handleDigit} onDelete={() => setInput(s => s.slice(0, -1))} onClear={() => setInput('')} />
            ) : (
              !lastCorrect && (
                <button onClick={() => goNext(scores)}
                  className="w-full bg-violet-500 text-white font-black text-lg py-4 rounded-2xl hover:bg-violet-400 active:scale-95 transition cursor-pointer">
                  {qi + 1 < SESSION_Q ? t('つぎへ', 'Next') : t('けっか', 'Result')} →
                </button>
              )
            )}
          </div>
        )}

        {screen === 'result' && (
          <ResultScreen t={t} questions={questions} scores={scores} elapsed={elapsed}
            onRetry={startGame} onConfig={() => { setScreen('config'); setConfetti(false) }} />
        )}
      </main>
    </div>
  )
}

// ── 設定画面 ────────────────────────────────────────────────────────────────────
function ConfigScreen({ t, subMode, setSubMode, range, setRange, table, setTable, showHints, setShowHints, onStart }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <div className="text-3xl font-black text-violet-400 mb-1">{t('インド式 九九', 'Indian Tables')}</div>
        <div className="text-slate-400 text-sm">{t('19×19までスラスラ言えるように練習！', 'Master up to 19 × 19!')}</div>
      </div>

      {/* サブモード切替 */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSubMode('range')}
          className={`py-3 rounded-xl font-black border-2 transition active:scale-95 cursor-pointer
            ${subMode === 'range' ? 'bg-violet-600 border-violet-300 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
          {t('ランダム', 'Random')}
        </button>
        <button onClick={() => setSubMode('table')}
          className={`py-3 rounded-xl font-black border-2 transition active:scale-95 cursor-pointer
            ${subMode === 'table' ? 'bg-violet-600 border-violet-300 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
          {t('段べつ', 'By table')}
        </button>
      </div>

      {subMode === 'range' ? (
        <div>
          <div className="text-xs text-slate-400 mb-2 font-bold">{t('はんい', 'Range')}</div>
          <div className="grid grid-cols-3 gap-2">
            {RANGE_ORDER.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`py-4 rounded-2xl font-black text-sm border-2 transition active:scale-95 cursor-pointer
                  ${range === r ? 'bg-violet-500 border-violet-300 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-violet-400'}`}>
                {RANGES[r].label[t('ja', 'en')] || RANGES[r].label.ja}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-slate-400 mb-2 font-bold">{t('れんしゅうする段', 'Pick a table')}</div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 18 }, (_, i) => i + 2).map(n => (
              <button key={n} onClick={() => setTable(n)}
                className={`py-3 rounded-xl font-black text-sm border-2 transition active:scale-95 cursor-pointer
                  ${table === n ? 'bg-violet-500 border-violet-300 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="text-center text-violet-300 font-black mt-3">{table} {t('の段（× 1〜19）', '× 1–19')}</div>
        </div>
      )}

      {/* コツ表示のオンオフ */}
      <button onClick={() => setShowHints(h => !h)}
        className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 cursor-pointer active:scale-[0.99] transition">
        <span className="text-sm font-bold text-slate-200">💡 {t('インド式のコツを表示', 'Show Indian trick')}</span>
        <span className={`w-11 h-6 rounded-full relative transition-colors ${showHints ? 'bg-violet-500' : 'bg-slate-600'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${showHints ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </button>

      <button onClick={onStart}
        className="w-full bg-violet-500 text-white font-black text-xl py-4 rounded-2xl hover:bg-violet-400 active:scale-95 transition cursor-pointer">
        {t('スタート', 'Start')}（{SESSION_Q}{t('問', 'Q')}）▶
      </button>
    </div>
  )
}

// ── 結果画面 ────────────────────────────────────────────────────────────────────
function ResultScreen({ t, questions, scores, elapsed, onRetry, onConfig }) {
  const correct = scores.filter(Boolean).length
  const pct = Math.round((correct / SESSION_Q) * 100)
  const missed = questions.filter((_, i) => !scores[i])

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="text-center">
        <div className="text-6xl font-black text-violet-300">
          {correct}<span className="text-3xl text-slate-400">/{SESSION_Q}</span>
        </div>
        <div className="text-slate-400 mt-1">{pct}% · ⏱ {fmtTime(elapsed)}</div>
      </div>

      <div className={`w-full text-center py-4 rounded-2xl text-xl font-black ${
        pct === 100 ? 'bg-green-700/30 text-green-300 border border-green-600'
          : pct >= 80 ? 'bg-violet-700/30 text-violet-200 border border-violet-600'
            : 'bg-slate-800 text-slate-300 border border-slate-700'
      }`}>
        {pct === 100 ? `🎉 ${t('全問せいかい！', 'Perfect!')}`
          : pct >= 80 ? `✨ ${t('あと少し！', 'Almost there!')}`
            : `💪 ${t('くりかえし練習しよう', 'Keep practicing')}`}
      </div>

      {missed.length > 0 && (
        <div className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 font-bold">{t('まちがえた問題', 'Missed')}</div>
          <div className="grid grid-cols-2 gap-2">
            {missed.map((m, i) => (
              <div key={i} className="text-sm bg-slate-900 rounded-lg px-3 py-2 text-slate-200">
                {m.a} × {m.b} = <b className="text-yellow-300">{m.answer}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        <button onClick={onRetry}
          className="w-full bg-violet-500 text-white font-black text-lg py-4 rounded-2xl hover:bg-violet-400 active:scale-95 transition cursor-pointer">
          {t('もう一回', 'Again')}
        </button>
        <button onClick={onConfig}
          className="w-full bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl hover:bg-slate-600 active:scale-95 transition cursor-pointer">
          {t('せってい', 'Settings')}
        </button>
      </div>
    </div>
  )
}
