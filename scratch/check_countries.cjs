const { defaultCountries } = require('react-international-phone');

const countriesToCheck = ['pe', 'ar', 'bo', 'br', 'cl', 'co', 'cr', 'cu', 'do', 'ec', 'sv', 'gt', 'hn', 'mx', 'ni', 'pa', 'py', 'uy', 've', 'us', 'ca', 'es', 'pr', 'bz'];

const results = defaultCountries
  .filter(c => countriesToCheck.includes(c[1]))
  .map(c => {
    const format = c[3];
    const mask = typeof format === 'string' ? format : (format?.default || '');
    const dots = (mask.split('.').length - 1);
    return { iso2: c[1], dialCode: c[2], format, mask, dots };
  });

console.log(JSON.stringify(results, null, 2));
