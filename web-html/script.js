let gameData;
let difficultySelect;
let categorySelect;

document.addEventListener("DOMContentLoaded", function () {
  difficultySelect = document.getElementById("difficulty");
  console.log(difficultySelect); // Confirm element assignment
  categorySelect = document.getElementById("category");

  fetch("gamedata.json")
    .then((response) => response.json())
    .then((data) => {
      console.log("SOME DATA", data);
      gameData = data;
      populateDifficultySelect(difficultySelect, gameData.levels);
      difficultySelect.dispatchEvent(new Event("change")); // Initialize the game setup
    })
    .catch((error) => console.error("Fetch error:", error));

  // Handle change events on the difficulty select
  difficultySelect.addEventListener("change", function () {
    populateCategorySelect(
      categorySelect,
      gameData.levels[difficultySelect.value]
    );
    categorySelect.dispatchEvent(new Event("change")); // Trigger change to load words
    updateGame();
  });

  // Handle change events on the category select
  categorySelect.addEventListener("change", function () {
    updateWordList(
      gameData.levels[difficultySelect.value][categorySelect.value]
    );
    updateGame();
  });

  // difficultySelect.addEventListener("change", function () {
  //   populateCategorySelect(
  //     categorySelect,
  //     gameData.levels[difficultySelect.value]
  //   );
  //   categorySelect.dispatchEvent(new Event("change")); // Trigger change to load words
  // });

  // categorySelect.addEventListener("change", function () {
  //   updateWordList(
  //     gameData.levels[difficultySelect.value][categorySelect.value]
  //   );
  //   updateGame(); // Update game when category changes
  // });
});

function updateGame() {
  console.log("Update game being called.....");
  const selectedDifficulty = difficultySelect.value;
  const selectedCategory = categorySelect.value;
  const words = gameData.levels[selectedDifficulty][selectedCategory];

  const gridSize = calculateGridSize(words);
  updateGridSize(gridSize);
  console.log("updating gridSize");

  const gridCells = generateGrid(gridSize, words);
  console.log(gridCells, "GRID CELLLLS.......");
  console.log("grid size checkking........");
  const container = document.getElementById("word-search-container");
  container.innerHTML = ""; // Clear previous grid
  container.append(...gridCells);
}

function populateDifficultySelect(selectElement, levels) {
  Object.keys(levels).forEach((level) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    selectElement.appendChild(option);
  });
}

function populateCategorySelect(selectElement, categories) {
  selectElement.innerHTML = ""; // Clear out existing options
  Object.keys(categories).forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectElement.appendChild(option);
  });
}

function updateWordList(words) {
  const wordListElement = document.getElementById("word-list");
  wordListElement.innerHTML = ""; // Clear out existing words

  words.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    wordListElement.appendChild(li);
  });
}

// Global variables to track the state of selection
let isSelecting = false;
let selectedCells = [];
let startCell = null;

function handleMouseDown(e) {
  if (e.target.classList.contains("cell")) {
    isSelecting = true;
    startCell = e.target;
    e.target.classList.add("selected"); // Highlight the cell as selected
  }
}

function handleMouseMove(e) {
  if (!isSelecting) return; // Exit if we haven't started selecting
  if (e.target.classList.contains("cell")) {
    selectCell(e.target);
  }
}

function handleMouseUp(e) {
  if (!isSelecting) return;

  isSelecting = false;
  const selectedWord = getSelectedWord();
  handleWordSelection(selectedWord);

  selectedCells.forEach((cell) => cell.classList.remove("selected"));
  selectedCells = [];
  startCell = null;
}

function handleWordSelection(selectedWord) {
  if (wordCategories[currentDifficulty].includes(selectedWord)) {
    markWordAsFound(selectedWord);
    showGifPopup(
      "https://github.com/Shazam14/krupum/blob/main/krupum_gif/check.gif?raw=true"
    );
    checkAllWordsFound(selectedWord);
  } else {
    showGifPopup(
      "https://github.com/Shazam14/krupum/blob/main/krupum_gif/fearpoint.GIF?raw=true"
    );
    console.log("Word not found: ", selectedWord);
  }
}

function getSelectedWord() {
  return selectedCells.map((cell) => cell.getAttribute("data-letter")).join("");
}

function showGifPopup(gifUrl) {
  const gifPopup = document.getElementById("gif-popup");
  if (!gifPopup) {
    console.error("GIF pop-up element not found!");
    return;
  }

  // Update the GIF source
  gifPopup.querySelector("img").src = gifUrl;
  gifPopup.style.display = "block";

  // Hide the pop-up after a certain time
  setTimeout(() => {
    gifPopup.style.display = "none";
  }, 3000); // Adjust time as needed
}

let foundWords = new Set();

function checkAllWordsFound(selectedWord) {
  foundWords.add(selectedWord.toUpperCase());
  if (foundWords.size === wordCategories[currentDifficulty].length) {
    showGifPopup(
      "https://github.com/Shazam14/krupum/blob/main/krupum_gif/target.gif?raw=true"
    );
    // Perform any additional actions like restarting the game
  }
}

function markWordAsFound(word) {
  const wordListItems = document.querySelectorAll("#word-list li");
  wordListItems.forEach((item) => {
    if (item.textContent.toUpperCase() === word.toUpperCase()) {
      item.classList.add("word-found");
      foundWords.add(word.toUpperCase()); // Add the found word to the Set
      checkAllWordsFound(); // Check if all words are found
    }
  });
}

function selectCell(cell) {
  // Check if cell is already selected, if not, select it
  if (!selectedCells.includes(cell)) {
    selectedCells.push(cell);
    cell.classList.add("selected");
  }
}

function calculateGridSize(words) {
  return Math.max(...words.map((word) => word.length)); // Calculate grid size based on the longest word
}

function generateGrid(size, words) {
  console.log("generating Grid.....");
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  console.log(grid, "Initial grid state");

  words.forEach((word, index) => {
    console.log(`Placing word ${index + 1}/${words.length}: "${word}"`);
    const success = placeWordInGrid(grid, word, size);
    if (!success) {
      console.log(grid, `Grid state after failing to place "${word}"`);
      // Consider handling the failure, e.g., by breaking out of the loop
      // or removing the word from the list.
    }
  });

  fillEmptySpaces(grid);
  console.log(grid, "Grid state after filling empty spaces");
  return convertGridToCells(grid, size);
}

function placeWordInGrid(grid, word, size) {
  let attempts = 0;
  const maxAttempts = 50; // or some other reasonable number

  while (attempts < maxAttempts) {
    let row = Math.floor(Math.random() * size);
    let col = Math.floor(Math.random() * (size - word.length));

    console.log(`Attempt to place word '${word}' at row ${row}, col ${col}`);

    // Try to place horizontally
    if (checkSpaceAvailability(grid, word, row, col, "horizontal")) {
      for (let i = 0; i < word.length; i++) {
        grid[row][col + i] = word[i];
      }
      console.log(`Word '${word}' placed at row ${row}, col ${col}`);
      return true;
    }
    // Try to place vertically
    else if (checkSpaceAvailability(grid, word, col, row, "vertical")) {
      for (let i = 0; i < word.length; i++) {
        grid[col + i][row] = word[i];
      }
      console.log(`Word '${word}' placed at col ${row}, row ${col}`);
      return true;
    } else {
      attempts++;
      console.log(`Attempt ${attempts}: Couldn't place word '${word}'`);
    }
  }

  console.error(
    `Failed to place the word '${word}' after ${maxAttempts} attempts`
  );
  return false;
}

function checkSpaceAvailability(grid, word, startRow, startCol, orientation) {
  // Check bounds for horizontal placement
  if (orientation === "horizontal") {
    if (startCol + word.length > grid[0].length) return false; // Word goes out of bounds
    for (let i = 0; i < word.length; i++) {
      if (
        grid[startRow][startCol + i] !== "" &&
        grid[startRow][startCol + i] !== word[i]
      ) {
        return false; // Cell is not empty and not equal to the word letter
      }
    }
  }

  // Check bounds for vertical placement
  if (orientation === "vertical") {
    if (startRow + word.length > grid.length) return false; // Word goes out of bounds
    for (let i = 0; i < word.length; i++) {
      if (
        grid[startRow + i][startCol] !== "" &&
        grid[startRow + i][startCol] !== word[i]
      ) {
        return false; // Cell is not empty and not equal to the word letter
      }
    }
  }

  // You can add more conditions for diagonal or backwards here.

  return true; // All checks passed; space is available
}

function fillEmptySpaces(grid) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === "") {
        grid[rowIndex][colIndex] = letters.charAt(
          Math.floor(Math.random() * letters.length)
        );
      }
    });
  });
}

function convertGridToCells(grid, size) {
  console.log("calling convert grid......to cells.....");
  const cells = [];
  grid.forEach((row) => {
    row.forEach((letter) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.setAttribute("data-letter", letter);
      cell.style.width = `calc(100% / ${size})`;
      cell.style.height = `calc(100% / ${size})`;
      cell.textContent = letter;
      cells.push(cell);
    });
  });
  return cells;
}

function checkSpaceAvailability(grid, word, row, col) {
  for (let i = 0; i < word.length; i++) {
    if (grid[row][col + i] !== "") {
      return false;
    }
  }
  return true;
}

function updateGridSize(gridSize) {
  console.log("calling Grid Size.....");
  const container = document.getElementById("word-search-container");
  // Assuming --grid-size is used in the CSS to calculate cell sizes
  container.style.setProperty("--grid-size", gridSize);
}

function loadWords(difficulty) {
  const words = wordCategories[difficulty];
  const wordListElement = document.getElementById("word-list");
  wordListElement.innerHTML = "";
  words.forEach((word) => {
    const wordElement = document.createElement("li");
    wordElement.textContent = word;
    wordListElement.appendChild(wordElement);
  });
}

function changeDifficulty() {
  const selectElement = document.getElementById("difficulty");
  currentDifficulty = selectElement.value;
  updateGame();
}
