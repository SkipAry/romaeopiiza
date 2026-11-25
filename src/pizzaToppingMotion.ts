export function flyTopping(piece: HTMLImageElement, origin: DOMRect, delay: number, onFinish: () => void) {
  const destination = piece.getBoundingClientRect()
  if (!destination.width || !destination.height || typeof piece.animate !== 'function') return

  const startX = origin.left + origin.width / 2 - (destination.left + destination.width / 2)
  const startY = origin.top + origin.height / 2 - (destination.top + destination.height / 2)
  const startScale = Math.min(1.7, Math.max(.65, origin.width / piece.offsetWidth))
  const rotation = getComputedStyle(piece).getPropertyValue('--piece-angle')
  const sprite = new Image()
  sprite.src = piece.src
  sprite.alt = ''
  sprite.setAttribute('aria-hidden', 'true')
  sprite.className = 'builder-flying-piece'
  Object.assign(sprite.style, {
    left: `${destination.left + (destination.width - piece.offsetWidth) / 2}px`,
    top: `${destination.top + (destination.height - piece.offsetHeight) / 2}px`,
    width: `${piece.offsetWidth}px`,
    height: `${piece.offsetHeight}px`,
  })
  document.body.append(sprite)

  const duration = 260
  const flight = sprite.animate([
    { transform: `translate(${startX}px, ${startY}px) rotateX(30deg) rotate(-24deg) scale(${startScale})`, opacity: 0 },
    { transform: `translate(${startX * .27}px, ${startY * .27 - 22}px) rotateX(45deg) rotate(20deg) scale(1.25)`, opacity: 1, offset: .55 },
    { transform: `translate(0, 0) rotate(${rotation}) scale(.96)`, opacity: 1, offset: .91 },
    { transform: `rotate(${rotation})`, opacity: 0 },
  ], { duration, delay, easing: 'cubic-bezier(.23, 1, .32, 1)', fill: 'both' })
  const landing = piece.animate([{ opacity: 0 }, { opacity: 0, offset: .91 }, { opacity: 1 }], { duration, delay, fill: 'both' })

  const finish = () => {
    flight.onfinish = null
    flight.cancel()
    landing.cancel()
    sprite.remove()
    onFinish()
  }
  flight.onfinish = finish
  return finish
}
