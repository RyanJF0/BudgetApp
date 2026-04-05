# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Cloudflare Pages

If the build succeeds but deploy fails with **Must specify a project name**, you likely set a **Deploy command** such as `npx wrangler pages deploy dist`. For Git-connected Pages, remove it:

1. **Cloudflare Dashboard** → your **Pages** project → **Settings** → **Builds & deployments**.
2. **Clear the Deploy command** (leave empty). Cloudflare publishes the build output directory automatically.
3. Keep **Build command:** `npm run build` and **Build output directory:** `dist`.
4. **Retry deployment** or push a new commit.

Only use `wrangler pages deploy` from your machine or a custom pipeline if you intend to; then pass `--project-name=YOUR_PAGES_PROJECT_NAME` and the required auth.

## Supabase (auth + data)

Budget data (categories and expenses) is stored in Supabase per signed-in user.

### 1. Create a project

Create a project at [supabase.com](https://supabase.com). In **Settings → API**, copy the **Project URL** and **anon public** key.

### 2. Auth settings

- **Authentication → Providers → Email:** enable email sign-in (magic link).
- **Authentication → URL configuration:** set **Site URL** to your deployed URL (and `http://localhost:5173` for local dev). Add the same URLs under **Redirect URLs**.

### 3. Database

In **SQL → New query**, run the script in [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) (creates `categories` and `expenses` tables plus RLS policies).

### 4. Environment variables

- **Local:** copy [`.env.example`](.env.example) to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart `npm run dev`.
- **Cloudflare Pages:** add the same two variables (names must start with `VITE_`) in the project **Environment variables**, then redeploy.

### 5. Usage

Open the app, enter your email, use the magic link, then add expenses. Data persists across sessions for that account.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
