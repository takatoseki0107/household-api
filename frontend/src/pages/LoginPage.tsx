import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました'
      if (message.includes('Incorrect username or password')) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (message.includes('User does not exist')) {
        setError('アカウントが見つかりません')
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6F0' }}>

      {/* ナビゲーションバー */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span
          className="text-2xl font-black tracking-tight"
          style={{ background: 'linear-gradient(135deg, #F5A623, #D85A30)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Aibo
        </span>
        <div className="flex items-center gap-4">
          <a
            href="#login-form"
            className="text-sm font-medium transition hover:opacity-70"
            style={{ color: '#3D1F0F' }}
          >
            ログイン
          </a>
          <Link
            to="/signup"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white shadow transition hover:opacity-90"
            style={{ backgroundColor: '#D85A30', textDecoration: 'none' }}
          >
            無料で始める
          </Link>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <main className="flex flex-col items-center text-center px-6 pt-16 pb-12">

        {/* バッジ */}
        <div
          className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-8"
          style={{ backgroundColor: '#FDEEE6', color: '#D85A30' }}
        >
          AI × 家計簿 × 相棒
        </div>

        {/* キャッチコピー */}
        <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#3D1F0F' }}>
          お金の管理、<br />
          <span style={{ color: '#D85A30' }}>AIがそっと支えます。</span>
        </h1>

        {/* サブテキスト */}
        <p className="text-base leading-relaxed mb-2" style={{ color: '#7A4A30' }}>
          Aibo は、あなたの収支データをもとにAIがアドバイスを自動生成します。
        </p>
        <p className="text-sm mb-10" style={{ color: '#B07050' }}>
          Aibo とは ── AI（人工知能）× 簿（家計簿）× 相棒
        </p>

        {/* CTAボタン */}
        <div className="flex items-center gap-4 mb-16">
          <button
            onClick={() => document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 rounded-full text-sm font-bold text-white shadow transition hover:opacity-90"
            style={{ backgroundColor: '#D85A30' }}
          >
            ログインして始める →
          </button>
          <button
            onClick={() => document.getElementById('login-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 rounded-full text-sm font-semibold transition hover:opacity-70"
            style={{ border: '1.5px solid #D85A30', color: '#D85A30', backgroundColor: 'transparent' }}
          >
            ログイン
          </button>
        </div>

        {/* 特徴カード */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          {[
            { icon: '📒', title: '収支を記録', desc: '収入・支出をシンプルに登録。カテゴリで分類できます。' },
            { icon: '🤖', title: 'AIがアドバイス', desc: '直近3ヶ月のデータをもとに改善ポイントを提案。' },
            { icon: '📊', title: 'サマリーを確認', desc: '収入・支出・残高をひと目で把握できます。' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-5 text-left shadow-sm"
              style={{ backgroundColor: '#FFF8F3', border: '1px solid #F0D8C8' }}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-semibold mb-1" style={{ color: '#3D1F0F' }}>{title}</div>
              <div className="text-xs leading-relaxed" style={{ color: '#9A6050' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* ログインフォーム */}
        <div className="w-full max-w-sm">
          <p className="text-lg font-bold mb-1" style={{ color: '#3D1F0F' }}>Aiboでできること</p>
          <p className="text-sm mb-6" style={{ color: '#B07050' }}>まずはログインして始めましょう</p>
          <div
            className="rounded-3xl shadow-lg p-8 text-left"
            style={{ backgroundColor: '#fff', border: '1px solid #F0D8C8' }}
          >
            <h2 className="text-xl font-bold text-center mb-1" style={{ color: '#3D1F0F' }}>
              おかえりなさい
            </h2>
            <p className="text-sm text-center mb-7" style={{ color: '#B07050' }}>
              あなたの家計の相棒、Aiboです
            </p>

            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A4A30' }}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="mail@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                  style={{ backgroundColor: '#FDF6F0', border: '1.5px solid #E8C9B0', color: '#3D1F0F' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#D85A30')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E8C9B0')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A4A30' }}>
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                  style={{ backgroundColor: '#FDF6F0', border: '1.5px solid #E8C9B0', color: '#3D1F0F' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#D85A30')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E8C9B0')}
                />
              </div>

              {error && (
                <div
                  className="text-sm rounded-xl px-4 py-3"
                  style={{ backgroundColor: '#FEE8E0', color: '#C0392B' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                style={{ backgroundColor: '#D85A30' }}
              >
                {isLoading ? 'ログイン中...' : 'ログイン →'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-4" style={{ color: '#B07050' }}>
            アカウントをお持ちでない方は{' '}
            <Link to="/signup" style={{ color: '#D85A30', fontWeight: 600 }}>
              無料で始める
            </Link>
          </p>
          <p className="text-center text-xs mt-3" style={{ color: '#C09080' }}>
            AI × 家計簿 × 相棒 = Aibo
          </p>
        </div>

      </main>

    </div>
  )
}
