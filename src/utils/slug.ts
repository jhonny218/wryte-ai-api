/**
 * Simple slug generator. Converts text to lowercase, replaces non-alphanumeric
 * characters with hyphens and collapses multiple hyphens. Trims leading/trailing hyphens.
 */
export function slugify(input: string, maxLength?: number): string {
	if (!input) return ''

	let s = input
		.toString()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-')

	if (maxLength && s.length > maxLength) {
		s = s.slice(0, maxLength)
		s = s.replace(/^-+|-+$/g, '')
	}

	return s
}

/**
 * Ensure uniqueness by calling `existsFn` which should return true if a slug exists.
 * This will append a numeric suffix (e.g. "slug-2") until a unique slug is found.
 */
export async function uniqueSlug(
	base: string,
	existsFn: (slug: string) => Promise<boolean>,
	maxAttempts = 1000
): Promise<string> {
	const root = slugify(base)
	if (!root) return root

	let candidate = root
	let i = 1

	while (i <= maxAttempts) {
		// If not exists, return candidate
		// existsFn should return true when slug already exists
		// so we invert the check
		// eslint-disable-next-line no-await-in-loop
		const exists = await existsFn(candidate)
		if (!exists) return candidate

		i += 1
		candidate = `${root}-${i}`
	}

	// Fallback (very unlikely) - return last candidate
	return `${root}-${Date.now()}`
}

export default { slugify, uniqueSlug }
