import GameObject from './gameObject.js';
import EntidadJuego from './bacteria.js';
import Virus from './virus.js';
import Torre from './torre.js';

let motor; 
let texturaFondo;
let spritesheetVirus;
let spritesheetTorre;

async function iniciarJuego() {
    motor = new GameObject();
    await motor.init();
    await cargarAssets();
}

async function cargarAssets() {
    console.log("Cargando Assets...");
    const esLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const repoPath = esLocal ? "./" : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

    try {
        PIXI.Assets.add({alias: 'bacteriaSana', src: `${repoPath}assets/bacteriaSana.json`});
        PIXI.Assets.add({alias: 'fondo', src: `${repoPath}assets/placa_petri.png`});
        PIXI.Assets.add({alias: 'vyrus', src: `${repoPath}assets/vyrus.json`});
        PIXI.Assets.add({alias: 'torreAsset', src: `${repoPath}assets/torre.json`});
        
        const recursos = await PIXI.Assets.load(['fondo', 'bacteriaSana', 'vyrus', 'torreAsset']);
        recursos.bacteriaSana.textureSource.scaleMode = 'nearest';
        recursos.vyrus.textureSource.scaleMode = 'nearest';
        recursos.torreAsset.textureSource.scaleMode = 'nearest'; // Pixel art limpio
        
        console.log("¡Assets cargados con éxito!");

        spritesheetVirus = recursos.vyrus;
        spritesheetTorre = recursos.torreAsset;
        Virus.prototype.spritesheetGlobal = spritesheetVirus;

        // Fondo del escenario
        texturaFondo = recursos.fondo;
        const fondoSprite = new PIXI.Sprite(texturaFondo);
        fondoSprite.anchor.set(0.5);
        fondoSprite.x = motor.app.screen.width / 2;
        fondoSprite.y = motor.app.screen.height / 2;
        motor.app.stage.addChildAt(fondoSprite, 0); 

        // Spawn de Bacterias (150 iniciales en la placa)
        const cantidadBacterias = 100;
        const centroX = motor.app.screen.width / 2;
        const centroY = motor.app.screen.height / 2;
        const radioSpawnX = motor.app.screen.width * 0.35;
        const radioSpawnY = motor.app.screen.height * 0.35;

        for (let i = 0; i < cantidadBacterias; i++) {
            const angulo = Math.random() * Math.PI * 2;
            const distancia = Math.random(); 
            const randomX = centroX + Math.cos(angulo) * (radioSpawnX * distancia);
            const randomY = centroY + Math.sin(angulo) * (radioSpawnY * distancia);
            new EntidadJuego(randomX, randomY, motor, recursos.bacteriaSana, 'idle');
        } 

        
        const virusInicialX = centroX - (radioSpawnX * 0.8);
        const virusInicialY = centroY;
        new Virus(virusInicialX, virusInicialY, motor, spritesheetVirus, true);

       //boton de la torre

        crearBotonTorreUI();

        window.addEventListener('resize', () => {
            fondoSprite.x = motor.app.screen.width / 2;
            fondoSprite.y = motor.app.screen.height / 2;
        });

    } catch (error) {
        console.error("Error en la carga o inicialización:", error);
    }
}

        // drag and drop
function crearBotonTorreUI() {
    const posX = motor.app.screen.width / 2;
    const posY = motor.app.screen.height - 60; 

    
    const botoneraFondo = new PIXI.Graphics();
    botoneraFondo.beginFill(0x111111, 0.7); 
    botoneraFondo.lineStyle(3, 0x33ff33, 1); 
    botoneraFondo.drawRoundedRect(-75, -75, 150, 150, 8);
    botoneraFondo.endFill();

    const torreUI = new Torre(posX, posY, motor, spritesheetTorre, 'ui');
    
    torreUI.container.addChildAt(botoneraFondo, 0);

    
    torreUI.container.eventMode = 'static';
    torreUI.container.cursor = 'pointer';

    let torreFantasma = null; 
    let enCooldown = false;
    let tiempoCooldown = 0;

    
    torreUI.container.on('pointerdown', (event) => {
        if (enCooldown || motor.juegoTerminado) return;

        // Creamos la previsualización semitransparente que sigue al puntero
        torreFantasma = new PIXI.AnimatedSprite(spritesheetTorre.animations['curando']);
        torreFantasma.anchor.set(0.5);
        torreFantasma.scale.set(2.5);
        torreFantasma.alpha = 0.6; 
        
        // Lo metemos en el contenedor superior de la UI para que viaje por encima de las bacterias
        motor.containerUI.addChild(torreFantasma);

        const posGlobal = event.global;
        torreFantasma.x = posGlobal.x;
        torreFantasma.y = posGlobal.y;
    });

    // EVENTO: Mover el fantasma con el mouse/dedo por el escenario
    motor.app.stage.eventMode = 'static';
    motor.app.stage.on('pointermove', (event) => {
        if (torreFantasma) {
            torreFantasma.x = event.global.x;
            torreFantasma.y = event.global.y;
        }
    });

    // EVENTO: Soltar y plantar la estructura táctica
    const soltarTorre = () => {
        if (!torreFantasma) return;

        const xFinal = torreFantasma.x;
        const yFinal = torreFantasma.y;

        // Validar distancia de seguridad con el Virus Alfa (Paciente Cero)
        let zonaBloqueada = false;
        const radioExclusionAlfa = 100; // Campo de fuerza que repele las torres

        for (let obj of motor.gameObjects) {
            if (obj.isVirus && obj.esAlfa && !obj.isDead) {
                const dx = xFinal - obj.posicion.x;
                const dy = yFinal - obj.posicion.y;
                const distanciaAlAlfa = Math.sqrt(dx * dx + dy * dy);

                if (distanciaAlAlfa < radioExclusionAlfa) {
                    zonaBloqueada = true;
                    break;
                }
            }
        }

        // Si interfiere con el campo del Alfa, se cancela la acción y se conserva el tiro
        if (zonaBloqueada) {
            console.log("❌ ZONA INHIBIDA: El Virus Alfa interfiere con la torre de sanidad.");
            torreFantasma.destroy();
            torreFantasma = null;
            return; 
        }

        // Si la zona es segura, destruimos el fantasma y plantamos la torre física
        torreFantasma.destroy();
        torreFantasma = null;

        new Torre(xFinal, yFinal, motor, spritesheetTorre, 'escenario');

        // ⏳ Activamos el cooldown de la botonera por 20 segundos (1200 frames a 60 FPS)
        enCooldown = true;
        tiempoCooldown = 10 * 60;
        torreUI.cambiarAnimacion('cooldown');

        const chequearCooldown = () => {
            if (!motor.juegoTerminado) {
                tiempoCooldown--;
                
                if (tiempoCooldown <= 0) {
                    enCooldown = false;
                    torreUI.cambiarAnimacion('disponible');
                    motor.app.ticker.remove(chequearCooldown);
                }
            }
        };
        motor.app.ticker.add(chequearCooldown);
    };

    motor.app.stage.on('pointerup', soltarTorre);
    motor.app.stage.on('pointerupoutside', soltarTorre);
}

iniciarJuego();