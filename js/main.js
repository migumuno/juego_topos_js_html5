var canvas, context, juego;
var FPS = 50;

function init() {
    canvas = document.getElementById( 'juego' );
    context = canvas.getContext( '2d' );
    juego = new Juego(canvas, context);

    setInterval(main, 1000/FPS);    
}

function main() {
    // console.log( 'Frame' );
    
    juego.borraCanvas();
}

function Juego(canvas, context) {
    this.canvas = canvas;
    this.context = context;
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

    // Métodos
    this.borraCanvas = function() {
        this.canvas.width=750;
        this.canvas.height=500;
    }
}