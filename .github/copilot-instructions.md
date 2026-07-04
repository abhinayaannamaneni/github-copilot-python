# Copilot Instructions for Sudoku Game Project

## Project Overview
This is a Flask-based Sudoku game with a responsive web frontend. The game generates valid Sudoku puzzles with unique solutions, tracks solve times, provides hints, and maintains a leaderboard in localStorage. All features are tested with pytest.

## Architecture

### Backend Structure (Python/Flask)

**app.py** - Main Flask application
- Route `GET /` - Serves the HTML template
- Route `GET /new?difficulty={easy|medium|hard}` - Generates a new puzzle
  - Normalizes invalid difficulty values to 'medium' before generating
  - Returns JSON: `{'puzzle': [[9x9 board with clues]]}`
- Route `POST /hint` - Provides a hint for an empty cell
  - Request body: `{'board': [[current board state]]}`
  - Response (200): `{'row': int, 'col': int, 'value': int}`
  - Error responses (400): `{'error': 'message'}` when no empty cells, no game in progress, or invalid board
- Route `POST /check` - Checks if the solution is correct
  - Request body: `{'board': [[user's current board]]}`
  - Response: `{'incorrect': [[list of [row, col] pairs for wrong cells]]}`

**sudoku_logic.py** - Game logic and puzzle generation
- Contains all Sudoku board operations and validation
- Key functions:
  - `create_empty_board()` - Creates a 9x9 empty board
  - `is_safe(board, row, col, num)` - Validates a number placement against Sudoku rules
  - `fill_board(board)` - Fills a board with random valid numbers (backtracking)
  - `solve_board(board, limit=2)` - Counts solutions (stops at limit for optimization)
  - `has_unique_solution(board)` - Ensures puzzle has exactly one solution
  - `remove_cells(board, clues)` - Creates puzzle by removing cells from a complete solution
  - `generate_puzzle(clues=35)` - Main entry point returning (puzzle, solution) tuples
- Constants: `SIZE = 9`, `EMPTY = 0`
- Difficulty clues mapping (see app.py):
  - Easy: 45 clues (34 empty cells)
  - Medium: 35 clues (46 empty cells)
  - Hard: 28 clues (53 empty cells)

### Frontend Structure (HTML/CSS/JavaScript)

**templates/index.html** - Main HTML template
- Contains board container, difficulty selector, control buttons (New Game, Hint, Check Solution)
- Timer display and message area for user feedback
- Scoreboard section with difficulty filter
- Dark mode toggle button (top-right corner)
- All interactive elements have descriptive IDs for JavaScript binding

**static/styles.css** - Responsive styling
- Light mode (default): `background: #f4f4f4`, `color: #212121`
- Dark mode class: `.dark-mode` on `body`
  - Dark background: `#121212`, text: `#eee`
- Sudoku board styling:
  - 40x40px cells with borders
  - 3px borders between 3x3 blocks (visual Sudoku structure)
  - Alternating light/dark cell backgrounds for 3x3 block separation
- Cell state classes:
  - `.prefilled` - Starting clues (disabled, bold)
  - `.hint` - Cells filled by hint system (light green/dark green)
  - `.incorrect` - Cells that don't match solution (red/dark red)
  - `.conflict` - Live validation conflicts (yellow/orange)
- Responsive layout uses flexbox for all major containers

**static/main.js** - Client-side interactivity
- **Global state variables:**
  - `SIZE = 9` - Board dimensions
  - `puzzle = []` - Current puzzle data
  - `hintedCells = new Set()` - Tracks hinted cell indices
  - `hintsUsed = 0` - Counter for hints in current game (resets on newGame())
  - `elapsedSeconds = 0` - Timer state
  - `timerInterval` - Timer interval ID
  - `currentDifficulty = 'medium'` - Selected difficulty
  - `darkMode = localStorage.getItem('sudoku_dark_mode') === 'true'` - Persisted preference
  - `hintRequestInProgress = false` - Prevents rapid-fire hint requests
- **Game Management Functions:**
  - `newGame()` - Fetches `/new?difficulty=X`, resets hintsUsed, starts timer
  - `renderPuzzle(puz)` - Creates board DOM and populates with puzzle data
  - `createBoardElement()` - Builds 9x9 input grid with event listeners
- **Validation Functions:**
  - `hasConflict(row, col, value)` - Client-side live validation (no server call)
    - Checks row, column, and 3x3 box for duplicates
    - Used in input event listener to add/remove 'conflict' class immediately
- **Hint System:**
  - `getHint()` - Fetches `/hint` with current board state
    - Sets `hintRequestInProgress = true` to prevent concurrent requests
    - Disables hint button during request (`hintBtn.disabled = true`)
    - Only increments `hintsUsed++` if response is 2xx (`res.ok === true`)
    - Catches 400 errors (board full, no empty cells) without incrementing counter
    - Updates DOM with hinted cell (yellow background, disabled input, hint class)
    - Restores button state in finally block
- **Solution Checking:**
  - `checkSolution()` - Fetches `/check`, compares board to solution
    - Highlights incorrect cells with 'incorrect' class (red)
    - Shows congratulations message if solved
    - Prompts for player name on success
- **Scoreboard & Leaderboard:**
  - `getScores()` - Retrieves scores array from localStorage
  - `saveScore(playerName, time, difficulty, hintsUsed)` - Saves to localStorage
    - Sorts by time (ascending = fastest first)
    - Keeps only top 10 scores (`scores.slice(0, 10)`)
    - Each score includes: `{playerName, time, difficulty, hintsUsed, timestamp}`
  - `displayScoreboard(filterDifficulty = '')` - Renders scoreboard
    - Filters by difficulty if selected
    - Displays hints as singular ("1 hint") or plural ("2 hints")
    - Format: `"PlayerName - MM:SS (difficulty, X hints)"`
- **UI State Management:**
  - `startTimer()` - Begins 1-second interval, increments `elapsedSeconds`
  - `stopTimer()` - Clears interval
  - `updateTimerDisplay()` - Updates timer DOM element with formatted time
  - `formatTime(seconds)` - Returns `MM:SS` format
  - `toggleDarkMode()` - Toggles body class, persists to localStorage
  - `promptForPlayerName()` - Modal prompt for leaderboard entry
- **Event Binding (in window load):**
  - Difficulty selector change → triggers with newGame()
  - New Game button → `newGame()`
  - Hint button → `getHint()`
  - Check Solution button → `checkSolution()`
  - Score filter select → `displayScoreboard(selected_difficulty)`
  - Cell input → live conflict detection via `hasConflict()`
- **Data Flow Pattern:**
  - User action → Async fetch to server → Receive JSON → Update DOM + state
  - Exception: Live validation (hasConflict) is synchronous, client-only

## Testing Strategy

**pytest Framework** - All tests in `tests/` folder

**Test Execution:**
```bash
cd /workspaces/github-copilot-python
pytest                          # Run all tests
pytest tests/test_initial.py -v # Run specific test file with verbose output
```

**Current Test Coverage (`tests/test_initial.py`):**
- `test_is_safe_detects_invalid_placements()` - Validates Sudoku rule checking
- `test_fill_board_produces_valid_complete_board()` - Ensures filled boards are valid
- `test_generate_puzzle_returns_requested_clues()` - Confirms puzzle generation accuracy

**Testing Conventions:**
- Helper functions in test file: `count_clues(board)`, `is_valid_board(board)`
- Valid board validation checks: all rows, columns, and 3x3 boxes contain 1-9
- Use pytest fixtures in `conftest.py` if adding shared setup logic
- When adding features (new difficulty, new validation rules), add corresponding tests

## Accessibility & User Experience

### Responsive Design
- CSS Flexbox layout adapts to all screen sizes
- Touch-friendly: 40x40px buttons, adequate spacing
- No horizontal scrolling at mobile resolutions

### Dark Mode
- Toggle button in top-right corner (`dark-mode-toggle`)
- Preference persisted to localStorage (`sudoku_dark_mode`)
- Applied via `.dark-mode` class on body element
- All color schemes must have sufficient contrast for WCAG AA compliance
- Cells, buttons, and text adapt to dark mode

### Color & Visual Feedback
- Invalid entries: Yellow with gold border (`.conflict` class)
- Incorrect solution: Red background (`.incorrect` class)
- Hints: Light green in light mode, dark green in dark mode (`.hint` class)
- Status messages use color: blue (info), green (success), red (error)
- No reliance on color alone for information (always include text)

### User Messaging
- Timer displays in real-time (MM:SS format)
- Message area provides feedback: "Hint provided!", "Some cells are incorrect", "No empty cells to hint", etc.
- Congratulations message on puzzle completion includes time and hints used
- Error messages explain what went wrong (e.g., "No game in progress", "Invalid board")

### Input Validation
- Cell input: Only accepts digits 1-9 (stripped client-side)
- Live conflict detection: Cells highlight immediately as user types
- No invalid state persists across actions

## Required Game Features

### Difficulty Selector
- Three levels: Easy (45 clues), Medium (35 clues), Hard (28 clues)
- Selector in `<select id="difficulty">` with options: easy, medium, hard
- Selected difficulty used for `/new?difficulty=X` request
- Server normalizes invalid values to 'medium'

### Hint System
- "Hint" button (`<button id="hint">`) fetches from `/hint` endpoint
- Returns random empty cell with solution value
- Counter tracked in `hintsUsed` variable
- Counter increments only on successful (200) responses with valid cell
- Button disabled while request in progress
- Error messages shown when board is full or no game active
- Hinted cells styled with `.hint` class and disabled input

### Timer
- Starts when `newGame()` is called
- Displays elapsed time in MM:SS format in `<div id="timer">`
- Stops when user completes puzzle or starts new game
- Passed to leaderboard when saving score

### Check Solution Button
- Button with id `check-solution`
- Sends current board to `/check` endpoint
- Highlights incorrect cells with `.incorrect` class (red)
- Shows success message with time and hints if all cells correct
- Prompts for player name on success
- Allows user to fix errors without penalty

### Dark Mode Toggle
- Button with id `dark-mode-toggle` in top-right corner
- Toggles `.dark-mode` class on body
- Persists preference to localStorage key `sudoku_dark_mode`
- Button text changes: "🌙 Dark Mode" ↔ "☀️ Light Mode"
- All CSS rules have dark mode equivalents (`.dark-mode .class-name`)

### Top 10 Scoreboard
- Stored in localStorage key `sudoku_scores` as JSON array
- Sorted by solve time (fastest first)
- Maximum 10 entries retained (older/slower entries removed)
- Displayed on page load and after each completed game
- Each entry shows: `PlayerName - MM:SS (difficulty, X hints)`
- Filter by difficulty via `<select id="score-filter">`
- Entries include: playerName, time (seconds), difficulty, hintsUsed, timestamp

### Live Conflict Detection
- Checked as user types in cells
- No server request (purely client-side)
- Compares entered value against other cells in same row, column, and 3x3 box
- Adds `.conflict` class (yellow highlight) if duplicate found
- Removes class if cell is valid or empty
- Does not block user input; purely visual feedback
- Independent from final solution check

## Code Style & Conventions

### JavaScript (main.js)
- Use `const` for module-level constants, `let` for mutable state
- Async functions for server calls (use `await` with fetch)
- Error handling: Check `res.ok` for HTTP status, check response JSON for error fields
- Event listeners attached in window `load` event handler
- Use `dataset` attributes on DOM elements for data binding (e.g., `input.dataset.row`)
- Helper functions for DOM manipulation and state updates
- Comments for complex logic (e.g., 3x3 box calculation, conflict detection)

### Python (app.py, sudoku_logic.py)
- Use flask decorators (`@app.route`) for HTTP endpoints
- Return `jsonify()` for API responses
- Include HTTP status codes (200, 400) in responses
- Error responses include descriptive error messages
- Normalize inputs (e.g., difficulty values)
- Use global `CURRENT` dict to maintain game state (puzzle, solution, difficulty)

### CSS (styles.css)
- Use CSS variables or consistent color palette
- Class-based styling (avoid inline styles in templates)
- Include dark mode equivalents for all colored elements
- Use semantic CSS selectors (`:nth-child()`, `:focus`, etc.)
- Flexbox for layout (no floats)
- Transitions for smooth visual feedback

## Adding New Features

When extending this game, follow these conventions:

1. **New Sudoku Logic** → Add functions to `sudoku_logic.py`
   - Add corresponding tests to `tests/test_initial.py`
   - Ensure all boards are validated with `is_valid_board()` in tests

2. **New API Endpoints** → Add routes to `app.py`
   - Return JSON with status codes (200 for success, 400 for errors)
   - Store game state in `CURRENT` dict
   - Normalize/validate all inputs

3. **New UI Features** → Update `templates/index.html`, add styles to `static/styles.css`
   - Include dark mode styles for every new element
   - Use descriptive element IDs for JavaScript binding
   - Ensure responsive layout with flexbox

4. **New Client Logic** → Add functions to `static/main.js`
   - Update global state variables at module top
   - Keep async/fetch logic in dedicated functions
   - Use consistent error handling pattern (`res.ok` check)
   - Attach event listeners in window `load` handler

5. **Testing** → Add tests to `tests/` folder
   - Run `pytest` before committing
   - All tests must pass
   - Test both happy path and error conditions
