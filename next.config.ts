import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/batches/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/hod/batches/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/students/contacts/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;
