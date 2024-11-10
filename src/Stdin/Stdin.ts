import Mouse from './Mouse.js';
import Keyboard from './Keyboard.js';

/*
 * Stdin.handleStdin parses input from the keyboard and mouse.
 *
 * When Keyboard input is recieved, it updates the Keyboard register which stores
 * the last 2 keypresses by default.  useKeymap hooks are subscribed to keypress
 * events and they check if there are any keymap matches.  If there are, they will
 * emit the corresponding events.  The useEvent hook is used to subscribe to events
 * emitted from the useKeymap hook.
 *
 * When Mouse input is recieved, events are emitted for the type of mouse input
 * recieved (click, right click, double click, scroll, etc...).  The x,y position
 * of the click is dispatched with that event as well.  A click event for example
 * checks to see if any components contain the x,y point where the click event
 * happened and if so, executes any assigned callbacks.
 * */

export const EVENT = {
	keypress: 'KEYPRESS',
	mouse: 'MOUSE',
	data: 'data',
} as const;

class Stdin {
	public Mouse: Mouse;
	public Keyboard: Keyboard;
	private mouseEnabled: boolean;
	private listening: boolean;

	constructor() {
		this.Mouse = new Mouse();
		this.Keyboard = new Keyboard();
		this.mouseEnabled = false;
		this.listening = false;
	}

	public setMouseReporting = (b: boolean) => {
		this.Mouse.setMouseReporting(b);
		this.mouseEnabled = b;
	};

	public listen = (): void => {
		if (this.listening) return;

		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
		} else {
			return console.warn('Raw mode not supported.  Stdin not supported');
		}

		process.stdin.setEncoding('hex');
		process.stdin.on('data', this.handleStdin);
		this.mouseEnabled && this.Mouse.listen();
		// Keyboard listeners are added/removed in through hooks in the app

		this.listening = true;
	};

	public pause = (): void => {
		process.stdin.off('data', this.handleStdin);
		this.Mouse.pause();
		this.listening = false;
	};

	private handleStdin = (stdin: string): void => {
		// Handle SIGINT
		if (stdin === '03') {
			process.exit();
		}

		const buffer = Buffer.from(stdin, 'hex');

		if (this.mouseEnabled && this.Mouse.isMouseEvent(buffer)) {
			this.Mouse.handleStdin(buffer);
		} else {
			this.Keyboard.handleStdin(buffer);
		}
	};
}

// ALT_STDIN for alt screen states from 'tput rmcup/smcup' commands that still need
// some sort of input to switch back to default input.
export const STDIN = new Stdin();
export const ALT_STDIN = new Stdin();