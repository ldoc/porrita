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

  let partidos = [];
  // por cada ronda obtenemos los partidos (hay 3 rondas en la fase de grupos)
  for(let i=1; i<=3; i++)
  {
    console.log('procesando ronda: ' + i + ' --> faltan: ' + (3 - i));
    partidos = partidos.concat(await obtenerPartidos(page, i));
  }
  partidosStr = JSON.stringify({partidos: partidos});
  fs.writeFile('src/data/partidos.json', partidosStr);
  browser.close();

})();

async function obtenerPartidos (page, ronda) {
  let partidos = [];
    const response = await page.goto("https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/events/round/" + ronda, { waitUntil: 'networkidle2' });
    const datosObj = await response.json();
    for(let i = 0; i < datosObj.events.length; i++) {
      const partido = datosObj.events[i];
      partidos.push({
        id: partido.id,
        equipoCasa: partido.homeTeam.id,
        equipoFuera: partido.awayTeam.id,
        // convertimos el timestamp a formato legible
        fecha: partido.startTimestamp ? new Date(partido.startTimestamp * 1000).toISOString() : null,
      });
    };
    return partidos;
  
}

