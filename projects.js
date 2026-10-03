// Проекты. Каждый становится отдельным окном-диалогом.
//   image: путь к скриншоту проекта (необязательно)
//
// title, tagline, desc и role — либо строка (одна на все языки),
// либо объект { en, ru, lv, it }. Если перевода нет, берётся en.
const title = (n) => ({ en: `Project ${n}`, ru: `Проект ${n}`, lv: `Projekts ${n}`, it: `Progetto ${n}` });
const DESC = {
  en: 'A short description: what the problem was, what I did and what came out of it. One or two numbers work better than a paragraph.',
  ru: 'Короткое описание: какую задачу решал, что сделал и какой получился результат. Одна-две цифры работают лучше абзаца.',
  lv: 'Īss apraksts: kāds bija uzdevums, ko izdarīju un kāds ir rezultāts. Viens vai divi skaitļi strādā labāk nekā rindkopa.',
  it: 'Una breve descrizione: qual era il problema, cosa ho fatto e cosa ne è uscito. Uno o due numeri funzionano meglio di un paragrafo.',
};

window.PROJECTS = [
  {
    id: 'p1',
    kind: 'web', // 'web' | 'game'
    title: title('01'),
    tagline: { en: 'SaaS platform · design and frontend', ru: 'SaaS-платформа · дизайн и фронтенд', lv: 'SaaS platforma · dizains un frontends', it: 'Piattaforma SaaS · design e frontend' },
    year: '2026',
    role: 'Fullstack',
    stack: ['Next.js', 'TypeScript', 'PostgreSQL'],
    desc: DESC,
    url: '#',
    image: '',
  },
  {
    id: 'p2',
    kind: 'web', // 'web' | 'game'
    title: title('02'),
    tagline: { en: 'Telegram bot · automation', ru: 'Telegram-бот · автоматизация', lv: 'Telegram bots · automatizācija', it: 'Bot Telegram · automazione' },
    year: '2026',
    role: 'Backend',
    stack: ['Node.js', 'Telegram API', 'Redis'],
    desc: DESC,
    url: '#',
    image: '',
  },
  {
    id: 'p3',
    kind: 'web', // 'web' | 'game'
    title: title('03'),
    tagline: { en: 'Landing page · animation and 3D', ru: 'Лендинг · анимация и 3D', lv: 'Mērķlapa · animācija un 3D', it: 'Landing page · animazione e 3D' },
    year: '2025',
    role: 'Frontend',
    stack: ['Astro', 'GSAP', 'WebGL'],
    desc: DESC,
    url: '#',
    image: '',
  },
  {
    id: 'p4',
    kind: 'web', // 'web' | 'game'
    title: title('04'),
    tagline: { en: 'Online store · frontend and backend', ru: 'Интернет-магазин · фронтенд и бэкенд', lv: 'Interneta veikals · frontends un backends', it: 'Negozio online · frontend e backend' },
    year: '2025',
    role: 'Fullstack',
    stack: ['React', 'Node.js', 'Stripe'],
    desc: DESC,
    url: '#',
    image: '',
  },
  {
    id: 'p5',
    kind: 'web', // 'web' | 'game'
    title: title('05'),
    tagline: { en: 'Dashboard · real-time analytics', ru: 'Дашборд · аналитика в реальном времени', lv: 'Informācijas panelis · reāllaika analītika', it: 'Dashboard · analisi in tempo reale' },
    year: '2025',
    role: 'Frontend',
    stack: ['Vue', 'D3', 'WebSocket'],
    desc: DESC,
    url: '#',
    image: '',
  },
  {
    id: 'p6',
    kind: 'web', // 'web' | 'game'
    title: title('06'),
    tagline: { en: 'Mobile PWA · offline mode', ru: 'Мобильное PWA · офлайн-режим', lv: 'Mobilā PWA · bezsaistes režīms', it: 'PWA mobile · modalità offline' },
    year: '2024',
    role: 'Frontend',
    stack: ['React', 'PWA', 'IndexedDB'],
    desc: DESC,
    url: '#',
    image: '',
  },
  {
    id: 'p7',
    kind: 'web', // 'web' | 'game'
    title: title('07'),
    tagline: { en: 'Web3 · wallet and smart contracts', ru: 'Web3 · кошелёк и смарт-контракты', lv: 'Web3 · maciņš un viedie līgumi', it: 'Web3 · wallet e smart contract' },
    year: '2024',
    role: 'Fullstack',
    stack: ['Solidity', 'wagmi', 'Next.js'],
    desc: DESC,
    url: '#',
    image: '',
  },
];
