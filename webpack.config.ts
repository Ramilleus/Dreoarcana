import * as fs from 'fs-extra'
import * as path from 'path'
import * as process from 'process'
import { Configuration as WebpackConfiguration, DefinePlugin } from 'webpack'
import CopyPlugin from 'copy-webpack-plugin'
import { Request } from 'webpack-dev-server'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import * as glob from 'glob'

const buildMode = process.argv[3] === 'production' ? 'production' : 'development'
const isProductionBuild = buildMode === 'production'

const allTemplates = () => {
  return glob
    .sync('**/*.hbs', { cwd: path.join(__dirname, 'static/templates') })
    .map((file: string) => `"systems/mythras/templates/${file}"`)
    .join(', ')
}

const [outDir, foundryUri] = (() => {
  const configPath = path.resolve(process.cwd(), 'foundryconfig.json')
  const config = fs.readJSONSync(configPath, { throws: false })
  const outDir =
    config instanceof Object
      ? path.join(config.dataPath, 'Data', 'systems', config.systemName ?? 'mythras')
      : path.join(__dirname, 'dist/')
  const foundryUri = (config instanceof Object ? config.foundryUri : '') ?? 'http://localhost:30000'
  return [outDir, foundryUri]
})()

type Optimization = WebpackConfiguration['optimization']
const optimization: Optimization = isProductionBuild
  ? {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: { mangle: false, module: true, keep_classnames: true }
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            name: 'main',
            test: 'src/mythras.ts'
          },
          vendor: {
            name: 'vendor',
            test: /node_modules/
          }
        }
      }
    }
  : undefined

const config: WebpackConfiguration = {
  context: __dirname,
  mode: buildMode,
  entry: {
    main: './src/mythras.ts'
  },
  module: {
    rules: [
      !isProductionBuild
        ? {
            test: /\.hbs$/,
            loader: 'raw-loader'
          }
        : {
            test: /\.hbs$/,
            loader: 'null-loader'
          },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              experimentalWatchApi: !isProductionBuild,
              happyPackMode: true,
              transpileOnly: true,
              compilerOptions: {
                noEmit: false
              }
            }
          },
          'webpack-import-glob-loader'
        ]
      },
      {
        test: /template-preloader\.ts$/,
        use: [
          {
            loader: 'string-replace-loader',
            options: {
              search: '"__ALL_TEMPLATES__"',
              replace: allTemplates
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                includePaths: ['src/styles']
              }
            }
          }
        ]
      }
    ]
  },
  devtool: isProductionBuild ? undefined : 'inline-source-map',
  bail: isProductionBuild,
  watch: !isProductionBuild,
  devServer: {
    hot: true,
    devMiddleware: {
      writeToDisk: true
    },
    proxy: {
      context: (pathname: string, _request: Request) => {
        return !pathname.match('^/ws')
      },
      target: foundryUri,
      ws: true
    }
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({ typescript: { memoryLimit: 4096 } }),
    new DefinePlugin({
      BUILD_MODE: JSON.stringify(buildMode)
    }),
    new CopyPlugin({
      patterns: [
        { from: 'system.json' },
        {
          from: 'static/',
          transform(content: Buffer, absoluteFrom: string) {
            if (path.basename(absoluteFrom) === 'en.json') {
              return JSON.stringify(JSON.parse(content.toString()))
            }
            return content
          }
        }
      ]
    }),
    new MiniCssExtractPlugin({ filename: 'styles/[name].css' }),
    new SimpleProgressWebpackPlugin({ format: 'compact' })
  ],
  optimization: optimization,
  resolve: {
    alias: {
      '@module': path.resolve(__dirname, 'src/module'),
      '@actor': path.resolve(__dirname, 'src/module/actor'),
      '@apps': path.resolve(__dirname, 'src/module/apps'),
      '@item': path.resolve(__dirname, 'src/module/item'),
      '@combat': path.resolve(__dirname, 'src/module/combat'),
      '@scripts': path.resolve(__dirname, 'src/scripts'),
      '@util': path.resolve(__dirname, 'src/util')
    },
    extensions: ['.ts', '.js']
  },
  output: {
    clean: true,
    path: outDir,
    filename: '[name].bundle.js',
    publicPath: '/systems/mythras'
  },
  externals: {
    https: require.resolve('https')
  }
}

export default config
