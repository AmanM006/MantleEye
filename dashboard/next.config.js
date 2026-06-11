const path = require('path');

const nextConfig = {
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  transpilePackages: [
    '@shadergradient/react',
    'three',
    '@react-three/fiber',
    '@react-spring/three'
  ],
  webpack: (config) => {
    config.resolve.alias['@shadergradient/react'] = path.resolve(
      __dirname,
      'node_modules/@shadergradient/react/dist/index.mjs'
    );
    return config;
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
