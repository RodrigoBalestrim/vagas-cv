import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit precisa dos arquivos .afm (métricas de fonte) em runtime
  outputFileTracingIncludes: {
    "/api/resume": ["./node_modules/pdfkit/js/data/**"],
  },
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
