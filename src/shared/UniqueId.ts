export function GenerateUniqueId() {
	const uniqueId = `${os.time() * 1000}-${math.random(1, 1000000)}`;
	return uniqueId;
}
