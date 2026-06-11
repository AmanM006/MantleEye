const fs = require('fs');
const content = fs.readFileSync('c:/Users/cheer/Documents/turing/mantleye/ui/styles/bym0n0l0g.webflow.shared.03806ecaa.min.css', 'utf8');

const regex = /\.services_home_[^{]*\{[^}]*\}/g;
let match;
console.log("=== Matching styles ===");
while ((match = regex.exec(content)) !== null) {
  console.log(match[0]);
}

console.log("\n=== Checking other classes ===");
const otherRegex = /\.services_home[^{]*\{[^}]*\}/g;
while ((match = otherRegex.exec(content)) !== null) {
  console.log(match[0]);
}
