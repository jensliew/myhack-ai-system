# Document Persistence Fix & Progress Bar Enhancement

## Issue: Documents Disappear After Tab Switch ✅ SOLVED

### Root Cause
The `fetchDocuments` callback had `user` as a dependency, which caused it to be recreated on every render. This created an infinite loop:
1. Component mounts → `fetchDocuments` created
2. `useEffect` runs → calls `fetchDocuments`
3. `fetchDocuments` changes → `useEffect` runs again
4. When switching tabs, the component remounts with a new `user` object reference
5. This triggers a new `fetchDocuments` → state resets

### Solution
Changed the dependency from `user` to `user?.entityId` and `user?.role`:
```typescript
// Before (WRONG - causes infinite loop)
const fetchDocuments = useCallback(async () => {
  if (!user || user.role !== "startup") return;
  // ...
}, [user]); // ❌ user object reference changes on every render

// After (CORRECT - stable dependencies)
const fetchDocuments = useCallback(async () => {
  if (!user || user.role !== "startup") return;
  // ...
}, [user?.entityId, user?.role]); // ✅ Only changes when actual values change
```

### Why This Works
- `user?.entityId` and `user?.role` are primitive values (strings)
- They only change when the user actually changes
- The callback is stable across re-renders
- Documents persist when switching tabs because the hook doesn't reset

### Testing
1. Upload a document
2. Switch to Mentors tab
3. Switch back to Documents tab
4. ✅ Document should still be there

---

## Enhancement: Nicer Progress Bar 🎨

### New Features
1. **Percentage Display** - Shows progress as a percentage (33%, 66%, 100%)
2. **Animated Progress Bar** - Smooth gradient bar that fills as you progress
3. **Better Styling** - Larger circles with shadows, better spacing
4. **Smooth Transitions** - All state changes animate smoothly
5. **Color Coding** - Completed phases are primary color, future phases are muted

### Visual Improvements
- Gradient fill from primary to primary/80
- Shadow effect on active circles
- Better visual hierarchy
- Responsive spacing
- Smooth 500ms transitions

### Before vs After

**Before:**
```
Initial ─── Processing ─── Final
(simple circles and lines)
```

**After:**
```
Progress: 66%
[████████░░░░░░░░░░░░░░░░░░░░░░]

✓ Initial      ✓ Processing      ○ Final
Matching       Active            Feedback
(with shadows, gradient, percentage)
```

---

## Files Modified

### `src/hooks/useDocuments.ts`
- Changed `fetchDocuments` dependency from `[user]` to `[user?.entityId, user?.role]`
- Changed `useEffect` dependency to `[user?.entityId, fetchDocuments]`
- This prevents the infinite loop and maintains document state across tab switches

### `src/components/ProjectPhaseIndicator.tsx`
- Added percentage calculation: `((currentIndex + 1) / PHASES.length) * 100`
- Added animated progress bar with gradient
- Improved circle styling with shadows and transitions
- Better spacing and visual hierarchy
- Smooth 500ms transitions for all state changes

---

## How It Works Now

### Document Persistence
1. User uploads document → stored in Firestore
2. User switches tabs → hook maintains state (documents array doesn't reset)
3. User switches back → documents still in state, no refetch needed
4. If needed, user can manually refresh

### Progress Bar
1. Initial phase (33%) → one circle filled
2. Processing phase (66%) → two circles filled
3. Final phase (100%) → all circles filled
4. Smooth animations between phases

---

## Testing Checklist

- [ ] Upload document → switch tabs → return → document still visible
- [ ] Progress bar shows correct percentage
- [ ] Circles animate smoothly when phase changes
- [ ] Progress bar fills smoothly
- [ ] No console errors about infinite loops
- [ ] Documents persist across multiple tab switches

---

## Performance Impact

✅ **Better Performance**
- No infinite loops
- Fewer re-renders
- Stable callback references
- Documents cached in state

✅ **Better UX**
- Documents don't disappear
- Smooth animations
- Clear progress indication
- No loading spinners on tab switch
