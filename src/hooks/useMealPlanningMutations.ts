import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetMealPlanningQuery,
	useCreateMealPlanningMutation,
	useUpdateMealPlanningMutation,
	useEditMealPlanningMutation,
	useDeleteMealPlanningMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useMealPlanningMutations() {
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

	// Get all meal planning mutations
	const [createMealPlanning, createMealPlanningState] =
		useCreateMealPlanningMutation();
	const [updateMealPlanning, updateMealPlanningState] =
		useUpdateMealPlanningMutation();
	const [editMealPlanning, editMealPlanningState] =
		useEditMealPlanningMutation();
	const [deleteMealPlanning, deleteMealPlanningState] =
		useDeleteMealPlanningMutation();

	// Get meal planning query
	const {
		data: mealPlanning = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetMealPlanningQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		mealPlanning,
		loading,
		error,
		initialized,
		createMealPlanning,
		updateMealPlanning,
		editMealPlanning,
		deleteMealPlanning,
		createMealPlanningState,
		updateMealPlanningState,
		editMealPlanningState,
		deleteMealPlanningState,
	};
}
