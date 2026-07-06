export default class Virus {
    constructor(x, y, motor, spritesheet, esAlfa = false) {
        this.motor = motor;
        this.spritesheet = spritesheet;
        this.container = new PIXI.Container();

       
        this.posicion = { x: x, y: y };
        this.velocidad = { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 };
        this.aceleracion = { x: 0, y: 0 };
        this.radio = 15;
        this.isDead = false;
        this.isVirus = true;
        this.estaAtacando = false;

        
        this.esAlfa = esAlfa;
        if (this.esAlfa) {
            this.velocidadMaxima = 3.5; 
            this.colorTinte = 0xB130FC;  
        } else {
            this.velocidadMaxima = 1.8; 
            this.colorTinte = 0xFF5555;  
        }

        this.tiempoParaCambiar = 0;

        this.motor.gameObjects.push(this);
        this.motor.containerPrincipal.addChild(this.container);

        
        this.spritesAnimados = {};
        this.todasLasClavesDisponibles = Object.keys(spritesheet.animations);

        for (let key of this.todasLasClavesDisponibles) {
            const anim = new PIXI.AnimatedSprite(spritesheet.animations[key]);
            anim.play();
            anim.loop = true;
            anim.animationSpeed = 0.12; 
            anim.anchor.set(0.5, 1);
            anim.scale.set(this.esAlfa ? 2.5 : 2); 
            anim.tint = this.colorTinte;
            anim.visible = false;
            this.spritesAnimados[key] = anim;
            this.container.addChild(anim);
        }

        this.animacionActual = null;
        this.direccionMirada = 'ataqueDerecha'; 

        
        this.cambiarAnimacion('ataqueIzquierda');
    }

    cambiarAnimacion(cual) {
        
        if (!this.spritesAnimados[cual]) {
            cual = this.todasLasClavesDisponibles[0];
        }
        if (this.animacionActual === cual) return;
        
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

        const velocidadLineal = Math.sqrt(this.velocidad.x ** 1.5 + this.velocidad.y ** 1.5);
        if (velocidadLineal > this.velocidadMaxima) {
            const factor = this.velocidadMaxima / velocidadLineal;
            this.velocidad.x *= factor;
            this.velocidad.y *= factor;
        }

        this.posicion.x += this.velocidad.x;
        this.posicion.y += this.velocidad.y;
    }

    controlarLimitesPlaca() {
        const centroX = this.motor.app.screen.width / 2;
        const centroY = this.motor.app.screen.height / 2;
        
        const radioX = this.motor.app.screen.width * 0.35; 
        const radioY = this.motor.app.screen.height * 0.35;

        const dx = this.posicion.x - centroX;
        const dy = this.posicion.y - centroY;
        
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
            this.aceleracion.x = Math.cos(anguloAlCentro) * 0.5;
            this.aceleracion.y = Math.sin(anguloAlCentro) * 0.5;

            this.tiempoParaCambiar = Math.random() * 40 + 20; 

            this.posicion.x = centroX + (dx / Math.sqrt(adentroDelOvalo)) * 0.99;
            this.posicion.y = centroY + (dy / Math.sqrt(adentroDelOvalo)) * 0.99;
        }
    }

    iaPersecucion() {
        this.tiempoParaCambiar--;
        if (this.tiempoParaCambiar <= 0) {
            this.tiempoParaCambiar = Math.random() * 60 + 30;

            let objetivoCercano = null;
            let distanciaMinima = Infinity;

            for (let obj of this.motor.gameObjects) {
                if (obj.isBacteria && !obj.isDead && !obj.modoZombieActivo && !obj.esCurada) {
                    const dx = obj.posicion.x - this.posicion.x;
                    const dy = obj.posicion.y - this.posicion.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < distanciaMinima) {
                        distanciaMinima = dist;
                        objetivoCercano = obj;
                    }
                }
            }

            if (objetivoCercano) {
                const angulo = Math.atan2(objetivoCercano.posicion.y - this.posicion.y, objetivoCercano.posicion.x - this.posicion.x);
                const fuerza = this.esAlfa ? 0.8 : 0.5;
                this.aceleracion.x = Math.cos(angulo) * fuerza;
                this.aceleracion.y = Math.sin(angulo) * fuerza;
            } else {
                const angulo = Math.random() * Math.PI * 2;
                this.aceleracion.x = Math.cos(angulo) * 0.3;
                this.aceleracion.y = Math.sin(angulo) * 0.3;
            }
        }
    }

    ejecutarAtaque() {

        if (this.estaAtacando) return; // Evita spamear el ataque si ya lo está haciendo
            this.estaAtacando = true;
            const lado = this.velocidad.x >= 0 ? 'Derecha' : 'Izquierda';
            this.cambiarAnimacion(`ataque${lado}`);
            setTimeout(() => {
            this.estaAtacando = false;
        }, 500); 
}

    propagarInfeccion() {
    const radioContagio = 30; 
    const fuerzaRebote = 3.5;  

    for (let obj of this.motor.gameObjects) {
        if (obj.isBacteria && !obj.isDead) {
            const dx = obj.posicion.x - this.posicion.x;
            const dy = obj.posicion.y - this.posicion.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

           
            if (distancia < radioContagio) {

                obj.nuncaTocadaPorVirus = false; // saco el invicto
                // direccion del impacto            
                const nx = distancia > 0 ? dx / distancia : Math.random() - 0.5;
                const ny = distancia > 0 ? dy / distancia : Math.random() - 0.5;

                // fuerza de separacion 
                this.velocidad.x = -nx * fuerzaRebote;
                this.velocidad.y = -ny * fuerzaRebote;

                // Opcional: A la bacteria también la empujamos un poquito hacia adelante para que se note el choque
                obj.velocidad.x += nx * (fuerzaRebote * 0.5);
                obj.velocidad.y += ny * (fuerzaRebote * 0.5);

                //reset del patrullaje 
                this.tiempoParaCambiar = Math.random() * 30 + 15;

                if (!obj.modoZombieActivo && !obj.esCurada) {
                    console.log("¡Mutación iniciada por contacto!");
                    obj.modoZombieActivo = true;
                    if (typeof this.ejecutarAtaque === 'function') {
                        this.ejecutarAtaque();
                    }
                }
            }
        }
    }
}

   
    controlarAnimacionPorVelocidad() {
       if (this.estaAtacando) return;

        if (this.velocidad.x > 0.5) {
            this.direccionMirada = 'Derecha';
        } else if (this.velocidad.x < -0.2) {
            this.direccionMirada = 'Izquierda';
        }

        
        const claveDeseada = `idle${this.direccionMirada}`;
        this.cambiarAnimacion(claveDeseada);
    }

    
    update() {
        this.iaPersecucion();
        this.aplicarFisica();
        this.controlarLimitesPlaca();
        this.propagarInfeccion();
        this.controlarAnimacionPorVelocidad();

        // Renderizado
        this.container.x = this.posicion.x;
        this.container.y = this.posicion.y;
        this.container.zIndex = Math.floor(this.posicion.y);
    }
}