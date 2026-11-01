# Photos: current images and optional upgrades

The site keeps all of its original photographs (Unsplash stock images of hair models).
They are presented as hair inspiration ("Looks We Love"), not as Reilly's own client work.

When Reilly has her own photos (with permission from her and the client pictured), swap them in
by changing the `image` URLs in `src/data/salon.ts`. Local files go in `public/images/` and are
referenced as `/images/your-file.jpg`.

| Where | Data field in `src/data/salon.ts` | Current image |
|---|---|---|
| Hero carousel | `GALLERY_DATA` items `gal-11`, `gal-13`, `gal-4` (via `BRAND_DATA.hero.showcase`) | Stock |
| Signature section | `BRAND_DATA.artistry.image` | Stock |
| Gallery (9 looks) | `GALLERY_DATA[].image` | Stock |
| Service cards (6) | `SERVICE_CATEGORIES[].image` | Stock |
| Editorial feature | `BRAND_DATA.editorialFeature.image` | Stock |
| Meet Reilly | `BRAND_DATA.about.image` | Stock hair photo, not a portrait. A portrait of Reilly would fit here. |
| Visit the salon | `BRAND_DATA.studio.image` | Stock salon interior, not Salon Boheme |
| Booking section | `BRAND_DATA.finalFeature.image` | Stock |

If you replace a gallery photo with Reilly's work, also update its `title`, `caption`,
`tonalProfile` and `technique` so they describe the new photo.
