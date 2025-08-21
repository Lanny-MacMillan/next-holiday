export interface HolidayData {
	id: string;
	name: string;
	description: string;
	route: string;
	color: {
		light: string;
		dark: string;
		progress: string;
	};
	getProgress: (state: any) => number;
	getCompletedItems: (state: any) => number;
	getTotalItems: (state: any) => number;
}

export const holidayData: HolidayData[] = [
	{
		id: "christmas",
		name: "Christmas",
		description: "Plan cards, gifts, and more!",
		route: "/christmas",
		color: {
			light: "#22c55e",
			dark: "#4ade80",
			progress: "bg-green-400 dark:bg-green-500",
		},
		getProgress: (state) => {
			const cards = state.cards?.cards || [];
			const gifts = state.giftList?.gifts || [];
			const tasks = state.tasks?.tasks || [];

			const totalItems = cards.length + gifts.length + tasks.length;
			const completedItems =
				cards.filter((card: any) => card.isCompleted).length +
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const cards = state.cards?.cards || [];
			const gifts = state.giftList?.gifts || [];
			const tasks = state.tasks?.tasks || [];

			return (
				cards.filter((card: any) => card.isCompleted).length +
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const cards = state.cards?.cards || [];
			const gifts = state.giftList?.gifts || [];
			const tasks = state.tasks?.tasks || [];

			return cards.length + gifts.length + tasks.length;
		},
	},
	{
		id: "hanukkah",
		name: "Hanukkah",
		description: "Plan gifts, candles, and more!",
		route: "/hanukkah",
		color: {
			light: "#3b82f6",
			dark: "#60a5fa",
			progress: "bg-blue-400 dark:bg-blue-500",
		},
		getProgress: (state) => {
			const gifts = state.hanukkahGiftList?.gifts || [];
			const tasks = state.hanukkahTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.hanukkahGiftList?.gifts || [];
			const tasks = state.hanukkahTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.hanukkahGiftList?.gifts || [];
			const tasks = state.hanukkahTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "kwanzaa",
		name: "Kwanzaa",
		description: "Plan gifts, principles, and more!",
		route: "/kwanzaa",
		color: {
			light: "#dc2626",
			dark: "#f87171",
			progress: "bg-red-400 dark:bg-red-500",
		},
		getProgress: (state) => {
			const gifts = state.kwanzaaGiftList?.gifts || [];
			const tasks = state.kwanzaaTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.kwanzaaGiftList?.gifts || [];
			const tasks = state.kwanzaaTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.kwanzaaGiftList?.gifts || [];
			const tasks = state.kwanzaaTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "new-year",
		name: "New Year",
		description: "Plan resolutions, parties, and more!",
		route: "/new-year",
		color: {
			light: "#f59e0b",
			dark: "#fbbf24",
			progress: "bg-amber-400 dark:bg-amber-500",
		},
		getProgress: (state) => {
			// Use RTK Query data
			const gifts =
				state.api?.queries?.['getGifts({"holidayId":"new-year"})']?.data || [];
			const tasks = state.newYearTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			// Use RTK Query data
			const gifts =
				state.api?.queries?.['getGifts({"holidayId":"new-year"})']?.data || [];
			const tasks = state.newYearTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			// Use RTK Query data
			const gifts =
				state.api?.queries?.['getGifts({"holidayId":"new-year"})']?.data || [];
			const tasks = state.newYearTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "valentines",
		name: "Valentine's Day",
		description: "Plan gifts, dates, and romantic surprises!",
		route: "/valentines",
		color: {
			light: "#ec4899",
			dark: "#f472b6",
			progress: "bg-pink-400 dark:bg-pink-500",
		},
		getProgress: (state) => {
			const gifts = state.valentinesGiftList?.gifts || [];
			const tasks = state.valentinesTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.valentinesGiftList?.gifts || [];
			const tasks = state.valentinesTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.valentinesGiftList?.gifts || [];
			const tasks = state.valentinesTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "easter",
		name: "Easter",
		description: "Plan gifts, baskets, and egg hunts!",
		route: "/easter",
		color: {
			light: "#8b5cf6",
			dark: "#a78bfa",
			progress: "bg-purple-400 dark:bg-purple-500",
		},
		getProgress: (state) => {
			const gifts = state.easterGiftList?.gifts || [];
			const tasks = state.easterTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.easterGiftList?.gifts || [];
			const tasks = state.easterTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.easterGiftList?.gifts || [];
			const tasks = state.easterTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "halloween",
		name: "Halloween",
		description: "Plan costumes, decorations, and trick-or-treating!",
		route: "/halloween",
		color: {
			light: "#f97316",
			dark: "#fb923c",
			progress: "bg-orange-400 dark:bg-orange-500",
		},
		getProgress: (state) => {
			const gifts = state.halloweenGiftList?.gifts || [];
			const tasks = state.halloweenTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.halloweenGiftList?.gifts || [];
			const tasks = state.halloweenTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.halloweenGiftList?.gifts || [];
			const tasks = state.halloweenTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "thanksgiving",
		name: "Thanksgiving",
		description: "Plan your feast, guests, and gratitude!",
		route: "/thanksgiving",
		color: {
			light: "#8b4513",
			dark: "#f59e0b",
			progress: "bg-amber-600 dark:bg-amber-500",
		},
		getProgress: (state) => {
			const gifts = state.thanksgivingGiftList?.gifts || [];
			const tasks = state.thanksgivingTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.thanksgivingGiftList?.gifts || [];
			const tasks = state.thanksgivingTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.thanksgivingGiftList?.gifts || [];
			const tasks = state.thanksgivingTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "mothers-day",
		name: "Mother's Day",
		description: "Show your love and appreciation!",
		route: "/mothers-day",
		color: {
			light: "#ec4899",
			dark: "#f472b6",
			progress: "bg-pink-400 dark:bg-pink-500",
		},
		getProgress: (state) => {
			const gifts = state.mothersDayGiftList?.gifts || [];
			const tasks = state.mothersDayTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.mothersDayGiftList?.gifts || [];
			const tasks = state.mothersDayTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.mothersDayGiftList?.gifts || [];
			const tasks = state.mothersDayTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "fathers-day",
		name: "Father's Day",
		description: "Honor and celebrate Dad!",
		route: "/fathers-day",
		color: {
			light: "#3b82f6",
			dark: "#60a5fa",
			progress: "bg-blue-400 dark:bg-blue-500",
		},
		getProgress: (state) => {
			const gifts = state.fathersDayGiftList?.gifts || [];
			const tasks = state.fathersDayTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.fathersDayGiftList?.gifts || [];
			const tasks = state.fathersDayTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.fathersDayGiftList?.gifts || [];
			const tasks = state.fathersDayTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "fourth-of-july",
		name: "Fourth of July",
		description: "Celebrate independence and freedom!",
		route: "/fourth-of-july",
		color: {
			light: "#dc2626",
			dark: "#f87171",
			progress: "bg-red-400 dark:bg-red-500",
		},
		getProgress: (state) => {
			const tasks = state.fourthOfJulyTasks?.tasks || [];

			const totalItems = tasks.length;
			const completedItems = tasks.filter(
				(task: any) => task.isCompleted
			).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const tasks = state.fourthOfJulyTasks?.tasks || [];

			return tasks.filter((task: any) => task.isCompleted).length;
		},
		getTotalItems: (state) => {
			const tasks = state.fourthOfJulyTasks?.tasks || [];

			return tasks.length;
		},
	},
	{
		id: "birthday",
		name: "Birthday",
		description: "Celebrate special birthdays with style!",
		route: "/birthday",
		color: {
			light: "#f59e0b",
			dark: "#fbbf24",
			progress: "bg-amber-400 dark:bg-amber-500",
		},
		getProgress: (state) => {
			const gifts = state.birthdayGiftList?.gifts || [];
			const tasks = state.birthdayTasks?.tasks || [];
			const cards = state.birthdayCards?.cards || [];
			const contacts = state.birthdayAddressBook?.contacts || [];

			const totalItems =
				gifts.length + tasks.length + cards.length + contacts.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length +
				cards.filter((card: any) => card.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.birthdayGiftList?.gifts || [];
			const tasks = state.birthdayTasks?.tasks || [];
			const cards = state.birthdayCards?.cards || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length +
				cards.filter((card: any) => card.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.birthdayGiftList?.gifts || [];
			const tasks = state.birthdayTasks?.tasks || [];
			const cards = state.birthdayCards?.cards || [];
			const contacts = state.birthdayAddressBook?.contacts || [];

			return gifts.length + tasks.length + cards.length + contacts.length;
		},
	},
	{
		id: "anniversary",
		name: "Anniversary",
		description: "Plan romantic anniversaries and celebrations!",
		route: "/anniversary",
		color: {
			light: "#ec4899",
			dark: "#f472b6",
			progress: "bg-pink-400 dark:bg-pink-500",
		},
		getProgress: (state) => {
			const gifts = state.anniversaryGiftList?.gifts || [];
			const tasks = state.anniversaryTasks?.tasks || [];

			const totalItems = gifts.length + tasks.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.anniversaryGiftList?.gifts || [];
			const tasks = state.anniversaryTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.anniversaryGiftList?.gifts || [];
			const tasks = state.anniversaryTasks?.tasks || [];

			return gifts.length + tasks.length;
		},
	},
	{
		id: "graduation",
		name: "Graduation",
		description: "Celebrate academic achievements!",
		route: "/graduation",
		color: {
			light: "#8b5cf6",
			dark: "#a78bfa",
			progress: "bg-purple-400 dark:bg-purple-500",
		},
		getProgress: (state) => {
			const gifts = state.graduationGiftList?.gifts || [];
			const tasks = state.graduationTasks?.tasks || [];
			const cards = state.graduationCards?.cards || [];
			const contacts = state.graduationAddressBook?.contacts || [];

			const totalItems =
				gifts.length + tasks.length + cards.length + contacts.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length +
				cards.filter((card: any) => card.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.graduationGiftList?.gifts || [];
			const tasks = state.graduationTasks?.tasks || [];
			const cards = state.graduationCards?.cards || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length +
				cards.filter((card: any) => card.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.graduationGiftList?.gifts || [];
			const tasks = state.graduationTasks?.tasks || [];
			const cards = state.graduationCards?.cards || [];
			const contacts = state.graduationAddressBook?.contacts || [];

			return gifts.length + tasks.length + cards.length + contacts.length;
		},
	},
	{
		id: "baby-shower",
		name: "Baby Shower",
		description: "Plan the perfect baby shower celebration!",
		route: "/baby-shower",
		color: {
			light: "#06b6d4",
			dark: "#22d3ee",
			progress: "bg-cyan-400 dark:bg-cyan-500",
		},
		getProgress: (state) => {
			const gifts = state.babyShowerGiftList?.gifts || [];
			const tasks = state.babyShowerTasks?.tasks || [];
			const contacts = state.babyShowerAddressBook?.contacts || [];

			const totalItems = gifts.length + tasks.length + contacts.length;
			const completedItems =
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length;

			return totalItems > 0 ? completedItems / totalItems : 0;
		},
		getCompletedItems: (state) => {
			const gifts = state.babyShowerGiftList?.gifts || [];
			const tasks = state.babyShowerTasks?.tasks || [];

			return (
				gifts.filter((gift: any) => gift.isCompleted).length +
				tasks.filter((task: any) => task.isCompleted).length
			);
		},
		getTotalItems: (state) => {
			const gifts = state.babyShowerGiftList?.gifts || [];
			const tasks = state.babyShowerTasks?.tasks || [];
			const contacts = state.babyShowerAddressBook?.contacts || [];

			return gifts.length + tasks.length + contacts.length;
		},
	},
];
