export default class EntidadJuego {
  constructor(x, y, motor, spritesheet, animacionInicial) {
    this.motor = motor;
    this.container = new PIXI.Container();
    
    // FÍSICA BASE
    this.posicion = { x: x, y: y };
    this.velocidad = { x: 0, y: 0 };
    this.aceleracion = { x: 0, y: 0 };
    this.velocidadMaxima = 0.8; // Velocidad baja para las bacterias
    this.radio = 25;
    this.isDead = false;

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

    // Sumar aceleración a la velocidad y aplicar fricción
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

    //Posición futura
    let nuevaX = this.posicion.x + this.velocidad.x;
    let nuevaY = this.posicion.y + this.velocidad.y;

    const centroX = this.motor.app.screen.width / 2;
    const centroY = this.motor.app.screen.height / 2;

    const radioX = this.motor.app.screen.width * 0.40; 
    const radioY = this.motor.app.screen.height * 0.40;

    const dx = nuevaX - centroX;
    const dy = nuevaY - centroY;
    const adentroDelOvalo = (dx ** 2) / (radioX ** 2) + (dy ** 2) / (radioY ** 2);

    //Si toca el borde del óvalo...

    if (adentroDelOvalo > 1) {
      
      // Calculamos la dirección hacia el centro 
      // Esto nos dice con precisión matemática hacia dónde empuja la pared ovalada

      const nx = dx / (radioX * radioX);
      const ny = dy / (radioY * radioY);
      const longitudNormal = Math.sqrt(nx * nx + ny * ny);
      
      // Normalizamos el vector de la pared
      const normalX = nx / longitudNormal;
      const normalY = ny / longitudNormal;

      //Reflejamos el vector de velocidad - Formula de Rebote // DIOS
      const productoPunto = this.velocidad.x * normalX + this.velocidad.y * normalY;
      
      // Solo rebotamos si se está moviendo hacia AFUERA

      if (productoPunto > 0) {
        this.velocidad.x -= 2 * productoPunto * normalX;
        this.velocidad.y -= 2 * productoPunto * normalY;
      }

      //Forzamos una aceleración directa hacia el centro de la placa 
    
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
    // Si se mueve significativamente a la derecha
    if (this.velocidad.x > 0.01) {
      this.cambiarAnimacion('derecha');
    } 
    // Si se mueve significativamente a la izquierda
    else if (this.velocidad.x < -0.01) {
      this.cambiarAnimacion('izquierda');
    } 
    // Si está casi quieta
    else if (Math.abs(this.velocidad.x) < 0.01 && Math.abs(this.velocidad.y) < 0.1) {
      this.cambiarAnimacion('idle');
    }
  }

  iaPatrullaje() {
    this.tiempoParaCambiar--; 
    // Decide su propio rumbo cada cierta cantidad de frames
    if (this.tiempoParaCambiar <= 0) {
      this.tiempoParaCambiar = Math.random() * 120 + 60; // Entre 1 y 3 segundos
      
      if (Math.random() > 0.3) {
        // Direccion Aleatoria
        const angulo = Math.random() * Math.PI * 2;
        this.aceleracion.x = Math.cos(angulo) * 0.3;
        this.aceleracion.y = Math.sin(angulo) * 0.3;
      } else {
        // Se queda quieta un rato
        this.aceleracion.x = 0;
        this.aceleracion.y = 0;
      }
    }
  }

  update() {
    this.iaPatrullaje();
    this.aplicarFisica();
    this.controlarAnimacionPorVelocidad();

    // Render en pantalla
    this.container.x = this.posicion.x;
    this.container.y = this.posicion.y;
    this.container.zIndex = Math.floor(this.posicion.y);
  }
}