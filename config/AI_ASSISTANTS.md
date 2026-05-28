# AI guide avatars — configuration & student picker

## What students see

1. Log in to **student.html**
2. Open the **☰ menu** (top-left)
3. At the top: **Your AI guide** — tap **Krishna**, **Radha**, **Rama**, or **Hanuman**
4. Choice is saved per student (browser `localStorage`)

The left-panel avatar and “Ask {name}…” field update for the selected guide.

## What you configure (no code)

### 1. Image files

Place PNGs in **`wizkids/img/`** using this naming:

| Expression | Filename pattern | Used on screens |
|------------|------------------|-----------------|
| guide | `{id}-guide.png` | Learning, subtopics, Moksha game |
| happy | `{id}-happy.png` | Modules, dashboard, summary |
| thinking | `{id}-thinking.png` | Mood check |
| concerned | `{id}-concerned.png` | Assessment, feedback |
| proud / exited | optional — defaults to `{id}-happy.png` in config | Rare |

Examples: `hanuman-concerned.png`, `radha-guide.png`, `rama-happy.png`

You can keep a working copy in **`Student task/img/`** and sync:

```bash
cd wizkids
node scripts/sync-assistant-images.mjs
# or: node scripts/sync-assistant-images.mjs "/Users/tarun/Desktop/Student task/img"
```

### 2. Config file

Edit **`config/ai-assistants.json`**:

- `defaultAssistantId` — first-time default (usually `krishna`)
- Each assistant: `id`, `name`, `subtitle`, `emoji`, `legacyFiles` (paths under `img/`)

Example for Hanuman:

```json
"legacyFiles": {
  "guide": "hanuman-guide.png",
  "happy": "hanuman-happy.png",
  "thinking": "hanuman-thinking.png",
  "concerned": "hanuman-concerned.png",
  "proud": "hanuman-happy.png",
  "exited": "hanuman-happy.png"
}
```

Reload the student page after edits (config is loaded via `GET /api/ai-assistants`).

### 3. Optional npm scripts

```bash
npm run sync-avatars    # copy from ../img into wizkids/img
```

## Files involved in the app

| File | Role |
|------|------|
| `config/ai-assistants.json` | Guide list + image paths |
| `js/gk-assistant.js` | Loads config, resolves URLs, saves selection |
| `js/app.js` | Sidebar picker, avatar pane, `GKApp.selectAssistant()` |
| `server/routes.js` | `GET /api/ai-assistants` |
| `student.html` | Loads scripts |

## Adding a fifth guide

1. Add PNGs to `wizkids/img/` (`newchar-guide.png`, …)
2. Add an entry to `assistants` in `ai-assistants.json`
3. Mirror the entry in `DEFAULTS` inside `gk-assistant.js` (offline fallback)
