import { useState, useEffect, useRef, useCallback } from 'react'

// ── i18n ──────────────────────────────────────────────────────────────────────
const i18n = {
  ja: {
    title: '数字感覚トレーニング',
    subtitle: '万・億・兆を瞬時に読む',
    start: 'スタート',
    practice: '練習モード',
    test: '昇格テスト',
    history: 'スコア履歴',
    back: '戻る',
    next: '次へ',
    retry: 'もう一度',
    home: 'ホームへ',
    correct: '正解！',
    wrong: '不正解',
    timeout: '時間切れ',
    pass: '合格！',
    fail: '不合格',
    promoted: '昇格！',
    score: 'スコア',
    level: 'レベル',
    section: '編',
    unlocked: '解放済み',
    locked: 'ロック中',
    selectLevel: 'レベルを選択',
    selectSection: '編を選択',
    beginSession: 'ゲーム開始',
    availableTests: '受験可能なテスト',
    noTests: '受験可能なテストがありません。\n練習モードでレベルをクリアしてください。',
    testRule: '10問全問正解で昇格',
    date: '日付',
    mode: 'モード',
    result: '結果',
    accuracy: '正答率',
    noHistory: '履歴がありません',
    calculation: '計算過程',
    answer: '正解',
    sections: {
      number: 'ただの数字編',
      add: '足し算編',
      sub: '引き算編',
      mul: '掛け算編',
      div: '割り算編',
    },
    unlockHint: {
      add: 'ただの数字編 Lv.3 クリアで解放',
      sub: '足し算編 Lv.3 クリアで解放',
      mul: '引き算編 Lv.3 クリアで解放',
      div: '掛け算編 Lv.3 クリアで解放',
    },
    modeLabel: { practice: '練習', test: 'テスト' },
    question: '問',
    seconds: '秒',
    currentLevel: '現在のレベル',
  },
  en: {
    title: 'Number Sense Trainer',
    subtitle: 'Read 万・億・兆 instantly',
    start: 'Start',
    practice: 'Practice Mode',
    test: 'Promotion Test',
    history: 'Score History',
    back: 'Back',
    next: 'Next',
    retry: 'Try Again',
    home: 'Home',
    correct: 'Correct!',
    wrong: 'Wrong',
    timeout: "Time's Up",
    pass: 'Passed!',
    fail: 'Failed',
    promoted: 'Promoted!',
    score: 'Score',
    level: 'Level',
    section: 'Chapter',
    unlocked: 'Unlocked',
    locked: 'Locked',
    selectLevel: 'Select Level',
    selectSection: 'Select Chapter',
    beginSession: 'Start Game',
    availableTests: 'Available Tests',
    noTests: 'No tests available.\nClear a level in Practice Mode to unlock.',
    testRule: 'Get all 10 correct to advance',
    date: 'Date',
    mode: 'Mode',
    result: 'Result',
    accuracy: 'Accuracy',
    noHistory: 'No history yet',
    calculation: 'Calculation',
    answer: 'Answer',
    sections: {
      number: 'Numbers',
      add: 'Addition',
      sub: 'Subtraction',
      mul: 'Multiplication',
      div: 'Division',
    },
    unlockHint: {
      add: 'Clear Numbers Lv.3 to unlock',
      sub: 'Clear Addition Lv.3 to unlock',
      mul: 'Clear Subtraction Lv.3 to unlock',
      div: 'Clear Multiplication Lv.3 to unlock',
    },
    modeLabel: { practice: 'Practice', test: 'Test' },
    question: 'Q',
    seconds: 's',
    currentLevel: 'Current Level',
  },
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTIONS = ['number', 'add', 'sub', 'mul', 'div']
const LEVEL_TIMES = { 1: 10, 2: 5, 3: 3, 4: 2, 5: 1 }
const MAX_LEVELS = 5
const QUESTIONS_PER_SESSION = 10
const STORAGE_KEY = 'numgame_progress'

// ── LocalStorage helpers ───────────────────────────────────────────────────────
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { clearedLevels: {}, unlockedSections: ['number'], scores: [] }
    return JSON.parse(raw)
  } catch {
    return { clearedLevels: {}, unlockedSections: ['number'], scores: [] }
  }
}
function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

// ── Number generation ──────────────────────────────────────────────────────────
const MAN = 10_000
const OKU = 100_000_000
const CHOU = 1_000_000_000_000

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateBaseNumber() {
  const tier = randInt(0, 2)
  if (tier === 0) return randInt(1, 9999) * MAN
  if (tier === 1) return randInt(1, 999) * OKU
  return randInt(1, 999) * CHOU
}

function generateQuestion(section) {
  if (section === 'number') {
    const n = generateBaseNumber()
    return { display: n, result: n, op: null, a: null, b: null }
  }
  if (section === 'add') {
    const a = generateBaseNumber()
    const b = generateBaseNumber()
    return { display: `${fmt(a)} + ${fmt(b)}`, result: a + b, op: '+', a, b }
  }
  if (section === 'sub') {
    const a = generateBaseNumber()
    const b = generateBaseNumber()
    const [big, small] = a >= b ? [a, b] : [b, a]
    if (big === small) return generateQuestion(section)
    return { display: `${fmt(big)} - ${fmt(small)}`, result: big - small, op: '-', a: big, b: small }
  }
  if (section === 'mul') {
    const multiplier = randInt(2, 999)
    const base = generateBaseNumber()
    const result = multiplier * base
    if (result > 999 * CHOU) return generateQuestion(section)
    return { display: `${fmt(multiplier)} × ${fmt(base)}`, result, op: '×', a: multiplier, b: base }
  }
  if (section === 'div') {
    const divisor = randInt(2, 99)
    const quotient = generateBaseNumber()
    const dividend = divisor * quotient
    return { display: `${fmt(dividend)} ÷ ${fmt(divisor)}`, result: quotient, op: '÷', a: dividend, b: divisor }
  }
  return { display: 0, result: 0, op: null, a: null, b: null }
}

function fmt(n) {
  return n.toLocaleString('ja-JP')
}

// ── Rounding to 概数 ──────────────────────────────────────────────────────────
function toApprox(n) {
  if (n <= 0) return { value: 0, label: '0', labelEn: '0', unit: null, coeff: 0 }

  const tiers = [
    { base: CHOU, unit: '兆', unitEn: 'tril' },
    { base: OKU, unit: '億', unitEn: '100M' },
    { base: MAN, unit: '万', unitEn: '10K' },
  ]

  for (const { base, unit, unitEn } of tiers) {
    if (n >= base) {
      const raw = n / base
      const mag = Math.pow(10, Math.floor(Math.log10(raw)))
      // Japanese 四捨五入: add tiny epsilon before rounding to handle .5 correctly
      const rounded = Math.round(raw / mag + 1e-10) * mag
      const coeff = rounded
      return { value: rounded * base, label: `${coeff}${unit}`, labelEn: `${coeff}${unitEn}`, unit, unitEn, coeff }
    }
  }
  const rounded = Math.round(n / 1000) * 1000
  return { value: rounded, label: fmt(rounded), labelEn: fmt(rounded), unit: null, coeff: rounded }
}

// ── Choice generation ──────────────────────────────────────────────────────────
function generateChoices(result) {
  const correct = toApprox(result)
  const choiceMap = new Map()
  choiceMap.set(correct.label, correct)

  const tiers = [
    { base: CHOU, unit: '兆', unitEn: 'tril' },
    { base: OKU, unit: '億', unitEn: '100M' },
    { base: MAN, unit: '万', unitEn: '10K' },
  ]

  const addChoice = (coeff, base, unit, unitEn) => {
    if (coeff <= 0 || choiceMap.size >= 4) return
    const label = `${coeff}${unit}`
    if (!choiceMap.has(label)) {
      choiceMap.set(label, { value: coeff * base, label, labelEn: `${coeff}${unitEn}`, unit, unitEn, coeff })
    }
  }

  const correctTierIdx = tiers.findIndex(t => correct.unit === t.unit)

  // Same-unit neighbors
  if (correct.unit && correctTierIdx >= 0) {
    const { base, unit, unitEn } = tiers[correctTierIdx]
    const c = correct.coeff
    for (const delta of [-1, 1, -2, 2, c, Math.round(c * 1.5)]) {
      const candidate = c + delta
      if (candidate > 0 && candidate !== c) addChoice(candidate, base, unit, unitEn)
      if (choiceMap.size >= 4) break
    }
  }

  // Cross-unit distractors
  for (let i = 0; i < tiers.length && choiceMap.size < 4; i++) {
    if (i === correctTierIdx) continue
    const { base, unit, unitEn } = tiers[i]
    addChoice(randInt(1, 99), base, unit, unitEn)
  }

  // Fallback
  while (choiceMap.size < 4) {
    const tier = tiers[randInt(0, 2)]
    addChoice(randInt(1, 999), tier.base, tier.unit, tier.unitEn)
  }

  const arr = Array.from(choiceMap.values()).slice(0, 4)
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── CircleTimer component ─────────────────────────────────────────────────────
function CircleTimer({ timeLeft, totalTime }) {
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

// ── Confetti component ────────────────────────────────────────────────────────
function Confetti({ active }) {
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

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('ja')
  const t = i18n[lang]

  const [screen, setScreen] = useState('home')
  const [progress, setProgress] = useState(() => loadProgress())

  // Session state
  const [gameConfig, setGameConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [choices, setChoices] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [phase, setPhase] = useState('question') // question | reveal
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [sessionScores, setSessionScores] = useState([])
  const [flash, setFlash] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const timerRef = useRef(null)
  const sessionResultSaved = useRef(false)

  // ── Progress helpers ──────────────────────────────────────────────────────
  const isUnlocked = useCallback((section) => {
    return (progress.unlockedSections || ['number']).includes(section)
  }, [progress])

  const isLevelUnlocked = useCallback((section, level) => {
    if (!isUnlocked(section)) return false
    if (level === 1) return true
    return progress.clearedLevels?.[`${section}-${level - 1}`] === true
  }, [progress, isUnlocked])

  const highestUnlockedLevel = useCallback((section) => {
    if (!isUnlocked(section)) return 0
    for (let l = MAX_LEVELS; l >= 1; l--) {
      if (isLevelUnlocked(section, l)) return l
    }
    return 1
  }, [isLevelUnlocked, isUnlocked])

  // ── Timer ─────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  const startTimer = useCallback((seconds) => {
    clearTimer()
    setTimeLeft(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          timerRef.current = null
          setPhase('reveal')
          setSelectedIdx(-1)
          setFlash('wrong')
          setSessionScores(s => [...s, false])
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  // ── Build & start game ────────────────────────────────────────────────────
  const startGame = useCallback((config) => {
    const qs = Array.from({ length: QUESTIONS_PER_SESSION }, () => {
      const q = generateQuestion(config.section)
      return { ...q, approx: toApprox(q.result) }
    })
    setGameConfig(config)
    setQuestions(qs)
    setQIndex(0)
    setSessionScores([])
    setPhase('question')
    setSelectedIdx(null)
    setFlash(null)
    sessionResultSaved.current = false
    setChoices(generateChoices(qs[0].result))
    setScreen('game')
    startTimer(LEVEL_TIMES[config.level])
  }, [startTimer])

  // ── Answer handler ────────────────────────────────────────────────────────
  const handleAnswer = useCallback((idx) => {
    if (phase !== 'question') return
    clearTimer()
    setSelectedIdx(idx)
    const q = questions[qIndex]
    const correct = choices[idx]?.label === q.approx.label
    setFlash(correct ? 'correct' : 'wrong')
    setSessionScores(prev => [...prev, correct])
    setPhase('reveal')
  }, [phase, questions, qIndex, choices, clearTimer])

  // ── Next question ─────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    setFlash(null)
    const nextIdx = qIndex + 1
    if (nextIdx >= QUESTIONS_PER_SESSION) {
      setScreen('result')
      return
    }
    setQIndex(nextIdx)
    setChoices(generateChoices(questions[nextIdx].result))
    setPhase('question')
    setSelectedIdx(null)
    startTimer(LEVEL_TIMES[gameConfig.level])
  }, [qIndex, questions, gameConfig, startTimer])

  // ── Save session result ───────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'result' || !gameConfig || sessionResultSaved.current) return
    sessionResultSaved.current = true

    const totalCorrect = sessionScores.filter(Boolean).length
    const passed = gameConfig.mode === 'test' && totalCorrect === QUESTIONS_PER_SESSION
    const newScore = {
      date: new Date().toISOString(),
      section: gameConfig.section,
      level: gameConfig.level,
      mode: gameConfig.mode,
      score: totalCorrect,
      total: QUESTIONS_PER_SESSION,
      passed,
    }

    setProgress(prev => {
      const updated = {
        ...prev,
        scores: [newScore, ...(prev.scores || [])],
        clearedLevels: { ...prev.clearedLevels },
        unlockedSections: [...(prev.unlockedSections || ['number'])],
      }

      if (passed) {
        const key = `${gameConfig.section}-${gameConfig.level}`
        updated.clearedLevels[key] = true

        // Unlock next section when Lv.3 is cleared
        if (gameConfig.level === 3) {
          const nextSecMap = { number: 'add', add: 'sub', sub: 'mul', mul: 'div' }
          const nextSec = nextSecMap[gameConfig.section]
          if (nextSec && !updated.unlockedSections.includes(nextSec)) {
            updated.unlockedSections.push(nextSec)
          }
        }

        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }

      saveProgress(updated)
      return updated
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // ── Flash clear ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 400)
    return () => clearTimeout(id)
  }, [flash])

  const bgFlash = flash === 'correct' ? 'bg-green-500/10' : flash === 'wrong' ? 'bg-red-500/10' : ''

  return (
    <div className={`min-h-screen bg-slate-900 text-white flex flex-col items-center transition-colors duration-200 select-none ${bgFlash}`}>
      <Confetti active={showConfetti} />

      {/* Header */}
      <header className="w-full max-w-[430px] flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          {screen !== 'home' && (
            <button
              onClick={() => { clearTimer(); setScreen('home') }}
              className="text-slate-400 hover:text-white text-xl leading-none px-1">
              ←
            </button>
          )}
          <span className="text-yellow-400 font-black text-base">{t.title}</span>
        </div>
        <button
          onClick={() => setLang(l => l === 'ja' ? 'en' : 'ja')}
          className="text-xs border border-slate-600 rounded px-2 py-1 text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition">
          {lang === 'ja' ? 'EN' : 'JP'}
        </button>
      </header>

      <main className="w-full max-w-[430px] flex-1 flex flex-col px-4 py-4 overflow-y-auto">
        {screen === 'home' && (
          <HomeScreen t={t} progress={progress} isUnlocked={isUnlocked}
            highestUnlockedLevel={highestUnlockedLevel} setScreen={setScreen} />
        )}
        {screen === 'practice' && (
          <PracticeScreen t={t} isUnlocked={isUnlocked}
            isLevelUnlocked={isLevelUnlocked} startGame={startGame} />
        )}
        {screen === 'test' && (
          <TestScreen t={t} progress={progress} isUnlocked={isUnlocked}
            isLevelUnlocked={isLevelUnlocked} startGame={startGame} />
        )}
        {screen === 'game' && gameConfig && questions[qIndex] && (
          <GameScreen
            t={t} lang={lang}
            q={questions[qIndex]} qIndex={qIndex}
            choices={choices} timeLeft={timeLeft}
            totalTime={LEVEL_TIMES[gameConfig.level]}
            phase={phase} selectedIdx={selectedIdx}
            onAnswer={handleAnswer} onNext={handleNext}
            section={gameConfig.section} sessionScores={sessionScores}
          />
        )}
        {screen === 'result' && gameConfig && (
          <ResultScreen
            t={t} sessionScores={sessionScores}
            gameConfig={gameConfig} setScreen={setScreen}
            onRetry={() => startGame(gameConfig)}
          />
        )}
        {screen === 'history' && (
          <HistoryScreen t={t} lang={lang} progress={progress} />
        )}
      </main>
    </div>
  )
}

// ── HomeScreen ────────────────────────────────────────────────────────────────
function HomeScreen({ t, progress, isUnlocked, highestUnlockedLevel, setScreen }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center mt-2">
        <div className="text-3xl font-black text-yellow-400 mb-1">{t.title}</div>
        <div className="text-slate-400 text-sm">{t.subtitle}</div>
      </div>

      <div className="flex flex-col gap-2">
        {SECTIONS.map(sec => {
          const unlocked = isUnlocked(sec)
          const lv = highestUnlockedLevel(sec)
          return (
            <div key={sec}
              className={`rounded-xl p-3 flex items-center justify-between border transition
                ${unlocked ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/30 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{sectionEmoji(sec)}</span>
                <div>
                  <div className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-slate-600'}`}>
                    {t.sections[sec]}
                  </div>
                  {unlocked
                    ? <div className="text-xs text-yellow-400">{t.level} {lv}</div>
                    : <div className="text-xs text-slate-600">{t.locked}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unlocked ? (
                  <div className="flex gap-1">
                    {Array.from({ length: MAX_LEVELS }, (_, i) => (
                      <div key={i}
                        className={`w-2 h-2 rounded-full ${progress.clearedLevels?.[`${sec}-${i + 1}`] ? 'bg-yellow-400' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-700">🔒</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={() => setScreen('practice')}
          className="w-full bg-yellow-400 text-slate-900 font-black text-lg py-4 rounded-2xl hover:bg-yellow-300 active:scale-95 transition">
          {t.practice}
        </button>
        <button onClick={() => setScreen('test')}
          className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl hover:bg-blue-500 active:scale-95 transition">
          {t.test}
        </button>
        <button onClick={() => setScreen('history')}
          className="w-full bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl hover:bg-slate-600 active:scale-95 transition">
          {t.history}
        </button>
      </div>
    </div>
  )
}

// ── PracticeScreen ────────────────────────────────────────────────────────────
function PracticeScreen({ t, isUnlocked, isLevelUnlocked, startGame }) {
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(null)

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-yellow-400">{t.practice}</h2>

      <div>
        <div className="text-sm text-slate-400 mb-2">{t.selectSection}</div>
        <div className="flex flex-col gap-2">
          {SECTIONS.map(sec => {
            const unlocked = isUnlocked(sec)
            return (
              <button key={sec} disabled={!unlocked}
                onClick={() => { setSelectedSection(sec); setSelectedLevel(null) }}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 border transition
                  ${!unlocked
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 border-slate-800'
                    : selectedSection === sec
                      ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                      : 'bg-slate-800 border-slate-600 hover:border-slate-400'}`}>
                <span>{sectionEmoji(sec)}</span>
                <span className="font-medium text-sm">{t.sections[sec]}</span>
                {!unlocked && (
                  <span className="ml-auto text-xs text-slate-600 truncate">{t.unlockHint[sec]}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedSection && (
        <div>
          <div className="text-sm text-slate-400 mb-2">{t.selectLevel}</div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: MAX_LEVELS }, (_, i) => {
              const lv = i + 1
              const unlocked = isLevelUnlocked(selectedSection, lv)
              return (
                <button key={lv} disabled={!unlocked}
                  onClick={() => setSelectedLevel(lv)}
                  className={`py-3 rounded-xl font-black text-lg border transition
                    ${!unlocked
                      ? 'opacity-25 cursor-not-allowed bg-slate-800 border-slate-800'
                      : selectedLevel === lv
                        ? 'bg-yellow-400 text-slate-900 border-yellow-400'
                        : 'bg-slate-800 border-slate-600 hover:border-yellow-400 text-white'}`}>
                  {lv}
                </button>
              )
            })}
          </div>
          {selectedLevel && (
            <div className="text-xs text-slate-400 mt-2 text-center">
              {LEVEL_TIMES[selectedLevel]}{t.seconds} / 問
            </div>
          )}
        </div>
      )}

      <button
        disabled={!selectedSection || !selectedLevel}
        onClick={() => startGame({ section: selectedSection, level: selectedLevel, mode: 'practice' })}
        className={`w-full py-4 rounded-2xl font-black text-lg transition mt-auto
          ${selectedSection && selectedLevel
            ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300 active:scale-95'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
        {t.beginSession}
      </button>
    </div>
  )
}

// ── TestScreen ────────────────────────────────────────────────────────────────
function TestScreen({ t, progress, isUnlocked, isLevelUnlocked, startGame }) {
  const available = []
  for (const sec of SECTIONS) {
    if (!isUnlocked(sec)) continue
    for (let lv = 1; lv <= MAX_LEVELS; lv++) {
      if (isLevelUnlocked(sec, lv)) {
        available.push({ section: sec, level: lv })
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-blue-400">{t.test}</h2>
      <div className="text-sm text-slate-300 bg-blue-900/30 border border-blue-800/50 rounded-xl p-3">
        {t.testRule}
      </div>

      {available.length === 0 ? (
        <div className="text-slate-500 text-sm text-center whitespace-pre-line mt-10">{t.noTests}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {available.map(({ section, level }) => {
            const cleared = progress.clearedLevels?.[`${section}-${level}`]
            return (
              <button key={`${section}-${level}`}
                onClick={() => startGame({ section, level, mode: 'test' })}
                className={`w-full p-4 rounded-xl flex items-center justify-between border transition active:scale-95
                  ${cleared
                    ? 'bg-green-900/20 border-green-800 hover:border-green-500'
                    : 'bg-slate-800 border-slate-600 hover:border-blue-400'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{sectionEmoji(section)}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm text-white">{t.sections[section]}</div>
                    <div className="text-xs text-slate-400">{t.level} {level} · {LEVEL_TIMES[level]}{t.seconds}</div>
                  </div>
                </div>
                {cleared
                  ? <span className="text-green-400 font-bold">✓</span>
                  : <span className="text-blue-400">→</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── GameScreen ────────────────────────────────────────────────────────────────
function GameScreen({ t, lang, q, qIndex, choices, timeLeft, totalTime, phase, selectedIdx, onAnswer, onNext, section, sessionScores }) {
  const isArith = section !== 'number'
  const correctLabel = lang === 'ja' ? q.approx.label : (q.approx.labelEn || q.approx.label)

  const displayNumber = section === 'number' ? fmt(q.result) : q.display

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full ${
              i < sessionScores.length
                ? (sessionScores[i] ? 'bg-green-400' : 'bg-red-400')
                : i === qIndex ? 'bg-yellow-400' : 'bg-slate-700'
            }`} />
          ))}
        </div>
        <span className="text-slate-400 text-xs shrink-0">{qIndex + 1}/{QUESTIONS_PER_SESSION}</span>
      </div>

      <CircleTimer timeLeft={timeLeft} totalTime={totalTime} />

      {/* Question display */}
      <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700 min-h-[100px] flex flex-col items-center justify-center">
        {phase === 'question' ? (
          <div className={`font-black text-white leading-tight ${isArith ? 'text-2xl' : 'text-4xl'}`}>
            {displayNumber}
          </div>
        ) : (
          <div>
            {isArith && (
              <>
                <div className="text-lg text-slate-300">{q.display}</div>
                <div className="text-sm text-slate-500 mt-1">= {fmt(q.result)}</div>
              </>
            )}
            {!isArith && (
              <div className="text-4xl font-black text-white">{displayNumber}</div>
            )}
            <div className="text-3xl font-black text-yellow-300 mt-3">{correctLabel}</div>
          </div>
        )}
      </div>

      {/* Choices / reveal */}
      {phase === 'question' ? (
        <div className="grid grid-cols-2 gap-3">
          {choices.map((ch, i) => (
            <button key={i} onClick={() => onAnswer(i)}
              className="bg-slate-700 active:bg-slate-500 active:scale-95 border border-slate-500 rounded-2xl py-7 text-2xl font-black text-white transition-transform duration-75 cursor-pointer">
              {lang === 'ja' ? ch.label : (ch.labelEn || ch.label)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Result badge */}
          <div className={`text-center text-xl font-black py-3 rounded-xl ${
            selectedIdx === -1
              ? 'bg-orange-900/50 text-orange-300 border border-orange-700'
              : choices[selectedIdx]?.label === q.approx.label
                ? 'bg-green-900/50 text-green-300 border border-green-700'
                : 'bg-red-900/50 text-red-300 border border-red-700'
          }`}>
            {selectedIdx === -1
              ? `⏱ ${t.timeout}`
              : choices[selectedIdx]?.label === q.approx.label
                ? `✓ ${t.correct}`
                : `✗ ${t.wrong}`}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {choices.map((ch, i) => {
              const isCorrectChoice = ch.label === q.approx.label
              const isSelected = i === selectedIdx
              return (
                <div key={i}
                  className={`rounded-2xl py-5 text-xl font-black text-center border-2 ${
                    isCorrectChoice
                      ? 'bg-green-700/30 border-green-400 text-green-200'
                      : isSelected
                        ? 'bg-red-700/30 border-red-400 text-red-200'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                  {lang === 'ja' ? ch.label : (ch.labelEn || ch.label)}
                </div>
              )
            })}
          </div>

          <button onClick={onNext}
            className="w-full bg-yellow-400 text-slate-900 font-black text-lg py-4 rounded-2xl hover:bg-yellow-300 active:scale-95 transition">
            {qIndex + 1 < QUESTIONS_PER_SESSION ? t.next : `${t.score} →`}
          </button>
        </div>
      )}
    </div>
  )
}

// ── ResultScreen ──────────────────────────────────────────────────────────────
function ResultScreen({ t, sessionScores, gameConfig, setScreen, onRetry }) {
  const total = sessionScores.length
  const correct = sessionScores.filter(Boolean).length
  const passed = gameConfig.mode === 'test' && correct === total

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="text-center">
        <div className="text-7xl font-black text-yellow-400">
          {correct}
          <span className="text-3xl text-slate-400">/{total}</span>
        </div>
        <div className="text-slate-400 mt-1">{Math.round((correct / Math.max(1, total)) * 100)}%</div>
        <div className="text-sm text-slate-500 mt-1">
          {t.sections[gameConfig.section]} · {t.level} {gameConfig.level}
        </div>
      </div>

      {gameConfig.mode === 'test' && (
        <div className={`w-full text-center py-5 rounded-2xl text-2xl font-black ${
          passed
            ? 'bg-green-700/30 text-green-300 border border-green-600'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {passed ? `🎉 ${t.promoted}` : t.fail}
        </div>
      )}

      {/* Per-question dots */}
      <div className="flex gap-2 flex-wrap justify-center">
        {sessionScores.map((s, i) => (
          <div key={i}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
              s ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
            {i + 1}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button onClick={onRetry}
          className="w-full bg-yellow-400 text-slate-900 font-black text-lg py-4 rounded-2xl hover:bg-yellow-300 active:scale-95 transition">
          {t.retry}
        </button>
        <button onClick={() => setScreen('home')}
          className="w-full bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl hover:bg-slate-600 active:scale-95 transition">
          {t.home}
        </button>
      </div>
    </div>
  )
}

// ── HistoryScreen ─────────────────────────────────────────────────────────────
function HistoryScreen({ t, lang, progress }) {
  const scores = progress.scores || []

  const sectionStats = Object.fromEntries(SECTIONS.map(sec => {
    const rel = scores.filter(s => s.section === sec)
    const totalQ = rel.reduce((a, s) => a + s.total, 0)
    const correctQ = rel.reduce((a, s) => a + s.score, 0)
    return [sec, totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : null]
  }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-200">{t.history}</h2>

      {/* Accuracy chart */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="text-sm text-slate-400 mb-3">{t.accuracy}</div>
        {SECTIONS.filter(s => sectionStats[s] !== null).length === 0 ? (
          <div className="text-slate-500 text-sm">{t.noHistory}</div>
        ) : (
          SECTIONS.map(sec => sectionStats[sec] !== null && (
            <div key={sec} className="flex items-center gap-2 mb-2">
              <span className="text-sm w-20 text-slate-300 shrink-0">{t.sections[sec]}</span>
              <div className="flex-1 bg-slate-700 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all"
                  style={{ width: `${sectionStats[sec]}%` }}
                />
              </div>
              <span className="text-xs text-yellow-400 w-8 text-right">{sectionStats[sec]}%</span>
            </div>
          ))
        )}
      </div>

      {/* Score list */}
      <div className="flex flex-col gap-2">
        {scores.length === 0 && (
          <div className="text-slate-500 text-sm text-center mt-4">{t.noHistory}</div>
        )}
        {scores.slice(0, 50).map((s, i) => (
          <div key={i} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between border border-slate-700">
            <div>
              <div className="text-sm font-bold text-white">{t.sections[s.section]} · {t.level} {s.level}</div>
              <div className="text-xs text-slate-500">
                {t.modeLabel[s.mode]} · {new Date(s.date).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US')}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-black text-lg ${s.score === s.total ? 'text-green-400' : 'text-slate-300'}`}>
                {s.score}/{s.total}
              </div>
              {s.mode === 'test' && (
                <div className={`text-xs ${s.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {s.passed ? t.pass : t.fail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Util ──────────────────────────────────────────────────────────────────────
function sectionEmoji(sec) {
  return { number: '🔢', add: '➕', sub: '➖', mul: '✖️', div: '➗' }[sec] || '❓'
}
