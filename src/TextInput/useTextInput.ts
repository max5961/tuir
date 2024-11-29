import {useState} from 'react';
import {deepEqual} from '../util.js';

export type State = {
	value: string;
	idx: number;
	insert: boolean;
	stdin: null | string;
	window: {
		start: number;
		end: number;
	};
};

export type Return = {
	value: State['value'];
	insert: boolean;
	onChange: () => {state: State; update: (nextState: State) => void};
	setValue: (nextValue: string) => void;
	enterInsert: () => void;
};

export function useTextInput(initialValue: string = ''): Return {
	const [state, setState] = useState<State>({
		value: initialValue,
		idx: initialValue.length,
		insert: false,
		stdin: null,
		window: {
			start: 0,
			end: initialValue.length,
		},
	});

	const onChange = () => {
		return {
			update(nextState: State): void {
				setState(prev => {
					if (!deepEqual(prev, nextState)) {
						return nextState;
					} else {
						return prev;
					}
				});
			},
			state,
		};
	};

	const enterInsert = () => {
		if (!state.insert) {
			setState(prev => {
				return {...prev, insert: true};
			});
		}
	};

	const setValue = (nextValue: string) => {
		// setState({...state, value: nextValue});
		setState(prev => {
			return {...prev, value: nextValue};
		});
	};

	return {
		value: state.value,
		insert: state.insert,
		onChange: onChange,
		setValue: setValue,
		enterInsert: enterInsert,
	};
}