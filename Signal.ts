/**
 * @package IceMonkey
 * @author gh Corgice @IceSandwich
 * @license GPL v3
 */

type SignalCallback<T> = (data?: T) => boolean;

class IM_SignalHandler<T> {
	private m_isEnable: boolean;
	private m_callback: SignalCallback<T>;
	private m_id: number;
	constructor(callback: SignalCallback<T>, id: number) {
		this.m_callback = callback;
		this.m_isEnable = true;
		this.m_id = id;
	}
	Disable() {
		this.m_isEnable = false;
	}
	Enable() {
		this.m_isEnable = true;
	}
	IsEnable() {
		return this.m_isEnable;
	}
	Call(data?: T) {
		if (data) {
			this.m_callback(data);
		} else {
			this.m_callback();
		}
	}
	GetId() {
		return this.m_id;
	}
}

export class IM_Signal<T = undefined> {
	private m_signals = new Map<number, IM_SignalHandler<T>>();
	private m_idCounter: number = 0;
	Emit(data?: T) {
		for (const [_, handler] of this.m_signals) {
			if (handler.IsEnable()) {
				if (data) {
					handler.Call(data);
				} else {
					handler.Call();
				}
			}
		}
	}

	/**
	 * Connect a function to this signal.
	 * @param func callback function, return true to stop propagation.
	 * @returns the handler of the callback function
	 */
	Connect(func: SignalCallback<T>) : IM_SignalHandler<T> {
		let ret = new IM_SignalHandler(func, this.m_idCounter);
		this.m_signals.set(this.m_idCounter, ret);
		this.m_idCounter += 1;
		return ret;
	}
}

export function IM_SignalAll(...args: IM_Signal[]) {
	let finished = 0;
	let allSignal = new IM_Signal();
	for (var i = 0; i < args.length; ++i) {
		args[i].Connect(() => {
			finished += 1;
			if (finished == args.length) {
				allSignal.Emit();
			}
			return false;
		});
	}
	return allSignal;
}