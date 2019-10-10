import * as path from 'path';
import * as fs from 'fs';
import version from './version';
import * as vscode from 'vscode';

const cssName: string = vscode.version >= "1.38" ? 'workbench.desktop.main.css' : 'workbench.main.css';
export class FileDom {

	// 文件路径
	private filePath = path.join(path.dirname((require.main as NodeModule).filename), 'vs', 'workbench', cssName);
	private extName = "backgroundCover";
	private imagePaths: string[] = [];
	private imageOpacity: number = 0.2;
	private duration: number = 900;


	constructor(imagePath: string | string[], opacity: number, duration: number) {
		this.imagePaths = imagePath instanceof Array
			? imagePath.map(image => image.replace(/\\/g, '/'))
			: [imagePath];
		this.imageOpacity = opacity;
		this.duration = duration;
	}


	public install(): boolean {
		let content: any = this.getCss().replace(/\s*$/, ''); // 去除末尾空白
		if (content === '') {
			return false;
		}
		// 添加代码到文件中，并尝试删除原来已经添加的
		let newContent = this.getContent();
		newContent = this.clearCssContent(newContent);
		newContent += content;
		this.saveContent(newContent);
		return true;
	}

	private getCss(): string {
		const imageLength = this.imagePaths.length;
		// 重新计算透明度
		let opacity = this.imageOpacity;
		opacity = opacity <= 0.1 ? 0.1 : opacity >= 1 ? 1 : opacity;
		opacity = 0.79 + (0.2 - ((opacity * 2) / 10));

		const percentage = 1 * 100 / (imageLength * this.duration);
		const step = Number((100 / imageLength).toFixed(3));
		const css = `
		/*ext-${this.extName}-start*/
		/*ext.${this.extName}.ver.${version}*/
		body{
			opacity: ${opacity};
			animation-delay: 2s;
			background-size: cover;
			animation-name: kenburns;
			animation-timing-function: ${imageLength <= 1 ? '1' : 'linear'};
			animation-iteration-count: infinite;
			animation-duration: ${imageLength * this.duration}s;
		}
		@keyframes kenburns {
			0% {
				background-image: url('${this.imagePaths[0]}');
			}
			${
				this.imagePaths.map((_image, index) => {
					if (index === 0) {
						return '';
					}
					return `
					${index * step - percentage}% {
						background-image: url('${this.imagePaths[index - 1]}');
					}
					${index * step}% {
						background-image: url('${this.imagePaths[index]}');
					}
					`
				}).join('')
			}
			${100 - percentage}% {
				background-image: url('${this.imagePaths[imageLength - 1]}');
			}
			100% {
				background-image: url('${this.imagePaths[0]}');
			}
		}
		/*ext-${this.extName}-end*/
		`;
		return css;
	}


	/**
    * 获取文件内容
    * @var mixed
    */
	private getContent(): string {
		return fs.readFileSync(this.filePath, 'utf-8');
	}

	/**
    * 设置文件内容
    *
    * @private
    * @param {string} content
    */
	private saveContent(content: string): void {
		fs.writeFileSync(this.filePath, content, 'utf-8');
	}

	/**
	* 清理已经添加的代码
	*
	* @private
	* @param {string} content
	* @returns {string}
	*/
	private clearCssContent(content: string): string {
		let re = new RegExp("\\/\\*ext-" + this.extName + "-start\\*\\/[\\s\\S]*?\\/\\*ext-" + this.extName + "-end\\*" + "\\/", "g");
		content = content.replace(re, '');
		content = content.replace(/\s*$/, '');
		return content;
	}

	/**
	* 卸载
	*
	* @private
	*/
	public uninstall(): boolean {
		try {
			let content = this.getContent();
			content = this.clearCssContent(content);
			this.saveContent(content);
			return true;
		} catch (ex) {
			//console.log(ex);
			return false;
		}
	}
}