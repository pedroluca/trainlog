# 🖼️ Exercise Images - Complete Guide

## Overview
TrainLog displays exercise images throughout the app to enhance the visual experience and help users perform exercises correctly.

## 🎨 Where Images Appear

### 1. **Exercise Library Modal** 📚
- **Location**: When adding a new exercise → Click "Escolher da Biblioteca"
- **Display**: Thumbnail images in a responsive grid (2 columns on desktop)
- **Features**:
  - Full-width image at top of each card
  - Hover effect: Image scales up slightly
  - Lazy loading for performance

### 2. **Training Cards** 🏋️
- **Location**: Main training page when doing workouts
- **Display**: Full-width banner image at top of card
- **Features**:
  - Image takes full card width (minus padding)
  - 192px height (h-48)
  - Responsive: looks great on mobile and desktop
  - Image persists whether exercise is completed or not

### 3. **Workout Profile/History** (Coming Soon)
- Small thumbnail images next to exercise names
- Quick visual reference in workout lists

## 🔄 Image Flow

### Step 1: User Selects from Library
```
User clicks "Escolher da Biblioteca"
  ↓
Exercise Library Modal opens
  ↓
API fetches images for first 20 exercises
  ↓
Images cached in component state
```

### Step 2: Image Gets Saved
```
User selects exercise (e.g., "Supino Reto")
  ↓
Exercise data includes imagemUrl
  ↓
Data saved to Firestore: treinos/{workoutId}/exercicios/{exerciseId}
  ↓
{
  titulo: "Supino Reto",
  series: 4,
  repeticoes: 10,
  peso: 60,
  tempoIntervalo: 90,
  imagemUrl: "https://v2.exercisedb.io/image/..." ← Saved!
}
```

### Step 3: Image Gets Displayed
```
User goes to training page
  ↓
Exercises loaded from Firestore
  ↓
Each exercise includes imagemUrl
  ↓
TrainingCard component receives imagemUrl prop
  ↓
Image displayed at top of card
```

## 🛠️ Technical Implementation

### Data Structure
```typescript
// Exercise interface
interface Exercicio {
  id: string
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number
  isFeito: boolean
  imagemUrl?: string  // ← Image URL stored here
}
```

### Component Props
```typescript
// TrainingCard props
<TrainingCard
  id="exercise-123"
  workoutId="workout-456"
  title="Supino Reto"
  sets={4}
  reps={10}
  weight={60}
  breakTime={90}
  isFeito={false}
  imagemUrl="https://v2.exercisedb.io/image/..." // ← Passed as prop
  onEdit={() => {}}
  onComplete={() => {}}
/>
```

### Image Rendering
```tsx
// In TrainingCard component
{imagemUrl && (
  <div className="w-full h-48 mb-4 -mx-6 -mt-6 overflow-hidden bg-gray-100">
    <img 
      src={imagemUrl} 
      alt={title}
      className="w-full h-full object-cover"
    />
  </div>
)}
```

## 🎯 Image Sources

### 1. **ExerciseDB API** (Primary)
- **URL Pattern**: `https://v2.exercisedb.io/image/{exercise_id}.gif`
- **Format**: Animated GIFs
- **Quality**: High-quality demonstrations
- **Free Tier**: 10,000 requests/month

### 2. **Placeholder Images** (Fallback)
- **URL Pattern**: `https://via.placeholder.com/150/{color}/{text_color}?text={muscle_group}`
- **Colors by Muscle Group**:
  - Peito: `#27AE60` (Green)
  - Costas: `#3498DB` (Blue)
  - Ombros: `#E74C3C` (Red)
  - Bíceps: `#F39C12` (Orange)
  - Tríceps: `#9B59B6` (Purple)
  - Pernas: `#1ABC9C` (Teal)
  - Abdômen: `#E67E22` (Dark Orange)

### 3. **Custom Upload** (Future)
- Users will be able to upload their own images
- Stored in Firebase Storage or Cloudinary
- Linked to exercises via URL

## 🚀 Performance Optimizations

### 1. **Lazy Loading**
```tsx
<img 
  src={imagemUrl} 
  alt={title}
  loading="lazy" // ← Loads only when visible
/>
```

### 2. **Caching Strategy**
- **Memory Cache**: Images cached in component state during library browse
- **Firestore Cache**: Image URLs saved permanently with exercise data
- **Browser Cache**: Browser caches actual image files

### 3. **Batch Loading**
```typescript
// Only load first 20 exercises at a time
const exercisesToFetch = filteredExercises.slice(0, 20)
```

### 4. **Fallback System**
```typescript
// Try API first, use placeholder if fails
const imageUrl = await searchExerciseImages(exercise.nome)
newImages[exercise.id] = imageUrl || getPlaceholderImage(exercise.musculos[0])
```

## 🎨 Styling Details

### Exercise Library Modal
```css
/* Image container */
.w-full.h-32.bg-gray-100 {
  width: 100%;
  height: 8rem;  /* 128px */
  background: #F3F4F6;
}

/* Image */
.object-cover.group-hover:scale-105 {
  object-fit: cover;
  transition: transform 0.3s;
}
```

### Training Card
```css
/* Image container */
.w-full.h-48.mb-4.-mx-6.-mt-6 {
  width: 100%;
  height: 12rem;  /* 192px */
  margin-bottom: 1rem;
  margin-left: -1.5rem;  /* Negative margin to reach card edge */
  margin-right: -1.5rem;
  margin-top: -1.5rem;
}
```

## 🔧 Customization

### Change Image Size
```tsx
// Exercise Library Modal
<div className="w-full h-32 ...">  // Change h-32 to h-40, h-48, etc.

// Training Card
<div className="w-full h-48 ...">  // Change h-48 to h-56, h-64, etc.
```

### Change Image Position
```tsx
// Move image to bottom of card
{imagemUrl && (
  <div className="w-full h-48 mt-auto -mx-6 -mb-6">
    ...
  </div>
)}
```

### Add Image Border/Shadow
```tsx
<img 
  src={imagemUrl} 
  alt={title}
  className="w-full h-full object-cover rounded-t-lg shadow-lg"
/>
```

## 📊 Image States

| State | Display | Example |
|-------|---------|---------|
| **With API + Key** | ExerciseDB GIF | ![Animated exercise demo] |
| **No API Key** | Colored placeholder | [Green box with "Peito"] |
| **API Failed** | Colored placeholder | [Blue box with "Costas"] |
| **No Image URL** | No image shown | Text-only card |
| **Loading** | Gray background | Empty box while fetching |

## 🐛 Troubleshooting

### Images Not Showing?

1. **Check API Key**
   ```bash
   # Verify .env file
   cat .env | grep EXERCISEDB
   ```

2. **Check Firestore Data**
   ```typescript
   // Log exercise data in console
   console.log('Exercise:', exercise)
   // Should include imagemUrl field
   ```

3. **Check Network Tab**
   - Open DevTools → Network tab
   - Look for requests to `exercisedb.io`
   - Check for CORS errors or 401/403 status codes

4. **Check Console**
   ```typescript
   // Look for error messages
   console.error('Error fetching exercise image:', error)
   ```

### Images Loading Slowly?

1. **Reduce Batch Size**
   ```typescript
   // Change from 20 to 10
   const exercisesToFetch = filteredExercises.slice(0, 10)
   ```

2. **Add Loading Indicator**
   ```tsx
   {loadingImages && <Spinner />}
   ```

3. **Optimize Image Format**
   - ExerciseDB GIFs are optimized, but you can add compression
   - Consider lazy loading library like `react-lazy-load-image-component`

## 🎯 Best Practices

1. **Always Provide Alt Text**
   ```tsx
   <img src={imagemUrl} alt={title} />
   ```

2. **Use Fallback Images**
   ```tsx
   imagemUrl || getPlaceholderImage(musculoGrupo)
   ```

3. **Handle Loading States**
   ```tsx
   {loadingImages ? <Skeleton /> : <img src={imagemUrl} />}
   ```

4. **Optimize for Mobile**
   ```tsx
   // Use responsive image sizes
   <img 
     srcSet="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
     sizes="(max-width: 600px) 480px, 800px"
   />
   ```

## 🚀 Future Enhancements

- [ ] Add video tutorials alongside GIFs
- [ ] Allow users to upload custom images
- [ ] Implement image compression
- [ ] Add image carousel for multiple angles
- [ ] Add zoom on click functionality
- [ ] Implement Progressive Web App (PWA) caching
- [ ] Add exercise comparison (side-by-side images)

---

**Questions?** Open an issue on GitHub or check the [ExerciseDB API docs](./EXERCISEDB_API.md).
