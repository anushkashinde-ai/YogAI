import { Link } from 'react-router-dom'
import { Info, ShieldCheck, TriangleAlert } from 'lucide-react'

const UPDATED = 'Last updated 12 October 2026'

const PAGES = {
  privacy: {
    key: 'privacy',
    to: '/privacy',
    icon: ShieldCheck,
    eyebrow: 'Privacy & camera use',
    title: 'Privacy Policy',
    updated: UPDATED,
    intro:
      'YogAI is a yoga companion app built as a final-year engineering project. This policy explains in plain language exactly what we store, what never leaves your device, and the control you have over your own information.',
    sections: [
      {
        id: 'what-we-store',
        heading: 'What YogAI stores',
        paragraphs: [
          'When you create an account we store only what the app needs to work. There is no advertising tracker and no third-party analytics profile in this project.',
          'In practice, the following information is kept:',
        ],
        list: [
          'Your name and email address, used to identify your account and sign you in.',
          'Your password, stored only as a salted bcrypt hash. The plain password is never written to the database and cannot be read back — not even by us.',
          'Your experience level and yoga goals, captured during signup so routines can be matched to you.',
          'Your favourite poses, and the routines you generate or save.',
          'Practice sessions you choose to log: duration, the poses you completed and any mood you selected.',
          'Achievement progress, streaks and badge unlocks, calculated from your real activity rather than invented numbers.',
          'Community posts you write, together with their visibility setting.',
        ],
      },
      {
        id: 'how-you-stay-signed-in',
        heading: 'How you stay signed in',
        paragraphs: [
          'After you sign in, the server issues a signed authentication token inside an httpOnly cookie. Because the cookie is httpOnly, scripts running on the page cannot read it, which limits the damage a cross-site scripting bug could do. A second, readable CSRF cookie is paired with it so state-changing requests can be verified as coming from your browser.',
          'We do not use cookies for advertising, profiling or tracking you across other sites.',
        ],
      },
      {
        id: 'camera-and-video',
        heading: 'Your camera: processed on your device, never uploaded',
        paragraphs: [
          'The AI Yoga Coach uses your camera to estimate body landmarks and draw a live skeleton overlay. All of that processing runs entirely inside your browser, on your own device.',
          'Camera frames from the AI Yoga Coach are never uploaded, stored, transmitted or recorded by YogAI. No image or video frame ever reaches our servers or any third party. Nothing is written to disk, and the camera stream is released as soon as you stop the session or close the page.',
          'When you finish a session and choose to save it, only practice metadata is written to your account: the duration, which pose you practised, the completed hold time and any mood you picked. No frames, thumbnails or recordings are attached to that record.',
        ],
      },
      {
        id: 'yogi-assistant',
        heading: 'Messages to Yogi Assistant',
        paragraphs: [
          'Text you send to Yogi Assistant is sent to the YogAI backend so it can be answered. If a live AI provider key is configured on the server, your message is forwarded to that provider. If no key is configured, a built-in offline yoga guide answers and your text never leaves our backend.',
          'Assistant messages never include camera data, images or video frames. Please do not type personal, medical or identifying information you would not want processed.',
        ],
      },
      {
        id: 'community-visibility',
        heading: 'Community posts and sharing',
        paragraphs: [
          'Community posts are private by default. A post becomes visible to other people only after you explicitly change its visibility to shared, and you can switch it back to private at any time.',
          'You can delete any post you wrote whenever you like, and deleting it removes it from the feed.',
        ],
      },
      {
        id: 'your-rights',
        heading: 'Your rights and controls',
        paragraphs: ['You stay in control of the information held about you:'],
        list: [
          'Access — the Profile page shows the details we hold for your account.',
          'Correction — update your name, experience level, yoga goals and preferences from Profile at any time.',
          'Deletion — remove individual posts, sessions and routines, or delete your account entirely. Account deletion removes your stored records.',
          'Camera permission — revoke camera access in your browser settings at any time, or simply never switch the camera on. Every practice mode has a camera-free option.',
          'Notifications — nothing is pushed to you without your action, and this project sends no marketing email.',
        ],
      },
      {
        id: 'childrens-privacy',
        heading: "Children's privacy",
        paragraphs: [
          'YogAI is not directed at children under 13, and we do not knowingly collect information from them. If you believe a child has created an account, write to us and we will remove it.',
        ],
      },
      {
        id: 'privacy-contact',
        heading: 'Contact us',
        paragraphs: ['Questions about this policy, or a request about your data, can be sent to:'],
        email: 'privacy@yogai.app',
      },
    ],
  },

  terms: {
    key: 'terms',
    to: '/terms',
    icon: Info,
    eyebrow: 'The agreement',
    title: 'Terms of Use',
    updated: UPDATED,
    intro:
      'These terms cover your use of YogAI. They are deliberately short and readable, and they apply the moment you create an account or use any part of the app.',
    sections: [
      {
        id: 'acceptance',
        heading: 'Acceptance of these terms',
        paragraphs: [
          'By creating an account, signing in or using any feature of YogAI, you agree to these terms. If you do not agree with them, please do not use the app.',
        ],
      },
      {
        id: 'accounts-and-eligibility',
        heading: 'Accounts and eligibility',
        paragraphs: ['You need an account to use the practice features, so that your progress can be saved to you.'],
        list: [
          'You must be at least 13 years old to create an account.',
          'Provide accurate information and keep it up to date from your Profile page.',
          'Keep your password confidential. You are responsible for activity that happens under your account.',
          'Use one account per person. Do not share credentials or create accounts on behalf of others without their consent.',
        ],
      },
      {
        id: 'acceptable-use',
        heading: 'Acceptable use',
        paragraphs: ['YogAI is for personal, non-commercial wellness use. You agree not to:'],
        list: [
          'Copy, scrape or bulk-download the pose library or any other content for republication.',
          'Attempt to break, probe or bypass authentication, rate limits or other security controls.',
          'Upload or post anything unlawful, hateful, harassing, sexually explicit or deliberately misleading.',
          'Impersonate another person, or misrepresent your affiliation with anyone.',
          'Send automated or excessive requests that degrade the service for other people.',
        ],
      },
      {
        id: 'user-content-and-moderation',
        heading: 'Your content and moderation',
        paragraphs: [
          'You keep ownership of whatever you write. By sharing a post you give YogAI permission to display it inside the app, and nothing more.',
          'Community content is moderated. Any post can be reported by another user, and a post that collects three reports is automatically flagged for review. We may hide or remove content that breaks these terms, and repeated abuse can lead to an account being suspended. Moderation is done by hand — there is no automated decision about your account.',
        ],
      },
      {
        id: 'demo-mode-and-ai',
        heading: 'AI features and demo mode',
        paragraphs: [
          'Some AI-powered features run in demo mode, and they are clearly labelled wherever that is the case. When no live AI provider key is configured, Yogi Assistant answers from a built-in library of yoga guidance instead of a language model, and the reply is marked as coming from the offline guide.',
          'Demo output is illustrative only. It may be incomplete, out of date or simply wrong, and it must not be treated as instruction, diagnosis or assessment. The AI Yoga Coach is explained fully on the safety page, and its pose feedback is an approximate guide rather than a guarantee of correct posture.',
        ],
      },
      {
        id: 'intellectual-property',
        heading: 'Intellectual property',
        paragraphs: [
          'The YogAI name, interface, written content, illustrations and source code are our work or are used with permission. You may not copy, resell or redistribute them commercially.',
        ],
      },
      {
        id: 'availability-and-limitations',
        heading: 'Availability and limitations',
        paragraphs: [
          'YogAI is an educational project provided on an "as is" and "as available" basis. We do not guarantee uninterrupted availability, and we cannot promise that every feature will be error free.',
          'Features may change, be paused or be retired as the project develops. Where something is a demonstration rather than a finished feature, we say so in the interface.',
        ],
      },
      {
        id: 'termination',
        heading: 'Termination',
        paragraphs: [
          'You may stop using YogAI at any time and delete your account from your Profile. We may suspend or end access to an account that breaks these terms, or that puts other users at risk.',
        ],
      },
      {
        id: 'changes-to-these-terms',
        heading: 'Changes to these terms',
        paragraphs: [
          'These terms may be updated as the project develops. When they change, the last-updated date at the top of this page changes too. Continuing to use YogAI after an update means you accept the revised terms.',
        ],
      },
      {
        id: 'terms-contact',
        heading: 'Contact us',
        paragraphs: ['Questions about these terms can be sent to:'],
        email: 'legal@yogai.app',
      },
    ],
  },

  safety: {
    key: 'safety',
    to: '/safety',
    icon: TriangleAlert,
    eyebrow: 'Practice safely',
    title: 'Safety Disclaimer',
    updated: UPDATED,
    intro:
      'Yoga is generally gentle, but it still asks something of your body. This page sets out what YogAI can and cannot do for you, and how to practise in a way that keeps you safe.',
    callout: {
      title: 'YogAI is not a medical device',
      body: 'It does not diagnose, treat, cure or prevent any condition, and it is not a replacement for a qualified doctor, physiotherapist or certified yoga teacher. Never delay seeking professional advice because of something you read or saw in this app.',
    },
    sections: [
      {
        id: 'not-a-medical-device',
        heading: 'What YogAI is — and is not',
        paragraphs: [
          'YogAI is a wellness and education tool. It does not provide diagnosis, treatment or medical advice, and it makes no claim to prevent or cure any condition.',
          'Pose descriptions, routines, breathing patterns and AI Yoga Coach observations are general guidance for healthy adults. They are not tailored to your medical history, and they cannot take your personal circumstances into account.',
        ],
      },
      {
        id: 'consult-a-doctor',
        heading: 'Talk to a doctor first if…',
        paragraphs: [
          'Check with a doctor or physiotherapist before starting or changing your practice if any of the following applies to you:',
        ],
        list: [
          'You are pregnant, or recently postpartum.',
          'You are recovering from an injury, a fracture or surgery.',
          'You are managing a condition such as high blood pressure, heart disease, diabetes, vertigo, a hernia or glaucoma.',
          'You experience persistent back, neck, knee or shoulder pain.',
          'You are unsure whether a particular pose is suitable for you.',
        ],
      },
      {
        id: 'stop-immediately',
        heading: 'Stop immediately if…',
        paragraphs: [
          'Come out of a pose slowly and rest if you notice any of the following. Do not push through them, and do not try to hold the pose until it passes:',
        ],
        list: [
          'Sharp or shooting pain, or a burning sensation in a joint.',
          'Dizziness, light-headedness or nausea.',
          'Shortness of breath, chest discomfort or an irregular heartbeat.',
          'Numbness, tingling or weakness in a limb.',
          'Any sensation that simply does not feel right in your body.',
        ],
        paragraphsAfter: [
          'If a symptom does not settle once you have rested, seek medical help. Nothing in YogAI is worth an injury.',
        ],
      },
      {
        id: 'pose-estimation-limits',
        heading: 'What the pose feedback can and cannot do',
        paragraphs: [
          'The AI Yoga Coach estimates where your body landmarks are from a single 2D camera image, then compares key joint angles with a reference configuration for the pose. It is an approximate guide, and it has real limits.',
          'Accuracy drops with poor or backlit lighting, an awkward camera angle, sitting too far from the camera, unusual body proportions, loose or very dark clothing, and any part of the body being hidden from view.',
          'A reading that looks good is not a correctness guarantee — the estimate can be wrong in both directions. A "check this" reading may also be a false alarm. Never push yourself deeper into a stretch or a hold simply to make the indicator change. Your own sensation always outranks the overlay.',
        ],
      },
      {
        id: 'safe-practice',
        heading: 'Practising safely',
        paragraphs: ['A few habits make a real difference, especially when you are starting out:'],
        list: [
          'Warm up first — a few minutes of gentle movement prepares the joints and muscles.',
          'Move slowly and never force a stretch or bounce into it. Find your comfortable edge, not your maximum.',
          'Use props — blocks, a strap, a folded blanket or a wall. They are a tool, not a shortcut.',
          'Keep breathing steadily. Skip breath holds entirely if they feel uncomfortable, or if you are pregnant.',
          'Modify freely: bring the knees down, sit on a chair or reduce the hold time whenever you need to.',
          'Practise on a non-slip surface, with enough space around you to move and to lose your balance safely.',
          'Finish with a cool-down and a few quiet minutes of rest.',
        ],
      },
      {
        id: 'emergencies',
        heading: 'In an emergency',
        paragraphs: [
          'YogAI cannot help in an emergency and cannot contact anyone on your behalf. If you are injured or feel seriously unwell, contact your local emergency services immediately.',
          'In India, dial 112. If you are elsewhere, use the emergency number for your country. If you can, tell someone nearby what has happened.',
        ],
      },
      {
        id: 'safety-contact',
        heading: 'Questions about safety',
        paragraphs: ['If anything on this page is unclear, or you want to flag a safety concern, write to:'],
        email: 'safety@yogai.app',
      },
    ],
  },
}

export default function Legal({ page = 'privacy' }) {
  const content = PAGES[page] || PAGES.privacy
  const Icon = content.icon
  const related = Object.values(PAGES).filter((item) => item.key !== content.key)

  return (
    <>
      {/* ---------------------------------- Hero --------------------------------- */}
      <section className="section pb-0">
        <div className="container-x">
          <div className="max-w-3xl">
            <span className="eyebrow inline-flex items-center gap-2">
              <Icon size={14} aria-hidden="true" />
              {content.eyebrow}
            </span>
            <h1 className="mt-3 text-balance font-display text-3xl font-semibold text-ink sm:text-4xl lg:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">{content.intro}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{content.updated}</p>
          </div>

          {content.callout && (
            <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-5 sm:p-6 dark:border-amber-700 dark:bg-amber-950/40">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                  <TriangleAlert size={18} aria-hidden="true" />
                </span>
                <div className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                  <p className="font-semibold">{content.callout.title}</p>
                  <p className="mt-1">{content.callout.body}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------ Body + contents ----------------------------- */}
      <section className="section pt-10">
        <div className="container-x grid items-start gap-8 lg:grid-cols-[0.34fr_0.66fr]">
          <nav aria-label="On this page" className="card p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-ink">On this page</h2>
            <ol className="mt-4 space-y-2.5 text-sm">
              {content.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-3 text-muted transition hover:text-sage-700 dark:hover:text-sage-200"
                  >
                    <span className="font-mono text-xs text-muted/70">{String(index + 1).padStart(2, '0')}</span>
                    <span className="leading-snug">{section.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-6">
            {content.sections.map((section, index) => (
              <article key={section.id} id={section.id} className="card scroll-mt-24 p-6 sm:p-8">
                <span className="font-mono text-xs font-semibold text-lavender-500 dark:text-lavender-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{section.heading}</h2>

                <div className="prose-yoga mt-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.list && (
                    <ul className="mt-3 space-y-2.5">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.paragraphsAfter?.map((paragraph) => (
                    <p key={paragraph} className="mt-3">
                      {paragraph}
                    </p>
                  ))}

                  {section.email && (
                    <p className="mt-3">
                      <a href={`mailto:${section.email}`} className="link">
                        {section.email}
                      </a>
                    </p>
                  )}
                </div>
              </article>
            ))}

            <div className="card p-6">
              <h2 className="text-sm font-semibold text-ink">Related pages</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {related.map((item) => {
                  const RelatedIcon = item.icon
                  return (
                    <Link key={item.key} to={item.to} className="chip hover:border-sage-300 hover:text-ink">
                      <RelatedIcon size={12} aria-hidden="true" />
                      {item.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
