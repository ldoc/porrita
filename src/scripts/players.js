const puppeteer = require('puppeteer');
const fs = require('fs').promises;
let browser = null;
let page = null;

(async () => {
  // Lanzar Chrome en modo gráfico (headful)
  browser = await puppeteer.launch({
      headless: "new", // ventana visible
      args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu'
      ],
      defaultViewport: null // usar el tamaño completo de la ventana
  });

  page = await browser.newPage();

//   Opcional: cambiar user agent para parecer un navegador real
  await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
  );

  // Evitar que Puppeteer sea detectado como bot
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // leemos el fichero equipos.json
  let equipos = JSON.parse(await fs.readFile('src/data/equipos.json', 'utf8'));
  let jugadores = [];
  for(let i=0; i<equipos.length; i++)
  {
    console.log('procesando: ' + equipos[i].nombre + ' --> faltan: ' + (equipos.length - i));
    jugadores = jugadores.concat(await obtenerJugadores(page, equipos[i]));
  }
  jugadoresStr = JSON.stringify({jugadores: jugadores});
  fs.writeFile('src/data/jugadores.json', jugadoresStr);
  browser.close();

})();

async function obtenerJugadores (page, equipo) {
  let jugadores = [];
    const response = await page.goto("https://www.sofascore.com/api/v1/team/" + equipo.id + "/players", { waitUntil: 'networkidle2' });
    const datosObj = await response.json();
    for(let i = 0; i < datosObj.players.length; i++) {
      const jugador = datosObj.players[i];
      jugadores.push({
        id: jugador.player.id,
        nombre: jugador.player.name,
        seleccion: equipo.nombre,
        posicion: jugador.player.position,
        club: jugador.player.team.name
      });
    };
    return jugadores;
  
}
