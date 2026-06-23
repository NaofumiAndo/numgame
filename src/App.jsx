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
    roundRule: '一番大きな位で四捨五入！',
    roundHint: '例: 5,998,981 → 600万 ／ 51,600,000,000 → 500億',
    submit: '決定',
    clear: 'クリア',
    yourAnswer: 'あなたの回答',
    inputPlaceholder: '数字をタップ →（単位ボタンで確定）',
    testFailNote: '昇格テストは1問でも不正解で終了です',
    sections: {
      number: '数字読み編',
      add: '足し算編',
      sub: '引き算編',
      mul: '掛け算編',
      div: '割り算編',
    },
    unlockHint: {
      add: '数字読み編 Lv.3 クリアで解放',
      sub: '足し算編 Lv.3 クリアで解放',
      mul: '引き算編 Lv.3 クリアで解放',
      div: '掛け算編 Lv.3 クリアで解放',
    },
    modeLabel: { practice: '練習', test: 'テスト' },
    question: '問',
    seconds: '秒',
    currentLevel: '現在のレベル',
    promotionTestQ: '昇格試験を始めますか？',
    beginTest: '始める',
    cancelTest: 'やめる',
    clearedTag: 'クリア済み',
    promoTag: '昇格試験',
    allClear: '全レベルクリア！',
    tapLevelHint: 'レベルを選んで挑戦',
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
    roundRule: 'Round to the leading digit!',
    roundHint: 'e.g. 5,998,981 → 6 million / 51,600,000,000 → 50 billion',
    submit: 'Enter',
    clear: 'Clear',
    yourAnswer: 'Your answer',
    inputPlaceholder: 'Tap digits → a unit to submit',
    testFailNote: 'One wrong answer ends the promotion test',
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
    promotionTestQ: 'Start the promotion test?',
    beginTest: 'Start',
    cancelTest: 'Cancel',
    clearedTag: 'Cleared',
    promoTag: 'Promotion Test',
    allClear: 'All levels cleared!',
    tapLevelHint: 'Pick a level to play',
  },
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTIONS = ['number', 'add', 'sub', 'mul', 'div']
// 数字読み編の基準時間（秒/問）。足し算・引き算・掛け算・割り算は +5秒。
const LEVEL_TIMES = { 1: 10, 2: 8, 3: 5, 4: 4, 5: 3 }
const SECTION_TIME_BONUS = 5
// 編ごとにレベル別の制限時間を上書きする（指定がなければ既定の計算式を使う）
const SECTION_LEVEL_TIMES = {
  add: { 1: 15, 2: 15, 3: 15, 4: 10, 5: 5 },
}
function levelTime(section, level) {
  const override = SECTION_LEVEL_TIMES[section]?.[level]
  if (override != null) return override
  return LEVEL_TIMES[level] + (section === 'number' ? 0 : SECTION_TIME_BONUS)
}
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

// 整数の桁数を返す（例: 45000000 → 8）
function digitCount(n) {
  return String(Math.trunc(Math.abs(n))).length
}

// 「5桁以上の数字 + 単位（兆以外）」表記の値を生成する
// 例: 45,550 万 → 値 455,500,000。最大でも約1000兆 < 9000兆。
// unitMult を渡すと単位を固定できる（未指定なら 万 / 億 をランダム）。
function generateUnitValue(unitMult = Math.random() < 0.5 ? MAN : OKU) {
  const digitsCount = randInt(5, 7)
  const min = Math.pow(10, digitsCount - 1)
  const max = Math.pow(10, digitsCount) - 1
  const digitPart = randInt(min, max)
  return digitPart * unitMult
}

// 数字読み編・後半（6問目以降）用：「大きな数字 + 単位（兆以外）」の問題
function generateUnitNumberQuestion() {
  const value = generateUnitValue()
  return { display: value, result: value, op: null, a: null, b: null, kind: 'unitnum' }
}

function generateQuestion(section, index = 0, level = 1) {
  if (section === 'number') {
    // 後半5問（index 5..9）は「数字＋単位」表記の問題も混ぜる
    if (index >= QUESTIONS_PER_SESSION / 2 && Math.random() < 0.5) {
      return generateUnitNumberQuestion()
    }
    const n = generateBaseNumber()
    return { display: n, result: n, op: null, a: null, b: null }
  }
  if (section === 'add') {
    // レベル3以上では「5桁以上＋単位」表記同士の足し算も混ぜる
    if (level >= 3 && Math.random() < 0.5) {
      const unitMult = Math.random() < 0.5 ? MAN : OKU // 2つとも同じ単位にする
      const a = generateUnitValue(unitMult)
      const b = generateUnitValue(unitMult)
      return {
        display: `${formatUnitNum(a, 'ja')} + ${formatUnitNum(b, 'ja')}`,
        result: a + b, op: '+', a, b, kind: 'unitadd',
      }
    }
    // 通常の足し算：レベルに応じて2数の桁数の関係を制約する
    //   Lv1      : 桁数が2つ以上離れたペアのみ（同桁・1桁差は出さない）
    //   Lv2以上 : 同じ桁数または1桁差のペアのみ
    for (let tries = 0; tries < 100; tries++) {
      const a = generateBaseNumber()
      const b = generateBaseNumber()
      const diff = Math.abs(digitCount(a) - digitCount(b))
      const ok = level === 1 ? diff >= 2 : diff <= 1
      if (ok) return { display: `${fmt(a)} + ${fmt(b)}`, result: a + b, op: '+', a, b }
    }
    // フォールバック（条件を満たすペアが見つからない場合）
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

// ── 単位定義（言語別） ─────────────────────────────────────────────────────────
// 日本語は4桁区切り（万=10^4, 億=10^8, 兆=10^12）、英語は3桁区切り（thousand=10^3 …）
const UNITS = {
  ja: [
    { label: '兆', mult: 1e12 },
    { label: '億', mult: 1e8 },
    { label: '万', mult: 1e4 },
    { label: '千', mult: 1e3 },
  ],
  en: [
    { label: 'trillion', mult: 1e12 },
    { label: 'billion', mult: 1e9 },
    { label: 'million', mult: 1e6 },
    { label: 'thousand', mult: 1e3 },
  ],
}
const UNIT_MULT = {
  '兆': 1e12, '億': 1e8, '万': 1e4, '千': 1e3,
  trillion: 1e12, billion: 1e9, million: 1e6, thousand: 1e3,
  '': 1,
}

// ── 数値 → 概数ラベル（その言語で最大の単位で表現） ────────────────────────────
function labelFromValue(value, lang = 'ja') {
  if (value <= 0) return { value: 0, label: '0', unit: null, coeff: 0 }
  for (const u of UNITS[lang]) {
    if (value >= u.mult) {
      const coeff = Math.round(value / u.mult)
      const label = lang === 'ja' ? `${coeff}${u.label}` : `${coeff} ${u.label}`
      return { value, label, unit: u.label, coeff }
    }
  }
  return { value, label: String(value), unit: null, coeff: value }
}

// ── 概数への四捨五入（一番大きな位で四捨五入 = 最上位1桁に丸める） ──────────────
function toApprox(n) {
  if (n <= 0) return { value: 0 }
  // 丸めは値の有効数字1桁化なので単位系に依存しない
  let base
  if (n >= 1e12) base = 1e12
  else if (n >= 1e8) base = 1e8
  else base = 1e4
  const raw = n / base
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  // 日本語の四捨五入（0.5 は切り上げ）。微小値を足して浮動小数の誤差を補正
  const rounded = Math.round(raw / mag + 1e-10) * mag
  return { value: rounded * base }
}

// ── ユーザー入力（数字文字列 + 単位）を数値に変換 ──────────────────────────────
function parseInput(numStr, unit) {
  if (!numStr) return null
  const n = parseInt(numStr, 10)
  if (Number.isNaN(n)) return null
  return n * (UNIT_MULT[unit] ?? 1)
}

// ── 値を「大きな数字 + 単位（最上位以外）」表記に変換（例: 455,500,000 → "45,550 万"） ──
// 言語に応じて単位系を切り替え、桁数が読みごたえのある（4〜8桁）表記を優先する。
function formatUnitNum(value, lang = 'ja') {
  const units = lang === 'ja'
    ? [{ label: '億', mult: 1e8 }, { label: '万', mult: 1e4 }]
    : [{ label: 'billion', mult: 1e9 }, { label: 'million', mult: 1e6 }, { label: 'thousand', mult: 1e3 }]
  for (const u of units) {
    if (value % u.mult === 0) {
      const d = value / u.mult
      const len = String(d).length
      if (len >= 4 && len <= 8) return `${fmt(d)} ${u.label}`
    }
  }
  // フォールバック：最小単位で割り切れる表記
  const u = units[units.length - 1]
  return `${fmt(Math.round(value / u.mult))} ${u.label}`
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
  const [viewSection, setViewSection] = useState('number') // 編詳細で表示中の編
  const [progress, setProgress] = useState(() => loadProgress())

  const openSection = useCallback((sec) => {
    setViewSection(sec)
    setScreen('section')
  }, [])

  // Session state
  const [gameConfig, setGameConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [phase, setPhase] = useState('question') // question | reveal
  const [sessionScores, setSessionScores] = useState([])
  const [flash, setFlash] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  // 入力（電卓式）
  const [inputNum, setInputNum] = useState('')   // 数字部分の文字列
  const [inputUnit, setInputUnit] = useState('') // '兆' | '億' | '万' | ''
  const [reveal, setReveal] = useState(null)     // { correct: bool|'timeout', value: number|null }

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
          setReveal({ correct: 'timeout', value: null })
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
    const qs = Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => {
      const q = generateQuestion(config.section, i, config.level)
      return { ...q, approx: toApprox(q.result) }
    })
    setGameConfig(config)
    setQuestions(qs)
    setQIndex(0)
    setSessionScores([])
    setPhase('question')
    setInputNum('')
    setInputUnit('')
    setReveal(null)
    setFlash(null)
    sessionResultSaved.current = false
    setScreen('game')
    startTimer(levelTime(config.section, config.level))
  }, [startTimer])

  // ── 入力ハンドラ（電卓式） ──────────────────────────────────────────────────
  const handleDigit = useCallback((d) => {
    if (phase !== 'question') return
    if (inputUnit) return // 単位入力後は数字を受け付けない（削除で戻す）
    setInputNum(prev => (prev === '0' ? d : (prev + d).slice(0, 6)))
  }, [phase, inputUnit])

  // 単位をタップしたら自動で確定（提出）
  const handleUnit = useCallback((u) => {
    if (phase !== 'question' || !inputNum) return
    clearTimer()
    setInputUnit(u)
    const q = questions[qIndex]
    const val = parseInput(inputNum, u)
    const correct = val === q.approx.value
    setReveal({ correct, value: val })
    setFlash(correct ? 'correct' : 'wrong')
    setSessionScores(prev => [...prev, correct])
    setPhase('reveal')
  }, [phase, inputNum, questions, qIndex, clearTimer])

  const handleDelete = useCallback(() => {
    if (phase !== 'question') return
    if (inputUnit) { setInputUnit(''); return }
    setInputNum(prev => prev.slice(0, -1))
  }, [phase, inputUnit])

  const handleClear = useCallback(() => {
    if (phase !== 'question') return
    setInputNum('')
    setInputUnit('')
  }, [phase])

  // ── Next question ─────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    setFlash(null)
    const nextIdx = qIndex + 1
    if (nextIdx >= QUESTIONS_PER_SESSION) {
      setScreen('result')
      return
    }
    setQIndex(nextIdx)
    setPhase('question')
    setInputNum('')
    setInputUnit('')
    setReveal(null)
    startTimer(levelTime(gameConfig.section, gameConfig.level))
  }, [qIndex, gameConfig, startTimer])

  // ── セッション結果を保存（履歴・解放状況の更新） ──────────────────────────────
  const saveResult = useCallback((scores, config) => {
    if (sessionResultSaved.current || !config) return
    sessionResultSaved.current = true

    const totalCorrect = scores.filter(Boolean).length
    const passed = config.mode === 'test' && totalCorrect === QUESTIONS_PER_SESSION
    const newScore = {
      date: new Date().toISOString(),
      section: config.section,
      level: config.level,
      mode: config.mode,
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
        const key = `${config.section}-${config.level}`
        updated.clearedLevels[key] = true

        // Lv.3 クリアで次の編を解放
        if (config.level === 3) {
          const nextSecMap = { number: 'add', add: 'sub', sub: 'mul', mul: 'div' }
          const nextSec = nextSecMap[config.section]
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
  }, [])

  // 結果画面（練習・テスト合格）に入ったら保存
  useEffect(() => {
    if (screen === 'result') saveResult(sessionScores, gameConfig)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // 昇格テストで不正解 → 結果画面を挟まず即やり直し / ホームへ
  const failTestRetry = useCallback(() => {
    saveResult(sessionScores, gameConfig)
    startGame(gameConfig)
  }, [saveResult, sessionScores, gameConfig, startGame])

  const failTestHome = useCallback(() => {
    saveResult(sessionScores, gameConfig)
    clearTimer()
    setScreen('home')
  }, [saveResult, sessionScores, gameConfig, clearTimer])

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
          {screen !== 'home' && (
            <span className="text-yellow-400 font-black text-base">{t.title}</span>
          )}
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
            highestUnlockedLevel={highestUnlockedLevel}
            onOpenSection={openSection} setScreen={setScreen} />
        )}
        {screen === 'section' && (
          <SectionScreen t={t} section={viewSection} progress={progress}
            isLevelUnlocked={isLevelUnlocked} startGame={startGame} />
        )}
        {screen === 'game' && gameConfig && questions[qIndex] && (
          <GameScreen
            t={t} lang={lang}
            q={questions[qIndex]} qIndex={qIndex}
            timeLeft={timeLeft}
            totalTime={levelTime(gameConfig.section, gameConfig.level)}
            phase={phase} reveal={reveal}
            inputNum={inputNum} inputUnit={inputUnit}
            onDigit={handleDigit} onUnit={handleUnit}
            onDelete={handleDelete} onClear={handleClear}
            onNext={handleNext} onFailRetry={failTestRetry} onFailHome={failTestHome}
            section={gameConfig.section} mode={gameConfig.mode} sessionScores={sessionScores}
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
// 編を選ぶだけのシンプルなホーム。編をタップ → その編のレベル一覧へ。
function HomeScreen({ t, progress, isUnlocked, highestUnlockedLevel, onOpenSection, setScreen }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <div className="text-3xl font-black text-yellow-400 mb-1">{t.title}</div>
        <div className="text-slate-400 text-sm">{t.subtitle}</div>
      </div>

      <div className="flex flex-col gap-2">
        {SECTIONS.map(sec => {
          const unlocked = isUnlocked(sec)
          const lv = highestUnlockedLevel(sec)
          return (
            <button key={sec} disabled={!unlocked}
              onClick={() => onOpenSection(sec)}
              className={`w-full text-left rounded-xl p-3 flex items-center justify-between border transition
                ${unlocked
                  ? 'bg-slate-800 border-slate-600 hover:border-yellow-400 active:scale-[0.98] cursor-pointer'
                  : 'bg-slate-800/30 border-slate-800 cursor-not-allowed'}`}>
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
                  <>
                    <div className="flex gap-1">
                      {Array.from({ length: MAX_LEVELS }, (_, i) => (
                        <div key={i}
                          className={`w-2 h-2 rounded-full ${progress.clearedLevels?.[`${sec}-${i + 1}`] ? 'bg-yellow-400' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <span className="text-slate-500 text-lg leading-none">›</span>
                  </>
                ) : (
                  <span className="text-slate-700">🔒</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <button onClick={() => setScreen('history')}
        className="w-full bg-slate-700/60 text-slate-300 font-bold py-3 rounded-2xl hover:bg-slate-600 active:scale-95 transition text-sm">
        {t.history}
      </button>
    </div>
  )
}

// ── SectionScreen（編の詳細：レベルを選んで開始） ──────────────────────────────
// クリア済みレベル → 即・練習。次に解放すべきレベル → 確認後に昇格試験。
function SectionScreen({ t, section, progress, isLevelUnlocked, startGame }) {
  const [pendingTest, setPendingTest] = useState(null) // { level } | null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{sectionEmoji(section)}</span>
        <div>
          <h2 className="text-xl font-bold text-yellow-400">{t.sections[section]}</h2>
          <div className="text-xs text-slate-400">{t.tapLevelHint}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: MAX_LEVELS }, (_, i) => {
          const lv = i + 1
          const cleared = progress.clearedLevels?.[`${section}-${lv}`] === true
          const unlocked = isLevelUnlocked(section, lv)
          const timeText = `${levelTime(section, lv)}${t.seconds}/${t.question}`

          // ロック中：押せない
          if (!cleared && !unlocked) {
            return (
              <div key={lv}
                className="w-full p-4 rounded-2xl flex items-center justify-between border-2 bg-slate-800/30 border-slate-800 opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-600 w-7 text-center">{lv}</span>
                  <span className="text-sm text-slate-600">{t.locked}</span>
                </div>
                <span className="text-slate-700">🔒</span>
              </div>
            )
          }

          // クリア済み → 練習 ／ 次に解放すべき → 昇格試験（確認あり）
          const onClick = cleared
            ? () => startGame({ section, level: lv, mode: 'practice' })
            : () => setPendingTest({ level: lv })

          return (
            <button key={lv} onClick={onClick}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition active:scale-95 cursor-pointer
                ${cleared
                  ? 'bg-green-900/20 border-green-700 hover:border-green-400'
                  : 'bg-blue-600/15 border-blue-500 hover:border-blue-300'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black w-7 text-center ${cleared ? 'text-green-300' : 'text-blue-300'}`}>{lv}</span>
                <div className="text-left">
                  <div className={`font-bold text-sm ${cleared ? 'text-green-300' : 'text-blue-200'}`}>
                    {cleared ? t.modeLabel.practice : t.promoTag}
                  </div>
                  <div className="text-xs text-slate-400">{timeText}</div>
                </div>
              </div>
              {cleared
                ? <span className="text-green-400 text-xs font-bold">{t.clearedTag} ✓</span>
                : <span className="text-blue-300 text-lg">▶</span>}
            </button>
          )
        })}
      </div>

      {/* 昇格試験の確認ダイアログ */}
      {pendingTest && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => setPendingTest(null)}>
          <div onClick={e => e.stopPropagation()}
            className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-[320px] text-center flex flex-col gap-4">
            <div>
              <div className="text-lg font-black text-white">{t.sections[section]} {t.level} {pendingTest.level}</div>
              <div className="text-blue-300 font-bold mt-1">{t.promotionTestQ}</div>
            </div>
            <div className="text-xs text-amber-300/90 bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2">
              ⚠️ {t.testFailNote}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingTest(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-700 text-slate-300 active:scale-95 transition cursor-pointer">
                {t.cancelTest}
              </button>
              <button onClick={() => {
                  const lv = pendingTest.level
                  setPendingTest(null)
                  startGame({ section, level: lv, mode: 'test' })
                }}
                className="flex-1 py-3 rounded-xl font-black bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition cursor-pointer">
                {t.beginTest}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── GameScreen ────────────────────────────────────────────────────────────────
function GameScreen({ t, lang, q, qIndex, timeLeft, totalTime, phase, reveal,
  inputNum, inputUnit, onDigit, onUnit, onDelete, onClear, onNext, onFailRetry, onFailHome, section, mode, sessionScores }) {
  const testFailed = mode === 'test' && reveal && reveal.correct !== true
  const isArith = section !== 'number'
  const correctLabel = labelFromValue(q.approx.value, lang).label
  const displayNumber = section === 'number'
    ? (q.kind === 'unitnum' ? formatUnitNum(q.result, lang) : fmt(q.result))
    : q.display
  const units = UNITS[lang]

  const isCorrect = reveal?.correct === true
  const isTimeout = reveal?.correct === 'timeout'

  return (
    <div className="flex flex-col gap-3">
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

      {/* 四捨五入ルールの明示 */}
      <div className="bg-yellow-400 border-2 border-yellow-300 rounded-xl px-3 py-3 text-center shadow-lg shadow-yellow-400/20">
        <div className="text-slate-900 font-black text-xl leading-tight">📐 {t.roundRule}</div>
        <div className="text-slate-800 font-bold text-xs mt-1">{t.roundHint}</div>
      </div>

      <CircleTimer timeLeft={timeLeft} totalTime={totalTime} />

      {/* Question display */}
      <div className="bg-slate-800 rounded-2xl p-5 text-center border border-slate-700 min-h-[90px] flex flex-col items-center justify-center">
        {phase === 'question' ? (
          <div className={`font-black text-white leading-tight ${isArith ? 'text-2xl' : (q.kind === 'unitnum' ? 'text-3xl' : 'text-4xl')}`}>
            {displayNumber}
          </div>
        ) : (
          <div>
            {isArith && (
              <>
                <div className="text-base text-slate-300">{q.display}</div>
                <div className="text-sm text-slate-500 mt-1">= {fmt(q.result)}</div>
              </>
            )}
            {!isArith && (
              <div className="text-3xl font-black text-white">{displayNumber}</div>
            )}
            <div className="text-xs text-slate-400 mt-2">{t.answer}</div>
            <div className="text-4xl font-black text-yellow-300">{correctLabel}</div>
          </div>
        )}
      </div>

      {phase === 'question' ? (
        <>
          {/* 入力ディスプレイ */}
          <div className="bg-slate-900 border-2 border-slate-600 rounded-xl px-4 py-3 min-h-[56px] flex items-center justify-center">
            {inputNum ? (
              <span className="text-3xl font-black text-white">
                {fmt(parseInt(inputNum, 10))}
                <span className="text-yellow-400">{lang === 'ja' ? inputUnit : (inputUnit && ` ${inputUnit}`)}</span>
              </span>
            ) : (
              <span className="text-slate-600 text-sm">{t.inputPlaceholder}</span>
            )}
          </div>

          {/* キーパッド：左=数字 / 右=単位（単位タップで自動確定） */}
          <div className="flex gap-2">
            <div className="grid grid-cols-3 gap-2 flex-1">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={() => onDigit(d)}
                  disabled={!!inputUnit}
                  className="bg-slate-700 active:bg-slate-500 disabled:opacity-30 rounded-xl py-3 text-2xl font-black text-white transition-transform active:scale-95 cursor-pointer">
                  {d}
                </button>
              ))}
              <button onClick={onClear}
                className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-sm font-bold text-slate-300 transition-transform active:scale-95 cursor-pointer">
                {t.clear}
              </button>
              <button onClick={() => onDigit('0')}
                disabled={!!inputUnit}
                className="bg-slate-700 active:bg-slate-500 disabled:opacity-30 rounded-xl py-3 text-2xl font-black text-white transition-transform active:scale-95 cursor-pointer">
                0
              </button>
              <button onClick={onDelete}
                className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-xl font-bold text-slate-300 transition-transform active:scale-95 cursor-pointer">
                ←
              </button>
            </div>
            <div className={`flex flex-col gap-2 ${lang === 'ja' ? 'w-16' : 'w-24'}`}>
              {units.map(u => (
                <button key={u.label} onClick={() => onUnit(u.label)}
                  disabled={!inputNum}
                  className={`flex-1 rounded-xl font-black leading-tight transition-transform active:scale-95 cursor-pointer disabled:opacity-30
                    ${lang === 'ja' ? 'text-2xl' : 'text-xs'}
                    bg-blue-700 active:bg-blue-500 text-white`}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 判定バッジ */}
          <div className={`text-center text-xl font-black py-3 rounded-xl border ${
            isTimeout
              ? 'bg-orange-900/50 text-orange-300 border-orange-700'
              : isCorrect
                ? 'bg-green-900/50 text-green-300 border-green-700'
                : 'bg-red-900/50 text-red-300 border-red-700'
          }`}>
            {isTimeout ? `⏱ ${t.timeout}` : isCorrect ? `✓ ${t.correct}` : `✗ ${t.wrong}`}
          </div>

          {/* あなたの回答 vs 正解 */}
          {!isTimeout && (
            <div className="flex items-stretch gap-2 text-center">
              <div className="flex-1 bg-slate-800 rounded-xl py-3 border border-slate-700">
                <div className="text-xs text-slate-500">{t.yourAnswer}</div>
                <div className={`text-2xl font-black ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                  {reveal?.value != null ? labelFromValue(reveal.value, lang).label : '—'}
                </div>
              </div>
              <div className="flex-1 bg-slate-800 rounded-xl py-3 border border-green-700">
                <div className="text-xs text-slate-500">{t.answer}</div>
                <div className="text-2xl font-black text-yellow-300">{correctLabel}</div>
              </div>
            </div>
          )}

          {testFailed ? (
            <>
              {/* 昇格テストは1問でも不正解で終了 → その場でやり直し / ホームへ */}
              <div className="text-center text-sm text-red-300 font-bold">{t.testFailNote}</div>
              <button onClick={onFailRetry}
                className="w-full bg-yellow-400 text-slate-900 font-black text-lg py-4 rounded-2xl active:scale-95 transition cursor-pointer">
                {t.retry}
              </button>
              <button onClick={onFailHome}
                className="w-full bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl active:scale-95 transition cursor-pointer">
                {t.home}
              </button>
            </>
          ) : (
            <button onClick={onNext}
              className="w-full bg-yellow-400 text-slate-900 font-black text-lg py-4 rounded-2xl active:scale-95 transition cursor-pointer">
              {qIndex + 1 < QUESTIONS_PER_SESSION ? t.next : `${t.score} →`}
            </button>
          )}
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
