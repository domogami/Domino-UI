# A few photos, one reusable stack

`PolaroidStack` brings the personal notebook's hand-drawn arrows, Caveat captions, and slide-and-tuck motion into a component that accepts any number of images. Following cards contain real images rather than blank paper. The stable swipe button keeps keyboard focus while the prints change.

```tsx
import { PolaroidStack, type PolaroidPhoto } from '@domlee/ui';
import '@domlee/ui/styles.css';
// Import fonts.css once if your app does not already provide the system fonts.
import '@domlee/ui/fonts.css';

const photos: readonly PolaroidPhoto[] = [
  {
    id: 'keyboard-top',
    src: '/images/snap75-top.jpg',
    alt: 'A split keyboard from above, with two little displays',
    caption: 'every little detail.',
  },
  {
    id: 'keyboard-desk',
    src: '/images/snap75-desk.jpg',
    alt: 'A hand-soldered keyboard resting on a desk',
    caption: 'the first one I ever soldered.',
  },
  // Add another object with its own id, src, alt, and caption.
];

export function Keepsakes() {
  return <PolaroidStack label="A keyboard, made by hand" photos={photos}
    aspectRatio={16 / 9} />;
}
```

Add original image files to your application's public directory and append entries to the array. Paths belong to the consuming app; the package does not upload or store photos. Keep `id` unique and stable when inserting, removing, or reordering items. Without an ID, the component uses the image URL; provide explicit IDs when intentionally using the same URL for different prints.

## API

| Prop | Default | Meaning |
| --- | --- | --- |
| `photos` | required | A readonly array of `{ src, alt, id?, caption?, objectPosition? }` |
| `label` | `Photo stack` | Accessible name for the collection |
| `aspectRatio` | `16 / 9` | Image-window width divided by height; captions grow independently |
| `quiet` | `false` | Instant selection changes with no drag deformation or excursion |
| `onIndexChange` | omitted | `(index, photo) => void`, once per accepted user action |
| Native div attributes | omitted | `className`, `style`, data/ARIA attributes, and composed event handlers |

An empty list shows a clear empty state. A single photo remains static with unavailable previous/next actions. Larger arrays cycle in both directions and render only a small window of physical prints. Extending or reordering the list preserves the selected ID; removing it chooses an available neighboring position. Data reconciliation does not invent a user selection callback.

Use useful alt text for each image. Captions supply the handwritten aside, not the image's only description. The current image and one polite count describe the selected print; underlying cards are decorative and hidden from assistive technology.

## Touch, keyboard, and motion

- Flick or drag horizontally on the front print. A deliberate swipe or a quick short flick selects once; a rejected drag returns gently.
- Vertical page scrolling and pinch zoom remain native through `touch-action: pan-y pinch-zoom`. Pointer cancellation and a second touch cancel the photo gesture.
- Tap or click the front print, press Enter/Space, use Previous/Next, or press Left/Right while focus is in the stack.
- A completed drag suppresses its following synthetic click so it cannot cycle twice.
- The source-derived outgoing card slides to the side and tucks below the stack in 480ms. Its actual starting transform is retained, including an interrupted settling pose. The component releases motion from real animation/transition completion rather than a guessed timeout.
- Quiet mode and `prefers-reduced-motion: reduce` reach the final arrangement immediately. There is no autoplay or hover drift.

Motion tokens live in `tokens/system.json`: `polaroid-duration` (480ms), `polaroid-return-duration` (220ms), and `polaroid-easing`. Regenerate with `npm run build:system` after changing canonical values.

The swipe surface uses `data-native-tap="none"` so Safari's auxiliary native switch target cannot intercept a horizontal gesture. Previous/Next remain ordinary buttons marked for selection feedback. The gesture surface also uses manual feedback so a rejected drag or its synthetic click cannot announce a selection. Use your application's existing `TouchFeedbackProvider` or handle semantic feedback through `onIndexChange`; do not assume a swipe can produce arbitrary physical haptics in Safari. [Touch feedback behavior](HAPTICS.md).

## Responsive composition

Choose one intentional image ratio for the collection. The default matches a landscape print and prevents the old tall/narrow mobile crop. Portrait images can use `objectPosition` to place the important part of a cover crop, or a portrait collection can use `aspectRatio={3 / 4}`. Captions wrap naturally. Leave a small margin for rotated paper and keep the collection within its container; the component clips the horizontal excursion so it cannot widen the page.

The visual catalog begins with the two existing public SNAP-75 photos. **Add a sample print** appends the original illustrated Domino cover to demonstrate a third item without inventing another personal photo. **Reset photo stack** returns the example to its initial collection.

## Personal-site adapter

The personal website can consume this component without adopting the whole application shell or theme provider. `app/components/notebook/NotebookPhotoStack.tsx` contains the site's photo array and maps the existing notebook's colors and fonts locally. It passes the existing motion preference through `quiet` and uses the site's existing selection feedback. Add photos to that array and place the files in the site's public image directory; no additional classes, booleans, or animation rules are needed.

The component source is `src/lib/polaroid-stack.tsx` and imports its own stylesheet. It remains re-exported from `src/lib/patterns.tsx` and the package root for compatibility. Keep the consuming project's dependency pinned to a reviewed full commit as described in [adoption](ADOPTION.md).
