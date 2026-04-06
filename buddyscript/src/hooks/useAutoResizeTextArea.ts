import { useEffect, RefObject } from 'react';

export function useAutoResizeTextArea(
  textAreaRef: RefObject<HTMLTextAreaElement>,
  value: string
) {
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = scrollHeight + 'px';
    }
  }, [textAreaRef, value]);
}
