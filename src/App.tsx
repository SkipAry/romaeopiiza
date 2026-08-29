import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
  Menu,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react'
import './App.css'

type Category = 'Pizza' | 'Panuozzo' | 'Pasta' | 'Sides' | 'Desserts'

type Product = {
  id: number
  name: string
  category: Category
  price: number
  description: string
  image: string
  imagePresentation?: 'contained' | 'cutout'
  vegetarian: boolean
  spicy?: boolean
  bestseller?: boolean
}

const imageUrl = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}`

const products: Product[] = [
  {
    id: 1,
    name: 'Margherita',
    category: 'Pizza',
    price: 585,
    description: 'Tomato pelati, bocconcini, EVOO, basil',
    image: imageUrl('romae-margherita.webp'),
    imagePresentation: 'contained',
    vegetarian: true,
    bestseller: true,
  },
  {
    id: 2,
    name: 'Pepperoni Chicken',
    category: 'Pizza',
    price: 745,
    description: 'Tomato pelati, fior di latte, chicken pepperoni, basil',
    image: imageUrl('romae-pepperoni.webp'),
    imagePresentation: 'contained',
    vegetarian: false,
    spicy: true,
    bestseller: true,
  },
  {
    id: 3,
    name: 'Mediterranean Pesto',
    category: 'Pizza',
    price: 775,
    description: 'Basil pesto, bocconcini, sundried tomato, olives',
    image: imageUrl('romae-mediterranean-pesto.webp'),
    imagePresentation: 'cutout',
    vegetarian: true,
  },
  {
    id: 4,
    name: 'Peri Peri Paneer',
    category: 'Pizza',
    price: 695,
    description: 'Ricotta, fior di latte, pickled paprika, paneer',
    image: imageUrl('romae-peri-peri-paneer.webp'),
    imagePresentation: 'cutout',
    vegetarian: true,
    spicy: true,
  },
  {
    id: 5,
    name: 'White Forest & Truffle',
    category: 'Pizza',
    price: 975,
    description: 'Ricotta, mushrooms, burrata, parsley, truffle oil',
    image: imageUrl('romae-white-forest-truffle.webp'),
    imagePresentation: 'cutout',
    vegetarian: true,
  },
  {
    id: 6,
    name: 'Smoked Chicken',
    category: 'Pizza',
    price: 915,
    description: 'Tomato pelati, fior di latte, peppers, smoked chicken',
    image: imageUrl('romae-smoked-chicken.webp'),
    imagePresentation: 'cutout',
    vegetarian: false,
  },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
function CountUp({ to, started, duration = 1600 }: { to: number; started: boolean; duration?: number }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!started) return
    if (prefersReducedMotion()) {
      setValue(to)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(to * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started, to, duration])

  return <>{value}</>
}

const marqueePhrases = [
  'Sourdough fermented 48 hours',
  'Wood-fired at 450°',
  'Hand-stretched to order',
  'Fior di latte, always fresh',
  'Napoli, via Pune',
  'Open 1 PM — midnight',
]

function App() {
  const [cart, setCart] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('romae-cart') ?? '{}')
    } catch {
      return {}
    }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [booting, setBooting] = useState(() => !prefersReducedMotion())
  const [ready, setReady] = useState(() => prefersReducedMotion())
  const [scrolled, setScrolled] = useState(false)
  const [statsStarted, setStatsStarted] = useState(false)
  const cartCloseRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const heroImageRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDListElement>(null)

  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const cartItems = useMemo(
    () =>
      products
        .filter((product) => cart[product.id])
        .map((product) => ({ ...product, quantity: cart[product.id] })),
    [cart],
  )
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  useEffect(() => {
    localStorage.setItem('romae-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!booting) return
    const enterTimer = window.setTimeout(() => setReady(true), 1150)
    const doneTimer = window.setTimeout(() => setBooting(false), 1750)
    return () => {
      window.clearTimeout(enterTimer)
      window.clearTimeout(doneTimer)
    }
  }, [booting])

  useEffect(() => {
    if (!booting) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [booting])

  useEffect(() => {
    if (!cartOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCartOpen(false)
        return
      }

      if (event.key === 'Tab') {
        const drawer = cartCloseRef.current?.closest('aside')
        const focusable = Array.from(
          drawer?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? [],
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyboard)
    requestAnimationFrame(() => cartCloseRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyboard)
      previousFocusRef.current?.focus()
    }
  }, [cartOpen])

  useEffect(() => {
    if (!menuOpen || cartOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen, cartOpen])

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const stats = statsRef.current
    if (!targets.length && !stats) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          if (entry.target === stats) setStatsStarted(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    targets.forEach((target) => observer.observe(target))
    if (stats) observer.observe(stats)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const target = heroImageRef.current
    if (!target || prefersReducedMotion()) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const shift = Math.min(window.scrollY, 720) * 0.085
        target.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  function openCart() {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    setMenuOpen(false)
    setCartOpen(true)
  }

  function addToCart(id: number) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
  }

  function updateQuantity(id: number, delta: number) {
    setCart((current) => {
      const nextQuantity = (current[id] ?? 0) + delta
      const next = { ...current }
      if (nextQuantity <= 0) delete next[id]
      else next[id] = nextQuantity
      return next
    })
  }

  return (
    <div className={ready ? 'site-shell is-ready' : 'site-shell'}>
      {booting && (
        <div className="preloader" aria-hidden="true">
          <div className="preloader-inner">
            <span className="preloader-word">
              <i>R</i><i>O</i><i>M</i><i>A</i><i>E</i>
            </span>
            <span className="preloader-sub">Pizzeria · Pune</span>
          </div>
        </div>
      )}

      <a className="skip-link" href="#menu">Skip to menu</a>

      <div className="announcement">
        <p>Sourdough pizza · Porwal Road · Open daily 1 PM—12 AM</p>
        <a href="tel:+918446844925">Call +91 84468 44925</a>
      </div>

      <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
        <a className="wordmark" href="#top" aria-label="Romae Pizzeria home">
          <span>ROMAE</span>
          <small>PIZZERIA</small>
        </a>

        <nav className={menuOpen ? 'primary-nav is-open' : 'primary-nav'} aria-label="Main navigation">
          <a href="#menu" onClick={() => setMenuOpen(false)}>Menu</a>
          <a href="#our-dough" onClick={() => setMenuOpen(false)}>Our dough</a>
          <a href="#visit" onClick={() => setMenuOpen(false)}>Visit</a>
        </nav>

        <div className="header-actions">
          <a
            className="button button-solid order-link"
            href="https://www.swiggy.com/city/pune/romae-pizzeria-lohgaon-rest1268147"
            target="_blank"
            rel="noreferrer"
          >
            Order online <ArrowDownRight size={16} aria-hidden="true" />
          </a>
          <button className="bag-button" type="button" onClick={openCart} aria-label={`Open bag with ${cartCount} items`}>
            <ShoppingBag size={19} aria-hidden="true" />
            <span>Bag</span>
            <b>{String(cartCount).padStart(2, '0')}</b>
          </button>
          <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <nav className="category-strip" aria-label="Menu shortcuts">
        <span>Explore</span>
        <a className="active" href="#menu">House favourites</a>
        <a href="#full-menu">All pizzas</a>
        <a href="https://www.swiggy.com/city/pune/romae-pizzeria-lohgaon-rest1268147" target="_blank" rel="noreferrer">Full delivery menu</a>
      </nav>

      <main id="top">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span>01</span> Napoli, via Pune</p>
            <h1 id="hero-title" className="hero-title">
              <span className="hero-line"><span>Hand-stretched.</span></span>
              <span className="hero-line"><span><em>Fire-finished.</em></span></span>
            </h1>
            <div className="hero-bottom">
              <p className="hero-sub">Sourdough pizzas, fresh Italian plates, and long lunches on Porwal Road.</p>
              <div className="hero-cta-row">
                <a className="button button-solid" href="#menu">Explore the menu <ArrowRight size={16} aria-hidden="true" /></a>
                <a className="text-link" href="tel:+918446844925"><Phone size={15} aria-hidden="true" /> Call to order</a>
              </div>
            </div>
          </div>
          <figure className="hero-image-wrap">
            <div className="hero-image-parallax" ref={heroImageRef}>
              <img className="hero-contained" src={imageUrl('romae-airborne-hero-clean.webp')} alt="Pizza slices lifting from a whole pizza with stretching cheese" fetchPriority="high" />
            </div>
            <div className="hero-stamp" aria-hidden="true">
              <svg className="hero-stamp-ring" viewBox="0 0 120 120">
                <defs>
                  <path id="hero-stamp-circle" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
                </defs>
                <text><textPath href="#hero-stamp-circle">100% SOURDOUGH · WOOD-FIRED · ROMAE ·</textPath></text>
              </svg>
              <Flame className="hero-stamp-flame" size={20} aria-hidden="true" />
            </div>
            <figcaption className="hero-caption">48-hour sourdough · fire-finished daily</figcaption>
          </figure>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div className="marquee-group" key={copy}>
                {marqueePhrases.map((phrase) => (
                  <span key={phrase}><i className="marquee-dot" />{phrase}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="menu-section" id="menu" aria-labelledby="menu-title">
          <div className="section-running-head" data-reveal>
            <p><span>02</span> House favourites</p>
            <a href="#full-menu">View full menu <ArrowRight size={14} aria-hidden="true" /></a>
          </div>

          <div className="menu-heading-row">
            <h2 id="menu-title" data-reveal>The regulars<em>.</em></h2>
            <p data-reveal style={{ '--reveal-delay': '120ms' } as CSSProperties}>
              Beloved combinations built on slowly fermented dough and finished in a fierce oven.
            </p>
          </div>

          <div className="product-grid">
            {products.slice(0, 4).map((product, index) => (
              <article
                className="product-card"
                key={product.id}
                data-reveal
                style={{ '--reveal-delay': `${index * 90}ms` } as CSSProperties}
              >
                <div className={product.imagePresentation ? `product-image product-image-${product.imagePresentation}` : 'product-image'}>
                  <img className={product.imagePresentation ? `product-${product.imagePresentation}` : undefined} src={product.image} alt={`${product.name} pizza`} loading="lazy" />
                  {product.bestseller && <span className="product-badge">House favourite</span>}
                </div>
                <div className="product-meta">
                  <div className="product-name-row">
                    <h3>{product.name}</h3>
                    <span className={product.vegetarian ? 'veg-mark' : 'nonveg-mark'} aria-label={product.vegetarian ? 'Vegetarian' : 'Non-vegetarian'}><i /></span>
                  </div>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <strong>{formatPrice(product.price)}</strong>
                    <button type="button" className={cart[product.id] ? 'add-button is-added' : 'add-button'} onClick={() => addToCart(product.id)} aria-label={cart[product.id] ? `Increase ${product.name} quantity` : `Add ${product.name} to bag`}>
                      {cart[product.id] ? <><Check size={14} aria-hidden="true" /> Added · {cart[product.id]}</> : <>Add <Plus size={14} aria-hidden="true" /></>}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="story-section" id="our-dough" aria-labelledby="story-title">
          <div className="story-image" data-reveal>
            <img src={imageUrl('romae-oven-story.webp')} alt="Pizzaiolo lifting a freshly baked pizza from the stone oven" loading="lazy" />
          </div>
          <div className="story-copy">
            <p className="eyebrow story-eyebrow" data-reveal><span>03</span> Our dough</p>
            <h2 id="story-title" data-reveal>Time does most<br /><em>of the work.</em></h2>
            <p className="story-lead" data-reveal>
              We let our sourdough take the long route: a slow ferment, a gentle stretch, then sixty hot seconds against stone.
            </p>
            <dl className="story-stats" ref={statsRef} data-reveal>
              <div><dt><CountUp to={48} started={statsStarted} /><i>hr</i></dt><dd>Slow fermentation</dd></div>
              <div><dt><CountUp to={450} started={statsStarted} /><i>°</i></dt><dd>Stone oven heat</dd></div>
              <div><dt><CountUp to={100} started={statsStarted} /><i>%</i></dt><dd>Made to order</dd></div>
            </dl>
            <a className="text-link story-link" href="#visit" data-reveal>See where we make it <ArrowRight size={15} aria-hidden="true" /></a>
          </div>
        </section>

        <section className="full-menu" id="full-menu" aria-labelledby="full-menu-title">
          <div className="section-running-head" data-reveal>
            <p><span>04</span> Pizza menu</p>
            <p>Prices include one very good evening</p>
          </div>
          <div className="full-menu-layout">
            <h2 id="full-menu-title" data-reveal>Pick your<br /><em>pleasure.</em></h2>
            <div className="menu-list">
              {products.map((product, index) => (
                <div
                  className="menu-list-item"
                  key={product.id}
                  data-reveal
                  style={{ '--reveal-delay': `${index * 60}ms` } as CSSProperties}
                >
                  <div className="menu-item-head">
                    <span className={product.vegetarian ? 'veg-mark' : 'nonveg-mark'} aria-label={product.vegetarian ? 'Vegetarian' : 'Non-vegetarian'}><i /></span>
                    <h3>{product.name}</h3>
                    {product.spicy && <Flame className="spicy-flame" size={15} aria-label="Spicy" />}
                    <span className="menu-leader" aria-hidden="true" />
                    <strong>{formatPrice(product.price)}</strong>
                  </div>
                  <p>{product.description}</p>
                  <button type="button" onClick={() => addToCart(product.id)} aria-label={cart[product.id] ? `Increase ${product.name} quantity` : `Add ${product.name} to bag`}><Plus size={16} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="visit-section" id="visit" aria-labelledby="visit-title">
          <div className="visit-intro">
            <p className="eyebrow visit-eyebrow" data-reveal><span>05</span> Come by</p>
            <h2 id="visit-title" data-reveal>Save us a<br /><em>seat.</em></h2>
          </div>
          <div className="visit-details" data-reveal>
            <div>
              <span>Find us</span>
              <p>Shop 3, Survey 296/3/2<br />Opp. Paras Basera Society<br />Porwal Road, Lohegaon, Pune</p>
            </div>
            <div>
              <span>Open</span>
              <p>Every day<br />1:00 PM—12:00 AM</p>
            </div>
            <a className="visit-action" href="https://maps.google.com/?q=Romae+Pizzeria+Porwal+Road+Lohegaon+Pune" target="_blank" rel="noreferrer">
              Get directions <ChevronRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <a className="wordmark footer-wordmark" href="#top" aria-label="Back to top">
              <span>ROMAE</span>
              <small>PIZZERIA</small>
            </a>
            <p>Modern Italian food,<br />rooted in old rituals.</p>
          </div>
          <div className="footer-links">
            <span className="footer-links-label">Explore</span>
            <a href="#menu">Menu</a>
            <a href="#our-dough">Our dough</a>
            <a href="#visit">Visit</a>
          </div>
          <div className="footer-links">
            <span className="footer-links-label">Order from</span>
            <a href="tel:+918446844925">Call us</a>
            <a href="https://www.zomato.com/pune/romae-pizzeria-1-lohegaon" target="_blank" rel="noreferrer">Zomato</a>
            <a href="https://www.swiggy.com/city/pune/romae-pizzeria-lohgaon-rest1268147" target="_blank" rel="noreferrer">Swiggy</a>
          </div>
          <div className="footer-visit">
            <span className="footer-links-label">Find us</span>
            <p>Porwal Road, Lohegaon, Pune<br />Open every day<br />1:00 PM — 12:00 AM</p>
          </div>
        </div>
        <div className="footer-giant" aria-hidden="true">ROMAE<span>.</span></div>
        <div className="footer-bottom">
          <span>© 2026 Romae Pizzeria</span>
          <span>Made in Pune, inspired by Napoli</span>
        </div>
      </footer>

      {cartOpen && <button className="drawer-backdrop" type="button" onClick={() => setCartOpen(false)} aria-label="Close bag" />}
      <aside className={cartOpen ? 'cart-drawer open' : 'cart-drawer'} aria-hidden={!cartOpen} inert={!cartOpen} role="dialog" aria-modal="true" aria-label="Your bag">
        <div className="cart-header">
          <div><span>Your bag</span><strong>{cartCount} {cartCount === 1 ? 'item' : 'items'}</strong></div>
          <button ref={cartCloseRef} type="button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={20} /></button>
        </div>
        <div className="cart-content">
          {cartItems.length ? cartItems.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt="" />
              <div><h3>{item.name}</h3><p>{formatPrice(item.price)}</p></div>
              <div className="quantity-control">
                <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={13} /></button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}><Plus size={13} /></button>
              </div>
            </div>
          )) : (
            <div className="empty-cart">
              <ShoppingBag size={28} aria-hidden="true" />
              <h3>Nothing in the bag yet.</h3>
              <p>Start with a Margherita. It rarely lets anyone down.</p>
              <button type="button" className="outline-button" onClick={() => setCartOpen(false)}>Browse the menu</button>
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="cart-checkout">
            <div><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div>
            <a className="button button-solid cart-checkout-button" href="tel:+918446844925">Call to place order <ArrowRight size={16} aria-hidden="true" /></a>
            <small>Final availability and total confirmed by the restaurant.</small>
          </div>
        )}
      </aside>

      <button className="mobile-order-bar" type="button" onClick={openCart}>
        <span>View bag · {cartCount}</span>
        <strong>{cartCount ? formatPrice(cartTotal) : 'Start an order'}</strong>
      </button>
    </div>
  )
}

export default App
