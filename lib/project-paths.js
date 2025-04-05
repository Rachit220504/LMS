const path = require('path');

// Project root directory
const rootDir = path.resolve(__dirname, '..');

// Export path resolving function
module.exports = {
  resolveProjectPath: (relativePath) => path.join(rootDir, relativePath)
};
