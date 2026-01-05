import { diffChars } from 'diff';

const diff = (oldText, newText) => {
  const changes = diffChars(oldText, newText);
  
  const result = [];
  changes.forEach(part => {
    // green for additions, red for deletions, grey for common
    if (part.added) {
      result.push({ type: 'added', content: part.value });
    } else if (part.removed) {
      result.push({ type: 'deleted', content: part.value });
    } else {
      result.push({ type: 'common', content: part.value });
    }
  });
  
  return result;
};

export default diff;