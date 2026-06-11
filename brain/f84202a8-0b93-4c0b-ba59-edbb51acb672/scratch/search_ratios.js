const fs = require('fs');
const content = fs.readFileSync('c:/Users/cheer/Documents/turing/mantleye/ui/styles/bym0n0l0g.webflow.shared.03806ecaa.min.css', 'utf8');

const classes = ['.u-grid-landscape', '.u-ratio-'];
classes.forEach(cls => {
  const regex = new RegExp(cls.replace('.', '\\.') + '[^{]*\\{[^}]*\\}', 'g');
  let match;
  console.log(`=== Matches for ${cls} ===`);
  while ((match = regex.exec(content)) !== null) {
    console.log(match[0]);
  }
});
