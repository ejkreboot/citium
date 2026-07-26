// Thought of the day. A curated, bundled list — picked deterministically by the
// date so it's stable through the day, changes tomorrow, and never depends on a
// flaky network call. Leans toward learning, patience, and starting out.

export interface Quote {
	text: string;
	author: string;
}

export const QUOTES: Quote[] = [
	{
		text: 'The beautiful thing about learning is that no one can take it away from you.',
		author: 'B.B. King'
	},
	{ text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
	{
		text: 'You do not have to see the whole staircase, just take the first step.',
		author: 'Martin Luther King Jr.'
	},
	{ text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
	{ text: 'Little by little, one travels far.', author: 'J.R.R. Tolkien' },
	{ text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
	{ text: 'The mind is not a vessel to be filled but a fire to be kindled.', author: 'Plutarch' },
	{ text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie' },
	{ text: 'Doubt kills more dreams than failure ever will.', author: 'Suzy Kassem' },
	{ text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
	{
		text: 'Success is the sum of small efforts repeated day in and day out.',
		author: 'Robert Collier'
	},
	{
		text: 'The future belongs to those who believe in the beauty of their dreams.',
		author: 'Eleanor Roosevelt'
	},
	{ text: 'What we learn with pleasure we never forget.', author: 'Alfred Mercier' },
	{
		text: 'Courage does not always roar. Sometimes it is the quiet voice saying, "I will try again tomorrow."',
		author: 'Mary Anne Radmacher'
	},
	{
		text: 'You are never too old to set another goal or to dream a new dream.',
		author: 'C.S. Lewis'
	},
	{
		text: 'Patience and perseverance have a magical effect before which difficulties disappear.',
		author: 'John Quincy Adams'
	},
	{ text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
	{ text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
	{ text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
	{ text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
	{ text: 'The roots of education are bitter, but the fruit is sweet.', author: 'Aristotle' },
	{
		text: 'Do the best you can until you know better. Then when you know better, do better.',
		author: 'Maya Angelou'
	},
	{ text: 'Every accomplishment starts with the decision to try.', author: 'Gail Devers' },
	{ text: 'Wherever you go, go with all your heart.', author: 'Confucius' },
	{ text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
	{ text: 'She believed she could, so she did.', author: 'R.S. Grey' },
	{ text: 'Strive for progress, not perfection.', author: 'Unknown' },
	{ text: 'A little progress each day adds up to big results.', author: 'Satya Nani' },
	{
		text: 'The purpose of learning is growth, and our minds, unlike our bodies, can continue growing as long as we live.',
		author: 'Mortimer Adler'
	},
	{ text: 'You miss 100% of the shots you do not take.', author: 'Wayne Gretzky' },
	{ text: 'Well begun is half done.', author: 'Aristotle' }
];

/** Day-of-year index for stable daily rotation. */
function dayOfYear(d: Date): number {
	const start = new Date(d.getFullYear(), 0, 0);
	const diff = d.getTime() - start.getTime();
	return Math.floor(diff / 86400000);
}

/** The quote for a given day (defaults to today). Stable across the day. */
export function quoteForDay(d = new Date()): Quote {
	const idx = dayOfYear(d) % QUOTES.length;
	return QUOTES[idx];
}
