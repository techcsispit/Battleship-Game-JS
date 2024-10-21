document.addEventListener('DOMContentLoaded', () => {
  const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  const ships = document.querySelectorAll('.ship')
  const destroyer = document.querySelector('.destroyer-container')
  const submarine = document.querySelector('.submarine-container')
  const cruiser = document.querySelector('.cruiser-container')
  const battleship = document.querySelector('.battleship-container')
  const carrier = document.querySelector('.carrier-container')
  const startButton = document.querySelector('#start')
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const setupButtons = document.getElementById('setup-buttons')
  const userSquares = []
  const computerSquares = []
  let isHorizontal = true
  let isGameOver = false
  let currentPlayer = 'user'
  const width = 10
  let playerNum = 0
  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1
  //Ships
  const shipArray = [
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width*2, width*3]
      ]
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width*2, width*3, width*4]
      ]
    },
  ]

  createBoard(userGrid, userSquares)
  createBoard(computerGrid, computerSquares)

  const difficultySelect = document.getElementById('difficulty');
  let level = 'easy';
  // Add event listener for when the selected value changes
  difficultySelect.addEventListener('change', function() {
    const selectedValue = difficultySelect.value;
    console.log('Selected difficulty:', selectedValue);
    level = selectedValue;
      // Disable the select element after selection
  difficultySelect.disabled = true;
    
  });



  // Select Player Mode
  if (gameMode === 'singlePlayer') {
    startSinglePlayer()
  } else {
    startMultiPlayer()
  }


  // Multiplayer
  function startMultiPlayer() {
    const socket = io();

    // Get your player number
    socket.on('player-number', num => {
      if (num === -1) {
        infoDisplay.innerHTML = "Sorry, the server is full"
      } else {
        playerNum = parseInt(num)
        if(playerNum === 1) currentPlayer = "enemy"

        console.log(playerNum)

        // Get other player status
        socket.emit('check-players')
      }
    })

    // Another player has connected or disconnected
    socket.on('player-connection', num => {
      console.log(`Player number ${num} has connected or disconnected`)
      playerConnectedOrDisconnected(num)
    })

    // On enemy ready
    socket.on('enemy-ready', num => {
      enemyReady = true
      playerReady(num)
      if (ready) {
        playGameMulti(socket)
        setupButtons.style.display = 'none'
      }
    })

    // Check player status
    socket.on('check-players', players => {
      players.forEach((p, i) => {
        if(p.connected) playerConnectedOrDisconnected(i)
        if(p.ready) {
          playerReady(i)
          if(i !== playerReady) enemyReady = true
        }
      })
    })

    // On Timeout
    socket.on('timeout', () => {
      infoDisplay.innerHTML = 'You have reached the 10 minute limit'
    })

    // Ready button click
    startButton.addEventListener('click', () => {
      
      if(allShipsPlaced) playGameMulti(socket)
      else infoDisplay.innerHTML = "Please place all ships"
    })

    // Setup event listeners for firing
    computerSquares.forEach(square => {
      square.addEventListener('click', () => {
        if(currentPlayer === 'user' && ready && enemyReady) {
          shotFired = square.dataset.id
          socket.emit('fire', shotFired)
        }
      })
    })

    // On Fire Received
    socket.on('fire', id => {
      enemyGo(id)
      const square = userSquares[id]
      socket.emit('fire-reply', square.classList)
      playGameMulti(socket)
    })

    // On Fire Reply Received
    socket.on('fire-reply', classList => {
      revealSquare(classList)
      playGameMulti(socket)
    })

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`
      document.querySelector(`${player} .connected`).classList.toggle('active')
      if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
    }
  }

  // Single Player
  function startSinglePlayer() {
    generate(shipArray[0])
    generate(shipArray[1])
    generate(shipArray[2])
    generate(shipArray[3])
    generate(shipArray[4])

    startButton.addEventListener('click', () => {
      difficultySelect.disabled = true;
      playGameSingle()
    })
  }

  //Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }

  //Draw the computers ships in random locations
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    if (randomDirection === 0) direction = 1
    if (randomDirection === 1) direction = 10
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))

    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
    const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
    const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))

    else generate(ship)
  }
  

  //Rotate the ships
  function rotate() {
    if (isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = false
      // console.log(isHorizontal)
      return
    }
    if (!isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = true
      // console.log(isHorizontal)
      return
    }
  }
  rotateButton.addEventListener('click', rotate)

  //move around user ship
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragover', dragOver))
  userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
  userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
  userSquares.forEach(square => square.addEventListener('drop', dragDrop))
  userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

  let selectedShipNameWithIndex
  let draggedShip
  let draggedShipLength

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id
    // console.log(selectedShipNameWithIndex)
  }))

  function dragStart() {
    draggedShip = this
    draggedShipLength = this.childNodes.length
    // console.log(draggedShip)
  }

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

  function dragLeave() {
    // console.log('drag leave')
  }

  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id
    let shipClass = shipNameWithLastId.slice(0, -2)
    // console.log(shipClass)
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)
    // console.log(shipLastId)
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    // console.log(shipLastId)

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass)
      }
    //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
    //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass)
      }
    } else return

    displayGrid.removeChild(draggedShip)
    if(!displayGrid.querySelector('.ship')) allShipsPlaced = true
  }

  function dragEnd() {
    // console.log('dragend')
  }

  // Game Logic for MultiPlayer
  function playGameMulti(socket) {
    setupButtons.style.display = 'none'
    if(isGameOver) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Go'
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's Go"
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

  // Game Logic for Single Player
  function playGameSingle() {
    if (isGameOver) return;
      // Check if ships are placed
  if (!allShipsPlaced) {
    turnDisplay.innerHTML = 'Place all your ships first!';
    return; // Exit the function if ships are not placed
  }
   setupButtons.style.display = 'none'
    if (currentPlayer === 'user') {
      turnDisplay.innerHTML = 'Your Go'
      computerSquares.forEach(square => square.addEventListener('click', function(e) {
        shotFired = square.dataset.id
        revealSquare(square.classList)
        
      }))
    }
    if (currentPlayer === 'enemy') {
      turnDisplay.innerHTML = 'Computers Go'
      setTimeout(enemyGo, 1000)
    }
  }

  let destroyerCount = 0
  let submarineCount = 0
  let cruiserCount = 0
  let battleshipCount = 0
  let carrierCount = 0

  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList)
    if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
      if (obj.includes('destroyer')) destroyerCount++
      if (obj.includes('submarine')) submarineCount++
      if (obj.includes('cruiser')) cruiserCount++
      if (obj.includes('battleship')) battleshipCount++
      if (obj.includes('carrier')) carrierCount++
    }
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom')

    } else {
      enemySquare.classList.add('miss')
    }
    checkForWins()
    currentPlayer = 'enemy'
    if(gameMode === 'singlePlayer') playGameSingle()
  }

  let cpuDestroyerCount = 0
  let cpuSubmarineCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuCarrierCount = 0


  let lastHit = null; // Keep track of the last successful hit
  let consecutiveAttempts = 0;
  const maxNearbyAttempts = 4;
    
    
  function enemyGo() {
    let square;
    
    // Choose the square based on difficulty
    if (gameMode === 'singlePlayer') {
      if (level === 'easy') {
        square = Math.floor(Math.random() * userSquares.length);
      } else if (level === 'medium') {
        square = mediumAIMove(userSquares);
        // square = square.getAttribute('data-id');
      } else if (level === 'hard') {
        square = hardAIMove(userSquares); // Assuming shipSizes is available
      }
    }
    
  
    // Check if the square has not been shot at before
    if (!userSquares[square].classList.contains('boom')) {
      const hit = userSquares[square].classList.contains('taken');
      userSquares[square].classList.add(hit ? 'boom' : 'miss');
  
      // Count destroyed ships
      if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;
      if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++;
      if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
      if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
      if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++;
  
          // If it was a hit, store the square and reset direction checks
    if (hit) {
      lastHit = square;
      consecutiveAttempts = 0;  // Reset consecutive attempts after a hit
      attemptedDirections = []; // Reset attempted directions for the next turn
    } else if (lastHit !== null) {
      // Don't reset `lastHit` yet if there are more directions to try
    } else {
      // lastHit = null; // Reset only when no directions or lastHit is available
      if (level === "medium"){
        lastHit = null;
      }
      consecutiveAttempts = 0;
    }
  
      checkForWins();
    } else if (gameMode === 'singlePlayer') {
      enemyGo(); // Retry if square has been hit
    }
    
    currentPlayer = 'user';
    turnDisplay.innerHTML = 'Your Go';
  }
  let attemptedDirectionsMedium = []; // Track attempted directions

  // Medium AI Move Logic
  function mediumAIMove(playerGrid) {
    if (lastHit) {
      let adjacentSquares = getAdjacentSquares(lastHit, playerGrid);
  
      console.log('Before filtering:', adjacentSquares);
  
      // Filter out squares that have already been hit (class 'boom') or missed (class 'miss')
      adjacentSquares = adjacentSquares.filter(square => {
        const squareElement = playerGrid[square]; 
        console.log(squareElement)
        // Get the corresponding element in the playerGrid
        return !(squareElement?.classList.contains('boom') || squareElement?.classList.contains('miss'));
      });
  
      console.log('After filtering:', adjacentSquares);
  
      // If there are valid adjacent squares, pick the first one
      if (adjacentSquares.length > 0) {
        let chosenSquare = adjacentSquares[0]; // Select the first available adjacent square
        lastHit = chosenSquare; // Update lastHit to the new valid adjacent square
        console.log('Selecting adjacent square:', chosenSquare);
        return chosenSquare;
      }
      
      // If all directions have been tried, reset `lastHit` and start fresh
      lastHit = null;
      attemptedDirectionsMedium = []; // Reset attempted directions after all are tried
    }
  
    // If no last hit or no valid adjacent squares, fallback to random selection
    let availableSquares = playerGrid.filter(square => !square?.classList.contains('boom'));
    let randomSquare = availableSquares[Math.floor(Math.random() * availableSquares.length)];
  
    console.log('Random square:', randomSquare.getAttribute('data-id')); // Log the random square selection
    return randomSquare.getAttribute('data-id'); // Return the actual square ID
  }
  
  // Get adjacent squares (up, down, left, right)
  function getAdjacentSquares(hitSquare, grid) {
    const adjacentSquares = [];
    const rowSize = Math.sqrt(grid.length); // Assuming square grid (e.g., 10x10)
  
    const up = hitSquare - rowSize;
    const down = hitSquare + rowSize;
    const left = hitSquare - 1;
    const right = hitSquare + 1;
  
    // Check if the squares are within grid bounds and not in invalid columns
    if (up >= 0) adjacentSquares.push(up);
    if (down < grid.length) adjacentSquares.push(down);
    if (hitSquare % rowSize !== 0) adjacentSquares.push(left); // Not in the first column
    if ((hitSquare + 1) % rowSize !== 0) adjacentSquares.push(right); // Not in the last column
  
    return adjacentSquares;
  }
  

let attemptedDirections = []; // Track directions that have already been attempted for a hit

function hardAIMove(playerGrid) {
  console.log('=== AI Move Start ===');
  console.log('Last Hit:', lastHit);
  console.log('Consecutive Attempts:', consecutiveAttempts);

  // If we have a previous hit and haven't exhausted nearby attempts
  if (lastHit !== null && consecutiveAttempts < maxNearbyAttempts) {
    let squareIndex = findNextAdjacentSquare(playerGrid, lastHit); // Get the next adjacent square to target
    console.log('Next Adjacent Square:', squareIndex);

    if (squareIndex !== -1) {
      lastHit = squareIndex; // Update last hit
      consecutiveAttempts++; // Increment consecutive attempts count
      console.log('Hitting adjacent square:', squareIndex);
      return squareIndex; // Return the next square index to hit
    } else {
      console.log('No valid adjacent square found. Continuing to check other directions.');
    }
  }

  // Only reset if all adjacent squares have been attempted
  if (attemptedDirections.length === 0 && consecutiveAttempts >= maxNearbyAttempts) {
    consecutiveAttempts = 0; // Reset consecutive attempts
    lastHit = null; // Reset last hit as we're switching strategies
    attemptedDirections = []; // Reset attempted directions
    console.log('Switching to random move');
  }

  // Fallback to random if no nearby valid squares are found
  let availableSquares = playerGrid
    .map((square, index) => ({ square, index })) // Create array of squares with their indexes
    .filter(({ square }) => !square.classList.contains('boom')); // Filter only squares that aren't hit

  if (availableSquares.length === 0) {
    console.log('No available squares left');
    return null; // No available squares left
  }

  let randomIndex = Math.floor(Math.random() * availableSquares.length);
  lastHit = availableSquares[randomIndex].index; // Update last hit with random choice
  console.log('Hitting random square:', availableSquares[randomIndex].index);
  return availableSquares[randomIndex].index; // Return the index of the randomly chosen square
}

// Specialized function to find the next adjacent square to hit around a given hit square
function findNextAdjacentSquare(grid, hitSquare) {
  const directions = ['up', 'down', 'left', 'right'];
  const rowSize = Math.sqrt(grid.length); // Assuming a square grid

  console.log('Attempted Directions (before):', attemptedDirections);

  // If directions haven't been initialized for this hit, start fresh
  if (attemptedDirections.length === 0) {
    attemptedDirections = directions.slice(); // Copy all directions
  }

  // Try each direction that hasn't been attempted yet
  while (attemptedDirections.length > 0) {
    let direction = attemptedDirections.shift(); // Take the next unattempted direction
    let adjacentSquare = getDirectionalSquare(hitSquare, grid, direction, rowSize); // Get square in the specified direction

    console.log('Trying direction:', direction, '-> Adjacent Square:', adjacentSquare);

    // If a valid adjacent square is found that hasn't been hit, return it
    if (adjacentSquare !== -1 && !grid[adjacentSquare].classList.contains('boom')) {
      console.log('Found valid adjacent square in direction:', direction);
      return adjacentSquare;
    }
  }

  console.log('All directions attempted, no valid adjacent squares found');
  // If no valid adjacent squares found, return -1 (fall back to random move)
  return -1;
}

// Helper function to get a square in a specific direction (up, down, left, right) around the current hit
function getDirectionalSquare(hitSquare, grid, direction, rowSize) {
  let adjacentSquare = -1;

  // Check the direction and calculate the corresponding square index
  switch (direction) {
    case 'up':
      adjacentSquare = hitSquare - rowSize; // Move up by row size
      if (adjacentSquare < 0) adjacentSquare = -1; // Out of grid (top)
      break;
    case 'down':
      adjacentSquare = hitSquare + rowSize; // Move down by row size
      if (adjacentSquare >= grid.length) adjacentSquare = -1; // Out of grid (bottom)
      break;
    case 'left':
      adjacentSquare = hitSquare % rowSize !== 0 ? hitSquare - 1 : -1; // Move left, but not from first column
      break;
    case 'right':
      adjacentSquare = (hitSquare + 1) % rowSize !== 0 ? hitSquare + 1 : -1; // Move right, but not from last column
      break;
  }

  // Return -1 if the adjacent square is out of grid bounds
  if (adjacentSquare < 0 || adjacentSquare >= grid.length) return -1;

  return adjacentSquare; // Return valid adjacent square index
}


  function checkForWins() {
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'
    if (destroyerCount === 2) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`
      destroyerCount = 10
    }
    if (submarineCount === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`
      submarineCount = 10
    }
    if (cruiserCount === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`
      cruiserCount = 10
    }
    if (battleshipCount === 4) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`
      battleshipCount = 10
    }
    if (carrierCount === 5) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`
      carrierCount = 10
    }
    if (cpuDestroyerCount === 2) {
      infoDisplay.innerHTML = `${enemy} sunk your destroyer`
      cpuDestroyerCount = 10
    }
    if (cpuSubmarineCount === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your submarine`
      cpuSubmarineCount = 10
    }
    if (cpuCruiserCount === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your cruiser`
      cpuCruiserCount = 10
    }
    if (cpuBattleshipCount === 4) {
      infoDisplay.innerHTML = `${enemy} sunk your battleship`
      cpuBattleshipCount = 10
    }
    if (cpuCarrierCount === 5) {
      infoDisplay.innerHTML = `${enemy} sunk your carrier`
      cpuCarrierCount = 10
    }

    if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
      infoDisplay.innerHTML = "YOU WIN"
      gameOver()
    }
    if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
      infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`
      gameOver()
    }
  }

  function gameOver() {
    isGameOver = true
    startButton.removeEventListener('click', playGameSingle)
  }
})
