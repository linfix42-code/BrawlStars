// Об'єкт для збереження вибору гравця в меню
const selectedGameData = {
    nickname: "Brawler777",
    character: "colt"
};

// Отримуємо елементи з DOM
const nicknameInput = document.getElementById("player-nickname");
const charCards = document.querySelectorAll(".char-card");
const startBtn = document.getElementById("start-btn");
const mainMenu = document.getElementById("main-menu");
const gameScreen = document.getElementById("game-screen");
const hudNickname = document.getElementById("hud-nickname");

// 1. Слідкуємо за зміною нікнейму
nicknameInput.addEventListener("input", (e) => {
    let name = e.target.value.trim();
    if(name === "") name = "Гравець";
    selectedGameData.nickname = name;
});

// 2. Логіка перемикання карток персонажів
charCards.forEach(card => {
    card.addEventListener("click", () => {
        // Забираємо підсвітку у попереднього активного
        document.querySelector(".char-card.active").classList.remove("active");
        
        // Додаємо підсвітку тому, на якого клікнули
        card.classList.add("active");
        
        // Записуємо вибраного бравлера
        selectedGameData.character = card.getAttribute("data-char");
        console.log("Вибрано персонажа:", selectedGameData.character);
    });
});

// 3. Клік по кнопці "У БІЙ!"
startBtn.addEventListener("click", () => {
    // Передаємо нікнейм у HUD гри
    hudNickname.innerText = selectedGameData.nickname;
    
    // Ховаємо меню та показуємо ігровий екран
    mainMenu.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    
    // Перевіряємо, чи ініціалізована гра, і запускаємо її
    if (typeof initGame === "function") {
        initGame(selectedGameData);
    } else {
        console.log("Ігровий рушій (game.js) ще не підключено.");
    }
});
