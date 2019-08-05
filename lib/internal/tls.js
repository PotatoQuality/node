'use strict';

const {
  Object,
  StringPrototype: { indexOf: stringIndexOf },
} = primordials;

// Example:
// C=US\nST=CA\nL=SF\nO=Joyent\nOU=Node.js\nCN=ca1\nemailAddress=ry@clouds.org
function parseCertString(s) {
  const out = Object.create(null);
  const parts = s.split('\n');
  for (const part of parts) {
    const sepIndex = stringIndexOf(part, '=');
    if (sepIndex > 0) {
      const key = part.slice(0, sepIndex);
      const value = part.slice(sepIndex + 1);
      if (key in out) {
        if (!Array.isArray(out[key])) {
          out[key] = [out[key]];
        }
        out[key].push(value);
      } else {
        out[key] = value;
      }
    }
  }
  return out;
}

module.exports = {
  parseCertString
};
