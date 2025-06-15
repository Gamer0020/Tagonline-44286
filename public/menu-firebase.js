import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

sessionStorage.clear();

const params = new URLSearchParams(window.location.search);
const error = params.get("error");
if (error !== null) {
  switch (error) {
    case "1":
      alert("The owner of the game has left.");
      break;
    case "2":
      alert("There was an error with the game ID. Please try again.");
      break;
    case "3":
      alert("Please do not refresh the game page while playing.");
      break;
    default:
      alert("Unknown error");
  }

  window.location.href = "index.html";
}

// Sign in anonymously
signInAnonymously(auth)
  .then(() => {
    console.log("Signed in anonymously");
  })
  .catch((error) => {
    console.error("Error signing in anonymously:", error);
  });

// Function to write data to the database
function writeData(path, data) {
  set(ref(database, path), data)
    .then(() => {
      console.log("Data written successfully");
    })
    .catch((error) => {
      console.error("Error writing data:", error);
    });
}

// Function to read data from the database
function readData(path, callback) {
  const dataRef = ref(database, path);
  onValue(dataRef, (snapshot) => {
    callback(snapshot.val());
  }, (error) => {
    console.error("Error reading data:", error);
  });
}

// Function to fetch data once
function fetchDataOnce(path) {
  const dataRef = ref(database, path);
  return get(dataRef)
    .then((snapshot) => snapshot.val())
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

var pseudo = document.getElementById("pseudo");

let createButton = document.getElementById("create-button");
createButton.addEventListener("click", createGame, 0);

async function createGame(numberOfCalls) {
  let id = Math.floor(Math.random() * 10000);

  await get(ref(database, `games/${id}`)).then((snapshot) => {
    // Check if the game already exists
    if (!snapshot.exists()) {
      console.log("Game does not exist");
      writeData(`games/${id}`, {
        id : id,
        mode: "default",
        owner: auth.currentUser.uid,
        players: {},
      });
      return;
    } else {
      console.log("Game already exists");
      // If the game exists, try again with a new ID
      if (numberOfCalls < 100) {
        createGame(numberOfCalls + 1);
      } else {
        console.log("Failed to create game after 100 attempts");
        return;
      }
      return;
    }
  }).catch((error) => {
    console.error("Error fetching game data:", error);
  });

  // Redirect to the game page
  sessionStorage.setItem("gameId", id);
  sessionStorage.setItem("pseudo", pseudo.value == "" ? "Anonymous" : pseudo.value);
  window.location.href = `game/game.html`;
}

let joinButton = document.getElementById("join-button");
joinButton.addEventListener("click", joinGame, 0);

async function joinGame() {
  let idInput = document.getElementById("room-id");
  let id = idInput.value;

  await fetchDataOnce(`games/${id}/mode`)
    .then((data) => {
      if (data === null) {
        // Game does not exist
        console.log("Game does not exist");
        idInput.classList.remove("input-error-animation");
        void idInput.offsetWidth; // Trigger reflow
        idInput.classList.add("input-error-animation");
      } else {
        // Game exists
        console.log("Game exists");
        sessionStorage.setItem("pseudo", pseudo.value == "" ? "Anonymous" : pseudo.value);
        sessionStorage.setItem("gameId", id);
        window.location.href = `game/game.html`;
      }
    })
    .catch((error) => {
      console.error("Error fetching game data:", error);
    });
}