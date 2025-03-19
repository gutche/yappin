export const isNewDay = (prevDate, newDate) => {
	if (prevDate === null) return true;
	const oldDate = new Date(prevDate).toDateString();
	const currDate = new Date(newDate).toDateString();
	return oldDate !== currDate;
};

export const formatDate = (date) => {
	return new Date(date).toLocaleDateString(undefined, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};
