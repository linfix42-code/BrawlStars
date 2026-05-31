class Player {
    constructor(x, y, charType, nickname) {
        this.x = x;
        this.y = y;
        this.charType = charType;
        this.nickname = nickname;
        this.radius = 20;
        
        this.animFrame = 0;
        this.animTimer = 0;
        this.isMoving = false;
        this.angle = 0;
        this.isInBush = false; // Чи знаходиться гравець у кущах

        // Механіка перезарядки (3 слоти)
        this.ammo = 3;
        this.ammoRechargeRate = 0.02; // Швидкість відновлення одного слоту

        // Механіка Ульти
        this.superCharge = 0;    // Від 0 до 100
        this.superReady = false;

        this.setupCharacter();
    }

    setupCharacter() {
        switch(this.charType) {
            case 'colt':
                this.maxHp = 2800;
                this.speed = 3.2;
                this.attackRange = 350;
                this.attackDamage = 360;
                this.bulletSpeed = 12;
                this.color = "#3498db";
                break;
                
            case 'shelly':
                this.maxHp = 3600;
                this.speed = 2.8;
                this.attackRange = 220;
                this.attackDamage = 300;
                this.bulletSpeed = 9;
                this.color = "#9b59b6";
                break;
                
            case 'el_primo':
                this.maxHp = 6000;
                this.speed = 3.5;
                this.attackRange = 100;
                this.attackDamage = 460;
                this.bulletSpeed = 15;
                this.color = "#e67e22";
                break;
        }
        this.hp = this.maxHp;
    }

    update(keys, mouse, canvas) {
        this.isMoving = false;
        let dx = 0, dy = 0;

        if (keys['w'] || keys['ц']) { dy -= this.speed; this.isMoving = true; }
        if (keys['s'] || keys['ы'] || keys['і']) { dy += this.speed; this.isMoving = true; }
        if (keys['a'] || keys['ф']) { dx -= this.speed; this.isMoving = true; }
        if (keys['d'] || keys['в']) { dx += this.speed; this.isMoving = true; }

        if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

        this.x += dx;
        this.y += dy;

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(canvas.height * 0.15, Math.min(canvas.height - this.radius, this.y));

        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        if (this.isMoving) {
            this.animTimer++;
            if (this.animTimer % 6 === 0) this.animFrame = (this.animFrame + 1) % 4;
        } else {
            this.animFrame = 0;
        }

        // Регенерація патронів (максимум 3)
        if (this.ammo < 3) {
            this.ammo += this.ammoRechargeRate;
            if (this.ammo > 3) this.ammo = 3;
        }

        // Перевірка готовності ульти
        if (this.superCharge >= 100) {
            this.superCharge = 100;
            this.superReady = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Якщо в кущах — робимо напівпрозорим
        if (this.isInBush) {
            ctx.globalAlpha = 0.6;
        }

        ctx.rotate(this.angle);

        // Тіло
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.superReady ? '#f1c40f' : '#fff'; // Жовта обводка, якщо ульта готова
        ctx.lineWidth = this.superReady ? 4 : 3;
        ctx.stroke();

        // Анімація ніг
        if (this.isMoving) {
            let legOffset = Math.sin(this.animFrame * (Math.PI / 2)) * 10;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-5, -15 + legOffset, 6, 0, Math.PI * 2);
            ctx.arc(-5, 15 - legOffset, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Зброя
        ctx.fillStyle = '#f1c40f';
        if (this.charType === 'colt') {
            ctx.fillRect(12, -14, 12, 6);
            ctx.fillRect(12, 8, 12, 6);
        } else if (this.charType === 'shelly') {
            ctx.fillRect(10, -5, 18, 8);
        } else {
            ctx.fillRect(14, -8, 8, 16);
        }

        ctx.restore();
        ctx.globalAlpha = 1.0; // Скидаємо прозорість

        // --- ІНДЫКАТОРИ НАД ГОЛОВОЮ ---
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = this.superReady ? "#f1c40f" : "#fff";
        ctx.textAlign = "center";
        ctx.fillText(this.nickname, this.x, this.y - 45);

        const barW = 50;
        
        // 1. Смужка HP (Зелена)
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x - barW/2, this.y - 38, barW, 6);
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(this.x - barW/2, this.y - 38, barW * (this.hp / this.maxHp), 6);

        // 2. Смужка Патронів (Помаранчева, розділена на 3 блоки)
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x - barW/2, this.y - 30, barW, 4);
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(this.x - barW/2, this.y - 30, barW * (this.ammo / 3), 4);

        // 3. Маленький індикатор ульти (Жовтий/Синій) під патронами
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(this.x - barW/2, this.y - 24, barW, 3);
        ctx.fillStyle = this.superReady ? "#3498db" : "#f1c40f";
        ctx.fillRect(this.x - barW/2, this.y - 24, barW * (this.superCharge / 100), 3);
    }

    shoot(mouseX, mouseY, isSuper = false) {
        // Якщо звичайна атака — перевіряємо патрони
        if (!isSuper && this.ammo < 1) return [];
        if (!isSuper) this.ammo -= 1; // Тратиться 1 слот

        const bullets = [];
        const baseAngle = Math.atan2(mouseY - this.y, mouseX - this.x);

        // ЕФЕКТИ УЛЬТИМЕЙТУ
        if (isSuper) {
            this.superCharge = 0;
            this.superReady = false;

            if (this.charType === 'colt') {
                // Ульта Кольта: Величезна руйнівна черга з 10 гігантських куль
                for (let i = -2; i <= 2; i++) {
                    bullets.push({
                        x: this.x, y: this.y, dx: Math.cos(baseAngle + i*0.04), dy: Math.sin(baseAngle + i*0.04),
                        speed: 16, damage: 600, maxRange: 500, currentRange: 0, radius: 10, color: "#f39c12", isSuper: true
                    });
                }
            } else if (this.charType === 'shelly') {
                // Ульта Шеллі: Супер-Троща (величезний конус куль, що розносить все)
                for (let i = -5; i <= 5; i++) {
                    bullets.push({
                        x: this.x, y: this.y, dx: Math.cos(baseAngle + i*0.1), dy: Math.sin(baseAngle + i*0.1),
                        speed: 11, damage: 450, maxRange: 280, currentRange: 0, radius: 7, color: "#9b59b6", isSuper: true
                    });
                }
            } else if (this.charType === 'el_primo') {
                // Ульта Ель Прімо: Стрибок (випускає одну гігантську вибухову зону навколо себе)
                bullets.push({
                    x: this.x, y: this.y, dx: Math.cos(baseAngle), dy: Math.sin(baseAngle),
                    speed: 20, damage: 1500, maxRange: 300, currentRange: 0, radius: 60, color: "rgba(241, 196, 15, 0.5)", isSuper: true
                });
            }
            return bullets;
        }

        // ЗВИЧАЙНА АТАКА (як і була)
        if (this.charType === 'colt') {
            for (let i = -1; i <= 1; i++) bullets.push(this.createBullet(baseAngle + (i * 0.05)));
        } else if (this.charType === 'shelly') {
            for (let i = -2; i <= 2; i++) bullets.push(this.createBullet(baseAngle + (i * 0.15)));
        } else if (this.charType === 'el_primo') {
            bullets.push({
                x: this.x, y: this.y, dx: Math.cos(baseAngle), dy: Math.sin(baseAngle),
                speed: this.bulletSpeed, damage: this.attackDamage, maxRange: this.attackRange, currentRange: 0, radius: 25, color: "rgba(230, 126, 34, 0.6)"
            });
        }
        return bullets;
    }

    createBullet(angle) {
        return {
            x: this.x, y: this.y, dx: Math.cos(angle), dy: Math.sin(angle),
            speed: this.bulletSpeed, damage: this.attackDamage, maxRange: this.attackRange, currentRange: 0, radius: 5, color: "#f1c40f"
        };
    }
}
