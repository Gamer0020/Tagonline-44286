let gameId = sessionStorage.getItem("gameId");
console.log("Game ID : ", gameId);
if (gameId == null) {
  window.location.href = "../index.html?error=2";
}

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, push, onValue, onDisconnect, remove, onChildAdded, update, onChildRemoved } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
import { firebaseConfig } from "../config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Game variables
const gameContainer = document.getElementById("game-container");
const arrowsContainer = document.getElementById("arrows-container");
const playersInfo = document.getElementById("players-info");

let GRIDSIZE;
let BORDERSIZE;
const numOfCell = 20;

const gameRef = `games/${gameId}`;

let playerId;
let isOwner = false;
let playerRef;
let players = {};
let playerElements = {};
let lastPress = 0;
let lastGive = 0;

let listOfColors;
fetch("../colors.json")
  .then(response => response.json())
  .then(json => listOfColors = json);

signInAnonymously(auth)
  .catch((error) => {
  console.log(error.code, error.message);
});

// Quand le statut de l'utilisateur change (typiquement quand le joueur se co ou se déco)
onAuthStateChanged(auth, (user) => {
  if (user) {
    //User logged in
    playerId = user.uid;
    playerRef = ref(database, `${gameRef}/players/${playerId}`);

    console.log(playerId);
    
    set(playerRef, {
      id: playerId,
      name: sessionStorage.getItem("pseudo") == null ? "Anonymous" : sessionStorage.getItem("pseudo"),
      x: Math.floor(Math.random() * numOfCell),
      y: Math.floor(Math.random() * numOfCell),
      color: listOfColors[Math.floor(Math.random()*listOfColors.length)], // A définir
      isIt: false,
      isInvincible: false
    }).catch((error) => {console.log(error)})

    if (isOwner) {
      onDisconnect(playeerRef).remove(gameRef);
    } else {
      onDisconnect(playerRef).remove(playerRef); // Si le joueur se déconnecte, on supprime son joueur de la base de données;
    }

    initGame();

  } else {
    // User logged out
    console.log("Logged out")
  }
});

function initGame() {
  const allPlayersRef = ref(database, `${gameRef}/players`);
  get(ref(database, `${gameRef}/owner`)).then((snapshot) => {
    console.log(snapshot.val());
    if (playerId === snapshot.val()) {
      isOwner = true;
      console.log("You are the owner of the game");
      update(playerRef, {isIt: true});
    }
  });

  resize();

  onValue(allPlayersRef, (snapshot) => {
    //Fires whenever a change occurs
    players = snapshot.val() || {};

    Object.keys(players).forEach((key) => {
      const characterState = players[key];
      let element = playerElements[key];
      element.style.transform = `translate(${characterState["x"]*GRIDSIZE}px, ${characterState["y"]*GRIDSIZE}px)`;
      element.style.zIndex = characterState["y"];
      if (characterState["isIt"]) { // Si c'est it
        element.style.borderColor = "red";
        if (isOwner) { // Si c'est le créateur de la partie
          giveBomb(characterState, key);
        }
      } else {
        element.style.borderColor = "black";
      }
      
    });
  });

  function giveBomb(player, key) {
    Object.keys(players).forEach((Id) => {
      let x = player["x"];
      let y = player["y"];
      if (Id != key) { // Si c'est pas le joueur qui a la bombe
        if (players[Id]["x"] == x && players[Id]["y"] == y && !players[Id]["isInvincible"]) {
          lastGive = new Date().getTime();
          update(playerRef, {isIt: false, isInvincible: true});
          update(ref(database, `${gameRef}/players/${Id}`), {isIt: true});
          setTimeout(() => {update(playerRef, {isInvincible: false})}, 300);
        }
      }
    });
  }

  onChildAdded(allPlayersRef, (snapshot) => {
    //On ajoute un joueur
    const addedPlayer = snapshot.val();
    const characterElement = document.createElement("div");
    //create the "real" player with style
    characterElement.classList.add("player");
    characterElement.id = addedPlayer.id;
    characterElement.style.backgroundColor = `#${addedPlayer.color}`;
    characterElement.style.width = `${GRIDSIZE-BORDERSIZE*2}px`;
    characterElement.style.height = `${GRIDSIZE-BORDERSIZE*2}px`;
    characterElement.style.borderWidth = `${BORDERSIZE}px`;
    
    
    if (addedPlayer.id === playerId) {
      //more style for the current player...
      characterElement.innerHTML = `<div class="you-pointer"></div>`;
    }
    
    characterElement.innerHTML += `
    <div class="name-container">${addedPlayer.name}</div>
    `
    gameContainer.appendChild(characterElement);
    playerElements[addedPlayer.id] = characterElement;
  });

  onChildRemoved(allPlayersRef, (snapshot) => {
    const removedPlayer = snapshot.val();
    gameContainer.removeChild(document.getElementById(removedPlayer["id"]));
  });

  document.addEventListener("keydown", (event) => {
    // if (keyPressed) {
    //   return;
    // }
    switch (event.key) {
      case "ArrowLeft":
        keyPressHandler(-1, 0);
        // keyPressed = true;
        break;
    
      case "ArrowRight":
        keyPressHandler(1, 0);
        // keyPressed = true;
        break;
      
      case "ArrowDown":
        keyPressHandler(0, 1);
        // keyPressed = true;
        break;

      case "ArrowUp":
        keyPressHandler(0, -1);
        // keyPressed = true;
        break;
      
      default:
        break;
    }
  });
  
}

function keyPressHandler(deltaX=0, deltaY=0) { // C'est là qu'il faut gérer les déplacements du joueur.
  let time = new Date().getTime();
  if (time - lastPress < 0) { // Je sais pas trop quelle valeur mettre ici parce que si c'est trop bas ça sert à rien mais si c'est trop haut c'est chiant
    return; // Pour pas que le joueur spam
  } else {
    lastPress = time;
  }
  let newX = players[playerId]["x"] + deltaX;
  let newY = players[playerId]["y"] + deltaY;
  if (0 <= newX && newX < numOfCell && 0 <= newY && newY < numOfCell) {
    update(playerRef, {x: newX, y: newY});
  }
}


window.addEventListener("resize", (e) => {
  resize();
});

// Toute la merde qu'on doit faire pour que ça se scale automatiquement
function resize() {
  let viewPortWidth = window.innerWidth-30;
  let viewPortHeight = window.innerHeight-30;

  
  let newX = viewPortWidth; //On crée les dimensions du game-container
  let newY = viewPortHeight;

  //On crée un carré en fonction de l'oritentation du viewport
  if (viewPortWidth > viewPortHeight) { //Mode paysage
    newX = newY;

    arrowsContainer.style.width = `${Math.floor(Math.min((viewPortWidth-newX)/2, viewPortHeight*0.8))}px`;
    arrowsContainer.style.height = `${Math.floor(Math.min((viewPortWidth-newX)/2, viewPortHeight*0.8))}px`;
    arrowsContainer.style.left = "0px";
    arrowsContainer.style.top = "unset";
    arrowsContainer.style.bottom = "unset";


  } else if (viewPortHeight > viewPortWidth) { //Mode portrait
    newY = newX;

    arrowsContainer.style.width = `${Math.min((viewPortHeight-newX)/2, viewPortWidth/2)}px`;
    arrowsContainer.style.height = `${Math.min((viewPortHeight-newX)/2, viewPortWidth/2)}px`;
    arrowsContainer.style.bottom = "0px";
    arrowsContainer.style.left = "unset";
    arrowsContainer.style.top = "unset";


  }

  playersInfo.style.width = `${Math.floor(viewPortWidth*0.25)}px`;
  
  gameContainer.style.width = `${newX}px`;
  gameContainer.style.height = `${newY}px`;
  GRIDSIZE = newX / numOfCell;
  BORDERSIZE = Math.floor(GRIDSIZE / 6);
  console.log("Grid size (in px) : ", GRIDSIZE);
  console.log("Border size (in px) : ", BORDERSIZE);
  if (BORDERSIZE < 1) {
    BORDERSIZE = 1;
  }
  document.querySelectorAll(".player").forEach((value) => {
    value.style.width = `${GRIDSIZE-BORDERSIZE*2}px`;
    value.style.height = `${GRIDSIZE-BORDERSIZE*2}px`;
    value.style.borderWidth = `${BORDERSIZE}px`;
    let x = players[value.id]["x"];
    let y = players[value.id]["y"];
    
    value.style.transform = `translate(${x*GRIDSIZE}px, ${y*GRIDSIZE}px)`;
  });
  
}

// document.getElementById("show-arrows").addEventListener("click", () => {
//   if (arrowsContainer.style.left == "-320px") {
//     arrowsContainer.style.left = "0px";
//   } else {
//     arrowsContainer.style.left = "-320px";
//   }
// });

document.getElementById("arrow-left").addEventListener("click", () => {
  keyPressHandler(-1, 0);
});

document.getElementById("arrow-right").addEventListener("click", () => {
  keyPressHandler(1, 0);
});

document.getElementById("arrow-down").addEventListener("click", () => {
  keyPressHandler(0, 1);
});

document.getElementById("arrow-up").addEventListener("click", () => {
  keyPressHandler(0, -1);
});

document.getElementById("exit").addEventListener("click", () => {
  dispose();
  window.location.href = "../index.html";
});

window.addEventListener("beforeunload", (event) => {
  dispose();
});

function dispose() {
  if (isOwner) {
    remove(ref(database, `${gameRef}`));
  } else {
    remove(playerRef);
  }
}