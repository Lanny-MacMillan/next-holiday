import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetResolutionsQuery,
	useCreateResolutionsMutation,
	useUpdateResolutionsMutation,
	useEditResolutionsMutation,
	useDeleteResolutionsMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useResolutionsMutations() {
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

	// Get all resolutions mutations
	const [createResolutions, createResolutionsState] =
		useCreateResolutionsMutation();
	const [updateResolutions, updateResolutionsState] =
		useUpdateResolutionsMutation();
	const [editResolutions, editResolutionsState] = useEditResolutionsMutation();
	const [deleteResolutions, deleteResolutionsState] =
		useDeleteResolutionsMutation();

	// Get resolutions query
	const {
		data: resolutions = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetResolutionsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		resolutions,
		loading,
		error,
		initialized,
		createResolutions,
		updateResolutions,
		editResolutions,
		deleteResolutions,
		createResolutionsState,
		updateResolutionsState,
		editResolutionsState,
		deleteResolutionsState,
	};
}
