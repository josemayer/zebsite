/* ==================================================
    fractais.js

    Nome: José Lucas Silva Mayer 
    NUSP: 11819208

    Ao preencher esse cabeçalho com o meu nome e o meu número USP,
    declaro que todas as partes originais desse exercício programa (EP)
    foram desenvolvidas e implementadas por mim e que portanto não 
    constituem desonestidade acadêmica ou plágio.
    Declaro também que sou responsável por todas as cópias desse
    programa e que não distribui ou facilitei a sua distribuição.
    Estou ciente que os casos de plágio e desonestidade acadêmica
    serão tratados segundo os critérios divulgados na página da 
    disciplina.
    Entendo que EPs sem assinatura devem receber nota zero e, ainda
    assim, poderão ser punidos por desonestidade acadêmica.

    Abaixo descreva qualquer ajuda que você recebeu para fazer este
    EP.  Inclua qualquer ajuda recebida por pessoas (inclusive
    monitores e colegas). Com exceção de material da disciplina, caso
    você tenha utilizado alguma informação, trecho de código,...
    indique esse fato abaixo para que o seu programa não seja
    considerado plágio ou irregular.

    Exemplo:

        A minha função quicksort() foi baseada na descrição encontrada na 
        página https://www.ime.usp.br/~pf/algoritmos/aulas/quick.html.

    Descrição de ajuda ou indicação de fonte:



================================================== */

const DEBUG = true;
const ITERATIONS = 100;
const DELTA = 4;
const SHIFT = 16;  // código ASCII da tecla 

// Condições iniciais de Julia e Mandelbrot
const CX = -0.62, CY = -0.44;

const JULIA_L = -1.5;
const JULIA_B = -1.5;
const JULIA_R =  1.5;
const JULIA_T =  1.5;

const MANDEL_L = -2.5;
const MANDEL_B = -1.5;
const MANDEL_R = 1.5;
const MANDEL_T = 1.5;

0.781383
0.717439

// Veja uma lista de cores em: 
// https://www.w3schools.com/tags/ref_colornames.asp
const CORES = [
    	'#000', '#19071a', '#09012f',  
    	'#040449', '#000764', '#0c2c8a', 
	'#1853b1', '#397dd1', '#86b5e5', '#d3ecf8',
  '#f1e9bf', '#f8c95f', '#ffaa00', '#cc8000',
  '#995700', '#6a3403' 
];

const NCORES = CORES.length;

// Variáveis globais
var gCanvas, gWidth, gHeith, gCtx;

/*
    função main
*/

gCanvas = document.querySelector('#fractais_canvas');

function main() {
    resize();   
    gWidth = gCanvas.width;
    	gHeight = gCanvas.height;
    	gCtx = gCanvas.getContext('2d');

    	msg = `Canvas tem tamanho ${gWidth} x ${gHeight}`;
    	console.log( msg );

	let leftBottom = [0, gHeight];
	let LBZoom = leftBottom;
	let rightTop = [gWidth, 0];
	let RBZoom = rightTop;
	let mandelLeftBottom = [MANDEL_L, MANDEL_B];
	let mandelLBZoom = mandelLeftBottom;
	let mandelRightTop = [MANDEL_R, MANDEL_T];
	let mandelRTZoom = mandelRightTop;
	let shiftDown = false;
	let mouseDown = false;

	drawMandelbrot(mandelLeftBottom, mandelRightTop);  
}

const resize = () => {
  gCanvas.width = window.innerWidth;
  gCanvas.height = window.innerHeight;
}

function sumComplex(a, b) {
	return [(a[0] + b[0]), (a[1] + b[1])];
}

function multiplyComplex(a, b) {
	return [(a[0] * b[0] - a[1] * b[1]), (a[0] * b[1] + a[1] * b[0])];
}

function squareComplex(z) {
	return (z[0] * z[0] + z[1] * z[1]);
}

function verifyConvergence(z, c) {
	var i = 0;
	while (i < ITERATIONS) {
		z = sumComplex(multiplyComplex(z, z), c);
		if (squareComplex(z) >= 4) {
			return i;
		}
		i++;
	}
	return -1;
}
 
function drawJuliaFatou(c) {
	for (var i = 0; i < gWidth; i++) {
		var a = (JULIA_R - JULIA_L) / (gWidth) * i + JULIA_L;
		for (var j = gHeight; j < 2 * gHeight; j++) {
			var b = (JULIA_T - JULIA_B) / (gHeight) * (j - gHeight) + JULIA_B;
			var z = [a, b];
			if (verifyConvergence(z, c) != -1) {
				gCtx.beginPath();
				gCtx.rect(i, j, 1, 1);
				gCtx.fillStyle = CORES[0];
				gCtx.fill();
			} else {
				gCtx.beginPath();
				gCtx.rect(i, j, 1, 1);
				gCtx.fillStyle = CORES[1];
				gCtx.fill();
			}
		}
	}
}

function drawMandelbrot(mandelLeftBottom, mandelRightTop) {
	for (var i = 0; i < gWidth; i++) {
		var a = (mandelRightTop[0] - mandelLeftBottom[0]) / gWidth * i + mandelLeftBottom[0];
		for (var j = 0; j < gHeight; j++) {
			var b = (mandelLeftBottom[1] - mandelRightTop[1]) / gHeight * j + mandelRightTop[1];
			var z = [0, 0];
			var d = [a, b];
			gCtx.beginPath();
			gCtx.rect(i, j, 1, 1);

			var k = verifyConvergence(z, d);
			if (k == -1) {
				gCtx.fillStyle = CORES[0];
			} else {
				gCtx.fillStyle = CORES[k % NCORES];
			}

			gCtx.fill();
		}
	}
}

main();
