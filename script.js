const grid = document.getElementById("grid");
const gameOverPanel = document.getElementById("gameOverPanel");
const scoreElement = document.getElementById("score");

const Direction = {
    UP: 'UP',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT'
};

const SlotState = {
    EMPTY: "EMPTY",
    FOOD: "FOOD",
    HEAD: "HEAD",
    BODY: "BODY",
    TAIL: "TAIL",
};

const slotImages = {
    [SlotState.EMPTY]: null,
    [SlotState.FOOD]: "images/snake_apple.png",
    [SlotState.HEAD]: "images/snake_head.png",
    [SlotState.BODY]: "images/snake_body.png",
    [SlotState.TAIL]: "images/snake_tail.png",
};

// keys
document.addEventListener("keydown", (e) => {
    switch (e.key.toLowerCase()) {
        case "w":
            playerInput(Direction.UP);
            break;
        case "a":
            playerInput(Direction.LEFT);
            break;
        case "s":
            playerInput(Direction.DOWN);
            break;
        case "d":
            playerInput(Direction.RIGHT);
            break;
    }
});

// touch
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) playerInput(Direction.RIGHT);
        else if (dx < -30) playerInput(Direction.LEFT);
    } else {
        if (dy > 30) playerInput(Direction.DOWN);
        else if (dy < -30) playerInput(Direction.UP);
    }
});

// game
let isGameOver = false;
let gameLoopInterval;
let directionBuffer = null;

const rowGrid = 20;
const columnGrid = 20;

const gridData = [];

let snakePos = {
    row: 0,
    column: 0
}
let snake = [];

let currentDirection = Direction.DOWN;

let score = 0;

drawGame();
setGameVariables();
spawnFood();
gameLoopInterval = setInterval(gameLoop, 300);

function drawGame() {
    for (let y = 0; y < rowGrid; y++) {
        const row = [];
        for (let x = 0; x < columnGrid; x++) {
            const cell = document.createElement("div");
            cell.classList.add("gridSlot");

            const img = document.createElement("img");
            img.src = slotImages[SlotState.HEAD];
            img.classList.add("start-visible");

            cell.appendChild(img);
            grid.appendChild(cell);

            row.push({
                img: img,
                state: SlotState.EMPTY,
            });
        }
        gridData.push(row);
    }

    setTimeout(() => {
        gridData[0][0].state = SlotState.HEAD;
        animateScaleIn(gridData[0][0].img);
    }, 100);
}

function setGameVariables(){
    snake.push({ row: 0, column: 0 });
}

function gameLoop(){
    if (snake.length > 0 && currentDirection !== null && currentDirection !== undefined) {
        if (directionBuffer !== null) {
            currentDirection = directionBuffer;
            directionBuffer = null;
        }

        const currentSnakeHeadPos = snake[0];
        let nextSnakeHeadPos = {
            row: currentSnakeHeadPos.row,
            column: currentSnakeHeadPos.column,
        };
        switch (currentDirection) {
            case Direction.UP:
                nextSnakeHeadPos.row--;
                if (nextSnakeHeadPos.row < 0) nextSnakeHeadPos.row = rowGrid - 1;
                break;

            case Direction.DOWN:
                nextSnakeHeadPos.row++;
                if (nextSnakeHeadPos.row >= rowGrid) nextSnakeHeadPos.row = 0;
                break;

            case Direction.LEFT:
                nextSnakeHeadPos.column--;
                if (nextSnakeHeadPos.column < 0)
                nextSnakeHeadPos.column = columnGrid - 1;
                break;

            case Direction.RIGHT:
                nextSnakeHeadPos.column++;
                if (nextSnakeHeadPos.column >= columnGrid)
                nextSnakeHeadPos.column = 0;
                break;
        }
      
        if (
          currentSnakeHeadPos.row === nextSnakeHeadPos.row &&
          currentSnakeHeadPos.column === nextSnakeHeadPos.column
        )
          return;

        updateSnakeMovement(nextSnakeHeadPos);
    }
}

function playerInput(newDirection){
    if (isGameOver) return;
    if (isOppositeDirection(currentDirection, newDirection)) return;

    if (directionBuffer !== null) return;

    directionBuffer = newDirection;
}

function updateSnakeMovement(nextPos) {
    let currentPos = snake[0];

    switch (getSlotState(nextPos.row, nextPos.column)) {
        case SlotState.HEAD:
        case SlotState.BODY:
        case SlotState.TAIL:
            triggerGameOver();
            return;
        case SlotState.FOOD:
            const lastSnakePos = snake[snake.length - 1];
            snake.push({ row: lastSnakePos.row, column: lastSnakePos.column });
            updateScore(1);
            spawnFood();
            break;
    }

    setSlotState(currentPos.row, currentPos.column, SlotState.EMPTY);
    snake[0] = nextPos;
    setSlotState(nextPos.row, nextPos.column, SlotState.HEAD);

    if (snake.length > 1){
        for (i = 1; i < snake.length; i++){
            setSlotState(snake[i].row, snake[i].column, SlotState.EMPTY);

            const previousPos = snake[i];
            snake[i] = { ...currentPos };
            currentPos = previousPos;

            setSlotState(
                snake[i].row,
                snake[i].column,
                i === snake.length - 1 ? SlotState.TAIL : SlotState.BODY
            );
        }
    }
}

function isOppositeDirection(currentDirection, newDirection) {
    return (
        (currentDirection === Direction.UP && newDirection === Direction.DOWN) ||
        (currentDirection === Direction.DOWN && newDirection === Direction.UP) ||
        (currentDirection === Direction.LEFT && newDirection === Direction.RIGHT) ||
        (currentDirection === Direction.RIGHT && newDirection === Direction.LEFT)
    );
}

// food
function spawnFood() {
    let emptySlots = [];
    for (let y = 0; y < rowGrid; y++) {
        for (let x = 0; x < columnGrid; x++) {
            if (gridData[y][x].state === SlotState.EMPTY) {
                emptySlots.push({ row: y, column: x });
            }
        }
    }

    if (emptySlots.length === 0) return;

    const randomSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    setSlotState(randomSlot.row, randomSlot.column, SlotState.FOOD);
}

// score
function updateScore(amount) {
    score += amount;
    scoreElement.textContent = score;
}

// game over & restart game
function restartGame() {
    isGameOver = false;

    score = 0;
    updateScore(0);

    snake = [{ row: 0, column: 0 }];
    currentDirection = Direction.DOWN;

    for (let y = 0; y < rowGrid; y++) {
        for (let x = 0; x < columnGrid; x++) {
            setSlotState(y, x, SlotState.EMPTY);
        }
    }

    setSlotState(0, 0, SlotState.HEAD);
    spawnFood();

    gameOverPanel.classList.add("hidden");

    clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, 300);
}

function triggerGameOver() {
    isGameOver = true;
    clearInterval(gameLoopInterval);
    gameOverPanel.classList.remove("hidden");
}

// slot state
function setSlotState(y, x, newState) {
    const slot = gridData[y][x];
    if (!slot) return;

    slot.state = newState;

    if (newState === SlotState.EMPTY) {
        animateScaleOut(slot.img);
        return;
    }

    slot.img.src = slotImages[newState];
    animateScaleIn(slot.img);
}

function getSlotState(y, x) {
    return gridData[y][x]?.state ?? SlotState.EMPTY;
}

// animations
function animateScaleIn(imgElement) {
    imgElement.classList.remove("scale-out");
    void imgElement.offsetWidth;
    imgElement.classList.add("scale-in");
}

function animateScaleOut(imgElement) {
    imgElement.classList.remove("scale-in");
    void imgElement.offsetWidth;
    imgElement.classList.add("scale-out");
}

function animateSlot(y, x, type = "in") {
    const img = gridData[y][x].img;
    if (!img) return;

    if (type === "in") {
        animateScaleIn(img);
    } else {
        animateScaleOut(img);
    }
}
