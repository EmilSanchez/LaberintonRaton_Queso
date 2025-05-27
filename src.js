class Stack {
    constructor() {
        this.items = [];
    }
    push(element) {
        this.items.push(element);
    }
    pop() {
        if (this.isEmpty()) return null;
        return this.items.pop();
    }
    peek() {
        if (this.isEmpty()) return null;
        return this.items[this.items.length - 1];
    }
    isEmpty() {
        return this.items.length === 0;
    }
    size() {
        return this.items.length;
    }
    clear() {
        this.items = [];
    }
    toArray() {
        return [...this.items];
    }
}

class MazeGame {
    constructor() {
        this.maze = [];
        this.size = 15;
        this.start = null;
        this.end = null;
        this.current = null;
        this.validSteps = new Stack();
        this.invalidSteps = new Stack();
        this.visited = new Set();
        this.solving = false;
        this.solved = false;
        this.startTime = null;
        this.stats = {
            validSteps: 0,
            invalidSteps: 0,
            backtracks: 0,
        };
    }
    generateMaze() {
        this.size = parseInt(document.getElementById('sizeSelect').value);
        const density = parseFloat(document.getElementById('wallDensity').value);

        this.maze = Array(this.size).fill().map(() => Array(this.size).fill(1));

        for (let i = 1; i < this.size - 1; i++) {
            for (let j = 1; j < this.size - 1; j++) {
                if (Math.random() < density) {
                    this.maze[i][j] = 1;
                } else {
                    this.maze[i][j] = 0;
                }
            }
        }

        const entranceY = Math.floor(Math.random() * (this.size - 2)) + 1;
        this.start = { x: 0, y: entranceY };
        this.maze[0][entranceY] = 0;

        const exitY = Math.floor(Math.random() * (this.size - 2)) + 1;
        this.end = { x: this.size - 1, y: exitY };
        this.maze[this.size - 1][exitY] = 0;

        this.maze[1][entranceY] = 0;
        this.maze[this.size - 2][exitY] = 0;

        this.ensureComplexPath();

        this.resetGame();
        this.renderMaze();
        this.updateButtons();
        this.showMessage('Laberinto generado', 'info');
    }
    ensureComplexPath() {
        let pathPoints = [];
        pathPoints.push({ x: 1, y: this.start.y });

        const numWaypoints = Math.floor(this.size / 4) + 2;
        for (let i = 1; i < numWaypoints; i++) {
            const x = Math.floor((this.size - 2) * (i / numWaypoints)) + 1;
            const y = Math.floor(Math.random() * (this.size - 4)) + 2;
            pathPoints.push({ x, y });
        }
        pathPoints.push({ x: this.size - 2, y: this.end.y });

        for (let i = 0; i < pathPoints.length - 1; i++) {
            this.createWindingPath(pathPoints[i], pathPoints[i + 1]);
        }
        this.addSecondaryPaths();
    }
    createWindingPath(start, end) {
        let current = { x: start.x, y: start.y };
        while (current.x !== end.x || current.y !== end.y) {
            this.maze[current.x][current.y] = 0;
            const directions = [];
            if (current.x < end.x) directions.push({ x: 1, y: 0 });
            if (current.x > end.x) directions.push({ x: -1, y: 0 });
            if (current.y < end.y) directions.push({ x: 0, y: 1 });
            if (current.y > end.y) directions.push({ x: 0, y: -1 });
            if (Math.random() < 0.3) {
                if (current.x !== end.x) {
                    directions.push({ x: 0, y: Math.random() < 0.5 ? 1 : -1 });
                }
                if (current.y !== end.y) {
                    directions.push({ x: Math.random() < 0.5 ? 1 : -1, y: 0 });
                }
            }
            const move = directions[Math.floor(Math.random() * directions.length)];
            const next = { x: current.x + move.x, y: current.y + move.y };
            if (next.x >= 1 && next.x < this.size - 1 &&
                next.y >= 1 && next.y < this.size - 1) {
                current = next;
            } else {
                if (current.x < end.x) current.x++;
                else if (current.x > end.x) current.x--;
                else if (current.y < end.y) current.y++;
                else if (current.y > end.y) current.y--;
            }
        }
        this.maze[current.x][current.y] = 0;
    }
    addSecondaryPaths() {
        for (let attempts = 0; attempts < this.size * 2; attempts++) {
            const startX = Math.floor(Math.random() * (this.size - 4)) + 2;
            const startY = Math.floor(Math.random() * (this.size - 4)) + 2;
            if (this.maze[startX][startY] === 0) {
                const length = Math.floor(Math.random() * 4) + 2;
                let currentX = startX;
                let currentY = startY;
                for (let i = 0; i < length; i++) {
                    const directions = [
                        { x: -1, y: 0 }, { x: 1, y: 0 },
                        { x: 0, y: -1 }, { x: 0, y: 1 }
                    ];
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    const nextX = currentX + dir.x;
                    const nextY = currentY + dir.y;
                    if (nextX >= 1 && nextX < this.size - 1 &&
                        nextY >= 1 && nextY < this.size - 1) {
                        this.maze[nextX][nextY] = 0;
                        currentX = nextX;
                        currentY = nextY;
                    }
                }
            }
        }
    }
    resetGame() {
        this.validSteps.clear();
        this.invalidSteps.clear();
        this.visited.clear();
        this.current = null;
        this.solving = false;
        this.solved = false;
        this.startTime = null;
        this.stats = { validSteps: 0, invalidSteps: 0, backtracks: 0, timeElapsed: 0 };
        const timeEl = document.getElementById('timeElapsed');
        if (timeEl) timeEl.textContent = '0';
        this.updateStats();
        this.updateStackDisplays();
    }
    renderMaze() {
        const mazeElement = document.getElementById('maze');
        mazeElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        mazeElement.innerHTML = '';
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${i}-${j}`;
                if (this.start && i === this.start.x && j === this.start.y) {
                    cell.className += ' start';
                    cell.textContent = '🏠';
                } else if (this.end && i === this.end.x && j === this.end.y) {
                    cell.className += ' end';
                    cell.textContent = '🧀';
                } else if (this.maze[i][j] === 1) {
                    cell.className += ' wall';
                    cell.textContent = '🧱';
                } else {
                    cell.className += ' path';
                }
                mazeElement.appendChild(cell);
            }
        }
        this.createAnimatedMouse();
    }
    createAnimatedMouse() {
        const existingMouse = document.getElementById('animated-mouse');
        if (existingMouse) {
            existingMouse.remove();
        }
        const mouseElement = document.createElement('div');
        mouseElement.id = 'animated-mouse';
        mouseElement.textContent = '';
        mouseElement.style.position = 'absolute';
        mouseElement.style.fontSize = '20px';
        mouseElement.style.zIndex = '10';
        mouseElement.style.transition = 'all 0.3s ease';
        mouseElement.style.display = 'none';
        document.body.appendChild(mouseElement);
    }
    positionMouse(x, y) {
        const mouseElement = document.getElementById('animated-mouse');
        if (!mouseElement) return;
        const mazeElement = document.getElementById('maze');
        const mazeRect = mazeElement.getBoundingClientRect();
        const cellSize = mazeRect.width / this.size;
        mouseElement.style.left = (mazeRect.left + (y * cellSize) + cellSize/2 - 10) + 'px';
        mouseElement.style.top = (mazeRect.top + (x * cellSize) + cellSize/2 - 10) + 'px';
        mouseElement.style.display = 'block';
    }
    getAllDirections() {
        const directions = [
            { x: -1, y: 0, name: 'arriba' },
            { x: 1, y: 0, name: 'abajo' },
            { x: 0, y: -1, name: 'izquierda' },
            { x: 0, y: 1, name: 'derecha' }
        ];
        const target = { x: this.size - 2, y: this.end.y };
        const allMoves = [];
        for (let dir of directions) {
            const next = {
                x: this.current.x + dir.x,
                y: this.current.y + dir.y
            };
            if (next.x >= 1 && next.x < this.size - 1 &&
                next.y >= 1 && next.y < this.size - 1) {
                const distance = Math.abs(next.x - target.x) + Math.abs(next.y - target.y);
                const isValid = this.isValidMove(next);
                const isWall = this.maze[next.x][next.y] === 1;
                const isVisited = this.visited.has(`${next.x},${next.y}`);
                allMoves.push({
                    position: next,
                    distance: distance,
                    direction: dir,
                    isValid: isValid,
                    isWall: isWall,
                    isVisited: isVisited
                });
            }
        }
        return allMoves;
    }
    async solveMaze() {
        if (this.solving || !this.start || !this.end) return;
        this.solving = true;
        this.startTime = Date.now();
        this.current = { x: 1, y: this.start.y };
        this.validSteps.push(this.current);
        this.visited.add(`${this.current.x},${this.current.y}`);
        this.stats.validSteps++;
        this.positionMouse(this.current.x, this.current.y);
        this.updateButtons();
        this.showMessage('El ratón amarillo ha entrado al laberinto y esta en busca del queso', 'info');
        while (!this.isEmpty(this.validSteps) && this.solving) {
            await this.sleep(200);
            if (this.current.x === this.size - 2 && this.current.y === this.end.y) {
                this.solved = true;
                this.solving = false;
                await this.sleep(300);
                this.positionMouse(this.end.x, this.end.y);
                this.showMessage('El raton encontro el queso', 'success');
                this.updateButtons();
                return;
            }
            const allDirections = this.getAllDirections();
            const validMoves = allDirections.filter(move => move.isValid);
            const invalidMoves = allDirections.filter(move => !move.isValid && !move.isVisited);
            for (let invalidMove of invalidMoves) {
                if (invalidMove.isWall) {
                    this.invalidSteps.push({
                        x: invalidMove.position.x,
                        y: invalidMove.position.y,
                        reason: 'muro'
                    });
                    this.stats.invalidSteps++;
                } else if (this.visited.has(`${invalidMove.position.x},${invalidMove.position.y}`)) {
                    this.invalidSteps.push({
                        x: invalidMove.position.x,
                        y: invalidMove.position.y,
                        reason: 'ya visitado'
                    });
                    this.stats.invalidSteps++;
                }
            }
            if (validMoves.length > 0) {
                validMoves.sort((a, b) => a.distance - b.distance);
                const bestMove = validMoves[0].position;
                this.current = bestMove;
                this.validSteps.push(this.current);
                this.visited.add(`${this.current.x},${this.current.y}`);
                this.stats.validSteps++;
                this.positionMouse(this.current.x, this.current.y);
            } else {
                const currentInvalid = { ...this.current, reason: 'callejon sin salida' };
                this.invalidSteps.push(currentInvalid);
                this.stats.invalidSteps++;
                this.validSteps.pop();
                if (!this.isEmpty(this.validSteps)) {
                    this.current = this.validSteps.peek();
                    this.stats.backtracks++;
                    this.positionMouse(this.current.x, this.current.y);
                } else {
                    break;
                }
            }
            this.updateVisualization();
            this.updateStats();
            this.updateStackDisplays();
        }
        if (this.isEmpty(this.validSteps)) {
            this.showMessage('No se encontró camino al queso. Intenta generar un nuevo laberinto.', 'error');
        }
        this.solving = false;
        this.updateButtons();
    }
    isValidMove(pos) {
        return pos.x >= 1 && pos.x < this.size - 1 &&
                pos.y >= 1 && pos.y < this.size - 1 &&
                this.maze[pos.x][pos.y] === 0 &&
                !this.visited.has(`${pos.x},${pos.y}`);
    }
    updateVisualization() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.getElementById(`cell-${i}-${j}`);
                if (cell) {
                    cell.classList.remove('current', 'visited', 'invalid');
                }
            }
        }
        this.validSteps.toArray().forEach(pos => {
            if (pos.x !== this.start.x || pos.y !== this.start.y) {
                const cell = document.getElementById(`cell-${pos.x}-${pos.y}`);
                if (cell && !cell.classList.contains('end')) {
                    cell.classList.add('visited');
                }
            }
        });
        this.invalidSteps.toArray().forEach(pos => {
            const cell = document.getElementById(`cell-${pos.x}-${pos.y}`);
            if (cell && !cell.classList.contains('start') && !cell.classList.contains('end')) {
                cell.classList.add('invalid');
            }
        });
    }
    updateStats() {
        document.getElementById('validSteps').textContent = this.stats.validSteps;
        document.getElementById('invalidSteps').textContent = this.stats.invalidSteps;
        document.getElementById('backtracks').textContent = this.stats.backtracks;
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timeElapsed').textContent = elapsed;
        }
    }
    updateStackDisplays() {
        this.updateStackDisplay('validStack', this.validSteps, false);
        this.updateStackDisplay('invalidStack', this.invalidSteps, true);
    }
    updateStackDisplay(elementId, stack, isInvalid) {
        const element = document.getElementById(elementId);
        if (!element) return;
        const items = stack.toArray();
        if (items.length === 0) {
            element.innerHTML = '<div style="text-align: center; color: #666;">La pila está vacía</div>';
            return;
        }
        element.innerHTML = items.reverse().map((pos, index) => {
            const reason = pos.reason ? `${pos.reason}` : '';
            return `<div class="stack-item ${isInvalid ? 'invalid-step' : ''}">
                ${isInvalid ? '' : ''} (${pos.y}, ${pos.x}) ${reason}
            </div>`;
        }).join('');
    }
    updateButtons() {
        document.getElementById('solveBtn').disabled = !this.start || this.solving || this.solved;
        document.getElementById('resetBtn').disabled = !this.start;
    }
    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }
    isEmpty(stack) {
        return stack.isEmpty();
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    isWall(x, y) {
        return this.maze[x][y] === 1;
    }
}

var game = new MazeGame();

function generateMaze() {
    game.generateMaze();
}
function solveMaze() {
    game.solveMaze();
}
function showSolution() {
    game.showSolution();
}
function resetMaze() {
    game.resetGame();
    game.renderMaze();
    game.updateButtons();
    game.showMessage('¡Juego reiniciado!', 'info');
}

window.onload = function() {
    game.generateMaze();
};
