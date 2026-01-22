import "dotenv/config";

// Check if OTel is enabled before initializing
const otelEnabled = process.env.OTEL_ENABLED === "true";
const grafanaEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const newRelicEndpoint = process.env.NEW_RELIC_OTLP_ENDPOINT;
const newRelicLicenseKey = process.env.NEW_RELIC_LICENSE_KEY;

if (otelEnabled && (grafanaEndpoint || newRelicEndpoint)) {
  const { NodeSDK } = require("@opentelemetry/sdk-node");
  const {
    getNodeAutoInstrumentations,
  } = require("@opentelemetry/auto-instrumentations-node");
  const {
    OTLPTraceExporter,
  } = require("@opentelemetry/exporter-trace-otlp-proto");
  const {
    OTLPMetricExporter,
  } = require("@opentelemetry/exporter-metrics-otlp-proto");
  const {
    OTLPLogExporter,
  } = require("@opentelemetry/exporter-logs-otlp-proto");
  const {
    PeriodicExportingMetricReader,
  } = require("@opentelemetry/sdk-metrics");
  const {
    BatchLogRecordProcessor,
    LogRecordProcessor,
  } = require("@opentelemetry/sdk-logs");
  const {
    BatchSpanProcessor,
    SpanProcessor,
  } = require("@opentelemetry/sdk-trace-base");
  const {
    WinstonInstrumentation,
  } = require("@opentelemetry/instrumentation-winston");
  const { resourceFromAttributes } = require("@opentelemetry/resources");
  const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
    ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  } = require("@opentelemetry/semantic-conventions");

  const serviceName = process.env.OTEL_SERVICE_NAME || "wryte-api";
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || "1.0.0";
  const grafanaHeaders = parseOtlpHeaders(
    process.env.OTEL_EXPORTER_OTLP_HEADERS
  );

  // Create resource with service metadata
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || "development",
  });

  // Collect span processors for multi-backend export
  const spanProcessors: typeof SpanProcessor[] = [];
  const metricReaders: typeof PeriodicExportingMetricReader[] = [];
  const logProcessors: typeof LogRecordProcessor[] = [];
  const enabledBackends: string[] = [];

  // Configure Grafana exporters
  if (grafanaEndpoint) {
    const grafanaTraceExporter = new OTLPTraceExporter({
      url: `${grafanaEndpoint}/v1/traces`,
      headers: grafanaHeaders,
    });
    spanProcessors.push(new BatchSpanProcessor(grafanaTraceExporter));

    const grafanaMetricExporter = new OTLPMetricExporter({
      url: `${grafanaEndpoint}/v1/metrics`,
      headers: grafanaHeaders,
    });
    metricReaders.push(
      new PeriodicExportingMetricReader({
        exporter: grafanaMetricExporter,
        exportIntervalMillis: 60000,
      })
    );

    const grafanaLogExporter = new OTLPLogExporter({
      url: `${grafanaEndpoint}/v1/logs`,
      headers: grafanaHeaders,
    });
    logProcessors.push(
      new BatchLogRecordProcessor(grafanaLogExporter, {
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000,
      })
    );

    enabledBackends.push("Grafana");
  }

  // Configure New Relic exporters
  if (newRelicEndpoint && newRelicLicenseKey) {
    const newRelicHeaders = { "api-key": newRelicLicenseKey };

    const newRelicTraceExporter = new OTLPTraceExporter({
      url: `${newRelicEndpoint}/v1/traces`,
      headers: newRelicHeaders,
    });
    spanProcessors.push(new BatchSpanProcessor(newRelicTraceExporter));

    const newRelicMetricExporter = new OTLPMetricExporter({
      url: `${newRelicEndpoint}/v1/metrics`,
      headers: newRelicHeaders,
    });
    metricReaders.push(
      new PeriodicExportingMetricReader({
        exporter: newRelicMetricExporter,
        exportIntervalMillis: 60000,
      })
    );

    const newRelicLogExporter = new OTLPLogExporter({
      url: `${newRelicEndpoint}/v1/logs`,
      headers: newRelicHeaders,
    });
    logProcessors.push(
      new BatchLogRecordProcessor(newRelicLogExporter, {
        maxExportBatchSize: 512,
        scheduledDelayMillis: 5000,
      })
    );

    enabledBackends.push("New Relic");
  }

  // Initialize OpenTelemetry SDK
  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    metricReader: metricReaders[0], // SDK only accepts one metric reader
    logRecordProcessors: logProcessors,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
        // Configure HTTP instrumentation
        "@opentelemetry/instrumentation-http": {
          ignoreIncomingPaths: ["/health", "/ready", "/metrics"],
        },
        // Configure Express instrumentation
        "@opentelemetry/instrumentation-express": {
          enabled: true,
        },
        // Configure Redis instrumentation
        "@opentelemetry/instrumentation-ioredis": {
          enabled: true,
        },
        // Configure pg instrumentation for Prisma
        "@opentelemetry/instrumentation-pg": {
          enabled: true,
        },
      }),
      // Winston instrumentation for log correlation
      new WinstonInstrumentation({
        disableLogSending: false,
        logSeverity: "info",
      }),
    ],
  });

  // Add additional metric readers manually if we have more than one
  if (metricReaders.length > 1) {
    // Note: NodeSDK only supports one metricReader, so for multi-backend metrics
    // you would need to use a collector. Traces and logs support multiple processors.
    console.log(
      "[OTel] Note: Only first metric reader used. For multi-backend metrics, use OTel Collector."
    );
  }

  // Start the SDK
  sdk.start();

  console.log(
    `[OTel] OpenTelemetry initialized - exporting to: ${enabledBackends.join(", ")}`
  );

  // Graceful shutdown
  const shutdown = async () => {
    try {
      await sdk.shutdown();
      console.log("[OTel] OpenTelemetry shut down successfully");
    } catch (error) {
      console.error("[OTel] Error shutting down OpenTelemetry:", error);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} else {
  if (!otelEnabled) {
    console.log("[OTel] OpenTelemetry disabled (OTEL_ENABLED=false)");
  } else {
    console.log(
      "[OTel] OpenTelemetry disabled (no OTLP endpoints configured)"
    );
  }
}

/**
 * Parse OTLP headers from environment variable
 * Format: "key1=value1,key2=value2" or "Authorization=Basic xxx"
 */
function parseOtlpHeaders(
  headersString?: string
): Record<string, string> | undefined {
  if (!headersString) return undefined;

  const headers: Record<string, string> = {};
  const pairs = headersString.split(",");

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split("=");
    if (key && valueParts.length > 0) {
      headers[key.trim()] = valueParts.join("=").trim();
    }
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}
