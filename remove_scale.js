const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

// Regex para encontrar clases como active:scale-95, hover:scale-105, group-hover:scale-110, hover:scale-[1.02], active:scale-[0.98], etc.
const scaleRegex = /\b(?:hover|active|group-hover|focus-within|focus):scale-(?:\[[0-9.]+\]|[0-9]+)\b/g;

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir(directoryPath, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    if (scaleRegex.test(originalContent)) {
      const newContent = originalContent.replace(scaleRegex, '').replace(/ +/g, ' '); // limpia espacios dobles
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Modificado: ${filePath}`);
      modifiedFiles++;
    }
  }
});

console.log(`\n¡Listo! Se eliminaron los efectos de hover/active scale en ${modifiedFiles} archivos.`);
