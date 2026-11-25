import { useEffect, useState } from 'react'
import type { CSSProperties, Ref } from 'react'
import { ArrowLeft, ArrowRight, Check, Flame, Plus, RotateCcw, ShoppingBag } from 'lucide-react'
import { builderImage, recipeDescription, toppings } from './pizzaRecipe'
import type { ToppingId } from './pizzaRecipe'
import './PizzaBuilder.css'

type Stage = 'prep' | 'baking' | 'baked'

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
      '--piece-delay': `${piece * 30}ms`,
    } as CSSProperties
  }),
}))

export default function PizzaBuilder({ onAdd, mainRef }: {
  onAdd: (selection: ToppingId[]) => void
  mainRef: Ref<HTMLElement>
}) {
  const [selection, setSelection] = useState<ToppingId[]>([])
  const [stage, setStage] = useState<Stage>('prep')
  const [added, setAdded] = useState(false)
  const isBaked = stage === 'baked'
  const isBaking = stage === 'baking'

  useEffect(() => {
    if (!isBaking) return
    const timer = window.setTimeout(() => setStage('baked'), 1400)
    return () => window.clearTimeout(timer)
  }, [isBaking])

  function toggleTopping(id: ToppingId) {
    setSelection((current) => current.includes(id) ? current.filter((topping) => topping !== id) : [...current, id])
  }

  function reset() {
    setSelection([])
    setStage('prep')
    setAdded(false)
  }

  function advance() {
    if (isBaking || added) return

    if (isBaked) {
      onAdd(toppings.filter(({ id }) => selection.includes(id)).map(({ id }) => id))
      setAdded(true)
      return
    }

    setStage(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'baked' : 'baking')
  }

  return (
    <main className="pizza-builder" ref={mainRef} tabIndex={-1} aria-labelledby="builder-title" id="builder-main">
      <div className="builder-inner">
        <a className="builder-back" href="#menu"><ArrowLeft size={16} aria-hidden="true" /> Back to menu</a>
        <div className="builder-heading">
          <h1 id="builder-title">Build your <em>own pizza.</em></h1>
          <p>Start with Romae’s sourdough, tomato pelati and fior di latte. Then make it yours.</p>
        </div>

        <div className="builder-workbench">
          <figure className={`builder-stage builder-stage--${stage}`}>
            <figcaption className="builder-stage-caption">
              <span><span className="builder-status-dot" />{isBaking ? 'In the oven' : isBaked ? 'Fresh from the oven' : 'Live pizza preview'}</span>
            </figcaption>
            <div className="builder-preview" role="img" aria-label={`Pizza preview: ${recipeDescription(selection)}`}>
              <div className="builder-board" />
              <div className="builder-pie">
                <img src={builderImage('cheese-base')} alt="" className="builder-base" width="620" height="620" fetchPriority="high" />
                {toppingsWithPieces.filter(({ id }) => selection.includes(id)).map(({ id, positions }) => (
                  positions.map((position, index) => (
                    <img key={`${id}-${index}`} className="builder-piece" src={builderImage(id)} style={position} alt="" />
                  ))
                ))}
              </div>
              {isBaking && <div className="builder-oven-heat" aria-hidden="true" />}
            </div>
            <div className="builder-stage-footer" aria-hidden="true">
              <span>Sourdough base</span>
              <span>{isBaked ? <Check size={16} /> : <Flame size={16} />} {isBaked ? 'Bake complete' : 'Wood-fired'}</span>
            </div>
          </figure>

          <section className="builder-controls" aria-labelledby="builder-controls-title">
            <ol className="builder-steps" aria-label="Pizza builder progress">
              <li aria-current={stage === 'prep' ? 'step' : undefined}>1. Top</li>
              <li aria-current={isBaking ? 'step' : undefined}>2. Bake</li>
              <li aria-current={isBaked ? 'step' : undefined}>3. Ready</li>
            </ol>

            <div className="builder-control-title">
              <h2 id="builder-controls-title">{isBaked ? 'Your pizza is ready.' : 'Choose your toppings.'}</h2>
              {!isBaked && <button type="button" className="builder-reset" onClick={reset} disabled={!selection.length || isBaking}><RotateCcw size={15} aria-hidden="true" /> Reset</button>}
            </div>

            {isBaked ? (
              <div className="builder-recipe">
                <p>Here’s what’s on your pizza:</p>
                <ul>
                  <li>Tomato pelati &amp; fior di latte</li>
                  {toppings.filter(({ id }) => selection.includes(id)).map(({ id, name }) => <li key={id}>{name}</li>)}
                </ul>
                <button className="builder-edit" type="button" onClick={() => { setStage('prep'); setAdded(false) }}>Edit toppings <ArrowRight size={15} aria-hidden="true" /></button>
              </div>
            ) : (
              <>
                <p className="builder-instruction">Tap a topping to add or remove it.</p>
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
              <div className="builder-order-count" aria-live="polite">{selection.length ? `${selection.length} ${selection.length === 1 ? 'topping' : 'toppings'} selected` : 'Classic cheese base'}</div>
              <button className="builder-submit" type="button" onClick={advance} aria-disabled={isBaking || added}>
                {isBaked ? <ShoppingBag size={18} aria-hidden="true" /> : <Flame size={18} aria-hidden="true" />}
                {added ? 'Added to bag' : isBaked ? 'Add custom pizza to bag' : isBaking ? 'Baking your pizza…' : 'Bake it'}
                <ArrowRight className="builder-submit-arrow" size={17} aria-hidden="true" />
              </button>
              {added && <button className="builder-edit" type="button" onClick={reset}>Build another pizza <ArrowRight size={15} aria-hidden="true" /></button>}
              <p>Custom pizzas are requested by phone. Romae confirms availability and price.</p>
              <span className="builder-sr-only" role="status">{isBaking ? 'Baking pizza' : isBaked ? 'Pizza ready to add to your bag' : ''}</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
