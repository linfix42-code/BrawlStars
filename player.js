class Player {
    constructor(x, y, charType, nickname) {
        this.x = x;
        this.y = y;
        this.charType = charType;
        this.nickname = nickname;
        this.radius = 20;
        
        // Кадри анімації
        this.animFrame = 0;
        this.animTimer = 0;
        this.isMoving = false;
        this.angle = 0;

        // Індивідуальні налаштування бравлерів з оригінальної гри
        this.setupCharacter();
    }

    setupCharacter() {
        switch(this.charType) {
            case 'colt':
                this.maxHp = 2800;
                this.speed = 3.2;         // Висока швидкість
                this.attackRange = 350;    // Велика дальність
                this.attackDamage = 360;   // Шкода за одну кулю
                this.bulletSpeed = 12;     // Дуже швидкі кулі
                this.maxGems = 0;
                this.color = "#3498db";    // Колір для ефекту пострілу
                break;
                
            case 'shelly':
                this.maxHp = 3600;
                this.speed = 2.8;         // Середня швидкість
                this.attackRange = 220;    // Середня дальність (дробовик)
                this.attackDamage = 300;   // Шкода від однієї дробинки
                this.bulletSpeed = 9;
                this.maxGems = 0;
                this.color = "#9b59b6";
                break;
                
            case 'el_primo':
                this.maxHp = 6000;         // Багато здоров'я (Танк)
                this.speed = 3.5;         // Швидкий бег
                this.attackRange = 100;    // Мала дальність (ближній бій)
                this.attackDamage = 460;   // Потужний удар кулаком
                this.bulletSpeed = 15;     // Миттєвий удар
                this.maxGems = 0;
                this.color = "#e67e22";
                break;
        }
        this.hp = this.maxHp;
    }

    // Оновлення логіки анімації та руху
    update(keys, mouse, canvas) {
        this.isMoving = false;
        let dx = 0;
        let dy = 0;

        // Рух WASD + підтримка української розкладки
        if (keys['w'] || keys['ц']) { dy -= this.speed; this.isMoving = true; }
        if (keys['s'] || keys['ы'] || keys['і']) { dy += this.speed; this.isMoving = true; }
        if (keys['a'] || keys['ф']) { dx -= this.speed; this.isMoving = true; }
        if (keys['d'] || keys['в']) { dx += this.speed; this.isMoving = true; }

        // Нормалізація швидкості по діагоналі, щоб бравлер не бігав швидше навскіс
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        this.x += dx;
        this.y += dy;

        // Межі карти
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(canvas.height * 0.15, Math.min(canvas.height - this.radius, this.y));

        // Напрямок погляду бравлера (завжди на курсор миші)
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // Розрахунок кадрів анімації ходьби (всього 4 кадри)
        if (this.isMoving) {
            this.animTimer++;
            if (this.animTimer % 6 === 0) { // Швидкість зміни кадрів анімації
                this.animFrame = (this.animFrame + 1) % 4;
            }
        } else {
            this.animFrame = 0; // Стійка на місці
        }
    }

    // Малювання бравлера, його нікнейму та смужки здоров'я
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // --- ТУТ МАЛЮЄТЬСЯ САМ БРАВЛЕР ---
        // Поки вантажаться справжні png картинки, створюємо геометричну модель
        // з урахуванням кадрів ходьби (імітація анімації руху ніг)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ефект анімації ніг/руху (малюємо круги-ноги, які рухаються вперед-назад)
        if (this.isMoving) {
            let legOffset = Math.sin(this.animFrame * (Math.PI / 2)) * 10;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-5, -15 + legOffset, 6, 0, Math.PI * 2); // Ліва нога
            ctx.arc(-5, 15 - legOffset, 6, 0, Math.PI * 2);  // Права нога
            ctx.fill();
        }

        // Руки зі зброєю (у Кольта дві, у Шеллі одна велика)
        ctx.fillStyle = '#f1c40f';
        if (this.charType === 'colt') {
            ctx.fillRect(12, -14, 12, 6); // Два револьвери
            ctx.fillRect(12, 8, 12, 6);
        } else if (this.charType === 'shelly') {
            ctx.fillRect(10, -5, 18, 8);  // Дробовик
        } else {
            ctx.fillRect(14, -8, 8, 16);  // Рукавиці Ель Прімо
        }

        ctx.restore();

        // --- НІКНЕЙМ ТА СМУЖКА ЗДОРОВ'Я НАД ГРАВЦЕМ ---
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        ctx.fillText(this.nickname, this.x, this.y - 38);
        ctx.shadowBlur = 0;

        // Зелена смужка HP
        const barW = 50;
        const barH = 6;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x - barW/2, this.y - 30, barW, barH);

        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = "#2ecc71"; // Зелений
        ctx.fillRect(this.x - barW/2, this.y - 30, barW * hpPct, barH);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(this.x - barW/2, this.y - 30, barW, barH);
    }

    // Унікальна механіка стрільби для кожного бравлера
    shoot(mouseX, mouseY) {
        const bullets = [];
        const baseAngle = Math.atan2(mouseY - this.y, mouseX - this.x);

        if (this.charType === 'colt') {
            // Кольт випускає чергу з 3-х швидких куль по черзі (для простоти даємо 3 кулі віялом)
            for (let i = -1; i <= 1; i++) {
                let spreadAngle = baseAngle + (i * 0.05); 
                bullets.push(this.createBullet(spreadAngle));
            }
        } 
        else if (this.charType === 'shelly') {
            // Шеллі стріляє дробом (5 куль широким конусом)
            for (let i = -2; i <= 2; i++) {
                let spreadAngle = baseAngle + (i * 0.15); 
                bullets.push(this.createBullet(spreadAngle));
            }
        } 
        else if (this.charType === 'el_primo') {
            // Ель Прімо б'є серією коротких ударів (кулі з великим радіусом, але мізерною дальністю)
            bullets.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(baseAngle),
                dy: Math.sin(baseAngle),
                speed: this.bulletSpeed,
                damage: this.attackDamage,
                maxRange: this.attackRange,
                currentRange: 0,
                radius: 25, // Великий кулак
                color: "rgba(230, 126, 34, 0.6)"
            });
        }
        return bullets;
    }

    createBullet(angle) {
        return {
            x: this.x,
            y: this.y,
            dx: Math.cos(angle),
            dy: Math.sin(angle),
            speed: this.bulletSpeed,
            damage: this.attackDamage,
            maxRange: this.attackRange,
            currentRange: 0,
            radius: 5,
            color: "#f1c40f"
        };
    }
}
