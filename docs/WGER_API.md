# 🏋️ Wger Exercise API Integration

## Overview
TrainLog uses the **Wger Exercise API** - a completely **FREE, open-source** API that provides exercise data with real images and videos!

## ✅ Features

- **100% FREE** - No API key required
- **Real exercise images** - Actual photos of exercises
- **Videos included** - Many exercises have video demonstrations
- **1000+ exercises** - Comprehensive exercise database
- **Open source** - Community-driven and maintained
- **No rate limits** - Use as much as you need
- **Multiple languages** - Supports English, German, Spanish, and more

## 🔗 Resources

- **API Documentation**: https://wger.de/en/software/api
- **GitHub Repository**: https://github.com/wger-project/wger
- **Official Website**: https://wger.de
- **API Base URL**: `https://wger.de/api/v2`

## 🎯 How It Works in TrainLog

### 1. **Exercise Library Modal**
When you open the exercise library:
- App fetches exercises by muscle group from Wger API
- Displays exercise images (or placeholders if unavailable)
- Shows exercise details: name, muscle groups, equipment, instructions

### 2. **Image Fetching**
```typescript
// Fetch exercises by muscle group
GET https://wger.de/api/v2/exercise/?category={categoryId}&language=2&limit=50

// Fetch exercise details with images
GET https://wger.de/api/v2/exercisebaseinfo/{exerciseId}/
```

### 3. **Data Structure**
```typescript
interface WgerExercise {
  id: number
  name: string
  description: string
  category: number
  muscles: number[]
  equipment: number[]
  images: Array<{
    id: number
    image: string  // Full image URL
    is_main: boolean
  }>
  videos: Array<{
    id: number
    video: string  // Full video URL
    is_main: boolean
  }>
}
```

## 🎨 Muscle Group Mapping

The app maps Portuguese muscle groups to Wger categories:

| Portuguese | Wger Category ID | English |
|------------|------------------|---------|
| Peito | 11 | Chest |
| Costas | 12 | Back |
| Ombros | 13 | Shoulders |
| Bíceps | 8 | Arms |
| Tríceps | 8 | Arms |
| Pernas | 9 | Legs |
| Abdômen | 10 | Abs |
| Panturrilha | 14 | Calves |

## 📊 API Endpoints Used

### 1. **List Exercises by Category**
```
GET /api/v2/exercise/?category={id}&language=2&limit=50
```

**Parameters:**
- `category` - Muscle group category ID
- `language` - 2 for English
- `limit` - Number of results (default: 50)

### 2. **Get Exercise Details**
```
GET /api/v2/exercisebaseinfo/{id}/
```

**Returns:** Complete exercise data including images and videos

## 🛠️ Implementation Details

### File Structure
```
src/data/
├── wger-api.ts          # Wger API integration
├── exercisedb-api.ts    # Placeholder images only
└── exercise-library.ts  # Local exercise database
```

### Key Functions

**`getExercisesByMuscleGroup(musculoGrupo: string)`**
- Fetches exercises for a specific muscle group
- Maps Portuguese to Wger category IDs
- Returns array of exercises with images

**`getExerciseImageUrl(exercise: WgerExercise)`**
- Extracts image URL from exercise data
- Prioritizes main image, falls back to first available
- Returns null if no image exists

**`getExerciseVideoUrl(exercise: WgerExercise)`**
- Extracts video URL from exercise data
- Prioritizes main video, falls back to first available
- Returns null if no video exists

## 🚀 Performance

### Optimization Strategies

1. **Batch Fetching** - Fetches 50 exercises at once
2. **Rate Limiting** - 250ms delay between requests to be respectful
3. **Caching** - Images stored in Firestore after first fetch
4. **Lazy Loading** - Only loads first 10 exercises initially
5. **Fallback System** - Uses colored placeholders if images fail

### API Response Time
- Exercise list: ~200-500ms
- Exercise details: ~100-300ms per exercise
- Images load progressively as data arrives

## 🎯 Advantages over Paid APIs

| Feature | Wger (FREE) | ExerciseDB (Paid) |
|---------|-------------|-------------------|
| Cost | FREE ✅ | $11.99/month |
| API Key | Not required ✅ | Required |
| Images | Yes ✅ | Paid tiers only |
| Videos | Yes ✅ | Paid tiers only |
| Rate Limits | Generous ✅ | 5 req/sec |
| Open Source | Yes ✅ | No |
| Community Support | Yes ✅ | Limited |

## 🐛 Troubleshooting

### No Images Showing?

1. **Check Console Logs**
   ```javascript
   🔍 Fetching Wger exercises for: "Peito" (category 11)
   ✅ Found X exercises from Wger
   ```

2. **Check Network Tab**
   - Look for requests to `wger.de`
   - Check response status (should be 200)

3. **Verify Fallback**
   - If Wger fails, should see colored placeholders
   - Check browser console for errors

### Slow Loading?

- Wger API is hosted in Europe, may be slower from other regions
- Images are high quality, may take time to load
- Consider reducing `limit` parameter (currently 50)

## 🌟 Future Enhancements

- [ ] Add exercise filtering by equipment
- [ ] Show exercise difficulty levels
- [ ] Display video previews in modal
- [ ] Allow users to favorite exercises
- [ ] Add exercise search by name in Wger
- [ ] Cache exercise data in localStorage
- [ ] Add multilingual exercise names

## 🤝 Contributing to Wger

Since Wger is open source, you can contribute:
- Add new exercises
- Upload better images
- Improve translations
- Report bugs

Visit: https://github.com/wger-project/wger

## 📝 License

Wger API is free to use under their open-source license. The exercise data and images are community-contributed and licensed accordingly.

TrainLog respects Wger's terms of service:
- ✅ Attribution provided in documentation
- ✅ Non-commercial use
- ✅ No redistribution of data
- ✅ Respectful API usage with rate limiting

---

**Questions?** Check the [Wger API documentation](https://wger.de/en/software/api) or [open an issue on GitHub](https://github.com/wger-project/wger/issues).
