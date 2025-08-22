import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useCreateTaskMutation,
	useCreateGiftMutation,
	useCreateCardMutation,
	useCreateGuestMutation,
	useCreateDecorationMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useFormModalMutation() {
	const pathname = usePathname();
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);
	const homeInitialized = useAppSelector(
		(state: any) => state.home.initialized
	);

	// Only resolve holidayId if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute(pathname, holidayPreferences)
		: null;

	// Get all mutations
	const [createTask, createTaskState] = useCreateTaskMutation();
	const [createGift, createGiftState] = useCreateGiftMutation();
	const [createCard, createCardState] = useCreateCardMutation();
	const [createGuest, createGuestState] = useCreateGuestMutation();
	const [createDecoration, createDecorationState] =
		useCreateDecorationMutation();

	// Determine which mutation to use based on the route
	const getMutationForRoute = () => {
		if (!holidayId) return null;

		// Extract the resource type from the pathname
		const pathSegments = pathname.split("/");
		const resourceType = pathSegments[2]; // e.g., "/christmas/gift-list" -> "gift-list"

		switch (resourceType) {
			case "gift-list":
			case "basket-list": // Easter basket-list is also a gift list
			case "supplies-list": // New Year supplies-list is also a gift list
			case "shopping-list": // Thanksgiving shopping-list is also a gift list
				return {
					mutation: createGift,
					state: createGiftState,
					type: "gift" as const,
				};
			case "cards":
				return {
					mutation: createCard,
					state: createCardState,
					type: "card" as const,
				};
			case "tasks":
			case "events":
			case "decorations":
				return {
					mutation: createDecoration,
					state: createDecorationState,
					type: "decoration" as const,
				};
			case "candle-lighting":
			case "meal-planning":
			case "decorations-checklist":
			case "date-ideas":
			case "reservations":
			case "party-planning":
			case "costume-ideas":
			case "trick-or-treat-prep":
			case "resolutions":
			case "games":
				return {
					mutation: createTask,
					state: createTaskState,
					type: "task" as const,
				};
			case "guest-list":
				return {
					mutation: createGuest,
					state: createGuestState,
					type: "guest" as const,
				};
			default:
				return null;
		}
	};

	const mutationInfo = getMutationForRoute();

	return {
		holidayId,
		mutation: mutationInfo?.mutation,
		state: mutationInfo?.state,
		type: mutationInfo?.type,
		isLoading: mutationInfo?.state.isLoading || false,
		error: mutationInfo?.state.error,
		auth0User,
	};
}
