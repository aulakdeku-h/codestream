import React from "react";
import styled from "styled-components";
import Gravatar from "react-gravatar";

const Colors = {
	[0]: "#666",
	[1]: "#678",
	[2]: "#687",
	[3]: "#768",
	[4]: "#786",
	[5]: "#867",
	[6]: "#876",
	[7]: "#886",
	[8]: "#868",
	[9]: "#688"
	// [undefined]: "#666";
} as const;

export interface HeadshotProps {
	person?: {
		email?: string;
		avatar?: { image?: string; image48?: string };
		fullName?: string;
		username?: string;
		color?: number;
	};
	size?: number;
	hardRightBorder?: boolean;
	display?: string;
	onClick?: React.MouseEventHandler;
	className?: string;
}

interface DimensionProps {
	size: number;
	hardRightBorder?: boolean;
}

const Root = styled.div<DimensionProps & { display?: string }>`
	position: relative;
	width: ${props => props.size}px;
	height: ${props => props.size}px;
	display: ${props => props.display};
	vertical-align: ${props => (props.display === "inline-block" ? "-5px" : "0")};
	margin-right: ${props => (props.display === "inline-block" ? "5px" : "0")};
`;

const Initials = styled.div<DimensionProps & { color: string }>`
	width: ${props => props.size}px;
	height: ${props => props.size}px;
	display: flex;
	justify-content: center;
	align-items: center;
	position: absolute;
	left: 0;
	border-radius: ${props => (props.hardRightBorder ? "3px 0 0 3px" : "3px")};
	font-size: ${props => props.size * 0.65}px;
	font-weight: normal;
	text-transform: capitalize;
	z-index: 1;
	color: ${props => props.theme.colors.appBackground};
	background-color: ${props => props.color};
`;

const Image = styled.img<DimensionProps>`
	position: absolute;
	width: ${props => props.size}px;
	height: ${props => props.size}px;
	border-radius: ${props => (props.hardRightBorder ? "3px 0 0 3px" : "3px")};
	z-index: 2;
`;

const StyledGravatar = styled(Gravatar)<DimensionProps>`
	display: flex;
	position: absolute;
	z-index: 2;
	border-radius: 3px;
	border-radius: ${props => (props.hardRightBorder ? "3px 0 0 3px" : "3px")};
`;

export const Headshot = styled((props: HeadshotProps) => {
	const person = props.person;
	if (!person) return null;

	if (person == undefined || person.username === "CodeStream")
		return <CodeStreamHeadshot {...props} />;

	let initials = (person.email && person.email.charAt(0)) || "";
	if (person.fullName) {
		initials = person.fullName.replace(/(\w)\w*/g, "$1").replace(/\s/g, "");
		if (initials.length > 2) initials = initials.substring(0, 2);
	} else if (person.username) {
		initials = person.username.charAt(0);
	}

	const size = props.size || 16;
	const display = props.display || "block";

	if (person.avatar) {
		const uri = size > 48 ? person.avatar.image : person.avatar.image48 || person.avatar.image;

		if (uri)
			return (
				<Root size={size} display={display} className={props.className} onClick={props.onClick}>
					<Image size={size} hardRightBorder={props.hardRightBorder} src={uri} />
				</Root>
			);
	}

	return (
		<Root size={size} display={display} className={props.className} onClick={props.onClick}>
			<StyledGravatar
				size={size}
				hardRightBorder={props.hardRightBorder}
				default="blank"
				protocol="https://"
				email={person.email}
			/>
			<Initials
				size={size}
				color={Colors[person.color || 1]}
				hardRightBorder={props.hardRightBorder}
			>
				{initials}
			</Initials>
		</Root>
	);
})``;

export function CodeStreamHeadshot(props: Omit<HeadshotProps, "person">) {
	const size = props.size || 16;

	return (
		<Root size={size} className={props.className} onClick={props.onClick}>
			<Image
				size={size}
				src="https://images.codestream.com/logos/grey_blue_transparent-400x400.png"
			/>
		</Root>
	);
}
