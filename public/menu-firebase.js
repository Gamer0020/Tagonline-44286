import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

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
createButton.addEventListener("click", () => {
  let id = Math.floor(Math.random() * 10);
  writeData(`games/1`, {
    id : id,
    mode: "default",
    owner: `${pseudo.value == "" ? "Anonymous" : pseudo.value}`,
    players: {},
  });

  readData("games/1", (snapshot) => {
    console.log(snapshot);
    if (snapshot) {
      console.log("Game data:", snapshot);
    } else {
      console.log("No game data found");
    }
    window.location.href = "game/game.html";
  })
});