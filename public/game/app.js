// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, set, update, onValue, onDisconnect, onChildAdded, onChildRemoved } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDViTqc4QOkpqX0wAdBV0rLlKt2iMK3bz8",
  authDomain: "tagonline-44286.firebaseapp.com",
  databaseURL: "https://tagonline-44286-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tagonline-44286",
  storageBucket: "tagonline-44286.firebasestorage.app",
  messagingSenderId: "261231723787",
  appId: "1:261231723787:web:a2f121380bfd3b8b7b4e0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Game variables
const gameContainer = document.getElementById("game-container");
const numOfCell = 20;
let GRIDSIZE;
let playerId;
let playerRef;
let players = {};
let playerElements = {};
let taggerId = null;

// Ajustement de la taille de la grille
function adjustGridSize() {
  let size = Math.min(window.innerWidth, window.innerHeight) - 20;
  gameContainer.style.width = `${size}px`;
  gameContainer.style.height = `${size}px`;
  GRIDSIZE = size / numOfCell;
}
adjustGridSize();
window.addEventListener("resize", adjustGridSize);

// Forcer un nouvel utilisateur par onglet
setPersistence(auth, browserSessionPersistence)
  .then(() => signInAnonymously(auth))
  .catch(console.error);

// Gestion de l'authentification anonyme
onAuthStateChanged(auth, (user) => {
  if (user) {
    playerId = user.uid;
    console.log("Player ID:", playerId);
    playerRef = ref(database, `players/${playerId}`);
    
    set(playerRef, { id: playerId, x: 0, y: 0, isTagger: false }).catch(console.error);
    onDisconnect(playerRef).remove();
    
    initGame();
  }
});

function initGame() {
  const allPlayersRef = ref(database, "players");
  onValue(allPlayersRef, (snapshot) => {
    players = snapshot.val() || {};
    Object.keys(players).forEach(updatePlayerPosition);
  });

  onChildAdded(allPlayersRef, (snapshot) => {
    const addedPlayer = snapshot.val();
    createPlayerElement(addedPlayer);
    if (!taggerId) setTagger(addedPlayer.id);
  });

  onChildRemoved(allPlayersRef, (snapshot) => {
    removePlayerElement(snapshot.val().id);
  });
}

function createPlayerElement(player) {
  const characterElement = document.createElement("div");
  characterElement.classList.add("player");
  characterElement.id = player.id;
  characterElement.style.width = `${GRIDSIZE - 4}px`;
  characterElement.style.height = `${GRIDSIZE - 4}px`;
  updatePlayerStyle(characterElement, player);
  gameContainer.appendChild(characterElement);
  playerElements[player.id] = characterElement;
}

function updatePlayerPosition(id) {
  const player = players[id];
  if (!playerElements[id]) return;
  playerElements[id].style.transform = `translate(${player.x * GRIDSIZE}px, ${player.y * GRIDSIZE}px)`;
  updatePlayerStyle(playerElements[id], player);
}

function updatePlayerStyle(element, player) {
  element.style.backgroundColor = player.isTagger ? "red" : "blue";
}

function removePlayerElement(id) {
  if (playerElements[id]) {
    gameContainer.removeChild(playerElements[id]);
    delete playerElements[id];
  }
}

function setTagger(id) {
  taggerId = id;
  update(ref(database, `players/${id}`), { isTagger: true });
}

document.addEventListener("keydown", (event) => {
  let deltaX = 0, deltaY = 0;
  if (event.key === "ArrowLeft") deltaX = -1;
  if (event.key === "ArrowRight") deltaX = 1;
  if (event.key === "ArrowUp") deltaY = -1;
  if (event.key === "ArrowDown") deltaY = 1;
  movePlayer(deltaX, deltaY);
});

function movePlayer(dx, dy) {
  let newX = players[playerId]?.x + dx;
  let newY = players[playerId]?.y + dy;
  if (newX >= 0 && newX < numOfCell && newY >= 0 && newY < numOfCell) {
    update(playerRef, { x: newX, y: newY });
    checkTagCollision();
  }
}

function checkTagCollision() {
  if (playerId === taggerId) {
    Object.values(players).forEach((player) => {
      if (player.id !== taggerId && player.x === players[taggerId].x && player.y === players[taggerId].y) {
        setTagger(player.id);
      }
    });
  }
}
