import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register, confirmRegister } from '../lib/auth'

export function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'register' | 'confirm'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRegister(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('パスワードは大文字・小文字・数字をそれぞれ含めてください')
      return
    }
    setIsLoading(true)
    try {
      await register(email, password)
      setStep('confirm')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登録に失敗しました'
      if (message.includes('UsernameExistsException') || message.includes('already exists')) {
        setError('このメールアドレスはすでに登録されています')
      } else if (message.includes('InvalidPasswordException') || message.includes('Password did not conform')) {
        setError('パスワードは大文字・小文字・数字を含む8文字以上にしてください')
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirm(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await confirmRegister(email, code)
      navigate('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '確認に失敗しました'
      if (message.includes('CodeMismatchException') || message.includes('Invalid verification code')) {
        setError('確認コードが正しくありません')
      } else if (message.includes('ExpiredCodeException')) {
        setError('確認コードの有効期限が切れました。再登録してください')
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
        <a
          href="/login"
          className="text-2xl font-black tracking-tight"
          style={{ background: 'linear-gradient(135deg, #F5A623, #D85A30)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}
        >
          Aibo
        </a>
        <a
          href="/login"
          className="text-sm font-medium transition hover:opacity-70"
          style={{ color: '#3D1F0F' }}
        >
          ログインはこちら
        </a>
      </nav>

      <main className="flex flex-col items-center justify-center flex-1 px-6 py-12">
        <div
          className="w-full max-w-sm rounded-3xl shadow-lg p-8"
          style={{ backgroundColor: '#fff', border: '1px solid #F0D8C8' }}
        >
          {step === 'register' ? (
            <>
              <h2 className="text-xl font-bold text-center mb-1" style={{ color: '#3D1F0F' }}>
                アカウント作成
              </h2>
              <p className="text-sm text-center mb-7" style={{ color: '#B07050' }}>
                Aiboで家計管理を始めましょう
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
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
                    placeholder="6文字以上"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                    style={{ backgroundColor: '#FDF6F0', border: '1.5px solid #E8C9B0', color: '#3D1F0F' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#D85A30')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#E8C9B0')}
                  />
                  <p className="text-xs mt-1" style={{ color: '#C09080' }}>
                    大文字・小文字・数字を含む6文字以上
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A4A30' }}>
                    パスワード（確認）
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
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
                  {isLoading ? '登録中...' : '無料で始める →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-center mb-1" style={{ color: '#3D1F0F' }}>
                メールを確認してください
              </h2>
              <p className="text-sm text-center mb-2" style={{ color: '#B07050' }}>
                {email} に確認コードを送信しました
              </p>
              <p className="text-xs text-center mb-7" style={{ color: '#C09080' }}>
                迷惑メールフォルダもご確認ください
              </p>

              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A4A30' }}>
                    確認コード（6桁）
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="123456"
                    inputMode="numeric"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition text-center tracking-widest"
                    style={{ backgroundColor: '#FDF6F0', border: '1.5px solid #E8C9B0', color: '#3D1F0F', letterSpacing: '0.3em' }}
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
                  disabled={isLoading || code.length !== 6}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                  style={{ backgroundColor: '#D85A30' }}
                >
                  {isLoading ? '確認中...' : '確認して完了 →'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(null); setCode('') }}
                  className="w-full py-2 text-xs transition hover:opacity-70"
                  style={{ color: '#B07050' }}
                >
                  メールアドレスを変更する
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#C09080' }}>
          AI × 家計簿 × 相棒 = Aibo
        </p>
      </main>
    </div>
  )
}
