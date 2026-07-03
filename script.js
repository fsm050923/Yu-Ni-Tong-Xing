// Minesweeper Game
document.addEventListener('DOMContentLoaded', function() {
    // Game configuration
    const config = {
        easy: { rows: 9, cols: 9, mines: 10 },
        medium: { rows: 16, cols: 16, mines: 40 },
        hard: { rows: 16, cols: 30, mines: 99 }
    };

    // Game state
    let gameState = {
        rows: 16,
        cols: 16,
        mines: 40,
        board: [],
        minesSet: new Set(),
        revealedCount: 0,
        flaggedCount: 0,
        gameOver: false,
        gameWon: false,
        firstClick: true,
        startTime: null,
        timerInterval: null,
        elapsedSeconds: 0
    };

    // DOM elements
    const boardElement = document.getElementById('board');
    const minesCountElement = document.getElementById('mines-count');
    const flagsCountElement = document.getElementById('flags-count');
    const timerElement = document.getElementById('timer');
    const resetButton = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty');
    const gameStatusElement = document.getElementById('game-status');
    const statusMessageElement = document.querySelector('.status-message');

    // Initialize the game
    function initGame() {
        // Reset game state
        const difficulty = difficultySelect.value;
        const { rows, cols, mines } = config[difficulty];

        gameState.rows = rows;
        gameState.cols = cols;
        gameState.mines = mines;
        gameState.board = [];
        gameState.minesSet = new Set();
        gameState.revealedCount = 0;
        gameState.flaggedCount = 0;
        gameState.gameOver = false;
        gameState.gameWon = false;
        gameState.firstClick = true;
        gameState.elapsedSeconds = 0;

        // Clear timer
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }

        // Update UI
        updateUI();
        updateStatus('Click any cell to start!', 'playing');

        // Create empty board
        createEmptyBoard();
        renderBoard();

        // Reset timer display
        timerElement.textContent = '0';
    }

    // Create an empty board
    function createEmptyBoard() {
        gameState.board = [];
        for (let r = 0; r < gameState.rows; r++) {
            gameState.board[r] = [];
            for (let c = 0; c < gameState.cols; c++) {
                gameState.board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    row: r,
                    col: c
                };
            }
        }
    }

    // Place mines randomly (avoid first click position)
    function placeMines(firstRow, firstCol) {
        gameState.minesSet.clear();
        let minesPlaced = 0;

        while (minesPlaced < gameState.mines) {
            const r = Math.floor(Math.random() * gameState.rows);
            const c = Math.floor(Math.random() * gameState.cols);

            // Don't place mine on first click cell or its immediate neighbors
            const isFirstClickCell = (r === firstRow && c === firstCol);
            const isNeighbor = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;

            if (!isFirstClickCell && !isNeighbor && !gameState.board[r][c].isMine) {
                gameState.board[r][c].isMine = true;
                gameState.minesSet.add(`${r},${c}`);
                minesPlaced++;
            }
        }

        // Calculate neighbor mine counts for all cells
        calculateNeighborMines();
    }

    // Calculate number of neighboring mines for each cell
    function calculateNeighborMines() {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (gameState.board[r][c].isMine) continue;

                let count = 0;
                for (const [dr, dc] of directions) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        if (gameState.board[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                gameState.board[r][c].neighborMines = count;
            }
        }
    }

    // Render the game board
    function renderBoard() {
        // Clear the board
        boardElement.innerHTML = '';

        // Set grid template
        boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;

        // Create cells
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                const cell = gameState.board[r][c];
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.row = r;
                cellElement.dataset.col = c;

                // Add cell content based on state
                if (cell.isRevealed) {
                    cellElement.classList.add('revealed');
                    if (cell.isMine) {
                        cellElement.classList.add('mine');
                        cellElement.textContent = '💣';
                    } else if (cell.neighborMines > 0) {
                        cellElement.textContent = cell.neighborMines;
                        cellElement.classList.add(`num-${cell.neighborMines}`);
                    }
                } else if (cell.isFlagged) {
                    cellElement.classList.add('flagged');
                }

                // Add event listeners
                cellElement.addEventListener('click', () => handleCellClick(r, c));
                cellElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleRightClick(r, c);
                });

                boardElement.appendChild(cellElement);
            }
        }
    }

    // Handle left-click on a cell
    function handleCellClick(row, col) {
        if (gameState.gameOver || gameState.gameWon) return;

        const cell = gameState.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;

        // First click: place mines and start timer
        if (gameState.firstClick) {
            gameState.firstClick = false;
            placeMines(row, col);
            startTimer();
            updateStatus('Game in progress!', 'playing');
        }

        // Reveal the cell
        revealCell(row, col);

        // Check for game over
        if (cell.isMine) {
            gameOver(false);
            return;
        }

        // Check for win
        checkWin();
    }

    // Handle right-click on a cell (flag/unflag)
    function handleRightClick(row, col) {
        if (gameState.gameOver || gameState.gameWon) return;

        const cell = gameState.board[row][col];
        if (cell.isRevealed) return;

        // Toggle flag
        if (cell.isFlagged) {
            cell.isFlagged = false;
            gameState.flaggedCount--;
        } else {
            // Don't allow more flags than mines
            if (gameState.flaggedCount >= gameState.mines) return;
            cell.isFlagged = true;
            gameState.flaggedCount++;
        }

        // Update UI
        updateUI();
        renderBoard();

        // Check for win (if all mines are flagged)
        checkWin();
    }

    // Reveal a cell (and recursively reveal neighbors if empty)
    function revealCell(row, col) {
        const cell = gameState.board[row][col];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        gameState.revealedCount++;

        // If it's an empty cell (no neighboring mines), reveal neighbors
        if (!cell.isMine && cell.neighborMines === 0) {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];

            for (const [dr, dc] of directions) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    revealCell(nr, nc);
                }
            }
        }

        // Update the board display
        renderBoard();
    }

    // Start the game timer
    function startTimer() {
        gameState.startTime = Date.now();
        gameState.timerInterval = setInterval(() => {
            gameState.elapsedSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
            timerElement.textContent = gameState.elapsedSeconds;
        }, 1000);
    }

    // Game over handler
    function gameOver(isWin) {
        gameState.gameOver = true;

        if (isWin) {
            gameState.gameWon = true;
            updateStatus('Congratulations! You won!', 'win');

            // Flag all remaining mines
            for (const mineCoord of gameState.minesSet) {
                const [r, c] = mineCoord.split(',').map(Number);
                if (!gameState.board[r][c].isFlagged) {
                    gameState.board[r][c].isFlagged = true;
                }
            }
        } else {
            updateStatus('Game Over! You hit a mine.', 'lose');

            // Reveal all mines
            for (const mineCoord of gameState.minesSet) {
                const [r, c] = mineCoord.split(',').map(Number);
                gameState.board[r][c].isRevealed = true;
            }
        }

        // Stop the timer
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
        }

        // Update the board
        renderBoard();
    }

    // Check if the player has won
    function checkWin() {
        // Win condition 1: All non-mine cells are revealed
        const totalNonMineCells = gameState.rows * gameState.cols - gameState.mines;
        if (gameState.revealedCount === totalNonMineCells) {
            gameOver(true);
            return;
        }

        // Win condition 2: All mines are correctly flagged
        let allMinesFlagged = true;
        for (const mineCoord of gameState.minesSet) {
            const [r, c] = mineCoord.split(',').map(Number);
            if (!gameState.board[r][c].isFlagged) {
                allMinesFlagged = false;
                break;
            }
        }

        if (allMinesFlagged && gameState.flaggedCount === gameState.mines) {
            gameOver(true);
        }
    }

    // Update UI elements
    function updateUI() {
        minesCountElement.textContent = gameState.mines;
        flagsCountElement.textContent = gameState.flaggedCount;
    }

    // Update game status message
    function updateStatus(message, status) {
        statusMessageElement.textContent = message;

        // Update status class
        gameStatusElement.classList.remove('status-playing', 'status-win', 'status-lose');
        if (status === 'playing') {
            gameStatusElement.classList.add('status-playing');
        } else if (status === 'win') {
            gameStatusElement.classList.add('status-win');
        } else if (status === 'lose') {
            gameStatusElement.classList.add('status-lose');
        }
    }

    // Event listeners
    resetButton.addEventListener('click', initGame);

    difficultySelect.addEventListener('change', function() {
        initGame();
    });

    // Initialize the game on page load
    initGame();

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' || e.key === 'R') {
            initGame();
        } else if (e.key === '1' && e.ctrlKey) {
            difficultySelect.value = 'easy';
            initGame();
        } else if (e.key === '2' && e.ctrlKey) {
            difficultySelect.value = 'medium';
            initGame();
        } else if (e.key === '3' && e.ctrlKey) {
            difficultySelect.value = 'hard';
            initGame();
        }
    });

    // Add touch support for mobile (long press for right-click)
    let touchTimer;
    boardElement.addEventListener('touchstart', function(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        touchTimer = setTimeout(() => {
            e.preventDefault();
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            handleRightClick(row, col);
        }, 500);
    }, { passive: false });

    boardElement.addEventListener('touchend', function(e) {
        clearTimeout(touchTimer);
    });

    boardElement.addEventListener('touchmove', function(e) {
        clearTimeout(touchTimer);
    });
});