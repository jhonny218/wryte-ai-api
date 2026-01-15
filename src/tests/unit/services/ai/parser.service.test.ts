import { ParserService } from '../../../../services/ai/parser.service';

describe('ParserService', () => {
  let parserService: ParserService;

  beforeEach(() => {
    parserService = new ParserService();
    jest.clearAllMocks();
  });

  describe('parseTitleResponse', () => {
    it('should parse valid JSON array', () => {
      const response = '["Title 1", "Title 2", "Title 3"]';
      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2', 'Title 3']);
    });

    it('should parse JSON array with extra text before', () => {
      const response = 'Here are the titles:\n["Title 1", "Title 2"]';
      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2']);
    });

    it('should parse JSON array with extra text after', () => {
      const response = '["Title 1", "Title 2"]\nHope this helps!';
      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2']);
    });

    it('should parse JSON array with extra text before and after', () => {
      const response = 'Sure! Here are the titles:\n["Title 1", "Title 2", "Title 3"]\nLet me know if you need more!';
      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2', 'Title 3']);
    });

    it('should trim whitespace from titles', () => {
      const response = '["  Title 1  ", "Title 2   ", "   Title 3"]';
      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2', 'Title 3']);
    });

    it('should filter out empty strings', () => {
      const response = '["Title 1", "", "Title 2", "   ", "Title 3"]';
      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2', 'Title 3']);
    });

    it('should return empty array for null response', () => {
      const result = parserService.parseTitleResponse(null);

      expect(result).toEqual([]);
    });

    it('should fallback to line splitting when JSON parsing fails', () => {
      const response = '1. First Title\n2. Second Title\n3. Third Title';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['First Title', 'Second Title', 'Third Title']);

      consoleErrorSpy.mockRestore();
    });

    it('should handle numbered list with dots', () => {
      const response = '1. Title One\n2. Title Two\n3. Title Three';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title One', 'Title Two', 'Title Three']);

      consoleErrorSpy.mockRestore();
    });

    it('should handle numbered list with parentheses', () => {
      const response = '1) Title One\n2) Title Two\n3) Title Three';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title One', 'Title Two', 'Title Three']);

      consoleErrorSpy.mockRestore();
    });

    it('should filter out bracket lines in fallback mode', () => {
      const response = '[\nTitle 1\nTitle 2\n]';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = parserService.parseTitleResponse(response);

      expect(result).toEqual(['Title 1', 'Title 2']);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('parseOutlineResponse', () => {
    it('should parse valid JSON object', () => {
      const response = '{"title": "Test", "structure": {}}';
      const result = parserService.parseOutlineResponse(response);

      expect(result).toEqual({ title: 'Test', structure: {} });
    });

    it('should parse JSON object with extra text before', () => {
      const response = 'Here is the outline:\n{"title": "Test", "seoKeywords": ["keyword1"]}';
      const result = parserService.parseOutlineResponse(response);

      expect(result).toEqual({ title: 'Test', seoKeywords: ['keyword1'] });
    });

    it('should parse JSON object with extra text after', () => {
      const response = '{"title": "Test", "structure": {}}\nHope this helps!';
      const result = parserService.parseOutlineResponse(response);

      expect(result).toEqual({ title: 'Test', structure: {} });
    });

    it('should parse complex nested JSON object', () => {
      const outline = {
        title: 'Test Title',
        seoKeywords: ['keyword1', 'keyword2'],
        structure: {
          introduction: { summary: 'Intro' },
          sections: [{ heading: 'Section 1' }],
        },
      };
      const response = JSON.stringify(outline);

      const result = parserService.parseOutlineResponse(response);

      expect(result).toEqual(outline);
    });

    it('should return null for null response', () => {
      const result = parserService.parseOutlineResponse(null);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const response = 'This is not valid JSON at all';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = parserService.parseOutlineResponse(response);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON with markdown code fences', () => {
      const response = '```json\n{"title": "Test", "structure": {}}\n```';
      const result = parserService.parseOutlineResponse(response);

      expect(result).toEqual({ title: 'Test', structure: {} });
    });
  });

  describe('parseBlogResponse', () => {
    it('should parse valid JSON object', () => {
      const response = '{"title": "Blog Title", "content": "Blog content"}';
      const result = parserService.parseBlogResponse(response);

      expect(result).toEqual({ title: 'Blog Title', content: 'Blog content' });
    });

    it('should parse JSON object with extra text before', () => {
      const response = 'Here is your blog:\n{"title": "Blog", "wordCount": 500}';
      const result = parserService.parseBlogResponse(response);

      expect(result).toEqual({ title: 'Blog', wordCount: 500 });
    });

    it('should parse JSON object with extra text after', () => {
      const response = '{"title": "Blog", "content": "Content"}\nEnjoy!';
      const result = parserService.parseBlogResponse(response);

      expect(result).toEqual({ title: 'Blog', content: 'Content' });
    });

    it('should parse complex blog JSON with nested content', () => {
      const blog = {
        title: 'Complete Blog Post',
        content: '# Heading\n\nParagraph content here.',
        wordCount: 1500,
      };
      const response = JSON.stringify(blog);

      const result = parserService.parseBlogResponse(response);

      expect(result).toEqual(blog);
    });

    it('should return null for null response', () => {
      const result = parserService.parseBlogResponse(null);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const response = 'This is just plain text, not JSON';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = parserService.parseBlogResponse(response);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON with markdown code fences', () => {
      const response = '```json\n{"title": "Blog", "content": "Content"}\n```';
      const result = parserService.parseBlogResponse(response);

      expect(result).toEqual({ title: 'Blog', content: 'Content' });
    });

    it('should handle empty object', () => {
      const response = '{}';
      const result = parserService.parseBlogResponse(response);

      expect(result).toEqual({});
    });
  });
});
