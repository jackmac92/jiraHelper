export default {
  dest: 'bundle.js',
  format: 'cjs',
  entry: 'index.js',
  external: ['bluebird', 'localApi', 'jira']
};
