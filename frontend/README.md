# Frontend

React TypeScript frontend for the peer-to-peer learning platform.

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Building

```bash
npm run build
```

## Linting & Formatting

```bash
npm run lint
npm run lint:fix
npm run format
```

## Project Structure

```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── pages/                # Page components
├── components/           # Reusable components
├── utils/                # Helper utilities
└── styles/               # CSS & Tailwind
```

## Deployment

### Vercel

```bash
# Connect your GitHub repo to Vercel
# Auto-deploys on push to main
```

See `docs/DEPLOYMENT.md` for detailed instructions.
