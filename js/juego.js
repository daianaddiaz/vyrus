
let app;


let texturaFondo;
let animacionCelularSanaCeleste = [];
let animacionCelularVerde = [];
let animacionVirus = [];
let animacionTorre = [];
let texturaMuro;


async function iniciarJuego() {
    
    app = new PIXI.Application();
    
    await app.init({
        resizeTo: window,           
        backgroundColor: 197920,  
        antialias: true,           
        resolution: window.devicePixelRatio || 1,  
    });

    
    document.getElementById('game-container').appendChild(app.canvas);

    console.log("¡Pixi.js inicializado a pantalla completa!");

   
    window.addEventListener('resize', () => {
       
        console.log(`Nueva resolución: ${app.screen.width}x${app.screen.height}`);
    });

   
    await cargarAssets();
}

async function cargarAssets() {
   
    console.log("Cargando Assets...");

    try {
        PIXI.Assets.add({alias: 'torreEstatica', src:"../assets/maquina de curacion.json"})
        PIXI.Assets.add({alias: 'torreCurando', src:"../assets/maquina de curacion - heal.json"})
        PIXI.Assets.add({alias: 'torreCooldown', src:"../assets/maquina de curacion cooldown.json"})
        PIXI.Assets.add({alias: 'bacteriaVerdeDireccion', src:"../assets/Salto derecha abajo celeste.json"})
    }
}


window.onload = iniciarJuego;       