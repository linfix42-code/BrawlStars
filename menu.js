const selectedGameData = {
    nickname: "Brawler777",
    character: "colt",
    difficulty: "normal" // Значення за замовчуванням
};

const nicknameInput = document.getElementById("player-nickname");
const charCards = document.querySelectorAll(".char-card");
const diffBtns = document.querySelectorAll(".diff-btn");
const startBtn = document.getElementById("start-btn");
const mainMenu = document.getElementById("main-menu");
const gameScreen = document.getElementById("game-screen");
const hudNickname = document.getElementById("hud-nickname");
const hudDiffName = document.getElementById("hud-diff-name");
const gameDiffTag = document.getElementById("game-diff-tag");

nicknameInput.addEventListener("input", (e) => {
    let name = e.target.value.trim();
    if(name === "") name = "Гравець";
    selectedGameData.nickname = name;
});

charCards.forEach(card => {
    card.addEventListener("click", () => {
        document.querySelector(".char-card.active").classList.remove("active");
        card.classList.add("active");
        selectedGameData.character = card.getAttribute("data-char");
    });
});

// Клік по кнопках складності
diffBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".diff-btn.active").classList.remove("remove").classList.remove("active");
        btn.classList.add("active");
        
        selectedGameData.difficulty = btn.getAttribute("data-diff");
        
        // Оновлюємо текст складності в меню
        if(selectedGameData.difficulty === "normal") hudDiffName.innerText = "Нормально";
        if(selectedGameData.difficulty === "hard") hudDiffName.innerText = "Хард";
        if(selectedGameData.difficulty === "insane") hudDiffName.innerText = "Екстрем";
    });
});

startBtn.addEventListener("click", () => {
    hudNickname.innerText = selectedGameData.nickname;
    
    // Виставляємо мітку складності для ігрового екрану
    if(selectedGameData.difficulty === "normal") gameDiffTag.innerText = "[Normal]";
    if(selectedGameData.difficulty === "hard") gameDiffTag.innerText = "[Hard]";
    if(selectedGameData.difficulty === "insane") gameDiffTag.innerText = "[Insane]";

    mainMenu.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    
    if (typeof initGame === "function") {
        initGame(selectedGameData);
    }
});
