let canvas, ctx;
let playerInstance = null;
let keys = {};
let mouse = { x: 0, y: 0 };

let bullets = [];
let enemies = [];
let gems = [];
let bushes = []; // Масив кущів

function initGame(gameData) {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    playerInstance = new Player(canvas.width / 2, canvas.height / 2, gameData.character, gameData.nickname);

    document.getElementById("hp").innerText = playerInstance.hp;
    document.getElementById("gems").innerText = playerInstance.maxGems;

    bullets = []; enemies = []; gems = [];
    
    // Генеруємо 4 великі зони кущів на карті
    bushes = [
        { x: 200, y: 150, radius: 70 },
        { x: 800, y: 150, radius: 70 },
        { x: 200, y: 450, radius: 70 },
        { x: 800, y: 450, radius: 70 }
    ];

    window.addEventListener("keydown", (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // АКТИВАЦІЯ УЛЬТИ (Пробіл або клавіша 'e' / 'у')
        if ((e.key === " " || e.key.toLowerCase() === "e" || e.key.toLowerCase() === "у") && playerInstance.superReady) {
            const superBullets = playerInstance.shoot(mouse.x, mouse.y, true);
            bullets = bullets.concat(superBullets);
        }
    });
    window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", () => {
        if (!playerInstance || playerInstance.hp <= 0) return;
        const newBullets = playerInstance.shoot(mouse.x, mouse.y, false);
        bullets = bullets.concat(newBullets);
    });

    if(window.enemySpawner) clearInterval(window.enemySpawner);
    window.enemySpawner = setInterval(spawnEnemy, 1200);

    requestAnimationFrame(gameLoop);
}

function spawnEnemy() {
    if (!playerInstance || playerInstance.hp <= 0) return;
    let x = Math.random() < 0.5 ? -20 : canvas.width + 20;
    let y = Math.random() * canvas.height;
    enemies.push({
        x: x, y: y, radius: 16, speed: 1.6,
        hp: playerInstance.charType === 'el_primo' ? 1500 : 900,
        maxHp: playerInstance.charType === 'el_primo' ? 1500 : 900
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

    // Перевірка: чи зайшов гравець у кущі?
    playerInstance.isInBush = false;
    bushes.forEach(bush => {
        const dist = Math.hypot(playerInstance.x - bush.x, playerInstance.y - bush.y);
        if (dist < bush.radius) {
            playerInstance.isInBush = true;
        }
    });

    // Кулі
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.currentRange += b.speed;
        if (b.currentRange >= b.maxRange || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // Вороги
    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        
        // Логіка кущів: Якщо гравець у кущах, роботи біжать до них лише якщо підійшли ближче ніж на 120 пікселів.
        // Інакше вони просто ходять навмання або стоять.
        const distToPlayer = Math.hypot(playerInstance.x - enemy.x, playerInstance.y - enemy.y);
        
        if (!playerInstance.isInBush || distToPlayer < 120) {
            const angle = Math.atan2(playerInstance.y - enemy.y, playerInstance.x - enemy.x);
            enemy.x += Math.cos(angle) * enemy.speed;
            enemy.y += Math.sin(angle) * enemy.speed;
        } else {
            // Роботи втратили ціль, повільно блукають
            enemy.x += (Math.random() - 0.5) * enemy.speed;
            enemy.y += (Math.random() - 0.5) * enemy.speed;
        }

        // Шкода гравцю
        if (distToPlayer < playerInstance.radius + enemy.radius) {
            playerInstance.hp -= 5;
            document.getElementById("hp").innerText = Math.max(0, Math.floor(playerInstance.hp));
            if (playerInstance.hp <= 0) {
                alert(`Кінець гри! Кристалів знято: ${playerInstance.maxGems}`);
                clearInterval(window.enemySpawner);
                document.location.reload();
            }
        }

        // Влучання куль
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            const distToBullet = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            
            if (distToBullet < enemy.radius + b.radius) {
                enemy.hp -= b.damage;
                
                // Накопичуємо ульту за кожне влучання (якщо вона ще не заряджена)
                if (!playerInstance.superReady && !b.isSuper) {
                    playerInstance.superCharge += 4; // 25 влучань для повної ульти
                }

                bullets.splice(j, 1);
                if (enemy.hp <= 0) {
                    if (Math.random() < 0.5) gems.push({ x: enemy.x, y: enemy.y, radius: 8 });
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Кристали
    for (let i = gems.length - 1; i >= 0; i--) {
        let gem = gems[i];
        if (Math.hypot(playerInstance.x - gem.x, playerInstance.y - gem.y) < playerInstance.radius + gem.radius) {
            gems.splice(i, 1);
            playerInstance.maxGems++;
            document.getElementById("gems").innerText = playerInstance.maxGems;
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Малюємо КУЩІ (спочатку, щоб вони були під персонажами)
    bushes.forEach(bush => {
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#1e824c"; // Темно-зелений колір куща
        ctx.fill();
        ctx.closePath();
    });

    // Кристали
    gems.forEach(gem => {
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#2ecc71"; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    });

    // Кулі
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color; ctx.fill();
    });

    // Роботи
    enemies.forEach(enemy => {
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#e74c3c"; ctx.fill();
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 3; ctx.stroke();

        let barW = 30;
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(enemy.x - barW/2, enemy.y - 24, barW, 4);
        ctx.fillStyle = "#ff7675"; ctx.fillRect(enemy.x - barW/2, enemy.y - 24, barW * (enemy.hp / enemy.maxHp), 4);
    });

    // Гравець
    playerInstance.draw(ctx);
}
