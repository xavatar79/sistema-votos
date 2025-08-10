// CÓDIGO CORRECTO PARA server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { nanoid } = require('nanoid');

// --- CONFIGURACIÓN DE LA BASE DE DATOS (lowdb) ---
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
  partidos: [],
  establecimientos: [],
  mesas: [],
  resultados: []
}).write();

// ==================================================================
// --- BLOQUE PARA POBLAR DATOS INICIALES ---
// Carga todos los establecimientos y mesas del listado al iniciar.
// ==================================================================

const poblarDatosIniciales = () => {
  console.log('Verificando y poblando datos iniciales del listado completo...');

  const dataParaPoblar = [
    { nombre: "ESCUELA NORMAL SUPERIOR PROSPERO ALEMANDRI", domicilio: "AV.BELGRANO MANUEL 355 E/ ESPAÑA Y MONTES DE OCA", desde: 1, hasta: 8 },
    { nombre: "ESCUELA ES Nº13", domicilio: "BERUTTI 263 E/ BARCALA TTE. CNEL. Y PALAA J. B.", desde: 9, hasta: 16 },
    { nombre: "ESCUELA EP Nº46", domicilio: "LAVALLE 131 E/ AV.BELGRANO MANUEL Y PALAA J. B.", desde: 17, hasta: 24 },
    { nombre: "INSTITUTO SAN MARTIN", domicilio: "LAVALLE 135 E/ AV.BELGRANO MANUEL Y PALAA J. B.", desde: 25, hasta: 29 },
    { nombre: "ESCUELA EST Nº5", domicilio: "PALAA J. B. 747 E/ ALSINA ADOLFO Y 9 DE JULIO", desde: 30, hasta: 33 },
    { nombre: "ESCUELA EDUC.ESPECIAL Nº502", domicilio: "ESPAÑA 621 E/ SAGOL LUIS RAUL INT. Y DIAZ VELEZ", desde: 34, hasta: 37 },
    { nombre: "ESCUELA EP Nº42", domicilio: "AV.BELGRANO MANUEL 1378 E/ GUEMES GRAL. Y VELEZ SARSFIELD", desde: 38, hasta: 41 },
    { nombre: "ESCUELA EST Nº7", domicilio: "MARCONI ING. 745 E/ 25 DE MAYO Y SARMIENTO", desde: 42, hasta: 48 },
    { nombre: "INSTITUTO FRENCH", domicilio: "MARCONI ING. 641 E/ FRENCH Y 25 DE MAYO", desde: 49, hasta: 52 },
    { nombre: "ESCUELA EP Nº1", domicilio: "AV.MITRE B. GRAL. 750 E/ 25 DE MAYO Y SARMIENTO", desde: 53, hasta: 59 },
    { nombre: "COLEGIO RACING CLUB", domicilio: "AMEGHINO FLORENTINO 883 E/ LAPRIDA Y SARMIENTO", desde: 60, hasta: 62 },
    { nombre: "ESCUELA EP Nº13", domicilio: "25 DE MAYO 371 E/ ESTRADA JOSE M. Y ZEBALLOS ESTANISLAO S.", desde: 63, hasta: 70 },
    { nombre: "ESCUELA EP Nº 11", domicilio: "CHACABUCO 771 E/ ROCA GRAL. Y ALMAFUERTE", desde: 71, hasta: 73 },
    { nombre: "ESCUELA EP Nº25", domicilio: "SUAREZ CNEL. 148 E/ ZEBALLOS ESTANISLAO S. Y ESTRADA JOSE M.", desde: 74, hasta: 82 },
    { nombre: "ESCUELA ES Nº29", domicilio: "OLAVARRIA 248 E/ ESTRADA JOSE M. Y ROCA GRAL.", desde: 83, hasta: 86 },
    { nombre: "INSTITUTO PADRE BERISSO", domicilio: "GUTIERREZ RICARDO 1170 E/ LAMADRID Y 12 DE OCTUBRE", desde: 87, hasta: 92 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº21", domicilio: "DEL CAMPO ESTANISLAO 947 E/ PASAJE MAGALLANES Y LAPRIDA", desde: 93, hasta: 95 },
    { nombre: "SOCIEDAD DE FOMENTO", domicilio: "25 DE MAYO 851 E/ DEL CAMPO ESTANISLAO Y GUTIERREZ RICARDO", desde: 96, hasta: 98 },
    { nombre: "CLUB SOCIAL Y DEPORTIVO LEVALLE", domicilio: "LEVALLE GRAL. 1260 E/ GUTIERREZ RICARDO Y", desde: 99, hasta: 102 },
    { nombre: "ESCUELA ES Nº27", domicilio: "ROCA GRAL. 325 E/ CHACABUCO Y MONTES DE OCA", desde: 103, hasta: 107 },
    { nombre: "ESCUELA ES Nº24", domicilio: "MONTAÑA JOSE M. 454 E/ 3 DE FEBRERO Y VIEYTES", desde: 108, hasta: 114 },
    { nombre: "ESCUELA EP Nº6", domicilio: "VIEYTES 1590 E/ MONTAÑA JOSE M. Y", desde: 115, hasta: 124 },
    { nombre: "JARDIN DE INF.MUNICIPAL Nº3", domicilio: "PASAJE ESPEJO GRAL. 1411 E/ LAS HERAS Y MONTAÑA JOSE M.", desde: 125, hasta: 128 },
    { nombre: "ESCUELA EST Nº1", domicilio: "ALEM LEANDRO N. 1910 Y VERTIZ VIRREY", desde: 129, hasta: 134 },
    { nombre: "ESCUELA.EVAG. M.J. MANS(EP Y ES)", domicilio: "PASAJE GONGORA 1014 E/ IRALA Y PASAJE HOMERO", desde: 135, hasta: 140 },
    { nombre: "ESCUELA EDUC.ESPECIAL Nº506", domicilio: "DEBENEDETTI AGUSTIN 2551 E/ OCANTOS MANUEL Y SANDE HERMINIO DR.", desde: 141, hasta: 144 },
    { nombre: "ESCUELA EP Nº67", domicilio: "CANALEJAS 2357 Y PASAJE GONGORA", desde: 145, hasta: 150 },
    { nombre: "ESCUELA EP Nº33", domicilio: "HUERGO LUIS ING. 1534 E/ DEBENEDETTI AGUSTIN Y AV.DIAZ DE SOLIS JUAN", desde: 151, hasta: 156 },
    { nombre: "COLEGIO CRISTO REY (EP Y ES)", domicilio: "25 DE MAYO 1262 E/ PASAJE SUPERI Y ALEM LEANDRO N.", desde: 157, hasta: 162 },
    { nombre: "ESCUELA EP Nº35", domicilio: "DEBENEDETTI AGUSTIN 1228 E/ MAZZINI JOSE Y PASAJE 3 - BRIAND ARISTIDES", desde: 163, hasta: 170 },
    { nombre: "COLEGIO SAGRADO CORAZON(EP/ES)", domicilio: "AVELLANEDA NICOLAS 1240 E/ MAZZINI JOSE Y ESTEVEZ MANUEL", desde: 171, hasta: 180 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº27", domicilio: "PONCE SGTO. 790 E/ ALEM LEANDRO N. Y AVELLANEDA NICOLAS", desde: 181, hasta: 183 },
    { nombre: "ESCUELA EP Nº9", domicilio: "M.ESTEVEZ 1000 E/ Y", desde: 184, hasta: 191 },
    { nombre: "ESCUELA ES Nº6", domicilio: "GIRIBONE 648 E/ ROSETTI MANUEL Y GARCIA TTE. GRAL.", desde: 192, hasta: 198 },
    { nombre: "ESCUELA EP Nº14", domicilio: "ALDECOA FELIPE 821 E/ FERNANDEZ EDMUNDO H. Y RIVERO", desde: 199, hasta: 204 },
    { nombre: "ESCUELA ES Nº5", domicilio: "LEBENSOHN MOISES 965 E/ RIVERO Y GORRITI E/ RIVERO Y GORRITI GRAL.", desde: 205, hasta: 209 },
    { nombre: "ESCUELA EP Nº2", domicilio: "MEJICO 862 E/ GUIFRA TTE. CNEL. Y DIAZ CNEL.", desde: 210, hasta: 213 },
    { nombre: "ESCUELA EST Nº9", domicilio: "RIVADAVIA BERNARDINO 1069 E/ ENTRE RIOS Y BRAVO MARIO", desde: 214, hasta: 219 },
    { nombre: "UNIVERSIDAD NACIONAL DE AVELLANEDA (UNDAV)", domicilio: "BRAVO MARIO 1460 Y ISLETA", desde: 220, hasta: 226 },
    { nombre: "ESCUELA EP Nº17", domicilio: "CHILE 159 E/ SANTIAGO DEL ESTERO Y JUJUY", desde: 227, hasta: 233 },
    { nombre: "COLEGIO BEATA M.ANA DE JESUS", domicilio: "CABILDO 285 E/ SANTA FE Y PASAJE MATIENZO BENJAMIN", desde: 234, hasta: 237 },
    { nombre: "ESCUELA EP Nº28", domicilio: "AV.YRIGOYEN HIPOLITO 1539 Y URUGUAY", desde: 238, hasta: 246 },
    { nombre: "ESCUELA EP Nº41", domicilio: "AV.GALICIA 467 E/ LA RIOJA Y PERU", desde: 247, hasta: 255 },
    { nombre: "COLEG.MADRE DE LA MISERICORDIA (EP Y ES)", domicilio: "BRASIL 835 E/ MENDOZA Y LA RIOJA", desde: 256, hasta: 261 },
    { nombre: "ESCUELA ES Nº4", domicilio: "DONOVAN 1470 E/ CASACUBERTA JUAN A. CNEL. Y HEREDIA GRAL.", desde: 262, hasta: 271 },
    { nombre: "ESCUELA ES Nº30", domicilio: "REPUBLICA DEL LIBANO 1519 E/ DE LA SERNA J. M. Y CASACUBERTA JUAN A. CNEL.", desde: 272, hasta: 276 },
    { nombre: "ESCUELA EP Nº37", domicilio: "LACARRA CNEL. 1530 E/ CASACUBERTA A. CNEL. Y DE LA SERNA J. M.", desde: 277, hasta: 284 },
    { nombre: "ESCUELA EP Nº40", domicilio: "CAMPICHUELO 765 E/ LACARRA CNEL. Y REPUBLICA DEL LIBANO", desde: 285, hasta: 293 },
    { nombre: "ESCUELA EP Nº45/ES Nº7", domicilio: "CAMINO GENERAL BELGRANO 1030 E/ RECONQUISTA Y TRES SARGENTOS", desde: 294, hasta: 299 },
    { nombre: "ESCUELA EP Nº24", domicilio: "BASAVILBASO DR. 1612 E/ DE LA SERNA J. M. Y CASACUBERTA JUAN A. CNEL.", desde: 300, hasta: 303 },
    { nombre: "INSTITUTO CENTENARIO DON BOSCO (EP Y ES)", domicilio: "SALTA 1515 E/ CASACUBERTA JUAN A. CNEL. Y HELGUERA", desde: 304, hasta: 311 },
    { nombre: "ESCUELA EP Nº60", domicilio: "HEREDIA GRAL. 961 E/ VELEZ SARSFIELD Y VARELA FLORENCIO", desde: 312, hasta: 316 },
    { nombre: "ESCUELA EP Nº4", domicilio: "VELEZ SARSFIELD Y MANSILLA GRAL.", desde: 317, hasta: 322 },
    { nombre: "CLUB SOCIAL Y DEPORTIVO CRAMER", domicilio: "CHENAUT GRAL. 138 E/ ZEBALLOS ESTANISLAO S. Y", desde: 323, hasta: 326 },
    { nombre: "ESCUELA ES Nº 11", domicilio: "GELLY Y OBES GRAL. 280 E/ ZOLA EMILIO Y ZEBALLOS ESTANISLAO S.", desde: 327, hasta: 335 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº31", domicilio: "EMILIO ZOLA 3967 E/ Y", desde: 336, hasta: 338 },
    { nombre: "JARDIN DE INFANTES MUNICIPAL Nº14", domicilio: "ARRIBEÑOS 331 E/ AGRELO P. Y CUCHA CUCHA", desde: 339, hasta: 340 },
    { nombre: "ESCUELA EP Nº70/ES Nº20", domicilio: "GENOVA 3459 E/ Y", desde: 341, hasta: 347 },
    { nombre: "JARDIN DE INFANTES Nº934", domicilio: "GENOVA E/ AGRELO Y CUCHA CUCHA 3561 E/ Y", desde: 348, hasta: 349 },
    { nombre: "ESCUELA EP Nº18", domicilio: "AV.MITRE B. GRAL. 2550 E/ ESPORA CNEL. Y", desde: 350, hasta: 360 },
    { nombre: "JARDIN DE INFANTES Nº928", domicilio: "AV.MITRE B. GRAL. 2524 E/ ESPORA CNEL. Y", desde: 361, hasta: 364 },
    { nombre: "COLEGIO SAN PATRICIO (ES)", domicilio: "AV.MITRE B. GRAL. 2308 E/ IGUAZU Y CORTES HERNAN", desde: 365, hasta: 369 },
    { nombre: "COLEGIO SAN PATRICIO (EP)", domicilio: "ZEBALLOS ESTANISLAO S. 2309 E/ Y", desde: 370, hasta: 376 },
    { nombre: "ESCUELA PRIMERA HUELLA", domicilio: "IBERA 168 E/ ZEBALLOS ESTANISLAO S. Y ESTRADA JOSE M.", desde: 377, hasta: 381 },
    { nombre: "JARDIN DE INFANTES Nº906", domicilio: "IGUAZU 41 E/ GUTIERREZ RICARDO Y LOPEZ VICENTE", desde: 382, hasta: 384 },
    { nombre: "ESCUELA ALAS", domicilio: "ALTE.CORDERO 2266/68 E/ Y", desde: 385, hasta: 388 },
    { nombre: "CLUB SOCIAL Y DEPORT.SARMIENTO", domicilio: "O'HIGGINS 841 E/ Y", desde: 389, hasta: 392 },
    { nombre: "ESCUELA SANTO TOMAS", domicilio: "AV.BELGRANO MANUEL 2695 Y SALTA", desde: 393, hasta: 397 },
    { nombre: "ESCUELA EP Nº10", domicilio: "AV.MITRE B. GRAL. 2985 E/ PAUNERO GRAL. Y CHENAUT GRAL.", desde: 398, hasta: 405 },
    { nombre: "ESCUELA EP Nº36", domicilio: "AV.MITRE B. GRAL. 3695 E/ VILLA LUJAN Y DEHEZA GRAL.", desde: 406, hasta: 415 },
    { nombre: "JARDIN DE INFANTES Nº925", domicilio: "DEHEZA GRAL. 41 E/ AV.MITRE B. GRAL. Y BRANDSEN CNEL.", desde: 416, hasta: 417 },
    { nombre: "ESCUELA ES Nº3", domicilio: "BRANDSEN CNEL. 3785 E/ DEHEZA GRAL. Y PASTEUR LUIS", desde: 418, hasta: 426 },
    { nombre: "INSTITUTO NTRA.SRA.DE LORETO", domicilio: "AV.BELGRANO MANUEL 3776 E/ PASTEUR LUIS Y DEHEZA GRAL.", desde: 427, hasta: 432 },
    { nombre: "COLEGIO ENRIQUE RIOPEDRE", domicilio: "DEHEZA GRAL. 1025 E/ LAFUENTE ACHA Y PITAGORAS E/ Y", desde: 433, hasta: 440 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº24", domicilio: "TTE. CNEL. Y LUCENA CMDTE.", desde: 441, hasta: 444 },
    { nombre: "ESCUELA EP Nº23", domicilio: "MAGAN TTE. CNEL. 981 E/ LARRALDE CRISOLOGO Y ARREDONDO GRAL.", desde: 445, hasta: 452 },
    { nombre: "ESCUELA EP Nº15", domicilio: "DUARTE DE PERON EVA S/N Y GUEMES GRAL.", desde: 453, hasta: 459 },
    { nombre: "UNIVERSIDAD BUENOS AIRES (UBA) SEDE AVELLANEDA", domicilio: "LAMBARE 645 Y OCAMPO E/ Y", desde: 460, hasta: 469 },
    { nombre: "ESCUELA EST Nº4", domicilio: "AV.MITRE B. GRAL. 2125 E/ ELIZALDE Y OBLIGADO PASTOR", desde: 470, hasta: 478 },
    { nombre: "ESCUELA EP Nº22/ES Nº1", domicilio: "AV.MITRE B. GRAL. 3250 E/ BARCELO ALBERTO INT. Y OYUELA", desde: 479, hasta: 487 },
    { nombre: "COLEGIO SAN VICENTE DE PAUL (EP Y ES)", domicilio: "CNO. BELGRANO MANUEL 3250 E/ BARCELO ALBERTO INT. Y OYUELA", desde: 488, hasta: 493 },
    { nombre: "ESCUELA EP Nº5", domicilio: "AV.MITRE 4368 E/ Y", desde: 494, hasta: 500 },
    { nombre: "COLEGIO INMACULADA CONCEPCION", domicilio: "EL SALVADOR 47 E/ Y", desde: 501, hasta: 507 },
    { nombre: "INSTITUTO VICTORIA OCAMPO (EP Y ES)", domicilio: "AV.BELGRANO 4249 E/ Y", desde: 508, hasta: 512 },
    { nombre: "ESCUELA EP Nº16/ES Nº 33", domicilio: "COMODORO RIVADAVIA 4455 E/ Y", desde: 513, hasta: 520 },
    { nombre: "ESCUELA EP Nº66", domicilio: "GRAL PICO 121 E/ Y", desde: 521, hasta: 529 },
    { nombre: "COLEGIO PARROQ.VICENTE SAURAS", domicilio: "BRANDSEN 4976 E/ Y", desde: 530, hasta: 534 },
    { nombre: "ESCUELA ES Nº9", domicilio: "RAMON FRANCO 5031 E/ Y", desde: 535, hasta: 543 },
    { nombre: "ESCUELA EP Nº3/ES Nº28 ANEXO I", domicilio: "ADROGUE 438 E/ Y", desde: 544, hasta: 552 },
    { nombre: "ESCUELA EP Nº64", domicilio: "ALTOLAGUIRRE 452 E/ Y", desde: 553, hasta: 558 },
    { nombre: "ESCUELA ES Nº28", domicilio: "LA BLANQUEADA Nº4464 E/ Y", desde: 559, hasta: 564 },
    { nombre: "JARDIN DE INFANTES Nº929", domicilio: "LA BLANQUEADA 4434 E/ Y", desde: 565, hasta: 566 },
    { nombre: "JARD.DE INF.MUNIC.INES COLLAZO", domicilio: "MERLO 4160 E/ Y", desde: 567, hasta: 569 },
    { nombre: "FACULTAD TECNOLOGICA NACIONAL REGIONAL AVELLANEDA", domicilio: "AV.FRANCO RAMON COMTE. 5050 E/ Y", desde: 570, hasta: 574 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº38", domicilio: "POSADAS Nº956 E/ Y", desde: 575, hasta: 578 },
    { nombre: "ESCUELA EP Nº57", domicilio: "PASTEUR 1067 E/ Y", desde: 579, hasta: 585 },
    { nombre: "ESCUELA EP Nº59/ES Nº31", domicilio: "PIERRES 1250 E/ Y", desde: 586, hasta: 594 },
    { nombre: "ESCUELA EP Nº27", domicilio: "CHASCOMUS 975 E/ Y", desde: 595, hasta: 603 },
    { nombre: "ESCUELA EP Nº58", domicilio: "POSADAS E/HEREDIA Y CASACUBERTA E/ Y", desde: 604, hasta: 613 },
    { nombre: "ESCUELA EST Nº2", domicilio: "GRAL.PICO 1305 E/ Y", desde: 614, hasta: 622 },
    { nombre: "ESCUELA EP Nº32/ES Nº23", domicilio: "DE LA SERNA 4655 E/ Y", desde: 623, hasta: 632 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº2", domicilio: "GRAL PICO Y DE LA SERNA S/N E/ Y", desde: 633, hasta: 636 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº26", domicilio: "PEDERNERA 1769 E/ Y", desde: 637, hasta: 638 },
    { nombre: "CTRO.EDUC.COMPLEMENTARIO Nº123", domicilio: "OYUELA 1975 E/ Y", desde: 639, hasta: 643 },
    { nombre: "ESCUELA EP Nº61", domicilio: "BVARD.DE LOS ITALIANOS 1463 E/ Y", desde: 644, hasta: 651 },
    { nombre: "ESCUELA EP Nº8", domicilio: "MARTIN FIERRO 58 E/ AV.MITRE B. GRAL. Y MORENO MARIANO", desde: 652, hasta: 661 },
    { nombre: "JARDIN DE INFANTES Nº903", domicilio: "AV.MITRE 6174 E/ Y", desde: 662, hasta: 664 },
    { nombre: "INSTITUTO SAN DIEGO", domicilio: "BRANDSEN 5871 E/ Y", desde: 665, hasta: 671 },
    { nombre: "COLEGIO MODELO SARA ECCLESTON", domicilio: "PIRAN 152 E/ Y", desde: 672, hasta: 675 },
    { nombre: "ESCUELA EST Nº6", domicilio: "AV.MITRE 5711 E/ Y", desde: 676, hasta: 677 },
    { nombre: "ESCUELA EP Nº21", domicilio: "LOBOS 161 E/ Y", desde: 678, hasta: 686 },
    { nombre: "COLEGIO SAN IGNACIO", domicilio: "LINCOLN 345 E/ Y", desde: 687, hasta: 695 },
    { nombre: "COLEGIO MODELO JOHN F.KENNEDY (EP Y ES)", domicilio: "MARTIN FIERRO 567 E/ Y", desde: 696, hasta: 698 },
    { nombre: "ESCUELA ES Nº2", domicilio: "MARTIN FIERRO 590 E/ Y", desde: 699, hasta: 705 },
    { nombre: "ESCUELA EDUC.ESPECIAL Nº503", domicilio: "RAMON FRANCO 6083 E/ Y", desde: 706, hasta: 710 },
    { nombre: "JARDIN DE INFANTES Nº923", domicilio: "RAMON FRANCO 6081 E/ Y", desde: 711, hasta: 713 },
    { nombre: "ESCUELA EP Nº20", domicilio: "BAHIA BLANCA 585 E/ SOREDA SALVADOR Y AV.FRANCO RAMON COMTE.", desde: 714, hasta: 722 },
    { nombre: "COLEGIO MODELO PABLO PICASSO", domicilio: "AV.CASEROS 1152 E/ Y", desde: 723, hasta: 725 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº11", domicilio: "SAN NICOLAS 6178 E/ Y", desde: 726, hasta: 727 },
    { nombre: "COLEGIO SAN MIGUEL ARCANGEL", domicilio: "LAS FLORES 964 E/ Y", desde: 728, hasta: 730 },
    { nombre: "ESCUELA EP Nº50/ES Nº32", domicilio: "RAQUEL ESPAÑOL 1465 E/ Y", desde: 731, hasta: 740 },
    { nombre: "ESCUELA EP Nº52", domicilio: "PINO 6290 Y LARTIGAU - PUESTO 1 COMPLEJO HABITACIONAL E/ Y", desde: 741, hasta: 748 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº29", domicilio: "LAS FLORES 1600 E/ Y", desde: 749, hasta: 751 },
    { nombre: "ESCUELA ES Nº10", domicilio: "LAS FLORES 1600 E/ Y", desde: 752, hasta: 761 },
    { nombre: "ESCUELA EP Nº38", domicilio: "N.OROÑO 5950 E/ Y", desde: 762, hasta: 769 },
    { nombre: "JARDIN DE INFANTES Nº921", domicilio: "GUAMINI 5741 E/ Y", desde: 770, hasta: 771 },
    { nombre: "ESCUELA EP Nº43", domicilio: "MERLO 5687 E/ Y", desde: 772, hasta: 779 },
    { nombre: "INSTITUTO MARIANO MORENO", domicilio: "AV.ONSARI FABIAN 662 E/ Y", desde: 780, hasta: 784 },
    { nombre: "INSTITUTO SAN PABLO (EP Y ES)", domicilio: "RONDEAU 960 E/ Y", desde: 785, hasta: 792 },
    { nombre: "ESCUELA EP Nº55", domicilio: "RODO 1150 E/ Y", desde: 793, hasta: 802 },
    { nombre: "COLEGIO SALVADOR SOREDA(EP)", domicilio: "RODO 1264 E/ Y", desde: 803, hasta: 805 },
    { nombre: "JARDIN DE INFANTES Nº935", domicilio: "YAPEYU 724 E/ Y", desde: 806, hasta: 808 },
    { nombre: "ESCUELA ES Nº21", domicilio: "YAPEYU S/N ARREDONDO Y MANSILLA E/ Y", desde: 809, hasta: 813 },
    { nombre: "ESCUELA EP Nº69", domicilio: "LYNCH CNEL. 799 E/ Y", desde: 814, hasta: 818 },
    { nombre: "J.DE INFANTES MUNICIPAL Nº37", domicilio: "MARTINTO 1255 E/ Y", desde: 819, hasta: 820 },
    { nombre: "ESCUELA EP Nº51/ES Nº25", domicilio: "CAMPICHUELO 6709 E/ Y", desde: 821, hasta: 828 },
    { nombre: "ESCUELA EST Nº3", domicilio: "FRIULI Y CAXARAVILLE S/Nº E/ Y", desde: 829, hasta: 836 },
    { nombre: "ESCUELA ES Nº8", domicilio: "RONDEAU CNEL. 1910 E/ Y", desde: 837, hasta: 844 },
    { nombre: "ESCUELA EP Nº63", domicilio: "RONDEAU 1900 E/ Y", desde: 845, hasta: 853 },
    { nombre: "CLUB SOC.Y DEPORTIVO J.NEWBERY", domicilio: "BRAGADO 5670 E/ Y", desde: 854, hasta: 857 },
  ];

  dataParaPoblar.forEach(data => {
    // 1. Verificar o crear el establecimiento
    let establecimiento = db.get('establecimientos').find({ nombre: data.nombre }).value();

    if (!establecimiento) {
      establecimiento = {
        id: nanoid(),
        nombre: data.nombre,
        direccion: data.domicilio
      };
      db.get('establecimientos').push(establecimiento).write();
    }

    // 2. Crear las mesas para ese establecimiento
    for (let i = data.desde; i <= data.hasta; i++) {
      const numeroMesa = i.toString();
      const mesaExistente = db.get('mesas').find({ 
        numero: numeroMesa, 
        id_establecimiento: establecimiento.id 
      }).value();

      if (!mesaExistente) {
        const nuevaMesa = {
          id: nanoid(),
          numero: numeroMesa,
          id_establecimiento: establecimiento.id
        };
        db.get('mesas').push(nuevaMesa).write();
      }
    }
  });
  console.log('Proceso de población de datos finalizado.');
};

// Ejecutar la función para poblar los datos
poblarDatosIniciales();

// --- CONFIGURACIÓN DEL SERVIDOR ---
const app = express();

// Nueva configuración de CORS
app.use(cors({
  origin: "https://sistema-votos-five.vercel.app" // ¡Usa la URL real de tu Vercel aquí!
}));

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = 4000;
const ADMIN_PASSWORD = "LLA_AVELLANEDA_2025";

// --- FUNCIÓN DE ACTUALIZACIÓN GLOBAL ---
const actualizarResultadosGlobal = () => {
  const state = db.getState();
  io.emit('actualizacion_global', state);
  console.log('Estado global actualizado y enviado a los clientes.');
};

// ======================================================
// --- RUTAS DE LA API ---
// ======================================================

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.status(200).json({ success: true, message: 'Autenticación exitosa' });
  } else {
    res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  }
});

app.get('/api/estado', (req, res) => {
  res.json(db.getState());
});

app.post('/api/partidos', (req, res) => {
  const nuevoPartido = { id: nanoid(), ...req.body };
  db.get('partidos').push(nuevoPartido).write();
  actualizarResultadosGlobal();
  res.status(201).json(nuevoPartido);
});

app.delete('/api/partidos/:id', (req, res) => {
  db.get('partidos').remove({ id: req.params.id }).write();
  actualizarResultadosGlobal();
  res.status(200).json({ message: 'Partido eliminado' });
});

app.post('/api/establecimientos', (req, res) => {
  const nuevoEst = { id: nanoid(), ...req.body };
  db.get('establecimientos').push(nuevoEst).write();
  actualizarResultadosGlobal();
  res.status(201).json(nuevoEst);
});

app.delete('/api/establecimientos/:id', (req, res) => {
  db.get('establecimientos').remove({ id: req.params.id }).write();
  actualizarResultadosGlobal();
  res.status(200).json({ message: 'Establecimiento eliminado' });
});

app.post('/api/mesas', (req, res) => {
  const { numero, id_establecimiento } = req.body;
  const nuevaMesa = { id: nanoid(), numero, id_establecimiento };
  db.get('mesas').push(nuevaMesa).write();
  actualizarResultadosGlobal();
  res.status(201).json(nuevaMesa);
});

app.delete('/api/mesas/:id', (req, res) => {
  const idMesaBorrar = req.params.id;
  db.get('resultados').remove({ id_mesa: idMesaBorrar }).write();
  db.get('mesas').remove({ id: idMesaBorrar }).write();
  actualizarResultadosGlobal();
  console.log(`Mesa ${idMesaBorrar} y sus resultados han sido eliminados.`);
  res.status(200).json({ message: 'Mesa y sus resultados eliminados' });
});

app.post('/api/cargar-votos', (req, res) => {
  const { id_mesa, votos, esDudosa } = req.body;
  db.get('resultados').remove({ id_mesa: id_mesa }).write();
  const nuevosResultados = votos.map(voto => ({
    id: nanoid(),
    id_mesa: id_mesa,
    id_partido: voto.id_partido,
    cantidad_votos: parseInt(voto.cantidad) || 0,
    esDudosa: esDudosa
  }));
  db.get('resultados').push(...nuevosResultados).write();
  console.log(`Votos cargados para la mesa ${id_mesa}. ¿Dudosa?: ${esDudosa}`);
  actualizarResultadosGlobal();
  res.status(201).json({ message: 'Resultados cargados con éxito' });
});

// --- LÓGICA DE WEBSOCKETS ---
io.on('connection', (socket) => {
  console.log(`Un usuario se ha conectado: ${socket.id}`);
  socket.emit('actualizacion_global', db.getState());
  socket.on('disconnect', () => {
    console.log(`El usuario se ha desconectado: ${socket.id}`);
  });
});

// --- INICIAR EL SERVIDOR ---
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('LA CONTRASEÑA DE ADMIN ES:', ADMIN_PASSWORD);
});