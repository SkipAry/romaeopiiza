# Romae Pizzeria

A responsive editorial storefront for Romae Pizzeria in Pune, built from the supplied design direction. The site presents the restaurant, featured pizzas, dough story, full pizza menu, location details, and direct ordering links.

## Features

- Responsive desktop and mobile layouts
- Featured and full-menu pizza sections with vegetarian and spicy indicators
- Persistent local bag with quantity controls and an accessible cart drawer
- Phone ordering plus external Swiggy, Zomato, and Google Maps links
- Keyboard support, focus management, and accessible labels for interactive controls

The bag is a front-end experience only. Placing an order currently continues by phone or through the linked delivery services.

## Development

Requires a current Node.js release and npm.

```bash
npm install
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |

Built with React, TypeScript, Vite, and Lucide React.

## Image assets

The pizza and oven imagery in `public/images/` combines supplied product cutouts with AI-generated stock-style photography. All assets are bundled locally; the site does not hotlink images. Replace them with approved restaurant photography before production if brand or licensing requirements call for it.
