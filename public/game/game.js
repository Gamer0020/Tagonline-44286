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

let GRIDSIZE;
let BORDERSIZE;
const numOfCell = 20;


let playerId;
let playerRef;
let players = {};
let playerElements = {};
let lastPress = 0;
let lastGive = 0;

let listOfColors = ["FF0", "0F0", "00F", "FAF", "0FF", "AFF", "FFF"];

resize();

// Quand le statut de l'utilisateur change (typiquement quand le joueur se co ou se déco)
onAuthStateChanged(auth, (user) => {
  if (user) {
    //User logged in
    playerId = user.uid;
    playerRef = ref(database, `players/${playerId}`)

    console.log(playerId);
    
    set(playerRef, {
      id: playerId,
      name: playerId,
      x: Math.floor(Math.random() * numOfCell),
      y: Math.floor(Math.random() * numOfCell),
      color: listOfColors[Math.floor(Math.random()*listOfColors.length)], // A définir
      isIt: false,
      isInvincible: false
    }).catch((error) => {console.log(error)})

    onDisconnect(playerRef).remove(playerRef)

    initGame();

  } else {
    // User logged out
    console.log("Logged out")
  }
});

signInAnonymously(auth).catch((error) => {
  console.log(error.code, error.message);
});


function initGame() {
  const allPlayersRef = ref(database, `players`)

  onValue(allPlayersRef, (snapshot) => {
    //Fires whenever a change occurs
    players = snapshot.val() || {};
    if (Object.keys(players).length == 1) {
      update(playerRef, {isIt: true});
    }

    Object.keys(players).forEach((key) => {
      const characterState = players[key];
      let element = playerElements[key];
      element.style.transform = `translate(${characterState["x"]*GRIDSIZE}px, ${characterState["y"]*GRIDSIZE}px)`;
      if (characterState["isIt"]) { // Si c'est it
        element.style.border = `${element.style.border.split(" ")[0]} ${element.style.border.split(" ")[1]} red`;
        if (key === playerId) { // Si c'est le joueur actuel
          giveBomb(characterState, key);
        }
      } else {
        element.style.border = `${element.style.border.split(" ")[0]} ${element.style.border.split(" ")[1]} black`;
      }
      
    });
  });

  function giveBomb(player, key) {
    Object.keys(players).forEach((Id) => {
      let x = player["x"];
      let y = player["y"];
      if (Id != key) {
        if (players[Id]["x"] == x && players[Id]["y"] == y && !players[Id]["isInvincible"]) {
          lastGive = new Date().getTime();
          update(playerRef, {isIt: false, isInvincible: true});
          update(ref(database, `players/${Id}`), {isIt: true});
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
    characterElement.style.width = `${GRIDSIZE-6}px`;
    characterElement.style.height = `${GRIDSIZE-6}px`;
    characterElement.style.border = `${BORDERSIZE}px solid black`;
    
    
    if (addedPlayer.id === playerId) {
      //more style for the current player...
    }
    
    characterElement.innerHTML = `
    <div class="name-container"></div>
    `
    gameContainer.appendChild(characterElement);
    playerElements[addedPlayer.id] = characterElement;
  });

  onChildRemoved(allPlayersRef, (snapshot) => {
    const removedPlayer = snapshot.val();
    gameContainer.removeChild(document.getElementById(removedPlayer["id"]));
  });

  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowLeft":
        keyPressHandler(-1, 0);
        break;
    
      case "ArrowRight":
        keyPressHandler(1, 0);
        break;
      
      case "ArrowDown":
        keyPressHandler(0, 1);
        break;

      case "ArrowUp":
        keyPressHandler(0, -1);
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

function resize() {
  console.log("resize");
  let viewPortWidth = window.innerWidth-20;
  let viewPortHeight = window.innerHeight-20;
  
  let newX = viewPortWidth; //On crée les dimensions du game-container
  let newY = viewPortHeight;
  if (viewPortWidth > viewPortHeight) { //On crée un carré en fonction de l'oritentation du viewport
    newX = newY;
  } else if (viewPortHeight > viewPortWidth) {
    newY = newX;
    arrowsContainer.style.bottom = `${(viewPortHeight - newY)/2}px`;
  }
  
  gameContainer.style.width = `${newX}px`;
  gameContainer.style.height = `${newY}px`;
  GRIDSIZE = newX / numOfCell;
  BORDERSIZE = Math.floor(GRIDSIZE / 6);
  if (BORDERSIZE < 1) {
    BORDERSIZE = 1;
  }
  document.querySelectorAll(".player").forEach((value) => {
    value.style.width = `${GRIDSIZE-BORDERSIZE*2}px`;
    value.style.height = `${GRIDSIZE-BORDERSIZE*2}px`;
    value.style.border = `${BORDERSIZE}px solid ${value.style.border.split(" ")[2]}`;
    let x = players[value.id]["x"];
    let y = players[value.id]["y"];
    
    value.style.transform = `translate(${x*GRIDSIZE}px, ${y*GRIDSIZE}px)`;
  });
  
}

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

window.addEventListener("beforeunload", (event) => {

});