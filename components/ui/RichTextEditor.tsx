import React, { useCallback, useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createEditor, Descendant, Editor, Element as SlateElement, Transforms, Text, BaseEditor } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';

// --- TYPES ---

interface RichTextEditorProps {
  content: string; // HTML string passed in
  onChange: (html: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  editable?: boolean;
}

export interface RichTextEditorRef {
  insertContent: (text: string) => void;
  focus: () => void;
  clear: () => void;
}

type CustomElement = { type: 'paragraph' | 'block-quote' | 'bulleted-list' | 'list-item' | 'code-block'; children: CustomText[] };
type CustomText = { text: string; bold?: boolean; italic?: boolean; code?: boolean; underline?: boolean };

// --- CONSTANTS & HOTKEYS ---

const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['bulleted-list'];

// --- SERIALIZATION (HTML <-> SLATE) ---

const serialize = (node: Descendant): string => {
  if (Text.isText(node)) {
    const text = node as CustomText;
    let string = escapeHtml(text.text);
    if (text.bold) string = `<strong>${string}</strong>`;
    if (text.italic) string = `<em>${string}</em>`;
    if (text.underline) string = `<u>${string}</u>`;
    if (text.code) string = `<code>${string}</code>`;
    return string;
  }

  const children = node.children.map(n => serialize(n)).join('');

  switch ((node as CustomElement).type) {
    case 'block-quote':
      return `<blockquote><p>${children}</p></blockquote>`;
    case 'bulleted-list':
      return `<ul>${children}</ul>`;
    case 'list-item':
      return `<li>${children}</li>`;
    case 'code-block':
      return `<pre><code>${children}</code></pre>`;
    case 'paragraph':
      return `<p>${children}</p>`;
    default:
      return children;
  }
};

const deserialize = (el: HTMLElement): Descendant | Descendant[] | null => {
  if (el.nodeType === 3) {
    return { text: el.textContent || '' };
  } else if (el.nodeType !== 1) {
    return null;
  }

  const nodeEl = el as HTMLElement;
  let children: Descendant[] = Array.from(nodeEl.childNodes)
    .map(deserialize)
    .flat()
    .filter(Boolean) as Descendant[];

  if (children.length === 0) {
    children = [{ text: '' }];
  }

  switch (nodeEl.nodeName) {
    case 'BODY':
      return children; // Root
    case 'BR':
      return { text: '\n' };
    case 'BLOCKQUOTE':
      return { type: 'block-quote', children } as CustomElement;
    case 'UL':
      return { type: 'bulleted-list', children } as CustomElement;
    case 'LI':
      return { type: 'list-item', children } as CustomElement;
    case 'PRE':
      return { type: 'code-block', children } as CustomElement;
    case 'P':
      return { type: 'paragraph', children } as CustomElement;
    case 'A':
      return { text: nodeEl.textContent || '' }; // Simplify links to text for now
    case 'STRONG':
    case 'B':
      return children.map(child => Text.isText(child) ? { ...child, bold: true } : child);
    case 'EM':
    case 'I':
      return children.map(child => Text.isText(child) ? { ...child, italic: true } : child);
    case 'U':
      return children.map(child => Text.isText(child) ? { ...child, underline: true } : child);
    case 'CODE':
      return children.map(child => Text.isText(child) ? { ...child, code: true } : child);
    default:
      return children;
  }
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// --- TOOLBAR ---

const ToggleButton = ({ format, icon: Icon, title }: { format: string, icon: React.ReactNode, title: string }) => {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format) || isMarkActive(editor, format);

  return (
    <button
      onMouseDown={(event) => {
        event.preventDefault();
        if (LIST_TYPES.includes(format) || format === 'block-quote' || format === 'code-block') {
            toggleBlock(editor, format);
        } else {
            toggleMark(editor, format);
        }
      }}
      className={`p-2 rounded-lg transition-all active:scale-90 ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
          : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500 dark:hover:text-indigo-400'
      }`}
      title={title}
    >
      {Icon}
    </button>
  );
};

const Toolbar = () => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 mb-2 overflow-x-auto no-scrollbar">
      <ToggleButton format="bold" title="Bold" icon={<span className="font-black text-xs">B</span>} />
      <ToggleButton format="italic" title="Italic" icon={<span className="italic font-bold text-xs serif">I</span>} />
      <ToggleButton format="underline" title="Underline" icon={<span className="underline font-bold text-xs">U</span>} />
      <ToggleButton format="code" title="Inline Code" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>} />
      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
      <ToggleButton format="code-block" title="Code Block" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>} />
      <ToggleButton format="block-quote" title="Quote" icon={<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" /></svg>} />
      <ToggleButton format="bulleted-list" title="Bullet List" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>} />
    </div>
  );
};

// --- LOGIC HELPERS ---

const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  // @ts-ignore
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as CustomElement).type),
    split: true,
  });

  const newProperties: Partial<CustomElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format as any,
  };
  Transforms.setNodes<CustomElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] } as any;
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// --- MAIN COMPONENT ---

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, placeholder, onFocus, editable = true }, ref) => {
    // Initialize editor only once
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);
    
    // Initial State parsing
    const initialValue = useMemo(() => {
        if (!content) return [{ type: 'paragraph', children: [{ text: '' }] }];
        // Parse HTML to Slate JSON
        const parsed = new DOMParser().parseFromString(content, 'text/html');
        const deserialized = deserialize(parsed.body);
        if (Array.isArray(deserialized) && deserialized.length > 0) return deserialized;
        return [{ type: 'paragraph', children: [{ text: '' }] }];
    }, []); // Only run once on mount

    const [value, setValue] = useState<Descendant[]>(initialValue as Descendant[]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        insertContent: (text: string) => {
            // Check if we have focus, if not, focus end
            ReactEditor.focus(editor);
            Transforms.select(editor, Editor.end(editor, []));
            Editor.insertText(editor, text);
        },
        focus: () => {
            ReactEditor.focus(editor);
        },
        clear: () => {
            Transforms.delete(editor, {
                at: {
                    anchor: Editor.start(editor, []),
                    focus: Editor.end(editor, []),
                },
            });
            // Reset to empty paragraph to avoid Slate errors
            Transforms.removeNodes(editor, { at: [0] });
            Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] } as CustomElement, { at: [0] });
        }
    }));

    // Handle External Content Updates (e.g. resets from parent)
    useEffect(() => {
       if (content === '' && editor.children.length > 0) {
           // Check if it's already empty
           const isEmpty = editor.children.length === 1 && (editor.children[0] as CustomElement).children[0].text === '' && (editor.children[0] as CustomElement).type === 'paragraph';
           if (!isEmpty) {
                // If parent says empty but we are not, clear it
                // This is a bit tricky with Slate's controlled/uncontrolled nature. 
                // We trust the local state 'value' mostly, but if parent forces clear (empty string), we reset.
                // However, doing this on every render might lose cursor or partial edits if sync is slow.
                // Best practice: The parent clears via the ref.clear() method we exposed.
                // But if we strictly need to sync:
                // setValue([{ type: 'paragraph', children: [{ text: '' }] }]);
                // editor.children = [{ type: 'paragraph', children: [{ text: '' }] }];
           }
       }
    }, [content, editor]);

    // Renderers
    const renderElement = useCallback((props: any) => {
        switch (props.element.type) {
            case 'block-quote':
                return <blockquote {...props.attributes} className="border-l-4 border-indigo-500 pl-4 italic text-slate-500 my-2">{props.children}</blockquote>;
            case 'bulleted-list':
                return <ul {...props.attributes} className="list-disc pl-5 my-2">{props.children}</ul>;
            case 'list-item':
                return <li {...props.attributes}>{props.children}</li>;
            case 'code-block':
                return (
                    <pre {...props.attributes} className="bg-slate-900 text-slate-50 p-4 rounded-xl font-mono text-xs my-2 overflow-x-auto">
                        <code>{props.children}</code>
                    </pre>
                );
            default:
                return <p {...props.attributes} className="mb-1">{props.children}</p>;
        }
    }, []);

    const renderLeaf = useCallback((props: any) => {
        let { children } = props;
        if (props.leaf.bold) children = <strong>{children}</strong>;
        if (props.leaf.code) children = <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-xs">{children}</code>;
        if (props.leaf.italic) children = <em>{children}</em>;
        if (props.leaf.underline) children = <u>{children}</u>;
        return <span {...props.attributes}>{children}</span>;
    }, []);

    const onKeyDown = (event: React.KeyboardEvent) => {
        for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey];
                toggleMark(editor, mark);
            }
        }
    };

    const handleChange = (newValue: Descendant[]) => {
        setValue(newValue);
        // Serialize to HTML for parent consumption
        const html = newValue.map(node => serialize(node)).join('');
        onChange(html);
    };

    return (
      <div className="w-full">
        {editable && <Toolbar />}
        <Slate editor={editor} initialValue={value} onChange={handleChange}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            readOnly={!editable}
            className="focus:outline-none min-h-[60px] text-lg font-medium text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert max-w-none"
          />
        </Slate>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';