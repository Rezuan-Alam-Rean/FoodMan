# FoodMan UI/UX Design System & Mobile-First Engineering Guidelines

> **Target Audience:** All AI agents and engineers building, modifying, or refactoring client-side UI in FoodMan.
> **Scope:** `client/` (Next.js 16, React 19, Tailwind CSS v4, Lucide Icons).
> **Primary Persona:** FoodMan customers in Bangladesh ordering food primarily from mobile smartphones (360px–430px viewports, 4G/mobile networks, one-handed thumb navigation).

---

## 1. Core Principles & Philosophy

0. **UI/UX Purity Mandate (Zero Business Logic Tampering)**
   - **DO NOT** modify, rewrite, or break business logic, query parameters, mutations, API payloads, state stores (Zustand), route auth guards, or backend contracts.
   - Work **PURELY** on presentation, responsive layouts, ergonomics, visual styling, touch affordances, micro-interactions, animation smoothness, accessibility, and UX flows.
   - All handlers (`onClick`, `onChange`, query triggers, pagination observers) must retain their intended operational behavior.

1. **Mobile-First, Responsive-Always**
   - The primary client experience is on a smartphone. Every layout, card, button, and navigation item must look and feel like a native mobile app first, then progressively expand for tablets (`sm`/`md`) and desktops (`lg`/`xl`).
   - Never design a desktop table or multi-column layout and shrink it; design the mobile card/sheet first, then enhance for wide viewports.

2. **Snappy, Tactile & Super Responsive**
   - Every tap must have instant tactile visual feedback (`active:scale-[0.98] transition-transform`).
   - Zero Cumulative Layout Shift (CLS): Use layout skeletons that mirror final content dimensions.
   - Keep interactions 60fps-smooth using GPU-accelerated Tailwind utilities (`transform`, `opacity`).

3. **Strict Industry Standards Compliance**
   - **Apple Human Interface Guidelines (HIG)**: 44×44px minimum touch target size, bottom sheets over desktop modals, native gesture familiarity.
   - **Google Material Design 3 (M3)**: Clear tonal surface hierarchy, elevated action layers, consistent floating navigation.
   - **Nielsen Norman Group (NN/g)**: Clear visibility of system status, instant feedback, error prevention, consistent iconography.
   - **WCAG 2.1 AA Accessibility**: Minimum 4.5:1 color contrast for regular text, 3:1 for large headers and interactive icons, visible focus states.

---

## 2. Spatial System & Layout Ergonomics

### 2.1. The 4px / 8px Grid Standard
Always use standard Tailwind spacing steps divisible by 4px or 8px:
- **Margins & Page Gaps:** `px-4 sm:px-6` on page containers; `py-2 sm:py-4` for headers.
- **Card Paddings:** `p-3` (12px) or `p-4` (16px) on mobile; `p-6` (24px) on tablet/desktop.
- **Element Gaps:** `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px).

### 2.2. Thumb-Zone Architecture
Most users hold phones with one hand and navigate with the thumb:
- **Natural Thumb Zone (Bottom 40% of screen):**
  - Sticky bottom navigation (`CustomerBottomNav`).
  - Primary conversion CTAs: "Add to Cart", "Proceed to Checkout", "Place Order".
  - Filter and sort floating triggers.
- **Stretch Zone (Middle 40% of screen):**
  - Scrollable feeds, food items, restaurant cards, category carousels.
- **Hard-to-Reach Zone (Top 20% of screen):**
  - Read-only headers, brand title, search bar, notification bells.
  - Never place single-tap critical checkout actions solely in the top header.

### 2.3. Touch Targets (Strict 44×44px Minimum)
- Every interactive element (buttons, icon triggers, chip filters, quantity selectors, close icons) **must have a touch target area of at least 44×44px**, even if the visible icon is 18px or 20px.
- Use `p-2.5`, `p-3`, or `min-h-[44px] min-w-[44px] flex items-center justify-center` on clickable wrappers.
- Never pack tiny clickable icons closer than `gap-2` (8px).

### 2.4. Safe Area & Bottom Dock Clearance
- Mobile browsers (Safari iOS, Chrome Android) have home indicators, dynamic address bars, and navigation bars.
- Pages with floating bottom navs or sticky checkout bars must provide generous bottom clearance:
  - Add `pb-24` or `pb-28` to `<main>` so content is never hidden behind the navigation dock.
  - Use `bottom-3` or `bottom-4` with backdrop blur (`backdrop-blur-xl bg-white/95 dark:bg-slate-900/95`) for floating navigation bars.

### 2.5. Zero Horizontal Overflow Rule
- The viewport must never scroll horizontally accidentally.
- All horizontal scroll lists (e.g. food categories, cuisine chips, photo carousels) must:
  - Contain `.no-scrollbar` or `overflow-x-auto`.
  - Use `-webkit-overflow-scrolling: touch`.
  - Use `snap-x snap-mandatory` and `snap-start` for smooth swipe snapping.
  - Add a subtle peek or right padding (`pr-6`) so the user immediately knows more content exists horizontally.

---

## 3. Visual Design System & Tokens

### 3.1. Color Palette (Tailwind CSS v4)
| Role | Class / Value | Purpose |
| :--- | :--- | :--- |
| **Brand Primary** | `rose-600` (`#E11D48` / `#FF4B6E`) | Primary buttons, active tabs, brand accents, badges |
| **Brand Hover/Active** | `rose-700`, `active:bg-rose-800` | Pressed states, active interactions |
| **Brand Subtle** | `rose-50` / `rose-100/50` | Badge backgrounds, highlighted item rows |
| **Background Canvas** | `#F8F9FA` (`bg-[#F8F9FA]`) | App-wide soft neutral background |
| **Surface Card (Light)**| `bg-white` + `border border-slate-200/80` | Cards, popovers, dropdowns |
| **Surface Card (Dark)** | `dark:bg-slate-900` + `dark:border-slate-800` | Dark mode cards and modals |
| **Text Primary** | `text-slate-900` (`#0F172A`) | Headings, food titles, prices |
| **Text Secondary** | `text-slate-600` / `text-slate-500` | Subtitles, delivery times, descriptions |
| **Text Muted** | `text-slate-400` | Inactive icons, helper notes, timestamps |
| **Success** | `emerald-600` (`bg-emerald-50 text-emerald-700`) | Delivered orders, veg food badge, active coupons |
| **Warning** | `amber-500` / `amber-600` (`bg-amber-50 text-amber-700`) | Cooking, rating stars, low stock |
| **Danger** | `rose-600` (`bg-rose-50 text-rose-700`) | Cancelled, error alerts, delete actions |
| **Info / Transit** | `sky-600` (`bg-sky-50 text-sky-700`) | Rider on the way, live tracking updates |

### 3.2. Typography Hierarchy (Plus Jakarta Sans)
- **Display / H1:** `text-2xl sm:text-3xl font-black tracking-tight text-slate-900`
- **Section Heading / H2:** `text-lg sm:text-xl font-bold tracking-tight text-slate-900`
- **Item Title / H3:** `text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100`
- **Body Text:** `text-sm leading-relaxed text-slate-600 dark:text-slate-300`
- **Secondary / Meta:** `text-xs font-medium text-slate-500 dark:text-slate-400`
- **Micro Tags & Badges:** `text-[10px] sm:text-xs font-extrabold uppercase tracking-wider`
- **Monospace / Numbers:** `font-mono font-bold tracking-tight` (for coupon codes, order IDs, timestamps).

> **CRITICAL iOS Zoom Rule:**
> All input fields (`<input>`, `<select>`, `<textarea>`) must have at least `text-base` (16px) or `text-sm sm:text-base` styled appropriately to prevent iOS Safari from automatically zooming into the page on focus.

### 3.3. Elevation, Borders & Glassmorphism
- Prefer modern, clean borders over heavy opaque drop shadows: `border border-slate-200/80 dark:border-slate-800`.
- Shadows should be soft, diffused, and colored: `shadow-[0_8px_25px_rgb(0,0,0,0.06)]` or `shadow-sm`.
- Glassmorphism for floating docks and headers: `backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80`.
- Rounded Radii:
  - Cards: `rounded-2xl` or `rounded-3xl`
  - Buttons / Inputs: `rounded-xl` or `rounded-2xl`
  - Chips / Tags / Avatars: `rounded-full`

---

## 4. Mobile Interaction Patterns & Component Standards

### 4.1. Buttons & Tactile Feedback
```tsx
// Standard Primary Mobile Action Button
<button
  className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-rose-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
>
  {/* icon + text */}
</button>
```
- Always provide active press animation (`active:scale-[0.98]`).
- Show loading state with a spinner (`Loader2 className="w-4 h-4 animate-spin"`) without changing button dimensions.

### 4.2. Bottom Sheets vs. Desktop Modals
- **On Mobile (`< 640px`):** Dialogs, item modifiers, coupon pickers, and filter menus **must slide up from the bottom as a sheet** (with a drag handle `w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-2`, rounded top corners `rounded-t-3xl`, and sticky bottom CTA).
- **On Desktop (`≥ 640px`):** Transform gracefully into a centered dialog with `sm:max-w-lg sm:rounded-3xl`.

### 4.3. Food & Restaurant Cards
- **Image Aspect Ratios:** Use `aspect-video` (16:9) or `aspect-[4/3]` for restaurant covers; use `aspect-square` (1:1) or `w-24 h-24 sm:w-28 sm:h-28` for food thumbnail rows.
- **Image Optimization:** Always include `loading="lazy"`, proper `alt` text, fallback container background (`bg-slate-100 dark:bg-slate-800`), and `object-cover`.
- **Pricing Standard:** Always format currency with `formatBDT(amount)` (`৳XX`). If an item has an active discount, show the discounted price prominently and the original price with `line-through text-slate-400 text-xs`.
- **Direct Add to Cart Stepper:** If an item is in the cart, show `- [count] +` directly on the card; if not in cart, show a prominent `+ Add` button with at least 44×44px hit area.

### 4.4. Sticky Checkout & Cart Banner
- Whenever the user has items in their cart, display a sticky floating cart summary bar above the bottom navigation:
  - Total items + total price.
  - One-tap "View Cart" or "Checkout" button.
  - Safe z-index layering (`z-30` or `z-40`, below modal sheets at `z-50`).

### 4.5. Empty, Loading & Error States
- **Loading:** Never display a blank white screen. Use skeleton cards (`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl`) matching the layout geometry of the real cards.
- **Empty States:** Include an illustrative icon (`PackageOpen`, `UtensilsCrossed`, `SearchX`), clear human-readable title, short explanation, and a high-contrast action button (e.g. "Explore Restaurants").
- **Error States:** Show informative, non-technical error cards with a clear "Try Again" mutation retry trigger.

### 4.6. Form & Input Ergonomics
- **Phone Numbers:** Use `type="tel"`, `inputMode="tel"`, placeholder `01712 345678`, and format display using `formatPhone`.
- **OTP / Pin:** Use `inputMode="numeric"`, `pattern="[0-9]*"`, auto-advance between digits, and support paste.
- **Virtual Keyboard Friendly:** Form submit buttons must stay visible when the keyboard opens; form containers must allow vertical scrolling with `overflow-y-auto`.

---

## 5. Responsive Breakpoint Matrix

| Viewport | Tailwind Prefix | Target Devices | Layout Rules |
| :--- | :--- | :--- | :--- |
| **< 640px** | Default (Mobile) | iPhone, Galaxy S, Pixel (360px–430px) | Single column feed, full-width cards or compact list cards, bottom nav bar, swipeable sheets, horizontal chips. |
| **640px - 767px** | `sm:` | Large phones, small phablets | 2-column card grid, compact 2-column forms, slightly larger typography. |
| **768px - 1023px**| `md:` | iPad, tablets, portrait monitors | 2 to 3 column feeds, combined header navigation, enhanced filter side-panels. |
| **≥ 1024px** | `lg:` | Laptops & Desktops | Multi-column layouts (e.g., sticky category sidebar + main feed + sticky cart drawer), max container `max-w-5xl` or `max-w-6xl`. |

---

## 6. Code Style & Architecture Best Practices

1. **Utility Aggregation:**
   - Always merge dynamic classes using the project helper:
     ```tsx
     import { cn } from '@/lib/utils';
     <div className={cn("base-classes", isActive && "active-classes", className)} />
     ```

2. **No Inline Hardcoded Colors:**
   - Do not write arbitrary hex codes like `style={{ color: '#ff2345' }}` unless dynamically configured by backend branding. Use Tailwind tokens (`text-rose-600`, `bg-slate-50`).

3. **Domain Helpers from `@/lib/utils`:**
   - Currency: `formatBDT(val)`
   - Phone: `formatPhone(val)`
   - Discounts: `hasValidDiscount(reg, disc)`, `getEffectivePrice(reg, disc)`, `calculateDiscountPercentage(base, disc)`
   - WhatsApp: `getWhatsAppUrl(phone, msg)`

4. **Component Decoupling:**
   - Keep page files focused on state orchestration and queries (`useInfiniteFoodItemsQuery`, etc.).
   - Extract cards, bottom sheets, filters, and floating docks into modular components under `components/customer/`, `components/layout/`, or `components/ui/`.

---

## 7. Pre-Flight Agent Checklist (Verify Before Finalizing)

Before submitting any UI modification or feature in `client/`, run this checklist:

- [ ] **UI/UX Purity:** Are all queries, mutations, states, and business logic completely intact without modifications?
- [ ] **Mobile Viewport Test (360px - 390px):** Does it look immaculate on narrow screens without horizontal overflow or clipped text?
- [ ] **Touch Target Sizing:** Are all buttons, icons, and interactive elements at least 44×44px clickable area?
- [ ] **Tactile Feedback:** Do buttons and interactive cards have `active:scale-[0.98]` or instant tap responses?
- [ ] **Safe Area & Dock Clearance:** Is there sufficient bottom padding (`pb-24`+) so content is not obscured by the bottom navigation bar?
- [ ] **Input Zoom Prevention:** Are form input font sizes at least 16px (`text-base` or equivalent) on mobile?
- [ ] **Loading & Empty States:** Are skeleton screens or animated loaders implemented for async data?
- [ ] **Formatting Helpers:** Are all prices displayed via `formatBDT()` and phone numbers via `formatPhone()`?
- [ ] **Accessibility & Contrast:** Does text meet WCAG 2.1 AA readability standards against its background?
- [ ] **Build & Linter Passing:** Does the code compile cleanly with TypeScript and Next.js without lint errors?
