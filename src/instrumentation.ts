// @ts-nocheck

export async function register() {
  console.log("🛠️ Starting Instrumentation registration...");

  try {
    if (
      typeof window === "undefined" &&
      process.env.NEXT_RUNTIME === "nodejs"
    ) {
      console.log("Registering dd-trace");

      const ddTrace = await import("dd-trace");

      const tracer = ddTrace.default.init({
        profiling: true,
        runtimeMetrics: true,
        logInjection: true,
      });

      // Monitor Winston Logger
      tracer.use("winston", {
        enabled: true,
      });

      // Monitor HTTP requests
      tracer.use("http", {
        hooks: {
          request(span, req, res) {
            if (span && req) {
              const urlString = "path" in req ? req.path : req.url;

              if (urlString) {
                const url = new URL(urlString, "http://localhost");
                const resourceGroup = url.pathname;
                const method = req.method;

                span.setTag(
                  "resource.name",
                  method ? `${method} ${resourceGroup}` : resourceGroup
                );
              }
            }
          },
        },
      });

      // Disable the Next.js instrumentation as it creates duplicate spans
      tracer.use("next", {
        enabled: false,
      });

      console.log("dd-trace registered");
    }
  } catch (error) {
    return console.error("🔴 Instrumentation registration error: ", error);
  }

  console.log("✅ Instrumentation registration complete.");
}
