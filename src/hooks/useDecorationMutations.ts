import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetDecorationsQuery,
	useCreateDecorationMutation,
	useUpdateDecorationMutation,
	useEditDecorationMutation,
	useDeleteDecorationMutation,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

export function useDecorationMutations() {
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

	// Get all decoration mutations
	const [createDecoration, createDecorationState] =
		useCreateDecorationMutation();
	const [updateDecoration, updateDecorationState] =
		useUpdateDecorationMutation();
	const [editDecoration, editDecorationState] = useEditDecorationMutation();
	const [deleteDecoration, deleteDecorationState] =
		useDeleteDecorationMutation();

	// Get decorations query
	const {
		data: decorations = [],
		isLoading: loading,
		error,
		isSuccess: initialized,
	} = useGetDecorationsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	return {
		holidayId,
		auth0User,
		decorations,
		loading,
		error,
		initialized,
		createDecoration,
		updateDecoration,
		editDecoration,
		deleteDecoration,
		createDecorationState,
		updateDecorationState,
		editDecorationState,
		deleteDecorationState,
	};
}


