import GameObject from './gameObject.js';
import EntidadJuego from './bacteria.js';

let motor; 
let texturaFondo;

async function iniciarJuego() {
    motor = new GameObject();
    await motor.init();
    
    await cargarAssets();
}

async function cargarAssets() {
    console.log("Cargando Assets...");
    const repoPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1); //funcionamiento del github Pages

    try {
        PIXI.Assets.add({alias: 'bacteriaSana', src: `${repoPath}assets/bacteriaSana.json`});
        PIXI.Assets.add({alias: 'fondo', src: `${repoPath}assets/placa_petri.png`});
        PIXI.Assets.add({alias: 'vyrus', src:  `${repoPath}assets/vyrus.json`})
        
        const recursos = await PIXI.Assets.load(['fondo', 'bacteriaSana', 'vyrus']);
        recursos.bacteriaSana.textureSource.scaleMode = 'nearest';
        console.log("¡Assets cargados!");

        texturaFondo = recursos.fondo;
        const fondoSprite = new PIXI.Sprite(texturaFondo);
        fondoSprite.anchor.set(0.5);
        fondoSprite.x = motor.app.screen.width / 2;
        fondoSprite.y = motor.app.screen.height / 2;
        motor.app.stage.addChildAt(fondoSprite, 0); 


        const cantidadBacterias = 150;
        const centroX = motor.app.screen.width / 2;
        const centroY = motor.app.screen.height / 2;
        
        const radioSpawnX = motor.app.screen.width * 0.35;
        const radioSpawnY = motor.app.screen.height * 0.35;

        for (let i = 0; i < cantidadBacterias; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const distancia = Math.random(); 

            const randomX = centroX + Math.cos(angulo) * (radioSpawnX * distancia);
            const randomY = centroY + Math.sin(angulo) * (radioSpawnY * distancia);

            // Creamos las bacterias distribuidas
            new EntidadJuego(randomX, randomY, motor, recursos.bacteriaSana, 'idle');
        } 

        console.log("Objetos en el contenedor general:", motor.gameObjects);

        window.addEventListener('resize', () => {
            fondoSprite.x = motor.app.screen.width / 2;
            fondoSprite.y = motor.app.screen.height / 2;
        });

    } catch (error) {
        console.error("Error en la carga o inicialización:", error);
    }
}

iniciarJuego();