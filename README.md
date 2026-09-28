# Personal Portfolio & 3D Showcase

A modern white portfolio built with React, Vite and Three.js. The page presents your personal introduction first, achievements next, and an interactive 3D collection at the bottom. Personal details and achievements are placeholders for you to fill in.

## Run locally

Install **Node.js 22.12 or later** and npm, then open a terminal in `D:\pro_re`:

```powershell
npm install
npm run dev
```

Open the local address printed by Vite. To build and preview the production version:

```powershell
npm run build
npm run preview
```

The build output is written to `dist`. The preview command serves that build locally. Run `npm run check` to check JavaScript and React code with ESLint.

## Personalize and extend

| Location | Purpose |
| --- | --- |
| `src/data/portfolio.js` | Personal information, introduction, achievements and navigation. |
| `src/data/models.js` | Model records, categories and model/thumbnail paths. |
| `src/App.jsx` | Composes the portfolio sections in display order. |
| `src/components/` | Reusable interface components and the 3D viewer. |
| `src/styles.css` | Layout, typography, colors, spacing and effects. |
| `public/models/` | 3D `.glb` assets. |
| `public/thumbnails/` | Model thumbnails. |
| `public/draco/` | Local Draco decoder files for compressed models. |
| `legacy/3DWebDisplay/` | Preserved original project for reference, excluded from the React build. |
| `.github/workflows/deploy.yml` | GitHub Actions build and deployment workflow. |

Edit `src/data/portfolio.js`:

- `profile`: update `name`, `initials`, `role`, `location`, `greeting`, `headline`, `introduction`, `about` and `disciplines`. `headline` contains two lines.
- `profile.email`, `profile.resume`, `profile.socials`: add your email address, CV path and social links. Empty email/CV values hide their corresponding buttons. Social records use `{ label, url }`.
- `profile.portrait`: place an image in `public/images/` and use a path such as `images/portrait.jpg`. An empty value uses the default artwork. Set `portraitAlt` to describe your photo.
- `achievements`: add or remove records. Each record needs a unique `id`. Replace the sample content and set `isPlaceholder: false` to remove the sample badge. Leave `url` empty to hide the detail link.
- `site`: update the page title, description and navigation records (`{ id, label }`). Navigation IDs must match section IDs.

An achievement follows this structure:

```js
{
  id: 'my-achievement',
  type: 'Award',
  year: '2026',
  title: 'Achievement title',
  organization: 'Organization or competition',
  description: 'Your contribution and the result.',
  icon: 'award', // Existing options include award, certificate and spark.
  tags: ['Design', 'Technology'],
  url: '',
  isPlaceholder: false,
}
```

React updates the document title and description from these data files. Also update the initial metadata in `index.html` so it matches before JavaScript finishes loading.

To add a section such as projects, experience or articles, create a component in `src/components/`, keep its content in `src/data/` if appropriate, then import and place it in `src/App.jsx`. Add a matching navigation record if the section should appear in the menu.

The `:root` block at the beginning of `src/styles.css` contains shared color tokens and the default font settings. Adjust these to keep the design consistent. Layout spacing is defined in the section, grid and responsive rules in the same file.

## Add a 3D model

1. Place a new `.glb` file in `public/models/` and its thumbnail in `public/thumbnails/` if available.
2. Append a model record to `src/data/models.js` with a unique `id`.
3. Asset paths do not include the `public` directory: use `models/my-model.glb`.
4. Run the app and check loading, rotation, zoom, resetting the view and the layout on a small screen.

Example model record:

```js
{
  id: 'my-model',
  name: 'Model name',
  category: 'mecha',
  tag: 'Concept Design',
  description: 'A short description of the work.',
  note: 'Optional note.',
  path: 'models/my-model.glb',
  thumbnail: 'thumbnails/my-model.jpg', // Use null if no thumbnail is available.
  scale: 1,
}
```

`category` must match an `id` in `modelCategories`. Add a category record to that array to create a new filter. The viewer centers each model and fits the camera to its size.

Use the mouse or touch gestures to rotate and zoom. You can also focus the canvas and use the arrow keys, `+`/`-` and `Home`. The toolbar provides automatic rotation, wireframe display, view reset and PNG snapshots.

Use self-contained `.glb` files with embedded textures. Keep model sizes reasonable for mobile connections. Draco decoding uses files bundled in `public/draco/`.

## Deploy to GitHub Pages

The project is prepared for GitHub Pages; **it has not been deployed yet**.

1. Push the project contents from `D:\pro_re` to the **root** of your GitHub repository. Include `src`, `public`, `index.html`, `package.json`, `package-lock.json`, `vite.config.js`, `eslint.config.js`, `.gitignore` and `.github/workflows/deploy.yml`. Keep `node_modules` and generated `dist` out of Git.
2. In the repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**. See [GitHub's publishing source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
3. Push to `main` or `master` to trigger the workflow, or open the repository's **Actions** tab, select **Deploy portfolio to GitHub Pages** and use **Run workflow**.
4. The workflow uses Node.js 24, installs dependencies with `npm ci`, runs `npm run check`, builds the app and publishes **only `dist`** to GitHub Pages. Open the deployed URL shown by the deployment job or the Pages settings once it succeeds.

GitHub Actions must be enabled for the repository. Keep `package-lock.json` in Git because installation and the npm cache depend on it. The workflow uses GitHub's built-in token and grants Pages/OIDC permissions to the deployment job; no personal access token is needed. If the `github-pages` environment has branch restrictions, allow the branch you intend to deploy.

For a repository named `<username>.github.io`, the site is served at `https://<username>.github.io/`. For a normal project repository, it is served at `https://<username>.github.io/<repository>/`. `vite.config.js` uses `base: './'`, and model/decoder paths use Vite's `BASE_URL`, so the same build supports both root and repository subpaths.

If your default branch is neither `main` nor `master`, update the push trigger in `.github/workflows/deploy.yml`. The workflow builds from the repository root, so do not place this app inside an extra `pro_re` folder unless you also change the workflow's working directory.

## Migration details

Assets from `C:\Users\jajak\Documents\GitHub\MinhSon090.github.io\3DWebDisplay` were copied into this project's `public` directory. These eight existing models are preserved:

- Demo Cube
- Leopard 2 A4 PL
- 2S25 Sprut-SD
- Leopard 2 A4
- 2S38 Derivatsiy-PVO
- Flakpanzer Gepard 1A2
- Leopard 2 A4 SYNA
- Phaelynx Mech

The old catalog referenced `T-90M`, but the source did not contain `t90m.glb`, so it is excluded until its asset is supplied. The source contained only three thumbnails (`cube.jpg`, `leopard2a4.jpg`, `2s38.jpg`); other models use placeholder artwork.

After validation, the complete original project is moved to `D:\pro_re\legacy\3DWebDisplay`, preserving its original code, documentation and assets for reference. It does not participate in the React build or Pages deployment. Update any links in other sites that still point to the old `3DWebDisplay` location once you have the new deployment URL.
