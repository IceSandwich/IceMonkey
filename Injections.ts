/**
 * @package IceMonkey
 * @author gh Corgice @IceSandwich
 * @license GPL v3
 */


export interface IM_IScriptHook {
	CheckAvailable(url: string): boolean;
	Process(jsCode: string, url: string): string;
}

export function IM_FindClosedBracketLocation(str: string, start: number,
	increaseLevel: string[] = ["{", "[", "("],
	decreaseLevel: string[] = ["}", "]", ")"]
) {
	let level = 0;
	for (var i = start; i < str.length; ++i) {
		if (increaseLevel.indexOf(str[i])!= -1) {
			++level;
		} else if (decreaseLevel.indexOf(str[i])!= -1) {
			--level;
			if (level <= 0) {
				return i;
			}
		}
	}
	return -1;
}

export class IM_BeforeScriptExecute {
	private static m_logging: IM_Logging = new IM_Logging("IM_BeforeScriptExecute");
	private static m_processors: IM_IScriptHook[] = [];
	private static m_canRemoveEventAtLoad: boolean = true;
	private static m_cacheScriptEventFunc: (e: Event) => void;
	private static m_cacheLoadEventFunc: (e: Event) => void;

	private static windowEvent(e: Event) {
		let src = ((e.target) as any).src;
		// this.logging.Info("src: ", src, ", processors: ", this.processors.length);
		let isEnable = this.m_processors.reduce((pv, cv) => pv && cv.CheckAvailable(src), true);
		if (!isEnable || this.m_processors.length == 0) return;

		e.preventDefault();
		e.stopPropagation();

		let jsCode = IM_RequestSyncGet(src).responseText;
		for (var i = 0; i < this.m_processors.length; i++) {
			jsCode = this.m_processors[i].Process(jsCode, src);
		}

		var obj = document.createElement('script');
		obj.type = "text/javascript";
		obj.text = jsCode;
		
		var node = e.target as Node;
		node.parentNode?.replaceChild(obj, node);
	}

	private static removeEventAtLoad(e: Event) {
		if (this.m_canRemoveEventAtLoad) {
			this.m_logging.Info("unregister event listener");
			window.removeEventListener('beforescriptexecute', this.m_cacheScriptEventFunc, true);
			this.m_processors = [];
		}
		window.removeEventListener('load', this.m_cacheLoadEventFunc, true);
	}

	static AddHook(hook: IM_IScriptHook) {
		if (this.m_processors.length == 0) {
			this.m_logging.Info("register event listener");

			this.m_cacheScriptEventFunc = this.windowEvent.bind(this);
			this.m_cacheLoadEventFunc = this.removeEventAtLoad.bind(this);
			window.addEventListener('beforescriptexecute', this.m_cacheScriptEventFunc, true);
			window.addEventListener('load', this.m_cacheLoadEventFunc, true);
		}

		this.m_processors.push(hook);
		return this.m_processors[this.m_processors.length - 1];
	}

	static SetRemoveEventAtLoad(value: boolean) {
		this.m_canRemoveEventAtLoad = value;
	}

	static Size(): number {
		return this.m_processors.length;
	}

	static At(index: number): IM_IScriptHook {
		return this.m_processors[index];
	}

};