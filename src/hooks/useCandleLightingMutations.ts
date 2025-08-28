import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetCandleLightingQuery,
	useCreateCandleLightingMutation,
	useUpdateCandleLightingMutation,
	useEditCandleLightingMutation,
	useDeleteCandleLightingMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useCandleLightingMutations() {
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

	// Get all candle lighting mutations
	const [createCandleLighting, createCandleLightingState] =
		useCreateCandleLightingMutation();
	const [updateCandleLighting, updateCandleLightingState] =
		useUpdateCandleLightingMutation();
	const [editCandleLighting, editCandleLightingState] =
		useEditCandleLightingMutation();
	const [deleteCandleLighting, deleteCandleLightingState] =
		useDeleteCandleLightingMutation();

	// Get candle lighting query
	const {
		data: candleLighting = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetCandleLightingQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		candleLighting,
		loading,
		error,
		initialized,
		createCandleLighting,
		updateCandleLighting,
		editCandleLighting,
		deleteCandleLighting,
		createCandleLightingState,
		updateCandleLightingState,
		editCandleLightingState,
		deleteCandleLightingState,
	};
}
