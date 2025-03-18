import { DOMElement } from "../dom.js";
import { Title } from "../renderTitles/renderTitleToOutput.js";
import ElementPosition from "./ElementPosition.js";
import { DefaultStdin } from "./Stdin.js";
import { CornerPositions } from "./ElementPosition.js";

export function addTitleEventListeners({
	node,
	zIndexRoot,
	title,
	titleType,
	targetPosition,
}: {
	// The current 'level' in the zIndex stack this node is on, not its zIndex property
	zIndexRoot: number;
	node: DOMElement;
	title: Title;
	titleType: string;
	targetPosition: CornerPositions;
}): void {
	const ID = node.attributes["ID"] as string;
	const isPageFocus = node.attributes["isPageFocus"] as boolean;
	const shouldSubscribe =
		title.onClick ||
		title.onRightClick ||
		title.onDoubleClick ||
		title.onRightDoubleClick ||
		title.onMouseDown ||
		title.onMouseUp ||
		title.onRightMouseUp ||
		title.onRightMouseDown ||
		title.onScrollClick ||
		title.onScrollDown ||
		title.onScrollUp;

	if (!title || !isPageFocus || !shouldSubscribe) return;

	DefaultStdin.Mouse.subscribeTitle({
		title: title,
		ID: `${titleType}-${ID}`,
		target: ElementPosition.getNode(node),
		targetPosition: targetPosition,
		zIndex: zIndexRoot,
	});
}
