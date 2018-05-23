var canvas, context, juego, contador, invasion, num_topos;
const nivel = 1;

function init() {
    // Defino el canvas
    canvas = document.getElementById( 'juego' );
    context = canvas.getContext( '2d' );

    // Obtengo elementos del DOM
    contador = document.getElementById( 'contador' );
    invasion = document.getElementById( 'invasion' );
    constructores = document.getElementById( 'constructores' );
    num_topos = document.getElementById( 'num_topos' );

    // Imágenes
    imgTopo = new Image();
    imgTopo.src = 'img/topo.png';
    imgReloj = new Image();
    imgReloj.src = 'img/reloj_arena.png';
    imgTrampa = new Image();
    imgTrampa.src = 'img/trampa_topo.png';
    imgPala = new Image();
    imgPala.src = 'img/pala.png';

    // Sonidos
    // Música de fondo
    musica = new Howl({
        src: ['music/forest.mp3'],
        loop: true
    });

    // Sonido hit
    sonidoHit = new Howl({
        src: ['sounds/hit05.mp3.flac'],
        loop: false
    });

    // Sonido pala
    sonidoPala = new Howl({
        src: ['sounds/interface3.wav'],
        loop: false
    });

    // Sonido tiempo
    sonidoTiempo = new Howl({
        src: ['sounds/qubodup-SlowDown.ogg'],
        loop: false
    });

    // Sonido trampa
    sonidoTrampa = new Howl({
        src: ['sounds/interface1.wav'],
        loop: false
    });

    // Sonido coger item
    sonidoItem = new Howl({
        src: ['sounds/chainmail1.wav'],
        loop: false
    });

    musica.play();

    // Creo el juego
    juego = new Juego(nivel);
    juego.init();

    // Inicio el bucle principal del juego
    setInterval(function(){
        main();
    }, 1000/juego.FPS);
}

function main() {
    // Reinicio el canvas
    juego.borraCanvas();
    juego.pintarEscenario();

    // Contabilizo los frames
    if( !juego.finJuego() ) {
        juego.contador++;
    }
}

function Juego(nivel) {
    // VARIABLES
    // Variables pasadas por parámetro
    this.nivel = nivel;

    // Variables configurables del juego
    this.FPS = 100;
    this.niveles = [
        {velocidad: 1, toperas: 2, topos: 40, tiempo: 60},
        {velocidad: 2, toperas: 3, topos: 50, tiempo: 80},
        {velocidad: 3, toperas: 4, topos: 60, tiempo: 100},
        {velocidad: 4, toperas: 4, topos: 70, tiempo: 120},
        {velocidad: 5, toperas: 5, topos: 80, tiempo: 140}
    ];
    this.maxInvasion = 8;
    this.estadoConstruccionTopera = 10;
    this.escenario = {
        tablero: [
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,2,0,2,0,2,0,2,0,2,0,0],
        ],
        anchoCelda: canvas.width / 12,
        altoCelda: canvas.height / 9,
        colores: {
            fondoTablero: '#FFFFFF',
            fondoItem: '#EFEFEF',
            colorTexto: '#333333',
            destacado: 'FFBF00'
        },
        fuentes: {
            textoTeclas: "12px Arial"
        },
        teclas: ['Q', 'W', 'E', 'R', 'T']
    };
    this.bonus = [
        quitarTopera = {
            icono: imgPala,
            tipo: 'asignacion',
            accion: function() {
                juego.quitarTopera();
            }
        },
        trampaTopos = {
            icono: imgTrampa,
            tipo: 'asignacion',
            accion: function() {
                juego.trampaTopos();
            }
        },
        bonusTiempo = {
            icono: imgReloj,
            tipo: 'directo',
            accion: function() {
                juego.bonusTiempo();
            }
        }
    ]

    // Variables dinámicas del juego
    this.velocidad = (this.FPS * 2) - (this.niveles[this.nivel - 1].velocidad * 10);
    this.contador = 0;
    this.ciclo = 0;
    this.topos = [];
    this.toperas = [];
    this.items = [];
    this.accion = null;

    // CONSTRUCTOR
    this.init = function() {
        // Defino las toperas
        for (let index = 0; index < this.niveles[this.nivel-1].toperas; index++) {
            this.addTopera();
        }

        // Creo los topos marcados por el nivel
        for (let index = 0; index < this.niveles[this.nivel-1].topos; index++) {
            this.topos.push( new Topo() );
        }

        // Nombro al último topo constructor
        let topo = this.topos.pop();
        topo.constructor = 1;
        this.topos.push( topo );

        // Creo un escuchador de evento para el mouse en el canvas
        canvas.addEventListener( 'mousedown', event => {
            let x = event.layerX;
            let y = event.layerY;

            this.hitTopo(x, y);
        } );

        // Creo un escuchador de evento para las teclas de acción
        document.addEventListener( 'keydown', event => {
            let key = event.key;
            if( juego.escenario.teclas.indexOf(key.toUpperCase()) != -1) {
                this.useItem(key);
            }            
        } )

        // Asigno teclas a posiciones
        var filas = 0;
        this.escenario.tablero.forEach(fila => {
            var columnas = 0;
            fila.forEach(columna => {
                switch (columna) {
                    // Items
                    case 2:
                        this.items.push( {x: columnas, y: filas, item: 0} );
                        break;
                }
                columnas++;
            });
            filas++;
        });
    }

    // MÉTODOS
    // Reinicia el canvas vacío
    this.borraCanvas = function() {
        canvas.width = 1200;
        canvas.height = 800;
    }

    // Actualiza el contador de tiempo
    this.actualizaContador = function() {
        contador.innerHTML = Math.floor(this.contador / this.FPS);
        if( this.contador % this.velocidad == 0 && this.contador != 0 ) {
            this.ciclo = 1;
        } else {
            this.ciclo = 0;
        }
    }

    // Actualiza el indicador de invasión
    this.actualizoIndicadores = function() {
        // Indicador de invasión
        invasion.innerHTML = this.toperas.length;

        // Indicador de constructores
        let n = 0;
        this.topos.forEach( topo => {
            if( topo.isConstructor() ) {
                n++;
            }
        } );
        constructores.innerHTML = n;
        
        // Indicador de topos
        num_topos.innerHTML = this.topos.length;
    }

    // Se encarga de usar el item que este en la posición indicada
    this.useItem = function(key) {
        let numItem = this.escenario.teclas.indexOf(key.toUpperCase());
        if( numItem < this.items.length ) {
            if (this.items[numItem].item != 0) {
                // Si es de uso directo se ejecuta la accion
                if( this.items[numItem].item.tipo == 'directo' ) {
                    this.items[numItem].item.accion();
                    // Reinicio el item una vez usado
                    this.items[numItem].item = 0;
                    this.accion = null;
                    
                // Sino se guarda la accion para ejecutarla sobre un elemento
                } else {
                    this.accion = {
                        item: this.items[numItem].item,
                        tecla: numItem,
                        topera: null
                    }
                }
            }
        }
    }

    // Acción de conseguir bonus
    this.getBonus = function() {
        let bonusAsignado = false;
        let bonus = Math.random() >= 0.5;

        if(bonus) {
            this.items.forEach( (item, index) => {
                if( item.item == 0 && !bonusAsignado ) {
                    let itemBonus = Math.floor( Math.random() * 3 );
                    this.items[index].item = this.bonus[itemBonus];
                    bonusAsignado = true;
                    sonidoItem.play();
                }
            } );
        }
    }

    // Acción que permite eliminar la topera seleccionada
    this.quitarTopera = function() {
        // Reproduzco sonido
        sonidoPala.play();
    
        this.toperas.splice(this.accion.topera, 1);
        this.topos.forEach( (topo, index) => {
            if( topo.topera == this.accion.topera ) {
                this.topos[index].esconder();
            }
        } );
    }

    // Acción que coloca una trampa para topos en la topera seleccionada
    this.trampaTopos = function() {
        // Reproduzco sonido
        sonidoTrampa.play();

        this.toperas[this.accion.topera].activarTrampa();
    } 

    // Acción que incrementa el tiempo restante de la partida
    this.bonusTiempo = function() {
        // Reproduzco sonido
        sonidoTiempo.play();

        this.contador += 10 * this.FPS;
    }

    // Comprobación evento hit en topo
    this.hitTopo = function(x, y) {
        // Busco el topo golpeado
        this.toperas.forEach( (topera, indexToperas) => {
            let rangoMinX = topera.x * this.escenario.anchoCelda;
            let rangoMaxX = rangoMinX + this.escenario.anchoCelda;
            let rangoMinY = topera.y * this.escenario.altoCelda;
            let rangoMaxY = rangoMinY + this.escenario.altoCelda;
            
            if ( x >= rangoMinX && x <= rangoMaxX && y >= rangoMinY && y <= rangoMaxY ) {
                // Si hay acción marcada la guardo para ejecutar al final del frame
                if( this.accion !== null ) {
                    this.accion.topera = indexToperas;
                }

                // Busco si se ha golpeado un topo y si obtengo bonus
                this.topos.forEach( (topo, indexTopos) => {
                    if( topo.topera == indexToperas && topo.asomar()) {
                        // Reproduzco sonido
                        sonidoHit.play();

                        // Elimino topo golpeado
                        this.topos.splice( indexTopos, 1 );
                        
                        // Intento conseguir bonus
                        if( this.toperas.length > this.niveles[this.nivel-1].toperas ) {
                            this.getBonus();
                        }
                    }
                } );
            }
        } );
    }

    // Dibujo y reseteo las toperas
    this.pintarToperas = function() {
        this.toperas.forEach( topera => {
            topera.libre = true;
            topera.dibuja();
        } );
    }

    // Generar una posición para una topera
    this.addTopera = function() {
        let find = true;
        let contadorSalida = 0;
        while (find && contadorSalida < 20) {
            // Obtengo las coordenadas aleatorias
            // Calculo la X
            let x = Math.floor( Math.random() * ( (this.escenario.tablero[0].length - 2) - 1 ) + 1 );
            // Dejo un hueco de distancia en las x
            if( x % 2 == 0 && x != this.escenario.tablero[0].length - 2 ) {
                x += 1;
            } else if( x == (this.escenario.tablero[0].length - 2) ) {
                x -= 1;
            }

            // Calculo la Y
            let y;
            if( this.toperas.length <= 2 ) {
                y = 0;
            } else if( this.toperas.length <= 4 ) {
                y = 2;
            } else if( this.toperas.length <= 6 ) {
                y = 4;
            } else {
                y = 6;
            }

            /*let y = Math.floor( Math.random() * ( (this.escenario.tablero.length - 1) - 1 ) + 1 );
            // Dejo un hueco de distancia en las y
            if( y % 2 == 0 && y != this.escenario.tablero.length - 1 ) {
                y += 1;
            } else if( y == (this.escenario.tablero.length - 1) ) {
                y -= 1;
            }*/

            if (this.toperas.length > 0) {
                find = this.toperas.find(function(element) {
                    if (element.x == x && element.y == y) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if( !find ) {
                    this.toperas.push( new Topera(x, y, true) );
                }
            } else {
                find = false;
                this.toperas.push( new Topera(x, y, true) );
            }
            contadorSalida++;
        }
    }

    // Se encarga de comprobar la construcción de nuevas toperas
    this.construccionToperas = function() {
        if( this.ciclo ) {
            // Obtengo los constructores que hay
            let constructores = 0;
            this.topos.forEach( topo => {
                if( topo.isConstructor() ) {
                    constructores++;
                }
            } );

            // Actualizar el indiceConstruccionTopera
            this.estadoConstruccionTopera -= constructores;
            if (this.estadoConstruccionTopera <= 0) {
                this.addTopera();
                this.estadoConstruccionTopera += 10;
            }
        }
    }

    // Dibujo los topos asomados
    this.pintarTopos = function() {
        this.topos.forEach( topo => {
            if( topo.asomar() ) {
                topo.dibuja();
            }
        } );

        // Asomar nuevo topo
        if( this.ciclo ) {
            var topera = Math.floor( Math.random() * this.toperas.length );
            if (this.toperas[topera].libre) {
                let topo = this.topos.shift();
                // Asomo el topo y le convierto en constructor
                topo.asignarTopera(topera);
                topo.contador = 0;
                topo.constructor = 1;
                this.topos.push( topo );
            }
        }
    }

    // Compruebo si hay trampas en las toperas
    this.compruebaTrampas = function() {
        if( this.ciclo ) {
            // Busco las toperas que tienen trampa
            this.toperas.forEach( (topera, indexTopera) => {
                if(topera.trampa) {
                    // Busco el topo que este en la topera y lo elimino
                    this.topos.forEach( (topo, indexTopo) => {
                        if( topo.topera == indexTopera ) {
                            this.topos.splice(indexTopo, 1);
                            this.toperas[indexTopera].desactivarTrampa();
                        }
                    } );
                }
            } );

            
        }
    }

    // Dibujo extras
    this.pintarExtras = function() {
        
    }

    // Pinto los items accionables con las teclas
    this.pintarTablero = function() {
        var filas = 0;
        var teclasText = 0;

        // Recorro el tablero
        this.escenario.tablero.forEach(fila => {
            var columnas = 0;
            fila.forEach(columna => {
                let destacado = 0;
                switch (columna) {
                    // Destacado
                    case 1:
                        context.lineWith = 1;
                        context.strokeStyle = this.escenario.colores.destacado;
                        context.beginPath();
                        context.moveTo(columnas * this.escenario.anchoCelda, filas * this.escenario.altoCelda);
                        context.lineTo((columnas * this.escenario.anchoCelda) + this.escenario.anchoCelda, filas * this.escenario.altoCelda);
                        context.stroke();
                        break;
                    // Items
                    case 2:
                        // Destaco la tecla en caso de estar marcada
                        context.fillStyle = this.escenario.colores.destacado;
                        context.fillRect( (columnas * this.escenario.anchoCelda), (filas * this.escenario.altoCelda), this.escenario.anchoCelda, this.escenario.altoCelda );

                        // Pinto el rectángulo de fondo
                        if(this.accion !== null && this.accion.tecla == teclasText) {
                            destacado = 2;
                        }
                        context.fillStyle = this.escenario.colores.fondoItem;
                        context.fillRect( (columnas * this.escenario.anchoCelda) + destacado, (filas * this.escenario.altoCelda) + destacado, this.escenario.anchoCelda - (destacado * 2), this.escenario.altoCelda - (destacado * 2) );
                        
                        // Pinto la letra de la tecla
                        context.font = this.escenario.fuentes.textoTeclas;
                        context.fillStyle = this.escenario.colores.colorTexto;
                        context.textAlign = "center";
                        context.fillText( this.escenario.teclas[teclasText], (columnas * this.escenario.anchoCelda) + (this.escenario.anchoCelda / 2), (filas * this.escenario.altoCelda) - 4 );
                        
                        // Pinto el item en caso de existir
                        if( this.items[teclasText].item !== 0 ) {
                            // context.fillStyle = this.items[teclasText].item.icono;
                            // context.fillRect( (columnas * this.escenario.anchoCelda) + 15, (filas * this.escenario.altoCelda) + 10, this.escenario.anchoCelda - 30, this.escenario.altoCelda - 25 );
                            context.drawImage(this.items[teclasText].item.icono, (columnas * this.escenario.anchoCelda), (filas * this.escenario.altoCelda), this.escenario.anchoCelda, this.escenario.altoCelda);
                        }

                        teclasText++;
                        break;
                    // Fondo tablero
                    default:
                        context.fillStyle = this.escenario.colores.fondoTablero;
                        context.fillRect( (columnas * this.escenario.anchoCelda), (filas * this.escenario.altoCelda), this.escenario.anchoCelda, this.escenario.altoCelda );
                        break;
                }
                columnas++;
            });
            filas++;
        });
    }

    // Ejecuto la accion que esté marcada
    this.ejecutarAccion = function() {
        if( this.accion !== null && this.accion.topera !== null ) {
            this.accion.item.accion();
            this.items[this.accion.tecla].item = 0;
            this.accion = null;
        }
    }

    // Pinta el escenario en el canvas
    this.pintarEscenario = function() {
        // Pinto el tablero
        this.pintarTablero();

        // Actualizo el contador
        this.actualizaContador();

        if (!this.finJuego()) {
            // Ejecuto la acción marcada
            this.ejecutarAccion();

            // Compruebo estado de construcción de toperas
            this.construccionToperas();

            // Pinto las toperas
            this.pintarToperas();

            // Pinto los topos
            this.pintarTopos();

            // Activo las trampas para topos
            this.compruebaTrampas();
        } else {
            // Pinto las toperas
            this.pintarToperas();
        }

        // Actualizo el indicador de invasión
        this.actualizoIndicadores();
    }

    // Compruebo el final del juego y devuelvo el motivo
    this.finJuego = function() {
        var fin = 0;
        
        // Compruebo si los topos han conseguido invadir
        /*if(this.toperas.length >= this.maxInvasion) {
            fin = 'invasion';
        }*/
        this.toperas.forEach( (topera, index) => {
            if( topera.y >= 6 ) {
                fin = 'invasion';
            }
        } );

        // Compruebo si se han eliminado todas las toperas
        if(this.toperas.length == 0) {
            fin = 'sinToperas';
        }

        // Si ya no quedan topos
        if( this.topos.length == 0 ) {
            fin = 'sinTopos';
        }

        // Compruebo si el tiempo se ha agotado
        if(this.contador > this.niveles[this.nivel-1].tiempo * this.FPS) {
            fin = 'tiempo';
        }

        return fin;
    }
}

// Creación del objeto Topo
function Topo() {
    // Herencia de Personaje
    // Personaje.call( this );

    // Variables configurables
    this.color = '#0d5f06';

    // Variables dinámicas
    this.duracion = juego.FPS / 1;
    this.contador = this.duracion + 1;
    this.constructor = 0;
    this.topera;
    this.anchoTopo = juego.escenario.anchoCelda;
    this.altoTopo = juego.escenario.altoCelda;

    // MÉTODOS
    this.dibuja = function() {
        let x = juego.toperas[this.topera].x * juego.escenario.anchoCelda;
        let y = juego.toperas[this.topera].y * juego.escenario.altoCelda;
        /*context.fillStyle = this.color;
        context.fillRect(x, y, this.anchoTopo, this.altoTopo);*/

        context.drawImage(imgTopo, x, y, juego.escenario.anchoCelda, juego.escenario.altoCelda);
        

        // Ocupo la topera
        juego.toperas[this.topera].libre = false;
    }

    this.asignarTopera = function(topera) {
        this.topera = topera;
    }

    this.isConstructor = function() {
        if( this.constructor ) {
            return true;
        } else {
            return false;
        }
    } 

    this.asomar = function() {
        this.contador++;
        if( this.contador >  this.duracion) {
            return false;
        } else {
            return true;
        }
    }

    this.esconder = function() {
        this.topera = null;
        this.contador = this.duracion + 1;
    }
}

// Creación del objeto Topera
function Topera(x, y, libre) {
    // VARIABLES
    // Variables pasadas por parámetro
    this.x = x;
    this.y = y;
    this.libre = libre;
    this.trampa = 0;

    // Variables configurables
    this.color = '#9D893D';

    // MÉTODOS
    this.dibuja = function() {
        // Dibujo la topera
        context.fillStyle = this.color;
        // context.fillRect( (this.x * juego.escenario.anchoCelda), (this.y * juego.escenario.altoCelda), juego.escenario.anchoCelda, juego.escenario.altoCelda );
        context.beginPath();
        context.ellipse((this.x * juego.escenario.anchoCelda) + (juego.escenario.anchoCelda / 2), (this.y * juego.escenario.altoCelda) + (juego.escenario.altoCelda / 4 * 3), 40, 15, 0, 0, Math.PI * 2, false);
        context.fill();

        // Dibujo la trampa si tiene
        if( this.trampa ) {
            /*context.beginPath();
            context.arc((this.x * juego.escenario.anchoCelda) + (juego.escenario.anchoCelda / 2), (this.y * juego.escenario.altoCelda) + juego.escenario.altoCelda, 10, 0, Math.PI * 2, false);
            context.fillStyle='orange';
            context.fill();*/

            context.drawImage(imgTrampa, (this.x * juego.escenario.anchoCelda), (this.y * juego.escenario.altoCelda) + 15, juego.escenario.anchoCelda, juego.escenario.altoCelda);
        }     
    }

    // Desactiva la trampa
    this.desactivarTrampa = function() {
        this.trampa = 0;
    }

    // Activar trampa
    this.activarTrampa = function() {
        this.trampa = 1;
    }
}