// Prevent dotenv from loading environment files during tests
jest.mock('dotenv/config');

// Store original env vars
const originalEnv = { ...process.env };

// Helper to clean environment
function cleanEnv() {
  const clean: NodeJS.ProcessEnv = {};
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith('OTEL') && !key.startsWith('NEW_RELIC')) {
      clean[key] = process.env[key];
    }
  }
  return clean;
}

describe('Instrumentation', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset modules to ensure fresh import
    jest.resetModules();

    // Clean environment
    process.env = cleanEnv();

    // Spy on console
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
    // Remove any signal listeners added by instrumentation to avoid leaks
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    jest.resetModules();
  });

  describe('when OTEL_ENABLED is false', () => {
    it('should log disabled message', () => {
      process.env.OTEL_ENABLED = 'false';

      require('../../instrumentation');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[OTel] OpenTelemetry disabled (OTEL_ENABLED=false)'
      );
    });
  });

  describe('when OTEL_ENABLED is true but no endpoints', () => {
    it('should log no endpoints message', () => {
      process.env.OTEL_ENABLED = 'true';

      require('../../instrumentation');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[OTel] OpenTelemetry disabled (no OTLP endpoints configured)'
      );
    });
  });
});

// Separate describe block for tests that need mocked OTel modules
describe('Instrumentation with mocked OTel', () => {
  const originalEnv = { ...process.env };
  let consoleLogSpy: jest.SpyInstance;

  // These will hold the mock functions
  let mockNodeSDK: jest.Mock;
  let mockSdkStart: jest.Mock;
  let mockOTLPTraceExporter: jest.Mock;
  let mockOTLPMetricExporter: jest.Mock;
  let mockOTLPLogExporter: jest.Mock;
  let mockPeriodicExportingMetricReader: jest.Mock;
  let mockBatchLogRecordProcessor: jest.Mock;
  let mockBatchSpanProcessor: jest.Mock;
  let mockWinstonInstrumentation: jest.Mock;
  let mockGetNodeAutoInstrumentations: jest.Mock;
  let mockResourceFromAttributes: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    // Clean environment
    const clean: NodeJS.ProcessEnv = {};
    for (const key of Object.keys(process.env)) {
      if (!key.startsWith('OTEL') && !key.startsWith('NEW_RELIC')) {
        clean[key] = process.env[key];
      }
    }
    process.env = clean;

    // Create fresh mocks
    mockSdkStart = jest.fn();
    mockNodeSDK = jest.fn();
    mockOTLPTraceExporter = jest.fn();
    mockOTLPMetricExporter = jest.fn();
    mockOTLPLogExporter = jest.fn();
    mockPeriodicExportingMetricReader = jest.fn();
    mockBatchLogRecordProcessor = jest.fn();
    mockBatchSpanProcessor = jest.fn();
    mockWinstonInstrumentation = jest.fn();
    mockGetNodeAutoInstrumentations = jest.fn().mockReturnValue([]);
    mockResourceFromAttributes = jest.fn().mockReturnValue({});

    // Set up mocks using jest.doMock
    jest.doMock('@opentelemetry/sdk-node', () => {
      return {
        NodeSDK: class MockSDK {
          start = mockSdkStart;
          shutdown = jest.fn().mockResolvedValue(undefined);
          constructor(config: any) {
            mockNodeSDK(config);
          }
        },
      };
    });

    jest.doMock('@opentelemetry/auto-instrumentations-node', () => ({
      getNodeAutoInstrumentations: mockGetNodeAutoInstrumentations,
    }));

    jest.doMock('@opentelemetry/exporter-trace-otlp-proto', () => ({
      OTLPTraceExporter: mockOTLPTraceExporter,
    }));

    jest.doMock('@opentelemetry/exporter-metrics-otlp-proto', () => ({
      OTLPMetricExporter: mockOTLPMetricExporter,
    }));

    jest.doMock('@opentelemetry/exporter-logs-otlp-proto', () => ({
      OTLPLogExporter: mockOTLPLogExporter,
    }));

    jest.doMock('@opentelemetry/sdk-metrics', () => ({
      PeriodicExportingMetricReader: mockPeriodicExportingMetricReader,
    }));

    jest.doMock('@opentelemetry/sdk-logs', () => ({
      BatchLogRecordProcessor: mockBatchLogRecordProcessor,
      LogRecordProcessor: jest.fn(),
    }));

    jest.doMock('@opentelemetry/sdk-trace-base', () => ({
      BatchSpanProcessor: mockBatchSpanProcessor,
      SpanProcessor: jest.fn(),
    }));

    jest.doMock('@opentelemetry/instrumentation-winston', () => ({
      WinstonInstrumentation: mockWinstonInstrumentation,
    }));

    jest.doMock('@opentelemetry/resources', () => ({
      resourceFromAttributes: mockResourceFromAttributes,
    }));

    jest.doMock('@opentelemetry/semantic-conventions', () => ({
      ATTR_SERVICE_NAME: 'service.name',
      ATTR_SERVICE_VERSION: 'service.version',
      ATTR_DEPLOYMENT_ENVIRONMENT_NAME: 'deployment.environment.name',
    }));

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env = originalEnv;
    // Remove any signal listeners added by instrumentation to avoid leaks
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    jest.resetModules();
  });

  it('should initialize SDK with Grafana exporters', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://grafana.example.com/otlp';

    require('../../instrumentation');

    expect(mockOTLPTraceExporter).toHaveBeenCalledWith({
      url: 'https://grafana.example.com/otlp/v1/traces',
      headers: undefined,
    });
    expect(mockSdkStart).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[OTel] OpenTelemetry initialized - exporting to: Grafana'
    );
  });

  it('should parse OTLP headers correctly', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'Authorization=Basic abc123';

    require('../../instrumentation');

    expect(mockOTLPTraceExporter).toHaveBeenCalledWith({
      url: 'https://test.com/v1/traces',
      headers: { Authorization: 'Basic abc123' },
    });
  });

  it('should handle headers with equals signs in value', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'Auth=Basic abc=123==';

    require('../../instrumentation');

    expect(mockOTLPTraceExporter).toHaveBeenCalledWith({
      url: 'https://test.com/v1/traces',
      headers: { Auth: 'Basic abc=123==' },
    });
  });

  it('should handle multiple header pairs', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';
    process.env.OTEL_EXPORTER_OTLP_HEADERS = 'key1=value1,key2=value2';

    require('../../instrumentation');

    expect(mockOTLPTraceExporter).toHaveBeenCalledWith({
      url: 'https://test.com/v1/traces',
      headers: { key1: 'value1', key2: 'value2' },
    });
  });

  it('should use custom service name', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';
    process.env.OTEL_SERVICE_NAME = 'my-custom-service';

    require('../../instrumentation');

    expect(mockResourceFromAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        'service.name': 'my-custom-service',
      })
    );
  });

  it('should use custom service version', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';
    process.env.OTEL_SERVICE_VERSION = '2.0.0';

    require('../../instrumentation');

    expect(mockResourceFromAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        'service.version': '2.0.0',
      })
    );
  });

  it('should configure auto-instrumentations correctly', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';

    require('../../instrumentation');

    expect(mockGetNodeAutoInstrumentations).toHaveBeenCalledWith({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/ready', '/metrics'],
      },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-ioredis': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
    });
  });

  it('should configure Winston instrumentation', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';

    require('../../instrumentation');

    expect(mockWinstonInstrumentation).toHaveBeenCalledWith({
      disableLogSending: false,
      logSeverity: 'info',
    });
  });

  it('should configure metric reader with 60s interval', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';

    require('../../instrumentation');

    expect(mockPeriodicExportingMetricReader).toHaveBeenCalledWith({
      exporter: expect.anything(),
      exportIntervalMillis: 60000,
    });
  });

  it('should configure log processor with batch settings', () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'https://test.com';

    require('../../instrumentation');

    expect(mockBatchLogRecordProcessor).toHaveBeenCalledWith(expect.anything(), {
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
    });
  });
});
