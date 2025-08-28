import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetDateIdeasQuery,
	useCreateDateIdeasMutation,
	useUpdateDateIdeasMutation,
	useEditDateIdeasMutation,
	useDeleteDateIdeasMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useDateIdeasMutations() {
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

	// Get all date ideas mutations
	const [createDateIdeas, createDateIdeasState] = useCreateDateIdeasMutation();
	const [updateDateIdeas, updateDateIdeasState] = useUpdateDateIdeasMutation();
	const [editDateIdeas, editDateIdeasState] = useEditDateIdeasMutation();
	const [deleteDateIdeas, deleteDateIdeasState] = useDeleteDateIdeasMutation();

	// Get date ideas query
	const {
		data: dateIdeas = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetDateIdeasQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		dateIdeas,
		loading,
		error,
		initialized,
		createDateIdeas,
		updateDateIdeas,
		editDateIdeas,
		deleteDateIdeas,
		createDateIdeasState,
		updateDateIdeasState,
		editDateIdeasState,
		deleteDateIdeasState,
	};
}
