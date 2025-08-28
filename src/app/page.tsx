import HomePageWrapper from "@/components/HomePageWrapper";

export default function Home() {
	// For now, let the client handle data fetching to avoid server-side auth issues
	// This prevents the infinite loop while we implement proper server-side auth
	return <HomePageWrapper />;
}
