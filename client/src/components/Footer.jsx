import { Link } from 'react-router-dom'
import { Github, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react'
import Logo from './Logo.jsx'
import { APP_NAME, FOOTER_LINKS } from '../config/appConfig.js'

const CONTACT = {
  email: 'hello@yogai.app',
  phone: '+91 98765 43210',
  address: 'Pune, Maharashtra, India',
}

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com', icon: Github },
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'Twitter', href: 'https://twitter.com', icon: Twitter },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-line bg-card/60">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {APP_NAME} helps you learn yoga poses, understand correct posture, follow personalised routines and build a
            practice that lasts. Built as a final-year engineering project.
          </p>

          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Mail size={15} aria-hidden="true" />
              <a href={`mailto:${CONTACT.email}`} className="transition hover:text-ink">
                {CONTACT.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} aria-hidden="true" />
              <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="transition hover:text-ink">
                {CONTACT.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={15} aria-hidden="true" />
              {CONTACT.address}
            </li>
          </ul>

          <div className="mt-5 flex gap-2">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-sage-700"
              >
                <Icon size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Explore">
          <h3 className="text-sm font-semibold text-ink">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_LINKS.explore.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted transition hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account">
          <h3 className="text-sm font-semibold text-ink">Your practice</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_LINKS.account.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted transition hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h3 className="text-sm font-semibold text-ink">Legal & safety</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_LINKS.legal.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted transition hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {APP_NAME}. Educational project — not a substitute for professional medical advice.</p>
          <p>Pose guidance is for general wellness only. Stop if you feel pain.</p>
        </div>
      </div>
    </footer>
  )
}
