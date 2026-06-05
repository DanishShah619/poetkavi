"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { useRoom, useSelf } from "@liveblocks/react";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import DOMPurify from "dompurify";

interface CollaborativeEditorProps {
  initialContent: string;
  onSaveCheckpoint: (html: string) => Promise<void> | void;
}

export function CollaborativeEditor({
  initialContent,
  onSaveCheckpoint,
}: CollaborativeEditorProps) {
  const room = useRoom();
  const self = useSelf();
  const selfName = (self?.info?.name as string | undefined) ?? "Anonymous";
  const selfColor = getRandomColor(self?.id ?? "");

  // getYjsProviderForRoom is the recommended modern Liveblocks API.
  // It manages both the Yjs document and the Liveblocks WebSocket connection internally.
  // Memoised in useState so it is created exactly once per component mount.
  const [provider] = useState(() => getYjsProviderForRoom(room));

  // Refs for tracking content changes to avoid redundant Firestore writes
  const lastSavedHtml = useRef<string>("");
  const isDirty = useRef<boolean>(false);
  const isSeeded = useRef<boolean>(false);
  const lastCaretUserKey = useRef<string>("");

  // Destroy provider on unmount to prevent connection leaks
  useEffect(() => {
    return () => {
      provider.destroy();
    };
  }, [provider]);

  // Configure editor once — will not be re-created during subsequent state updates
  const extensions = useMemo(
    () => [
      StarterKit, // Collaboration extension automatically disables Tiptap's built-in history
      Collaboration.configure({ document: provider.getYDoc() }),
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: "Anonymous",
          color: getRandomColor(""),
        },
      }),
    ],
    [provider]
  );

  const editor = useEditor({
    extensions,
  });

  // 1. Dynamic Cursor Updates: Re-bind active user details once Liveblocks presence resolves
  useEffect(() => {
    if (!editor) return;

    const caretUserKey = `${selfName}:${selfColor}`;
    if (lastCaretUserKey.current === caretUserKey) return;

    lastCaretUserKey.current = caretUserKey;
    editor.commands.updateUser({
      name: selfName,
      color: selfColor,
    });
  }, [editor, selfName, selfColor]);

  // 2. Initial Seeding: Populate an empty Yjs document with the poem's existing Firestore content.
  //    Only runs once (guarded by isSeeded ref) and only if the collaborative doc is blank.
  useEffect(() => {
    if (!editor || isSeeded.current) return;

    const xmlFragment = provider.getYDoc().getXmlFragment("default");

    if (xmlFragment.length === 0 && initialContent) {
      editor.commands.setContent(initialContent);
      lastSavedHtml.current = DOMPurify.sanitize(initialContent);
    }
    isSeeded.current = true;
  }, [editor, initialContent, provider]);

  // 3. Optimized Autosave with dirty-state guard and max-wait ceiling
  useEffect(() => {
    if (!editor) return;

    let debounceTimeoutId: ReturnType<typeof setTimeout>;
    let maxWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const saveContent = async () => {
      if (!isDirty.current) return;

      const rawHtml = editor.getHTML();
      const safeHtml = DOMPurify.sanitize(rawHtml);

      // Only write to Firestore if content has genuinely changed
      if (safeHtml !== lastSavedHtml.current) {
        lastSavedHtml.current = safeHtml;
        isDirty.current = false;
        try {
          await onSaveCheckpoint(safeHtml);
        } catch (error) {
          console.error("Autosave failed:", error);
        }
      }
    };

    const handleUpdate = () => {
      isDirty.current = true;
      clearTimeout(debounceTimeoutId);

      // Debounce: save 5 seconds after the user stops typing
      debounceTimeoutId = setTimeout(saveContent, 5000);

      // Max-wait ceiling: force a save at least every 30 seconds during continuous writing
      if (!maxWaitTimeoutId) {
        maxWaitTimeoutId = setTimeout(() => {
          saveContent();
          maxWaitTimeoutId = null;
        }, 30000);
      }
    };

    editor.on("update", handleUpdate);

    // Flush unsaved changes if the user closes or refreshes the tab
    const handleBeforeUnload = () => {
      if (isDirty.current) {
        saveContent();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      editor.off("update", handleUpdate);
      clearTimeout(debounceTimeoutId);
      if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editor, onSaveCheckpoint]);

  return (
    <div className="w-full">
      <EditorContent
        editor={editor}
        className="prose prose-invert max-w-none border border-neutral-800 rounded-xl p-6 bg-neutral-950 text-white min-h-[300px] focus:outline-none"
      />
    </div>
  );
}

function getRandomColor(id: string): string {
  const colors = [
    "#f87171",
    "#fb923c",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#818cf8",
    "#c084fc",
  ];
  const index =
    Math.abs(
      id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % colors.length;
  return colors[index];
}
