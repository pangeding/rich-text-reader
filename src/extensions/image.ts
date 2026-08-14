import { Image } from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/react";
import { convertFileSrc } from "@tauri-apps/api/core";

/**
 * 当前文档所在目录（不含文件名）。用于把 markdown 里的相对图片路径
 * 转换为 webview 可加载的 asset 协议 URL，同时不影响保存时的相对路径。
 */
export const imageBaseDir: { current: string | null } = { current: null };

export const RichImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string | undefined;
    let displaySrc = src;
    if (
      imageBaseDir.current &&
      src &&
      !src.startsWith("data:") &&
      !/^(https?:)?\/\//i.test(src) &&
      !/^file:/i.test(src)
    ) {
      displaySrc = convertFileSrc(`${imageBaseDir.current}/${src}`);
    }
    return ["img", mergeAttributes(HTMLAttributes, { src: displaySrc })];
  },
});
