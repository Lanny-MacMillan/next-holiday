import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetCostumeIdeasQuery,
	useCreateCostumeIdeasMutation,
	useUpdateCostumeIdeasMutation,
	useEditCostumeIdeasMutation,
	useDeleteCostumeIdeasMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useCostumeIdeasMutations() {
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

	// Get all costume ideas mutations
	const [createCostumeIdeas, createCostumeIdeasState] =
		useCreateCostumeIdeasMutation();
	const [updateCostumeIdeas, updateCostumeIdeasState] =
		useUpdateCostumeIdeasMutation();
	const [editCostumeIdeas, editCostumeIdeasState] =
		useEditCostumeIdeasMutation();
	const [deleteCostumeIdeas, deleteCostumeIdeasState] =
		useDeleteCostumeIdeasMutation();

	// Get costume ideas query
	const {
		data: costumeIdeas = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetCostumeIdeasQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		costumeIdeas,
		loading,
		error,
		initialized,
		createCostumeIdeas,
		updateCostumeIdeas,
		editCostumeIdeas,
		deleteCostumeIdeas,
		createCostumeIdeasState,
		updateCostumeIdeasState,
		editCostumeIdeasState,
		deleteCostumeIdeasState,
	};
}
