# Simplified Exercise Selection

## Overview
Removed all image functionality and replaced the exercise library modal with a simple dropdown/select interface.

## What Was Removed
- ❌ Wger API integration (`wger-api.ts`)
- ❌ ExerciseDB API integration (`exercisedb-api.ts`)
- ❌ Exercise Library Modal (`exercise-library-modal.tsx`)
- ❌ Exercise image matching algorithm
- ❌ `imagemUrl` field from all data structures
- ❌ Image display in TrainingCard component
- ❌ All image-related documentation

## What Was Changed

### 1. Add Exercise Modal (`add-exercise-modal.tsx`)
**Before:** Modal with "Choose from Library" button that opened a separate modal with images
**After:** Simple dropdown/select at the top of the form

```tsx
<select
  value={selectedExerciseId}
  onChange={(e) => handleSelectExercise(e.target.value)}
>
  <option value="">-- Selecione um exercício --</option>
  {exerciseLibrary.map((exercise) => (
    <option key={exercise.id} value={exercise.id}>
      {exercise.nome} ({exercise.musculos.join(', ')})
    </option>
  ))}
</select>
```

### 2. Exercise Data Interfaces

**Removed `imagemUrl` from:**
- `Exercise` interface in `exercise-library.ts`
- `Exercicio` interface in `get-workout-exercises.ts`
- `addExercise` function parameters in `add-exercise.ts`
- `TrainingCardProps` in `training-card.tsx`

### 3. Auto-Fill Behavior

When an exercise is selected from the dropdown:
- ✅ Exercise name is filled automatically
- ✅ Default sets/reps are set based on difficulty:
  - **Iniciante:** 3 sets × 12 reps
  - **Intermediário:** 4 sets × 10 reps
  - **Avançado:** 4 sets × 8 reps
- ✅ Default rest time: 01:30 (90 seconds)
- ✅ User can still modify all values manually

## User Experience

### Before
1. Click "Adicionar Exercício"
2. Click "Escolher da Biblioteca"
3. Browse through modal with images
4. Click an exercise
5. Form auto-fills

### After
1. Click "Adicionar Exercício"
2. Select exercise from dropdown (shows name + muscle groups)
3. Form auto-fills immediately
4. Can still fill manually if preferred

## Benefits
- ✅ **Simpler:** No external API dependencies
- ✅ **Faster:** No API calls, no image loading
- ✅ **Cleaner:** Less code to maintain
- ✅ **Better UX:** Dropdown is more familiar and faster to use
- ✅ **Reliable:** No image matching issues

## Files That Can Be Deleted
- `src/data/wger-api.ts`
- `src/data/exercisedb-api.ts`
- `src/data/exercise-name-mapping.ts`
- `src/components/exercise-library-modal.tsx`
- `docs/IMAGE_GUIDE.md`
- `docs/WGER_API.md`

## Future Enhancements (Optional)
- Add search/filter to the dropdown
- Group exercises by muscle group in dropdown
- Add tooltips with exercise instructions on hover
