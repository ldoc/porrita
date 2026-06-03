import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
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
    await descargarImagenConNombreOriginal(`https://img.sofascore.com/api/v1/team/${equipos[i].id}/image/small`, 'src/data/flags', equipos[i].id);
  }

  browser.close();

})();




/**
 * Descarga una imagen usando Puppeteer y la guarda usando el nombre original que viene en la URL.
 * @param {string} url - La URL de la imagen a descargar.
 * @param {string} carpetaDestino - La carpeta donde se guardará (ej: './src/public/escudos').
 * @returns {Promise<string>} - Retorna la ruta completa del archivo guardado.
 */
async function descargarImagenConNombreOriginal(url, carpetaDestino, equipoId) {
  let browser;
  try {
    // 1. Extraer el nombre del archivo original de la URL
    const urlObj = new URL(url);
    // urlObj.pathname nos da algo como '/imagenes/logos/real_madrid.png'
    let nombreArchivoOriginal = path.basename(urlObj.pathname); 

    // Decodificar caracteres raros por si la URL tiene espacios (%20) o acentos
    nombreArchivoOriginal = decodeURIComponent(nombreArchivoOriginal);

    // Si la URL no tiene un nombre claro (ej: termina en '/' o es solo una ID), le asignamos uno por defecto
    if (!nombreArchivoOriginal || !nombreArchivoOriginal.includes('.')) {
      nombreArchivoOriginal = `${equipoId}.png`;
    }

    // 2. Lanzamos el navegador en modo "headless"
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // 3. Vamos a la URL de la imagen
    const respuesta = await page.goto(url, { waitUntil: 'networkidle2' });

    if (!respuesta || respuesta.status() !== 200) {
      throw new Error(`Error al obtener la imagen mediante Puppeteer: ${respuesta ? respuesta.status() : 'No response'}`);
    }

    // 4. Obtenemos el buffer binario original de la imagen
    const buffer = await respuesta.buffer();

    // 5. Construimos la ruta final donde se va a escribir
    const rutaCompleta = path.join(carpetaDestino, nombreArchivoOriginal);

    // Asegurarnos de que la carpeta de destino exista antes de guardar
    await fs.mkdir(carpetaDestino, { recursive: true });

    // 6. Guardamos el archivo binario
    await fs.writeFile(rutaCompleta, buffer);

    // 7. Cerramos el navegador de forma segura
    await browser.close();

    // Devolvemos la ruta final para que la guardes en tu Base de Datos
    return rutaCompleta;

  } catch (error) {
    if (browser) await browser.close();
    console.error('Error en el proceso con Puppeteer:', error);
    throw error;
  }
}