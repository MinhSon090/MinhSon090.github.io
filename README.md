# My Portfolio

React + Vite portfolio with an interactive 3D collection and subtle animations
adapted from [React Bits](https://reactbits.dev).

```sh
npm install
npm run dev
```

Run `npm run check` for linting and `npm run build` for a production build.
See [project documentation](docs/README.md) for content and deployment details.

The hero uses a word-by-word blur reveal, magnetic links and a gently tilting
artwork. Achievement tags lift, scale up and change color on hover. Hero hover effects
are limited to mouse input, animations respect `prefers-reduced-motion`, and
the artwork pauses while offscreen or in a hidden tab. No animation library
is required.

Effects live in `src/components/react-bits/`. Adjust `delay`/`startDelay` on
`BlurText`, `strength`/`maxOffset` on `Magnet`, or `amplitude` on `TiltedCard`.
See the [source attribution and license](docs/react-bits-LICENSE.md).
