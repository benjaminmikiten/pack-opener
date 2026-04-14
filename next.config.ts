import type { NextConfig } from 'next'

const isGithubActions = process.env.GITHUB_ACTIONS === 'true'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGithubActions ? '/pack-opener' : '',
  assetPrefix: isGithubActions ? '/pack-opener/' : '',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubActions ? '/pack-opener' : '',
  },
}

export default nextConfig
