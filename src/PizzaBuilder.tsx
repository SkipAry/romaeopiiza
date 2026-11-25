import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent, Ref } from 'react'
import { ArrowLeft, ArrowRight, Check, Flame, MessageCircle, Minus, Plus, Rotate3d, RotateCcw, RotateCw, ShoppingBag } from 'lucide-react'
import { builderImage, canonicalToppings, maxToppingPortions, pizzaIngredients, recipeDescription, toppings, whatsAppOrderUrl } from './pizzaRecipe'
import type { ToppingId } from './pizzaRecipe'
import { flyTopping } from './pizzaToppingMotion'
import './PizzaBuilder.css'

type Stage = 'prep' | 'baking' | 'baked'
const bakeDuration = 1400

const combos: { name: string; toppings: ToppingId[] }[] = [
  { name: 'Basil & olive', toppings: ['basil', 'olive'] },
  { name: 'Garden', toppings: ['basil', 'mushroom', 'olive', 'pepper'] },
  { name: 'Smokehouse', toppings: ['pepper', 'chicken'] },
]

const toppingsWithPieces = toppings.map((topping, index) => ({
  ...topping,
  portions: Array.from({ length: maxToppingPortions }, (_, portion) => {
    const count = portion === 0 ? topping.pieces : Math.ceil(topping.pieces / 2)
    return Array.from({ length: count }, (_, piece) => {
      const angle = piece * 2.4 + index * .97 + portion * 1.15
      const radius = 34 * Math.sqrt((piece + .3) / count)
      return {
        left: `${50 + Math.cos(angle) * radius}%`,
        top: `${50 + Math.sin(angle) * radius}%`,
        width: `${topping.size * (.84 + ((piece + index) % 4) * .09)}%`,
        '--piece-angle': `${(piece * 127 + index * 57 + portion * 25) % 360}deg`,
      } as CSSProperties
    })
  }),
}))

export default function PizzaBuilder({ onAdd, mainRef }: {
  onAdd: (selection: ToppingId[]) => void
  mainRef: Ref<HTMLElement>
}) {
  const [selection, setSelection] = useState<ToppingId[]>([])
  const [stage, setStage] = useState<Stage>('prep')
  const [added, setAdded] = useState(false)
  const [tilted, setTilted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [autoSpin, setAutoSpin] = useState(true)
  const isBaked = stage === 'baked'
  const isBaking = stage === 'baking'
  const turntableRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const dragRef = useRef<{ pointerId: number; x: number; rotation: number } | null>(null)
  const flightOriginRef = useRef<DOMRect | null>(null)
  const activeFlightsRef = useRef(new Map<HTMLImageElement, () => void>())
  const previousPiecesRef = useRef(new Set<HTMLImageElement>())
  const controlsRef = useRef<HTMLElement>(null)
  const controlsTitleRef = useRef<HTMLHeadingElement>(null)
  const ingredients = pizzaIngredients(selection)
  const recipeLink = whatsAppOrderUrl(`1 × Custom pizza\nHere’s what’s on my pizza:\n${ingredients.map((name) => `• ${name}`).join('\n')}`)
  const portionCount = (id: ToppingId) => selection.filter((topping) => topping === id).length

  useLayoutEffect(() => {
    const turntable = turntableRef.current
    if (!turntable) return
    const pieces = [...turntable.querySelectorAll<HTMLImageElement>('.builder-piece')]
    const current = new Set(pieces)
    const active = activeFlightsRef.current
    for (const [piece, stop] of active) {
      if (!current.has(piece)) stop()
    }

    const origin = flightOriginRef.current
    flightOriginRef.current = null
    if (origin && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const additions = pieces.filter((piece) => !previousPiecesRef.current.has(piece))
      if (additions.length) turntable.setAttribute('data-flight', '')
      additions.forEach((piece, index) => {
        const stop = flyTopping(piece, origin, Math.min(index * 15, 155), () => {
          active.delete(piece)
          if (!active.size) turntable.removeAttribute('data-flight')
        })
        if (stop) active.set(piece, stop)
      })
      if (!active.size) turntable.removeAttribute('data-flight')
    }
    previousPiecesRef.current = current
  }, [selection])

  useEffect(() => {
    const active = activeFlightsRef.current
    const stopAll = () => { for (const stop of active.values()) stop() }
    window.addEventListener('scroll', stopAll, { passive: true })
    window.addEventListener('resize', stopAll)
    return () => {
      window.removeEventListener('scroll', stopAll)
      window.removeEventListener('resize', stopAll)
      stopAll()
    }
  }, [])

  useEffect(() => {
    if (!isBaking) return
    const timer = window.setTimeout(() => setStage('baked'), bakeDuration)
    return () => window.clearTimeout(timer)
  }, [isBaking])

  useEffect(() => {
    if (isBaked && (document.activeElement === document.body || controlsRef.current?.contains(document.activeElement))) {
      controlsTitleRef.current?.focus()
    }
  }, [isBaked])

  function addTopping(id: ToppingId, event: MouseEvent<HTMLButtonElement>) {
    if (isBaking || portionCount(id) >= maxToppingPortions) return
    flightOriginRef.current = event.currentTarget.querySelector('img')?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
    setSelection((current) => [...current, id])
  }

  function removeTopping(id: ToppingId) {
    setSelection((current) => {
      const index = current.lastIndexOf(id)
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  function rotateTo(degrees: number) {
    for (const stop of activeFlightsRef.current.values()) stop()
    rotationRef.current = degrees
    turntableRef.current?.style.setProperty('--pizza-rotation', `${degrees}deg`)
  }

  function tiltPreview() {
    for (const stop of activeFlightsRef.current.values()) stop()
    setTilted((current) => !current)
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (isBaking || !event.isPrimary || event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, rotation: rotationRef.current }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  function turnOnDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (isBaking || !drag || drag.pointerId !== event.pointerId) return
    rotateTo(drag.rotation + (event.clientX - drag.x) * 1.2)
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  function reset() {
    controlsTitleRef.current?.focus()
    setSelection([])
    setStage('prep')
    setAdded(false)
  }

  function editToppings() {
    controlsTitleRef.current?.focus()
    setStage('prep')
    setAdded(false)
  }

  function bake() {
    if (isBaking) return
    for (const stop of activeFlightsRef.current.values()) stop()
    dragRef.current = null
    setDragging(false)
    setStage(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'baked' : 'baking')
  }

  function addToBag() {
    if (added) return
    onAdd(canonicalToppings(selection))
    setAdded(true)
  }

  return (
    <main className="pizza-builder" ref={mainRef} tabIndex={-1} aria-labelledby="builder-title" id="builder-main">
      <div className="builder-inner">
        <a className="builder-back" href="#menu"><ArrowLeft size={16} aria-hidden="true" /> Back to menu</a>
        <div className="builder-heading">
          <h1 id="builder-title">Build your <em>own pizza.</em></h1>
          <p>Choose your toppings, bake your pizza, then send the recipe to Romae.</p>
        </div>

        <div className="builder-workbench">
          <figure className={`builder-stage builder-stage--${stage}`} data-spin-paused={!autoSpin || dragging || isBaking ? '' : undefined} style={{ '--bake-duration': `${bakeDuration}ms` } as CSSProperties}>
            <figcaption className="builder-stage-caption">
              <span><span className="builder-status-dot" />{isBaking ? 'Baking' : isBaked ? 'Pizza ready' : 'Live pizza preview'}</span>
              {!isBaking && <span className="builder-spin-hint" aria-hidden="true">Drag to spin</span>}
            </figcaption>
            <div
              className={`builder-preview${dragging ? ' is-dragging' : ''}`}
              role="img"
              aria-label={`Pizza preview: ${recipeDescription(selection)}`}
              onPointerDown={startDrag}
              onPointerMove={turnOnDrag}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onLostPointerCapture={finishDrag}
            >
              {isBaking && <div className="builder-bake-glow" aria-hidden="true" />}
              <div className={`builder-surface${tilted ? ' is-tilted' : ''}`}>
                <div className="builder-turntable" ref={turntableRef}>
                  <div className="builder-board" />
                  <div className="builder-pie">
                    <img src={builderImage('cheese-base')} alt="" className="builder-base" width="620" height="606" fetchPriority="high" />
                    {toppingsWithPieces.map(({ id, portions }) => portions.slice(0, portionCount(id)).map((positions, portion) => (
                      positions.map((position, index) => (
                        <img key={`${id}-${portion}-${index}`} className="builder-piece" src={builderImage(id)} style={position} alt="" />
                      ))
                    )))}
                  </div>
                </div>
              </div>
            </div>
            <div className="builder-stage-footer" role={isBaking ? undefined : 'group'} aria-label={isBaking ? undefined : 'Pizza preview controls'}>
              {isBaking ? <div className="builder-bake-track" aria-hidden="true"><span /></div> : <>
                <button className="builder-auto-spin" type="button" aria-pressed={autoSpin} onClick={() => setAutoSpin((current) => !current)}>
                  Auto-spin
                </button>
                <button type="button" onClick={() => rotateTo(rotationRef.current + 45)}>
                  <RotateCw size={16} aria-hidden="true" /> Spin pizza
                </button>
                <button type="button" aria-pressed={tilted} onClick={tiltPreview}>
                  <Rotate3d size={17} aria-hidden="true" /> Tilt view
                </button>
              </>}
            </div>
          </figure>

          <section className="builder-controls" ref={controlsRef} aria-labelledby="builder-controls-title">
            <ol className="builder-steps" aria-label="Pizza builder progress">
              <li aria-current={stage === 'prep' ? 'step' : undefined}>1. Toppings</li>
              <li aria-current={isBaking ? 'step' : undefined}>2. Bake</li>
              <li aria-current={isBaked ? 'step' : undefined}>3. Send recipe</li>
            </ol>

            <div className="builder-control-title">
              <h2 id="builder-controls-title" ref={controlsTitleRef} tabIndex={-1}>{isBaked ? 'Your pizza is ready.' : isBaking ? 'Baking your pizza…' : 'Choose your toppings.'}</h2>
              {!isBaked && <button type="button" className="builder-reset" onClick={reset} disabled={!selection.length || isBaking}><RotateCcw size={15} aria-hidden="true" /> Reset</button>}
            </div>

            {isBaked ? (
              <div className="builder-recipe">
                <p>Here’s what’s on your pizza:</p>
                <ul>
                  {ingredients.map((name) => <li key={name}>{name}</li>)}
                </ul>
              </div>
            ) : (
              <>
                <p className="builder-instruction">Tap a topping to add a portion. Use the minus button to take one off.</p>
                <div className="builder-combos" role="group" aria-label="Topping combinations">
                  <span>Try a combo</span>
                  {combos.map((combo) => (
                    <button
                      key={combo.name}
                      type="button"
                      aria-pressed={combo.toppings.length === selection.length && combo.toppings.every((id) => selection.includes(id))}
                      onClick={(event) => {
                        flightOriginRef.current = event.currentTarget.getBoundingClientRect()
                        setSelection(combo.toppings)
                      }}
                      disabled={isBaking}
                    >{combo.name}</button>
                  ))}
                </div>
                <div className="builder-toppings" role="group" aria-label="Toppings">
                  {toppings.map(({ id, name }) => {
                    const count = portionCount(id)
                    const atLimit = count === maxToppingPortions
                    return (
                      <div key={id} className={`builder-topping-tile${count ? ' has-portions' : ''}`}>
                        <button type="button" className="builder-topping" aria-label={`Add ${name}`} aria-description={`${count} of ${maxToppingPortions} portions`} aria-disabled={atLimit || isBaking} onClick={(event) => addTopping(id, event)}>
                          <span className="builder-topping-image"><img src={builderImage(id)} alt="" width="52" height="52" /></span>
                          <span>{name}</span>
                          {count > 0 ? <span className="builder-topping-count" aria-hidden="true">{count}×</span> : <Plus className="builder-topping-indicator" size={16} aria-hidden="true" />}
                        </button>
                        {count > 0 && <button type="button" className="builder-topping-remove" aria-label={`Remove one ${name}`} disabled={isBaking} onClick={(event) => {
                          const add = event.currentTarget.previousElementSibling
                          if (count === 1 && add instanceof HTMLElement) add.focus()
                          removeTopping(id)
                        }}><Minus size={16} aria-hidden="true" /></button>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="builder-order">
              {isBaked ? <>
                <a className="builder-submit builder-whatsapp" href={recipeLink} target="_blank" rel="noreferrer">
                  <MessageCircle size={18} aria-hidden="true" /> Send recipe on WhatsApp
                  <ArrowRight className="builder-submit-arrow" size={17} aria-hidden="true" />
                </a>
                <p>Review your draft in WhatsApp and tap Send. Romae will confirm availability and price.</p>
                <div className="builder-secondary-actions">
                  <button className="builder-edit" type="button" onClick={editToppings}>Edit toppings</button>
                  <button className="builder-edit" type="button" onClick={addToBag} aria-disabled={added}>
                    {added ? <Check size={15} aria-hidden="true" /> : <ShoppingBag size={15} aria-hidden="true" />}
                    {added ? 'Added to bag' : 'Save to bag'}
                  </button>
                </div>
              </> : <>
                <div className="builder-order-count" aria-live="polite">{selection.length ? `${selection.length} ${selection.length === 1 ? 'portion' : 'portions'} added` : 'Sourdough, tomato pelati & fior di latte'}</div>
                <button className="builder-submit" type="button" onClick={bake} aria-disabled={isBaking}>
                  <Flame size={18} aria-hidden="true" /> {isBaking ? 'Baking your pizza…' : 'Bake pizza'}
                  <ArrowRight className="builder-submit-arrow" size={17} aria-hidden="true" />
                </button>
              </>}
              <span className="builder-sr-only" role="status">{isBaking ? 'Baking pizza' : ''}</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
