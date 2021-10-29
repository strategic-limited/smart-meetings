const {
  override,
  addWebpackExternals,
  useBabelRc,
  fixBabelImports,
  addWebpackModuleRule,
  addWebpackPlugin,
  disableEsLint,
  babelInclude,
  babelExclude,
  addBundleVisualizer,
  getBabelLoader,
  addWebpackAlias,
  // addWebpackTarget,
} = require('customize-cra')
const { DefinePlugin } = require('webpack')
const addWebpackTarget = target => config => {
  config.target = target
  return config
}
const path = require('path')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin')

const ProgressBarPlugin = require('progress-bar-webpack-plugin')

const isElectron = process.env.REACT_APP_RUNTIME_PLATFORM === 'electron'

const { devDependencies } = require('./package.json');

// TODO: You can customize your env

const isProd = process.env.ENV === 'production';

const webWorkerConfig = () => config => {
  config.optimization = {
    ...config.optimization,
    noEmitOnErrors: false,
  }
  config.output = {
    ...config.output,
    globalObject: 'this',
  }
  return config
}

const sourceMap = () => config => {
  // TODO: Please use 'source-map' in production environment

  config.devtool = 'source-map'
  //config.devtool = isProd ? 'source-map' : 'cheap-module-eval-source-map'
  return config;
}

const setElectronDeps = isProd ? {
  ...devDependencies,
  "agora-electron-sdk": "commonjs2 agora-electron-sdk"
} : {
  "agora-electron-sdk": "commonjs2 agora-electron-sdk"
}

const useOptimizeBabelConfig = () => config => {
  const rule = {
    test: /\.(ts)x?$/i,
    include: [
      path.resolve("src")
    ],
    use: [
      'thread-loader', 'cache-loader', getBabelLoader(config).loader
    ],
    exclude: [
      path.resolve("node_modules"),
    ]
  }

  for (let _rule of config.module.rules) {
    if (_rule.oneOf) {
      _rule.oneOf.unshift(rule);
      break;
    }
  }
  return config;
}

module.exports = override(
  //useBabelRc(),
  isElectron && addWebpackTarget('electron-renderer'),
  disableEsLint(),
  webWorkerConfig(),
  sourceMap(),
  addWebpackModuleRule({
    test: /\.worker\.js$/,
    use: { loader: 'worker-loader' },
  }),
  isElectron && addWebpackExternals(setElectronDeps),
  fixBabelImports("import", [
    {
      libraryName: "@material-ui/core",
      libraryDirectory: "esm",
      camel2DashComponentName: false
    },
    {
      libraryName: "@material-ui/icon",
      libraryDirectory: "esm",
      camel2DashComponentName: false
    }
  ]),
  addWebpackPlugin(
    new SimpleProgressWebpackPlugin()
  ),
  babelInclude([
    path.resolve("src")
  ]),
  babelExclude([
    path.resolve("node_modules")
  ]),
  addWebpackPlugin(
    new HardSourceWebpackPlugin({
      root: process.cwd(),
      directories: [],
      environmentHash: {
        root: process.cwd(),
        directories: [],
        files: ['package.json', 'package-lock.json', 'yarn.lock', '.env', '.env.local', 'env.local'],
      }
    })
  ),
  // addBundleVisualizer({
  //   // "analyzerMode": "static",
  //   // "reportFilename": "report.html"
  // }, true),
  useOptimizeBabelConfig(),
  addWebpackAlias({
    ['@']: path.resolve(__dirname, 'src')
  }),
  addWebpackPlugin(new DefinePlugin({
    'REACT_APP_AGORA_APP_SDK_DOMAIN': JSON.stringify(process.env.REACT_APP_AGORA_APP_SDK_DOMAIN),
    'REACT_APP_AGORA_APP_SDK_LOG_SECRET': JSON.stringify(process.env.REACT_APP_AGORA_APP_SDK_DOMAIN)
  }))
)
