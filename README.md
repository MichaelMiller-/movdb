# Movie Library

## Requirements

Use a Node.js version supported by electron-vite 5 (Node 20.19+ or 22.12+).

## Run

```bash
npx install-electron --no
npm install
npm run dev
```

The first start creates `movie-library.sqlite` in Electron's application data directory and runs the initial migration automatically.

## Architecture

```text
React renderer
    |
    | typed window.movieLibrary API
    v
preload / contextBridge
    |
    | ipcRenderer.invoke(...)
    v
Electron main IPC handlers
    |
    v
MovieRepository
    |
    v
TypeORM
    |
    v
better-sqlite3 / SQLite
```

The renderer never gets access to Node, TypeORM, SQLite, or `ipcRenderer` directly.


# Command-line 
```bash
--db <filename>
```
