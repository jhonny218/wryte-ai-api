export class ParserService {
  parseTitleResponse(response: string | null): string[] {
    if (!response) return [];

    try {
      // Attempt to find JSON array in the string if it contains extra text
      const start = response.indexOf('[');
      const end = response.lastIndexOf(']');

      if (start !== -1 && end !== -1) {
        const jsonStr = response.substring(start, end + 1);
        const titles = JSON.parse(jsonStr);
        if (Array.isArray(titles)) {
          return titles.map(t => String(t).trim()).filter(t => t.length > 0);
        }
      }

      // Fallback: try parsing the whole string
      const titles = JSON.parse(response);
      if (Array.isArray(titles)) {
        return titles.map(t => String(t).trim()).filter(t => t.length > 0);
      }

      return [];
    } catch (error) {
      console.error('Failed to parse title response:', error, response);
      // Fallback strategy: split by newlines if JSON fails
      return response.split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim()) // Remove "1. " etc
        .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'));
    }
  }
}

export const parserService = new ParserService();
