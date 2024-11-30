import widestLine from 'widest-line';
import indentString from 'indent-string';
import Yoga from 'yoga-wasm-web/auto';
import wrapText from './wrap-text.js';
import getMaxWidth from './get-max-width.js';
import squashTextNodes from './squash-text-nodes.js';
import renderBorder from './render-border.js';
import {type DOMElement} from './dom.js';
import type Output from './output.js';
import renderBackgroundColor from './render-background-color.js';
import {Styles} from './styles.js';
import {addMouseEventListeners} from './Stdin/AddMouseEventListeners.js';
import {STDIN} from './Stdin/Stdin.js';

// If parent container is `<Box>`, text nodes will be treated as separate nodes in
// the tree and will have their own coordinates in the layout.
// To ensure text nodes are aligned correctly, take X and Y of the first text node
// and use it as offset for the rest of the nodes
// Only first node is taken into account, because other text nodes can't have margin or padding,
// so their coordinates will be relative to the first node anyway
const applyPaddingToText = (node: DOMElement, text: string): string => {
	const yogaNode = node.childNodes[0]?.yogaNode;

	if (yogaNode) {
		const offsetX = yogaNode.getComputedLeft();
		const offsetY = yogaNode.getComputedTop();
		text = '\n'.repeat(offsetY) + indentString(text, offsetX);
	}

	return text;
};

export type OutputTransformer = (s: string, index: number) => string;

// After nodes are laid out, render each to output object, which later gets rendered to terminal
const renderNodeToOutput = (
	node: DOMElement,
	output: Output,
	options: {
		offsetX?: number;
		offsetY?: number;
		transformers?: OutputTransformer[];
		skipStaticElements: boolean;
		isZIndexRoot?: boolean;
		rootZIndex?: number;
		parentStyles?: {
			backgroundColor?: Styles['backgroundColor'];
			borderColor?: Styles['borderColor'];
			borderStyle?: Styles['borderStyle'];
		};
	},
	zIndexes: {index: number; cb: () => void}[] = [],
) => {
	const {
		offsetX = 0,
		offsetY = 0,
		transformers = [],
		skipStaticElements,
	} = options;

	const {yogaNode} = node;

	if (skipStaticElements && node.internal_static) return;
	if (!yogaNode || yogaNode.getDisplay() === Yoga.DISPLAY_NONE) return;

	// Left and top positions in Yoga are relative to their parent node
	// If this is a call from a zIndex node, then the offset has already been calculated
	const nextOffsetX = options.isZIndexRoot ? 0 : yogaNode.getComputedLeft();
	const nextOffsetY = options.isZIndexRoot ? 0 : yogaNode.getComputedTop();
	const x = offsetX + nextOffsetX;
	const y = offsetY + nextOffsetY;

	// Transformers are functions that transform final text output of each component
	// See Output class for logic that applies transformers
	let newTransformers = transformers;

	// Every node that has a zIndex set becomes a 'zIndex root', which means rendering
	// is cached until the current zIndex root is finished rendering.  Every zIndex
	// root accumulates from the previous zIndex root's value.  The 'ink-root' zIndex
	// starts at 0
	options.rootZIndex = options.rootZIndex ?? 0;

	if (typeof node.internal_transform === 'function') {
		newTransformers = [node.internal_transform, ...transformers];
	}

	if (node.nodeName === 'ink-text') {
		const {backgroundColor, color, inverse} = node.style;
		const parentBg = options.parentStyles?.backgroundColor;

		if (backgroundColor === 'inherit' && parentBg) {
			// Do not modify bg if inverse === true, because inverse === true ends
			// up setting the background so we don't want to overwrite any intentional
			// styles
			if (!inverse && !color) {
				(node.style.color as any) = parentBg;
				(node.style.inverse as any) = true;
			} else if (!inverse) {
				(node.style.backgroundColor as any) = parentBg;
			}
		}

		// Styles are applied in squashTextNodes
		let text = squashTextNodes(node);

		if (text.length > 0) {
			const currentWidth = widestLine(text);
			const maxWidth = getMaxWidth(yogaNode);

			if (currentWidth > maxWidth) {
				const textWrap = node.style.textWrap ?? 'wrap';
				text = wrapText(text, maxWidth, textWrap);
			}

			text = applyPaddingToText(node, text);

			output.write(x, y, text, {transformers: newTransformers});
		}

		return;
	}

	let clipped = false;

	if (node.style.zIndex === 'auto') {
		(node.style.zIndex as any) = 0;
	}

	// zIndexes less than 0 won't have any effect...make this explicitly clear
	if (typeof node.style.zIndex === 'number' && node.style.zIndex < 0) {
		throw new Error('zIndex property must be a positive number.');
	}

	// If zIndex root, that means this stack frame has already been queued and is
	// now being executed, we don't need to stash it for later
	const hasZIndex =
		typeof node.style.zIndex === 'number' &&
		node.style.zIndex > 0 &&
		!options.isZIndexRoot;

	// Save for rendering after the rest of the tree has finished
	// This is a zIndex root node, save for later
	if (node.nodeName === 'ink-box' && hasZIndex) {
		// prettier-ignore
		const nodeZIndex = (node.style.zIndex as number) + (options.rootZIndex ?? 0);

		// prettier-ignore
		const cb = () => {
			renderNodeToOutput(node, output, {
				offsetX: x,
				offsetY: y,
				transformers: newTransformers,
				skipStaticElements,
				parentStyles: options?.parentStyles,
				rootZIndex:nodeZIndex,
				isZIndexRoot: true,
			}, []);
			// Don't pass in the cached zIndexes, each node with a zIndex accumulates
			// recursive callbacks to other zIndexed nodes just like the root node
		};

		zIndexes.push({index: nodeZIndex, cb});
		zIndexes.sort((a, b) => (a.index > b.index ? 1 : -1));
	} else if (node.nodeName === 'ink-box') {
		// Inherit styles from parent element
		// prettier-ignore
		if (node.style.backgroundColor === 'inherit') {
			if (options?.parentStyles?.backgroundColor) {
				(node.style.backgroundColor as string) = options.parentStyles.backgroundColor;
			} else {
				(node.style.backgroundColor as any) = undefined;
			}
		}
		if (node.style.borderColor === 'inherit') {
			if (options?.parentStyles?.borderColor) {
				(node.style.borderColor as string) = options.parentStyles.borderColor;
			} else {
				(node.style.borderColor as any) = undefined;
			}
		}
		if (node.style.borderStyle === 'inherit') {
			if (options?.parentStyles?.borderStyle) {
				(node.style.borderStyle as any) = options.parentStyles.borderStyle;
			} else {
				(node.style.borderStyle as any) = undefined;
			}
		}

		addMouseEventListeners(node, options.rootZIndex);

		const parentHasBg = options?.parentStyles?.backgroundColor ? true : false;
		renderBackgroundColor(x, y, node, output, parentHasBg);
		renderBorder(x, y, node, output);

		const clipHorizontally =
			node.style.overflowX === 'hidden' || node.style.overflow === 'hidden';
		const clipVertically =
			node.style.overflowY === 'hidden' || node.style.overflow === 'hidden';

		if (clipHorizontally || clipVertically) {
			const x1 = clipHorizontally
				? x + yogaNode.getComputedBorder(Yoga.EDGE_LEFT)
				: undefined;

			const x2 = clipHorizontally
				? x +
					yogaNode.getComputedWidth() -
					yogaNode.getComputedBorder(Yoga.EDGE_RIGHT)
				: undefined;

			const y1 = clipVertically
				? y + yogaNode.getComputedBorder(Yoga.EDGE_TOP)
				: undefined;

			const y2 = clipVertically
				? y +
					yogaNode.getComputedHeight() -
					yogaNode.getComputedBorder(Yoga.EDGE_BOTTOM)
				: undefined;

			output.clip({x1, x2, y1, y2});
			clipped = true;
		}
	}

	if (
		node.nodeName === 'ink-root' ||
		(node.nodeName === 'ink-box' && !hasZIndex)
	) {
		if (node.nodeName === 'ink-root') {
			STDIN.Mouse.resetHandlers();
		}

		for (const childNode of node.childNodes) {
			renderNodeToOutput(
				childNode as DOMElement,
				output,
				{
					offsetX: x,
					offsetY: y,
					transformers: newTransformers,
					skipStaticElements,
					parentStyles: {
						backgroundColor: node.style.backgroundColor,
						borderStyle: node.style.borderStyle,
						borderColor: node.style.borderColor,
					},
					rootZIndex: options.rootZIndex,
				},
				zIndexes,
			);
		}

		if (clipped) {
			output.unclip();
		}
	}

	if (node.nodeName === 'ink-root' || options.isZIndexRoot) {
		for (const level of zIndexes) {
			level.cb();
		}
	}
};

export default renderNodeToOutput;
