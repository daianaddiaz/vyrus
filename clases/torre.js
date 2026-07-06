export default class Torre {
  constructor(x, y, motor, spritesheet, modo = 'escenario') {
    this.motor = motor;
    this.spritesheet = spritesheet;
    this.container = new PIXI.Container();
    
    this.posicion = { x: x, y: y };
    this.container.x = x;
    this.container.y = y;
    
    this.radioCuracion = 150; 
    this.isDead = false;
    this.modo = modo; 

    this.motor.gameObjects.push(this);

    this.spritesAnimados = {};
    const nombresAnimaciones = ['disponible', 'cooldown', 'curando'];

    for (let nombre of nombresAnimaciones) {
      if (spritesheet.animations[nombre]) {
        const anim = new PIXI.AnimatedSprite(spritesheet.animations[nombre]);
        anim.play();
        anim.loop = true;
        anim.animationSpeed = 0.1;
        
        if (modo === 'ui') {
          anim.anchor.set(0.5, 0.5); 
        } else {
          anim.anchor.set(0.5, 0.7); 
        }

        anim.scale.set(2.5); 
        anim.visible = false;
        
        this.spritesAnimados[nombre] = anim;
        this.container.addChild(anim);
      }
    }

    if (this.modo === 'ui') {
      this.motor.containerUI.addChild(this.container);
      this.cambiarAnimacion('disponible');
    } else {
      this.motor.containerPrincipal.addChild(this.container);
      this.cambiarAnimacion('curando');
      this.tiempoVida = 15 * 60; 

      this.container.zIndex = 999; 
    }
  }

  cambiarAnimacion(nombre) {
    if (this.spritesAnimados[nombre]) {
      if (this.animacionActual) this.animacionActual.visible = false;
      this.animacionActual = this.spritesAnimados[nombre];
      this.animacionActual.visible = true;
    }
  }

  empujarEntidadesEnRango() {
    const fuerzaRepulsion = 0.5; 

    for (let obj of this.motor.gameObjects) {
      const esEntidadViva = (obj.isBacteria || obj.isVirus) && !obj.isDead;

      if (esEntidadViva) {
        const dx = obj.posicion.x - this.posicion.x;
        const dy = obj.posicion.y - this.posicion.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < this.radioCuracion && distancia > 0) {
          const nx = dx / distancia;
          const ny = dy / distancia;

          const factorCercania = (this.radioCuracion - distancia) / this.radioCuracion;

          obj.velocidad.x += nx * fuerzaRepulsion * factorCercania;
          obj.velocidad.y += ny * fuerzaRepulsion * factorCercania;

          obj.tiempoParaCambiar = 20; 
        }
      }
    }
  }

  update() {
    if (this.modo === 'ui') return;

    this.tiempoVida--;
    this.empujarEntidadesEnRango();
    this.ejecutarSanidad();

    if (this.tiempoVida <= 0) {
      this.isDead = true;
      this.container.destroy({ children: true });
    }
  }

  ejecutarSanidad() {
    for (let obj of this.motor.gameObjects) {
        // Cura únicamente a los virus comunes (los rojos mutados vivos)
        if (obj.isVirus && !obj.esAlfa && !obj.isDead) {
            
            const dx = obj.posicion.x - this.posicion.x;
            const dy = obj.posicion.y - this.posicion.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < this.radioCuracion) {
                console.log("¡Virus curado y revertido a bacteria!");
                
                // Destruimos el virus
                obj.isDead = true;
                if (obj.container) {
                    obj.container.destroy({ children: true });
                }

                // Spawneamos una bacteria sana
                const algunaBacteria = this.motor.gameObjects.find(o => o.isBacteria);
                if (algunaBacteria) {
                    const BacteriaClase = algunaBacteria.constructor;
                    const recursoSana = PIXI.Assets.get('bacteriaCurada');

                    new BacteriaClase(
                        obj.posicion.x,
                        obj.posicion.y,
                        this.motor,
                        recursoSana,
                        'idle', 
                        true
                    );
                }
            }
        }
    }
  }
}