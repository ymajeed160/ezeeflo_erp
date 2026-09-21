module.exports = function (config, env) {
  // Exclude packages from source-map-loader that have missing source maps
  const sourceMapExcludes = [
    /pdfjs-dist/,
    /@mui\/base/,
    /@mui\/x-charts/,
    /@mui\/x-date-pickers/,
    /@react-spring/,
  ];

  const rules = config.module.rules;
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule && typeof rule === 'object' && !Array.isArray(rule)) {
      if (rule.oneOf) {
        for (const oneOfRule of rule.oneOf) {
          if (oneOfRule.exclude && Array.isArray(oneOfRule.exclude)) {
            oneOfRule.exclude.push(...sourceMapExcludes);
          }
        }
      }
      if (rule.enforce === 'pre' && rule.use && rule.use.loader && rule.use.loader.includes('source-map-loader')) {
        if (!rule.exclude) rule.exclude = [];
        if (Array.isArray(rule.exclude)) {
          rule.exclude.push(...sourceMapExcludes);
        }
      }
    }
  }

  return config;
};
