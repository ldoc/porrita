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

  let equipos = await obtenerEquipos(page);
    
  equipos = JSON.stringify({equipos: equipos});

  fs.writeFile('src/data/equipos.json', equipos);

  await browser.close();
})();

 async function obtenerEquipos (page) {
   let equipos = [];
    const response = await page.goto("https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/standings/total", { waitUntil: 'networkidle2' });
    const datosObj = await response.json();
    for(group in datosObj.standings) {
      const grupo = datosObj.standings[group];
      console.log(grupo.name);
      for(team in grupo.rows) {
        const equipo = grupo.rows[team];
        // obtenemos la imagen del equipo
        
        equipos.push({
          nombre: equipo.team.name,
          id: equipo.team.id
        });
      }
    };
    return equipos;
}
