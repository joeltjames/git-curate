const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const version = require('../package.json').version;
const releaseDir = path.join(__dirname, '../release');

// Create release directory if it doesn't exist
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir);
}

// Get list of binaries
const binDir = path.join(__dirname, '../bin');
const binaries = fs.readdirSync(binDir);

// Create checksums file
const checksums = {};
for (const binary of binaries) {
  const binaryPath = path.join(binDir, binary);
  const checksum = execSync(`shasum -a 256 "${binaryPath}"`).toString().split(' ')[0];
  checksums[binary] = checksum;
}

// Write checksums file
fs.writeFileSync(
  path.join(releaseDir, 'checksums.txt'),
  Object.entries(checksums)
    .map(([file, hash]) => `${hash}  ${file}`)
    .join('\n') + '\n'
);

// Create README for release
const readme = `# git-curate v${version}

## Installation

Download the appropriate binary for your system from the release assets.

## Verification

Verify the integrity of the downloaded binary using the checksums:

\`\`\`bash
# For macOS/Linux
shasum -a 256 -c checksums.txt

# For Windows (PowerShell)
Get-FileHash -Algorithm SHA256 <binary> | Select-Object -ExpandProperty Hash
\`\`\`

## Usage

\`\`\`bash
# Make the binary executable (macOS/Linux)
chmod +x git-curate

# Run the tool
./git-curate --help
\`\`\`
`;

fs.writeFileSync(path.join(releaseDir, 'README.md'), readme);

console.log('Release files created in the release directory'); 