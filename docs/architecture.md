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
