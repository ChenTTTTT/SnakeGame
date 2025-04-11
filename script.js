const grid = document.getElementById("grid");
const gameOverPanel = document.getElementById("gameOverPanel");
const scoreElement = document.getElementById("score");
const headerLettersContainer = document.getElementById("headerLettersContainer");

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

const snakeHeaderImages = {
    CLOSED_MOUTH: "images/snake_close_mouth.png",
    OPENED_MOUTH: "images/snake_open_mouth.png",
};

// name popup
function closeNamePopup() {
    document.getElementById("namePopup").classList.add("hidden");
    startGame();
}

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
    if (e.touches.length > 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 0) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) playerInput(Direction.RIGHT);
        else if (dx < -30) playerInput(Direction.LEFT);
    } else {
        if (dy > 30) playerInput(Direction.DOWN);
        else if (dy < -30) playerInput(Direction.UP);
    }
}, { passive: false });


// game
let gameStarted = false;
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
let currentHeadRotation = 0;

let score = 0;

function startGame() {
    if (gameStarted) return;
    gameStarted = true;

    drawGame();
    headerAnimations();
    setGameVariables();
    spawnFood();
    gameLoopInterval = setInterval(gameLoop, 300);
}

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
        applyTransform(gridData[0][0].img, 1, currentHeadRotation);
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

    switch (directionBuffer) {
        case Direction.UP:
            currentHeadRotation = 180;
            break;
        case Direction.DOWN:
            currentHeadRotation = 0;
            break;
        case Direction.LEFT:
            currentHeadRotation = 90;
            break;
        case Direction.RIGHT:
            currentHeadRotation = -90;
            break;
    }
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

    currentHeadRotation = 0;

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
        applyTransform(slot.img, 0, currentHeadRotation);
        return;
    }

    slot.img.src = slotImages[newState];
    applyTransform(slot.img, 1, currentHeadRotation);
}

function getSlotState(y, x) {
    return gridData[y][x]?.state ?? SlotState.EMPTY;
}

function getSlotImg(y, x) {
    return gridData[y][x]?.img ?? null;
}

// animations
function animateScaleIn(imgElement) {
    imgElement.style.transform = `scale(1) rotate(${currentHeadRotation}deg)`;
    imgElement.style.transition = "transform 0.2s ease-in-out";
    // imgElement.classList.remove("scale-out");
    // void imgElement.offsetWidth;
    // imgElement.classList.add("scale-in");
}

function animateScaleOut(imgElement) {
    imgElement.style.transform = `scale(0) rotate(${currentHeadRotation}deg)`;
    imgElement.style.transition = "transform 0.2s ease-in-out";
    // imgElement.classList.remove("scale-in");
    // void imgElement.offsetWidth;
    // imgElement.classList.add("scale-out");
}

function applyTransform(imgElement, scale = 1, rotation = 0) {
  imgElement.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  imgElement.style.transition = "transform 0.2s forwards";
}

function headerAnimations(){
    const headSnakeHeader = document.getElementById("snake_head_header");
    const letters = [...document.querySelectorAll('[id^="snake_letter_header"]'),];
    const apples = [...document.querySelectorAll('[id^="snake_apple_header"]'),].reverse();
    headerLettersContainer.classList.add("header-animate");
    setTimeout(() => {
        headSnakeHeader.src = snakeHeaderImages.OPENED_MOUTH;
    }, 700);
    setTimeout(() => {
        apples.forEach((apple, i) => {
            setTimeout(() => {
                apple.classList.add("apple-animate");
                if (i < letters.length) {
                    letters[i].classList.add("letter-animate");
                }
            }, i * 200);
        });
    }, 900);
    setTimeout(() => {
        headSnakeHeader.src = snakeHeaderImages.CLOSED_MOUTH;
    }, (apples.length * 200) + 900);
}
