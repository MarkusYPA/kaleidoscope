
## High-level goal (to anchor decisions)

* One **hidden square simulation** with tumbling colorful shapes (Matter.js)
* That square is **sampled, clipped to a triangle**
* The triangle is **mirrored + rotated** to fill the screen like a kaleidoscope
* Physics and visuals are **decoupled**

---

## Step-by-step implementation plan

### **Step 1 — Project setup (keep it boring & flexible)**

* Plain HTML + JS to start (no framework yet)
* One `<canvas>` element that fills the screen
* Import:

  * `matter.js`
* Use ES modules if you can (future-you will thank you)

**Why:** fewer moving parts while you’re experimenting.

---

### **Step 2 — Create the physics “texture” canvas**

* Create an **offscreen canvas** (or hidden one)

  * Square: e.g. `512 × 512` or `1024 × 1024`
* This canvas is *never* shown directly
* All physics rendering goes here

**Key idea:**
This canvas is your kaleidoscope *source texture*.

---

### **Step 3 — Initialize Matter.js**

* Create:

  * `Engine`
  * `World`
  * `Runner`
* Disable gravity or keep it light (experiment later)
* Add **four static walls** forming a square boundary

**Important choices**

* Use **Matter.Render** *only* to draw onto your offscreen canvas
  OR
* Skip Matter’s renderer and draw bodies yourself (recommended long-term)

👉 I’d start with Matter’s renderer just to get movement quickly.

---

### **Step 4 — Add tumbling bodies**

* Spawn a small number of bodies (5–20 max)
* Mix:

  * Polygons (triangles, hexes)
  * Circles
* Randomize:

  * Size
  * Initial rotation
  * Angular velocity
  * Color

**Physics tuning**

* High restitution (bouncy)
* Low friction
* Slight air resistance

This is where the “alive” feeling comes from.

---

### **Step 5 — Switch to custom rendering (important pivot)**

Once things move nicely:

* Stop using `Matter.Render`
* On every animation frame:

  * Clear the offscreen canvas
  * Loop through `engine.world.bodies`
  * Draw shapes manually using:

    * `ctx.save()`
    * `ctx.translate(body.position)`
    * `ctx.rotate(body.angle)`
    * `ctx.restore()`

**Why this matters**

* Full control over:

  * Color gradients
  * Stroke styles
  * Glow / blur
  * Trails / alpha fade
* Matter becomes *pure motion logic*

---

### **Step 6 — Build the triangle mask**

* Decide on triangle shape:

  * Equilateral triangle is classic kaleidoscope
* Create a **triangle clipping path** on the main canvas:

  ```js
  ctx.beginPath()
  ctx.moveTo(...)
  ctx.lineTo(...)
  ctx.lineTo(...)
  ctx.closePath()
  ctx.clip()
  ```
* Draw the offscreen canvas into that clipped region

You now have **one triangle view** into your physics world.

---

### **Step 7 — Mirror the triangle**

* Wrap triangle drawing in a function:

  ```js
  drawTriangle(x, y, rotation, mirror)
  ```
* Use:

  * `ctx.translate`
  * `ctx.rotate`
  * `ctx.scale(-1, 1)` for mirroring
* Draw the same triangle multiple times around a center point

**Classic kaleidoscope pattern**

* 6, 8, or 12 slices
* Alternate mirrored / non-mirrored slices

---

### **Step 8 — Tile across the screen**

Two good approaches:

**Option A — Radial kaleidoscope**

* One center
* Rotate triangles around it

**Option B — Tiled kaleidoscope (wilder)**

* Repeat kaleidoscope units in a grid
* Each tile samples the *same* physics canvas

Your description sounds closer to **Option A**, but either works.

---

### **Step 9 — Resize handling**

* On window resize:

  * Resize main canvas
  * Recalculate triangle geometry
* Keep physics canvas size fixed
  (this avoids reinitializing Matter.js)

---

### **Step 10 — Visual polish pass**

Now the fun stuff ✨

Ideas:

* Fade trails (draw a translucent rect each frame instead of clearing)
* Slowly rotate the entire kaleidoscope
* Color cycling (HSV rotation)
* Subtle zoom in/out
* Occasional body spawn / removal

---

### **Step 11 — Performance sanity check**

* Cap body count
* Avoid per-pixel operations
* Reuse paths where possible
* Test on a phone early (trust me)

---

## Mental model to keep you sane

Think in **layers**:

1. **Physics layer**
   Matter.js → positions & angles only

2. **Texture layer**
   Offscreen canvas → abstract moving painting

3. **Optics layer**
   Triangles, mirroring, rotation → kaleidoscope illusion

Never mix responsibilities between them.

---

## If you want next

We can:

* Sketch exact triangle math (angles & mirroring rules)
* Write a *minimal* starter scaffold
* Design a really nice color system (this matters a lot visually)

Just tell me where you want to zoom in 🔍✨
