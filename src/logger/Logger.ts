import { Color } from "../utility/types.js";
import path from "path";
import fs from "fs";
import chalk from "chalk";

export type Props = {
	file?: string;
	time?: boolean;
	color?: Exclude<Color, undefined> | null;
	prefix?: string | null;
	prefixColor?: Exclude<Color, undefined> | null;
};

export class Logger {
	private _file: Props["file"];
	private _time: Props["time"];
	private _color: Props["color"];
	private _prefix: Props["prefix"];
	private _prefixColor: Props["color"];
	private _validPaths: Set<string>;

	static Default = {
		file: "console.log",
		time: true,
		color: null,
		prefixColor: null,
		prefix: null,
	} as const;

	constructor(
		{
			file = Logger.Default.file,
			time = Logger.Default.time,
			color = Logger.Default.color,
			prefixColor = Logger.Default.prefixColor,
			prefix = Logger.Default.prefix,
		}: Props = Logger.Default,
	) {
		this._file = file;
		this._time = time;
		this._color = color;
		this._prefixColor = prefixColor;
		this._prefix = prefix;
		this._validPaths = new Set<string>();
		this.ensureValidPath(this._file);
	}

	public file(file: string): Logger {
		const next = Object.setPrototypeOf({}, this);
		return next.setFile(file);
	}

	public setFile(file: string): Logger {
		this._file = file;
		return this;
	}

	public time(b: boolean): Logger {
		const next = Object.setPrototypeOf({}, this);
		return next.setTime(b);
	}

	public setTime(b: boolean): Logger {
		this._time = b;
		return this;
	}

	public color(c: Props["color"]): Logger {
		const next = Object.setPrototypeOf({}, this);
		return next.setColor(c);
	}

	public setColor(c: Props["color"]): Logger {
		this._color = c;
		return this;
	}

	public setPrefix(val: string): Logger {
		this._prefix = val;
		return this;
	}

	public prefixColor(val: Props["color"]): Logger {
		const next = Object.setPrototypeOf({}, this);
		return next.setPrefixColor(val);
	}

	public setPrefixColor(val: Props["color"]): Logger {
		this._prefixColor = val;
		return this;
	}

	public clearLog(): Logger {
		fs.writeFileSync(path.resolve(this._file!), "");
		return this;
	}

	public write(...data: any[]): void {
		this.ensureValidPath(this._file!);
		const prefix = this.getPrefix();
		const formattedData = this.getFormattedData(...data);
		const time = this.getTime();
		const text = this.colorText(formattedData, this._color);
		const logStream = fs.createWriteStream(path.resolve(this._file!), {
			flags: "a",
		});
		logStream.write(time + prefix + text);
	}

	public prefix(...data: any[]): void {
		this.setPrefix(data[0]);
		this.write(...data.slice(1));
	}

	private getPrefix(): string {
		const prefix = this?._prefix;
		if (!prefix) return "";

		const separator = " ⇒ ";
		if (!this._prefixColor) {
			return prefix + separator;
		}
		return (chalk as any)[this._prefixColor](prefix + separator);
	}

	private getFormattedData(...data: any[]): string {
		// Check for circular references and any other errors that might occur
		const stringify = (...args: [any, any?, any?]) => {
			try {
				return { stringifiedData: JSON.stringify(...args), errors: false };
			} catch (err: unknown) {
				if (err instanceof Error) {
					return { stringifiedData: err.message, errors: true };
				}
				return { stringifiedData: "", errors: true };
			}
		};

		const formatData = (data: any) => {
			if (data === null) return "null";
			if (data === undefined) return "undefined";

			if (typeof data !== "string" && typeof data !== "number") {
				const { stringifiedData, errors } = stringify(data);

				if (stringifiedData.length > 25 && !errors) {
					return stringify(data, null, 4).stringifiedData;
				} else {
					return stringifiedData;
				}
			}

			return data;
		};

		let formattedData = "";
		for (let i = 0; i < data.length; ++i) {
			const comma = i !== 0 ? ", " : "";
			formattedData += `${comma}${formatData(data[i])}`;
		}
		formattedData += "\n";

		return formattedData;
	}

	private getTime(): string {
		if (!this._time) return "";

		const date = new Date();
		const times: string[] = [
			String(date.getHours()),
			String(date.getMinutes()),
			String(date.getSeconds()),
			String(date.getMilliseconds()),
		];

		for (let i = 0; i < times.length; ++i) {
			const desiredLength = i !== times.length - 1 ? 2 : 3;
			while (times[i]!.length < desiredLength) {
				times[i] = `0${times[i]}`;
			}
		}

		return `${times[0]}:${times[1]}:${times[2]}:${times[3]}: `;
	}

	private colorText(value: string, color?: Props["color"] | null): string {
		color = color ? color : this._color;

		if (color && (chalk as any)[color]) {
			return (chalk as any)[color](value);
		} else {
			return value;
		}
	}

	private ensureValidPath(filePath: string): void {
		if (this._validPaths.has(filePath)) return;
		this.validatePath(filePath.split("/"));
		this._validPaths.add(filePath);
	}

	private validatePath(p: string[]): void {
		if (p.length === 1) return;

		try {
			fs.statSync(path.resolve(p[0]!));
		} catch (err) {
			fs.mkdirSync(path.resolve(p[0]!));
		}

		const joined = p[1] ? [p[0], p[1]].join("/") : p[0];
		const next = p.length > 2 ? [joined, ...p.slice(2)] : [joined];

		return this.validatePath(next as string[]);
	}
}

export const logger = new Logger();
