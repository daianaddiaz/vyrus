
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
        PIXI.Assets.add({alias: 'torreEstatica', src:"../assets/maquina de curacion.json"});
        PIXI.Assets.add({alias: 'torreCurando', src:"../assets/maquina de curacion - heal.json"});
        PIXI.Assets.add({alias: 'torreCooldown', src:"../assets/maquina de curacion cooldown.json"});
        PIXI.Assets.add({alias: 'bacteriaSana', src:"../assets/bacteriaSana.json"});
        PIXI.Assets.add({alias: 'fondo', src:"../assets/placa_petri.png"});
        

        const recursos = await PIXI.Assets.load(['fondo']);

        texturaFondo = recursos.fondo 

        const fondoSprite = new PIXI.Sprite(texturaFondo);
        fondoSprite.anchor.set(0.5);
        fondoSprite.x = app.screen.width / 2;
        fondoSprite.y = app.screen.height / 2;



        app.stage.addChild(fondoSprite);

        const nombreAnimCelula = Object.keys(recursos.spritesheetCelulas.animations)[0];
        animacionCelularSana = recursos.bacteriaSana.animations[nombreAnimCelula];

        const nombreAnimVirus = Object.keys(recursos.spritesheetVirus.animations)[0];
        animacionVirus = recursos.spritesheetVirus.animations[nombreAnimVirus];

        window.addEventListener('resize', () => {
            fondoSprite.x = app.screen.width / 2;
            fondoSprite.y = app.screen.height / 2;
        });

    }catch (error) {
        console.error("Error cargando los assets del juego:", error);
    }
}

// Arrancar el juego cuando cargue la página
window.onload = iniciarJuego;