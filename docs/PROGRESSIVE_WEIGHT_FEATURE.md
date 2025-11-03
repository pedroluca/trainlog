# Progressive Weight Feature - Implementation Guide

## Overview
The progressive weight feature allows users to automatically or manually increase the weight they lift as they progress. This is optional and configurable per user.

## Implementation Strategy

### 1. User Settings
Add a setting in the user profile to enable/disable progressive weight:

```typescript
// In usuarios collection
{
  progressiveWeightEnabled: boolean,
  progressiveWeightIncrement: number // e.g., 2.5 kg
}
```

### 2. How Progressive Weight Works

#### Option A: Automatic Progression (Recommended)
When a user completes ALL sets of an exercise successfully, the system automatically suggests a weight increase for the next workout.

**Logic:**
- User completes exercise (all sets done)
- If `progressiveWeightEnabled === true`:
  - Save current weight as `lastCompletedWeight`
  - Suggest: `newWeight = lastCompletedWeight + progressiveWeightIncrement`
  - Show notification: "Parabéns! Na próxima vez, tente {newWeight}kg"
  - Update exercise with `suggestedWeight` field

#### Option B: Manual Progression
User manually increases weight when they feel ready.

### 3. Database Structure

Update exercise schema:
```typescript
interface Exercicio {
  id: string
  titulo: string
  series: number
  repeticoes: number
  peso: number // current weight
  tempoIntervalo: number
  isFeito: boolean
  lastDoneDate?: string
  nota?: string
  
  // Progressive weight fields
  lastCompletedWeight?: number
  suggestedWeight?: number
  weightHistory?: Array<{
    date: string
    weight: number
    completed: boolean
  }>
}
```

### 4. UI Changes

#### In Settings Page:
```tsx
<div>
  <label>
    <input
      type="checkbox"
      checked={progressiveWeightEnabled}
      onChange={(e) => updateUserSetting('progressiveWeightEnabled', e.target.checked)}
    />
    Ativar Peso Progressivo
  </label>
  
  {progressiveWeightEnabled && (
    <div>
      <label>Incremento de Peso (kg):</label>
      <input
        type="number"
        step="0.5"
        value={progressiveWeightIncrement}
        onChange={(e) => updateUserSetting('progressiveWeightIncrement', Number(e.target.value))}
      />
    </div>
  )}
</div>
```

#### In Training Card:
When exercise is completed, show suggestion:
```tsx
{suggestedWeight && suggestedWeight > peso && (
  <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900 rounded">
    <p className="text-sm">
      💪 Sugestão: Na próxima vez, tente {suggestedWeight}kg
    </p>
    <button onClick={() => applyWeight(suggestedWeight)}>
      Aplicar agora
    </button>
  </div>
)}
```

### 5. Implementation Steps

#### Step 1: Add User Settings
```typescript
// In settings.tsx or profile.tsx
const [progressiveWeightEnabled, setProgressiveWeightEnabled] = useState(false)
const [progressiveWeightIncrement, setProgressiveWeightIncrement] = useState(2.5)

// Fetch from Firestore
useEffect(() => {
  const fetchSettings = async () => {
    const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
    if (userDoc.exists()) {
      const data = userDoc.data()
      setProgressiveWeightEnabled(data.progressiveWeightEnabled || false)
      setProgressiveWeightIncrement(data.progressiveWeightIncrement || 2.5)
    }
  }
  fetchSettings()
}, [usuarioID])

// Update setting
const updateSetting = async (field: string, value: any) => {
  await updateDoc(doc(db, 'usuarios', usuarioID), { [field]: value })
}
```

#### Step 2: Calculate Suggested Weight on Completion
```typescript
// In training-card.tsx, modify handleFinishSet
const handleFinishSet = useCallback(async () => {
  try {
    // ... existing code ...
    
    // Check if progressive weight is enabled
    const userDoc = await getDoc(doc(db, 'usuarios', usuarioID))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      
      if (userData.progressiveWeightEnabled) {
        const increment = userData.progressiveWeightIncrement || 2.5
        const suggestedWeight = weight + increment
        
        // Update exercise with suggestion
        const exerciseRef = doc(db, 'treinos', workoutId, 'exercicios', id)
        await updateDoc(exerciseRef, {
          lastCompletedWeight: weight,
          suggestedWeight: suggestedWeight
        })
        
        // Show toast
        setToast({
          show: true,
          message: `Parabéns! Tente ${suggestedWeight}kg na próxima vez.`,
          type: 'success'
        })
      }
    }
  } catch (err) {
    console.error('Error:', err)
  }
}, [workoutId, id, weight, usuarioID])
```

#### Step 3: Display Weight Suggestion
In the training card, show the suggestion when exercise is not started yet:

```tsx
{!isBreakTime && !isFinished && suggestedWeight && suggestedWeight > weight && (
  <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
    <p className="text-sm text-blue-800 dark:text-blue-200">
      💪 <strong>Sugestão:</strong> Tente {suggestedWeight}kg hoje!
    </p>
    <button
      onClick={async () => {
        await updateDoc(doc(db, 'treinos', workoutId, 'exercicios', id), {
          peso: suggestedWeight,
          suggestedWeight: null
        })
        onEdit()
      }}
      className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
    >
      Aplicar
    </button>
  </div>
)}
```

### 6. Alternative: Smart Progressive Weight

Instead of fixed increment, use smart logic:
- If user completes all sets easily → suggest +5kg
- If user completes all sets with effort → suggest +2.5kg
- Track performance over time

### 7. Weight History Tracking

Add ability to see weight progression over time:
```typescript
// When exercise is completed
weightHistory: [
  ...existingHistory,
  {
    date: new Date().toISOString(),
    weight: currentWeight,
    completed: true,
    sets: completedSets,
    reps: completedReps
  }
]
```

Then create a chart/graph to show progress.

## Summary

**Pros of Progressive Weight:**
- Helps users progressively overload
- Tracks progress automatically
- Motivates users to lift heavier

**Cons:**
- Not everyone trains this way (some do deload weeks)
- Might pressure beginners

**Solution:** Make it OPTIONAL with clear settings to enable/disable.

## Recommended Approach

1. Start with simple on/off toggle in settings
2. Default increment of 2.5kg (common gym plate)
3. Show suggestion after completing all sets
4. Let user accept or ignore suggestion
5. Track weight history for progress visualization

This way, users who want progressive overload can use it, and those who don't can ignore it completely.
