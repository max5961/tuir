import React, { forwardRef, useEffect, useState, type PropsWithChildren } from "react";
import { type Except } from "type-fest";
import { type BaseProps } from "../baseProps.js";
import { type DOMElement } from "../dom.js";
import { usePageFocus } from "../focus/FocusContext.js";
import { DefaultStdin } from "../stdin/Stdin.js";
import { randomUUID } from "crypto";

export type Props = Except<BaseProps, "textWrap">;

/**
 * `<Box>` is an essential Ink component to build your layout. It's like `<div style="display: flex">` in the browser.
 */
const Box = forwardRef<DOMElement, PropsWithChildren<Props>>(
	({ children, ...style }, ref) => {
		const { styles, ...props } = style;

		const [leftActive, setLeftActive] = useState(false);
		const [rightActive, setRightActive] = useState(false);

		// Apply styles from styles prop if style not already set
		if (styles) {
			for (const key in styles) {
				if (key === "styles") continue;
				// @ts-ignore
				if (props[key] === undefined && styles[key] !== undefined) {
					// @ts-ignore
					props[key] = styles[key];
				}
			}
		}

		// Overwrite props if left active
		if (leftActive && (styles?.leftActive || props.leftActive)) {
			if (styles?.leftActive) {
				for (const key in styles.leftActive) {
					// @ts-ignore
					props[key] = styles.leftActive[key];
				}
			}

			if (props.leftActive) {
				for (const key in props.leftActive) {
					// @ts-ignore
					props[key] = props.leftActive[key];
				}
			}
		}

		// Overwrite props if right active
		if (rightActive && (styles?.rightActive || props.rightActive)) {
			if (styles?.rightActive) {
				for (const key in styles.rightActive) {
					// @ts-ignore
					props[key] = styles.rightActive[key];
				}
			}

			if (props.rightActive) {
				for (const key in props.rightActive) {
					// @ts-ignore
					props[key] = props.rightActive[key];
				}
			}
		}

		const [ID] = useState(randomUUID());
		const isPageFocus = usePageFocus();

		useEffect(() => {
			return () => {
				DefaultStdin.Mouse.unsubscribeComponent(ID);
			};
		}, []);

		// Default styles
		props.flexWrap = props.flexWrap ?? "nowrap";
		props.flexDirection = props.flexDirection ?? "row";
		props.flexGrow = props.flexGrow ?? 0;
		props.flexShrink = props.flexShrink ?? 1;
		props.zIndex = props.zIndex ?? "auto";

		return (
			<ink-box
				ref={ref}
				style={{
					...props,
					overflowX: props.overflowX ?? props.overflow ?? "visible",
					overflowY: props.overflowY ?? props.overflow ?? "visible",
				}}
				ID={ID}
				isPageFocus={isPageFocus}
				setLeftActive={setLeftActive}
				setRightActive={setRightActive}
				internalStyles={{ ...props }}
			>
				{children}
			</ink-box>
		);
	},
);

Box.displayName = "Box";

// Box.defaultProps = {
// 	flexWrap: 'nowrap',
// 	flexDirection: 'row',
// 	flexGrow: 0,
// 	flexShrink: 1,
// };

export default Box;
