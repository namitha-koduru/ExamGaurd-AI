import fs from 'fs';
import path from 'path';

const pngBuffer = fs.readFileSync('public/ExamGaurd.png');
const base64 = pngBuffer.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,${base64}" />
</svg>
`;
fs.writeFileSync('public/favicon.svg', svg);
console.log('Successfully updated public/favicon.svg with base64 robot image');
