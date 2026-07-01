
let app;

async function iniciarJuego() {
    
    app = new PIXI.Application();
    
    await app.init({
        resizeTo: window,           
        backgroundColor: 0x0c0c14,  
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
   
    console.log("Listo para cargar assets...");
}


window.onload = iniciarJuego;       