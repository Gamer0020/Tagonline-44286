// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, push, onValue, onDisconnect, remove, onChildAdded, update, onChildRemoved } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

let GRIDSIZE;
const numOfCell = 20;


let playerId;
let playerRef;
let players = {};
let playerElements = {};

if (window.innerWidth > window.innerHeight) {
  gameContainer.style.width = `${window.innerHeight-20}px`;
  gameContainer.style.height = `${window.innerHeight-20}px`;
} else if (window.innerWidth < window.innerHeight) {
  gameContainer.style.width = `${window.innerWidth-20}px`;
  gameContainer.style.height = `${window.innerWidth-20}px`;
}

GRIDSIZE = (window.innerHeight-20) / numOfCell;

// Quand le statut de l'utilisateur change (typiquement quand le joueur se co ou se déco)
onAuthStateChanged(auth, (user) => {
  if (user) {
    //User logged in
    playerId = user.uid;
    playerRef = ref(database, `players/${playerId}`)

    console.log(playerId);
    
    set(playerRef, {
      id: playerId,
      name: "Anonyme",
      x: 0,
      y: 0
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
    Object.keys(players).forEach((key) => {
      const characterState = players[key];
      let element = playerElements[key];
      element.style.transform = `translate(${characterState["x"]*GRIDSIZE}px, ${characterState["y"]*GRIDSIZE}px)`
      
    });
  });

  onChildAdded(allPlayersRef, (snapshot) => {
    const addedPlayer = snapshot.val();
    const characterElement = document.createElement("div");
    //create the "real" player with style
    characterElement.classList.add("player");
    characterElement.id = addedPlayer.id;
    characterElement.style.width = `${GRIDSIZE-4}px`;
    characterElement.style.height = `${GRIDSIZE-4}px`;
    
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
    console.log(`Child removed ${snapshot}`);
    const removedPlayer = snapshot.val();
    gameContainer.removeChild(document.getElementById(removedPlayer["id"]));
  });

  document.addEventListener("keydown", (event) => {
    console.log(event);
    switch (event.key) {
      case "ArrowLeft":
        keyPressHandler(-1);
        break;
    
      case "ArrowRight":
        keyPressHandler(1);
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
  let newX = players[playerId]["x"] + deltaX;
  let newY = players[playerId]["y"] + deltaY;
  if (0 <= newX && newX < numOfCell && 0 <= newY && newY < numOfCell) {
    update(playerRef, {x: newX, y: newY});
  }
}

window.addEventListener("beforeunload", (event) => {

});

window.addEventListener("resize", event => {
  let vw = window.innerWidth-20;
  let vh = window.innerHeight-20;

  let nx = vw; //On crée les dimensions du game-container
  let ny = vh;
  if (vw > vh) { //On crée un carré en fonction de l'oritentation du viewport
    nx = ny;
  } else if (vh > vw) {
    ny = nx;
  }

  gameContainer.style.width = `${nx}px`;
  gameContainer.style.height = `${ny}px`;
  GRIDSIZE = nx / numOfCell;

  document.querySelectorAll(".player").forEach((value) => {
    value.style.width = `${GRIDSIZE-4}px`;
    value.style.height = `${GRIDSIZE-4}px`;
    let x = players[value.id]["x"];
    let y = players[value.id]["y"];
    
    value.style.transform = `translate(${x*GRIDSIZE}px, ${y*GRIDSIZE}px)`;
  });

});