let canvas, ctx;
let playerInstance = null;
let keys = {};
let mouse = { x: 0, y: 0 };

let bullets = [];
let enemies = [];
let gems = [];
let bushes = [];

// Коефіцієнти складності
let diffSettings = {
    spawnRate: 1200, // Як швидко з'являються роботи (мс)
    enemySpeed: 1.6,
    enemyHpMultiplier: 1.0,
    enemyDamage: 5
};

function initGame(gameData) {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // НАЛАШТУВАННЯ СКЛАДНОСТІ ГРИ
    if (gameData.difficulty === "normal") {
        diffSettings.spawnRate = 1300;
        diffSettings.enemySpeed = 1.5;
        diffSettings.enemyHpMultiplier = 1.0;
        diffSettings.enemyDamage = 4;
    } else if (gameData.difficulty === "hard") {
        diffSettings.spawnRate = 900;       // Роботи лізуть швидше
        diffSettings.enemySpeed = 2.0;       // Вони бігають спритніші
        diffSettings.enemyHpMultiplier = 1.4; // Мають на 40% більше HP
        diffSettings.enemyDamage = 7;        // Кусають боляче
    } else if (gameData.difficulty === "insane") {
        diffSettings.spawnRate = 500;        // Справжнє пекло, спавн кожні 0.5 сек!
        diffSettings.enemySpeed = 2.5;       // Роботи летять як шалені
        diffSettings.enemyHpMultiplier = 2.0; // Х2 здоров'я у роботів
        diffSettings.enemyDamage = 12;       // Зносять кабіну за кілька ударів
    }

    playerInstance = new Player(canvas.width / 2, canvas.height / 2, gameData.character, gameData.nickname);

    document.getElementById("hp").innerText = playerInstance.hp;
    document.getElementById("gems").innerText = playerInstance.maxGems;

    bullets = []; enemies = []; gems = [];
    
    bushes = [
        { x: 200, y: 150, radius: 70 },
        { x: 800, y: 150, radius: 70 },
        { x: 200, y: 450, radius: 70 },
        { x: 800, y: 450, radius: 70 }
    ];

    window.addEventListener("keydown", (e) => {
        keys[e.key.toLowerCase()] = true;
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
    // Використовуємо динамічний час спавну залежно від складності
    window.enemySpawner = setInterval(spawnEnemy, diffSettings.spawnRate);

    requestAnimationFrame(gameLoop);
}

function spawnEnemy() {
    if (!playerInstance || playerInstance.hp <= 0) return;
    
    let x = Math.random() < 0.5 ? -20 : canvas.width + 20;
    let y = Math.random() * canvas.height;
    
    // Базове здоров'я робота залежно від нашого бравлера
    let baseHp = playerInstance.charType === 'el_primo' ? 1500 : 900;

    enemies.push({
        x: x, 
        y: y, 
        radius: 16, 
        speed: diffSettings.enemySpeed,
        hp: baseHp * diffSettings.enemyHpMultiplier,
        maxHp: baseHp * diffSettings.enemyHpMultiplier
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

    playerInstance.isInBush = false;
    bushes.forEach(bush => {
        const dist = Math.hypot(playerInstance.x - bush.x, playerInstance.y - bush.y);
        if (dist < bush.radius) playerInstance.isInBush = true;
    });

    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;
        b.currentRange += b.speed;
        if (b.currentRange >= b.maxRange || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];
        const distToPlayer = Math.hypot(playerInstance.x - enemy.x, playerInstance.y - enemy.y);
        
        if (!playerInstance.isInBush || distToPlayer < 120) {
            const angle = Math.atan2(playerInstance.y - enemy.y, playerInstance.x - enemy.x);
            enemy.x += Math.cos(angle) * enemy.speed;
            enemy.y += Math.sin(angle) * enemy.speed;
        } else {
            enemy.x += (Math.random() - 0.5) * enemy.speed;
            enemy.y += (Math.random() - 0.5) * enemy.speed;
        }

        // Нанесення шкоди гравцю з урахуванням обраної складності
        if (distToPlayer < playerInstance.radius + enemy.radius) {
            playerInstance.hp -= diffSettings.enemyDamage;
            document.getElementById("hp").innerText = Math.max(0, Math.floor(playerInstance.hp));
            if (playerInstance.hp <= 0) {
                alert(`Кінець гри! Твій результат на цій складності: ${playerInstance.maxGems} кристалів.`);
                clearInterval(window.enemySpawner);
                document.location.reload();
            }
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            const distToBullet = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            
            if (distToBullet < enemy.radius + b.radius) {
                enemy.hp -= b.damage;
                
                if (!playerInstance.superReady && !b.isSuper) {
                    playerInstance.superCharge += 4;
                }

                bullets.splice(j, 1);
                if (enemy.hp <= 0) {
                    // На високій складності шанс випадіння гемів трохи менший, щоб було важче!
                    let gemChance = diffSettings.enemyHpMultiplier > 1.3 ? 0.4 : 0.6;
                    if (Math.random() < gemChance) gems.push({ x: enemy.x, y: enemy.y, radius: 8 });
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }

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

    bushes.forEach(bush => {
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#1e824c";
        ctx.fill();
        ctx.closePath();
    });

    gems.forEach(gem => {
        ctx.beginPath(); ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#2ecc71"; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
    });

    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color; ctx.fill();
    });

    enemies.forEach(enemy => {
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#e74c3c"; ctx.fill();
        ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 3; ctx.stroke();

        let barW = 30;
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(enemy.x - barW/2, enemy.y - 24, barW, 4);
        ctx.fillStyle = "#ff7675"; ctx.fillRect(enemy.x - barW/2, enemy.y - 24, barW * (enemy.hp / enemy.maxHp), 4);
    });

    playerInstance.draw(ctx);
}
