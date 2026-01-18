import React from 'react';
import { Bold, Italic, List, ListOrdered, Image, Video } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { saveMediaFile, getMediaUrl } from '../services/tauri-service';

export const NotesToolbar = ({ editor, t, templateId }) => {
  if (!editor) {
    return null;
  }

  // 处理图片选择
  const handleImageSelect = async () => {
    try {
      let selected = null;
      
      // 尝试使用 Tauri 文件对话框（在桌面应用中可用）
      let isBrowserMode = false;
      try {
        const result = await open({
          multiple: false,
          directory: false,
          filters: [
            {
              name: 'Images',
              extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']
            }
          ],
        });
        selected = result;
      } catch (tauriError) {
        // 如果 Tauri API 不可用（浏览器模式），使用原生文件选择器
        if (tauriError.message && tauriError.message.includes('invoke')) {
          isBrowserMode = true;
          const file = await new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp';
            input.onchange = (e) => {
              resolve(e.target.files?.[0] || null);
            };
            input.oncancel = () => resolve(null);
            input.click();
          });
          
          if (!file) {
            return; // 用户取消了选择
          }
          
          // 浏览器模式下，保存文件并获取引用路径
          try {
            const mediaPath = await saveMediaFile(file, templateId || 'browser');
            if (mediaPath) {
              // 浏览器模式下，getMediaUrl 会返回 Blob URL
              const imageUrl = await getMediaUrl(mediaPath);
              const imageHtml = imageUrl 
                ? `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`
                : `<img src="${mediaPath}" alt="Image" style="max-width: 100%; height: auto;" />`;
              editor.chain().focus().insertContent(imageHtml).run();
            }
          } catch (error) {
            console.error('Error saving image file:', error);
          }
          return; // 浏览器模式处理完成，提前返回
        } else {
          throw tauriError;
        }
      }

      if (!selected || Array.isArray(selected)) {
        return; // 用户取消或选择了多个文件
      }

      // Tauri 模式：保存文件到应用目录，使用路径引用
      try {
        // selected 是文件路径字符串
        console.log('Saving image file:', selected);
        const mediaPath = await saveMediaFile(selected, templateId || 'unknown');
        console.log('Media path returned:', mediaPath);
        if (mediaPath) {
          // 将 media:// 路径转换为可访问的 URL 用于显示
          const imageUrl = await getMediaUrl(mediaPath);
          console.log('Image URL for display:', imageUrl);
          // 使用转换后的 URL 插入图片，但保存时会转换回 media:// 路径
          const imageHtml = imageUrl 
            ? `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`
            : `<img src="${mediaPath}" alt="Image" style="max-width: 100%; height: auto;" />`;
          console.log('Inserting image HTML:', imageHtml);
          // 确保编辑器有焦点，防止 useEffect 覆盖内容
          editor.chain().focus().insertContent(imageHtml).run();
          console.log('Image inserted, editor content:', editor.getHTML());
        } else {
          console.error('Failed to save image file: mediaPath is empty');
        }
      } catch (error) {
        console.error('Error saving image file:', error);
        console.error('Error details:', error.message, error.stack);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  // 处理视频选择
  const handleVideoSelect = async () => {
    try {
      let selected = null;
      
      // 尝试使用 Tauri 文件对话框（在桌面应用中可用）
      try {
        const result = await open({
          multiple: false,
          directory: false,
          filters: [
            {
              name: 'Videos',
              extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
            }
          ],
        });
        selected = result;
      } catch (tauriError) {
        // 如果 Tauri API 不可用（浏览器模式），使用原生文件选择器
        if (tauriError.message && tauriError.message.includes('invoke')) {
          const file = await new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/mp4,video/mov,video/avi,video/webm';
            input.onchange = (e) => {
              resolve(e.target.files?.[0] || null);
            };
            input.oncancel = () => resolve(null);
            input.click();
          });
          
          if (!file) {
            return; // 用户取消了选择
          }
          
          // 浏览器模式下，保存文件并获取引用路径
          try {
            const mediaPath = await saveMediaFile(file, templateId || 'browser');
            if (mediaPath) {
              // 浏览器模式下，getMediaUrl 会返回 Blob URL
              const videoUrl = await getMediaUrl(mediaPath);
              const videoHtml = videoUrl
                ? `<video src="${videoUrl}" controls style="max-width: 100%;" />`
                : `<video src="${mediaPath}" controls style="max-width: 100%;" />`;
              editor.chain().focus().insertContent(videoHtml).run();
            }
          } catch (error) {
            console.error('Error saving video file:', error);
          }
          return; // 浏览器模式处理完成，提前返回
        } else {
          throw tauriError;
        }
      }

      if (!selected || Array.isArray(selected)) {
        return; // 用户取消或选择了多个文件
      }

      // Tauri 模式：保存文件到应用目录，使用路径引用
      try {
        // selected 是文件路径字符串
        const mediaPath = await saveMediaFile(selected, templateId || 'unknown');
        if (mediaPath) {
          // 将 media:// 路径转换为可访问的 URL 用于显示
          const videoUrl = await getMediaUrl(mediaPath);
          const videoHtml = videoUrl
            ? `<video src="${videoUrl}" controls style="max-width: 100%;" />`
            : `<video src="${mediaPath}" controls style="max-width: 100%;" />`;
          editor.chain().focus().insertContent(videoHtml).run();
        } else {
          console.error('Failed to save video file');
        }
      } catch (error) {
        console.error('Error saving video file:', error);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // 防止按钮获得焦点，避免编辑器失去焦点
          editor.chain().focus().toggleBold().run();
        }}
        className={`p-2 rounded transition-colors ${
          editor.isActive('bold') 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="加粗"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // 防止按钮获得焦点，避免编辑器失去焦点
          editor.chain().focus().toggleItalic().run();
        }}
        className={`p-2 rounded transition-colors ${
          editor.isActive('italic') 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="斜体"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        className={`p-2 rounded transition-colors ${
          editor.isActive('bulletList') 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="无序列表"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        className={`p-2 rounded transition-colors ${
          editor.isActive('orderedList') 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="有序列表"
      >
        <ListOrdered size={16} />
      </button>
      <button 
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleImageSelect();
        }}
        className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
        title={t('upload_image') || '插入图片'}
      >
        <Image size={16} />
      </button>
      <button 
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleVideoSelect();
        }}
        className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
        title={t('upload_video') || '插入视频'}
      >
        <Video size={16} />
      </button>
    </div>
  );
};
