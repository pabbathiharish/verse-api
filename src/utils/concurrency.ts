export async function processWithConcurrency<T>(
	items: T[],
	concurrency: number,
	handler: (item: T) => Promise<void>
) {

	const queue = [...items];

	const workers = Array.from(
		{ length: concurrency },
		async () => {

			while (queue.length) {

				const item =
					queue.shift();

				if (!item) {
					return;
				}

				await handler(item);
			}
		}
	);

	await Promise.all(workers);
}