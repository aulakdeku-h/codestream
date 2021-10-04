import React from "react";
import { useDispatch } from "react-redux";
import Icon from "../../Icon";
import { emojify } from "../../Markdowner";
import styled from "styled-components";
import Tooltip from "../../Tooltip";
import { SmartFormattedList } from "../../SmartFormattedList";
import { GitLabMergeRequest } from "@codestream/protocols/agent";
import { api } from "../../../store/providerPullRequests/actions";
import EmojiPicker from "../../EmojiPicker";

interface Props {
	pr: GitLabMergeRequest;
	targetId: string;
	setIsLoadingMessage: Function;
	className?: string;
	reactionGroups?: {
		content: string;
		data: {
			awardable_id: number;
			id: number;
			name: string;
			user: {
				id: number;
				login: string;
			};
		}[];
	}[];
}

export const PRReact = styled.div`
	display: inline-block;
	transition: transform 0.1s;
	cursor: pointer;
	&:hover {
		transform: scale(1.2);
	}
	p {
		color: var(--text-color-highlight);
		margin: 0 7px;
	}
	// have to repeat this here because it appears in menus
	&.mine {
		background: rgba(90, 127, 255, 0.08);
		border: 1px solid rgba(90, 127, 255, 0.18);
	}
`;

export const PRReaction = styled.div`
	display: inline-block;
	padding: 3px 10px;
	margin-right: 10px;
	margin-bottom: 5px;
	border: 1px solid var(--base-border-color);
	border-radius: 4px;
	cursor: pointer;
	white-space: nowrap;
	height: 35px;
	p {
		white-space: nowrap;
		display: inline-block;
		margin: 0 2px 0 0;
		padding: 0;
		vertical-align: -1px;
		.emoji {
			color: var(--text-color-highlight);
		}
	}
`;

export const PullRequestReactButton = styled((props: Props) => {
	const dispatch = useDispatch();
	const [open, setOpen] = React.useState<EventTarget | undefined>();
	const [menuTitle, setMenuTitle] = React.useState("");

	const saveReaction = async (key: string, onOff: boolean) => {
		setOpen(undefined);
		if (!key) return;
		props.setIsLoadingMessage("Saving Reaction...");

		await dispatch(
			api("toggleReaction", {
				subjectId: props.targetId,
				content: key,
				onOff
			})
		);
		props.setIsLoadingMessage("");
	};

	const filterEmoji = emoji => (emoji.short_names || []).find(id => GITLAB_EMOJI[id]);

	const isMine = (key: string) => {
		const me = props.pr.viewer ? props.pr.viewer.login : "";
		if (!me) return false;
		if (!props.reactionGroups) return false;
		const reaction = props.reactionGroups.find(_ => _.content === key);
		if (!reaction) return false;
		return reaction.data.find(_ => _.user.login === me);
	};

	return (
		<span className={props.className}>
			{open && (
				<EmojiPicker
					addEmoji={key => {
						saveReaction(key.id, !isMine(key.id));
					}}
					target={open}
					autoFocus={true}
					emojisToShowFilter={filterEmoji}
				/>
			)}
			<Icon
				name="smiley"
				className="clickable"
				title="Add reaction"
				placement="bottom"
				onClick={e => setOpen(open ? undefined : e.target)}
			/>
		</span>
	);
})``;

export const PRReactions = styled.div`
	display: flex;
	flex-wrap: wrap;
	${PullRequestReactButton} {
		display: inline-block;
		border: 1px solid var(--base-border-color);
		border-radius: 4px;
		padding: 3px 10px !important;
		margin-right: 5px;
		margin-bottom: 5px;
		display: flex;
		place-items: center;
		height: 35px;
		flex-grow: 0;
	}
`;

interface ReactionProps {
	pr: GitLabMergeRequest;
	// node: any;
	reactionGroups: any;
	targetId: string;
	setIsLoadingMessage: Function;
	thumbsFirst?: boolean;
}

const REACTION_MAP = {
	THUMBS_UP: "+1",
	THUMBS_DOWN: "-1",
	HOORAY: "tada",
	LAUGH: "smile",
	CONFUSED: "confused",
	HEART: "heart",
	ROCKET: "rocket",
	EYES: "eyes"
};

const REACTION_NAME_MAP = {
	THUMBS_UP: "+1",
	THUMBS_DOWN: "-1",
	HOORAY: "hooray",
	LAUGH: "laugh",
	CONFUSED: "confused",
	HEART: "heart",
	ROCKET: "rocket",
	EYES: "eyes"
};

export const PullRequestReactions = (props: ReactionProps) => {
	const { reactionGroups } = props;
	if (!reactionGroups) return null;

	const dispatch = useDispatch();
	const saveReaction = async (key: string, onOff: boolean, id?: string) => {
		if (!key) return;
		props.setIsLoadingMessage("Saving Reaction...");

		await dispatch(
			api("toggleReaction", {
				subjectId: props.targetId,
				content: key,
				onOff,
				id
			})
		);
		props.setIsLoadingMessage("");
	};

	const me = props.pr.viewer ? props.pr.viewer.login : "";

	const makeReaction = (reactionId, index) => {
		const reaction = reactionGroups.find(r => r.content === reactionId);
		// this is the emoji's id aka "heart_eyes"
		const reactionContent = reaction ? reaction.content : reactionId;
		const data = reaction ? reaction.data : [];
		// if (num == 0) return null;
		const emoji = emojify(":" + reactionContent + ":");
		const loginList = data.map(_ => _.user.login);
		const logins = <SmartFormattedList value={loginList} />;
		const title =
			loginList.length > 0 ? (
				<>
					{logins} reacted with {reactionContent} emoji
				</>
			) : (
				""
			);
		const iReacted = loginList.includes(me);
		const myReaction = data.find(_ => _.user.login === me) || {};
		return (
			<Tooltip key={index} placement="bottomLeft" delay={1} title={title} trigger={["hover"]}>
				<PRReaction
					className={iReacted ? "mine" : ""}
					onClick={() => saveReaction(reactionContent, !iReacted, myReaction.id)}
				>
					<span dangerouslySetInnerHTML={{ __html: emoji }} /> {data.length}
				</PRReaction>
			</Tooltip>
		);
	};

	const reactions = reactionGroups
		.filter(_ =>
			props.thumbsFirst ? _.content !== "thumbsup" && _.content !== "thumbsdown" : true
		)
		.map((reaction, index) => makeReaction(reaction.content, index))
		.filter(Boolean);

	if (reactions.length > 0 || props.thumbsFirst)
		return (
			<PRReactions>
				{props.thumbsFirst && (
					<>
						{makeReaction("thumbsup", 10001)}
						{makeReaction("thumbsdown", 10002)}
					</>
				)}
				{reactions}
				<PullRequestReactButton
					pr={props.pr}
					targetId={props.targetId}
					setIsLoadingMessage={props.setIsLoadingMessage}
					reactionGroups={props.reactionGroups}
				/>
			</PRReactions>
		);
	else return null;
};

const GITLAB_EMOJI = {
	"100": {
		c: "symbols",
		e: "💯",
		d: "hundred points symbol",
		u: "6.0"
	},
	"1234": {
		c: "symbols",
		e: "🔢",
		d: "input symbol for numbers",
		u: "6.0"
	},
	"8ball": {
		c: "activity",
		e: "🎱",
		d: "billiards",
		u: "6.0"
	},
	a: {
		c: "symbols",
		e: "🅰",
		d: "negative squared latin capital letter a",
		u: "6.0"
	},
	ab: {
		c: "symbols",
		e: "🆎",
		d: "negative squared ab",
		u: "6.0"
	},
	abc: {
		c: "symbols",
		e: "🔤",
		d: "input symbol for latin letters",
		u: "6.0"
	},
	abcd: {
		c: "symbols",
		e: "🔡",
		d: "input symbol for latin small letters",
		u: "6.0"
	},
	accept: {
		c: "symbols",
		e: "🉑",
		d: "circled ideograph accept",
		u: "6.0"
	},
	aerial_tramway: {
		c: "travel",
		e: "🚡",
		d: "aerial tramway",
		u: "6.0"
	},
	airplane: {
		c: "travel",
		e: "✈",
		d: "airplane",
		u: "1.1"
	},
	airplane_arriving: {
		c: "travel",
		e: "🛬",
		d: "airplane arriving",
		u: "7.0"
	},
	airplane_departure: {
		c: "travel",
		e: "🛫",
		d: "airplane departure",
		u: "7.0"
	},
	airplane_small: {
		c: "travel",
		e: "🛩",
		d: "small airplane",
		u: "7.0"
	},
	alarm_clock: {
		c: "objects",
		e: "⏰",
		d: "alarm clock",
		u: "6.0"
	},
	alembic: {
		c: "objects",
		e: "⚗",
		d: "alembic",
		u: "4.1"
	},
	alien: {
		c: "people",
		e: "👽",
		d: "extraterrestrial alien",
		u: "6.0"
	},
	ambulance: {
		c: "travel",
		e: "🚑",
		d: "ambulance",
		u: "6.0"
	},
	amphora: {
		c: "objects",
		e: "🏺",
		d: "amphora",
		u: "8.0"
	},
	anchor: {
		c: "travel",
		e: "⚓",
		d: "anchor",
		u: "4.1"
	},
	angel: {
		c: "people",
		e: "👼",
		d: "baby angel",
		u: "6.0"
	},
	angel_tone1: {
		c: "people",
		e: "👼🏻",
		d: "baby angel tone 1",
		u: "8.0"
	},
	angel_tone2: {
		c: "people",
		e: "👼🏼",
		d: "baby angel tone 2",
		u: "8.0"
	},
	angel_tone3: {
		c: "people",
		e: "👼🏽",
		d: "baby angel tone 3",
		u: "8.0"
	},
	angel_tone4: {
		c: "people",
		e: "👼🏾",
		d: "baby angel tone 4",
		u: "8.0"
	},
	angel_tone5: {
		c: "people",
		e: "👼🏿",
		d: "baby angel tone 5",
		u: "8.0"
	},
	anger: {
		c: "symbols",
		e: "💢",
		d: "anger symbol",
		u: "6.0"
	},
	anger_right: {
		c: "symbols",
		e: "🗯",
		d: "right anger bubble",
		u: "7.0"
	},
	angry: {
		c: "people",
		e: "😠",
		d: "angry face",
		u: "6.0"
	},
	ant: {
		c: "nature",
		e: "🐜",
		d: "ant",
		u: "6.0"
	},
	apple: {
		c: "food",
		e: "🍎",
		d: "red apple",
		u: "6.0"
	},
	aquarius: {
		c: "symbols",
		e: "♒",
		d: "aquarius",
		u: "1.1"
	},
	aries: {
		c: "symbols",
		e: "♈",
		d: "aries",
		u: "1.1"
	},
	arrow_backward: {
		c: "symbols",
		e: "◀",
		d: "black left-pointing triangle",
		u: "1.1"
	},
	arrow_double_down: {
		c: "symbols",
		e: "⏬",
		d: "black down-pointing double triangle",
		u: "6.0"
	},
	arrow_double_up: {
		c: "symbols",
		e: "⏫",
		d: "black up-pointing double triangle",
		u: "6.0"
	},
	arrow_down: {
		c: "symbols",
		e: "⬇",
		d: "downwards black arrow",
		u: "4.0"
	},
	arrow_down_small: {
		c: "symbols",
		e: "🔽",
		d: "down-pointing small red triangle",
		u: "6.0"
	},
	arrow_forward: {
		c: "symbols",
		e: "▶",
		d: "black right-pointing triangle",
		u: "1.1"
	},
	arrow_heading_down: {
		c: "symbols",
		e: "⤵",
		d: "arrow pointing rightwards then curving downwards",
		u: "3.2"
	},
	arrow_heading_up: {
		c: "symbols",
		e: "⤴",
		d: "arrow pointing rightwards then curving upwards",
		u: "3.2"
	},
	arrow_left: {
		c: "symbols",
		e: "⬅",
		d: "leftwards black arrow",
		u: "4.0"
	},
	arrow_lower_left: {
		c: "symbols",
		e: "↙",
		d: "south west arrow",
		u: "1.1"
	},
	arrow_lower_right: {
		c: "symbols",
		e: "↘",
		d: "south east arrow",
		u: "1.1"
	},
	arrow_right: {
		c: "symbols",
		e: "➡",
		d: "black rightwards arrow",
		u: "1.1"
	},
	arrow_right_hook: {
		c: "symbols",
		e: "↪",
		d: "rightwards arrow with hook",
		u: "1.1"
	},
	arrow_up: {
		c: "symbols",
		e: "⬆",
		d: "upwards black arrow",
		u: "4.0"
	},
	arrow_up_down: {
		c: "symbols",
		e: "↕",
		d: "up down arrow",
		u: "1.1"
	},
	arrow_up_small: {
		c: "symbols",
		e: "🔼",
		d: "up-pointing small red triangle",
		u: "6.0"
	},
	arrow_upper_left: {
		c: "symbols",
		e: "↖",
		d: "north west arrow",
		u: "1.1"
	},
	arrow_upper_right: {
		c: "symbols",
		e: "↗",
		d: "north east arrow",
		u: "1.1"
	},
	arrows_clockwise: {
		c: "symbols",
		e: "🔃",
		d: "clockwise downwards and upwards open circle arrows",
		u: "6.0"
	},
	arrows_counterclockwise: {
		c: "symbols",
		e: "🔄",
		d: "anticlockwise downwards and upwards open circle ar",
		u: "6.0"
	},
	art: {
		c: "activity",
		e: "🎨",
		d: "artist palette",
		u: "6.0"
	},
	articulated_lorry: {
		c: "travel",
		e: "🚛",
		d: "articulated lorry",
		u: "6.0"
	},
	asterisk: {
		c: "symbols",
		e: "*⃣",
		d: "keycap asterisk",
		u: "3.0"
	},
	astonished: {
		c: "people",
		e: "😲",
		d: "astonished face",
		u: "6.0"
	},
	athletic_shoe: {
		c: "people",
		e: "👟",
		d: "athletic shoe",
		u: "6.0"
	},
	atm: {
		c: "symbols",
		e: "🏧",
		d: "automated teller machine",
		u: "6.0"
	},
	atom: {
		c: "symbols",
		e: "⚛",
		d: "atom symbol",
		u: "4.1"
	},
	avocado: {
		c: "food",
		e: "🥑",
		d: "avocado",
		u: "9.0"
	},
	b: {
		c: "symbols",
		e: "🅱",
		d: "negative squared latin capital letter b",
		u: "6.0"
	},
	baby: {
		c: "people",
		e: "👶",
		d: "baby",
		u: "6.0"
	},
	baby_bottle: {
		c: "food",
		e: "🍼",
		d: "baby bottle",
		u: "6.0"
	},
	baby_chick: {
		c: "nature",
		e: "🐤",
		d: "baby chick",
		u: "6.0"
	},
	baby_symbol: {
		c: "symbols",
		e: "🚼",
		d: "baby symbol",
		u: "6.0"
	},
	baby_tone1: {
		c: "people",
		e: "👶🏻",
		d: "baby tone 1",
		u: "8.0"
	},
	baby_tone2: {
		c: "people",
		e: "👶🏼",
		d: "baby tone 2",
		u: "8.0"
	},
	baby_tone3: {
		c: "people",
		e: "👶🏽",
		d: "baby tone 3",
		u: "8.0"
	},
	baby_tone4: {
		c: "people",
		e: "👶🏾",
		d: "baby tone 4",
		u: "8.0"
	},
	baby_tone5: {
		c: "people",
		e: "👶🏿",
		d: "baby tone 5",
		u: "8.0"
	},
	back: {
		c: "symbols",
		e: "🔙",
		d: "back with leftwards arrow above",
		u: "6.0"
	},
	bacon: {
		c: "food",
		e: "🥓",
		d: "bacon",
		u: "9.0"
	},
	badminton: {
		c: "activity",
		e: "🏸",
		d: "badminton racquet",
		u: "8.0"
	},
	baggage_claim: {
		c: "symbols",
		e: "🛄",
		d: "baggage claim",
		u: "6.0"
	},
	balloon: {
		c: "objects",
		e: "🎈",
		d: "balloon",
		u: "6.0"
	},
	ballot_box: {
		c: "objects",
		e: "🗳",
		d: "ballot box with ballot",
		u: "7.0"
	},
	ballot_box_with_check: {
		c: "symbols",
		e: "☑",
		d: "ballot box with check",
		u: "1.1"
	},
	bamboo: {
		c: "nature",
		e: "🎍",
		d: "pine decoration",
		u: "6.0"
	},
	banana: {
		c: "food",
		e: "🍌",
		d: "banana",
		u: "6.0"
	},
	bangbang: {
		c: "symbols",
		e: "‼",
		d: "double exclamation mark",
		u: "1.1"
	},
	bank: {
		c: "travel",
		e: "🏦",
		d: "bank",
		u: "6.0"
	},
	bar_chart: {
		c: "objects",
		e: "📊",
		d: "bar chart",
		u: "6.0"
	},
	barber: {
		c: "objects",
		e: "💈",
		d: "barber pole",
		u: "6.0"
	},
	baseball: {
		c: "activity",
		e: "⚾",
		d: "baseball",
		u: "5.2"
	},
	basketball: {
		c: "activity",
		e: "🏀",
		d: "basketball and hoop",
		u: "6.0"
	},
	basketball_player: {
		c: "activity",
		e: "⛹",
		d: "person with ball",
		u: "5.2"
	},
	basketball_player_tone1: {
		c: "activity",
		e: "⛹🏻",
		d: "person with ball tone 1",
		u: "8.0"
	},
	basketball_player_tone2: {
		c: "activity",
		e: "⛹🏼",
		d: "person with ball tone 2",
		u: "8.0"
	},
	basketball_player_tone3: {
		c: "activity",
		e: "⛹🏽",
		d: "person with ball tone 3",
		u: "8.0"
	},
	basketball_player_tone4: {
		c: "activity",
		e: "⛹🏾",
		d: "person with ball tone 4",
		u: "8.0"
	},
	basketball_player_tone5: {
		c: "activity",
		e: "⛹🏿",
		d: "person with ball tone 5",
		u: "8.0"
	},
	bat: {
		c: "nature",
		e: "🦇",
		d: "bat",
		u: "9.0"
	},
	bath: {
		c: "activity",
		e: "🛀",
		d: "bath",
		u: "6.0"
	},
	bath_tone1: {
		c: "activity",
		e: "🛀🏻",
		d: "bath tone 1",
		u: "8.0"
	},
	bath_tone2: {
		c: "activity",
		e: "🛀🏼",
		d: "bath tone 2",
		u: "8.0"
	},
	bath_tone3: {
		c: "activity",
		e: "🛀🏽",
		d: "bath tone 3",
		u: "8.0"
	},
	bath_tone4: {
		c: "activity",
		e: "🛀🏾",
		d: "bath tone 4",
		u: "8.0"
	},
	bath_tone5: {
		c: "activity",
		e: "🛀🏿",
		d: "bath tone 5",
		u: "8.0"
	},
	bathtub: {
		c: "objects",
		e: "🛁",
		d: "bathtub",
		u: "6.0"
	},
	battery: {
		c: "objects",
		e: "🔋",
		d: "battery",
		u: "6.0"
	},
	beach: {
		c: "travel",
		e: "🏖",
		d: "beach with umbrella",
		u: "7.0"
	},
	beach_umbrella: {
		c: "objects",
		e: "⛱",
		d: "umbrella on ground",
		u: "5.2"
	},
	bear: {
		c: "nature",
		e: "🐻",
		d: "bear face",
		u: "6.0"
	},
	bed: {
		c: "objects",
		e: "🛏",
		d: "bed",
		u: "7.0"
	},
	bee: {
		c: "nature",
		e: "🐝",
		d: "honeybee",
		u: "6.0"
	},
	beer: {
		c: "food",
		e: "🍺",
		d: "beer mug",
		u: "6.0"
	},
	beers: {
		c: "food",
		e: "🍻",
		d: "clinking beer mugs",
		u: "6.0"
	},
	beetle: {
		c: "nature",
		e: "🐞",
		d: "lady beetle",
		u: "6.0"
	},
	beginner: {
		c: "symbols",
		e: "🔰",
		d: "japanese symbol for beginner",
		u: "6.0"
	},
	bell: {
		c: "symbols",
		e: "🔔",
		d: "bell",
		u: "6.0"
	},
	bellhop: {
		c: "objects",
		e: "🛎",
		d: "bellhop bell",
		u: "7.0"
	},
	bento: {
		c: "food",
		e: "🍱",
		d: "bento box",
		u: "6.0"
	},
	bicyclist: {
		c: "activity",
		e: "🚴",
		d: "bicyclist",
		u: "6.0"
	},
	bicyclist_tone1: {
		c: "activity",
		e: "🚴🏻",
		d: "bicyclist tone 1",
		u: "8.0"
	},
	bicyclist_tone2: {
		c: "activity",
		e: "🚴🏼",
		d: "bicyclist tone 2",
		u: "8.0"
	},
	bicyclist_tone3: {
		c: "activity",
		e: "🚴🏽",
		d: "bicyclist tone 3",
		u: "8.0"
	},
	bicyclist_tone4: {
		c: "activity",
		e: "🚴🏾",
		d: "bicyclist tone 4",
		u: "8.0"
	},
	bicyclist_tone5: {
		c: "activity",
		e: "🚴🏿",
		d: "bicyclist tone 5",
		u: "8.0"
	},
	bike: {
		c: "travel",
		e: "🚲",
		d: "bicycle",
		u: "6.0"
	},
	bikini: {
		c: "people",
		e: "👙",
		d: "bikini",
		u: "6.0"
	},
	biohazard: {
		c: "symbols",
		e: "☣",
		d: "biohazard sign",
		u: "1.1"
	},
	bird: {
		c: "nature",
		e: "🐦",
		d: "bird",
		u: "6.0"
	},
	birthday: {
		c: "food",
		e: "🎂",
		d: "birthday cake",
		u: "6.0"
	},
	black_circle: {
		c: "symbols",
		e: "⚫",
		d: "medium black circle",
		u: "4.1"
	},
	black_heart: {
		c: "symbols",
		e: "🖤",
		d: "black heart",
		u: "9.0"
	},
	black_joker: {
		c: "symbols",
		e: "🃏",
		d: "playing card black joker",
		u: "6.0"
	},
	black_large_square: {
		c: "symbols",
		e: "⬛",
		d: "black large square",
		u: "5.1"
	},
	black_medium_small_square: {
		c: "symbols",
		e: "◾",
		d: "black medium small square",
		u: "3.2"
	},
	black_medium_square: {
		c: "symbols",
		e: "◼",
		d: "black medium square",
		u: "3.2"
	},
	black_nib: {
		c: "objects",
		e: "✒",
		d: "black nib",
		u: "1.1"
	},
	black_small_square: {
		c: "symbols",
		e: "▪",
		d: "black small square",
		u: "1.1"
	},
	black_square_button: {
		c: "symbols",
		e: "🔲",
		d: "black square button",
		u: "6.0"
	},
	blossom: {
		c: "nature",
		e: "🌼",
		d: "blossom",
		u: "6.0"
	},
	blowfish: {
		c: "nature",
		e: "🐡",
		d: "blowfish",
		u: "6.0"
	},
	blue_book: {
		c: "objects",
		e: "📘",
		d: "blue book",
		u: "6.0"
	},
	blue_car: {
		c: "travel",
		e: "🚙",
		d: "recreational vehicle",
		u: "6.0"
	},
	blue_heart: {
		c: "symbols",
		e: "💙",
		d: "blue heart",
		u: "6.0"
	},
	blush: {
		c: "people",
		e: "😊",
		d: "smiling face with smiling eyes",
		u: "6.0"
	},
	boar: {
		c: "nature",
		e: "🐗",
		d: "boar",
		u: "6.0"
	},
	bomb: {
		c: "objects",
		e: "💣",
		d: "bomb",
		u: "6.0"
	},
	book: {
		c: "objects",
		e: "📖",
		d: "open book",
		u: "6.0"
	},
	bookmark: {
		c: "objects",
		e: "🔖",
		d: "bookmark",
		u: "6.0"
	},
	bookmark_tabs: {
		c: "objects",
		e: "📑",
		d: "bookmark tabs",
		u: "6.0"
	},
	books: {
		c: "objects",
		e: "📚",
		d: "books",
		u: "6.0"
	},
	boom: {
		c: "nature",
		e: "💥",
		d: "collision symbol",
		u: "6.0"
	},
	boot: {
		c: "people",
		e: "👢",
		d: "womans boots",
		u: "6.0"
	},
	bouquet: {
		c: "nature",
		e: "💐",
		d: "bouquet",
		u: "6.0"
	},
	bow: {
		c: "people",
		e: "🙇",
		d: "person bowing deeply",
		u: "6.0"
	},
	bow_and_arrow: {
		c: "activity",
		e: "🏹",
		d: "bow and arrow",
		u: "8.0"
	},
	bow_tone1: {
		c: "people",
		e: "🙇🏻",
		d: "person bowing deeply tone 1",
		u: "8.0"
	},
	bow_tone2: {
		c: "people",
		e: "🙇🏼",
		d: "person bowing deeply tone 2",
		u: "8.0"
	},
	bow_tone3: {
		c: "people",
		e: "🙇🏽",
		d: "person bowing deeply tone 3",
		u: "8.0"
	},
	bow_tone4: {
		c: "people",
		e: "🙇🏾",
		d: "person bowing deeply tone 4",
		u: "8.0"
	},
	bow_tone5: {
		c: "people",
		e: "🙇🏿",
		d: "person bowing deeply tone 5",
		u: "8.0"
	},
	bowling: {
		c: "activity",
		e: "🎳",
		d: "bowling",
		u: "6.0"
	},
	boxing_glove: {
		c: "activity",
		e: "🥊",
		d: "boxing glove",
		u: "9.0"
	},
	boy: {
		c: "people",
		e: "👦",
		d: "boy",
		u: "6.0"
	},
	boy_tone1: {
		c: "people",
		e: "👦🏻",
		d: "boy tone 1",
		u: "8.0"
	},
	boy_tone2: {
		c: "people",
		e: "👦🏼",
		d: "boy tone 2",
		u: "8.0"
	},
	boy_tone3: {
		c: "people",
		e: "👦🏽",
		d: "boy tone 3",
		u: "8.0"
	},
	boy_tone4: {
		c: "people",
		e: "👦🏾",
		d: "boy tone 4",
		u: "8.0"
	},
	boy_tone5: {
		c: "people",
		e: "👦🏿",
		d: "boy tone 5",
		u: "8.0"
	},
	bread: {
		c: "food",
		e: "🍞",
		d: "bread",
		u: "6.0"
	},
	bride_with_veil: {
		c: "people",
		e: "👰",
		d: "bride with veil",
		u: "6.0"
	},
	bride_with_veil_tone1: {
		c: "people",
		e: "👰🏻",
		d: "bride with veil tone 1",
		u: "8.0"
	},
	bride_with_veil_tone2: {
		c: "people",
		e: "👰🏼",
		d: "bride with veil tone 2",
		u: "8.0"
	},
	bride_with_veil_tone3: {
		c: "people",
		e: "👰🏽",
		d: "bride with veil tone 3",
		u: "8.0"
	},
	bride_with_veil_tone4: {
		c: "people",
		e: "👰🏾",
		d: "bride with veil tone 4",
		u: "8.0"
	},
	bride_with_veil_tone5: {
		c: "people",
		e: "👰🏿",
		d: "bride with veil tone 5",
		u: "8.0"
	},
	bridge_at_night: {
		c: "travel",
		e: "🌉",
		d: "bridge at night",
		u: "6.0"
	},
	briefcase: {
		c: "people",
		e: "💼",
		d: "briefcase",
		u: "6.0"
	},
	broken_heart: {
		c: "symbols",
		e: "💔",
		d: "broken heart",
		u: "6.0"
	},
	bug: {
		c: "nature",
		e: "🐛",
		d: "bug",
		u: "6.0"
	},
	bulb: {
		c: "objects",
		e: "💡",
		d: "electric light bulb",
		u: "6.0"
	},
	bullettrain_front: {
		c: "travel",
		e: "🚅",
		d: "high-speed train with bullet nose",
		u: "6.0"
	},
	bullettrain_side: {
		c: "travel",
		e: "🚄",
		d: "high-speed train",
		u: "6.0"
	},
	burrito: {
		c: "food",
		e: "🌯",
		d: "burrito",
		u: "8.0"
	},
	bus: {
		c: "travel",
		e: "🚌",
		d: "bus",
		u: "6.0"
	},
	busstop: {
		c: "travel",
		e: "🚏",
		d: "bus stop",
		u: "6.0"
	},
	bust_in_silhouette: {
		c: "people",
		e: "👤",
		d: "bust in silhouette",
		u: "6.0"
	},
	busts_in_silhouette: {
		c: "people",
		e: "👥",
		d: "busts in silhouette",
		u: "6.0"
	},
	butterfly: {
		c: "nature",
		e: "🦋",
		d: "butterfly",
		u: "9.0"
	},
	cactus: {
		c: "nature",
		e: "🌵",
		d: "cactus",
		u: "6.0"
	},
	cake: {
		c: "food",
		e: "🍰",
		d: "shortcake",
		u: "6.0"
	},
	calendar: {
		c: "objects",
		e: "📆",
		d: "tear-off calendar",
		u: "6.0"
	},
	calendar_spiral: {
		c: "objects",
		e: "🗓",
		d: "spiral calendar pad",
		u: "7.0"
	},
	call_me: {
		c: "people",
		e: "🤙",
		d: "call me hand",
		u: "9.0"
	},
	call_me_tone1: {
		c: "people",
		e: "🤙🏻",
		d: "call me hand tone 1",
		u: "9.0"
	},
	call_me_tone2: {
		c: "people",
		e: "🤙🏼",
		d: "call me hand tone 2",
		u: "9.0"
	},
	call_me_tone3: {
		c: "people",
		e: "🤙🏽",
		d: "call me hand tone 3",
		u: "9.0"
	},
	call_me_tone4: {
		c: "people",
		e: "🤙🏾",
		d: "call me hand tone 4",
		u: "9.0"
	},
	call_me_tone5: {
		c: "people",
		e: "🤙🏿",
		d: "call me hand tone 5",
		u: "9.0"
	},
	calling: {
		c: "objects",
		e: "📲",
		d: "mobile phone with rightwards arrow at left",
		u: "6.0"
	},
	camel: {
		c: "nature",
		e: "🐫",
		d: "bactrian camel",
		u: "6.0"
	},
	camera: {
		c: "objects",
		e: "📷",
		d: "camera",
		u: "6.0"
	},
	camera_with_flash: {
		c: "objects",
		e: "📸",
		d: "camera with flash",
		u: "7.0"
	},
	camping: {
		c: "travel",
		e: "🏕",
		d: "camping",
		u: "7.0"
	},
	cancer: {
		c: "symbols",
		e: "♋",
		d: "cancer",
		u: "1.1"
	},
	candle: {
		c: "objects",
		e: "🕯",
		d: "candle",
		u: "7.0"
	},
	candy: {
		c: "food",
		e: "🍬",
		d: "candy",
		u: "6.0"
	},
	canoe: {
		c: "travel",
		e: "🛶",
		d: "canoe",
		u: "9.0"
	},
	capital_abcd: {
		c: "symbols",
		e: "🔠",
		d: "input symbol for latin capital letters",
		u: "6.0"
	},
	capricorn: {
		c: "symbols",
		e: "♑",
		d: "capricorn",
		u: "1.1"
	},
	card_box: {
		c: "objects",
		e: "🗃",
		d: "card file box",
		u: "7.0"
	},
	card_index: {
		c: "objects",
		e: "📇",
		d: "card index",
		u: "6.0"
	},
	carousel_horse: {
		c: "travel",
		e: "🎠",
		d: "carousel horse",
		u: "6.0"
	},
	carrot: {
		c: "food",
		e: "🥕",
		d: "carrot",
		u: "9.0"
	},
	cartwheel: {
		c: "activity",
		e: "🤸",
		d: "person doing cartwheel",
		u: "9.0"
	},
	cartwheel_tone1: {
		c: "activity",
		e: "🤸🏻",
		d: "person doing cartwheel tone 1",
		u: "9.0"
	},
	cartwheel_tone2: {
		c: "activity",
		e: "🤸🏼",
		d: "person doing cartwheel tone 2",
		u: "9.0"
	},
	cartwheel_tone3: {
		c: "activity",
		e: "🤸🏽",
		d: "person doing cartwheel tone 3",
		u: "9.0"
	},
	cartwheel_tone4: {
		c: "activity",
		e: "🤸🏾",
		d: "person doing cartwheel tone 4",
		u: "9.0"
	},
	cartwheel_tone5: {
		c: "activity",
		e: "🤸🏿",
		d: "person doing cartwheel tone 5",
		u: "9.0"
	},
	cat: {
		c: "nature",
		e: "🐱",
		d: "cat face",
		u: "6.0"
	},
	cat2: {
		c: "nature",
		e: "🐈",
		d: "cat",
		u: "6.0"
	},
	cd: {
		c: "objects",
		e: "💿",
		d: "optical disc",
		u: "6.0"
	},
	chains: {
		c: "objects",
		e: "⛓",
		d: "chains",
		u: "5.2"
	},
	champagne: {
		c: "food",
		e: "🍾",
		d: "bottle with popping cork",
		u: "8.0"
	},
	champagne_glass: {
		c: "food",
		e: "🥂",
		d: "clinking glasses",
		u: "9.0"
	},
	chart: {
		c: "symbols",
		e: "💹",
		d: "chart with upwards trend and yen sign",
		u: "6.0"
	},
	chart_with_downwards_trend: {
		c: "objects",
		e: "📉",
		d: "chart with downwards trend",
		u: "6.0"
	},
	chart_with_upwards_trend: {
		c: "objects",
		e: "📈",
		d: "chart with upwards trend",
		u: "6.0"
	},
	checkered_flag: {
		c: "travel",
		e: "🏁",
		d: "chequered flag",
		u: "6.0"
	},
	cheese: {
		c: "food",
		e: "🧀",
		d: "cheese wedge",
		u: "8.0"
	},
	cherries: {
		c: "food",
		e: "🍒",
		d: "cherries",
		u: "6.0"
	},
	cherry_blossom: {
		c: "nature",
		e: "🌸",
		d: "cherry blossom",
		u: "6.0"
	},
	chestnut: {
		c: "nature",
		e: "🌰",
		d: "chestnut",
		u: "6.0"
	},
	chicken: {
		c: "nature",
		e: "🐔",
		d: "chicken",
		u: "6.0"
	},
	children_crossing: {
		c: "symbols",
		e: "🚸",
		d: "children crossing",
		u: "6.0"
	},
	chipmunk: {
		c: "nature",
		e: "🐿",
		d: "chipmunk",
		u: "7.0"
	},
	chocolate_bar: {
		c: "food",
		e: "🍫",
		d: "chocolate bar",
		u: "6.0"
	},
	christmas_tree: {
		c: "nature",
		e: "🎄",
		d: "christmas tree",
		u: "6.0"
	},
	church: {
		c: "travel",
		e: "⛪",
		d: "church",
		u: "5.2"
	},
	cinema: {
		c: "symbols",
		e: "🎦",
		d: "cinema",
		u: "6.0"
	},
	circus_tent: {
		c: "activity",
		e: "🎪",
		d: "circus tent",
		u: "6.0"
	},
	city_dusk: {
		c: "travel",
		e: "🌆",
		d: "cityscape at dusk",
		u: "6.0"
	},
	city_sunset: {
		c: "travel",
		e: "🌇",
		d: "sunset over buildings",
		u: "6.0"
	},
	cityscape: {
		c: "travel",
		e: "🏙",
		d: "cityscape",
		u: "7.0"
	},
	cl: {
		c: "symbols",
		e: "🆑",
		d: "squared cl",
		u: "6.0"
	},
	clap: {
		c: "people",
		e: "👏",
		d: "clapping hands sign",
		u: "6.0"
	},
	clap_tone1: {
		c: "people",
		e: "👏🏻",
		d: "clapping hands sign tone 1",
		u: "8.0"
	},
	clap_tone2: {
		c: "people",
		e: "👏🏼",
		d: "clapping hands sign tone 2",
		u: "8.0"
	},
	clap_tone3: {
		c: "people",
		e: "👏🏽",
		d: "clapping hands sign tone 3",
		u: "8.0"
	},
	clap_tone4: {
		c: "people",
		e: "👏🏾",
		d: "clapping hands sign tone 4",
		u: "8.0"
	},
	clap_tone5: {
		c: "people",
		e: "👏🏿",
		d: "clapping hands sign tone 5",
		u: "8.0"
	},
	clapper: {
		c: "activity",
		e: "🎬",
		d: "clapper board",
		u: "6.0"
	},
	classical_building: {
		c: "travel",
		e: "🏛",
		d: "classical building",
		u: "7.0"
	},
	clipboard: {
		c: "objects",
		e: "📋",
		d: "clipboard",
		u: "6.0"
	},
	clock: {
		c: "objects",
		e: "🕰",
		d: "mantlepiece clock",
		u: "7.0"
	},
	clock1: {
		c: "symbols",
		e: "🕐",
		d: "clock face one oclock",
		u: "6.0"
	},
	clock10: {
		c: "symbols",
		e: "🕙",
		d: "clock face ten oclock",
		u: "6.0"
	},
	clock1030: {
		c: "symbols",
		e: "🕥",
		d: "clock face ten-thirty",
		u: "6.0"
	},
	clock11: {
		c: "symbols",
		e: "🕚",
		d: "clock face eleven oclock",
		u: "6.0"
	},
	clock1130: {
		c: "symbols",
		e: "🕦",
		d: "clock face eleven-thirty",
		u: "6.0"
	},
	clock12: {
		c: "symbols",
		e: "🕛",
		d: "clock face twelve oclock",
		u: "6.0"
	},
	clock1230: {
		c: "symbols",
		e: "🕧",
		d: "clock face twelve-thirty",
		u: "6.0"
	},
	clock130: {
		c: "symbols",
		e: "🕜",
		d: "clock face one-thirty",
		u: "6.0"
	},
	clock2: {
		c: "symbols",
		e: "🕑",
		d: "clock face two oclock",
		u: "6.0"
	},
	clock230: {
		c: "symbols",
		e: "🕝",
		d: "clock face two-thirty",
		u: "6.0"
	},
	clock3: {
		c: "symbols",
		e: "🕒",
		d: "clock face three oclock",
		u: "6.0"
	},
	clock330: {
		c: "symbols",
		e: "🕞",
		d: "clock face three-thirty",
		u: "6.0"
	},
	clock4: {
		c: "symbols",
		e: "🕓",
		d: "clock face four oclock",
		u: "6.0"
	},
	clock430: {
		c: "symbols",
		e: "🕟",
		d: "clock face four-thirty",
		u: "6.0"
	},
	clock5: {
		c: "symbols",
		e: "🕔",
		d: "clock face five oclock",
		u: "6.0"
	},
	clock530: {
		c: "symbols",
		e: "🕠",
		d: "clock face five-thirty",
		u: "6.0"
	},
	clock6: {
		c: "symbols",
		e: "🕕",
		d: "clock face six oclock",
		u: "6.0"
	},
	clock630: {
		c: "symbols",
		e: "🕡",
		d: "clock face six-thirty",
		u: "6.0"
	},
	clock7: {
		c: "symbols",
		e: "🕖",
		d: "clock face seven oclock",
		u: "6.0"
	},
	clock730: {
		c: "symbols",
		e: "🕢",
		d: "clock face seven-thirty",
		u: "6.0"
	},
	clock8: {
		c: "symbols",
		e: "🕗",
		d: "clock face eight oclock",
		u: "6.0"
	},
	clock830: {
		c: "symbols",
		e: "🕣",
		d: "clock face eight-thirty",
		u: "6.0"
	},
	clock9: {
		c: "symbols",
		e: "🕘",
		d: "clock face nine oclock",
		u: "6.0"
	},
	clock930: {
		c: "symbols",
		e: "🕤",
		d: "clock face nine-thirty",
		u: "6.0"
	},
	closed_book: {
		c: "objects",
		e: "📕",
		d: "closed book",
		u: "6.0"
	},
	closed_lock_with_key: {
		c: "objects",
		e: "🔐",
		d: "closed lock with key",
		u: "6.0"
	},
	closed_umbrella: {
		c: "people",
		e: "🌂",
		d: "closed umbrella",
		u: "6.0"
	},
	cloud: {
		c: "nature",
		e: "☁",
		d: "cloud",
		u: "1.1"
	},
	cloud_lightning: {
		c: "nature",
		e: "🌩",
		d: "cloud with lightning",
		u: "7.0"
	},
	cloud_rain: {
		c: "nature",
		e: "🌧",
		d: "cloud with rain",
		u: "7.0"
	},
	cloud_snow: {
		c: "nature",
		e: "🌨",
		d: "cloud with snow",
		u: "7.0"
	},
	cloud_tornado: {
		c: "nature",
		e: "🌪",
		d: "cloud with tornado",
		u: "7.0"
	},
	clown: {
		c: "people",
		e: "🤡",
		d: "clown face",
		u: "9.0"
	},
	clubs: {
		c: "symbols",
		e: "♣",
		d: "black club suit",
		u: "1.1"
	},
	cocktail: {
		c: "food",
		e: "🍸",
		d: "cocktail glass",
		u: "6.0"
	},
	coffee: {
		c: "food",
		e: "☕",
		d: "hot beverage",
		u: "4.0"
	},
	coffin: {
		c: "objects",
		e: "⚰",
		d: "coffin",
		u: "4.1"
	},
	cold_sweat: {
		c: "people",
		e: "😰",
		d: "face with open mouth and cold sweat",
		u: "6.0"
	},
	comet: {
		c: "nature",
		e: "☄",
		d: "comet",
		u: "1.1"
	},
	compression: {
		c: "objects",
		e: "🗜",
		d: "compression",
		u: "7.0"
	},
	computer: {
		c: "objects",
		e: "💻",
		d: "personal computer",
		u: "6.0"
	},
	confetti_ball: {
		c: "objects",
		e: "🎊",
		d: "confetti ball",
		u: "6.0"
	},
	confounded: {
		c: "people",
		e: "😖",
		d: "confounded face",
		u: "6.0"
	},
	confused: {
		c: "people",
		e: "😕",
		d: "confused face",
		u: "6.1"
	},
	congratulations: {
		c: "symbols",
		e: "㊗",
		d: "circled ideograph congratulation",
		u: "1.1"
	},
	construction: {
		c: "travel",
		e: "🚧",
		d: "construction sign",
		u: "6.0"
	},
	construction_site: {
		c: "travel",
		e: "🏗",
		d: "building construction",
		u: "7.0"
	},
	construction_worker: {
		c: "people",
		e: "👷",
		d: "construction worker",
		u: "6.0"
	},
	construction_worker_tone1: {
		c: "people",
		e: "👷🏻",
		d: "construction worker tone 1",
		u: "8.0"
	},
	construction_worker_tone2: {
		c: "people",
		e: "👷🏼",
		d: "construction worker tone 2",
		u: "8.0"
	},
	construction_worker_tone3: {
		c: "people",
		e: "👷🏽",
		d: "construction worker tone 3",
		u: "8.0"
	},
	construction_worker_tone4: {
		c: "people",
		e: "👷🏾",
		d: "construction worker tone 4",
		u: "8.0"
	},
	construction_worker_tone5: {
		c: "people",
		e: "👷🏿",
		d: "construction worker tone 5",
		u: "8.0"
	},
	control_knobs: {
		c: "objects",
		e: "🎛",
		d: "control knobs",
		u: "7.0"
	},
	convenience_store: {
		c: "travel",
		e: "🏪",
		d: "convenience store",
		u: "6.0"
	},
	cookie: {
		c: "food",
		e: "🍪",
		d: "cookie",
		u: "6.0"
	},
	cooking: {
		c: "food",
		e: "🍳",
		d: "cooking",
		u: "6.0"
	},
	cool: {
		c: "symbols",
		e: "🆒",
		d: "squared cool",
		u: "6.0"
	},
	cop: {
		c: "people",
		e: "👮",
		d: "police officer",
		u: "6.0"
	},
	cop_tone1: {
		c: "people",
		e: "👮🏻",
		d: "police officer tone 1",
		u: "8.0"
	},
	cop_tone2: {
		c: "people",
		e: "👮🏼",
		d: "police officer tone 2",
		u: "8.0"
	},
	cop_tone3: {
		c: "people",
		e: "👮🏽",
		d: "police officer tone 3",
		u: "8.0"
	},
	cop_tone4: {
		c: "people",
		e: "👮🏾",
		d: "police officer tone 4",
		u: "8.0"
	},
	cop_tone5: {
		c: "people",
		e: "👮🏿",
		d: "police officer tone 5",
		u: "8.0"
	},
	copyright: {
		c: "symbols",
		e: "©",
		d: "copyright sign",
		u: "1.1"
	},
	corn: {
		c: "food",
		e: "🌽",
		d: "ear of maize",
		u: "6.0"
	},
	couch: {
		c: "objects",
		e: "🛋",
		d: "couch and lamp",
		u: "7.0"
	},
	couple: {
		c: "people",
		e: "👫",
		d: "man and woman holding hands",
		u: "6.0"
	},
	couple_mm: {
		c: "people",
		e: "👨‍❤️‍👨",
		d: "couple (man,man)",
		u: "6.0"
	},
	couple_with_heart: {
		c: "people",
		e: "💑",
		d: "couple with heart",
		u: "6.0"
	},
	couple_ww: {
		c: "people",
		e: "👩‍❤️‍👩",
		d: "couple (woman,woman)",
		u: "6.0"
	},
	couplekiss: {
		c: "people",
		e: "💏",
		d: "kiss",
		u: "6.0"
	},
	cow: {
		c: "nature",
		e: "🐮",
		d: "cow face",
		u: "6.0"
	},
	cow2: {
		c: "nature",
		e: "🐄",
		d: "cow",
		u: "6.0"
	},
	cowboy: {
		c: "people",
		e: "🤠",
		d: "face with cowboy hat",
		u: "9.0"
	},
	crab: {
		c: "nature",
		e: "🦀",
		d: "crab",
		u: "8.0"
	},
	crayon: {
		c: "objects",
		e: "🖍",
		d: "lower left crayon",
		u: "7.0"
	},
	credit_card: {
		c: "objects",
		e: "💳",
		d: "credit card",
		u: "6.0"
	},
	crescent_moon: {
		c: "nature",
		e: "🌙",
		d: "crescent moon",
		u: "6.0"
	},
	cricket: {
		c: "activity",
		e: "🏏",
		d: "cricket bat and ball",
		u: "8.0"
	},
	crocodile: {
		c: "nature",
		e: "🐊",
		d: "crocodile",
		u: "6.0"
	},
	croissant: {
		c: "food",
		e: "🥐",
		d: "croissant",
		u: "9.0"
	},
	cross: {
		c: "symbols",
		e: "✝",
		d: "latin cross",
		u: "1.1"
	},
	crossed_flags: {
		c: "objects",
		e: "🎌",
		d: "crossed flags",
		u: "6.0"
	},
	crossed_swords: {
		c: "objects",
		e: "⚔",
		d: "crossed swords",
		u: "4.1"
	},
	crown: {
		c: "people",
		e: "👑",
		d: "crown",
		u: "6.0"
	},
	cruise_ship: {
		c: "travel",
		e: "🛳",
		d: "passenger ship",
		u: "7.0"
	},
	cry: {
		c: "people",
		e: "😢",
		d: "crying face",
		u: "6.0"
	},
	crying_cat_face: {
		c: "people",
		e: "😿",
		d: "crying cat face",
		u: "6.0"
	},
	crystal_ball: {
		c: "objects",
		e: "🔮",
		d: "crystal ball",
		u: "6.0"
	},
	cucumber: {
		c: "food",
		e: "🥒",
		d: "cucumber",
		u: "9.0"
	},
	cupid: {
		c: "symbols",
		e: "💘",
		d: "heart with arrow",
		u: "6.0"
	},
	curly_loop: {
		c: "symbols",
		e: "➰",
		d: "curly loop",
		u: "6.0"
	},
	currency_exchange: {
		c: "symbols",
		e: "💱",
		d: "currency exchange",
		u: "6.0"
	},
	curry: {
		c: "food",
		e: "🍛",
		d: "curry and rice",
		u: "6.0"
	},
	custard: {
		c: "food",
		e: "🍮",
		d: "custard",
		u: "6.0"
	},
	customs: {
		c: "symbols",
		e: "🛃",
		d: "customs",
		u: "6.0"
	},
	cyclone: {
		c: "symbols",
		e: "🌀",
		d: "cyclone",
		u: "6.0"
	},
	dagger: {
		c: "objects",
		e: "🗡",
		d: "dagger knife",
		u: "7.0"
	},
	dancer: {
		c: "people",
		e: "💃",
		d: "dancer",
		u: "6.0"
	},
	dancer_tone1: {
		c: "people",
		e: "💃🏻",
		d: "dancer tone 1",
		u: "8.0"
	},
	dancer_tone2: {
		c: "people",
		e: "💃🏼",
		d: "dancer tone 2",
		u: "8.0"
	},
	dancer_tone3: {
		c: "people",
		e: "💃🏽",
		d: "dancer tone 3",
		u: "8.0"
	},
	dancer_tone4: {
		c: "people",
		e: "💃🏾",
		d: "dancer tone 4",
		u: "8.0"
	},
	dancer_tone5: {
		c: "people",
		e: "💃🏿",
		d: "dancer tone 5",
		u: "8.0"
	},
	dancers: {
		c: "people",
		e: "👯",
		d: "woman with bunny ears",
		u: "6.0"
	},
	dango: {
		c: "food",
		e: "🍡",
		d: "dango",
		u: "6.0"
	},
	dark_sunglasses: {
		c: "people",
		e: "🕶",
		d: "dark sunglasses",
		u: "7.0"
	},
	dart: {
		c: "activity",
		e: "🎯",
		d: "direct hit",
		u: "6.0"
	},
	dash: {
		c: "nature",
		e: "💨",
		d: "dash symbol",
		u: "6.0"
	},
	date: {
		c: "objects",
		e: "📅",
		d: "calendar",
		u: "6.0"
	},
	deciduous_tree: {
		c: "nature",
		e: "🌳",
		d: "deciduous tree",
		u: "6.0"
	},
	deer: {
		c: "nature",
		e: "🦌",
		d: "deer",
		u: "9.0"
	},
	department_store: {
		c: "travel",
		e: "🏬",
		d: "department store",
		u: "6.0"
	},
	desert: {
		c: "travel",
		e: "🏜",
		d: "desert",
		u: "7.0"
	},
	desktop: {
		c: "objects",
		e: "🖥",
		d: "desktop computer",
		u: "7.0"
	},
	diamond_shape_with_a_dot_inside: {
		c: "symbols",
		e: "💠",
		d: "diamond shape with a dot inside",
		u: "6.0"
	},
	diamonds: {
		c: "symbols",
		e: "♦",
		d: "black diamond suit",
		u: "1.1"
	},
	disappointed: {
		c: "people",
		e: "😞",
		d: "disappointed face",
		u: "6.0"
	},
	disappointed_relieved: {
		c: "people",
		e: "😥",
		d: "disappointed but relieved face",
		u: "6.0"
	},
	dividers: {
		c: "objects",
		e: "🗂",
		d: "card index dividers",
		u: "7.0"
	},
	dizzy: {
		c: "nature",
		e: "💫",
		d: "dizzy symbol",
		u: "6.0"
	},
	dizzy_face: {
		c: "people",
		e: "😵",
		d: "dizzy face",
		u: "6.0"
	},
	do_not_litter: {
		c: "symbols",
		e: "🚯",
		d: "do not litter symbol",
		u: "6.0"
	},
	dog: {
		c: "nature",
		e: "🐶",
		d: "dog face",
		u: "6.0"
	},
	dog2: {
		c: "nature",
		e: "🐕",
		d: "dog",
		u: "6.0"
	},
	dollar: {
		c: "objects",
		e: "💵",
		d: "banknote with dollar sign",
		u: "6.0"
	},
	dolls: {
		c: "objects",
		e: "🎎",
		d: "japanese dolls",
		u: "6.0"
	},
	dolphin: {
		c: "nature",
		e: "🐬",
		d: "dolphin",
		u: "6.0"
	},
	door: {
		c: "objects",
		e: "🚪",
		d: "door",
		u: "6.0"
	},
	doughnut: {
		c: "food",
		e: "🍩",
		d: "doughnut",
		u: "6.0"
	},
	dove: {
		c: "nature",
		e: "🕊",
		d: "dove of peace",
		u: "7.0"
	},
	dragon: {
		c: "nature",
		e: "🐉",
		d: "dragon",
		u: "6.0"
	},
	dragon_face: {
		c: "nature",
		e: "🐲",
		d: "dragon face",
		u: "6.0"
	},
	dress: {
		c: "people",
		e: "👗",
		d: "dress",
		u: "6.0"
	},
	dromedary_camel: {
		c: "nature",
		e: "🐪",
		d: "dromedary camel",
		u: "6.0"
	},
	drooling_face: {
		c: "people",
		e: "🤤",
		d: "drooling face",
		u: "9.0"
	},
	droplet: {
		c: "nature",
		e: "💧",
		d: "droplet",
		u: "6.0"
	},
	drum: {
		c: "activity",
		e: "🥁",
		d: "drum with drumsticks",
		u: "9.0"
	},
	duck: {
		c: "nature",
		e: "🦆",
		d: "duck",
		u: "9.0"
	},
	dvd: {
		c: "objects",
		e: "📀",
		d: "dvd",
		u: "6.0"
	},
	"e-mail": {
		c: "objects",
		e: "📧",
		d: "e-mail symbol",
		u: "6.0"
	},
	eagle: {
		c: "nature",
		e: "🦅",
		d: "eagle",
		u: "9.0"
	},
	ear: {
		c: "people",
		e: "👂",
		d: "ear",
		u: "6.0"
	},
	ear_of_rice: {
		c: "nature",
		e: "🌾",
		d: "ear of rice",
		u: "6.0"
	},
	ear_tone1: {
		c: "people",
		e: "👂🏻",
		d: "ear tone 1",
		u: "8.0"
	},
	ear_tone2: {
		c: "people",
		e: "👂🏼",
		d: "ear tone 2",
		u: "8.0"
	},
	ear_tone3: {
		c: "people",
		e: "👂🏽",
		d: "ear tone 3",
		u: "8.0"
	},
	ear_tone4: {
		c: "people",
		e: "👂🏾",
		d: "ear tone 4",
		u: "8.0"
	},
	ear_tone5: {
		c: "people",
		e: "👂🏿",
		d: "ear tone 5",
		u: "8.0"
	},
	earth_africa: {
		c: "nature",
		e: "🌍",
		d: "earth globe europe-africa",
		u: "6.0"
	},
	earth_americas: {
		c: "nature",
		e: "🌎",
		d: "earth globe americas",
		u: "6.0"
	},
	earth_asia: {
		c: "nature",
		e: "🌏",
		d: "earth globe asia-australia",
		u: "6.0"
	},
	egg: {
		c: "food",
		e: "🥚",
		d: "egg",
		u: "9.0"
	},
	eggplant: {
		c: "food",
		e: "🍆",
		d: "aubergine",
		u: "6.0"
	},
	eight: {
		c: "symbols",
		e: "8️⃣",
		d: "keycap digit eight",
		u: "3.0"
	},
	eight_pointed_black_star: {
		c: "symbols",
		e: "✴",
		d: "eight pointed black star",
		u: "1.1"
	},
	eight_spoked_asterisk: {
		c: "symbols",
		e: "✳",
		d: "eight spoked asterisk",
		u: "1.1"
	},
	eject: {
		c: "symbols",
		e: "⏏",
		d: "eject symbol",
		u: "4.0"
	},
	electric_plug: {
		c: "objects",
		e: "🔌",
		d: "electric plug",
		u: "6.0"
	},
	elephant: {
		c: "nature",
		e: "🐘",
		d: "elephant",
		u: "6.0"
	},
	end: {
		c: "symbols",
		e: "🔚",
		d: "end with leftwards arrow above",
		u: "6.0"
	},
	envelope: {
		c: "objects",
		e: "✉",
		d: "envelope",
		u: "1.1"
	},
	envelope_with_arrow: {
		c: "objects",
		e: "📩",
		d: "envelope with downwards arrow above",
		u: "6.0"
	},
	euro: {
		c: "objects",
		e: "💶",
		d: "banknote with euro sign",
		u: "6.0"
	},
	european_castle: {
		c: "travel",
		e: "🏰",
		d: "european castle",
		u: "6.0"
	},
	european_post_office: {
		c: "travel",
		e: "🏤",
		d: "european post office",
		u: "6.0"
	},
	evergreen_tree: {
		c: "nature",
		e: "🌲",
		d: "evergreen tree",
		u: "6.0"
	},
	exclamation: {
		c: "symbols",
		e: "❗",
		d: "heavy exclamation mark symbol",
		u: "5.2"
	},
	expressionless: {
		c: "people",
		e: "😑",
		d: "expressionless face",
		u: "6.1"
	},
	eye: {
		c: "people",
		e: "👁",
		d: "eye",
		u: "7.0"
	},
	eye_in_speech_bubble: {
		c: "symbols",
		e: "👁‍🗨",
		d: "eye in speech bubble",
		u: "7.0"
	},
	eyeglasses: {
		c: "people",
		e: "👓",
		d: "eyeglasses",
		u: "6.0"
	},
	eyes: {
		c: "people",
		e: "👀",
		d: "eyes",
		u: "6.0"
	},
	face_palm: {
		c: "people",
		e: "🤦",
		d: "face palm",
		u: "9.0"
	},
	face_palm_tone1: {
		c: "people",
		e: "🤦🏻",
		d: "face palm tone 1",
		u: "9.0"
	},
	face_palm_tone2: {
		c: "people",
		e: "🤦🏼",
		d: "face palm tone 2",
		u: "9.0"
	},
	face_palm_tone3: {
		c: "people",
		e: "🤦🏽",
		d: "face palm tone 3",
		u: "9.0"
	},
	face_palm_tone4: {
		c: "people",
		e: "🤦🏾",
		d: "face palm tone 4",
		u: "9.0"
	},
	face_palm_tone5: {
		c: "people",
		e: "🤦🏿",
		d: "face palm tone 5",
		u: "9.0"
	},
	factory: {
		c: "travel",
		e: "🏭",
		d: "factory",
		u: "6.0"
	},
	fallen_leaf: {
		c: "nature",
		e: "🍂",
		d: "fallen leaf",
		u: "6.0"
	},
	family: {
		c: "people",
		e: "👪",
		d: "family",
		u: "6.0"
	},
	family_mmb: {
		c: "people",
		e: "👨‍👨‍👦",
		d: "family (man,man,boy)",
		u: "6.0"
	},
	family_mmbb: {
		c: "people",
		e: "👨‍👨‍👦‍👦",
		d: "family (man,man,boy,boy)",
		u: "6.0"
	},
	family_mmg: {
		c: "people",
		e: "👨‍👨‍👧",
		d: "family (man,man,girl)",
		u: "6.0"
	},
	family_mmgb: {
		c: "people",
		e: "👨‍👨‍👧‍👦",
		d: "family (man,man,girl,boy)",
		u: "6.0"
	},
	family_mmgg: {
		c: "people",
		e: "👨‍👨‍👧‍👧",
		d: "family (man,man,girl,girl)",
		u: "6.0"
	},
	family_mwbb: {
		c: "people",
		e: "👨‍👩‍👦‍👦",
		d: "family (man,woman,boy,boy)",
		u: "6.0"
	},
	family_mwg: {
		c: "people",
		e: "👨‍👩‍👧",
		d: "family (man,woman,girl)",
		u: "6.0"
	},
	family_mwgb: {
		c: "people",
		e: "👨‍👩‍👧‍👦",
		d: "family (man,woman,girl,boy)",
		u: "6.0"
	},
	family_mwgg: {
		c: "people",
		e: "👨‍👩‍👧‍👧",
		d: "family (man,woman,girl,girl)",
		u: "6.0"
	},
	family_wwb: {
		c: "people",
		e: "👩‍👩‍👦",
		d: "family (woman,woman,boy)",
		u: "6.0"
	},
	family_wwbb: {
		c: "people",
		e: "👩‍👩‍👦‍👦",
		d: "family (woman,woman,boy,boy)",
		u: "6.0"
	},
	family_wwg: {
		c: "people",
		e: "👩‍👩‍👧",
		d: "family (woman,woman,girl)",
		u: "6.0"
	},
	family_wwgb: {
		c: "people",
		e: "👩‍👩‍👧‍👦",
		d: "family (woman,woman,girl,boy)",
		u: "6.0"
	},
	family_wwgg: {
		c: "people",
		e: "👩‍👩‍👧‍👧",
		d: "family (woman,woman,girl,girl)",
		u: "6.0"
	},
	fast_forward: {
		c: "symbols",
		e: "⏩",
		d: "black right-pointing double triangle",
		u: "6.0"
	},
	fax: {
		c: "objects",
		e: "📠",
		d: "fax machine",
		u: "6.0"
	},
	fearful: {
		c: "people",
		e: "😨",
		d: "fearful face",
		u: "6.0"
	},
	feet: {
		c: "nature",
		e: "🐾",
		d: "paw prints",
		u: "6.0"
	},
	fencer: {
		c: "activity",
		e: "🤺",
		d: "fencer",
		u: "9.0"
	},
	ferris_wheel: {
		c: "travel",
		e: "🎡",
		d: "ferris wheel",
		u: "6.0"
	},
	ferry: {
		c: "travel",
		e: "⛴",
		d: "ferry",
		u: "5.2"
	},
	field_hockey: {
		c: "activity",
		e: "🏑",
		d: "field hockey stick and ball",
		u: "8.0"
	},
	file_cabinet: {
		c: "objects",
		e: "🗄",
		d: "file cabinet",
		u: "7.0"
	},
	file_folder: {
		c: "objects",
		e: "📁",
		d: "file folder",
		u: "6.0"
	},
	film_frames: {
		c: "objects",
		e: "🎞",
		d: "film frames",
		u: "7.0"
	},
	fingers_crossed: {
		c: "people",
		e: "🤞",
		d: "hand with first and index finger crossed",
		u: "9.0"
	},
	fingers_crossed_tone1: {
		c: "people",
		e: "🤞🏻",
		d: "hand with index and middle fingers crossed tone 1",
		u: "9.0"
	},
	fingers_crossed_tone2: {
		c: "people",
		e: "🤞🏼",
		d: "hand with index and middle fingers crossed tone 2",
		u: "9.0"
	},
	fingers_crossed_tone3: {
		c: "people",
		e: "🤞🏽",
		d: "hand with index and middle fingers crossed tone 3",
		u: "9.0"
	},
	fingers_crossed_tone4: {
		c: "people",
		e: "🤞🏾",
		d: "hand with index and middle fingers crossed tone 4",
		u: "9.0"
	},
	fingers_crossed_tone5: {
		c: "people",
		e: "🤞🏿",
		d: "hand with index and middle fingers crossed tone 5",
		u: "9.0"
	},
	fire: {
		c: "nature",
		e: "🔥",
		d: "fire",
		u: "6.0"
	},
	fire_engine: {
		c: "travel",
		e: "🚒",
		d: "fire engine",
		u: "6.0"
	},
	fireworks: {
		c: "travel",
		e: "🎆",
		d: "fireworks",
		u: "6.0"
	},
	first_place: {
		c: "activity",
		e: "🥇",
		d: "first place medal",
		u: "9.0"
	},
	first_quarter_moon: {
		c: "nature",
		e: "🌓",
		d: "first quarter moon symbol",
		u: "6.0"
	},
	first_quarter_moon_with_face: {
		c: "nature",
		e: "🌛",
		d: "first quarter moon with face",
		u: "6.0"
	},
	fish: {
		c: "nature",
		e: "🐟",
		d: "fish",
		u: "6.0"
	},
	fish_cake: {
		c: "food",
		e: "🍥",
		d: "fish cake with swirl design",
		u: "6.0"
	},
	fishing_pole_and_fish: {
		c: "activity",
		e: "🎣",
		d: "fishing pole and fish",
		u: "6.0"
	},
	fist: {
		c: "people",
		e: "✊",
		d: "raised fist",
		u: "6.0"
	},
	fist_tone1: {
		c: "people",
		e: "✊🏻",
		d: "raised fist tone 1",
		u: "8.0"
	},
	fist_tone2: {
		c: "people",
		e: "✊🏼",
		d: "raised fist tone 2",
		u: "8.0"
	},
	fist_tone3: {
		c: "people",
		e: "✊🏽",
		d: "raised fist tone 3",
		u: "8.0"
	},
	fist_tone4: {
		c: "people",
		e: "✊🏾",
		d: "raised fist tone 4",
		u: "8.0"
	},
	fist_tone5: {
		c: "people",
		e: "✊🏿",
		d: "raised fist tone 5",
		u: "8.0"
	},
	five: {
		c: "symbols",
		e: "5️⃣",
		d: "keycap digit five",
		u: "3.0"
	},
	flag_ac: {
		c: "flags",
		e: "🇦🇨",
		d: "ascension",
		u: "6.0"
	},
	flag_ad: {
		c: "flags",
		e: "🇦🇩",
		d: "andorra",
		u: "6.0"
	},
	flag_ae: {
		c: "flags",
		e: "🇦🇪",
		d: "the united arab emirates",
		u: "6.0"
	},
	flag_af: {
		c: "flags",
		e: "🇦🇫",
		d: "afghanistan",
		u: "6.0"
	},
	flag_ag: {
		c: "flags",
		e: "🇦🇬",
		d: "antigua and barbuda",
		u: "6.0"
	},
	flag_ai: {
		c: "flags",
		e: "🇦🇮",
		d: "anguilla",
		u: "6.0"
	},
	flag_al: {
		c: "flags",
		e: "🇦🇱",
		d: "albania",
		u: "6.0"
	},
	flag_am: {
		c: "flags",
		e: "🇦🇲",
		d: "armenia",
		u: "6.0"
	},
	flag_ao: {
		c: "flags",
		e: "🇦🇴",
		d: "angola",
		u: "6.0"
	},
	flag_aq: {
		c: "flags",
		e: "🇦🇶",
		d: "antarctica",
		u: "6.0"
	},
	flag_ar: {
		c: "flags",
		e: "🇦🇷",
		d: "argentina",
		u: "6.0"
	},
	flag_as: {
		c: "flags",
		e: "🇦🇸",
		d: "american samoa",
		u: "6.0"
	},
	flag_at: {
		c: "flags",
		e: "🇦🇹",
		d: "austria",
		u: "6.0"
	},
	flag_au: {
		c: "flags",
		e: "🇦🇺",
		d: "australia",
		u: "6.0"
	},
	flag_aw: {
		c: "flags",
		e: "🇦🇼",
		d: "aruba",
		u: "6.0"
	},
	flag_ax: {
		c: "flags",
		e: "🇦🇽",
		d: "åland islands",
		u: "6.0"
	},
	flag_az: {
		c: "flags",
		e: "🇦🇿",
		d: "azerbaijan",
		u: "6.0"
	},
	flag_ba: {
		c: "flags",
		e: "🇧🇦",
		d: "bosnia and herzegovina",
		u: "6.0"
	},
	flag_bb: {
		c: "flags",
		e: "🇧🇧",
		d: "barbados",
		u: "6.0"
	},
	flag_bd: {
		c: "flags",
		e: "🇧🇩",
		d: "bangladesh",
		u: "6.0"
	},
	flag_be: {
		c: "flags",
		e: "🇧🇪",
		d: "belgium",
		u: "6.0"
	},
	flag_bf: {
		c: "flags",
		e: "🇧🇫",
		d: "burkina faso",
		u: "6.0"
	},
	flag_bg: {
		c: "flags",
		e: "🇧🇬",
		d: "bulgaria",
		u: "6.0"
	},
	flag_bh: {
		c: "flags",
		e: "🇧🇭",
		d: "bahrain",
		u: "6.0"
	},
	flag_bi: {
		c: "flags",
		e: "🇧🇮",
		d: "burundi",
		u: "6.0"
	},
	flag_bj: {
		c: "flags",
		e: "🇧🇯",
		d: "benin",
		u: "6.0"
	},
	flag_bl: {
		c: "flags",
		e: "🇧🇱",
		d: "saint barthélemy",
		u: "6.0"
	},
	flag_black: {
		c: "objects",
		e: "🏴",
		d: "waving black flag",
		u: "6.0"
	},
	flag_bm: {
		c: "flags",
		e: "🇧🇲",
		d: "bermuda",
		u: "6.0"
	},
	flag_bn: {
		c: "flags",
		e: "🇧🇳",
		d: "brunei",
		u: "6.0"
	},
	flag_bo: {
		c: "flags",
		e: "🇧🇴",
		d: "bolivia",
		u: "6.0"
	},
	flag_bq: {
		c: "flags",
		e: "🇧🇶",
		d: "caribbean netherlands",
		u: "6.0"
	},
	flag_br: {
		c: "flags",
		e: "🇧🇷",
		d: "brazil",
		u: "6.0"
	},
	flag_bs: {
		c: "flags",
		e: "🇧🇸",
		d: "the bahamas",
		u: "6.0"
	},
	flag_bt: {
		c: "flags",
		e: "🇧🇹",
		d: "bhutan",
		u: "6.0"
	},
	flag_bv: {
		c: "flags",
		e: "🇧🇻",
		d: "bouvet island",
		u: "6.0"
	},
	flag_bw: {
		c: "flags",
		e: "🇧🇼",
		d: "botswana",
		u: "6.0"
	},
	flag_by: {
		c: "flags",
		e: "🇧🇾",
		d: "belarus",
		u: "6.0"
	},
	flag_bz: {
		c: "flags",
		e: "🇧🇿",
		d: "belize",
		u: "6.0"
	},
	flag_ca: {
		c: "flags",
		e: "🇨🇦",
		d: "canada",
		u: "6.0"
	},
	flag_cc: {
		c: "flags",
		e: "🇨🇨",
		d: "cocos (keeling) islands",
		u: "6.0"
	},
	flag_cd: {
		c: "flags",
		e: "🇨🇩",
		d: "the democratic republic of the congo",
		u: "6.0"
	},
	flag_cf: {
		c: "flags",
		e: "🇨🇫",
		d: "central african republic",
		u: "6.0"
	},
	flag_cg: {
		c: "flags",
		e: "🇨🇬",
		d: "the republic of the congo",
		u: "6.0"
	},
	flag_ch: {
		c: "flags",
		e: "🇨🇭",
		d: "switzerland",
		u: "6.0"
	},
	flag_ci: {
		c: "flags",
		e: "🇨🇮",
		d: "cote d'ivoire",
		u: "6.0"
	},
	flag_ck: {
		c: "flags",
		e: "🇨🇰",
		d: "cook islands",
		u: "6.0"
	},
	flag_cl: {
		c: "flags",
		e: "🇨🇱",
		d: "chile",
		u: "6.0"
	},
	flag_cm: {
		c: "flags",
		e: "🇨🇲",
		d: "cameroon",
		u: "6.0"
	},
	flag_cn: {
		c: "flags",
		e: "🇨🇳",
		d: "china",
		u: "6.0"
	},
	flag_co: {
		c: "flags",
		e: "🇨🇴",
		d: "colombia",
		u: "6.0"
	},
	flag_cp: {
		c: "flags",
		e: "🇨🇵",
		d: "clipperton island",
		u: "6.0"
	},
	flag_cr: {
		c: "flags",
		e: "🇨🇷",
		d: "costa rica",
		u: "6.0"
	},
	flag_cu: {
		c: "flags",
		e: "🇨🇺",
		d: "cuba",
		u: "6.0"
	},
	flag_cv: {
		c: "flags",
		e: "🇨🇻",
		d: "cape verde",
		u: "6.0"
	},
	flag_cw: {
		c: "flags",
		e: "🇨🇼",
		d: "curaçao",
		u: "6.0"
	},
	flag_cx: {
		c: "flags",
		e: "🇨🇽",
		d: "christmas island",
		u: "6.0"
	},
	flag_cy: {
		c: "flags",
		e: "🇨🇾",
		d: "cyprus",
		u: "6.0"
	},
	flag_cz: {
		c: "flags",
		e: "🇨🇿",
		d: "the czech republic",
		u: "6.0"
	},
	flag_de: {
		c: "flags",
		e: "🇩🇪",
		d: "germany",
		u: "6.0"
	},
	flag_dg: {
		c: "flags",
		e: "🇩🇬",
		d: "diego garcia",
		u: "6.0"
	},
	flag_dj: {
		c: "flags",
		e: "🇩🇯",
		d: "djibouti",
		u: "6.0"
	},
	flag_dk: {
		c: "flags",
		e: "🇩🇰",
		d: "denmark",
		u: "6.0"
	},
	flag_dm: {
		c: "flags",
		e: "🇩🇲",
		d: "dominica",
		u: "6.0"
	},
	flag_do: {
		c: "flags",
		e: "🇩🇴",
		d: "the dominican republic",
		u: "6.0"
	},
	flag_dz: {
		c: "flags",
		e: "🇩🇿",
		d: "algeria",
		u: "6.0"
	},
	flag_ea: {
		c: "flags",
		e: "🇪🇦",
		d: "ceuta, melilla",
		u: "6.0"
	},
	flag_ec: {
		c: "flags",
		e: "🇪🇨",
		d: "ecuador",
		u: "6.0"
	},
	flag_ee: {
		c: "flags",
		e: "🇪🇪",
		d: "estonia",
		u: "6.0"
	},
	flag_eg: {
		c: "flags",
		e: "🇪🇬",
		d: "egypt",
		u: "6.0"
	},
	flag_eh: {
		c: "flags",
		e: "🇪🇭",
		d: "western sahara",
		u: "6.0"
	},
	flag_er: {
		c: "flags",
		e: "🇪🇷",
		d: "eritrea",
		u: "6.0"
	},
	flag_es: {
		c: "flags",
		e: "🇪🇸",
		d: "spain",
		u: "6.0"
	},
	flag_et: {
		c: "flags",
		e: "🇪🇹",
		d: "ethiopia",
		u: "6.0"
	},
	flag_eu: {
		c: "flags",
		e: "🇪🇺",
		d: "european union",
		u: "6.0"
	},
	flag_fi: {
		c: "flags",
		e: "🇫🇮",
		d: "finland",
		u: "6.0"
	},
	flag_fj: {
		c: "flags",
		e: "🇫🇯",
		d: "fiji",
		u: "6.0"
	},
	flag_fk: {
		c: "flags",
		e: "🇫🇰",
		d: "falkland islands",
		u: "6.0"
	},
	flag_fm: {
		c: "flags",
		e: "🇫🇲",
		d: "micronesia",
		u: "6.0"
	},
	flag_fo: {
		c: "flags",
		e: "🇫🇴",
		d: "faroe islands",
		u: "6.0"
	},
	flag_fr: {
		c: "flags",
		e: "🇫🇷",
		d: "france",
		u: "6.0"
	},
	flag_ga: {
		c: "flags",
		e: "🇬🇦",
		d: "gabon",
		u: "6.0"
	},
	flag_gb: {
		c: "flags",
		e: "🇬🇧",
		d: "great britain",
		u: "6.0"
	},
	flag_gd: {
		c: "flags",
		e: "🇬🇩",
		d: "grenada",
		u: "6.0"
	},
	flag_ge: {
		c: "flags",
		e: "🇬🇪",
		d: "georgia",
		u: "6.0"
	},
	flag_gf: {
		c: "flags",
		e: "🇬🇫",
		d: "french guiana",
		u: "6.0"
	},
	flag_gg: {
		c: "flags",
		e: "🇬🇬",
		d: "guernsey",
		u: "6.0"
	},
	flag_gh: {
		c: "flags",
		e: "🇬🇭",
		d: "ghana",
		u: "6.0"
	},
	flag_gi: {
		c: "flags",
		e: "🇬🇮",
		d: "gibraltar",
		u: "6.0"
	},
	flag_gl: {
		c: "flags",
		e: "🇬🇱",
		d: "greenland",
		u: "6.0"
	},
	flag_gm: {
		c: "flags",
		e: "🇬🇲",
		d: "the gambia",
		u: "6.0"
	},
	flag_gn: {
		c: "flags",
		e: "🇬🇳",
		d: "guinea",
		u: "6.0"
	},
	flag_gp: {
		c: "flags",
		e: "🇬🇵",
		d: "guadeloupe",
		u: "6.0"
	},
	flag_gq: {
		c: "flags",
		e: "🇬🇶",
		d: "equatorial guinea",
		u: "6.0"
	},
	flag_gr: {
		c: "flags",
		e: "🇬🇷",
		d: "greece",
		u: "6.0"
	},
	flag_gs: {
		c: "flags",
		e: "🇬🇸",
		d: "south georgia",
		u: "6.0"
	},
	flag_gt: {
		c: "flags",
		e: "🇬🇹",
		d: "guatemala",
		u: "6.0"
	},
	flag_gu: {
		c: "flags",
		e: "🇬🇺",
		d: "guam",
		u: "6.0"
	},
	flag_gw: {
		c: "flags",
		e: "🇬🇼",
		d: "guinea-bissau",
		u: "6.0"
	},
	flag_gy: {
		c: "flags",
		e: "🇬🇾",
		d: "guyana",
		u: "6.0"
	},
	flag_hk: {
		c: "flags",
		e: "🇭🇰",
		d: "hong kong",
		u: "6.0"
	},
	flag_hm: {
		c: "flags",
		e: "🇭🇲",
		d: "heard island and mcdonald islands",
		u: "6.0"
	},
	flag_hn: {
		c: "flags",
		e: "🇭🇳",
		d: "honduras",
		u: "6.0"
	},
	flag_hr: {
		c: "flags",
		e: "🇭🇷",
		d: "croatia",
		u: "6.0"
	},
	flag_ht: {
		c: "flags",
		e: "🇭🇹",
		d: "haiti",
		u: "6.0"
	},
	flag_hu: {
		c: "flags",
		e: "🇭🇺",
		d: "hungary",
		u: "6.0"
	},
	flag_ic: {
		c: "flags",
		e: "🇮🇨",
		d: "canary islands",
		u: "6.0"
	},
	flag_id: {
		c: "flags",
		e: "🇮🇩",
		d: "indonesia",
		u: "6.0"
	},
	flag_ie: {
		c: "flags",
		e: "🇮🇪",
		d: "ireland",
		u: "6.0"
	},
	flag_il: {
		c: "flags",
		e: "🇮🇱",
		d: "israel",
		u: "6.0"
	},
	flag_im: {
		c: "flags",
		e: "🇮🇲",
		d: "isle of man",
		u: "6.0"
	},
	flag_in: {
		c: "flags",
		e: "🇮🇳",
		d: "india",
		u: "6.0"
	},
	flag_io: {
		c: "flags",
		e: "🇮🇴",
		d: "british indian ocean territory",
		u: "6.0"
	},
	flag_iq: {
		c: "flags",
		e: "🇮🇶",
		d: "iraq",
		u: "6.0"
	},
	flag_ir: {
		c: "flags",
		e: "🇮🇷",
		d: "iran",
		u: "6.0"
	},
	flag_is: {
		c: "flags",
		e: "🇮🇸",
		d: "iceland",
		u: "6.0"
	},
	flag_it: {
		c: "flags",
		e: "🇮🇹",
		d: "italy",
		u: "6.0"
	},
	flag_je: {
		c: "flags",
		e: "🇯🇪",
		d: "jersey",
		u: "6.0"
	},
	flag_jm: {
		c: "flags",
		e: "🇯🇲",
		d: "jamaica",
		u: "6.0"
	},
	flag_jo: {
		c: "flags",
		e: "🇯🇴",
		d: "jordan",
		u: "6.0"
	},
	flag_jp: {
		c: "flags",
		e: "🇯🇵",
		d: "japan",
		u: "6.0"
	},
	flag_ke: {
		c: "flags",
		e: "🇰🇪",
		d: "kenya",
		u: "6.0"
	},
	flag_kg: {
		c: "flags",
		e: "🇰🇬",
		d: "kyrgyzstan",
		u: "6.0"
	},
	flag_kh: {
		c: "flags",
		e: "🇰🇭",
		d: "cambodia",
		u: "6.0"
	},
	flag_ki: {
		c: "flags",
		e: "🇰🇮",
		d: "kiribati",
		u: "6.0"
	},
	flag_km: {
		c: "flags",
		e: "🇰🇲",
		d: "the comoros",
		u: "6.0"
	},
	flag_kn: {
		c: "flags",
		e: "🇰🇳",
		d: "saint kitts and nevis",
		u: "6.0"
	},
	flag_kp: {
		c: "flags",
		e: "🇰🇵",
		d: "north korea",
		u: "6.0"
	},
	flag_kr: {
		c: "flags",
		e: "🇰🇷",
		d: "korea",
		u: "6.0"
	},
	flag_kw: {
		c: "flags",
		e: "🇰🇼",
		d: "kuwait",
		u: "6.0"
	},
	flag_ky: {
		c: "flags",
		e: "🇰🇾",
		d: "cayman islands",
		u: "6.0"
	},
	flag_kz: {
		c: "flags",
		e: "🇰🇿",
		d: "kazakhstan",
		u: "6.0"
	},
	flag_la: {
		c: "flags",
		e: "🇱🇦",
		d: "laos",
		u: "6.0"
	},
	flag_lb: {
		c: "flags",
		e: "🇱🇧",
		d: "lebanon",
		u: "6.0"
	},
	flag_lc: {
		c: "flags",
		e: "🇱🇨",
		d: "saint lucia",
		u: "6.0"
	},
	flag_li: {
		c: "flags",
		e: "🇱🇮",
		d: "liechtenstein",
		u: "6.0"
	},
	flag_lk: {
		c: "flags",
		e: "🇱🇰",
		d: "sri lanka",
		u: "6.0"
	},
	flag_lr: {
		c: "flags",
		e: "🇱🇷",
		d: "liberia",
		u: "6.0"
	},
	flag_ls: {
		c: "flags",
		e: "🇱🇸",
		d: "lesotho",
		u: "6.0"
	},
	flag_lt: {
		c: "flags",
		e: "🇱🇹",
		d: "lithuania",
		u: "6.0"
	},
	flag_lu: {
		c: "flags",
		e: "🇱🇺",
		d: "luxembourg",
		u: "6.0"
	},
	flag_lv: {
		c: "flags",
		e: "🇱🇻",
		d: "latvia",
		u: "6.0"
	},
	flag_ly: {
		c: "flags",
		e: "🇱🇾",
		d: "libya",
		u: "6.0"
	},
	flag_ma: {
		c: "flags",
		e: "🇲🇦",
		d: "morocco",
		u: "6.0"
	},
	flag_mc: {
		c: "flags",
		e: "🇲🇨",
		d: "monaco",
		u: "6.0"
	},
	flag_md: {
		c: "flags",
		e: "🇲🇩",
		d: "moldova",
		u: "6.0"
	},
	flag_me: {
		c: "flags",
		e: "🇲🇪",
		d: "montenegro",
		u: "6.0"
	},
	flag_mf: {
		c: "flags",
		e: "🇲🇫",
		d: "saint martin",
		u: "6.0"
	},
	flag_mg: {
		c: "flags",
		e: "🇲🇬",
		d: "madagascar",
		u: "6.0"
	},
	flag_mh: {
		c: "flags",
		e: "🇲🇭",
		d: "the marshall islands",
		u: "6.0"
	},
	flag_mk: {
		c: "flags",
		e: "🇲🇰",
		d: "macedonia",
		u: "6.0"
	},
	flag_ml: {
		c: "flags",
		e: "🇲🇱",
		d: "mali",
		u: "6.0"
	},
	flag_mm: {
		c: "flags",
		e: "🇲🇲",
		d: "myanmar",
		u: "6.0"
	},
	flag_mn: {
		c: "flags",
		e: "🇲🇳",
		d: "mongolia",
		u: "6.0"
	},
	flag_mo: {
		c: "flags",
		e: "🇲🇴",
		d: "macau",
		u: "6.0"
	},
	flag_mp: {
		c: "flags",
		e: "🇲🇵",
		d: "northern mariana islands",
		u: "6.0"
	},
	flag_mq: {
		c: "flags",
		e: "🇲🇶",
		d: "martinique",
		u: "6.0"
	},
	flag_mr: {
		c: "flags",
		e: "🇲🇷",
		d: "mauritania",
		u: "6.0"
	},
	flag_ms: {
		c: "flags",
		e: "🇲🇸",
		d: "montserrat",
		u: "6.0"
	},
	flag_mt: {
		c: "flags",
		e: "🇲🇹",
		d: "malta",
		u: "6.0"
	},
	flag_mu: {
		c: "flags",
		e: "🇲🇺",
		d: "mauritius",
		u: "6.0"
	},
	flag_mv: {
		c: "flags",
		e: "🇲🇻",
		d: "maldives",
		u: "6.0"
	},
	flag_mw: {
		c: "flags",
		e: "🇲🇼",
		d: "malawi",
		u: "6.0"
	},
	flag_mx: {
		c: "flags",
		e: "🇲🇽",
		d: "mexico",
		u: "6.0"
	},
	flag_my: {
		c: "flags",
		e: "🇲🇾",
		d: "malaysia",
		u: "6.0"
	},
	flag_mz: {
		c: "flags",
		e: "🇲🇿",
		d: "mozambique",
		u: "6.0"
	},
	flag_na: {
		c: "flags",
		e: "🇳🇦",
		d: "namibia",
		u: "6.0"
	},
	flag_nc: {
		c: "flags",
		e: "🇳🇨",
		d: "new caledonia",
		u: "6.0"
	},
	flag_ne: {
		c: "flags",
		e: "🇳🇪",
		d: "niger",
		u: "6.0"
	},
	flag_nf: {
		c: "flags",
		e: "🇳🇫",
		d: "norfolk island",
		u: "6.0"
	},
	flag_ng: {
		c: "flags",
		e: "🇳🇬",
		d: "nigeria",
		u: "6.0"
	},
	flag_ni: {
		c: "flags",
		e: "🇳🇮",
		d: "nicaragua",
		u: "6.0"
	},
	flag_nl: {
		c: "flags",
		e: "🇳🇱",
		d: "the netherlands",
		u: "6.0"
	},
	flag_no: {
		c: "flags",
		e: "🇳🇴",
		d: "norway",
		u: "6.0"
	},
	flag_np: {
		c: "flags",
		e: "🇳🇵",
		d: "nepal",
		u: "6.0"
	},
	flag_nr: {
		c: "flags",
		e: "🇳🇷",
		d: "nauru",
		u: "6.0"
	},
	flag_nu: {
		c: "flags",
		e: "🇳🇺",
		d: "niue",
		u: "6.0"
	},
	flag_nz: {
		c: "flags",
		e: "🇳🇿",
		d: "new zealand",
		u: "6.0"
	},
	flag_om: {
		c: "flags",
		e: "🇴🇲",
		d: "oman",
		u: "6.0"
	},
	flag_pa: {
		c: "flags",
		e: "🇵🇦",
		d: "panama",
		u: "6.0"
	},
	flag_pe: {
		c: "flags",
		e: "🇵🇪",
		d: "peru",
		u: "6.0"
	},
	flag_pf: {
		c: "flags",
		e: "🇵🇫",
		d: "french polynesia",
		u: "6.0"
	},
	flag_pg: {
		c: "flags",
		e: "🇵🇬",
		d: "papua new guinea",
		u: "6.0"
	},
	flag_ph: {
		c: "flags",
		e: "🇵🇭",
		d: "the philippines",
		u: "6.0"
	},
	flag_pk: {
		c: "flags",
		e: "🇵🇰",
		d: "pakistan",
		u: "6.0"
	},
	flag_pl: {
		c: "flags",
		e: "🇵🇱",
		d: "poland",
		u: "6.0"
	},
	flag_pm: {
		c: "flags",
		e: "🇵🇲",
		d: "saint pierre and miquelon",
		u: "6.0"
	},
	flag_pn: {
		c: "flags",
		e: "🇵🇳",
		d: "pitcairn",
		u: "6.0"
	},
	flag_pr: {
		c: "flags",
		e: "🇵🇷",
		d: "puerto rico",
		u: "6.0"
	},
	flag_ps: {
		c: "flags",
		e: "🇵🇸",
		d: "palestinian authority",
		u: "6.0"
	},
	flag_pt: {
		c: "flags",
		e: "🇵🇹",
		d: "portugal",
		u: "6.0"
	},
	flag_pw: {
		c: "flags",
		e: "🇵🇼",
		d: "palau",
		u: "6.0"
	},
	flag_py: {
		c: "flags",
		e: "🇵🇾",
		d: "paraguay",
		u: "6.0"
	},
	flag_qa: {
		c: "flags",
		e: "🇶🇦",
		d: "qatar",
		u: "6.0"
	},
	flag_re: {
		c: "flags",
		e: "🇷🇪",
		d: "réunion",
		u: "6.0"
	},
	flag_ro: {
		c: "flags",
		e: "🇷🇴",
		d: "romania",
		u: "6.0"
	},
	flag_rs: {
		c: "flags",
		e: "🇷🇸",
		d: "serbia",
		u: "6.0"
	},
	flag_ru: {
		c: "flags",
		e: "🇷🇺",
		d: "russia",
		u: "6.0"
	},
	flag_rw: {
		c: "flags",
		e: "🇷🇼",
		d: "rwanda",
		u: "6.0"
	},
	flag_sa: {
		c: "flags",
		e: "🇸🇦",
		d: "saudi arabia",
		u: "6.0"
	},
	flag_sb: {
		c: "flags",
		e: "🇸🇧",
		d: "the solomon islands",
		u: "6.0"
	},
	flag_sc: {
		c: "flags",
		e: "🇸🇨",
		d: "the seychelles",
		u: "6.0"
	},
	flag_sd: {
		c: "flags",
		e: "🇸🇩",
		d: "sudan",
		u: "6.0"
	},
	flag_se: {
		c: "flags",
		e: "🇸🇪",
		d: "sweden",
		u: "6.0"
	},
	flag_sg: {
		c: "flags",
		e: "🇸🇬",
		d: "singapore",
		u: "6.0"
	},
	flag_sh: {
		c: "flags",
		e: "🇸🇭",
		d: "saint helena",
		u: "6.0"
	},
	flag_si: {
		c: "flags",
		e: "🇸🇮",
		d: "slovenia",
		u: "6.0"
	},
	flag_sj: {
		c: "flags",
		e: "🇸🇯",
		d: "svalbard and jan mayen",
		u: "6.0"
	},
	flag_sk: {
		c: "flags",
		e: "🇸🇰",
		d: "slovakia",
		u: "6.0"
	},
	flag_sl: {
		c: "flags",
		e: "🇸🇱",
		d: "sierra leone",
		u: "6.0"
	},
	flag_sm: {
		c: "flags",
		e: "🇸🇲",
		d: "san marino",
		u: "6.0"
	},
	flag_sn: {
		c: "flags",
		e: "🇸🇳",
		d: "senegal",
		u: "6.0"
	},
	flag_so: {
		c: "flags",
		e: "🇸🇴",
		d: "somalia",
		u: "6.0"
	},
	flag_sr: {
		c: "flags",
		e: "🇸🇷",
		d: "suriname",
		u: "6.0"
	},
	flag_ss: {
		c: "flags",
		e: "🇸🇸",
		d: "south sudan",
		u: "6.0"
	},
	flag_st: {
		c: "flags",
		e: "🇸🇹",
		d: "sao tome and principe",
		u: "6.0"
	},
	flag_sv: {
		c: "flags",
		e: "🇸🇻",
		d: "el salvador",
		u: "6.0"
	},
	flag_sx: {
		c: "flags",
		e: "🇸🇽",
		d: "sint maarten",
		u: "6.0"
	},
	flag_sy: {
		c: "flags",
		e: "🇸🇾",
		d: "syria",
		u: "6.0"
	},
	flag_sz: {
		c: "flags",
		e: "🇸🇿",
		d: "swaziland",
		u: "6.0"
	},
	flag_ta: {
		c: "flags",
		e: "🇹🇦",
		d: "tristan da cunha",
		u: "6.0"
	},
	flag_tc: {
		c: "flags",
		e: "🇹🇨",
		d: "turks and caicos islands",
		u: "6.0"
	},
	flag_td: {
		c: "flags",
		e: "🇹🇩",
		d: "chad",
		u: "6.0"
	},
	flag_tf: {
		c: "flags",
		e: "🇹🇫",
		d: "french southern territories",
		u: "6.0"
	},
	flag_tg: {
		c: "flags",
		e: "🇹🇬",
		d: "togo",
		u: "6.0"
	},
	flag_th: {
		c: "flags",
		e: "🇹🇭",
		d: "thailand",
		u: "6.0"
	},
	flag_tj: {
		c: "flags",
		e: "🇹🇯",
		d: "tajikistan",
		u: "6.0"
	},
	flag_tk: {
		c: "flags",
		e: "🇹🇰",
		d: "tokelau",
		u: "6.0"
	},
	flag_tl: {
		c: "flags",
		e: "🇹🇱",
		d: "east timor",
		u: "6.0"
	},
	flag_tm: {
		c: "flags",
		e: "🇹🇲",
		d: "turkmenistan",
		u: "6.0"
	},
	flag_tn: {
		c: "flags",
		e: "🇹🇳",
		d: "tunisia",
		u: "6.0"
	},
	flag_to: {
		c: "flags",
		e: "🇹🇴",
		d: "tonga",
		u: "6.0"
	},
	flag_tr: {
		c: "flags",
		e: "🇹🇷",
		d: "turkey",
		u: "6.0"
	},
	flag_tt: {
		c: "flags",
		e: "🇹🇹",
		d: "trinidad and tobago",
		u: "6.0"
	},
	flag_tv: {
		c: "flags",
		e: "🇹🇻",
		d: "tuvalu",
		u: "6.0"
	},
	flag_tw: {
		c: "flags",
		e: "🇹🇼",
		d: "the republic of china",
		u: "6.0"
	},
	flag_tz: {
		c: "flags",
		e: "🇹🇿",
		d: "tanzania",
		u: "6.0"
	},
	flag_ua: {
		c: "flags",
		e: "🇺🇦",
		d: "ukraine",
		u: "6.0"
	},
	flag_ug: {
		c: "flags",
		e: "🇺🇬",
		d: "uganda",
		u: "6.0"
	},
	flag_um: {
		c: "flags",
		e: "🇺🇲",
		d: "united states minor outlying islands",
		u: "6.0"
	},
	flag_us: {
		c: "flags",
		e: "🇺🇸",
		d: "united states",
		u: "6.0"
	},
	flag_uy: {
		c: "flags",
		e: "🇺🇾",
		d: "uruguay",
		u: "6.0"
	},
	flag_uz: {
		c: "flags",
		e: "🇺🇿",
		d: "uzbekistan",
		u: "6.0"
	},
	flag_va: {
		c: "flags",
		e: "🇻🇦",
		d: "the vatican city",
		u: "6.0"
	},
	flag_vc: {
		c: "flags",
		e: "🇻🇨",
		d: "saint vincent and the grenadines",
		u: "6.0"
	},
	flag_ve: {
		c: "flags",
		e: "🇻🇪",
		d: "venezuela",
		u: "6.0"
	},
	flag_vg: {
		c: "flags",
		e: "🇻🇬",
		d: "british virgin islands",
		u: "6.0"
	},
	flag_vi: {
		c: "flags",
		e: "🇻🇮",
		d: "u.s. virgin islands",
		u: "6.0"
	},
	flag_vn: {
		c: "flags",
		e: "🇻🇳",
		d: "vietnam",
		u: "6.0"
	},
	flag_vu: {
		c: "flags",
		e: "🇻🇺",
		d: "vanuatu",
		u: "6.0"
	},
	flag_wf: {
		c: "flags",
		e: "🇼🇫",
		d: "wallis and futuna",
		u: "6.0"
	},
	flag_white: {
		c: "objects",
		e: "🏳",
		d: "waving white flag",
		u: "6.0"
	},
	flag_ws: {
		c: "flags",
		e: "🇼🇸",
		d: "samoa",
		u: "6.0"
	},
	flag_xk: {
		c: "flags",
		e: "🇽🇰",
		d: "kosovo",
		u: "6.0"
	},
	flag_ye: {
		c: "flags",
		e: "🇾🇪",
		d: "yemen",
		u: "6.0"
	},
	flag_yt: {
		c: "flags",
		e: "🇾🇹",
		d: "mayotte",
		u: "6.0"
	},
	flag_za: {
		c: "flags",
		e: "🇿🇦",
		d: "south africa",
		u: "6.0"
	},
	flag_zm: {
		c: "flags",
		e: "🇿🇲",
		d: "zambia",
		u: "6.0"
	},
	flag_zw: {
		c: "flags",
		e: "🇿🇼",
		d: "zimbabwe",
		u: "6.0"
	},
	flags: {
		c: "objects",
		e: "🎏",
		d: "carp streamer",
		u: "6.0"
	},
	flashlight: {
		c: "objects",
		e: "🔦",
		d: "electric torch",
		u: "6.0"
	},
	"fleur-de-lis": {
		c: "symbols",
		e: "⚜",
		d: "fleur-de-lis",
		u: "4.1"
	},
	floppy_disk: {
		c: "objects",
		e: "💾",
		d: "floppy disk",
		u: "6.0"
	},
	flower_playing_cards: {
		c: "symbols",
		e: "🎴",
		d: "flower playing cards",
		u: "6.0"
	},
	flushed: {
		c: "people",
		e: "😳",
		d: "flushed face",
		u: "6.0"
	},
	fog: {
		c: "nature",
		e: "🌫",
		d: "fog",
		u: "7.0"
	},
	foggy: {
		c: "travel",
		e: "🌁",
		d: "foggy",
		u: "6.0"
	},
	football: {
		c: "activity",
		e: "🏈",
		d: "american football",
		u: "6.0"
	},
	footprints: {
		c: "people",
		e: "👣",
		d: "footprints",
		u: "6.0"
	},
	fork_and_knife: {
		c: "food",
		e: "🍴",
		d: "fork and knife",
		u: "6.0"
	},
	fork_knife_plate: {
		c: "food",
		e: "🍽",
		d: "fork and knife with plate",
		u: "7.0"
	},
	fountain: {
		c: "travel",
		e: "⛲",
		d: "fountain",
		u: "5.2"
	},
	four: {
		c: "symbols",
		e: "4️⃣",
		d: "keycap digit four",
		u: "3.0"
	},
	four_leaf_clover: {
		c: "nature",
		e: "🍀",
		d: "four leaf clover",
		u: "6.0"
	},
	fox: {
		c: "nature",
		e: "🦊",
		d: "fox face",
		u: "9.0"
	},
	frame_photo: {
		c: "objects",
		e: "🖼",
		d: "frame with picture",
		u: "7.0"
	},
	free: {
		c: "symbols",
		e: "🆓",
		d: "squared free",
		u: "6.0"
	},
	french_bread: {
		c: "food",
		e: "🥖",
		d: "baguette bread",
		u: "9.0"
	},
	fried_shrimp: {
		c: "food",
		e: "🍤",
		d: "fried shrimp",
		u: "6.0"
	},
	fries: {
		c: "food",
		e: "🍟",
		d: "french fries",
		u: "6.0"
	},
	frog: {
		c: "nature",
		e: "🐸",
		d: "frog face",
		u: "6.0"
	},
	frowning: {
		c: "people",
		e: "😦",
		d: "frowning face with open mouth",
		u: "6.1"
	},
	frowning2: {
		c: "people",
		e: "☹",
		d: "white frowning face",
		u: "1.1"
	},
	fuelpump: {
		c: "travel",
		e: "⛽",
		d: "fuel pump",
		u: "5.2"
	},
	full_moon: {
		c: "nature",
		e: "🌕",
		d: "full moon symbol",
		u: "6.0"
	},
	full_moon_with_face: {
		c: "nature",
		e: "🌝",
		d: "full moon with face",
		u: "6.0"
	},
	game_die: {
		c: "activity",
		e: "🎲",
		d: "game die",
		u: "6.0"
	},
	gear: {
		c: "objects",
		e: "⚙",
		d: "gear",
		u: "4.1"
	},
	gem: {
		c: "objects",
		e: "💎",
		d: "gem stone",
		u: "6.0"
	},
	gay_pride_flag: {
		c: "flags",
		e: "🏳🌈",
		d: "gay_pride_flag",
		u: "6.0"
	},
	gemini: {
		c: "symbols",
		e: "♊",
		d: "gemini",
		u: "1.1"
	},
	ghost: {
		c: "people",
		e: "👻",
		d: "ghost",
		u: "6.0"
	},
	gift: {
		c: "objects",
		e: "🎁",
		d: "wrapped present",
		u: "6.0"
	},
	gift_heart: {
		c: "symbols",
		e: "💝",
		d: "heart with ribbon",
		u: "6.0"
	},
	girl: {
		c: "people",
		e: "👧",
		d: "girl",
		u: "6.0"
	},
	girl_tone1: {
		c: "people",
		e: "👧🏻",
		d: "girl tone 1",
		u: "8.0"
	},
	girl_tone2: {
		c: "people",
		e: "👧🏼",
		d: "girl tone 2",
		u: "8.0"
	},
	girl_tone3: {
		c: "people",
		e: "👧🏽",
		d: "girl tone 3",
		u: "8.0"
	},
	girl_tone4: {
		c: "people",
		e: "👧🏾",
		d: "girl tone 4",
		u: "8.0"
	},
	girl_tone5: {
		c: "people",
		e: "👧🏿",
		d: "girl tone 5",
		u: "8.0"
	},
	globe_with_meridians: {
		c: "symbols",
		e: "🌐",
		d: "globe with meridians",
		u: "6.0"
	},
	goal: {
		c: "activity",
		e: "🥅",
		d: "goal net",
		u: "9.0"
	},
	goat: {
		c: "nature",
		e: "🐐",
		d: "goat",
		u: "6.0"
	},
	golf: {
		c: "activity",
		e: "⛳",
		d: "flag in hole",
		u: "5.2"
	},
	golfer: {
		c: "activity",
		e: "🏌",
		d: "golfer",
		u: "7.0"
	},
	gorilla: {
		c: "nature",
		e: "🦍",
		d: "gorilla",
		u: "9.0"
	},
	grapes: {
		c: "food",
		e: "🍇",
		d: "grapes",
		u: "6.0"
	},
	green_apple: {
		c: "food",
		e: "🍏",
		d: "green apple",
		u: "6.0"
	},
	green_book: {
		c: "objects",
		e: "📗",
		d: "green book",
		u: "6.0"
	},
	green_heart: {
		c: "symbols",
		e: "💚",
		d: "green heart",
		u: "6.0"
	},
	grey_exclamation: {
		c: "symbols",
		e: "❕",
		d: "white exclamation mark ornament",
		u: "6.0"
	},
	grey_question: {
		c: "symbols",
		e: "❔",
		d: "white question mark ornament",
		u: "6.0"
	},
	grimacing: {
		c: "people",
		e: "😬",
		d: "grimacing face",
		u: "6.1"
	},
	grin: {
		c: "people",
		e: "😁",
		d: "grinning face with smiling eyes",
		u: "6.0"
	},
	grinning: {
		c: "people",
		e: "😀",
		d: "grinning face",
		u: "6.1"
	},
	guardsman: {
		c: "people",
		e: "💂",
		d: "guardsman",
		u: "6.0"
	},
	guardsman_tone1: {
		c: "people",
		e: "💂🏻",
		d: "guardsman tone 1",
		u: "8.0"
	},
	guardsman_tone2: {
		c: "people",
		e: "💂🏼",
		d: "guardsman tone 2",
		u: "8.0"
	},
	guardsman_tone3: {
		c: "people",
		e: "💂🏽",
		d: "guardsman tone 3",
		u: "8.0"
	},
	guardsman_tone4: {
		c: "people",
		e: "💂🏾",
		d: "guardsman tone 4",
		u: "8.0"
	},
	guardsman_tone5: {
		c: "people",
		e: "💂🏿",
		d: "guardsman tone 5",
		u: "8.0"
	},
	guitar: {
		c: "activity",
		e: "🎸",
		d: "guitar",
		u: "6.0"
	},
	gun: {
		c: "objects",
		e: "🔫",
		d: "pistol",
		u: "6.0"
	},
	haircut: {
		c: "people",
		e: "💇",
		d: "haircut",
		u: "6.0"
	},
	haircut_tone1: {
		c: "people",
		e: "💇🏻",
		d: "haircut tone 1",
		u: "8.0"
	},
	haircut_tone2: {
		c: "people",
		e: "💇🏼",
		d: "haircut tone 2",
		u: "8.0"
	},
	haircut_tone3: {
		c: "people",
		e: "💇🏽",
		d: "haircut tone 3",
		u: "8.0"
	},
	haircut_tone4: {
		c: "people",
		e: "💇🏾",
		d: "haircut tone 4",
		u: "8.0"
	},
	haircut_tone5: {
		c: "people",
		e: "💇🏿",
		d: "haircut tone 5",
		u: "8.0"
	},
	hamburger: {
		c: "food",
		e: "🍔",
		d: "hamburger",
		u: "6.0"
	},
	hammer: {
		c: "objects",
		e: "🔨",
		d: "hammer",
		u: "6.0"
	},
	hammer_pick: {
		c: "objects",
		e: "⚒",
		d: "hammer and pick",
		u: "4.1"
	},
	hamster: {
		c: "nature",
		e: "🐹",
		d: "hamster face",
		u: "6.0"
	},
	hand_splayed: {
		c: "people",
		e: "🖐",
		d: "raised hand with fingers splayed",
		u: "7.0"
	},
	hand_splayed_tone1: {
		c: "people",
		e: "🖐🏻",
		d: "raised hand with fingers splayed tone 1",
		u: "8.0"
	},
	hand_splayed_tone2: {
		c: "people",
		e: "🖐🏼",
		d: "raised hand with fingers splayed tone 2",
		u: "8.0"
	},
	hand_splayed_tone3: {
		c: "people",
		e: "🖐🏽",
		d: "raised hand with fingers splayed tone 3",
		u: "8.0"
	},
	hand_splayed_tone4: {
		c: "people",
		e: "🖐🏾",
		d: "raised hand with fingers splayed tone 4",
		u: "8.0"
	},
	hand_splayed_tone5: {
		c: "people",
		e: "🖐🏿",
		d: "raised hand with fingers splayed tone 5",
		u: "8.0"
	},
	handbag: {
		c: "people",
		e: "👜",
		d: "handbag",
		u: "6.0"
	},
	handball: {
		c: "activity",
		e: "🤾",
		d: "handball",
		u: "9.0"
	},
	handball_tone1: {
		c: "activity",
		e: "🤾🏻",
		d: "handball tone 1",
		u: "9.0"
	},
	handball_tone2: {
		c: "activity",
		e: "🤾🏼",
		d: "handball tone 2",
		u: "9.0"
	},
	handball_tone3: {
		c: "activity",
		e: "🤾🏽",
		d: "handball tone 3",
		u: "9.0"
	},
	handball_tone4: {
		c: "activity",
		e: "🤾🏾",
		d: "handball tone 4",
		u: "9.0"
	},
	handball_tone5: {
		c: "activity",
		e: "🤾🏿",
		d: "handball tone 5",
		u: "9.0"
	},
	handshake: {
		c: "people",
		e: "🤝",
		d: "handshake",
		u: "9.0"
	},
	handshake_tone1: {
		c: "people",
		e: "🤝🏻",
		d: "handshake tone 1",
		u: "9.0"
	},
	handshake_tone2: {
		c: "people",
		e: "🤝🏼",
		d: "handshake tone 2",
		u: "9.0"
	},
	handshake_tone3: {
		c: "people",
		e: "🤝🏽",
		d: "handshake tone 3",
		u: "9.0"
	},
	handshake_tone4: {
		c: "people",
		e: "🤝🏾",
		d: "handshake tone 4",
		u: "9.0"
	},
	handshake_tone5: {
		c: "people",
		e: "🤝🏿",
		d: "handshake tone 5",
		u: "9.0"
	},
	hash: {
		c: "symbols",
		e: "#⃣",
		d: "number sign",
		u: "3.0"
	},
	hatched_chick: {
		c: "nature",
		e: "🐥",
		d: "front-facing baby chick",
		u: "6.0"
	},
	hatching_chick: {
		c: "nature",
		e: "🐣",
		d: "hatching chick",
		u: "6.0"
	},
	head_bandage: {
		c: "people",
		e: "🤕",
		d: "face with head-bandage",
		u: "8.0"
	},
	headphones: {
		c: "activity",
		e: "🎧",
		d: "headphone",
		u: "6.0"
	},
	hear_no_evil: {
		c: "nature",
		e: "🙉",
		d: "hear-no-evil monkey",
		u: "6.0"
	},
	heart: {
		c: "symbols",
		e: "❤",
		d: "heavy black heart",
		u: "1.1"
	},
	heart_decoration: {
		c: "symbols",
		e: "💟",
		d: "heart decoration",
		u: "6.0"
	},
	heart_exclamation: {
		c: "symbols",
		e: "❣",
		d: "heavy heart exclamation mark ornament",
		u: "1.1"
	},
	heart_eyes: {
		c: "people",
		e: "😍",
		d: "smiling face with heart-shaped eyes",
		u: "6.0"
	},
	heart_eyes_cat: {
		c: "people",
		e: "😻",
		d: "smiling cat face with heart-shaped eyes",
		u: "6.0"
	},
	heartbeat: {
		c: "symbols",
		e: "💓",
		d: "beating heart",
		u: "6.0"
	},
	heartpulse: {
		c: "symbols",
		e: "💗",
		d: "growing heart",
		u: "6.0"
	},
	hearts: {
		c: "symbols",
		e: "♥",
		d: "black heart suit",
		u: "1.1"
	},
	heavy_check_mark: {
		c: "symbols",
		e: "✔",
		d: "heavy check mark",
		u: "1.1"
	},
	heavy_division_sign: {
		c: "symbols",
		e: "➗",
		d: "heavy division sign",
		u: "6.0"
	},
	heavy_dollar_sign: {
		c: "symbols",
		e: "💲",
		d: "heavy dollar sign",
		u: "6.0"
	},
	heavy_minus_sign: {
		c: "symbols",
		e: "➖",
		d: "heavy minus sign",
		u: "6.0"
	},
	heavy_multiplication_x: {
		c: "symbols",
		e: "✖",
		d: "heavy multiplication x",
		u: "1.1"
	},
	heavy_plus_sign: {
		c: "symbols",
		e: "➕",
		d: "heavy plus sign",
		u: "6.0"
	},
	helicopter: {
		c: "travel",
		e: "🚁",
		d: "helicopter",
		u: "6.0"
	},
	helmet_with_cross: {
		c: "people",
		e: "⛑",
		d: "helmet with white cross",
		u: "5.2"
	},
	herb: {
		c: "nature",
		e: "🌿",
		d: "herb",
		u: "6.0"
	},
	hibiscus: {
		c: "nature",
		e: "🌺",
		d: "hibiscus",
		u: "6.0"
	},
	high_brightness: {
		c: "symbols",
		e: "🔆",
		d: "high brightness symbol",
		u: "6.0"
	},
	high_heel: {
		c: "people",
		e: "👠",
		d: "high-heeled shoe",
		u: "6.0"
	},
	hockey: {
		c: "activity",
		e: "🏒",
		d: "ice hockey stick and puck",
		u: "8.0"
	},
	hole: {
		c: "objects",
		e: "🕳",
		d: "hole",
		u: "7.0"
	},
	homes: {
		c: "travel",
		e: "🏘",
		d: "house buildings",
		u: "7.0"
	},
	honey_pot: {
		c: "food",
		e: "🍯",
		d: "honey pot",
		u: "6.0"
	},
	horse: {
		c: "nature",
		e: "🐴",
		d: "horse face",
		u: "6.0"
	},
	horse_racing: {
		c: "activity",
		e: "🏇",
		d: "horse racing",
		u: "6.0"
	},
	horse_racing_tone1: {
		c: "activity",
		e: "🏇🏻",
		d: "horse racing tone 1",
		u: "8.0"
	},
	horse_racing_tone2: {
		c: "activity",
		e: "🏇🏼",
		d: "horse racing tone 2",
		u: "8.0"
	},
	horse_racing_tone3: {
		c: "activity",
		e: "🏇🏽",
		d: "horse racing tone 3",
		u: "8.0"
	},
	horse_racing_tone4: {
		c: "activity",
		e: "🏇🏾",
		d: "horse racing tone 4",
		u: "8.0"
	},
	horse_racing_tone5: {
		c: "activity",
		e: "🏇🏿",
		d: "horse racing tone 5",
		u: "8.0"
	},
	hospital: {
		c: "travel",
		e: "🏥",
		d: "hospital",
		u: "6.0"
	},
	hot_pepper: {
		c: "food",
		e: "🌶",
		d: "hot pepper",
		u: "7.0"
	},
	hotdog: {
		c: "food",
		e: "🌭",
		d: "hot dog",
		u: "8.0"
	},
	hotel: {
		c: "travel",
		e: "🏨",
		d: "hotel",
		u: "6.0"
	},
	hotsprings: {
		c: "symbols",
		e: "♨",
		d: "hot springs",
		u: "1.1"
	},
	hourglass: {
		c: "objects",
		e: "⌛",
		d: "hourglass",
		u: "1.1"
	},
	hourglass_flowing_sand: {
		c: "objects",
		e: "⏳",
		d: "hourglass with flowing sand",
		u: "6.0"
	},
	house: {
		c: "travel",
		e: "🏠",
		d: "house building",
		u: "6.0"
	},
	house_abandoned: {
		c: "travel",
		e: "🏚",
		d: "derelict house building",
		u: "7.0"
	},
	house_with_garden: {
		c: "travel",
		e: "🏡",
		d: "house with garden",
		u: "6.0"
	},
	hugging: {
		c: "people",
		e: "🤗",
		d: "hugging face",
		u: "8.0"
	},
	hushed: {
		c: "people",
		e: "😯",
		d: "hushed face",
		u: "6.1"
	},
	ice_cream: {
		c: "food",
		e: "🍨",
		d: "ice cream",
		u: "6.0"
	},
	ice_skate: {
		c: "activity",
		e: "⛸",
		d: "ice skate",
		u: "5.2"
	},
	icecream: {
		c: "food",
		e: "🍦",
		d: "soft ice cream",
		u: "6.0"
	},
	id: {
		c: "symbols",
		e: "🆔",
		d: "squared id",
		u: "6.0"
	},
	ideograph_advantage: {
		c: "symbols",
		e: "🉐",
		d: "circled ideograph advantage",
		u: "6.0"
	},
	imp: {
		c: "people",
		e: "👿",
		d: "imp",
		u: "6.0"
	},
	inbox_tray: {
		c: "objects",
		e: "📥",
		d: "inbox tray",
		u: "6.0"
	},
	incoming_envelope: {
		c: "objects",
		e: "📨",
		d: "incoming envelope",
		u: "6.0"
	},
	information_desk_person: {
		c: "people",
		e: "💁",
		d: "information desk person",
		u: "6.0"
	},
	information_desk_person_tone1: {
		c: "people",
		e: "💁🏻",
		d: "information desk person tone 1",
		u: "8.0"
	},
	information_desk_person_tone2: {
		c: "people",
		e: "💁🏼",
		d: "information desk person tone 2",
		u: "8.0"
	},
	information_desk_person_tone3: {
		c: "people",
		e: "💁🏽",
		d: "information desk person tone 3",
		u: "8.0"
	},
	information_desk_person_tone4: {
		c: "people",
		e: "💁🏾",
		d: "information desk person tone 4",
		u: "8.0"
	},
	information_desk_person_tone5: {
		c: "people",
		e: "💁🏿",
		d: "information desk person tone 5",
		u: "8.0"
	},
	information_source: {
		c: "symbols",
		e: "ℹ",
		d: "information source",
		u: "3.0"
	},
	innocent: {
		c: "people",
		e: "😇",
		d: "smiling face with halo",
		u: "6.0"
	},
	interrobang: {
		c: "symbols",
		e: "⁉",
		d: "exclamation question mark",
		u: "3.0"
	},
	iphone: {
		c: "objects",
		e: "📱",
		d: "mobile phone",
		u: "6.0"
	},
	island: {
		c: "travel",
		e: "🏝",
		d: "desert island",
		u: "7.0"
	},
	izakaya_lantern: {
		c: "objects",
		e: "🏮",
		d: "izakaya lantern",
		u: "6.0"
	},
	jack_o_lantern: {
		c: "nature",
		e: "🎃",
		d: "jack-o-lantern",
		u: "6.0"
	},
	japan: {
		c: "travel",
		e: "🗾",
		d: "silhouette of japan",
		u: "6.0"
	},
	japanese_castle: {
		c: "travel",
		e: "🏯",
		d: "japanese castle",
		u: "6.0"
	},
	japanese_goblin: {
		c: "people",
		e: "👺",
		d: "japanese goblin",
		u: "6.0"
	},
	japanese_ogre: {
		c: "people",
		e: "👹",
		d: "japanese ogre",
		u: "6.0"
	},
	jeans: {
		c: "people",
		e: "👖",
		d: "jeans",
		u: "6.0"
	},
	joy: {
		c: "people",
		e: "😂",
		d: "face with tears of joy",
		u: "6.0"
	},
	joy_cat: {
		c: "people",
		e: "😹",
		d: "cat face with tears of joy",
		u: "6.0"
	},
	joystick: {
		c: "objects",
		e: "🕹",
		d: "joystick",
		u: "7.0"
	},
	juggling: {
		c: "activity",
		e: "🤹",
		d: "juggling",
		u: "9.0"
	},
	juggling_tone1: {
		c: "activity",
		e: "🤹🏻",
		d: "juggling tone 1",
		u: "9.0"
	},
	juggling_tone2: {
		c: "activity",
		e: "🤹🏼",
		d: "juggling tone 2",
		u: "9.0"
	},
	juggling_tone3: {
		c: "activity",
		e: "🤹🏽",
		d: "juggling tone 3",
		u: "9.0"
	},
	juggling_tone4: {
		c: "activity",
		e: "🤹🏾",
		d: "juggling tone 4",
		u: "9.0"
	},
	juggling_tone5: {
		c: "activity",
		e: "🤹🏿",
		d: "juggling tone 5",
		u: "9.0"
	},
	kaaba: {
		c: "travel",
		e: "🕋",
		d: "kaaba",
		u: "8.0"
	},
	key: {
		c: "objects",
		e: "🔑",
		d: "key",
		u: "6.0"
	},
	key2: {
		c: "objects",
		e: "🗝",
		d: "old key",
		u: "7.0"
	},
	keyboard: {
		c: "objects",
		e: "⌨",
		d: "keyboard",
		u: "1.1"
	},
	kimono: {
		c: "people",
		e: "👘",
		d: "kimono",
		u: "6.0"
	},
	kiss: {
		c: "people",
		e: "💋",
		d: "kiss mark",
		u: "6.0"
	},
	kiss_mm: {
		c: "people",
		e: "👨‍❤️‍💋‍👨",
		d: "kiss (man,man)",
		u: "6.0"
	},
	kiss_ww: {
		c: "people",
		e: "👩‍❤️‍💋‍👩",
		d: "kiss (woman,woman)",
		u: "6.0"
	},
	kissing: {
		c: "people",
		e: "😗",
		d: "kissing face",
		u: "6.1"
	},
	kissing_cat: {
		c: "people",
		e: "😽",
		d: "kissing cat face with closed eyes",
		u: "6.0"
	},
	kissing_closed_eyes: {
		c: "people",
		e: "😚",
		d: "kissing face with closed eyes",
		u: "6.0"
	},
	kissing_heart: {
		c: "people",
		e: "😘",
		d: "face throwing a kiss",
		u: "6.0"
	},
	kissing_smiling_eyes: {
		c: "people",
		e: "😙",
		d: "kissing face with smiling eyes",
		u: "6.1"
	},
	kiwi: {
		c: "food",
		e: "🥝",
		d: "kiwifruit",
		u: "9.0"
	},
	knife: {
		c: "objects",
		e: "🔪",
		d: "hocho",
		u: "6.0"
	},
	koala: {
		c: "nature",
		e: "🐨",
		d: "koala",
		u: "6.0"
	},
	koko: {
		c: "symbols",
		e: "🈁",
		d: "squared katakana koko",
		u: "6.0"
	},
	label: {
		c: "objects",
		e: "🏷",
		d: "label",
		u: "7.0"
	},
	large_blue_circle: {
		c: "symbols",
		e: "🔵",
		d: "large blue circle",
		u: "6.0"
	},
	large_blue_diamond: {
		c: "symbols",
		e: "🔷",
		d: "large blue diamond",
		u: "6.0"
	},
	large_orange_diamond: {
		c: "symbols",
		e: "🔶",
		d: "large orange diamond",
		u: "6.0"
	},
	last_quarter_moon: {
		c: "nature",
		e: "🌗",
		d: "last quarter moon symbol",
		u: "6.0"
	},
	last_quarter_moon_with_face: {
		c: "nature",
		e: "🌜",
		d: "last quarter moon with face",
		u: "6.0"
	},
	laughing: {
		c: "people",
		e: "😆",
		d: "smiling face with open mouth and tightly-closed ey",
		u: "6.0"
	},
	leaves: {
		c: "nature",
		e: "🍃",
		d: "leaf fluttering in wind",
		u: "6.0"
	},
	ledger: {
		c: "objects",
		e: "📒",
		d: "ledger",
		u: "6.0"
	},
	left_facing_fist: {
		c: "people",
		e: "🤛",
		d: "left-facing fist",
		u: "9.0"
	},
	left_facing_fist_tone1: {
		c: "people",
		e: "🤛🏻",
		d: "left facing fist tone 1",
		u: "9.0"
	},
	left_facing_fist_tone2: {
		c: "people",
		e: "🤛🏼",
		d: "left facing fist tone 2",
		u: "9.0"
	},
	left_facing_fist_tone3: {
		c: "people",
		e: "🤛🏽",
		d: "left facing fist tone 3",
		u: "9.0"
	},
	left_facing_fist_tone4: {
		c: "people",
		e: "🤛🏾",
		d: "left facing fist tone 4",
		u: "9.0"
	},
	left_facing_fist_tone5: {
		c: "people",
		e: "🤛🏿",
		d: "left facing fist tone 5",
		u: "9.0"
	},
	left_luggage: {
		c: "symbols",
		e: "🛅",
		d: "left luggage",
		u: "6.0"
	},
	left_right_arrow: {
		c: "symbols",
		e: "↔",
		d: "left right arrow",
		u: "1.1"
	},
	leftwards_arrow_with_hook: {
		c: "symbols",
		e: "↩",
		d: "leftwards arrow with hook",
		u: "1.1"
	},
	lemon: {
		c: "food",
		e: "🍋",
		d: "lemon",
		u: "6.0"
	},
	leo: {
		c: "symbols",
		e: "♌",
		d: "leo",
		u: "1.1"
	},
	leopard: {
		c: "nature",
		e: "🐆",
		d: "leopard",
		u: "6.0"
	},
	level_slider: {
		c: "objects",
		e: "🎚",
		d: "level slider",
		u: "7.0"
	},
	levitate: {
		c: "activity",
		e: "🕴",
		d: "man in business suit levitating",
		u: "7.0"
	},
	libra: {
		c: "symbols",
		e: "♎",
		d: "libra",
		u: "1.1"
	},
	lifter: {
		c: "activity",
		e: "🏋",
		d: "weight lifter",
		u: "7.0"
	},
	lifter_tone1: {
		c: "activity",
		e: "🏋🏻",
		d: "weight lifter tone 1",
		u: "8.0"
	},
	lifter_tone2: {
		c: "activity",
		e: "🏋🏼",
		d: "weight lifter tone 2",
		u: "8.0"
	},
	lifter_tone3: {
		c: "activity",
		e: "🏋🏽",
		d: "weight lifter tone 3",
		u: "8.0"
	},
	lifter_tone4: {
		c: "activity",
		e: "🏋🏾",
		d: "weight lifter tone 4",
		u: "8.0"
	},
	lifter_tone5: {
		c: "activity",
		e: "🏋🏿",
		d: "weight lifter tone 5",
		u: "8.0"
	},
	light_rail: {
		c: "travel",
		e: "🚈",
		d: "light rail",
		u: "6.0"
	},
	link: {
		c: "objects",
		e: "🔗",
		d: "link symbol",
		u: "6.0"
	},
	lion_face: {
		c: "nature",
		e: "🦁",
		d: "lion face",
		u: "8.0"
	},
	lips: {
		c: "people",
		e: "👄",
		d: "mouth",
		u: "6.0"
	},
	lipstick: {
		c: "people",
		e: "💄",
		d: "lipstick",
		u: "6.0"
	},
	lizard: {
		c: "nature",
		e: "🦎",
		d: "lizard",
		u: "9.0"
	},
	lock: {
		c: "objects",
		e: "🔒",
		d: "lock",
		u: "6.0"
	},
	lock_with_ink_pen: {
		c: "objects",
		e: "🔏",
		d: "lock with ink pen",
		u: "6.0"
	},
	lollipop: {
		c: "food",
		e: "🍭",
		d: "lollipop",
		u: "6.0"
	},
	loop: {
		c: "symbols",
		e: "➿",
		d: "double curly loop",
		u: "6.0"
	},
	loud_sound: {
		c: "symbols",
		e: "🔊",
		d: "speaker with three sound waves",
		u: "6.0"
	},
	loudspeaker: {
		c: "symbols",
		e: "📢",
		d: "public address loudspeaker",
		u: "6.0"
	},
	love_hotel: {
		c: "travel",
		e: "🏩",
		d: "love hotel",
		u: "6.0"
	},
	love_letter: {
		c: "objects",
		e: "💌",
		d: "love letter",
		u: "6.0"
	},
	low_brightness: {
		c: "symbols",
		e: "🔅",
		d: "low brightness symbol",
		u: "6.0"
	},
	lying_face: {
		c: "people",
		e: "🤥",
		d: "lying face",
		u: "9.0"
	},
	m: {
		c: "symbols",
		e: "Ⓜ",
		d: "circled latin capital letter m",
		u: "1.1"
	},
	mag: {
		c: "objects",
		e: "🔍",
		d: "left-pointing magnifying glass",
		u: "6.0"
	},
	mag_right: {
		c: "objects",
		e: "🔎",
		d: "right-pointing magnifying glass",
		u: "6.0"
	},
	mahjong: {
		c: "symbols",
		e: "🀄",
		d: "mahjong tile red dragon",
		u: "5.1"
	},
	mailbox: {
		c: "objects",
		e: "📫",
		d: "closed mailbox with raised flag",
		u: "6.0"
	},
	mailbox_closed: {
		c: "objects",
		e: "📪",
		d: "closed mailbox with lowered flag",
		u: "6.0"
	},
	mailbox_with_mail: {
		c: "objects",
		e: "📬",
		d: "open mailbox with raised flag",
		u: "6.0"
	},
	mailbox_with_no_mail: {
		c: "objects",
		e: "📭",
		d: "open mailbox with lowered flag",
		u: "6.0"
	},
	man: {
		c: "people",
		e: "👨",
		d: "man",
		u: "6.0"
	},
	man_dancing: {
		c: "people",
		e: "🕺",
		d: "man dancing",
		u: "9.0"
	},
	man_dancing_tone1: {
		c: "activity",
		e: "🕺🏻",
		d: "man dancing tone 1",
		u: "9.0"
	},
	man_dancing_tone2: {
		c: "activity",
		e: "🕺🏼",
		d: "man dancing tone 2",
		u: "9.0"
	},
	man_dancing_tone3: {
		c: "activity",
		e: "🕺🏽",
		d: "man dancing tone 3",
		u: "9.0"
	},
	man_dancing_tone4: {
		c: "activity",
		e: "🕺🏾",
		d: "man dancing tone 4",
		u: "9.0"
	},
	man_dancing_tone5: {
		c: "activity",
		e: "🕺🏿",
		d: "man dancing tone 5",
		u: "9.0"
	},
	man_in_tuxedo: {
		c: "people",
		e: "🤵",
		d: "man in tuxedo",
		u: "9.0"
	},
	man_in_tuxedo_tone1: {
		c: "people",
		e: "🤵🏻",
		d: "man in tuxedo tone 1",
		u: "9.0"
	},
	man_in_tuxedo_tone2: {
		c: "people",
		e: "🤵🏼",
		d: "man in tuxedo tone 2",
		u: "9.0"
	},
	man_in_tuxedo_tone3: {
		c: "people",
		e: "🤵🏽",
		d: "man in tuxedo tone 3",
		u: "9.0"
	},
	man_in_tuxedo_tone4: {
		c: "people",
		e: "🤵🏾",
		d: "man in tuxedo tone 4",
		u: "9.0"
	},
	man_in_tuxedo_tone5: {
		c: "people",
		e: "🤵🏿",
		d: "man in tuxedo tone 5",
		u: "9.0"
	},
	man_tone1: {
		c: "people",
		e: "👨🏻",
		d: "man tone 1",
		u: "8.0"
	},
	man_tone2: {
		c: "people",
		e: "👨🏼",
		d: "man tone 2",
		u: "8.0"
	},
	man_tone3: {
		c: "people",
		e: "👨🏽",
		d: "man tone 3",
		u: "8.0"
	},
	man_tone4: {
		c: "people",
		e: "👨🏾",
		d: "man tone 4",
		u: "8.0"
	},
	man_tone5: {
		c: "people",
		e: "👨🏿",
		d: "man tone 5",
		u: "8.0"
	},
	man_with_gua_pi_mao: {
		c: "people",
		e: "👲",
		d: "man with gua pi mao",
		u: "6.0"
	},
	man_with_gua_pi_mao_tone1: {
		c: "people",
		e: "👲🏻",
		d: "man with gua pi mao tone 1",
		u: "8.0"
	},
	man_with_gua_pi_mao_tone2: {
		c: "people",
		e: "👲🏼",
		d: "man with gua pi mao tone 2",
		u: "8.0"
	},
	man_with_gua_pi_mao_tone3: {
		c: "people",
		e: "👲🏽",
		d: "man with gua pi mao tone 3",
		u: "8.0"
	},
	man_with_gua_pi_mao_tone4: {
		c: "people",
		e: "👲🏾",
		d: "man with gua pi mao tone 4",
		u: "8.0"
	},
	man_with_gua_pi_mao_tone5: {
		c: "people",
		e: "👲🏿",
		d: "man with gua pi mao tone 5",
		u: "8.0"
	},
	man_with_turban: {
		c: "people",
		e: "👳",
		d: "man with turban",
		u: "6.0"
	},
	man_with_turban_tone1: {
		c: "people",
		e: "👳🏻",
		d: "man with turban tone 1",
		u: "8.0"
	},
	man_with_turban_tone2: {
		c: "people",
		e: "👳🏼",
		d: "man with turban tone 2",
		u: "8.0"
	},
	man_with_turban_tone3: {
		c: "people",
		e: "👳🏽",
		d: "man with turban tone 3",
		u: "8.0"
	},
	man_with_turban_tone4: {
		c: "people",
		e: "👳🏾",
		d: "man with turban tone 4",
		u: "8.0"
	},
	man_with_turban_tone5: {
		c: "people",
		e: "👳🏿",
		d: "man with turban tone 5",
		u: "8.0"
	},
	mans_shoe: {
		c: "people",
		e: "👞",
		d: "mans shoe",
		u: "6.0"
	},
	map: {
		c: "objects",
		e: "🗺",
		d: "world map",
		u: "7.0"
	},
	maple_leaf: {
		c: "nature",
		e: "🍁",
		d: "maple leaf",
		u: "6.0"
	},
	martial_arts_uniform: {
		c: "activity",
		e: "🥋",
		d: "martial arts uniform",
		u: "9.0"
	},
	mask: {
		c: "people",
		e: "😷",
		d: "face with medical mask",
		u: "6.0"
	},
	massage: {
		c: "people",
		e: "💆",
		d: "face massage",
		u: "6.0"
	},
	massage_tone1: {
		c: "people",
		e: "💆🏻",
		d: "face massage tone 1",
		u: "8.0"
	},
	massage_tone2: {
		c: "people",
		e: "💆🏼",
		d: "face massage tone 2",
		u: "8.0"
	},
	massage_tone3: {
		c: "people",
		e: "💆🏽",
		d: "face massage tone 3",
		u: "8.0"
	},
	massage_tone4: {
		c: "people",
		e: "💆🏾",
		d: "face massage tone 4",
		u: "8.0"
	},
	massage_tone5: {
		c: "people",
		e: "💆🏿",
		d: "face massage tone 5",
		u: "8.0"
	},
	meat_on_bone: {
		c: "food",
		e: "🍖",
		d: "meat on bone",
		u: "6.0"
	},
	medal: {
		c: "activity",
		e: "🏅",
		d: "sports medal",
		u: "7.0"
	},
	mega: {
		c: "symbols",
		e: "📣",
		d: "cheering megaphone",
		u: "6.0"
	},
	melon: {
		c: "food",
		e: "🍈",
		d: "melon",
		u: "6.0"
	},
	menorah: {
		c: "symbols",
		e: "🕎",
		d: "menorah with nine branches",
		u: "8.0"
	},
	mens: {
		c: "symbols",
		e: "🚹",
		d: "mens symbol",
		u: "6.0"
	},
	metal: {
		c: "people",
		e: "🤘",
		d: "sign of the horns",
		u: "8.0"
	},
	metal_tone1: {
		c: "people",
		e: "🤘🏻",
		d: "sign of the horns tone 1",
		u: "8.0"
	},
	metal_tone2: {
		c: "people",
		e: "🤘🏼",
		d: "sign of the horns tone 2",
		u: "8.0"
	},
	metal_tone3: {
		c: "people",
		e: "🤘🏽",
		d: "sign of the horns tone 3",
		u: "8.0"
	},
	metal_tone4: {
		c: "people",
		e: "🤘🏾",
		d: "sign of the horns tone 4",
		u: "8.0"
	},
	metal_tone5: {
		c: "people",
		e: "🤘🏿",
		d: "sign of the horns tone 5",
		u: "8.0"
	},
	metro: {
		c: "travel",
		e: "🚇",
		d: "metro",
		u: "6.0"
	},
	microphone: {
		c: "activity",
		e: "🎤",
		d: "microphone",
		u: "6.0"
	},
	microphone2: {
		c: "objects",
		e: "🎙",
		d: "studio microphone",
		u: "7.0"
	},
	microscope: {
		c: "objects",
		e: "🔬",
		d: "microscope",
		u: "6.0"
	},
	middle_finger: {
		c: "people",
		e: "🖕",
		d: "reversed hand with middle finger extended",
		u: "7.0"
	},
	middle_finger_tone1: {
		c: "people",
		e: "🖕🏻",
		d: "reversed hand with middle finger extended tone 1",
		u: "8.0"
	},
	middle_finger_tone2: {
		c: "people",
		e: "🖕🏼",
		d: "reversed hand with middle finger extended tone 2",
		u: "8.0"
	},
	middle_finger_tone3: {
		c: "people",
		e: "🖕🏽",
		d: "reversed hand with middle finger extended tone 3",
		u: "8.0"
	},
	middle_finger_tone4: {
		c: "people",
		e: "🖕🏾",
		d: "reversed hand with middle finger extended tone 4",
		u: "8.0"
	},
	middle_finger_tone5: {
		c: "people",
		e: "🖕🏿",
		d: "reversed hand with middle finger extended tone 5",
		u: "8.0"
	},
	military_medal: {
		c: "activity",
		e: "🎖",
		d: "military medal",
		u: "7.0"
	},
	milk: {
		c: "food",
		e: "🥛",
		d: "glass of milk",
		u: "9.0"
	},
	milky_way: {
		c: "travel",
		e: "🌌",
		d: "milky way",
		u: "6.0"
	},
	minibus: {
		c: "travel",
		e: "🚐",
		d: "minibus",
		u: "6.0"
	},
	minidisc: {
		c: "objects",
		e: "💽",
		d: "minidisc",
		u: "6.0"
	},
	mobile_phone_off: {
		c: "symbols",
		e: "📴",
		d: "mobile phone off",
		u: "6.0"
	},
	money_mouth: {
		c: "people",
		e: "🤑",
		d: "money-mouth face",
		u: "8.0"
	},
	money_with_wings: {
		c: "objects",
		e: "💸",
		d: "money with wings",
		u: "6.0"
	},
	moneybag: {
		c: "objects",
		e: "💰",
		d: "money bag",
		u: "6.0"
	},
	monkey: {
		c: "nature",
		e: "🐒",
		d: "monkey",
		u: "6.0"
	},
	monkey_face: {
		c: "nature",
		e: "🐵",
		d: "monkey face",
		u: "6.0"
	},
	monorail: {
		c: "travel",
		e: "🚝",
		d: "monorail",
		u: "6.0"
	},
	mortar_board: {
		c: "people",
		e: "🎓",
		d: "graduation cap",
		u: "6.0"
	},
	mosque: {
		c: "travel",
		e: "🕌",
		d: "mosque",
		u: "8.0"
	},
	motor_scooter: {
		c: "travel",
		e: "🛵",
		d: "motor scooter",
		u: "9.0"
	},
	motorboat: {
		c: "travel",
		e: "🛥",
		d: "motorboat",
		u: "7.0"
	},
	motorcycle: {
		c: "travel",
		e: "🏍",
		d: "racing motorcycle",
		u: "7.0"
	},
	motorway: {
		c: "travel",
		e: "🛣",
		d: "motorway",
		u: "7.0"
	},
	mount_fuji: {
		c: "travel",
		e: "🗻",
		d: "mount fuji",
		u: "6.0"
	},
	mountain: {
		c: "travel",
		e: "⛰",
		d: "mountain",
		u: "5.2"
	},
	mountain_bicyclist: {
		c: "activity",
		e: "🚵",
		d: "mountain bicyclist",
		u: "6.0"
	},
	mountain_bicyclist_tone1: {
		c: "activity",
		e: "🚵🏻",
		d: "mountain bicyclist tone 1",
		u: "8.0"
	},
	mountain_bicyclist_tone2: {
		c: "activity",
		e: "🚵🏼",
		d: "mountain bicyclist tone 2",
		u: "8.0"
	},
	mountain_bicyclist_tone3: {
		c: "activity",
		e: "🚵🏽",
		d: "mountain bicyclist tone 3",
		u: "8.0"
	},
	mountain_bicyclist_tone4: {
		c: "activity",
		e: "🚵🏾",
		d: "mountain bicyclist tone 4",
		u: "8.0"
	},
	mountain_bicyclist_tone5: {
		c: "activity",
		e: "🚵🏿",
		d: "mountain bicyclist tone 5",
		u: "8.0"
	},
	mountain_cableway: {
		c: "travel",
		e: "🚠",
		d: "mountain cableway",
		u: "6.0"
	},
	mountain_railway: {
		c: "travel",
		e: "🚞",
		d: "mountain railway",
		u: "6.0"
	},
	mountain_snow: {
		c: "travel",
		e: "🏔",
		d: "snow capped mountain",
		u: "7.0"
	},
	mouse: {
		c: "nature",
		e: "🐭",
		d: "mouse face",
		u: "6.0"
	},
	mouse2: {
		c: "nature",
		e: "🐁",
		d: "mouse",
		u: "6.0"
	},
	mouse_three_button: {
		c: "objects",
		e: "🖱",
		d: "three button mouse",
		u: "7.0"
	},
	movie_camera: {
		c: "objects",
		e: "🎥",
		d: "movie camera",
		u: "6.0"
	},
	moyai: {
		c: "objects",
		e: "🗿",
		d: "moyai",
		u: "6.0"
	},
	mrs_claus: {
		c: "people",
		e: "🤶",
		d: "mother christmas",
		u: "9.0"
	},
	mrs_claus_tone1: {
		c: "people",
		e: "🤶🏻",
		d: "mother christmas tone 1",
		u: "9.0"
	},
	mrs_claus_tone2: {
		c: "people",
		e: "🤶🏼",
		d: "mother christmas tone 2",
		u: "9.0"
	},
	mrs_claus_tone3: {
		c: "people",
		e: "🤶🏽",
		d: "mother christmas tone 3",
		u: "9.0"
	},
	mrs_claus_tone4: {
		c: "people",
		e: "🤶🏾",
		d: "mother christmas tone 4",
		u: "9.0"
	},
	mrs_claus_tone5: {
		c: "people",
		e: "🤶🏿",
		d: "mother christmas tone 5",
		u: "9.0"
	},
	muscle: {
		c: "people",
		e: "💪",
		d: "flexed biceps",
		u: "6.0"
	},
	muscle_tone1: {
		c: "people",
		e: "💪🏻",
		d: "flexed biceps tone 1",
		u: "8.0"
	},
	muscle_tone2: {
		c: "people",
		e: "💪🏼",
		d: "flexed biceps tone 2",
		u: "8.0"
	},
	muscle_tone3: {
		c: "people",
		e: "💪🏽",
		d: "flexed biceps tone 3",
		u: "8.0"
	},
	muscle_tone4: {
		c: "people",
		e: "💪🏾",
		d: "flexed biceps tone 4",
		u: "8.0"
	},
	muscle_tone5: {
		c: "people",
		e: "💪🏿",
		d: "flexed biceps tone 5",
		u: "8.0"
	},
	mushroom: {
		c: "nature",
		e: "🍄",
		d: "mushroom",
		u: "6.0"
	},
	musical_keyboard: {
		c: "activity",
		e: "🎹",
		d: "musical keyboard",
		u: "6.0"
	},
	musical_note: {
		c: "symbols",
		e: "🎵",
		d: "musical note",
		u: "6.0"
	},
	musical_score: {
		c: "activity",
		e: "🎼",
		d: "musical score",
		u: "6.0"
	},
	mute: {
		c: "symbols",
		e: "🔇",
		d: "speaker with cancellation stroke",
		u: "6.0"
	},
	nail_care: {
		c: "people",
		e: "💅",
		d: "nail polish",
		u: "6.0"
	},
	nail_care_tone1: {
		c: "people",
		e: "💅🏻",
		d: "nail polish tone 1",
		u: "8.0"
	},
	nail_care_tone2: {
		c: "people",
		e: "💅🏼",
		d: "nail polish tone 2",
		u: "8.0"
	},
	nail_care_tone3: {
		c: "people",
		e: "💅🏽",
		d: "nail polish tone 3",
		u: "8.0"
	},
	nail_care_tone4: {
		c: "people",
		e: "💅🏾",
		d: "nail polish tone 4",
		u: "8.0"
	},
	nail_care_tone5: {
		c: "people",
		e: "💅🏿",
		d: "nail polish tone 5",
		u: "8.0"
	},
	name_badge: {
		c: "symbols",
		e: "📛",
		d: "name badge",
		u: "6.0"
	},
	nauseated_face: {
		c: "people",
		e: "🤢",
		d: "nauseated face",
		u: "9.0"
	},
	necktie: {
		c: "people",
		e: "👔",
		d: "necktie",
		u: "6.0"
	},
	negative_squared_cross_mark: {
		c: "symbols",
		e: "❎",
		d: "negative squared cross mark",
		u: "6.0"
	},
	nerd: {
		c: "people",
		e: "🤓",
		d: "nerd face",
		u: "8.0"
	},
	neutral_face: {
		c: "people",
		e: "😐",
		d: "neutral face",
		u: "6.0"
	},
	new: {
		c: "symbols",
		e: "🆕",
		d: "squared new",
		u: "6.0"
	},
	new_moon: {
		c: "nature",
		e: "🌑",
		d: "new moon symbol",
		u: "6.0"
	},
	new_moon_with_face: {
		c: "nature",
		e: "🌚",
		d: "new moon with face",
		u: "6.0"
	},
	newspaper: {
		c: "objects",
		e: "📰",
		d: "newspaper",
		u: "6.0"
	},
	newspaper2: {
		c: "objects",
		e: "🗞",
		d: "rolled-up newspaper",
		u: "7.0"
	},
	ng: {
		c: "symbols",
		e: "🆖",
		d: "squared ng",
		u: "6.0"
	},
	night_with_stars: {
		c: "travel",
		e: "🌃",
		d: "night with stars",
		u: "6.0"
	},
	nine: {
		c: "symbols",
		e: "9️⃣",
		d: "keycap digit nine",
		u: "3.0"
	},
	no_bell: {
		c: "symbols",
		e: "🔕",
		d: "bell with cancellation stroke",
		u: "6.0"
	},
	no_bicycles: {
		c: "symbols",
		e: "🚳",
		d: "no bicycles",
		u: "6.0"
	},
	no_entry: {
		c: "symbols",
		e: "⛔",
		d: "no entry",
		u: "5.2"
	},
	no_entry_sign: {
		c: "symbols",
		e: "🚫",
		d: "no entry sign",
		u: "6.0"
	},
	no_good: {
		c: "people",
		e: "🙅",
		d: "face with no good gesture",
		u: "6.0"
	},
	no_good_tone1: {
		c: "people",
		e: "🙅🏻",
		d: "face with no good gesture tone 1",
		u: "8.0"
	},
	no_good_tone2: {
		c: "people",
		e: "🙅🏼",
		d: "face with no good gesture tone 2",
		u: "8.0"
	},
	no_good_tone3: {
		c: "people",
		e: "🙅🏽",
		d: "face with no good gesture tone 3",
		u: "8.0"
	},
	no_good_tone4: {
		c: "people",
		e: "🙅🏾",
		d: "face with no good gesture tone 4",
		u: "8.0"
	},
	no_good_tone5: {
		c: "people",
		e: "🙅🏿",
		d: "face with no good gesture tone 5",
		u: "8.0"
	},
	no_mobile_phones: {
		c: "symbols",
		e: "📵",
		d: "no mobile phones",
		u: "6.0"
	},
	no_mouth: {
		c: "people",
		e: "😶",
		d: "face without mouth",
		u: "6.0"
	},
	no_pedestrians: {
		c: "symbols",
		e: "🚷",
		d: "no pedestrians",
		u: "6.0"
	},
	no_smoking: {
		c: "symbols",
		e: "🚭",
		d: "no smoking symbol",
		u: "6.0"
	},
	"non-potable_water": {
		c: "symbols",
		e: "🚱",
		d: "non-potable water symbol",
		u: "6.0"
	},
	nose: {
		c: "people",
		e: "👃",
		d: "nose",
		u: "6.0"
	},
	nose_tone1: {
		c: "people",
		e: "👃🏻",
		d: "nose tone 1",
		u: "8.0"
	},
	nose_tone2: {
		c: "people",
		e: "👃🏼",
		d: "nose tone 2",
		u: "8.0"
	},
	nose_tone3: {
		c: "people",
		e: "👃🏽",
		d: "nose tone 3",
		u: "8.0"
	},
	nose_tone4: {
		c: "people",
		e: "👃🏾",
		d: "nose tone 4",
		u: "8.0"
	},
	nose_tone5: {
		c: "people",
		e: "👃🏿",
		d: "nose tone 5",
		u: "8.0"
	},
	notebook: {
		c: "objects",
		e: "📓",
		d: "notebook",
		u: "6.0"
	},
	notebook_with_decorative_cover: {
		c: "objects",
		e: "📔",
		d: "notebook with decorative cover",
		u: "6.0"
	},
	notepad_spiral: {
		c: "objects",
		e: "🗒",
		d: "spiral note pad",
		u: "7.0"
	},
	notes: {
		c: "symbols",
		e: "🎶",
		d: "multiple musical notes",
		u: "6.0"
	},
	nut_and_bolt: {
		c: "objects",
		e: "🔩",
		d: "nut and bolt",
		u: "6.0"
	},
	o: {
		c: "symbols",
		e: "⭕",
		d: "heavy large circle",
		u: "5.2"
	},
	o2: {
		c: "symbols",
		e: "🅾",
		d: "negative squared latin capital letter o",
		u: "6.0"
	},
	ocean: {
		c: "nature",
		e: "🌊",
		d: "water wave",
		u: "6.0"
	},
	octagonal_sign: {
		c: "symbols",
		e: "🛑",
		d: "octagonal sign",
		u: "9.0"
	},
	octopus: {
		c: "nature",
		e: "🐙",
		d: "octopus",
		u: "6.0"
	},
	oden: {
		c: "food",
		e: "🍢",
		d: "oden",
		u: "6.0"
	},
	office: {
		c: "travel",
		e: "🏢",
		d: "office building",
		u: "6.0"
	},
	oil: {
		c: "objects",
		e: "🛢",
		d: "oil drum",
		u: "7.0"
	},
	ok: {
		c: "symbols",
		e: "🆗",
		d: "squared ok",
		u: "6.0"
	},
	ok_hand: {
		c: "people",
		e: "👌",
		d: "ok hand sign",
		u: "6.0"
	},
	ok_hand_tone1: {
		c: "people",
		e: "👌🏻",
		d: "ok hand sign tone 1",
		u: "8.0"
	},
	ok_hand_tone2: {
		c: "people",
		e: "👌🏼",
		d: "ok hand sign tone 2",
		u: "8.0"
	},
	ok_hand_tone3: {
		c: "people",
		e: "👌🏽",
		d: "ok hand sign tone 3",
		u: "8.0"
	},
	ok_hand_tone4: {
		c: "people",
		e: "👌🏾",
		d: "ok hand sign tone 4",
		u: "8.0"
	},
	ok_hand_tone5: {
		c: "people",
		e: "👌🏿",
		d: "ok hand sign tone 5",
		u: "8.0"
	},
	ok_woman: {
		c: "people",
		e: "🙆",
		d: "face with ok gesture",
		u: "6.0"
	},
	ok_woman_tone1: {
		c: "people",
		e: "🙆🏻",
		d: "face with ok gesture tone1",
		u: "8.0"
	},
	ok_woman_tone2: {
		c: "people",
		e: "🙆🏼",
		d: "face with ok gesture tone2",
		u: "8.0"
	},
	ok_woman_tone3: {
		c: "people",
		e: "🙆🏽",
		d: "face with ok gesture tone3",
		u: "8.0"
	},
	ok_woman_tone4: {
		c: "people",
		e: "🙆🏾",
		d: "face with ok gesture tone4",
		u: "8.0"
	},
	ok_woman_tone5: {
		c: "people",
		e: "🙆🏿",
		d: "face with ok gesture tone5",
		u: "8.0"
	},
	older_man: {
		c: "people",
		e: "👴",
		d: "older man",
		u: "6.0"
	},
	older_man_tone1: {
		c: "people",
		e: "👴🏻",
		d: "older man tone 1",
		u: "8.0"
	},
	older_man_tone2: {
		c: "people",
		e: "👴🏼",
		d: "older man tone 2",
		u: "8.0"
	},
	older_man_tone3: {
		c: "people",
		e: "👴🏽",
		d: "older man tone 3",
		u: "8.0"
	},
	older_man_tone4: {
		c: "people",
		e: "👴🏾",
		d: "older man tone 4",
		u: "8.0"
	},
	older_man_tone5: {
		c: "people",
		e: "👴🏿",
		d: "older man tone 5",
		u: "8.0"
	},
	older_woman: {
		c: "people",
		e: "👵",
		d: "older woman",
		u: "6.0"
	},
	older_woman_tone1: {
		c: "people",
		e: "👵🏻",
		d: "older woman tone 1",
		u: "8.0"
	},
	older_woman_tone2: {
		c: "people",
		e: "👵🏼",
		d: "older woman tone 2",
		u: "8.0"
	},
	older_woman_tone3: {
		c: "people",
		e: "👵🏽",
		d: "older woman tone 3",
		u: "8.0"
	},
	older_woman_tone4: {
		c: "people",
		e: "👵🏾",
		d: "older woman tone 4",
		u: "8.0"
	},
	older_woman_tone5: {
		c: "people",
		e: "👵🏿",
		d: "older woman tone 5",
		u: "8.0"
	},
	om_symbol: {
		c: "symbols",
		e: "🕉",
		d: "om symbol",
		u: "7.0"
	},
	on: {
		c: "symbols",
		e: "🔛",
		d: "on with exclamation mark with left right arrow abo",
		u: "6.0"
	},
	oncoming_automobile: {
		c: "travel",
		e: "🚘",
		d: "oncoming automobile",
		u: "6.0"
	},
	oncoming_bus: {
		c: "travel",
		e: "🚍",
		d: "oncoming bus",
		u: "6.0"
	},
	oncoming_police_car: {
		c: "travel",
		e: "🚔",
		d: "oncoming police car",
		u: "6.0"
	},
	oncoming_taxi: {
		c: "travel",
		e: "🚖",
		d: "oncoming taxi",
		u: "6.0"
	},
	one: {
		c: "symbols",
		e: "1️⃣",
		d: "keycap digit one",
		u: "3.0"
	},
	open_file_folder: {
		c: "objects",
		e: "📂",
		d: "open file folder",
		u: "6.0"
	},
	open_hands: {
		c: "people",
		e: "👐",
		d: "open hands sign",
		u: "6.0"
	},
	open_hands_tone1: {
		c: "people",
		e: "👐🏻",
		d: "open hands sign tone 1",
		u: "8.0"
	},
	open_hands_tone2: {
		c: "people",
		e: "👐🏼",
		d: "open hands sign tone 2",
		u: "8.0"
	},
	open_hands_tone3: {
		c: "people",
		e: "👐🏽",
		d: "open hands sign tone 3",
		u: "8.0"
	},
	open_hands_tone4: {
		c: "people",
		e: "👐🏾",
		d: "open hands sign tone 4",
		u: "8.0"
	},
	open_hands_tone5: {
		c: "people",
		e: "👐🏿",
		d: "open hands sign tone 5",
		u: "8.0"
	},
	open_mouth: {
		c: "people",
		e: "😮",
		d: "face with open mouth",
		u: "6.1"
	},
	ophiuchus: {
		c: "symbols",
		e: "⛎",
		d: "ophiuchus",
		u: "6.0"
	},
	orange_book: {
		c: "objects",
		e: "📙",
		d: "orange book",
		u: "6.0"
	},
	orthodox_cross: {
		c: "symbols",
		e: "☦",
		d: "orthodox cross",
		u: "1.1"
	},
	outbox_tray: {
		c: "objects",
		e: "📤",
		d: "outbox tray",
		u: "6.0"
	},
	owl: {
		c: "nature",
		e: "🦉",
		d: "owl",
		u: "9.0"
	},
	ox: {
		c: "nature",
		e: "🐂",
		d: "ox",
		u: "6.0"
	},
	package: {
		c: "objects",
		e: "📦",
		d: "package",
		u: "6.0"
	},
	page_facing_up: {
		c: "objects",
		e: "📄",
		d: "page facing up",
		u: "6.0"
	},
	page_with_curl: {
		c: "objects",
		e: "📃",
		d: "page with curl",
		u: "6.0"
	},
	pager: {
		c: "objects",
		e: "📟",
		d: "pager",
		u: "6.0"
	},
	paintbrush: {
		c: "objects",
		e: "🖌",
		d: "lower left paintbrush",
		u: "7.0"
	},
	palm_tree: {
		c: "nature",
		e: "🌴",
		d: "palm tree",
		u: "6.0"
	},
	pancakes: {
		c: "food",
		e: "🥞",
		d: "pancakes",
		u: "9.0"
	},
	panda_face: {
		c: "nature",
		e: "🐼",
		d: "panda face",
		u: "6.0"
	},
	paperclip: {
		c: "objects",
		e: "📎",
		d: "paperclip",
		u: "6.0"
	},
	paperclips: {
		c: "objects",
		e: "🖇",
		d: "linked paperclips",
		u: "7.0"
	},
	park: {
		c: "travel",
		e: "🏞",
		d: "national park",
		u: "7.0"
	},
	parking: {
		c: "symbols",
		e: "🅿",
		d: "negative squared latin capital letter p",
		u: "5.2"
	},
	part_alternation_mark: {
		c: "symbols",
		e: "〽",
		d: "part alternation mark",
		u: "3.2"
	},
	partly_sunny: {
		c: "nature",
		e: "⛅",
		d: "sun behind cloud",
		u: "5.2"
	},
	passport_control: {
		c: "symbols",
		e: "🛂",
		d: "passport control",
		u: "6.0"
	},
	pause_button: {
		c: "symbols",
		e: "⏸",
		d: "double vertical bar",
		u: "7.0"
	},
	peace: {
		c: "symbols",
		e: "☮",
		d: "peace symbol",
		u: "1.1"
	},
	peach: {
		c: "food",
		e: "🍑",
		d: "peach",
		u: "6.0"
	},
	peanuts: {
		c: "food",
		e: "🥜",
		d: "peanuts",
		u: "9.0"
	},
	pear: {
		c: "food",
		e: "🍐",
		d: "pear",
		u: "6.0"
	},
	pen_ballpoint: {
		c: "objects",
		e: "🖊",
		d: "lower left ballpoint pen",
		u: "7.0"
	},
	pen_fountain: {
		c: "objects",
		e: "🖋",
		d: "lower left fountain pen",
		u: "7.0"
	},
	pencil: {
		c: "objects",
		e: "📝",
		d: "memo",
		u: "6.0"
	},
	pencil2: {
		c: "objects",
		e: "✏",
		d: "pencil",
		u: "1.1"
	},
	penguin: {
		c: "nature",
		e: "🐧",
		d: "penguin",
		u: "6.0"
	},
	pensive: {
		c: "people",
		e: "😔",
		d: "pensive face",
		u: "6.0"
	},
	performing_arts: {
		c: "activity",
		e: "🎭",
		d: "performing arts",
		u: "6.0"
	},
	persevere: {
		c: "people",
		e: "😣",
		d: "persevering face",
		u: "6.0"
	},
	person_frowning: {
		c: "people",
		e: "🙍",
		d: "person frowning",
		u: "6.0"
	},
	person_frowning_tone1: {
		c: "people",
		e: "🙍🏻",
		d: "person frowning tone 1",
		u: "8.0"
	},
	person_frowning_tone2: {
		c: "people",
		e: "🙍🏼",
		d: "person frowning tone 2",
		u: "8.0"
	},
	person_frowning_tone3: {
		c: "people",
		e: "🙍🏽",
		d: "person frowning tone 3",
		u: "8.0"
	},
	person_frowning_tone4: {
		c: "people",
		e: "🙍🏾",
		d: "person frowning tone 4",
		u: "8.0"
	},
	person_frowning_tone5: {
		c: "people",
		e: "🙍🏿",
		d: "person frowning tone 5",
		u: "8.0"
	},
	person_with_blond_hair: {
		c: "people",
		e: "👱",
		d: "person with blond hair",
		u: "6.0"
	},
	person_with_blond_hair_tone1: {
		c: "people",
		e: "👱🏻",
		d: "person with blond hair tone 1",
		u: "8.0"
	},
	person_with_blond_hair_tone2: {
		c: "people",
		e: "👱🏼",
		d: "person with blond hair tone 2",
		u: "8.0"
	},
	person_with_blond_hair_tone3: {
		c: "people",
		e: "👱🏽",
		d: "person with blond hair tone 3",
		u: "8.0"
	},
	person_with_blond_hair_tone4: {
		c: "people",
		e: "👱🏾",
		d: "person with blond hair tone 4",
		u: "8.0"
	},
	person_with_blond_hair_tone5: {
		c: "people",
		e: "👱🏿",
		d: "person with blond hair tone 5",
		u: "8.0"
	},
	person_with_pouting_face: {
		c: "people",
		e: "🙎",
		d: "person with pouting face",
		u: "6.0"
	},
	person_with_pouting_face_tone1: {
		c: "people",
		e: "🙎🏻",
		d: "person with pouting face tone1",
		u: "8.0"
	},
	person_with_pouting_face_tone2: {
		c: "people",
		e: "🙎🏼",
		d: "person with pouting face tone2",
		u: "8.0"
	},
	person_with_pouting_face_tone3: {
		c: "people",
		e: "🙎🏽",
		d: "person with pouting face tone3",
		u: "8.0"
	},
	person_with_pouting_face_tone4: {
		c: "people",
		e: "🙎🏾",
		d: "person with pouting face tone4",
		u: "8.0"
	},
	person_with_pouting_face_tone5: {
		c: "people",
		e: "🙎🏿",
		d: "person with pouting face tone5",
		u: "8.0"
	},
	pick: {
		c: "objects",
		e: "⛏",
		d: "pick",
		u: "5.2"
	},
	pig: {
		c: "nature",
		e: "🐷",
		d: "pig face",
		u: "6.0"
	},
	pig2: {
		c: "nature",
		e: "🐖",
		d: "pig",
		u: "6.0"
	},
	pig_nose: {
		c: "nature",
		e: "🐽",
		d: "pig nose",
		u: "6.0"
	},
	pill: {
		c: "objects",
		e: "💊",
		d: "pill",
		u: "6.0"
	},
	pineapple: {
		c: "food",
		e: "🍍",
		d: "pineapple",
		u: "6.0"
	},
	ping_pong: {
		c: "activity",
		e: "🏓",
		d: "table tennis paddle and ball",
		u: "8.0"
	},
	pisces: {
		c: "symbols",
		e: "♓",
		d: "pisces",
		u: "1.1"
	},
	pizza: {
		c: "food",
		e: "🍕",
		d: "slice of pizza",
		u: "6.0"
	},
	place_of_worship: {
		c: "symbols",
		e: "🛐",
		d: "place of worship",
		u: "8.0"
	},
	play_pause: {
		c: "symbols",
		e: "⏯",
		d: "black right-pointing double triangle with double vertical bar",
		u: "6.0"
	},
	point_down: {
		c: "people",
		e: "👇",
		d: "white down pointing backhand index",
		u: "6.0"
	},
	point_down_tone1: {
		c: "people",
		e: "👇🏻",
		d: "white down pointing backhand index tone 1",
		u: "8.0"
	},
	point_down_tone2: {
		c: "people",
		e: "👇🏼",
		d: "white down pointing backhand index tone 2",
		u: "8.0"
	},
	point_down_tone3: {
		c: "people",
		e: "👇🏽",
		d: "white down pointing backhand index tone 3",
		u: "8.0"
	},
	point_down_tone4: {
		c: "people",
		e: "👇🏾",
		d: "white down pointing backhand index tone 4",
		u: "8.0"
	},
	point_down_tone5: {
		c: "people",
		e: "👇🏿",
		d: "white down pointing backhand index tone 5",
		u: "8.0"
	},
	point_left: {
		c: "people",
		e: "👈",
		d: "white left pointing backhand index",
		u: "6.0"
	},
	point_left_tone1: {
		c: "people",
		e: "👈🏻",
		d: "white left pointing backhand index tone 1",
		u: "8.0"
	},
	point_left_tone2: {
		c: "people",
		e: "👈🏼",
		d: "white left pointing backhand index tone 2",
		u: "8.0"
	},
	point_left_tone3: {
		c: "people",
		e: "👈🏽",
		d: "white left pointing backhand index tone 3",
		u: "8.0"
	},
	point_left_tone4: {
		c: "people",
		e: "👈🏾",
		d: "white left pointing backhand index tone 4",
		u: "8.0"
	},
	point_left_tone5: {
		c: "people",
		e: "👈🏿",
		d: "white left pointing backhand index tone 5",
		u: "8.0"
	},
	point_right: {
		c: "people",
		e: "👉",
		d: "white right pointing backhand index",
		u: "6.0"
	},
	point_right_tone1: {
		c: "people",
		e: "👉🏻",
		d: "white right pointing backhand index tone 1",
		u: "8.0"
	},
	point_right_tone2: {
		c: "people",
		e: "👉🏼",
		d: "white right pointing backhand index tone 2",
		u: "8.0"
	},
	point_right_tone3: {
		c: "people",
		e: "👉🏽",
		d: "white right pointing backhand index tone 3",
		u: "8.0"
	},
	point_right_tone4: {
		c: "people",
		e: "👉🏾",
		d: "white right pointing backhand index tone 4",
		u: "8.0"
	},
	point_right_tone5: {
		c: "people",
		e: "👉🏿",
		d: "white right pointing backhand index tone 5",
		u: "8.0"
	},
	point_up: {
		c: "people",
		e: "☝",
		d: "white up pointing index",
		u: "1.1"
	},
	point_up_2: {
		c: "people",
		e: "👆",
		d: "white up pointing backhand index",
		u: "6.0"
	},
	point_up_2_tone1: {
		c: "people",
		e: "👆🏻",
		d: "white up pointing backhand index tone 1",
		u: "8.0"
	},
	point_up_2_tone2: {
		c: "people",
		e: "👆🏼",
		d: "white up pointing backhand index tone 2",
		u: "8.0"
	},
	point_up_2_tone3: {
		c: "people",
		e: "👆🏽",
		d: "white up pointing backhand index tone 3",
		u: "8.0"
	},
	point_up_2_tone4: {
		c: "people",
		e: "👆🏾",
		d: "white up pointing backhand index tone 4",
		u: "8.0"
	},
	point_up_2_tone5: {
		c: "people",
		e: "👆🏿",
		d: "white up pointing backhand index tone 5",
		u: "8.0"
	},
	point_up_tone1: {
		c: "people",
		e: "☝🏻",
		d: "white up pointing index tone 1",
		u: "8.0"
	},
	point_up_tone2: {
		c: "people",
		e: "☝🏼",
		d: "white up pointing index tone 2",
		u: "8.0"
	},
	point_up_tone3: {
		c: "people",
		e: "☝🏽",
		d: "white up pointing index tone 3",
		u: "8.0"
	},
	point_up_tone4: {
		c: "people",
		e: "☝🏾",
		d: "white up pointing index tone 4",
		u: "8.0"
	},
	point_up_tone5: {
		c: "people",
		e: "☝🏿",
		d: "white up pointing index tone 5",
		u: "8.0"
	},
	police_car: {
		c: "travel",
		e: "🚓",
		d: "police car",
		u: "6.0"
	},
	poodle: {
		c: "nature",
		e: "🐩",
		d: "poodle",
		u: "6.0"
	},
	poop: {
		c: "people",
		e: "💩",
		d: "pile of poo",
		u: "6.0"
	},
	popcorn: {
		c: "food",
		e: "🍿",
		d: "popcorn",
		u: "8.0"
	},
	post_office: {
		c: "travel",
		e: "🏣",
		d: "japanese post office",
		u: "6.0"
	},
	postal_horn: {
		c: "objects",
		e: "📯",
		d: "postal horn",
		u: "6.0"
	},
	postbox: {
		c: "objects",
		e: "📮",
		d: "postbox",
		u: "6.0"
	},
	potable_water: {
		c: "symbols",
		e: "🚰",
		d: "potable water symbol",
		u: "6.0"
	},
	potato: {
		c: "food",
		e: "🥔",
		d: "potato",
		u: "9.0"
	},
	pouch: {
		c: "people",
		e: "👝",
		d: "pouch",
		u: "6.0"
	},
	poultry_leg: {
		c: "food",
		e: "🍗",
		d: "poultry leg",
		u: "6.0"
	},
	pound: {
		c: "objects",
		e: "💷",
		d: "banknote with pound sign",
		u: "6.0"
	},
	pouting_cat: {
		c: "people",
		e: "😾",
		d: "pouting cat face",
		u: "6.0"
	},
	pray: {
		c: "people",
		e: "🙏",
		d: "person with folded hands",
		u: "6.0"
	},
	pray_tone1: {
		c: "people",
		e: "🙏🏻",
		d: "person with folded hands tone 1",
		u: "8.0"
	},
	pray_tone2: {
		c: "people",
		e: "🙏🏼",
		d: "person with folded hands tone 2",
		u: "8.0"
	},
	pray_tone3: {
		c: "people",
		e: "🙏🏽",
		d: "person with folded hands tone 3",
		u: "8.0"
	},
	pray_tone4: {
		c: "people",
		e: "🙏🏾",
		d: "person with folded hands tone 4",
		u: "8.0"
	},
	pray_tone5: {
		c: "people",
		e: "🙏🏿",
		d: "person with folded hands tone 5",
		u: "8.0"
	},
	prayer_beads: {
		c: "objects",
		e: "📿",
		d: "prayer beads",
		u: "8.0"
	},
	pregnant_woman: {
		c: "people",
		e: "🤰",
		d: "pregnant woman",
		u: "9.0"
	},
	pregnant_woman_tone1: {
		c: "people",
		e: "🤰🏻",
		d: "pregnant woman tone 1",
		u: "9.0"
	},
	pregnant_woman_tone2: {
		c: "people",
		e: "🤰🏼",
		d: "pregnant woman tone 2",
		u: "9.0"
	},
	pregnant_woman_tone3: {
		c: "people",
		e: "🤰🏽",
		d: "pregnant woman tone 3",
		u: "9.0"
	},
	pregnant_woman_tone4: {
		c: "people",
		e: "🤰🏾",
		d: "pregnant woman tone 4",
		u: "9.0"
	},
	pregnant_woman_tone5: {
		c: "people",
		e: "🤰🏿",
		d: "pregnant woman tone 5",
		u: "9.0"
	},
	prince: {
		c: "people",
		e: "🤴",
		d: "prince",
		u: "9.0"
	},
	prince_tone1: {
		c: "people",
		e: "🤴🏻",
		d: "prince tone 1",
		u: "9.0"
	},
	prince_tone2: {
		c: "people",
		e: "🤴🏼",
		d: "prince tone 2",
		u: "9.0"
	},
	prince_tone3: {
		c: "people",
		e: "🤴🏽",
		d: "prince tone 3",
		u: "9.0"
	},
	prince_tone4: {
		c: "people",
		e: "🤴🏾",
		d: "prince tone 4",
		u: "9.0"
	},
	prince_tone5: {
		c: "people",
		e: "🤴🏿",
		d: "prince tone 5",
		u: "9.0"
	},
	princess: {
		c: "people",
		e: "👸",
		d: "princess",
		u: "6.0"
	},
	princess_tone1: {
		c: "people",
		e: "👸🏻",
		d: "princess tone 1",
		u: "8.0"
	},
	princess_tone2: {
		c: "people",
		e: "👸🏼",
		d: "princess tone 2",
		u: "8.0"
	},
	princess_tone3: {
		c: "people",
		e: "👸🏽",
		d: "princess tone 3",
		u: "8.0"
	},
	princess_tone4: {
		c: "people",
		e: "👸🏾",
		d: "princess tone 4",
		u: "8.0"
	},
	princess_tone5: {
		c: "people",
		e: "👸🏿",
		d: "princess tone 5",
		u: "8.0"
	},
	printer: {
		c: "objects",
		e: "🖨",
		d: "printer",
		u: "7.0"
	},
	projector: {
		c: "objects",
		e: "📽",
		d: "film projector",
		u: "7.0"
	},
	punch: {
		c: "people",
		e: "👊",
		d: "fisted hand sign",
		u: "6.0"
	},
	punch_tone1: {
		c: "people",
		e: "👊🏻",
		d: "fisted hand sign tone 1",
		u: "8.0"
	},
	punch_tone2: {
		c: "people",
		e: "👊🏼",
		d: "fisted hand sign tone 2",
		u: "8.0"
	},
	punch_tone3: {
		c: "people",
		e: "👊🏽",
		d: "fisted hand sign tone 3",
		u: "8.0"
	},
	punch_tone4: {
		c: "people",
		e: "👊🏾",
		d: "fisted hand sign tone 4",
		u: "8.0"
	},
	punch_tone5: {
		c: "people",
		e: "👊🏿",
		d: "fisted hand sign tone 5",
		u: "8.0"
	},
	purple_heart: {
		c: "symbols",
		e: "💜",
		d: "purple heart",
		u: "6.0"
	},
	purse: {
		c: "people",
		e: "👛",
		d: "purse",
		u: "6.0"
	},
	pushpin: {
		c: "objects",
		e: "📌",
		d: "pushpin",
		u: "6.0"
	},
	put_litter_in_its_place: {
		c: "symbols",
		e: "🚮",
		d: "put litter in its place symbol",
		u: "6.0"
	},
	question: {
		c: "symbols",
		e: "❓",
		d: "black question mark ornament",
		u: "6.0"
	},
	rabbit: {
		c: "nature",
		e: "🐰",
		d: "rabbit face",
		u: "6.0"
	},
	rabbit2: {
		c: "nature",
		e: "🐇",
		d: "rabbit",
		u: "6.0"
	},
	race_car: {
		c: "travel",
		e: "🏎",
		d: "racing car",
		u: "7.0"
	},
	racehorse: {
		c: "nature",
		e: "🐎",
		d: "horse",
		u: "6.0"
	},
	radio: {
		c: "objects",
		e: "📻",
		d: "radio",
		u: "6.0"
	},
	radio_button: {
		c: "symbols",
		e: "🔘",
		d: "radio button",
		u: "6.0"
	},
	radioactive: {
		c: "symbols",
		e: "☢",
		d: "radioactive sign",
		u: "1.1"
	},
	rage: {
		c: "people",
		e: "😡",
		d: "pouting face",
		u: "6.0"
	},
	railway_car: {
		c: "travel",
		e: "🚃",
		d: "railway car",
		u: "6.0"
	},
	railway_track: {
		c: "travel",
		e: "🛤",
		d: "railway track",
		u: "7.0"
	},
	rainbow: {
		c: "travel",
		e: "🌈",
		d: "rainbow",
		u: "6.0"
	},
	raised_back_of_hand: {
		c: "people",
		e: "🤚",
		d: "raised back of hand",
		u: "9.0"
	},
	raised_back_of_hand_tone1: {
		c: "people",
		e: "🤚🏻",
		d: "raised back of hand tone 1",
		u: "9.0"
	},
	raised_back_of_hand_tone2: {
		c: "people",
		e: "🤚🏼",
		d: "raised back of hand tone 2",
		u: "9.0"
	},
	raised_back_of_hand_tone3: {
		c: "people",
		e: "🤚🏽",
		d: "raised back of hand tone 3",
		u: "9.0"
	},
	raised_back_of_hand_tone4: {
		c: "people",
		e: "🤚🏾",
		d: "raised back of hand tone 4",
		u: "9.0"
	},
	raised_back_of_hand_tone5: {
		c: "people",
		e: "🤚🏿",
		d: "raised back of hand tone 5",
		u: "9.0"
	},
	raised_hand: {
		c: "people",
		e: "✋",
		d: "raised hand",
		u: "6.0"
	},
	raised_hand_tone1: {
		c: "people",
		e: "✋🏻",
		d: "raised hand tone 1",
		u: "8.0"
	},
	raised_hand_tone2: {
		c: "people",
		e: "✋🏼",
		d: "raised hand tone 2",
		u: "8.0"
	},
	raised_hand_tone3: {
		c: "people",
		e: "✋🏽",
		d: "raised hand tone 3",
		u: "8.0"
	},
	raised_hand_tone4: {
		c: "people",
		e: "✋🏾",
		d: "raised hand tone 4",
		u: "8.0"
	},
	raised_hand_tone5: {
		c: "people",
		e: "✋🏿",
		d: "raised hand tone 5",
		u: "8.0"
	},
	raised_hands: {
		c: "people",
		e: "🙌",
		d: "person raising both hands in celebration",
		u: "6.0"
	},
	raised_hands_tone1: {
		c: "people",
		e: "🙌🏻",
		d: "person raising both hands in celebration tone 1",
		u: "8.0"
	},
	raised_hands_tone2: {
		c: "people",
		e: "🙌🏼",
		d: "person raising both hands in celebration tone 2",
		u: "8.0"
	},
	raised_hands_tone3: {
		c: "people",
		e: "🙌🏽",
		d: "person raising both hands in celebration tone 3",
		u: "8.0"
	},
	raised_hands_tone4: {
		c: "people",
		e: "🙌🏾",
		d: "person raising both hands in celebration tone 4",
		u: "8.0"
	},
	raised_hands_tone5: {
		c: "people",
		e: "🙌🏿",
		d: "person raising both hands in celebration tone 5",
		u: "8.0"
	},
	raising_hand: {
		c: "people",
		e: "🙋",
		d: "happy person raising one hand",
		u: "6.0"
	},
	raising_hand_tone1: {
		c: "people",
		e: "🙋🏻",
		d: "happy person raising one hand tone1",
		u: "8.0"
	},
	raising_hand_tone2: {
		c: "people",
		e: "🙋🏼",
		d: "happy person raising one hand tone2",
		u: "8.0"
	},
	raising_hand_tone3: {
		c: "people",
		e: "🙋🏽",
		d: "happy person raising one hand tone3",
		u: "8.0"
	},
	raising_hand_tone4: {
		c: "people",
		e: "🙋🏾",
		d: "happy person raising one hand tone4",
		u: "8.0"
	},
	raising_hand_tone5: {
		c: "people",
		e: "🙋🏿",
		d: "happy person raising one hand tone5",
		u: "8.0"
	},
	ram: {
		c: "nature",
		e: "🐏",
		d: "ram",
		u: "6.0"
	},
	ramen: {
		c: "food",
		e: "🍜",
		d: "steaming bowl",
		u: "6.0"
	},
	rat: {
		c: "nature",
		e: "🐀",
		d: "rat",
		u: "6.0"
	},
	record_button: {
		c: "symbols",
		e: "⏺",
		d: "black circle for record",
		u: "7.0"
	},
	recycle: {
		c: "symbols",
		e: "♻",
		d: "black universal recycling symbol",
		u: "3.2"
	},
	red_car: {
		c: "travel",
		e: "🚗",
		d: "automobile",
		u: "6.0"
	},
	red_circle: {
		c: "symbols",
		e: "🔴",
		d: "large red circle",
		u: "6.0"
	},
	registered: {
		c: "symbols",
		e: "®",
		d: "registered sign",
		u: "1.1"
	},
	relaxed: {
		c: "people",
		e: "☺",
		d: "white smiling face",
		u: "1.1"
	},
	relieved: {
		c: "people",
		e: "😌",
		d: "relieved face",
		u: "6.0"
	},
	reminder_ribbon: {
		c: "activity",
		e: "🎗",
		d: "reminder ribbon",
		u: "7.0"
	},
	repeat: {
		c: "symbols",
		e: "🔁",
		d: "clockwise rightwards and leftwards open circle arr",
		u: "6.0"
	},
	repeat_one: {
		c: "symbols",
		e: "🔂",
		d: "clockwise rightwards and leftwards open circle arr",
		u: "6.0"
	},
	restroom: {
		c: "symbols",
		e: "🚻",
		d: "restroom",
		u: "6.0"
	},
	revolving_hearts: {
		c: "symbols",
		e: "💞",
		d: "revolving hearts",
		u: "6.0"
	},
	rewind: {
		c: "symbols",
		e: "⏪",
		d: "black left-pointing double triangle",
		u: "6.0"
	},
	rhino: {
		c: "nature",
		e: "🦏",
		d: "rhinoceros",
		u: "9.0"
	},
	ribbon: {
		c: "objects",
		e: "🎀",
		d: "ribbon",
		u: "6.0"
	},
	rice: {
		c: "food",
		e: "🍚",
		d: "cooked rice",
		u: "6.0"
	},
	rice_ball: {
		c: "food",
		e: "🍙",
		d: "rice ball",
		u: "6.0"
	},
	rice_cracker: {
		c: "food",
		e: "🍘",
		d: "rice cracker",
		u: "6.0"
	},
	rice_scene: {
		c: "travel",
		e: "🎑",
		d: "moon viewing ceremony",
		u: "6.0"
	},
	right_facing_fist: {
		c: "people",
		e: "🤜",
		d: "right-facing fist",
		u: "9.0"
	},
	right_facing_fist_tone1: {
		c: "people",
		e: "🤜🏻",
		d: "right facing fist tone 1",
		u: "9.0"
	},
	right_facing_fist_tone2: {
		c: "people",
		e: "🤜🏼",
		d: "right facing fist tone 2",
		u: "9.0"
	},
	right_facing_fist_tone3: {
		c: "people",
		e: "🤜🏽",
		d: "right facing fist tone 3",
		u: "9.0"
	},
	right_facing_fist_tone4: {
		c: "people",
		e: "🤜🏾",
		d: "right facing fist tone 4",
		u: "9.0"
	},
	right_facing_fist_tone5: {
		c: "people",
		e: "🤜🏿",
		d: "right facing fist tone 5",
		u: "9.0"
	},
	ring: {
		c: "people",
		e: "💍",
		d: "ring",
		u: "6.0"
	},
	robot: {
		c: "people",
		e: "🤖",
		d: "robot face",
		u: "8.0"
	},
	rocket: {
		c: "travel",
		e: "🚀",
		d: "rocket",
		u: "6.0"
	},
	rofl: {
		c: "people",
		e: "🤣",
		d: "rolling on the floor laughing",
		u: "9.0"
	},
	roller_coaster: {
		c: "travel",
		e: "🎢",
		d: "roller coaster",
		u: "6.0"
	},
	rolling_eyes: {
		c: "people",
		e: "🙄",
		d: "face with rolling eyes",
		u: "8.0"
	},
	rooster: {
		c: "nature",
		e: "🐓",
		d: "rooster",
		u: "6.0"
	},
	rose: {
		c: "nature",
		e: "🌹",
		d: "rose",
		u: "6.0"
	},
	rosette: {
		c: "activity",
		e: "🏵",
		d: "rosette",
		u: "7.0"
	},
	rotating_light: {
		c: "travel",
		e: "🚨",
		d: "police cars revolving light",
		u: "6.0"
	},
	round_pushpin: {
		c: "objects",
		e: "📍",
		d: "round pushpin",
		u: "6.0"
	},
	rowboat: {
		c: "activity",
		e: "🚣",
		d: "rowboat",
		u: "6.0"
	},
	rowboat_tone1: {
		c: "activity",
		e: "🚣🏻",
		d: "rowboat tone 1",
		u: "8.0"
	},
	rowboat_tone2: {
		c: "activity",
		e: "🚣🏼",
		d: "rowboat tone 2",
		u: "8.0"
	},
	rowboat_tone3: {
		c: "activity",
		e: "🚣🏽",
		d: "rowboat tone 3",
		u: "8.0"
	},
	rowboat_tone4: {
		c: "activity",
		e: "🚣🏾",
		d: "rowboat tone 4",
		u: "8.0"
	},
	rowboat_tone5: {
		c: "activity",
		e: "🚣🏿",
		d: "rowboat tone 5",
		u: "8.0"
	},
	rugby_football: {
		c: "activity",
		e: "🏉",
		d: "rugby football",
		u: "6.0"
	},
	runner: {
		c: "people",
		e: "🏃",
		d: "runner",
		u: "6.0"
	},
	runner_tone1: {
		c: "people",
		e: "🏃🏻",
		d: "runner tone 1",
		u: "8.0"
	},
	runner_tone2: {
		c: "people",
		e: "🏃🏼",
		d: "runner tone 2",
		u: "8.0"
	},
	runner_tone3: {
		c: "people",
		e: "🏃🏽",
		d: "runner tone 3",
		u: "8.0"
	},
	runner_tone4: {
		c: "people",
		e: "🏃🏾",
		d: "runner tone 4",
		u: "8.0"
	},
	runner_tone5: {
		c: "people",
		e: "🏃🏿",
		d: "runner tone 5",
		u: "8.0"
	},
	running_shirt_with_sash: {
		c: "activity",
		e: "🎽",
		d: "running shirt with sash",
		u: "6.0"
	},
	sa: {
		c: "symbols",
		e: "🈂",
		d: "squared katakana sa",
		u: "6.0"
	},
	sagittarius: {
		c: "symbols",
		e: "♐",
		d: "sagittarius",
		u: "1.1"
	},
	sailboat: {
		c: "travel",
		e: "⛵",
		d: "sailboat",
		u: "5.2"
	},
	sake: {
		c: "food",
		e: "🍶",
		d: "sake bottle and cup",
		u: "6.0"
	},
	salad: {
		c: "food",
		e: "🥗",
		d: "green salad",
		u: "9.0"
	},
	sandal: {
		c: "people",
		e: "👡",
		d: "womans sandal",
		u: "6.0"
	},
	santa: {
		c: "people",
		e: "🎅",
		d: "father christmas",
		u: "6.0"
	},
	santa_tone1: {
		c: "people",
		e: "🎅🏻",
		d: "father christmas tone 1",
		u: "8.0"
	},
	santa_tone2: {
		c: "people",
		e: "🎅🏼",
		d: "father christmas tone 2",
		u: "8.0"
	},
	santa_tone3: {
		c: "people",
		e: "🎅🏽",
		d: "father christmas tone 3",
		u: "8.0"
	},
	santa_tone4: {
		c: "people",
		e: "🎅🏾",
		d: "father christmas tone 4",
		u: "8.0"
	},
	santa_tone5: {
		c: "people",
		e: "🎅🏿",
		d: "father christmas tone 5",
		u: "8.0"
	},
	satellite: {
		c: "objects",
		e: "📡",
		d: "satellite antenna",
		u: "6.0"
	},
	satellite_orbital: {
		c: "travel",
		e: "🛰",
		d: "satellite",
		u: "7.0"
	},
	saxophone: {
		c: "activity",
		e: "🎷",
		d: "saxophone",
		u: "6.0"
	},
	scales: {
		c: "objects",
		e: "⚖",
		d: "scales",
		u: "4.1"
	},
	school: {
		c: "travel",
		e: "🏫",
		d: "school",
		u: "6.0"
	},
	school_satchel: {
		c: "people",
		e: "🎒",
		d: "school satchel",
		u: "6.0"
	},
	scissors: {
		c: "objects",
		e: "✂",
		d: "black scissors",
		u: "1.1"
	},
	scooter: {
		c: "travel",
		e: "🛴",
		d: "scooter",
		u: "9.0"
	},
	scorpion: {
		c: "nature",
		e: "🦂",
		d: "scorpion",
		u: "8.0"
	},
	scorpius: {
		c: "symbols",
		e: "♏",
		d: "scorpius",
		u: "1.1"
	},
	scream: {
		c: "people",
		e: "😱",
		d: "face screaming in fear",
		u: "6.0"
	},
	scream_cat: {
		c: "people",
		e: "🙀",
		d: "weary cat face",
		u: "6.0"
	},
	scroll: {
		c: "objects",
		e: "📜",
		d: "scroll",
		u: "6.0"
	},
	seat: {
		c: "travel",
		e: "💺",
		d: "seat",
		u: "6.0"
	},
	second_place: {
		c: "activity",
		e: "🥈",
		d: "second place medal",
		u: "9.0"
	},
	secret: {
		c: "symbols",
		e: "㊙",
		d: "circled ideograph secret",
		u: "1.1"
	},
	see_no_evil: {
		c: "nature",
		e: "🙈",
		d: "see-no-evil monkey",
		u: "6.0"
	},
	seedling: {
		c: "nature",
		e: "🌱",
		d: "seedling",
		u: "6.0"
	},
	selfie: {
		c: "people",
		e: "🤳",
		d: "selfie",
		u: "9.0"
	},
	selfie_tone1: {
		c: "people",
		e: "🤳🏻",
		d: "selfie tone 1",
		u: "9.0"
	},
	selfie_tone2: {
		c: "people",
		e: "🤳🏼",
		d: "selfie tone 2",
		u: "9.0"
	},
	selfie_tone3: {
		c: "people",
		e: "🤳🏽",
		d: "selfie tone 3",
		u: "9.0"
	},
	selfie_tone4: {
		c: "people",
		e: "🤳🏾",
		d: "selfie tone 4",
		u: "9.0"
	},
	selfie_tone5: {
		c: "people",
		e: "🤳🏿",
		d: "selfie tone 5",
		u: "9.0"
	},
	seven: {
		c: "symbols",
		e: "7️⃣",
		d: "keycap digit seven",
		u: "3.0"
	},
	shallow_pan_of_food: {
		c: "food",
		e: "🥘",
		d: "shallow pan of food",
		u: "9.0"
	},
	shamrock: {
		c: "nature",
		e: "☘",
		d: "shamrock",
		u: "4.1"
	},
	shark: {
		c: "nature",
		e: "🦈",
		d: "shark",
		u: "9.0"
	},
	shaved_ice: {
		c: "food",
		e: "🍧",
		d: "shaved ice",
		u: "6.0"
	},
	sheep: {
		c: "nature",
		e: "🐑",
		d: "sheep",
		u: "6.0"
	},
	shell: {
		c: "nature",
		e: "🐚",
		d: "spiral shell",
		u: "6.0"
	},
	shield: {
		c: "objects",
		e: "🛡",
		d: "shield",
		u: "7.0"
	},
	shinto_shrine: {
		c: "travel",
		e: "⛩",
		d: "shinto shrine",
		u: "5.2"
	},
	ship: {
		c: "travel",
		e: "🚢",
		d: "ship",
		u: "6.0"
	},
	shirt: {
		c: "people",
		e: "👕",
		d: "t-shirt",
		u: "6.0"
	},
	shopping_bags: {
		c: "objects",
		e: "🛍",
		d: "shopping bags",
		u: "7.0"
	},
	shopping_cart: {
		c: "objects",
		e: "🛒",
		d: "shopping trolley",
		u: "9.0"
	},
	shower: {
		c: "objects",
		e: "🚿",
		d: "shower",
		u: "6.0"
	},
	shrimp: {
		c: "nature",
		e: "🦐",
		d: "shrimp",
		u: "9.0"
	},
	shrug: {
		c: "people",
		e: "🤷",
		d: "shrug",
		u: "9.0"
	},
	shrug_tone1: {
		c: "people",
		e: "🤷🏻",
		d: "shrug tone 1",
		u: "9.0"
	},
	shrug_tone2: {
		c: "people",
		e: "🤷🏼",
		d: "shrug tone 2",
		u: "9.0"
	},
	shrug_tone3: {
		c: "people",
		e: "🤷🏽",
		d: "shrug tone 3",
		u: "9.0"
	},
	shrug_tone4: {
		c: "people",
		e: "🤷🏾",
		d: "shrug tone 4",
		u: "9.0"
	},
	shrug_tone5: {
		c: "people",
		e: "🤷🏿",
		d: "shrug tone 5",
		u: "9.0"
	},
	signal_strength: {
		c: "symbols",
		e: "📶",
		d: "antenna with bars",
		u: "6.0"
	},
	six: {
		c: "symbols",
		e: "6️⃣",
		d: "keycap digit six",
		u: "3.0"
	},
	six_pointed_star: {
		c: "symbols",
		e: "🔯",
		d: "six pointed star with middle dot",
		u: "6.0"
	},
	ski: {
		c: "activity",
		e: "🎿",
		d: "ski and ski boot",
		u: "6.0"
	},
	skier: {
		c: "activity",
		e: "⛷",
		d: "skier",
		u: "5.2"
	},
	skull: {
		c: "people",
		e: "💀",
		d: "skull",
		u: "6.0"
	},
	skull_crossbones: {
		c: "objects",
		e: "☠",
		d: "skull and crossbones",
		u: "1.1"
	},
	sleeping: {
		c: "people",
		e: "😴",
		d: "sleeping face",
		u: "6.1"
	},
	sleeping_accommodation: {
		c: "objects",
		e: "🛌",
		d: "sleeping accommodation",
		u: "7.0"
	},
	sleepy: {
		c: "people",
		e: "😪",
		d: "sleepy face",
		u: "6.0"
	},
	slight_frown: {
		c: "people",
		e: "🙁",
		d: "slightly frowning face",
		u: "7.0"
	},
	slight_smile: {
		c: "people",
		e: "🙂",
		d: "slightly smiling face",
		u: "7.0"
	},
	slot_machine: {
		c: "activity",
		e: "🎰",
		d: "slot machine",
		u: "6.0"
	},
	small_blue_diamond: {
		c: "symbols",
		e: "🔹",
		d: "small blue diamond",
		u: "6.0"
	},
	small_orange_diamond: {
		c: "symbols",
		e: "🔸",
		d: "small orange diamond",
		u: "6.0"
	},
	small_red_triangle: {
		c: "symbols",
		e: "🔺",
		d: "up-pointing red triangle",
		u: "6.0"
	},
	small_red_triangle_down: {
		c: "symbols",
		e: "🔻",
		d: "down-pointing red triangle",
		u: "6.0"
	},
	smile: {
		c: "people",
		e: "😄",
		d: "smiling face with open mouth and smiling eyes",
		u: "6.0"
	},
	smile_cat: {
		c: "people",
		e: "😸",
		d: "grinning cat face with smiling eyes",
		u: "6.0"
	},
	smiley: {
		c: "people",
		e: "😃",
		d: "smiling face with open mouth",
		u: "6.0"
	},
	smiley_cat: {
		c: "people",
		e: "😺",
		d: "smiling cat face with open mouth",
		u: "6.0"
	},
	smiling_imp: {
		c: "people",
		e: "😈",
		d: "smiling face with horns",
		u: "6.0"
	},
	smirk: {
		c: "people",
		e: "😏",
		d: "smirking face",
		u: "6.0"
	},
	smirk_cat: {
		c: "people",
		e: "😼",
		d: "cat face with wry smile",
		u: "6.0"
	},
	smoking: {
		c: "objects",
		e: "🚬",
		d: "smoking symbol",
		u: "6.0"
	},
	snail: {
		c: "nature",
		e: "🐌",
		d: "snail",
		u: "6.0"
	},
	snake: {
		c: "nature",
		e: "🐍",
		d: "snake",
		u: "6.0"
	},
	sneezing_face: {
		c: "people",
		e: "🤧",
		d: "sneezing face",
		u: "9.0"
	},
	snowboarder: {
		c: "activity",
		e: "🏂",
		d: "snowboarder",
		u: "6.0"
	},
	snowflake: {
		c: "nature",
		e: "❄",
		d: "snowflake",
		u: "1.1"
	},
	snowman: {
		c: "nature",
		e: "⛄",
		d: "snowman without snow",
		u: "5.2"
	},
	snowman2: {
		c: "nature",
		e: "☃",
		d: "snowman",
		u: "1.1"
	},
	sob: {
		c: "people",
		e: "😭",
		d: "loudly crying face",
		u: "6.0"
	},
	soccer: {
		c: "activity",
		e: "⚽",
		d: "soccer ball",
		u: "5.2"
	},
	soon: {
		c: "symbols",
		e: "🔜",
		d: "soon with rightwards arrow above",
		u: "6.0"
	},
	sos: {
		c: "symbols",
		e: "🆘",
		d: "squared sos",
		u: "6.0"
	},
	sound: {
		c: "symbols",
		e: "🔉",
		d: "speaker with one sound wave",
		u: "6.0"
	},
	space_invader: {
		c: "activity",
		e: "👾",
		d: "alien monster",
		u: "6.0"
	},
	spades: {
		c: "symbols",
		e: "♠",
		d: "black spade suit",
		u: "1.1"
	},
	spaghetti: {
		c: "food",
		e: "🍝",
		d: "spaghetti",
		u: "6.0"
	},
	sparkle: {
		c: "symbols",
		e: "❇",
		d: "sparkle",
		u: "1.1"
	},
	sparkler: {
		c: "travel",
		e: "🎇",
		d: "firework sparkler",
		u: "6.0"
	},
	sparkles: {
		c: "nature",
		e: "✨",
		d: "sparkles",
		u: "6.0"
	},
	sparkling_heart: {
		c: "symbols",
		e: "💖",
		d: "sparkling heart",
		u: "6.0"
	},
	speak_no_evil: {
		c: "nature",
		e: "🙊",
		d: "speak-no-evil monkey",
		u: "6.0"
	},
	speaker: {
		c: "symbols",
		e: "🔈",
		d: "speaker",
		u: "6.0"
	},
	speaking_head: {
		c: "people",
		e: "🗣",
		d: "speaking head in silhouette",
		u: "7.0"
	},
	speech_balloon: {
		c: "symbols",
		e: "💬",
		d: "speech balloon",
		u: "6.0"
	},
	speech_left: {
		c: "symbols",
		e: "🗨",
		d: "left speech bubble",
		u: "7.0"
	},
	speedboat: {
		c: "travel",
		e: "🚤",
		d: "speedboat",
		u: "6.0"
	},
	spider: {
		c: "nature",
		e: "🕷",
		d: "spider",
		u: "7.0"
	},
	spider_web: {
		c: "nature",
		e: "🕸",
		d: "spider web",
		u: "7.0"
	},
	spoon: {
		c: "food",
		e: "🥄",
		d: "spoon",
		u: "9.0"
	},
	spy: {
		c: "people",
		e: "🕵",
		d: "sleuth or spy",
		u: "7.0"
	},
	spy_tone1: {
		c: "people",
		e: "🕵🏻",
		d: "sleuth or spy tone 1",
		u: "8.0"
	},
	spy_tone2: {
		c: "people",
		e: "🕵🏼",
		d: "sleuth or spy tone 2",
		u: "8.0"
	},
	spy_tone3: {
		c: "people",
		e: "🕵🏽",
		d: "sleuth or spy tone 3",
		u: "8.0"
	},
	spy_tone4: {
		c: "people",
		e: "🕵🏾",
		d: "sleuth or spy tone 4",
		u: "8.0"
	},
	spy_tone5: {
		c: "people",
		e: "🕵🏿",
		d: "sleuth or spy tone 5",
		u: "8.0"
	},
	squid: {
		c: "nature",
		e: "🦑",
		d: "squid",
		u: "9.0"
	},
	stadium: {
		c: "travel",
		e: "🏟",
		d: "stadium",
		u: "7.0"
	},
	star: {
		c: "nature",
		e: "⭐",
		d: "white medium star",
		u: "5.1"
	},
	star2: {
		c: "nature",
		e: "🌟",
		d: "glowing star",
		u: "6.0"
	},
	star_and_crescent: {
		c: "symbols",
		e: "☪",
		d: "star and crescent",
		u: "1.1"
	},
	star_of_david: {
		c: "symbols",
		e: "✡",
		d: "star of david",
		u: "1.1"
	},
	stars: {
		c: "travel",
		e: "🌠",
		d: "shooting star",
		u: "6.0"
	},
	station: {
		c: "travel",
		e: "🚉",
		d: "station",
		u: "6.0"
	},
	statue_of_liberty: {
		c: "travel",
		e: "🗽",
		d: "statue of liberty",
		u: "6.0"
	},
	steam_locomotive: {
		c: "travel",
		e: "🚂",
		d: "steam locomotive",
		u: "6.0"
	},
	stew: {
		c: "food",
		e: "🍲",
		d: "pot of food",
		u: "6.0"
	},
	stop_button: {
		c: "symbols",
		e: "⏹",
		d: "black square for stop",
		u: "7.0"
	},
	stopwatch: {
		c: "objects",
		e: "⏱",
		d: "stopwatch",
		u: "6.0"
	},
	straight_ruler: {
		c: "objects",
		e: "📏",
		d: "straight ruler",
		u: "6.0"
	},
	strawberry: {
		c: "food",
		e: "🍓",
		d: "strawberry",
		u: "6.0"
	},
	stuck_out_tongue: {
		c: "people",
		e: "😛",
		d: "face with stuck-out tongue",
		u: "6.1"
	},
	stuck_out_tongue_closed_eyes: {
		c: "people",
		e: "😝",
		d: "face with stuck-out tongue and tightly-closed eyes",
		u: "6.0"
	},
	stuck_out_tongue_winking_eye: {
		c: "people",
		e: "😜",
		d: "face with stuck-out tongue and winking eye",
		u: "6.0"
	},
	stuffed_flatbread: {
		c: "food",
		e: "🥙",
		d: "stuffed flatbread",
		u: "9.0"
	},
	sun_with_face: {
		c: "nature",
		e: "🌞",
		d: "sun with face",
		u: "6.0"
	},
	sunflower: {
		c: "nature",
		e: "🌻",
		d: "sunflower",
		u: "6.0"
	},
	sunglasses: {
		c: "people",
		e: "😎",
		d: "smiling face with sunglasses",
		u: "6.0"
	},
	sunny: {
		c: "nature",
		e: "☀",
		d: "black sun with rays",
		u: "1.1"
	},
	sunrise: {
		c: "travel",
		e: "🌅",
		d: "sunrise",
		u: "6.0"
	},
	sunrise_over_mountains: {
		c: "travel",
		e: "🌄",
		d: "sunrise over mountains",
		u: "6.0"
	},
	surfer: {
		c: "activity",
		e: "🏄",
		d: "surfer",
		u: "6.0"
	},
	surfer_tone1: {
		c: "activity",
		e: "🏄🏻",
		d: "surfer tone 1",
		u: "8.0"
	},
	surfer_tone2: {
		c: "activity",
		e: "🏄🏼",
		d: "surfer tone 2",
		u: "8.0"
	},
	surfer_tone3: {
		c: "activity",
		e: "🏄🏽",
		d: "surfer tone 3",
		u: "8.0"
	},
	surfer_tone4: {
		c: "activity",
		e: "🏄🏾",
		d: "surfer tone 4",
		u: "8.0"
	},
	surfer_tone5: {
		c: "activity",
		e: "🏄🏿",
		d: "surfer tone 5",
		u: "8.0"
	},
	sushi: {
		c: "food",
		e: "🍣",
		d: "sushi",
		u: "6.0"
	},
	suspension_railway: {
		c: "travel",
		e: "🚟",
		d: "suspension railway",
		u: "6.0"
	},
	sweat: {
		c: "people",
		e: "😓",
		d: "face with cold sweat",
		u: "6.0"
	},
	sweat_drops: {
		c: "nature",
		e: "💦",
		d: "splashing sweat symbol",
		u: "6.0"
	},
	sweat_smile: {
		c: "people",
		e: "😅",
		d: "smiling face with open mouth and cold sweat",
		u: "6.0"
	},
	sweet_potato: {
		c: "food",
		e: "🍠",
		d: "roasted sweet potato",
		u: "6.0"
	},
	swimmer: {
		c: "activity",
		e: "🏊",
		d: "swimmer",
		u: "6.0"
	},
	swimmer_tone1: {
		c: "activity",
		e: "🏊🏻",
		d: "swimmer tone 1",
		u: "8.0"
	},
	swimmer_tone2: {
		c: "activity",
		e: "🏊🏼",
		d: "swimmer tone 2",
		u: "8.0"
	},
	swimmer_tone3: {
		c: "activity",
		e: "🏊🏽",
		d: "swimmer tone 3",
		u: "8.0"
	},
	swimmer_tone4: {
		c: "activity",
		e: "🏊🏾",
		d: "swimmer tone 4",
		u: "8.0"
	},
	swimmer_tone5: {
		c: "activity",
		e: "🏊🏿",
		d: "swimmer tone 5",
		u: "8.0"
	},
	symbols: {
		c: "symbols",
		e: "🔣",
		d: "input symbol for symbols",
		u: "6.0"
	},
	synagogue: {
		c: "travel",
		e: "🕍",
		d: "synagogue",
		u: "8.0"
	},
	syringe: {
		c: "objects",
		e: "💉",
		d: "syringe",
		u: "6.0"
	},
	taco: {
		c: "food",
		e: "🌮",
		d: "taco",
		u: "8.0"
	},
	tada: {
		c: "objects",
		e: "🎉",
		d: "party popper",
		u: "6.0"
	},
	tanabata_tree: {
		c: "nature",
		e: "🎋",
		d: "tanabata tree",
		u: "6.0"
	},
	tangerine: {
		c: "food",
		e: "🍊",
		d: "tangerine",
		u: "6.0"
	},
	taurus: {
		c: "symbols",
		e: "♉",
		d: "taurus",
		u: "1.1"
	},
	taxi: {
		c: "travel",
		e: "🚕",
		d: "taxi",
		u: "6.0"
	},
	tea: {
		c: "food",
		e: "🍵",
		d: "teacup without handle",
		u: "6.0"
	},
	telephone: {
		c: "objects",
		e: "☎",
		d: "black telephone",
		u: "1.1"
	},
	telephone_receiver: {
		c: "objects",
		e: "📞",
		d: "telephone receiver",
		u: "6.0"
	},
	telescope: {
		c: "objects",
		e: "🔭",
		d: "telescope",
		u: "6.0"
	},
	ten: {
		c: "symbols",
		e: "🔟",
		d: "keycap ten",
		u: "6.0"
	},
	tennis: {
		c: "activity",
		e: "🎾",
		d: "tennis racquet and ball",
		u: "6.0"
	},
	tent: {
		c: "travel",
		e: "⛺",
		d: "tent",
		u: "5.2"
	},
	thermometer: {
		c: "objects",
		e: "🌡",
		d: "thermometer",
		u: "7.0"
	},
	thermometer_face: {
		c: "people",
		e: "🤒",
		d: "face with thermometer",
		u: "8.0"
	},
	thinking: {
		c: "people",
		e: "🤔",
		d: "thinking face",
		u: "8.0"
	},
	third_place: {
		c: "activity",
		e: "🥉",
		d: "third place medal",
		u: "9.0"
	},
	thought_balloon: {
		c: "symbols",
		e: "💭",
		d: "thought balloon",
		u: "6.0"
	},
	three: {
		c: "symbols",
		e: "3️⃣",
		d: "keycap digit three",
		u: "3.0"
	},
	thumbsdown: {
		c: "people",
		e: "👎",
		d: "thumbs down sign",
		u: "6.0"
	},
	thumbsdown_tone1: {
		c: "people",
		e: "👎🏻",
		d: "thumbs down sign tone 1",
		u: "8.0"
	},
	thumbsdown_tone2: {
		c: "people",
		e: "👎🏼",
		d: "thumbs down sign tone 2",
		u: "8.0"
	},
	thumbsdown_tone3: {
		c: "people",
		e: "👎🏽",
		d: "thumbs down sign tone 3",
		u: "8.0"
	},
	thumbsdown_tone4: {
		c: "people",
		e: "👎🏾",
		d: "thumbs down sign tone 4",
		u: "8.0"
	},
	thumbsdown_tone5: {
		c: "people",
		e: "👎🏿",
		d: "thumbs down sign tone 5",
		u: "8.0"
	},
	thumbsup: {
		c: "people",
		e: "👍",
		d: "thumbs up sign",
		u: "6.0"
	},
	thumbsup_tone1: {
		c: "people",
		e: "👍🏻",
		d: "thumbs up sign tone 1",
		u: "8.0"
	},
	thumbsup_tone2: {
		c: "people",
		e: "👍🏼",
		d: "thumbs up sign tone 2",
		u: "8.0"
	},
	thumbsup_tone3: {
		c: "people",
		e: "👍🏽",
		d: "thumbs up sign tone 3",
		u: "8.0"
	},
	thumbsup_tone4: {
		c: "people",
		e: "👍🏾",
		d: "thumbs up sign tone 4",
		u: "8.0"
	},
	thumbsup_tone5: {
		c: "people",
		e: "👍🏿",
		d: "thumbs up sign tone 5",
		u: "8.0"
	},
	thunder_cloud_rain: {
		c: "nature",
		e: "⛈",
		d: "thunder cloud and rain",
		u: "5.2"
	},
	ticket: {
		c: "activity",
		e: "🎫",
		d: "ticket",
		u: "6.0"
	},
	tickets: {
		c: "activity",
		e: "🎟",
		d: "admission tickets",
		u: "7.0"
	},
	tiger: {
		c: "nature",
		e: "🐯",
		d: "tiger face",
		u: "6.0"
	},
	tiger2: {
		c: "nature",
		e: "🐅",
		d: "tiger",
		u: "6.0"
	},
	timer: {
		c: "objects",
		e: "⏲",
		d: "timer clock",
		u: "6.0"
	},
	tired_face: {
		c: "people",
		e: "😫",
		d: "tired face",
		u: "6.0"
	},
	tm: {
		c: "symbols",
		e: "™",
		d: "trade mark sign",
		u: "1.1"
	},
	toilet: {
		c: "objects",
		e: "🚽",
		d: "toilet",
		u: "6.0"
	},
	tokyo_tower: {
		c: "travel",
		e: "🗼",
		d: "tokyo tower",
		u: "6.0"
	},
	tomato: {
		c: "food",
		e: "🍅",
		d: "tomato",
		u: "6.0"
	},
	tone1: {
		c: "modifier",
		e: "🏻",
		d: "emoji modifier Fitzpatrick type-1-2",
		u: "8.0"
	},
	tone2: {
		c: "modifier",
		e: "🏼",
		d: "emoji modifier Fitzpatrick type-3",
		u: "8.0"
	},
	tone3: {
		c: "modifier",
		e: "🏽",
		d: "emoji modifier Fitzpatrick type-4",
		u: "8.0"
	},
	tone4: {
		c: "modifier",
		e: "🏾",
		d: "emoji modifier Fitzpatrick type-5",
		u: "8.0"
	},
	tone5: {
		c: "modifier",
		e: "🏿",
		d: "emoji modifier Fitzpatrick type-6",
		u: "8.0"
	},
	tongue: {
		c: "people",
		e: "👅",
		d: "tongue",
		u: "6.0"
	},
	tools: {
		c: "objects",
		e: "🛠",
		d: "hammer and wrench",
		u: "7.0"
	},
	top: {
		c: "symbols",
		e: "🔝",
		d: "top with upwards arrow above",
		u: "6.0"
	},
	tophat: {
		c: "people",
		e: "🎩",
		d: "top hat",
		u: "6.0"
	},
	track_next: {
		c: "symbols",
		e: "⏭",
		d: "black right-pointing double triangle with vertical bar",
		u: "6.0"
	},
	track_previous: {
		c: "symbols",
		e: "⏮",
		d: "black left-pointing double triangle with vertical bar",
		u: "6.0"
	},
	trackball: {
		c: "objects",
		e: "🖲",
		d: "trackball",
		u: "7.0"
	},
	tractor: {
		c: "travel",
		e: "🚜",
		d: "tractor",
		u: "6.0"
	},
	traffic_light: {
		c: "travel",
		e: "🚥",
		d: "horizontal traffic light",
		u: "6.0"
	},
	train: {
		c: "travel",
		e: "🚋",
		d: "Tram Car",
		u: "6.0"
	},
	train2: {
		c: "travel",
		e: "🚆",
		d: "train",
		u: "6.0"
	},
	tram: {
		c: "travel",
		e: "🚊",
		d: "tram",
		u: "6.0"
	},
	triangular_flag_on_post: {
		c: "objects",
		e: "🚩",
		d: "triangular flag on post",
		u: "6.0"
	},
	triangular_ruler: {
		c: "objects",
		e: "📐",
		d: "triangular ruler",
		u: "6.0"
	},
	trident: {
		c: "symbols",
		e: "🔱",
		d: "trident emblem",
		u: "6.0"
	},
	triumph: {
		c: "people",
		e: "😤",
		d: "face with look of triumph",
		u: "6.0"
	},
	trolleybus: {
		c: "travel",
		e: "🚎",
		d: "trolleybus",
		u: "6.0"
	},
	trophy: {
		c: "activity",
		e: "🏆",
		d: "trophy",
		u: "6.0"
	},
	tropical_drink: {
		c: "food",
		e: "🍹",
		d: "tropical drink",
		u: "6.0"
	},
	tropical_fish: {
		c: "nature",
		e: "🐠",
		d: "tropical fish",
		u: "6.0"
	},
	truck: {
		c: "travel",
		e: "🚚",
		d: "delivery truck",
		u: "6.0"
	},
	trumpet: {
		c: "activity",
		e: "🎺",
		d: "trumpet",
		u: "6.0"
	},
	tulip: {
		c: "nature",
		e: "🌷",
		d: "tulip",
		u: "6.0"
	},
	tumbler_glass: {
		c: "food",
		e: "🥃",
		d: "tumbler glass",
		u: "9.0"
	},
	turkey: {
		c: "nature",
		e: "🦃",
		d: "turkey",
		u: "8.0"
	},
	turtle: {
		c: "nature",
		e: "🐢",
		d: "turtle",
		u: "6.0"
	},
	tv: {
		c: "objects",
		e: "📺",
		d: "television",
		u: "6.0"
	},
	twisted_rightwards_arrows: {
		c: "symbols",
		e: "🔀",
		d: "twisted rightwards arrows",
		u: "6.0"
	},
	two: {
		c: "symbols",
		e: "2️⃣",
		d: "keycap digit two",
		u: "3.0"
	},
	two_hearts: {
		c: "symbols",
		e: "💕",
		d: "two hearts",
		u: "6.0"
	},
	two_men_holding_hands: {
		c: "people",
		e: "👬",
		d: "two men holding hands",
		u: "6.0"
	},
	two_women_holding_hands: {
		c: "people",
		e: "👭",
		d: "two women holding hands",
		u: "6.0"
	},
	u5272: {
		c: "symbols",
		e: "🈹",
		d: "squared cjk unified ideograph-5272",
		u: "6.0"
	},
	u5408: {
		c: "symbols",
		e: "🈴",
		d: "squared cjk unified ideograph-5408",
		u: "6.0"
	},
	u55b6: {
		c: "symbols",
		e: "🈺",
		d: "squared cjk unified ideograph-55b6",
		u: "6.0"
	},
	u6307: {
		c: "symbols",
		e: "🈯",
		d: "squared cjk unified ideograph-6307",
		u: "5.2"
	},
	u6708: {
		c: "symbols",
		e: "🈷",
		d: "squared cjk unified ideograph-6708",
		u: "6.0"
	},
	u6709: {
		c: "symbols",
		e: "🈶",
		d: "squared cjk unified ideograph-6709",
		u: "6.0"
	},
	u6e80: {
		c: "symbols",
		e: "🈵",
		d: "squared cjk unified ideograph-6e80",
		u: "6.0"
	},
	u7121: {
		c: "symbols",
		e: "🈚",
		d: "squared cjk unified ideograph-7121",
		u: "5.2"
	},
	u7533: {
		c: "symbols",
		e: "🈸",
		d: "squared cjk unified ideograph-7533",
		u: "6.0"
	},
	u7981: {
		c: "symbols",
		e: "🈲",
		d: "squared cjk unified ideograph-7981",
		u: "6.0"
	},
	u7a7a: {
		c: "symbols",
		e: "🈳",
		d: "squared cjk unified ideograph-7a7a",
		u: "6.0"
	},
	umbrella: {
		c: "nature",
		e: "☔",
		d: "umbrella with rain drops",
		u: "4.0"
	},
	umbrella2: {
		c: "nature",
		e: "☂",
		d: "umbrella",
		u: "1.1"
	},
	unamused: {
		c: "people",
		e: "😒",
		d: "unamused face",
		u: "6.0"
	},
	underage: {
		c: "symbols",
		e: "🔞",
		d: "no one under eighteen symbol",
		u: "6.0"
	},
	unicorn: {
		c: "nature",
		e: "🦄",
		d: "unicorn face",
		u: "8.0"
	},
	unlock: {
		c: "objects",
		e: "🔓",
		d: "open lock",
		u: "6.0"
	},
	up: {
		c: "symbols",
		e: "🆙",
		d: "squared up with exclamation mark",
		u: "6.0"
	},
	upside_down: {
		c: "people",
		e: "🙃",
		d: "upside-down face",
		u: "8.0"
	},
	urn: {
		c: "objects",
		e: "⚱",
		d: "funeral urn",
		u: "4.1"
	},
	v: {
		c: "people",
		e: "✌",
		d: "victory hand",
		u: "1.1"
	},
	v_tone1: {
		c: "people",
		e: "✌🏻",
		d: "victory hand tone 1",
		u: "8.0"
	},
	v_tone2: {
		c: "people",
		e: "✌🏼",
		d: "victory hand tone 2",
		u: "8.0"
	},
	v_tone3: {
		c: "people",
		e: "✌🏽",
		d: "victory hand tone 3",
		u: "8.0"
	},
	v_tone4: {
		c: "people",
		e: "✌🏾",
		d: "victory hand tone 4",
		u: "8.0"
	},
	v_tone5: {
		c: "people",
		e: "✌🏿",
		d: "victory hand tone 5",
		u: "8.0"
	},
	vertical_traffic_light: {
		c: "travel",
		e: "🚦",
		d: "vertical traffic light",
		u: "6.0"
	},
	vhs: {
		c: "objects",
		e: "📼",
		d: "videocassette",
		u: "6.0"
	},
	vibration_mode: {
		c: "symbols",
		e: "📳",
		d: "vibration mode",
		u: "6.0"
	},
	video_camera: {
		c: "objects",
		e: "📹",
		d: "video camera",
		u: "6.0"
	},
	video_game: {
		c: "activity",
		e: "🎮",
		d: "video game",
		u: "6.0"
	},
	violin: {
		c: "activity",
		e: "🎻",
		d: "violin",
		u: "6.0"
	},
	virgo: {
		c: "symbols",
		e: "♍",
		d: "virgo",
		u: "1.1"
	},
	volcano: {
		c: "travel",
		e: "🌋",
		d: "volcano",
		u: "6.0"
	},
	volleyball: {
		c: "activity",
		e: "🏐",
		d: "volleyball",
		u: "8.0"
	},
	vs: {
		c: "symbols",
		e: "🆚",
		d: "squared vs",
		u: "6.0"
	},
	vulcan: {
		c: "people",
		e: "🖖",
		d: "raised hand with part between middle and ring fingers",
		u: "7.0"
	},
	vulcan_tone1: {
		c: "people",
		e: "🖖🏻",
		d: "raised hand with part between middle and ring fingers tone 1",
		u: "8.0"
	},
	vulcan_tone2: {
		c: "people",
		e: "🖖🏼",
		d: "raised hand with part between middle and ring fingers tone 2",
		u: "8.0"
	},
	vulcan_tone3: {
		c: "people",
		e: "🖖🏽",
		d: "raised hand with part between middle and ring fingers tone 3",
		u: "8.0"
	},
	vulcan_tone4: {
		c: "people",
		e: "🖖🏾",
		d: "raised hand with part between middle and ring fingers tone 4",
		u: "8.0"
	},
	vulcan_tone5: {
		c: "people",
		e: "🖖🏿",
		d: "raised hand with part between middle and ring fingers tone 5",
		u: "8.0"
	},
	walking: {
		c: "people",
		e: "🚶",
		d: "pedestrian",
		u: "6.0"
	},
	walking_tone1: {
		c: "people",
		e: "🚶🏻",
		d: "pedestrian tone 1",
		u: "8.0"
	},
	walking_tone2: {
		c: "people",
		e: "🚶🏼",
		d: "pedestrian tone 2",
		u: "8.0"
	},
	walking_tone3: {
		c: "people",
		e: "🚶🏽",
		d: "pedestrian tone 3",
		u: "8.0"
	},
	walking_tone4: {
		c: "people",
		e: "🚶🏾",
		d: "pedestrian tone 4",
		u: "8.0"
	},
	walking_tone5: {
		c: "people",
		e: "🚶🏿",
		d: "pedestrian tone 5",
		u: "8.0"
	},
	waning_crescent_moon: {
		c: "nature",
		e: "🌘",
		d: "waning crescent moon symbol",
		u: "6.0"
	},
	waning_gibbous_moon: {
		c: "nature",
		e: "🌖",
		d: "waning gibbous moon symbol",
		u: "6.0"
	},
	warning: {
		c: "symbols",
		e: "⚠",
		d: "warning sign",
		u: "4.0"
	},
	wastebasket: {
		c: "objects",
		e: "🗑",
		d: "wastebasket",
		u: "7.0"
	},
	watch: {
		c: "objects",
		e: "⌚",
		d: "watch",
		u: "1.1"
	},
	water_buffalo: {
		c: "nature",
		e: "🐃",
		d: "water buffalo",
		u: "6.0"
	},
	water_polo: {
		c: "activity",
		e: "🤽",
		d: "water polo",
		u: "9.0"
	},
	water_polo_tone1: {
		c: "activity",
		e: "🤽🏻",
		d: "water polo tone 1",
		u: "9.0"
	},
	water_polo_tone2: {
		c: "activity",
		e: "🤽🏼",
		d: "water polo tone 2",
		u: "9.0"
	},
	water_polo_tone3: {
		c: "activity",
		e: "🤽🏽",
		d: "water polo tone 3",
		u: "9.0"
	},
	water_polo_tone4: {
		c: "activity",
		e: "🤽🏾",
		d: "water polo tone 4",
		u: "9.0"
	},
	water_polo_tone5: {
		c: "activity",
		e: "🤽🏿",
		d: "water polo tone 5",
		u: "9.0"
	},
	watermelon: {
		c: "food",
		e: "🍉",
		d: "watermelon",
		u: "6.0"
	},
	wave: {
		c: "people",
		e: "👋",
		d: "waving hand sign",
		u: "6.0"
	},
	wave_tone1: {
		c: "people",
		e: "👋🏻",
		d: "waving hand sign tone 1",
		u: "8.0"
	},
	wave_tone2: {
		c: "people",
		e: "👋🏼",
		d: "waving hand sign tone 2",
		u: "8.0"
	},
	wave_tone3: {
		c: "people",
		e: "👋🏽",
		d: "waving hand sign tone 3",
		u: "8.0"
	},
	wave_tone4: {
		c: "people",
		e: "👋🏾",
		d: "waving hand sign tone 4",
		u: "8.0"
	},
	wave_tone5: {
		c: "people",
		e: "👋🏿",
		d: "waving hand sign tone 5",
		u: "8.0"
	},
	wavy_dash: {
		c: "symbols",
		e: "〰",
		d: "wavy dash",
		u: "1.1"
	},
	waxing_crescent_moon: {
		c: "nature",
		e: "🌒",
		d: "waxing crescent moon symbol",
		u: "6.0"
	},
	waxing_gibbous_moon: {
		c: "nature",
		e: "🌔",
		d: "waxing gibbous moon symbol",
		u: "6.0"
	},
	wc: {
		c: "symbols",
		e: "🚾",
		d: "water closet",
		u: "6.0"
	},
	weary: {
		c: "people",
		e: "😩",
		d: "weary face",
		u: "6.0"
	},
	wedding: {
		c: "travel",
		e: "💒",
		d: "wedding",
		u: "6.0"
	},
	whale: {
		c: "nature",
		e: "🐳",
		d: "spouting whale",
		u: "6.0"
	},
	whale2: {
		c: "nature",
		e: "🐋",
		d: "whale",
		u: "6.0"
	},
	wheel_of_dharma: {
		c: "symbols",
		e: "☸",
		d: "wheel of dharma",
		u: "1.1"
	},
	wheelchair: {
		c: "symbols",
		e: "♿",
		d: "wheelchair symbol",
		u: "4.1"
	},
	white_check_mark: {
		c: "symbols",
		e: "✅",
		d: "white heavy check mark",
		u: "6.0"
	},
	white_circle: {
		c: "symbols",
		e: "⚪",
		d: "medium white circle",
		u: "4.1"
	},
	white_flower: {
		c: "symbols",
		e: "💮",
		d: "white flower",
		u: "6.0"
	},
	white_large_square: {
		c: "symbols",
		e: "⬜",
		d: "white large square",
		u: "5.1"
	},
	white_medium_small_square: {
		c: "symbols",
		e: "◽",
		d: "white medium small square",
		u: "3.2"
	},
	white_medium_square: {
		c: "symbols",
		e: "◻",
		d: "white medium square",
		u: "3.2"
	},
	white_small_square: {
		c: "symbols",
		e: "▫",
		d: "white small square",
		u: "1.1"
	},
	white_square_button: {
		c: "symbols",
		e: "🔳",
		d: "white square button",
		u: "6.0"
	},
	white_sun_cloud: {
		c: "nature",
		e: "🌥",
		d: "white sun behind cloud",
		u: "7.0"
	},
	white_sun_rain_cloud: {
		c: "nature",
		e: "🌦",
		d: "white sun behind cloud with rain",
		u: "7.0"
	},
	white_sun_small_cloud: {
		c: "nature",
		e: "🌤",
		d: "white sun with small cloud",
		u: "7.0"
	},
	wilted_rose: {
		c: "nature",
		e: "🥀",
		d: "wilted flower",
		u: "9.0"
	},
	wind_blowing_face: {
		c: "nature",
		e: "🌬",
		d: "wind blowing face",
		u: "7.0"
	},
	wind_chime: {
		c: "objects",
		e: "🎐",
		d: "wind chime",
		u: "6.0"
	},
	wine_glass: {
		c: "food",
		e: "🍷",
		d: "wine glass",
		u: "6.0"
	},
	wink: {
		c: "people",
		e: "😉",
		d: "winking face",
		u: "6.0"
	},
	wolf: {
		c: "nature",
		e: "🐺",
		d: "wolf face",
		u: "6.0"
	},
	woman: {
		c: "people",
		e: "👩",
		d: "woman",
		u: "6.0"
	},
	woman_tone1: {
		c: "people",
		e: "👩🏻",
		d: "woman tone 1",
		u: "8.0"
	},
	woman_tone2: {
		c: "people",
		e: "👩🏼",
		d: "woman tone 2",
		u: "8.0"
	},
	woman_tone3: {
		c: "people",
		e: "👩🏽",
		d: "woman tone 3",
		u: "8.0"
	},
	woman_tone4: {
		c: "people",
		e: "👩🏾",
		d: "woman tone 4",
		u: "8.0"
	},
	woman_tone5: {
		c: "people",
		e: "👩🏿",
		d: "woman tone 5",
		u: "8.0"
	},
	womans_clothes: {
		c: "people",
		e: "👚",
		d: "womans clothes",
		u: "6.0"
	},
	womans_hat: {
		c: "people",
		e: "👒",
		d: "womans hat",
		u: "6.0"
	},
	womens: {
		c: "symbols",
		e: "🚺",
		d: "womens symbol",
		u: "6.0"
	},
	worried: {
		c: "people",
		e: "😟",
		d: "worried face",
		u: "6.1"
	},
	wrench: {
		c: "objects",
		e: "🔧",
		d: "wrench",
		u: "6.0"
	},
	wrestlers: {
		c: "activity",
		e: "🤼",
		d: "wrestlers",
		u: "9.0"
	},
	wrestlers_tone1: {
		c: "activity",
		e: "🤼🏻",
		d: "wrestlers tone 1",
		u: "9.0"
	},
	wrestlers_tone2: {
		c: "activity",
		e: "🤼🏼",
		d: "wrestlers tone 2",
		u: "9.0"
	},
	wrestlers_tone3: {
		c: "activity",
		e: "🤼🏽",
		d: "wrestlers tone 3",
		u: "9.0"
	},
	wrestlers_tone4: {
		c: "activity",
		e: "🤼🏾",
		d: "wrestlers tone 4",
		u: "9.0"
	},
	wrestlers_tone5: {
		c: "activity",
		e: "🤼🏿",
		d: "wrestlers tone 5",
		u: "9.0"
	},
	writing_hand: {
		c: "people",
		e: "✍",
		d: "writing hand",
		u: "1.1"
	},
	writing_hand_tone1: {
		c: "people",
		e: "✍🏻",
		d: "writing hand tone 1",
		u: "8.0"
	},
	writing_hand_tone2: {
		c: "people",
		e: "✍🏼",
		d: "writing hand tone 2",
		u: "8.0"
	},
	writing_hand_tone3: {
		c: "people",
		e: "✍🏽",
		d: "writing hand tone 3",
		u: "8.0"
	},
	writing_hand_tone4: {
		c: "people",
		e: "✍🏾",
		d: "writing hand tone 4",
		u: "8.0"
	},
	writing_hand_tone5: {
		c: "people",
		e: "✍🏿",
		d: "writing hand tone 5",
		u: "8.0"
	},
	x: {
		c: "symbols",
		e: "❌",
		d: "cross mark",
		u: "6.0"
	},
	yellow_heart: {
		c: "symbols",
		e: "💛",
		d: "yellow heart",
		u: "6.0"
	},
	yen: {
		c: "objects",
		e: "💴",
		d: "banknote with yen sign",
		u: "6.0"
	},
	yin_yang: {
		c: "symbols",
		e: "☯",
		d: "yin yang",
		u: "1.1"
	},
	yum: {
		c: "people",
		e: "😋",
		d: "face savouring delicious food",
		u: "6.0"
	},
	zap: {
		c: "nature",
		e: "⚡",
		d: "high voltage sign",
		u: "4.0"
	},
	zero: {
		c: "symbols",
		e: "0️⃣",
		d: "keycap digit zero",
		u: "3.0"
	},
	zipper_mouth: {
		c: "people",
		e: "🤐",
		d: "zipper-mouth face",
		u: "8.0"
	},
	zzz: {
		c: "people",
		e: "💤",
		d: "sleeping symbol",
		u: "6.0"
	}
};