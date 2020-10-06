const fs = require('fs');
const p = require('path');

// walk $PATH to find bin
const which = (bin) => {
    const path = process.env.PATH.split(p.delimiter);
    const location = path.find((part) => {
        const file = part + p.sep + bin;
        if (fs.existsSync(file)) return file;
        return false;
    });
    return location + p.sep + bin;
};

const config = {
    shredPath: which(process.platform === 'darwin' ? 'gshred' : 'shred'),
};

module.exports = config;
