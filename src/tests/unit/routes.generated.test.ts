// Mocks for controllers and middleware to avoid side effects when importing generated routes
// Mock @tsoa/runtime to avoid Reflect metadata / middleware fetch issues from generated routes
jest.mock('@tsoa/runtime', () => ({
  fetchMiddlewares: () => [],
  ExpressTemplateService: class {
    constructor() {}
    getValidatedArgs() {
      return [];
    }
    async apiHandler() {
      return undefined;
    }
  },
}));
jest.mock('../../controllers/titles.controller.tsoa', () => ({
  TitlesController: class {
    getTitles() {}
    updateTitle() {}
    deleteTitle() {}
  },
}));

jest.mock('../../controllers/settings.controller.tsoa', () => ({
  SettingsController: class {
    getSettings() {}
    upsertSettings() {}
  },
}));

jest.mock('../../controllers/outlines.controller.tsoa', () => ({
  OutlinesController: class {
    getOutlines() {}
  },
}));

jest.mock('../../controllers/organizations.controller.tsoa', () => ({
  OrganizationsController: class {
    getAll() {}
    create() {}
    getById() {}
  },
}));

jest.mock('../../controllers/jobs.controller.tsoa', () => ({
  JobsController: class {
    createTitleJob() {}
    createOutlineJob() {}
    createBlogJob() {}
  },
}));

jest.mock('../../controllers/health.controller.tsoa', () => ({
  HealthController: class {
    check() {}
  },
}));

jest.mock('../../controllers/calendar.controller.tsoa', () => ({
  CalendarController: class {
    getCalendarEvents() {}
  },
}));

jest.mock('../../controllers/blogs.controller.tsoa', () => ({
  BlogsController: class {
    getBlogs() {}
  },
}));

// Mock authentication middleware export
jest.mock('../../middleware/auth.middleware', () => ({
  expressAuthentication: jest.fn().mockResolvedValue(undefined),
}));

import { RegisterRoutes } from '../../routes/generated/routes';

describe('generated routes registration', () => {
  test('RegisterRoutes registers expected paths on router', () => {
    const calls: { method: string; path: string; handlers: number }[] = [];

    const router: any = {
      get: (path: string, ...handlers: any[]) => calls.push({ method: 'get', path, handlers: handlers.length }),
      post: (path: string, ...handlers: any[]) => calls.push({ method: 'post', path, handlers: handlers.length }),
      patch: (path: string, ...handlers: any[]) => calls.push({ method: 'patch', path, handlers: handlers.length }),
      delete: (path: string, ...handlers: any[]) => calls.push({ method: 'delete', path, handlers: handlers.length }),
      put: (path: string, ...handlers: any[]) => calls.push({ method: 'put', path, handlers: handlers.length }),
      // Express Router may also have 'use' — include a noop to be safe
      use: (path: any, ..._handlers: any[]) => calls.push({ method: 'use', path: String(path), handlers: _handlers.length }),
    };

    RegisterRoutes(router as any);

    // Basic sanity: ensure some routes were registered
    expect(calls.length).toBeGreaterThan(10);

    // Check some known routes exist
    const paths = calls.map((c) => c.path);
    expect(paths).toEqual(expect.arrayContaining([
      '/organizations/:orgId/titles',
      '/organizations/:orgId/settings',
      '/organizations/:orgId/outlines',
    ]));
  });
});
