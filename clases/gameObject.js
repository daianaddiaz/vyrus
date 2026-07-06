
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

    this.tiempoRestante = 60;
    this.acumuladorTiempo = 0;
    this.juegoTerminado = false;


    const contenedorHTML = document.getElementById('game-container');
    if (contenedorHTML) {
      contenedorHTML.appendChild(this.app.canvas);
    } else {
      document.body.appendChild(this.app.canvas);
    }

    this.containerPrincipal = new PIXI.Container();
    this.containerPrincipal.sortableChildren = true;
    this.app.stage.addChild(this.containerPrincipal);

    this.containerUI = new PIXI.Container();
    this.app.stage.addChild(this.containerUI);


    this.app.ticker.add(() => this.update());

    console.log("¡Motor GameObject inicializado!");
  }

  update() {
    if (this.juegoTerminado) return; 
    
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
    this.actualizarBarraCaos();

    
    this.acumuladorTiempo += this.app.ticker.elapsedMS;
    
    if (this.acumuladorTiempo >= 1000) { 
      this.tiempoRestante--;
      this.acumuladorTiempo -= 1000;
      
      this.actualizarRelojUI();

      if (this.tiempoRestante <= 0) {
        this.desatarVictoria();
      }
    }

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

        // Ignorar si están muertas o no tienen radio de colisión
        if (b1.isDead || b2.isDead || !b1.radio || !b2.radio) continue;

        
       
        if ((b1.isBacteria && !b2.isBacteria) || (!b1.isBacteria && b2.isBacteria)) continue;

        // Distancia geométrica entre los centros
        const dx = b2.posicion.x - b1.posicion.x;
        const dy = b2.posicion.y - b1.posicion.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        
        const distanciaMinima = b1.radio + b2.radio;

        
        if (distancia < distanciaMinima) {
          
         
          const sobreposicion = distanciaMinima - distancia;
          
          // Vectores de dirección del impacto 
          const nx = distancia > 0 ? dx / distancia : 1;
          const ny = distancia > 0 ? dy / distancia : 0;

          // Separación física inmediata
          b1.posicion.x -= nx * (sobreposicion * 0.5);
          b1.posicion.y -= ny * (sobreposicion * 0.5);
          
          b2.posicion.x += nx * (sobreposicion * 0.5);
          b2.posicion.y += ny * (sobreposicion * 0.5);

          // Efecto rebote
          const kx = b1.velocidad.x - b2.velocidad.x;
          const ky = b1.velocidad.y - b2.velocidad.y;
          const p = nx * kx + ny * ky;

          if (p > 0) { // Solo rebotan si se están moviendo una hacia la otra
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


  actualizarBarraCaos() {
    let totalBacterias = 0;
    let totalVirus = 0;

    for (let obj of this.gameObjects) {
      if (!obj.isDead) {
        if (obj.isBacteria) totalBacterias++;
        else totalVirus++;
      }
    }

    const totalEntidades = totalBacterias + totalVirus;
    if (totalEntidades === 0) return;

    const porcentajeCaos = (totalVirus / totalEntidades) * 100;

    const barraFill = document.getElementById('caos-bar-fill');
    if (barraFill) {
      barraFill.style.width = `${porcentajeCaos}%`;
    }

    if (porcentajeCaos >= 100) {
      this.desatarGameOver();
    }
  }

  desatarGameOver() {
    this.juegoTerminado = true;
    this.app.ticker.stop()

   
    const screenGameOver = document.getElementById('game-over-screen');
    if (screenGameOver) {
      screenGameOver.style.display = 'flex';
    }

    
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart && !btnRestart.dataset.listener) {
      btnRestart.dataset.listener = "true"; 
      btnRestart.addEventListener('click', () => {
        this.reiniciarNivel();
      });
    }
  }

  reiniciarNivel() {
    console.log("Reiniciando el laboratorio...");  
    document.getElementById('game-over-screen').style.display = 'none';
   
    for (let obj of this.gameObjects) {
      if (obj.container) {
        obj.container.destroy({ children: true });
      }
    }
    
    this.gameObjects = [];
    document.getElementById('caos-bar-fill').style.width = '0%';

    window.location.reload();
  }

  actualizarRelojUI() {
    const reloj = document.getElementById('cronometro');
    if (reloj) {
      const segundosFormateados = this.tiempoRestante < 10 ? `0${this.tiempoRestante}` : this.tiempoRestante;
      reloj.innerText = `00:${segundosFormateados}`;
    }
  }

  desatarVictoria() {
    this.juegoTerminado = true;
    this.app.ticker.stop();

    if (typeof window.finalizarYCalcularRanking === 'function') {
        window.finalizarYCalcularRanking();
    } else {
        // Alternativa por si no se exportó globalmente
        console.log("¡Victoria! Registrando el fin de la partida.");
    }

    const screenVictory = document.getElementById('victory-screen');
    if (screenVictory) {
      screenVictory.style.display = 'flex';
    }
    
    const btnRestartVictory = document.getElementById('btn-restart-victory');
    if (btnRestartVictory && !btnRestartVictory.dataset.listener) {
      btnRestartVictory.dataset.listener = "true";
      btnRestartVictory.addEventListener('click', () => {
        console.log("Reiniciando desde la victoria...");
        window.location.reload();
      });
    }

    console.log("¡GANASTE! Sobreviviste los 60 segundos.");
  }

}