import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetPartyPlanningQuery,
	useCreatePartyPlanningMutation,
	useUpdatePartyPlanningMutation,
	useEditPartyPlanningMutation,
	useDeletePartyPlanningMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function usePartyPlanningMutations() {
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

	// Get all party planning mutations
	const [createPartyPlanning, createPartyPlanningState] =
		useCreatePartyPlanningMutation();
	const [updatePartyPlanning, updatePartyPlanningState] =
		useUpdatePartyPlanningMutation();
	const [editPartyPlanning, editPartyPlanningState] =
		useEditPartyPlanningMutation();
	const [deletePartyPlanning, deletePartyPlanningState] =
		useDeletePartyPlanningMutation();

	// Get party planning query
	const {
		data: partyPlanning = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetPartyPlanningQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		partyPlanning,
		loading,
		error,
		initialized,
		createPartyPlanning,
		updatePartyPlanning,
		editPartyPlanning,
		deletePartyPlanning,
		createPartyPlanningState,
		updatePartyPlanningState,
		editPartyPlanningState,
		deletePartyPlanningState,
	};
}
