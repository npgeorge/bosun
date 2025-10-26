# Ship's Wheel Hero Image Guide

## Overview
The landing page now has a ship's wheel logo and a hero section with a background image of a ship's wheel in black and white.

## Adding Your Ship's Wheel Image

### Option 1: Unsplash (Recommended - Free, High Quality)

1. Visit [Unsplash](https://unsplash.com)
2. Search for: "ship wheel" or "boat wheel" or "helm"
3. Recommended searches for best results:
   - "vintage ship wheel"
   - "ship helm black and white"
   - "maritime wheel"
   - "nautical wheel"

#### Top Recommended Images:
- Photo by Alonso Reyes: https://unsplash.com/photos/black-and-white-ship-wheel-oU5R1GW_8Mc
- Photo by Caleb George: https://unsplash.com/photos/brown-wooden-ships-wheel-HAvW4OdVX6w
- Search: https://unsplash.com/s/photos/ship-wheel

### Option 2: Pexels (Free Alternative)

1. Visit [Pexels](https://pexels.com)
2. Search for: "ship wheel" or "boat steering wheel"

### Option 3: Custom Photography

If you want a unique image:
- Hire a photographer to capture a ship's wheel
- Ensure high resolution (minimum 1920x1080)
- Black and white or easily convertible to grayscale

## Installation Steps

### Step 1: Download Your Image

1. Download a high-resolution ship's wheel image
2. Recommended minimum resolution: 1920x1080px
3. Format: JPG or PNG

### Step 2: Add to Your Project

1. Rename the image to `ship-wheel.jpg`
2. Place it in the `/public` folder of your project:
   ```
   bosun-platform/
   ├── public/
   │   └── ship-wheel.jpg  <-- Place your image here
   ├── src/
   └── ...
   ```

### Step 3: Test

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. The hero section should now show your ship's wheel image with:
   - Grayscale filter applied
   - Darkened for text readability
   - White text overlay

## Image Specifications

### Ideal Image Characteristics:
- **Resolution**: 1920x1080 or higher
- **Orientation**: Landscape
- **Subject**: Ship's wheel, preferably centered
- **Style**: Wooden, vintage, or modern helm
- **Composition**: Close-up or medium shot works best

### What Works Well:
✅ Vintage wooden ship wheels
✅ Maritime helms with good detail
✅ Images with good contrast
✅ Centered or slightly off-center composition

### What to Avoid:
❌ Low resolution images (will look pixelated)
❌ Busy backgrounds (text will be hard to read)
❌ Very bright images (even with filters)
❌ Images with too much text or watermarks

## Customization

### Adjust Image Filters

The image styling is applied in `src/app/page.tsx` around line 215-220:

```tsx
style={{
  backgroundImage: 'url(/ship-wheel.jpg)',
  filter: 'grayscale(100%) brightness(0.4)'
}}
```

**Adjust brightness** (0.0 = black, 1.0 = original):
```tsx
filter: 'grayscale(100%) brightness(0.5)'  // Lighter
filter: 'grayscale(100%) brightness(0.3)'  // Darker
```

**Remove grayscale** (use color):
```tsx
filter: 'brightness(0.4)'  // Color image, darkened
```

**Adjust blur** (add depth):
```tsx
filter: 'grayscale(100%) brightness(0.4) blur(2px)'
```

### Adjust Overlay Darkness

Around line 223, adjust the overlay opacity:

```tsx
<div className="absolute inset-0 bg-black bg-opacity-40" />
```

Change opacity values:
- `bg-opacity-30` - Lighter overlay
- `bg-opacity-50` - Darker overlay
- `bg-opacity-60` - Much darker overlay

## Recommended Free Images

Here are some specific images that would work great (all free to use):

1. **Alonso Reyes - Vintage Ship Wheel**
   - URL: https://unsplash.com/photos/oU5R1GW_8Mc
   - Perfect grayscale aesthetic
   - High contrast
   - Centered composition

2. **Caleb George - Wooden Helm**
   - URL: https://unsplash.com/photos/HAvW4OdVX6w
   - Beautiful wooden texture
   - Good detail
   - Maritime authentic

3. **Search "nautical wheel" on Unsplash**
   - Multiple high-quality options
   - All free for commercial use
   - No attribution required (but appreciated)

## License Notes

### Unsplash License:
- ✅ Free to use
- ✅ Commercial use allowed
- ✅ No attribution required (but appreciated)
- ✅ Can modify

### Pexels License:
- ✅ Free to use
- ✅ Commercial use allowed
- ✅ No attribution required
- ✅ Can modify

Always check the specific license of the image you choose.

## Troubleshooting

### Image Not Showing?
1. Ensure the image is named exactly `ship-wheel.jpg`
2. Ensure it's in the `/public` folder (not `/public/images` or elsewhere)
3. Refresh the page with hard reload (Cmd/Ctrl + Shift + R)
4. Check browser console for errors

### Image Too Bright/Dark?
- Adjust the `brightness()` filter value
- Adjust the overlay `bg-opacity-XX` value

### Text Hard to Read?
- Increase overlay darkness: `bg-opacity-50` or higher
- Decrease brightness: `brightness(0.3)` or lower
- Consider a different image with better contrast

## Next Steps

Once your image is in place:
1. Test on different screen sizes
2. Check text readability
3. Ensure professional appearance
4. Consider A/B testing different images

The ship's wheel image reinforces the maritime branding and creates an immediate visual connection to the industry!
