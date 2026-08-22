import { useEffect, useState } from 'react'
import './App.css'
import { clearSession, getAuthConfig, getCurrentUser, getGoogleAuthStartUrl, login, logout as apiLogout, register, saveSession, saveToken } from './api.js'
import AdminDashboard from './AdminDashboard.jsx'

const features = [
  ['signal', 'Real-Time Communication', 'Keep every update, announcement, and conversation moving in one clear channel.'],
  ['support', 'Smart Support', 'Capture requests, route them to the right team, and close the loop quickly.'],
  ['users', 'Participant Management', 'See the full participant picture and make every attendee feel accounted for.'],
  ['spark', 'AI-Powered Assistance', 'Turn event signals into timely insights that help your team make better calls.'],
]

const steps = [
  ['01', 'Create Event', 'Set the details and invite your team.'],
  ['02', 'Connect Participants', 'Give everyone one place to stay informed.'],
  ['03', 'Communicate & Resolve', 'Act on updates before small issues grow.'],
  ['04', 'Analyze & Improve', 'Learn from every moment and make the next one better.'],
]

function Icon({ name }) {
  const paths = {
    signal: <><path d="M3 20h18M5 17v-3M9 17V9M13 17V5M17 17V2" /></>,
    support: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="m5.6 5.6 4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    spark: <><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.7 2.3L16 19l2.3.7L19 22l.7-2.3L22 19l-2.3-.7L19 16Z" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>Event<span>Pulse</span></span></a>
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="site-shell">
      <header className="navbar"><Brand /><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}><Icon name={menuOpen ? 'close' : 'menu'} /></button><nav className={menuOpen ? 'nav-links open' : 'nav-links'}>{['Home', 'Features', 'How It Works', 'For Organizers', 'For Participants'].map((item) => <a href={item === 'Home' ? '#top' : `#${item.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMenuOpen(false)} key={item}>{item}</a>)}</nav><div className="nav-actions"><a href="/login">Login</a><a className="button button-small" href="/login">Get Started <Icon name="arrow" /></a></div></header>
      <main id="top">
        <section className="hero-section"><div className="hero-copy"><div className="eyebrow"><span className="pulse-dot" /> REAL-TIME EVENT MANAGEMENT</div><h1>Your Entire Event.<br /><span>One Connected Platform.</span></h1><p>Manage participants, communicate in real time, resolve issues faster and keep every event connected.</p><div className="hero-actions"><a className="button" href="/login">Get Started <Icon name="arrow" /></a><a className="text-button" href="#features">Explore Platform <Icon name="arrow" /></a></div><div className="hero-proof"><span className="avatar-stack"><b>JL</b><b>AR</b><b>MK</b><b>+</b></span><span><strong>2,400+</strong> event teams already moving forward</span></div></div><Dashboard /></section>
        <section className="trust-strip"><span>BUILT FOR THE PEOPLE BEHIND GREAT EVENTS</span><div><strong>SUMMIT<span>+</span></strong><strong>northstar</strong><strong>loop<span>.</span>conf</strong><strong>Gatherly</strong></div></section>
        <section className="features-section section-pad" id="features"><div className="section-heading"><div><div className="eyebrow">ONE PLATFORM. EVERY MOMENT.</div><h2>Everything your event needs<br /><span>to move as one.</span></h2></div><p>From the first invitation to the final follow-up, EventPulse gives your team the clarity to create experiences people remember.</p></div><div className="feature-grid">{features.map(([icon, title, description]) => <article className="feature-card" key={title}><div className="feature-icon"><Icon name={icon} /></div><h3>{title}</h3><p>{description}</p><a href="#cta" aria-label={`Learn more about ${title}`}><Icon name="arrow" /></a></article>)}</div></section>
        <section className="steps-section section-pad" id="how-it-works"><div className="eyebrow">A BETTER WAY TO RUN EVENTS</div><h2>From setup to spotlight.</h2><p className="section-intro">Everything stays connected, so your team can stay focused on the experience.</p><div className="steps-flow">{steps.map(([number, title, description], index) => <div className="step" key={number}><div className="step-number">{number}</div><div className="step-line" /><h3>{title}</h3><p>{description}</p>{index < 3 && <span className="flow-arrow">→</span>}</div>)}</div></section>
        <section className="cta-section section-pad" id="cta"><div className="cta-orbit orbit-one" /><div className="cta-orbit orbit-two" /><div className="eyebrow">MAKE EVERY MOMENT COUNT</div><h2>Ready to run a smarter event?</h2><p>Bring participants, organizers and mentors together<br />in one connected platform.</p><a className="button button-light" href="#top">Get Started <Icon name="arrow" /></a></section>
      </main>
      <footer id="footer"><div className="footer-brand"><Brand /><p>Organize Better. Engage Faster.<br />Resolve Smarter.</p></div><div className="footer-links"><a href="#features">Product</a><a href="#for-organizers">Company</a><a href="#cta">Support</a><a href="#footer">Privacy</a><a href="#footer">Terms</a></div><span className="copyright">© 2024 EventPulse. All rights reserved.</span></footer>
    </div>
  )
}

const roles = [
  ['admin', 'Admin', 'Oversee platform operations and event access.', '◈'],
  ['organizer', 'Organizer', 'Manage events, participants and communication.', '▦'],
  ['mentor', 'Mentor', 'Support participants and manage assigned requests.', '♧'],
  ['participant', 'Participant', 'Access event information, support and communication.', '◌'],
]

const dashboardNavigation = {
  admin: ['Overview', 'Participants', 'Organizers', 'Mentors', 'Events', 'Announcements', 'Reports', 'Settings'],
  organizer: ['Event Overview', 'Participants', 'Schedule', 'Announcements', 'Support Requests', 'Settings'],
  monitor: ['Live Overview', 'Incidents', 'Announcements', 'Support Requests', 'Settings'],
  mentor: ['My Participants', 'Assigned Requests', 'Announcements', 'Schedule', 'Profile'],
  participant: ['My Event', 'Schedule', 'Announcements', 'My Mentor', 'Support / Help', 'Profile'],
}

function getSession() {
  try {
    return JSON.parse(window.localStorage.getItem('eventpulse-session'))
  } catch {
    return null
  }
}

function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function LoginPage() {
  const [role, setRole] = useState('participant')
  const [showPassword, setShowPassword] = useState(false)
  const [registerMode, setRegisterMode] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleAuth, setGoogleAuth] = useState({ enabled: false, message: 'Checking Google sign-in...' })
  const [passwordReset, setPasswordReset] = useState({ enabled: false, url: null, message: 'Checking password reset...' })

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const token = hash.get('token')
    const authError = hash.get('error')
    if (!token && !authError) return
    window.history.replaceState({}, '', '/login')
    if (authError) {
      clearSession()
      setErrors({ google: authError })
      return
    }
    setLoading(true)
    saveToken(token)
    getCurrentUser()
      .then((response) => {
        saveSession(response.user, token)
        navigate(`/${response.user.role}`)
      })
      .catch((error) => {
        clearSession()
        setErrors({ google: error.message })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    getAuthConfig()
      .then((response) => {
        if (!cancelled) {
          setGoogleAuth(response.google)
          setPasswordReset(response.passwordReset)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setGoogleAuth({ enabled: false, message: error.message })
          setPasswordReset({ enabled: false, url: null, message: error.message })
        }
      })
    return () => { cancelled = true }
  }, [])

  async function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (registerMode && !form.name?.trim()) nextErrors.name = 'Enter your name.'
    if (!form.email.trim()) nextErrors.email = 'Enter your email address.'
    if (!form.password) nextErrors.password = 'Enter your password.'
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }
    setLoading(true)
    setErrors({})
    try {
      const response = await (registerMode ? register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role }) : login({ email: form.email.trim(), password: form.password, role }))
      saveToken(response.token)
      saveSession(response.user, response.token)
      navigate(`/${response.user.role}`)
    } catch (error) {
      setErrors({ email: error.message })
      clearSession()
    } finally {
      setLoading(false)
    }
  }

  function toggleRegisterMode(event) {
    event.preventDefault()
    setRegisterMode((current) => !current)
    setErrors({})
  }

  function startGoogleAuth() {
    if (!googleAuth.enabled) {
      setErrors({ google: googleAuth.message || 'Google sign-in is not configured for this EventPulse server.' })
      return
    }
    window.location.href = getGoogleAuthStartUrl(role)
  }

  function startPasswordReset(event) {
    event.preventDefault()
    if (passwordReset.enabled && passwordReset.url) {
      window.location.href = passwordReset.url
      return
    }
    setErrors({ reset: passwordReset.message || 'Password reset is not configured for this EventPulse server.' })
  }

  return <div className="auth-shell"><div className="auth-brand"><Brand /></div><div className="back-link"><a href="/">← Back to EventPulse</a></div><main className="login-layout"><section className="login-intro"><div className="eyebrow"><span className="pulse-dot" /> EVENTPULSE WORKSPACE</div><h1>Welcome back<br />to <span>EventPulse.</span></h1><p>Manage your event, connect with participants and resolve issues faster — all from one place.</p><LoginIllustration /><div className="intro-note"><span>✦</span><div><strong>Everything in sync.</strong><small>One calm view of every event moment.</small></div></div></section><section className="login-card"><div className="card-kicker">SECURE WORKSPACE ACCESS</div><h2>Continue as</h2><div className="role-list" role="radiogroup" aria-label="Choose your role">{roles.map(([value, title, description, icon]) => <button type="button" className={role === value ? 'role-card selected' : 'role-card'} role="radio" aria-checked={role === value} onClick={() => setRole(value)} key={value}><span className="role-icon">{icon}</span><span><strong>{title}</strong><small>{description}</small></span><i className="role-check">✓</i></button>)}</div><div className="form-divider" /><h2 className="signin-title">{registerMode ? 'Create your account' : 'Sign in to your account'}</h2><form onSubmit={submit} noValidate>{registerMode && <><label htmlFor="name">Full Name</label><input id="name" type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} placeholder="Your name" />{errors.name && <span className="field-error" id="name-error">{errors.name}</span>}</>}<label htmlFor="email">Email Address</label><input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="you@company.com" />{errors.email && <span className="field-error" id="email-error">{errors.email}</span>}<label htmlFor="password">Password</label><div className="password-wrap"><input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>{errors.password && <span className="field-error" id="password-error">{errors.password}</span>}{errors.reset && <span className="field-error" role="alert">{errors.reset}</span>}<div className="form-options"><label className="remember"><input type="checkbox" /> <span>Remember me</span></label><a href="#forgot-password" onClick={startPasswordReset}>Forgot password?</a></div><button className="button sign-in" type="submit" disabled={loading}>{loading ? (registerMode ? 'Creating account...' : 'Logging in...') : (registerMode ? 'Register' : 'Login')} {!loading && <Icon name="arrow" />}</button></form><div className="or-divider"><span>OR</span></div><button className="google-button" type="button" onClick={startGoogleAuth} disabled={!googleAuth.enabled}><span>G</span> Continue with Google</button>{!googleAuth.enabled && <span className="field-error" role="status">{googleAuth.message}</span>}{errors.google && <span className="field-error" role="alert">{errors.google}</span>}<p className="create-account">{registerMode ? 'Already have an account?' : "Don't have an account?"} <a href={registerMode ? '#login' : '#create-account'} onClick={toggleRegisterMode}>{registerMode ? 'Login' : 'Register'}</a></p><p className="demo-note">Demo mode · Use a registered email, password and matching role.</p></section></main></div>
}

function LoginIllustration() {
  return <div className="login-illustration" aria-label="EventPulse workspace preview"><div className="illustration-header"><i /><i /><i /><span>EventPulse / Live event</span></div><div className="illustration-grid"><div className="illustration-sidebar"><b>◈</b><i /><i /><i /><i /></div><div className="illustration-main"><small>EVENT OVERVIEW</small><strong>Everything in motion.</strong><div className="illustration-stats"><span><b>2,486</b><small>Participants</small></span><span><b>07</b><small>Support requests</small></span></div><div className="illustration-feed"><p><i>✦</i> Announcement published <em>now</em></p><p><i>↗</i> Real-time update <em>2m</em></p><p><i>✓</i> Request resolved <em>5m</em></p></div></div></div></div>
}

function DashboardPage({ role, session }) {
  async function logout() {
    try { await apiLogout() } catch { /* The token may already be invalid. */ }
    clearSession()
    navigate('/login')
  }

  return <div className="dashboard-shell"><header className="dashboard-header"><Brand /><div className="dashboard-user"><span>{session?.name || 'EventPulse user'}</span><button type="button" onClick={logout}>Log out</button></div></header><main className="dashboard-main"><div className="dashboard-kicker">{role.toUpperCase()} WORKSPACE</div><h1>Dashboard coming<br />in the next step.</h1><p>This is a protected {role.toLowerCase()} workspace placeholder.</p><nav className="dashboard-nav" aria-label={`${role} dashboard sections`}>{dashboardNavigation[role].map((item, index) => <a className={index === 0 ? 'active' : ''} href={`#${item.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')}`} key={item}>{item}</a>)}</nav><div className="dashboard-note"><span>✦</span><div><strong>Signed in as {session?.email}</strong><small>Your local demo session is saved in this browser.</small></div></div></main></div>
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [authState, setAuthState] = useState(() => ({ loading: !['/', '/login'].includes(window.location.pathname), session: getSession() }))

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  useEffect(() => {
    const handleExpired = () => { setAuthState({ loading: false, session: null }); navigate('/login') }
    const handleAuthChanged = (event) => setAuthState({ loading: false, session: event.detail })
    window.addEventListener('eventpulse-auth-expired', handleExpired)
    window.addEventListener('eventpulse-auth-changed', handleAuthChanged)
    return () => {
      window.removeEventListener('eventpulse-auth-expired', handleExpired)
      window.removeEventListener('eventpulse-auth-changed', handleAuthChanged)
    }
  }, [])
  useEffect(() => {
    if (path === '/' || path === '/login') return undefined
    let cancelled = false
    getCurrentUser()
      .then((response) => {
        if (cancelled) return
        const token = window.localStorage.getItem('eventpulse-token')
        if (token) saveSession(response.user, token)
        setAuthState({ loading: false, session: { ...response.user, token } })
      })
      .catch(() => {
        if (!cancelled) setAuthState({ loading: false, session: null })
      })
    return () => { cancelled = true }
  }, [path])

  if (path === '/login') return <LoginPage />
  if (path === '/admin') {
    if (authState.loading) return <div className="redirect-state">Verifying your session...</div>
    const session = authState.session
    if (!session) return <LoginPage />
    if (session.role !== 'admin') return <DashboardRedirect expectedRole={session.role} />
    return <AdminDashboard session={session} onLogout={async () => { try { await apiLogout() } catch { /* The token may already be invalid. */ } clearSession(); navigate('/login') }} />
  }
  const dashboardRole = path.slice(1)
  if (dashboardNavigation[dashboardRole]) {
    if (authState.loading) return <div className="redirect-state">Verifying your session...</div>
    const session = authState.session
    if (!session) return <LoginPage />
    if (session.role !== dashboardRole) return <DashboardRedirect expectedRole={session.role} />
    return <DashboardPage role={dashboardRole} session={session} />
  }
  return <LandingPage />
}

function DashboardRedirect({ expectedRole }) {
  useEffect(() => navigate(`/${expectedRole}`), [expectedRole])
  return <div className="redirect-state">Redirecting to your workspace...</div>
}

function Dashboard() {
  return <div className="visual-wrap"><div className="visual-glow" /><div className="dashboard"><div className="dash-top"><span className="window-dots"><i /><i /><i /></span><span>EventPulse <em>Live workspace</em></span><span className="dash-menu">•••</span></div><div className="dash-body"><aside><div className="side-logo"><span className="brand-mark"><i /><i /><i /></span><b>EventPulse</b></div>{['⌂  Overview', '◌  Participants  2.4k', '◈  Announcements', '♧  Support requests  7'].map((item, index) => <div className={index === 0 ? 'side-item active' : 'side-item'} key={item}>{item}</div>)}<div className="side-spacer" /><div className="side-item">⚙  Settings</div></aside><div className="dash-content"><div className="dash-heading"><div><small>THURSDAY, OCTOBER 24</small><h3>Good morning, Alex <span>✦</span></h3></div><div className="live-status"><i /> Live event</div></div><div className="stat-grid">{[['Participants', '2,486', '↗ 12.8%'], ['Open requests', '07', '2 urgent'], ['Engagement', '94.2%', '↗ 4.6%']].map(([label, number, trend], index) => <div className="stat-card" key={label}><span>{label}</span><strong>{number}</strong><small className={index === 1 ? 'steady' : 'up'}>{trend}</small><div className={`mini-chart chart-${index}`} /></div>)}</div><div className="dash-lower"><div className="activity-panel"><div className="panel-title"><strong>Live activity</strong><span>View all</span></div>{[['✦', 'New announcement published', 'Stage schedule has been updated', '2m'], ['◌', 'Participant check-in spike', '128 people joined in the last 5 min', '8m'], ['!', 'Support request resolved', 'Room change · assigned to Maya', '12m']].map(([icon, title, detail, time]) => <div className="activity-row" key={title}><b>{icon}</b><div><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div>)}</div><div className="announcement"><small>ANNOUNCEMENT</small><div>↗</div><strong>Doors open in 15 minutes</strong><p>Ready when you are. Your participants have been notified.</p><span /></div></div></div></div></div><div className="floating-card support-float"><b>◈</b><div><small>SUPPORT REQUEST</small><strong>How do I find Workshop B?</strong><em>Just now · Resolved</em></div><span>✓</span></div><div className="floating-card update-float"><b>↗</b><div><small>REAL-TIME UPDATE</small><strong>128 new check-ins</strong><em>in the last 5 minutes</em></div></div></div>
}

export default App
