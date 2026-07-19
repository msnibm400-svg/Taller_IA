const fs = require('fs');
const https = require('https');

const data = JSON.parse(fs.readFileSync('C:\\Users\\Marco\\.gemini\\antigravity-ide\\brain\\80a9137f-44fb-44ad-8306-0dc185ec88f6\\.system_generated\\steps\\231\\output.txt', 'utf8'));

const outDir = 'C:\\Users\\Marco\\Documents\\Maestria UCV\\Cursos\\Gestión e Innovación Tecnológica\\MedicIA\\stitch_html';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

data.screens.forEach(screen => {
  if (screen.htmlCode && screen.htmlCode.downloadUrl) {
    const title = screen.title.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const file = fs.createWriteStream(`${outDir}\\${title}.html`);
    https.get(screen.htmlCode.downloadUrl, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${title}.html`);
      });
    }).on('error', err => {
      fs.unlink(`${outDir}\\${title}.html`);
      console.error(`Error downloading ${title}: ${err.message}`);
    });
  }
});
