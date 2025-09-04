"use client";

import { createContext, useContext, ReactNode } from "react";
import { HomeData } from "@/types/home";

interface InitialDataContextType {
	homeData?: HomeData;
	holidayData?: any;
}

const InitialDataContext = createContext<InitialDataContextType>({});

interface InitialDataProviderProps {
	children: ReactNode;
	homeData?: HomeData;
	holidayData?: any;
}

export function InitialDataProvider({
	children,
	homeData,
	holidayData,
}: InitialDataProviderProps) {
	return (
		<InitialDataContext.Provider value={{ homeData, holidayData }}>
			{children}
		</InitialDataContext.Provider>
	);
}

export function useInitialData() {
	return useContext(InitialDataContext);
}
