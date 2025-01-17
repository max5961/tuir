import React from 'react';
import {Except} from 'type-fest';
import {CliProps, AbstractCli} from './AbstractCli.js';
import {Props as ModalProps, Modal} from '../modal/Modal.js';
import {useModal} from '../modal/useModal.js';

type CliModalProps = CliProps & Except<ModalProps, 'modal'>;
export function CliModal(props: CliModalProps): React.ReactNode {
	const {
		config,
		enterKeymap = [{input: ':'}],
		exitKeymap = [{key: 'return'}, {key: 'esc'}],
		prompt,
		inputStyles,
		resolveStyles,
		rejectStyles,
		persistPrompt,
		...modalProps
	} = props;

	const {modal, hideModal, showModal} = useModal({
		show: enterKeymap,
		hide: null,
	});

	return (
		<Modal modal={modal} {...modalProps}>
			<AbstractCli
				config={config}
				autoEnter={true}
				enterKeymap={enterKeymap}
				exitKeymap={exitKeymap}
				hideModal={hideModal}
				showModal={showModal}
				prompt={prompt}
				persistPrompt={persistPrompt}
				inputStyles={inputStyles}
				resolveStyles={resolveStyles}
				rejectStyles={rejectStyles}
			/>
		</Modal>
	);
}