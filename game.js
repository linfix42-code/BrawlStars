let canvas, ctx;
let playerInstance = null;
let keys = {};
let mouse = { x: 0, y: 0 };

let bullets = [];
let enemies = [];
let gems = [];

// Цю функцію автоматично викликає menu.js, коли ти тиснеш кнопку "У БІЙ!"
function initGame(gameData) {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // Створюємо екземпляр нашого бравлера з потрібними налаштуваннями
    playerInstance = new Player(
        canvas.width / 2, 
        canvas.height / 2, 
        gameData.character, 
        gameData.nickname
    );

    // Оновлюємо UI на ігровому екрані
    document.getElementById("hp").innerText = playerInstance.hp;
    document.getElementById("gems").innerText = playerInstance.maxGems;

    // Скидаємо старі масиви, якщо це повторна гра
    bullets = [];
    enemies = [];
    gems = [];

    // Слухачі подій для керування
    window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    // Стрільба по кліку миші
    canvas.addEventListener("mousedown", () => {
        if (!playerInstance || playerInstance.hp <= 0) return;
        
        // Викликаємо метод стрільби самого бравлера (він поверне чергу або дріб)
        const newBullets = playerInstance.shoot(mouse.x, mouse.y);
        bullets = bullets.concat(newBullets);
    });

    // Запускаємо спавн ворогів (роботів)
    if(window.enemySpawner) clearInterval(window.enemySpawner);
    window.enemySpawner = setInterval(spawnEnemy, 1200);

    // Запускаємо головний цикл гри
    requestAnimationFrame(gameLoop);
}

function spawnEnemy() {
    if (!playerInstance || playerInstance.hp <= 0) return;

    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -20 : canvas.width + 20;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -20 : canvas.height + 20;
    }

    enemies.push({
        x: x,
        y: y,
        radius: 16,
        speed: 1.8,
        hp: playerInstance.charType === 'el_primo' ? 1200 : 800, // Роботи сильніші проти Ель Прімо
        maxHp: playerInstance.charType === 'el_primo' ? 1200 : 800
    });
}

function gameLoop() {
    if (!playerInstance) return;

    updateGame();
    drawGame();

    requestAnimationFrame(gameLoop);
}

function updateGame() {
    playerInstance.update(keys, mouse, canvas);

    // Рух та перевірка дальності куль
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.currentRange += b.speed;

        // Видаляємо кулю, якщо вона пролетіла свою максимальну дальність (Range)
        if (b.currentRange >= b.maxRange || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // Рух ворогів та колізії
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        
        const angle = Math.atan2(playerInstance.y - enemy.y, playerInstance.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Ворог б'є бравлера
        const distToPlayer = Math.hypot(playerInstance.x - enemy.x, playerInstance.y - enemy.y);
        if (distToPlayer < playerInstance.radius + enemy.radius) {
            playerInstance.hp -= 4; // Шкода від робота
            document.getElementById("hp").innerText = Math.max(0, Math.floor(playerInstance.hp));

            if (playerInstance.hp <= 0) {
                alert(`Твій бравлер загинув! Зібрано кристалів: ${playerInstance.maxGems}`);
                clearInterval(window.enemySpawner);
                document.location.reload(); // Перезавантаження у лобі
            }
        }

        // Влучання куль у ворога
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            const distToBullet = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            
            if (distToBullet < enemy.radius + b.radius) {
                enemy.hp -= b.damage;
                bullets.splice(j, 1); // Видаляємо кулю

                if (enemy.hp <= 0) {
                    // З робота випадає кристал з шансом 60%
                    if (Math.random() < 0.6) {
                        gems.push({ x: enemy.x, y: enemy.y, radius: 8 });
                    }
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Підбирання кристалів
    for (let i = gems.length - 1; i >= 0; i--) {
        let gem = gems[i];
        const dist = Math.hypot(playerInstance.x - gem.x, playerInstance.y - gem.y);
        if (dist < playerInstance.radius + gem.radius) {
            gems.splice(i, 1);
            playerInstance.maxGems++;
            document.getElementById("gems").innerText = playerInstance.maxGems;
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Малюємо кристали
    gems.forEach(gem => {
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#2ecc71";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Малюємо кулі/удари бравлера
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
    });

    // Малюємо роботів
    enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#e74c3c";
        ctx.fill();
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Смужка HP для роботів
        let barW = 30;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(enemy.x - barW/2, enemy.y - 24, barW, 4);
        ctx.fillStyle = "#ff7675";
        ctx.fillRect(enemy.x - barW/2, enemy.y - 24, barW * (enemy.hp / enemy.maxHp), 4);
    });

    // Малюємо самого бравлера (клас Player)
    playerInstance.draw(ctx);
}
