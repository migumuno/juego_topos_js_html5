var canvas, context, juego, contador;
const nivel = 1;

function init() {
    // Defino el canvas
    canvas = document.getElementById( 'juego' );
    context = canvas.getContext( '2d' );

    // Obtengo elementos del DOM
    contador = document.getElementById( 'contador' );

    // Creo el juego
    juego = new Juego(nivel);

    // Inicio el bucle principal del juego
    setInterval(function(){
        main();
    }, 1000/juego.FPS);
}

function main() {
    // Reinicio el canvas
    juego.borraCanvas();
    juego.pintarEscenario();

    // Compruebo el final del juego
    if( !juego.finJuego() ) {
        contador.innerHTML = Math.floor(juego.contador / juego.FPS);

        // Compruebo si los topos se tienen que esconder
        juego.revisarTopos();

        // Ejecuto el ciclo (FPS)
        if( juego.contador % juego.velocidad == 0 && juego.contador != 0 ) {
            // Intento crear un topo en cada ciclo, depende de si la topera aleatoria está disponible
            juego.crearTopo();

            // Ejecuto acciones aleatorias
            var accion = Math.floor( Math.random() * (juego.acciones.length - 0) );
            juego.acciones[accion]();
        }
    }

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
            [0,0,0,0,0,0,0,0,0,0,0,0],
        ],
        anchoCelda: canvas.width / 12,
        altoCelda: canvas.height / 9
    };

    // Variables dinámicas del juego
    this.velocidad = this.FPS - (this.niveles[this.nivel - 1].velocidad * 10);
    this.invasion = this.niveles[this.nivel-1].toperas;
    this.contador = 0;
    this.contadorTopos = 0;
    this.topos = [];
    this.toposConstructores = [];
    this.toperas = [];
    this.acciones = [
        crearTopo = function() {
            juego.crearTopo();
        },
        nada = function() {}
    ];

    // CONSTRUCTOR
    // Defino las toperas
    for (let index = 0; index < this.niveles[this.nivel-1].toperas; index++) {
        let find = true;
        while (find) {
            let x = Math.floor( Math.random() * (this.escenario.tablero[0].length - 1) + 1 );
            let y = Math.floor( Math.random() * (this.escenario.tablero.length - 1) + 1 );

            if (this.toperas.length > 0) {
                find = this.toperas.find(function(element) {
                    if (element.x == x && element.y == y) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if( !find ) {
                    this.toperas.push( {x: x, y: y, libre: true} );
                }
            } else {
                find = false;
                this.toperas.push( {x: x, y: y, libre: true} );
            }
        }
    }

    // MÉTODOS
    // Reinicia el canvas vacío
    this.borraCanvas = function() {
        canvas.width=750;
        canvas.height=500;
    }

    // Devuelve el estado de la invasión
    this.estadoInvasion = function(n) {
        this.invasion += n;
    }

    // Pinta el escenario en el canvas
    this.pintarEscenario = function() {
        var filas = 0;
        var color;

        // Pinto el tablero
        this.escenario.tablero.forEach(fila => {
            var columnas = 0;
            fila.forEach(columna => {
                switch (columna) {
                    case 1:
                        color = '#FF0000';
                        break;
                    default:
                        color = '#EFEFEF';
                        break;
                }
                context.fillStyle = color;
                context.fillRect( (columnas * this.escenario.anchoCelda), (filas * this.escenario.altoCelda), this.escenario.anchoCelda, this.escenario.altoCelda );
                columnas++;
            });
            filas++;
        });

        if (!this.finJuego()) {
            // Pinto las toperas
            this.toperas.forEach(topera => {
                context.fillStyle = '#FF0000';
                context.fillRect( (topera.x * this.escenario.anchoCelda), (topera.y * this.escenario.altoCelda), this.escenario.anchoCelda, this.escenario.altoCelda );
            });

            // Pinto los topos
            if( this.contadorTopos <= this.niveles[this.nivel-1].topos ) {
                this.topos.forEach(topo => {
                    topo.dibujaTopo();
                });
            } else {
                this.toposConstructores.forEach(topo => {
                    if( topo.contador == 0 ) {
                        var topera = Math.floor( Math.random() * this.toperas.length );
                        topo.topera = topera;
                        if (this.toperas[topera].libre) {
                                topo.dibujaTopo();
                        }
                    }
                });
            }
        }
    }

    // Creo nuevo topo
    this.crearTopo = function() {
        if(this.toperas.length > 0) {
            var topera = Math.floor( Math.random() * this.toperas.length );
            if (this.toperas[topera].libre) {
                if( this.contadorTopos <= this.niveles[this.nivel-1].topos ) {
                    this.topos.push( new Topo(topera) );
                    this.contadorTopos++;
                } else {
                    this.toposConstructores[0].contador = 0;
                }
            }
        }
    }

    // Quito los topos que hayan consumido el tiempo
    this.revisarTopos = function() {
        if( this.contadorTopos <= this.niveles[this.nivel-1].topos ) {
            this.topos.forEach((topo, index) => {
                if( topo.finTiempoVida() ) {
                    this.toperas[topo.topera].libre = true;
                    if( !topo.hit ) {
                        //console.log(topo)
                        this.toposConstructores.push( topo );
                        //console.log(this.toposConstructores);
                    }
                    this.topos.splice(index, 1);
                }
            });
        }
    }

    // Compruebo el final del juego y devuelvo el motivo
    this.finJuego = function() {
        var fin = 0;
        
        // Compruebo si los topos han conseguido invadir
        if(this.invasion >= this.maxInvasion) {
            fin = 'invasion';
        }

        // Compruebo si el tiempo se ha agotado
        if(this.contador > this.niveles[this.nivel-1].tiempo * this.FPS) {
            fin = 'tiempo';
        }

        return fin;
    }
}

/*// Creación del objeto personaje
function Personaje() {
    
}

Personaje.prototype.morir = function() {
    this.vivo = false;
    this.vida = 0;
}*/

// Creación del personaje Topo que hereda de Personaje
function Topo(topera) {
    // Herencia de Personaje
    // Personaje.call( this );

    // VARIABLES
    // Variables pasadas por parámetro
    this.topera = topera;

    // Variables configurables
    this.color = '#0d5f06';

    // Variables dinámicas
    this.contador = 0;
    this.hit = false;
    this.duracion = juego.FPS / 1;
    this.anchoTopo = juego.escenario.anchoCelda;
    this.altoTopo = juego.escenario.altoCelda;

    // CONSTRUCTOR
    // Ocupo la topera del juego
    juego.toperas[topera].libre = false;

    // MÉTODOS
    this.dibujaTopo = function() {
        let x = juego.toperas[this.topera].x * juego.escenario.anchoCelda;
        let y = juego.toperas[this.topera].y * juego.escenario.altoCelda;
        context.fillStyle = this.color;
        context.fillRect(x, y, this.anchoTopo, this.altoTopo);
    }

    this.finTiempoVida = function() {
        this.contador++;
        if( this.contador >  this.duracion) {
            return true;
        } else {
            return false;
        }
    }
}

// Herencia de Personaje
// Topo.prototype = new Personaje( 100, 10 );