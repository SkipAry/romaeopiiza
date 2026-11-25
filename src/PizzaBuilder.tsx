import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, Ref } from 'react'
import { ArrowLeft, ArrowRight, Check, Flame, MessageCircle, Plus, RotateCcw, ShoppingBag } from 'lucide-react'
import { builderImage, pizzaIngredients, recipeDescription, toppings, whatsAppOrderUrl } from './pizzaRecipe'
import type { ToppingId } from './pizzaRecipe'
import './PizzaBuilder.css'

type Stage = 'prep' | 'baking' | 'baked'
const bakeDuration = 1600

const toppingsWithPieces = toppings.map((topping, index) => ({
  ...topping,
  positions: Array.from({ length: topping.pieces }, (_, piece) => {
    const angle = piece * 2.4 + index * 0.97
    const radius = 34 * Math.sqrt((piece + 0.25) / topping.pieces)
    return {
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
      width: `${topping.size * (0.84 + ((piece + index) % 4) * 0.09)}%`,
      '--piece-angle': `${(piece * 127 + index * 57) % 360}deg`,
      '--piece-offset': `${Math.cos(angle) * 120}%`,
      '--piece-delay': `${piece * 24}ms`,
    } as CSSProperties
  }),
}))

const embers = Array.from({ length: 8 }, (_, index) => ({
  left: `${12 + index * 11}%`,
  top: `${66 + (index % 3) * 7}%`,
  '--ember-drift': `${(index % 2 ? -1 : 1) * (9 + index * 3)}px`,
  '--ember-delay': `${170 + index * 62}ms`,
} as CSSProperties))

export default function PizzaBuilder({ onAdd, mainRef }: {
  onAdd: (selection: ToppingId[]) => void
  mainRef: Ref<HTMLElement>
}) {
  const [selection, setSelection] = useState<ToppingId[]>([])
  const [stage, setStage] = useState<Stage>('prep')
  const [added, setAdded] = useState(false)
  const isBaked = stage === 'baked'
  const isBaking = stage === 'baking'
  const controlsRef = useRef<HTMLElement>(null)
  const controlsTitleRef = useRef<HTMLHeadingElement>(null)
  const ingredients = pizzaIngredients(selection)
  const recipeLink = whatsAppOrderUrl(`1 × Custom pizza\nHere’s what’s on my pizza:\n${ingredients.map((name) => `• ${name}`).join('\n')}`)

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

  function toggleTopping(id: ToppingId) {
    setSelection((current) => current.includes(id) ? current.filter((topping) => topping !== id) : [...current, id])
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
    setStage(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'baked' : 'baking')
  }

  function addToBag() {
    if (added) return
    onAdd(toppings.filter(({ id }) => selection.includes(id)).map(({ id }) => id))
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
          <figure className={`builder-stage builder-stage--${stage}`} style={{ '--bake-duration': `${bakeDuration}ms` } as CSSProperties}>
            <figcaption className="builder-stage-caption">
              <span><span className="builder-status-dot" />{isBaking ? 'In the oven' : isBaked ? 'Fresh from the oven' : 'Live pizza preview'}</span>
            </figcaption>
            <div className="builder-preview" role="img" aria-label={`Pizza preview: ${recipeDescription(selection)}`}>
              <div className="builder-surface">
                <div className="builder-board" />
                <div className="builder-pie">
                  <img src={builderImage('cheese-base')} alt="" className="builder-base" width="620" height="606" fetchPriority="high" />
                  {toppingsWithPieces.filter(({ id }) => selection.includes(id)).map(({ id, positions }) => (
                    positions.map((position, index) => (
                      <img key={`${id}-${index}`} className="builder-piece" src={builderImage(id)} style={position} alt="" />
                    ))
                  ))}
                </div>
              </div>
              {isBaking && <>
                <div className="builder-oven-heat" aria-hidden="true" />
                {embers.map((style, index) => <i className="builder-ember" key={index} style={style} aria-hidden="true" />)}
              </>}
            </div>
            <div className="builder-stage-footer" aria-hidden="true">
              <span>Sourdough base</span>
              <span>{isBaked ? <Check size={16} /> : <Flame size={16} />} {isBaked ? 'Bake complete' : 'Wood-fired'}</span>
            </div>
          </figure>

          <section className="builder-controls" ref={controlsRef} aria-labelledby="builder-controls-title">
            <ol className="builder-steps" aria-label="Pizza builder progress">
              <li aria-current={stage === 'prep' ? 'step' : undefined}>1. Toppings</li>
              <li aria-current={isBaking ? 'step' : undefined}>2. Bake</li>
              <li aria-current={isBaked ? 'step' : undefined}>3. Send recipe</li>
            </ol>

            <div className="builder-control-title">
              <h2 id="builder-controls-title" ref={controlsTitleRef} tabIndex={-1}>{isBaked ? 'Your pizza is ready.' : isBaking ? 'Into the oven…' : 'Choose your toppings.'}</h2>
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
                <p className="builder-instruction">Sourdough, tomato pelati and fior di latte are included. Tap a topping to add or remove it.</p>
                <div className="builder-toppings" role="group" aria-label="Toppings">
                  {toppings.map(({ id, name }) => {
                    const selected = selection.includes(id)
                    return (
                      <button key={id} type="button" className="builder-topping" aria-pressed={selected} disabled={isBaking} onClick={() => toggleTopping(id)}>
                        <span className="builder-topping-image"><img src={builderImage(id)} alt="" width="52" height="52" /></span>
                        <span>{name}</span>
                        {selected ? <Check className="builder-topping-indicator" size={16} aria-hidden="true" /> : <Plus className="builder-topping-indicator" size={16} aria-hidden="true" />}
                      </button>
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
                <div className="builder-order-count" aria-live="polite">{selection.length ? `${selection.length} ${selection.length === 1 ? 'topping' : 'toppings'} selected` : 'Classic cheese base'}</div>
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
