export default class EntidadJuego {
  constructor(x, y, motor, spritesheet, animacionInicial, esCurada = false) {
    this.motor = motor;
    this.container = new PIXI.Container();
    
    // Fisicas Basicas
    
    this.posicion = { x: x, y: y };
    this.velocidad = { x: 0, y: 0 };
    this.aceleracion = { x: 0, y: 0 };
    this.velocidadMaxima = 0.8; 
    this.radio = 15;
    this.isDead = false;
    this.isBacteria = true;
    this.modoZombieActivo = false; 

    // Logica de Vida

    this.esCurada = esCurada; 
    if (this.esCurada) {
      this.tiempoVidaRestante = 5 * 60; // 5 segundos exactos a 60 FPS
      this.container.alpha = 0.8; // Un toque sutil de transparencia para identificarlas
    }

    // IA DE MOVIMIENTO ALEATORIO
    this.tiempoParaCambiar = 0;

    this.motor.gameObjects.push(this);
    this.motor.containerPrincipal.addChild(this.container);

    this.spritesAnimados = {};
    for (let key of Object.keys(spritesheet.animations)) {
      const anim = new PIXI.AnimatedSprite(spritesheet.animations[key]);
      anim.play();
      anim.loop = true;
      anim.animationSpeed = 0.08; 
      anim.anchor.set(0.5, 1);
      anim.scale.set(3); 
      anim.visible = false;
      this.spritesAnimados[key] = anim;
      this.container.addChild(anim);
    }

    this.animacionActual = null;
    this.cambiarAnimacion(animacionInicial);
  }

  cambiarAnimacion(cual) {
    if (!this.spritesAnimados[cual] || this.animacionActual === cual) return;
    if (this.spritesAnimados[this.animacionActual]) {
      this.spritesAnimados[this.animacionActual].visible = false;
    }
    this.animacionActual = cual;
    this.spritesAnimados[cual].visible = true;
  }

  aplicarFisica() {
    this.velocidad.x += this.aceleracion.x;
    this.velocidad.y += this.aceleracion.y;
    this.aceleracion.x = 0;
    this.aceleracion.y = 0;

    this.velocidad.x *= 0.98;
    this.velocidad.y *= 0.98;

    const velocidadLineal = Math.sqrt(this.velocidad.x ** 2 + this.velocidad.y ** 2);
    if (velocidadLineal > this.velocidadMaxima) {
      const factor = this.velocidadMaxima / velocidadLineal;
      this.velocidad.x *= factor;
      this.velocidad.y *= factor;
    }

    let nuevaX = this.posicion.x + this.velocidad.x;
    let nuevaY = this.posicion.y + this.velocidad.y;

    const centroX = this.motor.app.screen.width / 2;
    const centroY = this.motor.app.screen.height / 2;
    const radioX = this.motor.app.screen.width * 0.40; 
    const radioY = this.motor.app.screen.height * 0.40;

    const dx = nuevaX - centroX;
    const dy = nuevaY - centroY;
    const adentroDelOvalo = (dx ** 2) / (radioX ** 2) + (dy ** 2) / (radioY ** 2);

    if (adentroDelOvalo > 1) {
      const nx = dx / (radioX * radioX);
      const ny = dy / (radioY * radioY);
      const longitudNormal = Math.sqrt(nx * nx + ny * ny);
      
      const normalX = nx / longitudNormal;
      const normalY = ny / longitudNormal;

      const productoPunto = this.velocidad.x * normalX + this.velocidad.y * normalY;
      
      if (productoPunto > 0) {
        this.velocidad.x -= 2 * productoPunto * normalX;
        this.velocidad.y -= 2 * productoPunto * normalY;
      }

      const anguloAlCentro = Math.atan2(centroY - this.posicion.y, centroX - this.posicion.x);
      this.aceleracion.x = Math.cos(anguloAlCentro) * 0.4;
      this.aceleracion.y = Math.sin(anguloAlCentro) * 0.4;

      this.tiempoParaCambiar = Math.random() * 60 + 60; 

      nuevaX = centroX + (dx / Math.sqrt(adentroDelOvalo)) * 0.99;
      nuevaY = centroY + (dy / Math.sqrt(adentroDelOvalo)) * 0.99;
    }

    this.posicion.x = nuevaX;
    this.posicion.y = nuevaY;
  }

  controlarAnimacionPorVelocidad() {
    if (this.velocidad.x > 0.01) {
      this.cambiarAnimacion('derecha');
    } else if (this.velocidad.x < -0.01) {
      this.cambiarAnimacion('izquierda');
    } else if (Math.abs(this.velocidad.x) < 0.01 && Math.abs(this.velocidad.y) < 0.1) {
      this.cambiarAnimacion('idle');
    }
  }

  iaPatrullaje() {
    this.tiempoParaCambiar--; 
    if (this.tiempoParaCambiar <= 0) {
      this.tiempoParaCambiar = Math.random() * 120 + 60;
      
      if (Math.random() > 0.3) {
        const angulo = Math.random() * Math.PI * 2;
        this.aceleracion.x = Math.cos(angulo) * 0.3;
        this.aceleracion.y = Math.sin(angulo) * 0.3;
      } else {
        this.aceleracion.x = 0;
        this.aceleracion.y = 0;
      }
    }
  }

  update() {

    if (this.esCurada) {
    this.tiempoVidaRestante--;
    
    // Efecto parpadeo opcional en el último segundo para avisar que se le va el escudo

    if (this.tiempoVidaRestante < 60 && this.tiempoVidaRestante % 10 < 5) {
        this.container.alpha = 0.3; 
    } else {
        this.container.alpha = 1.0;
    }

    if (this.tiempoVidaRestante <= 0) {
        console.log("¡Escudo agotado! Reinvocando como bacteria común contagiable.");
        
        const recursoSana = PIXI.Assets.get('bacteriaSana'); 
        const BacteriaClase = this.constructor; 

        new BacteriaClase(
            this.posicion.x,
            this.posicion.y,
            this.motor,
            recursoSana,
            'idle', 
            false // Nace expuesta al contagio
        );

        this.isDead = true;
        if (this.container) {
            this.container.destroy({ children: true });
        }
        return;
    }
}

    this.iaPatrullaje();
    this.aplicarFisica();
    this.controlarAnimacionPorVelocidad();

   if (this.modoZombieActivo && !this.isDead) {
        this.isDead = true;
        if (this.container) {
            this.container.destroy({ children: true });
        }

        const primerVirus = this.motor.gameObjects.find(o => o.isVirus);
        if (primerVirus) {
            const VirusClase = primerVirus.constructor;
            new VirusClase(
                this.posicion.x, 
                this.posicion.y, 
                this.motor, 
                primerVirus.spritesheet, 
                false
            );
        }
        return; 
    } 

    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
    this.container.zIndex = Math.floor(this.posicion.y);
  }
}