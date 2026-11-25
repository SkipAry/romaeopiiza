export const builderHash = '#/build-pizza'
export const restaurantTel = 'tel:+918446844925'

export const toppings = [
  { id: 'basil', name: 'Fresh basil', pieces: 7, size: 11 },
  { id: 'mushroom', name: 'Mushrooms', pieces: 8, size: 13 },
  { id: 'olive', name: 'Black olives', pieces: 10, size: 7 },
  { id: 'pepper', name: 'Roasted peppers', pieces: 7, size: 12 },
  { id: 'paneer', name: 'Paneer', pieces: 8, size: 9 },
  { id: 'pepperoni', name: 'Chicken pepperoni', pieces: 8, size: 14 },
  { id: 'chicken', name: 'Smoked chicken', pieces: 7, size: 12 },
] as const

export type ToppingId = typeof toppings[number]['id']
export type CustomPizza = { toppings: ToppingId[]; quantity: number }

export const builderImage = (name: string) => `${import.meta.env.BASE_URL}images/builder/${name}.webp`
export const pizzaKey = (selection: ToppingId[]) => selection.join('+') || 'cheese'

export function pizzaIngredients(selection: ToppingId[]) {
  const names = toppings.filter(({ id }) => selection.includes(id)).map(({ name }) => name)
  return ['Sourdough base', 'Tomato pelati', 'Fior di latte', ...names]
}

export function recipeDescription(selection: ToppingId[]) {
  const [base, ...ingredients] = pizzaIngredients(selection)
  return [base, ...ingredients.map((ingredient) => ingredient.toLowerCase())].join(', ')
}

export function whatsAppOrderUrl(order: string) {
  const recipient = restaurantTel.replace('tel:+', '')
  const message = `Hi Romae Pizzeria! I'd like to order:\n\n${order}\n\nPlease confirm availability and the total. Thank you!`
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`
}

export function readCustomPizzas(): CustomPizza[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('romae-custom-pizzas') ?? '[]')
    if (!Array.isArray(saved)) return []

    return saved.flatMap((item) => {
      if (!Array.isArray(item?.toppings) || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return []
      const selected = toppings.filter(({ id }) => item.toppings.includes(id)).map(({ id }) => id)
      return [{ toppings: selected, quantity: item.quantity }]
    })
  } catch {
    return []
  }
}
