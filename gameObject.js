
export default class GameObject {
  constructor() {
    this.app = new PIXI.Application();
    this.gameObjects = [];
    this.containerPrincipal = null;
  }

 
  async init() {
    await this.app.init({
      resizeTo: window,           
      backgroundColor: 0x030508, 
      antialias: true,           
      resolution: window.devicePixelRatio || 1,  
    });

  
    const contenedorHTML = document.getElementById('game-container');
    if (contenedorHTML) {
      contenedorHTML.appendChild(this.app.canvas);
    } else {
      document.body.appendChild(this.app.canvas);
    }

    this.containerPrincipal = new PIXI.Container();
    this.containerPrincipal.sortableChildren = true;
    this.app.stage.addChild(this.containerPrincipal);

    this.app.ticker.add(() => this.update());

    console.log("¡Motor GameObject inicializado!");
  }

  update() {
    for (let i = this.gameObjects.length - 1; i >= 0; i--) {
      const obj = this.gameObjects[i];
      if (obj.isDead) {
        this.gameObjects.splice(i, 1);
      } else {
        if (typeof obj.update === 'function') {
          obj.update(); 
        }
      }
    }

    this.resolverColisiones();

    if (this.containerPrincipal) {
      this.containerPrincipal.sortChildren();
    }
  }

  resolverColisiones() {
    const objetos = this.gameObjects;
    
    for (let i = 0; i < objetos.length; i++) {
      for (let j = i + 1; j < objetos.length; j++) {
        const b1 = objetos[i];
        const b2 = objetos[j];

        if (b1.isDead || b2.isDead || !b1.radio || !b2.radio) continue;

        const dx = b2.posicion.x - b1.posicion.x;
        const dy = b2.posicion.y - b1.posicion.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        const distanciaMinima = b1.radio + b2.radio;

        if (distancia < distanciaMinima) {
          
          const sobreposicion = distanciaMinima - distancia;
          
          const nx = distancia > 0 ? dx / distancia : 1;
          const ny = distancia > 0 ? dy / distancia : 0;

          b1.posicion.x -= nx * (sobreposicion * 0.4);
          b1.posicion.y -= ny * (sobreposicion * 0.4);
          
          b2.posicion.x += nx * (sobreposicion * 0.4);
          b2.posicion.y += ny * (sobreposicion * 0.4);

          const kx = b1.velocidad.x - b2.velocidad.x;
          const ky = b1.velocidad.y - b2.velocidad.y;
          const p = nx * kx + ny * ky;

          if (p > 0) { 
            b1.velocidad.x -= nx * p;
            b1.velocidad.y -= ny * p;
            b2.velocidad.x += nx * p;
            b2.velocidad.y += ny * p;
            
            b1.tiempoParaCambiar = Math.random() * 30;
            b2.tiempoParaCambiar = Math.random() * 30;
          }
        }
      }
    }
  }
}