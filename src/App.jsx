import { useState } from 'react'
import NumberSenseGame from './games/NumberSenseGame.jsx'
import HyakumasuGame from './games/HyakumasuGame.jsx'
import IndianMultiplicationGame from './games/IndianMultiplicationGame.jsx'

// ── ゲーム一覧（知育ゲーム集） ──────────────────────────────────────────────────
const GAMES = [
  {
    id: 'hyakumasu',
    emoji: '🔢',
    accent: 'orange',
    title: { ja: '百マス計算', en: 'Hundred Squares' },
    desc: { ja: 'たし算・ひき算・かけ算をタイムアタック。親子・きょうだいで対戦！', en: 'Race 100 squares of +, −, ×. Compete together!' },
    Component: HyakumasuGame,
  },
  {
    id: 'indian',
    emoji: '🧮',
    accent: 'violet',
    title: { ja: 'インド式 九九', en: 'Indian Tables' },
    desc: { ja: '19×19までスラスラ。インド式のコツで暗算名人に。', en: 'Master up to 19 × 19 with the Indian trick.' },
    Component: IndianMultiplicationGame,
  },
  {
    id: 'numbersense',
    emoji: '📐',
    accent: 'yellow',
    title: { ja: '数字感覚トレーニング', en: 'Number Sense' },
    desc: { ja: '万・億・兆を瞬時に読む。概数で大きな数に強くなる。', en: 'Read millions, billions & trillions instantly.' },
    Component: NumberSenseGame,
  },
]

// アクセント色ごとの Tailwind クラス（動的生成だと purge されるため固定で持つ）
const ACCENT = {
  orange: { text: 'text-orange-400', border: 'hover:border-orange-400', ring: 'border-orange-500/40' },
  violet: { text: 'text-violet-400', border: 'hover:border-violet-400', ring: 'border-violet-500/40' },
  yellow: { text: 'text-yellow-400', border: 'hover:border-yellow-400', ring: 'border-yellow-500/40' },
}

export default function App() {
  const [lang, setLang] = useState('ja')
  const [active, setActive] = useState(null) // 選択中のゲーム id（null = ホーム）
  const t = (ja, en) => (lang === 'ja' ? ja : en)

  const game = GAMES.find(g => g.id === active)
  if (game) {
    const G = game.Component
    return <G lang={lang} setLang={setLang} onExit={() => setActive(null)} />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center select-none">
      <header className="w-full max-w-[430px] flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <span className="text-emerald-400 font-black text-base">🎓 {t('ちいくゲーム', 'Brain Games')}</span>
        <button onClick={() => setLang(l => (l === 'ja' ? 'en' : 'ja'))}
          className="text-xs border border-slate-600 rounded px-2 py-1 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition">
          {lang === 'ja' ? 'EN' : 'JP'}
        </button>
      </header>

      <main className="w-full max-w-[430px] flex-1 flex flex-col px-4 py-5 gap-5 overflow-y-auto">
        <div className="text-center">
          <div className="text-3xl font-black text-emerald-400 mb-1">{t('ちいくゲーム集', 'Brain Game Collection')}</div>
          <div className="text-slate-400 text-sm">{t('あそびながら かしこくなろう！', 'Learn while you play!')}</div>
        </div>

        <div className="flex flex-col gap-3">
          {GAMES.map(g => {
            const a = ACCENT[g.accent]
            return (
              <button key={g.id} onClick={() => setActive(g.id)}
                className={`w-full text-left rounded-2xl p-4 flex items-center gap-4 bg-slate-800 border-2 ${a.ring} ${a.border} active:scale-[0.98] transition cursor-pointer`}>
                <span className="text-4xl shrink-0">{g.emoji}</span>
                <div className="flex-1">
                  <div className={`font-black text-lg ${a.text}`}>{g.title[t('ja', 'en')] || g.title.ja}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-snug">{g.desc[t('ja', 'en')] || g.desc.ja}</div>
                </div>
                <span className="text-slate-500 text-xl shrink-0">›</span>
              </button>
            )
          })}
        </div>

        <div className="text-center text-[11px] text-slate-600 mt-auto pt-4">
          {t('スコアはこの端末に保存されます', 'Scores are saved on this device')}
        </div>
      </main>
    </div>
  )
}
