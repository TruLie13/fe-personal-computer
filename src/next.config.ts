import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Case / shorthand aliases → logged-in user's PC (stub: /C/users/local)
      { source: "/c", destination: "/C/users/local", permanent: false },
      { source: "/c/users", destination: "/C/users/local", permanent: false },
      { source: "/c/users/:username", destination: "/C/users/:username", permanent: false },
      {
        source: "/c/users/:username/:fileSlug",
        destination: "/C/users/:username/:fileSlug",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
