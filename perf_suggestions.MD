Additional suggestions to reduce lag (not yet applied):
Lazy-load slide images (loading="lazy") and consider serving smaller/webp versions for the corridor and background layers.
If ScrollTrigger isn’t used, drop its import and the update call entirely.
Pause/skip the render loop when the tab is hidden (Page Visibility) to save work.
Limit per-frame slide work further by shrinking the visible range (e.g., stop updating slides beyond, say, 1200px instead of 2000px) or precomputing static values outside the loop.