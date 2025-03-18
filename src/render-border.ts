import cliBoxes, { Boxes } from "cli-boxes";
import chalk from "chalk";
import colorize from "./colorize.js";
import { type DOMNode } from "./dom.js";
import type Output from "./output.js";
import { renderTitle } from "./renderTitles/renderTitleToOutput.js";

const renderBorder = (
	x: number,
	y: number,
	node: DOMNode,
	output: Output,
	zIndexRoot: number,
): void => {
	const hasTopTitle =
		node.style.titleTopLeft || node.style.titleTopCenter || node.style.titleTopRight;

	const hasBottomTitle =
		node.style.titleBottomLeft ||
		node.style.titleBottomCenter ||
		node.style.titleBottomRight;

	// If there is a borderStyle, we render titles in place of rendering the top
	// and bottom titles.  If there is no borderStyle, just render the titles
	// and skip rendering the borders.
	if (!node.style.borderStyle) {
		hasTopTitle && renderTitle(x, y, node, output, "top", zIndexRoot);
		hasBottomTitle && renderTitle(x, y, node, output, "bottom", zIndexRoot);
		return;
	}

	const width = node.yogaNode!.getComputedWidth();
	const height = node.yogaNode!.getComputedHeight();

	// 'inherit' borderStyle prop will always be reset before rendering border
	const box =
		typeof node.style.borderStyle === "string"
			? cliBoxes[node.style.borderStyle as keyof Boxes]
			: node.style.borderStyle;

	const topBorderColor = node.style.borderTopColor ?? node.style.borderColor;
	const bottomBorderColor = node.style.borderBottomColor ?? node.style.borderColor;
	const leftBorderColor = node.style.borderLeftColor ?? node.style.borderColor;
	const rightBorderColor = node.style.borderRightColor ?? node.style.borderColor;

	const dimTopBorderColor = node.style.borderTopDimColor ?? node.style.borderDimColor;

	const dimBottomBorderColor =
		node.style.borderBottomDimColor ?? node.style.borderDimColor;

	const dimLeftBorderColor = node.style.borderLeftDimColor ?? node.style.borderDimColor;

	const dimRightBorderColor =
		node.style.borderRightDimColor ?? node.style.borderDimColor;

	const showTopBorder = node.style.borderTop !== false;
	const showBottomBorder = node.style.borderBottom !== false;
	const showLeftBorder = node.style.borderLeft !== false;
	const showRightBorder = node.style.borderRight !== false;

	const contentWidth = width - (showLeftBorder ? 1 : 0) - (showRightBorder ? 1 : 0);

	let topBorder = showTopBorder
		? colorize(
				(showLeftBorder ? box.topLeft : "") +
					box.top.repeat(contentWidth) +
					(showRightBorder ? box.topRight : ""),
				topBorderColor,
				"foreground",
			)
		: undefined;

	if (showTopBorder && dimTopBorderColor) {
		topBorder = chalk.dim(topBorder);
	}

	let verticalBorderHeight = height;

	if (showTopBorder) {
		verticalBorderHeight -= 1;
	}

	if (showBottomBorder) {
		verticalBorderHeight -= 1;
	}

	let leftBorder = (colorize(box.left, leftBorderColor, "foreground") + "\n").repeat(
		verticalBorderHeight,
	);

	if (dimLeftBorderColor) {
		leftBorder = chalk.dim(leftBorder);
	}

	let rightBorder = (colorize(box.right, rightBorderColor, "foreground") + "\n").repeat(
		verticalBorderHeight,
	);

	if (dimRightBorderColor) {
		rightBorder = chalk.dim(rightBorder);
	}

	let bottomBorder = showBottomBorder
		? colorize(
				(showLeftBorder ? box.bottomLeft : "") +
					box.bottom.repeat(contentWidth) +
					(showRightBorder ? box.bottomRight : ""),
				bottomBorderColor,
				"foreground",
			)
		: undefined;

	if (showBottomBorder && dimBottomBorderColor) {
		bottomBorder = chalk.dim(bottomBorder);
	}

	const offsetY = showTopBorder ? 1 : 0;

	if (topBorder) {
		if (hasTopTitle) {
			renderTitle(x, y, node, output, "top", zIndexRoot);
		} else {
			output.write(x, y, topBorder, { transformers: [] });
		}
	}

	if (showLeftBorder) {
		output.write(x, y + offsetY, leftBorder, { transformers: [] });
	}

	if (showRightBorder) {
		output.write(x + width - 1, y + offsetY, rightBorder, {
			transformers: [],
		});
	}

	if (bottomBorder) {
		if (hasBottomTitle) {
			renderTitle(x, y, node, output, "bottom", zIndexRoot);
		} else {
			output.write(x, y + height - 1, bottomBorder, { transformers: [] });
		}
	}
};

export default renderBorder;
