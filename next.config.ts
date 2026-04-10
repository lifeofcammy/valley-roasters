import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Square uploads catalog images to S3 and serves them via various
      // *.squareup.com / *.squarecdn.com hosts. Allow them all so the
      // /wholesale page can render Square product photos.
      {
        protocol: "https",
        hostname: "**.squareup.com",
      },
      {
        protocol: "https",
        hostname: "**.squarecdn.com",
      },
      {
        protocol: "https",
        hostname: "items-images-production.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
