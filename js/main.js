var canvas, context, juego, contador, invasion;
const nivel = 1;

function init() {
    // Defino el canvas
    canvas = document.getElementById( 'juego' );
    context = canvas.getContext( '2d' );

    // Obtengo elementos del DOM
    contador = document.getElementById( 'contador' );
    invasion = document.getElementById( 'invasion' );
    constructores = document.getElementById( 'constructores' );

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
    juego.contador++;
}

function Juego(nivel) {
    // VARIABLES
    // Variables pasadas por parámetro
    this.nivel = nivel;

    // Variables configurables del juego
    this.FPS = 100;
    this.niveles = [
        {velocidad: 1, toperas: 3, topos: 40, tiempo: 60},
        {velocidad: 2, toperas: 3, topos: 50, tiempo: 60},
        {velocidad: 3, toperas: 4, topos: 60, tiempo: 60},
        {velocidad: 4, toperas: 4, topos: 70, tiempo: 60},
        {velocidad: 5, toperas: 5, topos: 80, tiempo: 60}
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
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0],
            [0,2,0,2,0,2,0,2,0,0,0,0],
        ],
        anchoCelda: canvas.width / 12,
        altoCelda: canvas.height / 9,
        colores: {
            fondoTablero: '#FFFFFF',
            fondoItem: '#EFEFEF',
            colorTexto: '#333333',
        },
        fuentes: {
            textoTeclas: "16px Arial"
        },
        teclas: ['Q', 'W', 'E', 'R']
    };
    this.bonus = [
        quitarTopera = {
            icono: 'brown',
            tipo: 'asignacion',
            accion: function(topera) {
                juego.quitarTopera(topera);
            }
        },
        trampaTopos = {
            icono: 'blue',
            tipo: 'asignacion',
            accion: function(topera) {
                juego.trampaTopos(topera);
            }
        },
        bonusTiempo = {
            icono: 'green',
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

        // Creo un escuchador de evento para el mouse en el canvas
        canvas.addEventListener( 'mousedown', event => {
            let x = event.layerX;
            let y = event.layerY;

            this.hitTopo(x, y);
        } );

        // Creo un escuchador de evento para las teclas de acción
        document.addEventListener( 'keydown', event => {
            let key = event.key;

            this.useItem(key);
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
        canvas.width=750;
        canvas.height=500;
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
            if( topo.constructor ) {
                n++;
            }
        } );
        constructores.innerHTML = n;
    }

    // Se encarga de usar el item que este en la posición indicada
    this.useItem = function(key) {
        let numItem;
        switch (key) {
            case 'q':
                numItem = 0;
                break;
            case 'w':
                numItem = 1;
                break;
            case 'e':
                numItem = 2;
                break;
            case 'r':
                numItem = 3;
                break;
        }
        if (this.items[numItem].item != 0) {
            // Si es de uso directo se ejecuta la accion
            if( this.items[numItem].item.tipo == 'directo' ) {
                this.items[numItem].item.accion();
                // Reinicio el item una vez usado
                this.items[numItem].item = 0;
                
            // Sino se guarda la accion para ejecutarla sobre un elemento
            } else {
                this.accion = {
                    item: this.items[numItem].item,
                    tecla: numItem
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
                }
            } );
        }
    }

    // Acción que permite eliminar la topera seleccionada
    this.quitarTopera = function(topera) {
        this.toperas.splice(topera, 1);
    }

    // Acción que coloca una trampa para topos en la topera seleccionada
    this.trampaTopos = function(topera) {
        console.log( 'Pongo trampa para topos', topera );
    } 

    // Acción que incrementa el tiempo restante de la partida
    this.bonusTiempo = function() {
        this.contador -= 10 * this.FPS;
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
                if( this.accion !== null ) {
                    this.accion.item.accion(indexToperas);
                    this.items[this.accion.tecla].item = 0;
                    this.accion = null;
                }
                this.topos.forEach( (topo, indexTopos) => {
                    if( topo.topera == indexToperas && topo.asomado()) {
                        this.topos.splice( indexTopos, 1 );
                        this.getBonus();
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
        while (find) {
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
            let y = Math.floor( Math.random() * ( (this.escenario.tablero.length - 1) - 1 ) + 1 );
            // Dejo un hueco de distancia en las y
            if( y % 2 == 0 && y != this.escenario.tablero.length - 1 ) {
                y += 1;
            } else if( y == (this.escenario.tablero.length - 1) ) {
                y -= 1;
            }

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
        }
    }

    // Se encarga de comprobar la construcción de nuevas toperas
    this.construccionToperas = function() {
        if( this.ciclo ) {
            // Obtengo los constructores que hay
            let constructores = 0;
            this.topos.forEach( topo => {
                if( topo.constructor == 1 ) {
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
            if( topo.asomado() ) {
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
                switch (columna) {
                    // 
                    case 1:
                        
                        break;
                    // Items
                    case 2:
                        context.fillStyle = this.escenario.colores.fondoItem;
                        context.fillRect( (columnas * this.escenario.anchoCelda), (filas * this.escenario.altoCelda), this.escenario.anchoCelda, this.escenario.altoCelda );
                        context.font = this.escenario.fuentes.textoTeclas;
                        context.fillStyle = this.escenario.colores.colorTexto;
                        context.textAlign = "center";
                        context.fillText( this.escenario.teclas[teclasText], (columnas * this.escenario.anchoCelda) + (this.escenario.anchoCelda / 2), (filas * this.escenario.altoCelda) + this.escenario.altoCelda );
                        if( this.items[teclasText].item !== 0 ) {
                            context.fillStyle = this.items[teclasText].item.icono;
                            context.fillRect( (columnas * this.escenario.anchoCelda) + 15, (filas * this.escenario.altoCelda) + 10, this.escenario.anchoCelda - 30, this.escenario.altoCelda - 25 );
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

    // Pinta el escenario en el canvas
    this.pintarEscenario = function() {
        // Pinto el tablero
        this.pintarTablero();

        if (!this.finJuego()) {
            // Actualizo el contador
            this.actualizaContador();

            // Compruebo estado de construcción de toperas
            this.construccionToperas();

            // Pinto las toperas
            this.pintarToperas();

            // Pinto los topos
            this.pintarTopos();

            // Actualizo el indicador de invasión
            this.actualizoIndicadores();
        }
    }

    // Compruebo el final del juego y devuelvo el motivo
    this.finJuego = function() {
        var fin = 0;
        
        // Compruebo si los topos han conseguido invadir
        if(this.toperas.length >= this.maxInvasion) {
            fin = 'invasion';
        }

        // Compruebo si se han eliminado todas las toperas
        if(this.toperas.length == 0) {
            fin = 'win';
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
    this.hit = false;
    this.anchoTopo = juego.escenario.anchoCelda;
    this.altoTopo = juego.escenario.altoCelda;

    // MÉTODOS
    this.dibuja = function() {
        let x = juego.toperas[this.topera].x * juego.escenario.anchoCelda;
        let y = juego.toperas[this.topera].y * juego.escenario.altoCelda;
        context.fillStyle = this.color;
        context.fillRect(x, y, this.anchoTopo, this.altoTopo);

        // Ocupo la topera
        juego.toperas[this.topera].libre = false;
    }

    this.asignarTopera = function(topera) {
        this.topera = topera;
    }

    this.asomado = function() {
        this.contador++;
        if( this.contador >  this.duracion) {
            return false;
        } else {
            return true;
        }
    }
}

// Creación del objeto Topera
function Topera(x, y, libre) {
    // VARIABLES
    // Variables pasadas por parámetro
    this.x = x;
    this.y = y;
    this.libre = libre;

    // Variables configurables
    this.color = '#FF0000';

    // MÉTODOS
    this.dibuja = function() {
        context.fillStyle = this.color;
        context.fillRect( (this.x * juego.escenario.anchoCelda), (this.y * juego.escenario.altoCelda), juego.escenario.anchoCelda, juego.escenario.altoCelda );
    }
}