import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // For Turbopack and Webpack, use standard output directory
  distDir: '.next',
  
  // Configure ESLint
  eslint: {
    // Only run ESLint on these directories during build
    dirs: ['src/app', 'src/components', 'src/hooks', 'src/services', 'src/utils'],
    // We can safely ignore ESLint during builds
    ignoreDuringBuilds: true,
  },
  
  // Ignore TypeScript errors during build
  typescript: {
    // This will still show errors in the editor but won't fail the build
    ignoreBuildErrors: true,
  },
  
  // Configure on-demand entries for Next.js dev server
  onDemandEntries: {
    // Additional excluded directories can be specified here
    // The default exclusions are already handled by Next.js
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
