# NRGHax - Energy Optimization Platform

A modern web application for discovering and implementing energy optimization hacks, built with Next.js 15.3, Supabase, and TypeScript.

## 🚀 Tech Stack

- **Framework**: Next.js 15.3 with App Router
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (OAuth + Email/Password)
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (`npm install -g supabase`)
- PostgreSQL (via Supabase local or cloud)

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/nrghax.git
cd nrghax
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your values:

```bash
# Local Supabase (default values)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Production Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
# SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### 3. Start Supabase Locally

```bash
npm run db:start
```

This will:
- Start local Supabase services
- Apply all migrations
- Seed the database with sample data

Supabase Studio will be available at http://localhost:54323
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```


### 4. Generate TypeScript Types

```bash
npm run db:types
```

This generates TypeScript types from your database schema.

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 📝 Development Workflow

### Database Changes

1. Create a new migration:
```bash
npm run db:migrate add_new_feature
```

2. Edit the migration file in `supabase/migrations/`

3. Apply migrations:
```bash
npm run db:reset  # Resets DB and applies all migrations
```

4. Generate new types:
```bash
npm run db:types
```

### Testing

```bash
npm test              # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run E2E tests
```

### Code Quality

```bash
npm run lint         # Lint code
npm run typecheck   # Type checking
```

## 🏗️ Project Structure

```
├── app/                     # Next.js App Router
│   ├── (auth)/             # Authentication pages
│   ├── (dashboard)/        # Protected user pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── features/           # Feature components
├── lib/
│   ├── supabase/          # Supabase clients
│   └── utils.ts           # Utilities
├── server/
│   ├── actions/           # Server Actions
│   └── queries/           # Database queries
├── supabase/
│   ├── migrations/        # SQL migrations
│   └── seed.sql          # Seed data
└── types/                 # TypeScript types
```

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POSTGRES_URL` (if using external DB)
   - `POSTGRES_URL_NON_POOLING`

### Deploy Database

For production Supabase:

```bash
supabase link --project-ref [project-id]
supabase db push
```

## 🔑 Key Features

- **Authentication**: Email/password and OAuth (Google, Discord)
- **User Profiles**: Automatic profile creation on signup
- **Energy Hacks**: Browse, search, and track energy optimization techniques
- **Routines**: Create and follow custom energy optimization routines
- **Progress Tracking**: Track your implementation progress
- **Admin Panel**: Content management for administrators
- **Real-time Updates**: Live updates via Supabase Realtime

## 📚 Documentation

- [Development Guidelines](./CLAUDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
