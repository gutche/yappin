import { describe, it, expect } from "vitest";
import { isNewDay, formatDate } from "@/utils/dateUtils";

describe("formatDate function", () => {
	it("formats date correctly", () => {
		const date = new Date("2025-03-19T12:00:00Z");
		const formattedDate = formatDate(date);
		expect(formattedDate).toBe(
			date.toLocaleDateString(undefined, {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		);
	});
});

describe("isNewDay function", () => {
	it("detects new date correctly", () => {
		const messages = [
			{ sent_at: "2025-02-24 17:25:51.415554" },
			{ sent_at: "2025-02-24 17:22:51.415554" }, // Same day, different time
			{ sent_at: "2025-02-25 18:25:51.415554" }, // New day
		];
		expect(isNewDay(null, messages[1].sent_at)).toBe(true); // First message is always new day
		expect(isNewDay(messages[0].sent_at, messages[1].sent_at)).toBe(false);
		expect(isNewDay(messages[1].sent_at, messages[2].sent_at)).toBe(true);
	});
});
