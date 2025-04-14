function generateCubes() {
    let listOfColors = [];
    fetch("constants.json")
        .then(response => response.json())
        .then(json => listOfColors = json);
    console.log(listOfColors);
    const rainContainer = document.getElementById('rain-container');
    const numCubes = 100;  
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    for (let i = 0; i < numCubes; i++) {
        setTimeout(() => { // Les cubes viennent pas tous en même temps

            const cube = document.createElement('div');
            cube.classList.add('cube');
            
            
            const size = Math.random() * 20 + 10; 
            cube.style.width = `${size}px`;
            cube.style.height = `${size}px`;
            randomNum = Math.floor(Math.random()*listOfColors.length);
            cube.style.backgroundColor = `#${listOfColors[randomNum]}`;
            
            const leftPosition = Math.random() * screenWidth - size/2;
            cube.style.left = `${leftPosition}px`;
            
            const fallDuration = Math.random() * 3 + 7; 
            cube.style.animation = `fall ${fallDuration}s linear infinite`;
            
            rainContainer.appendChild(cube);
            
        }, Math.random() * 9000);
    }
}


document.styleSheets[0].insertRule(`
    @keyframes fall {
        0% {
            transform: translateY(-100px);
            opacity: 1;
        }
        100% {
            transform: translateY(${window.innerHeight + 100}px);
            opacity: 1;
        }
    }
`, 0);


// window.onload = generateCubes;