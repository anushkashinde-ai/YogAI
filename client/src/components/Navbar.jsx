import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, LogOut, Menu, Moon, Sun, User, X } from 'lucide-react'
import Logo from './Logo.jsx'
import { NAV_LINKS } from '../config/appConfig.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { initials } from '../utils/format.js'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  // Close any open menus on navigation.
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-sage-100 text-sage-800 dark:bg-sage-800 dark:text-sage-50'
        : 'text-muted hover:bg-sage-50 hover:text-ink dark:hover:bg-sage-800/70'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Logo />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-ink"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isAuthenticated ? (
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-line bg-card px-2 py-1.5 pr-3 transition hover:shadow-soft"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-sage-500 to-lavender-500 text-xs font-semibold text-white">
                  {initials(user?.name)}
                </span>
                <span className="max-w-[7rem] truncate text-sm font-medium text-ink">
                  {user?.name?.split(' ')[0]}
                </span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-lift"
                    role="menu"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-sage-50 hover:text-ink dark:hover:bg-sage-800/70" role="menuitem">
                      <User size={15} aria-hidden="true" /> My profile
                    </Link>
                    <Link to="/progress" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-sage-50 hover:text-ink dark:hover:bg-sage-800/70" role="menuitem">
                      <LayoutDashboard size={15} aria-hidden="true" /> Progress dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/50"
                      role="menuitem"
                    >
                      <LogOut size={15} aria-hidden="true" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className="btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary btn-sm">
                Sign up free
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-muted lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-line bg-card lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="container-x flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-sage-100 text-sage-800 dark:bg-sage-800 dark:text-sage-50' : 'text-muted'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="mt-3 border-t border-line pt-4">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/profile" className="btn-outline w-full">
                      <User size={15} aria-hidden="true" /> {user?.name}
                    </Link>
                    <button type="button" onClick={handleLogout} className="btn-ghost w-full text-red-600 dark:text-red-300">
                      <LogOut size={15} aria-hidden="true" /> Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" className="btn-outline w-full">
                      Log in
                    </Link>
                    <Link to="/signup" className="btn-primary w-full">
                      Sign up free
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
