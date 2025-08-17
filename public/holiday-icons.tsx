// src/components/holiday-icons.tsx
import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
	/** Accessible title (omit to mark decorative) */
	title?: string;
	/** Sets CSS `color`; icons stroke with currentColor */
	color?: string;
	/** Convenience size (applies to width & height) */
	size?: number | string;
};

const base = {
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.75,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

function IconBase({
	title,
	color,
	size,
	style,
	children,
	...props
}: IconProps & { children: React.ReactNode }) {
	return (
		<svg
			{...base}
			{...props}
			width={size ?? props.width}
			height={size ?? props.height}
			aria-hidden={title ? undefined : true}
			style={{ ...(style || {}), ...(color ? { color } : {}) }}
		>
			{title ? <title>{title}</title> : null}
			{children}
		</svg>
	);
}

export function IconChristmas({ title = "Christmas", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M12 9c-1.3-2.4-4.4-3.1-5.7-1.3C5 9.3 6.5 11 9 11h3M12 9c1.3-2.4 4.4-3.1 5.7-1.3C19 9.3 17.5 11 15 11h-3" />
			<path d="M3 9h18" />
			<rect x="3" y="9" width="18" height="12" rx="2" />
			<path d="M12 9v12M6 15h12" />
		</IconBase>
	);
}

export function IconHanukkah({ title = "Hanukkah", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<polygon points="12,7 16,11 12,15 8,11" />
			<path d="M12 7V4" />
			<path d="M10.5 12h3" />
		</IconBase>
	);
}

// Kwanzaa - Kinara
export function IconKwanzaa({ title = "Kwanzaa", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M5 19h14" />
			<path d="M6 19V11" />
			<path d="M8 19V11" />
			<path d="M10 19V11" />
			<path d="M12 19V9" />
			<path d="M14 19V11" />
			<path d="M16 19V11" />
			<path d="M18 19V11" />
		</IconBase>
	);
}
// Kwanzaa - Unity Cup
// export function IconKwanzaa({ title = "Kwanzaa", ...props }: IconProps) {
// 	return (
// 		<IconBase title={title} {...props}>
// 			<path d="M7 8h10" />
// 			<path d="M7 8c0 4 10 4 10 0" />
// 			<path d="M12 12v4" />
// 			<path d="M9 19h6" />
// 		</IconBase>
// 	);
// }

export function IconNewYear({ title = "New Year", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
			<circle cx="12" cy="12" r="2" />
		</IconBase>
	);
}

export function IconValentines({
	title = "Valentine's Day",
	...props
}: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M12 20s-6-4.5-8.5-7A5 5 0 0 1 12 7a5 5 0 0 1 8.5 6c-2.5 2.5-8.5 7-8.5 7z" />
		</IconBase>
	);
}

export function IconEaster({ title = "Easter", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M12 3c-3.5 0-7 5.5-7 9.5S8.5 21 12 21s7-3 7-8.5S15.5 3 12 3z" />
			<path d="M7 13c2-1 4 1 5 1s3-2 5-1" />
		</IconBase>
	);
}

export function IconThanksgiving({
	title = "Thanksgiving",
	...props
}: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M12 3c-3 1.5-6 5-6 8s3 6.5 6 8c3-1.5 6-5 6-8s-3-6.5-6-8z" />
			<path d="M12 5v12" />
			<path d="M9 12c1 .5 2 1 3 2m0-4c-1 1-2 1.5-3 2" />
		</IconBase>
	);
}

export function IconHalloween({ title = "Halloween", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<ellipse cx="12" cy="13" rx="7" ry="5" />
			<path d="M12 8v2" />
			<path d="M9 13c0-2 2-3 3-3s3 1 3 3" />
		</IconBase>
	);
}

export function IconMothersDay({
	title = "Mother's Day",
	...props
}: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<circle cx="12" cy="12" r="2" />
			<circle cx="12" cy="8" r="2" />
			<circle cx="15.5" cy="10" r="2" />
			<circle cx="15.5" cy="14" r="2" />
			<circle cx="12" cy="16" r="2" />
			<circle cx="8.5" cy="14" r="2" />
			<circle cx="8.5" cy="10" r="2" />
		</IconBase>
	);
}

export function IconFathersDay({
	title = "Father's Day",
	...props
}: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<polygon points="10,3 14,3 13,6 11,6" />
			<polygon points="12,6 15,11 12,20 9,11" />
		</IconBase>
	);
}

export function IconBirthday({ title = "Birthday", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<rect x="4" y="13" width="16" height="6" rx="2" />
			<path d="M6 13c2 1 4 1 6 0s4-1 6 0" />
			<path d="M12 9v4" />
			<path d="M12 7c.6-.6.6-1.4 0-2-.6.6-.6 1.4 0 2z" />
		</IconBase>
	);
}

export function IconAnniversary({
	title = "Anniversary",
	...props
}: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<circle cx="10" cy="12" r="4" />
			<circle cx="14" cy="12" r="4" />
			<path d="M15 6l1-1 1 1-1 1-1-1z" />
		</IconBase>
	);
}

export function IconFourthOfJuly({
	title = "Fourth of July",
	...props
}: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.9 7.2 19l.9-5.4L4.2 9.7l5.4-.8L12 4z" />
		</IconBase>
	);
}

export function IconGraduation({ title = "Graduation", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<path d="M3 10l9-5 9 5-9 5-9-5z" />
			<path d="M12 15v5" />
			<path d="M21 10v4" />
		</IconBase>
	);
}

export function IconBabyShower({ title = "Baby Shower", ...props }: IconProps) {
	return (
		<IconBase title={title} {...props}>
			<circle cx="12" cy="10" r="2" />
			<ellipse cx="12" cy="14" rx="5" ry="2" />
			<circle cx="12" cy="19" r="2.5" />
		</IconBase>
	);
}

/** Optional: registry for dynamic rendering */
export const HolidayIcons = {
	christmas: IconChristmas,
	hanukkah: IconHanukkah,
	kwanzaa: IconKwanzaa,
	newYear: IconNewYear,
	valentines: IconValentines,
	easter: IconEaster,
	thanksgiving: IconThanksgiving,
	halloween: IconHalloween,
	mothersDay: IconMothersDay,
	fathersDay: IconFathersDay,
	birthday: IconBirthday,
	anniversary: IconAnniversary,
	fourthOfJuly: IconFourthOfJuly,
	graduation: IconGraduation,
	babyShower: IconBabyShower,
} as const;
